import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const archiveArg = process.argv[2];
const outputArg = process.argv[3] ?? "src/data/ai-subscriptions.json";

if (!archiveArg) {
  console.error(
    "Usage: node scripts/generate-ai-subscriptions.mjs <private-archive-root> [output-json]",
  );
  process.exit(1);
}

const archiveRoot = resolve(archiveArg);
const outputPath = resolve(outputArg);
const asOf = "2026-08-26";

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const [header, ...body] = rows;
  return body.map((values) =>
    Object.fromEntries(header.map((key, index) => [key, values[index] ?? ""])),
  );
}

function readCsv(relativePath) {
  return parseCsv(readFileSync(resolve(archiveRoot, relativePath), "utf8"));
}

function amount(value) {
  const number = Number(String(value).replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(number)) throw new Error(`Invalid amount: ${value}`);
  return number;
}

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function normalizeGithubServicePeriod(value) {
  return /^\d{4}-\d{2}-\d{2}\/\d{4}-\d{2}-\d{2}$/.test(value)
    ? value.replace("/", " - ")
    : null;
}

function planKeyFor({ app, plan, product }) {
  const normalized = `${app} ${plan}`.toLowerCase();

  if (normalized.includes("adjustment")) return "chatgpt-pro-20x-adjustment";
  if (normalized.includes("pro 20x")) return "chatgpt-pro-20x";
  if (normalized.includes("chatgpt") && normalized.includes("plus")) return "chatgpt-plus";
  if (normalized.includes("claude") && normalized.includes("max")) return "claude-max-5x";
  if (normalized.includes("claude") && normalized.includes("pro")) return "claude-pro";
  if (normalized.includes("copilot") && normalized.includes("pro")) return "copilot-pro";
  if (normalized.includes("microsoft 365")) return "microsoft-365-family";
  if (app === "X") return "x-premium";
  if (product === "copilot") return "copilot-monthly";
  return "monthly";
}

function publicRecord({
  date,
  scope,
  product,
  app,
  plan,
  channel,
  currency,
  originalAmount,
  estimatedCny,
  servicePeriod = null,
  provisionalFx = false,
}) {
  return {
    date,
    scope,
    product,
    app,
    planKey: planKeyFor({ app, plan, product }),
    channel,
    currency,
    originalAmount: amount(originalAmount),
    estimatedCny: amount(estimatedCny),
    servicePeriod: servicePeriod || null,
    provisionalFx,
  };
}

const ledger = readFileSync(resolve(archiveRoot, "AI订阅费用总账.md"), "utf8");
const githubTable = ledger.slice(
  ledger.indexOf("## GitHub Copilot 付款时间线"),
  ledger.indexOf("## 订阅时间段与缺口"),
);
const githubCnyByDate = new Map();

for (const line of githubTable.split("\n")) {
  if (!/^\| 20\d{2}-\d{2}-\d{2} \|/.test(line)) continue;
  const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
  githubCnyByDate.set(cells[0], {
    plan: cells[2],
    estimatedCny: amount(cells[5]),
  });
}

const records = [];

for (const row of readCsv("evidence/github/manifest.csv")) {
  const ledgerRow = githubCnyByDate.get(row.billing_date);
  if (!ledgerRow) throw new Error(`Missing GitHub CNY row for ${row.billing_date}`);

  records.push(
    publicRecord({
      date: row.billing_date,
      scope: "core",
      product: "copilot",
      app: "GitHub Copilot",
      plan: ledgerRow.plan,
      channel: "github-direct",
      currency: "USD",
      originalAmount: row.ai_amount_usd,
      estimatedCny: ledgerRow.estimatedCny,
      servicePeriod: normalizeGithubServicePeriod(row.service_period),
    }),
  );
}

for (const row of readCsv("evidence/apple/account-turkey/manifest.csv")) {
  const isMixed = row.classification === "ai_bundled_mixed";
  records.push(
    publicRecord({
      date: row.purchase_date,
      scope: isMixed ? "mixed" : "core",
      product: isMixed ? "mixed" : "chatgpt",
      app: row.app,
      plan: row.plan,
      channel: "apple-turkey",
      currency: row.currency,
      originalAmount: row.amount,
      estimatedCny: row.estimated_cny,
      servicePeriod: row.service_period,
    }),
  );
}

for (const row of readCsv("evidence/apple/account-nigeria/manifest.csv")) {
  const product = row.app === "Claude" ? "claude" : "copilot";
  records.push(
    publicRecord({
      date: row.purchase_date,
      scope: "core",
      product,
      app: row.app,
      plan: row.plan,
      channel: "apple-nigeria",
      currency: row.currency,
      originalAmount: row.amount,
      estimatedCny: row.estimated_cny,
      servicePeriod: row.service_period,
    }),
  );
}

for (const row of readCsv("evidence/openai-direct/manifest.csv")) {
  records.push(
    publicRecord({
      date: row.payment_date,
      scope: "core",
      product: "chatgpt",
      app: row.app,
      plan: row.plan,
      channel: "openai-direct",
      currency: row.currency,
      originalAmount: row.amount,
      estimatedCny: row.estimated_cny,
      servicePeriod: row.service_period,
    }),
  );
}

for (const row of readCsv("evidence/anthropic-direct/manifest.csv")) {
  records.push(
    publicRecord({
      date: row.payment_date,
      scope: "core",
      product: "claude",
      app: row.app,
      plan: row.plan,
      channel: "anthropic-direct",
      currency: row.currency,
      originalAmount: row.amount,
      estimatedCny: row.estimated_cny,
      servicePeriod: row.service_period,
      provisionalFx: row.fx_rate_status.startsWith("provisional"),
    }),
  );
}

records.sort((a, b) => a.date.localeCompare(b.date) || a.app.localeCompare(b.app));

const selectors = [
  ["chatgpt", "chatgpt-pro-20x", "openai-direct", "through"],
  ["chatgpt", "chatgpt-plus", "apple-turkey", "renews"],
  ["claude", "claude-max-5x", "anthropic-direct", "through"],
  ["copilot", "copilot-pro", "apple-nigeria", "renews"],
];

function serviceEnd(servicePeriod) {
  if (!servicePeriod) return null;
  const candidate = servicePeriod.startsWith("Renews ")
    ? servicePeriod.slice("Renews ".length)
    : servicePeriod.split(" - ").at(-1);
  const parsed = new Date(`${candidate} UTC`);
  if (Number.isNaN(parsed.valueOf())) return null;
  return parsed.toISOString().slice(0, 10);
}

const currentSubscriptions = selectors.map(([product, planKey, channel, statusType]) => {
  const matching = records
    .filter(
      (record) =>
        record.product === product &&
        record.planKey === planKey &&
        record.channel === channel,
    )
    .at(-1);

  if (!matching) throw new Error(`Missing current subscription ${planKey}`);
  return {
    product,
    app: matching.app,
    planKey,
    channel,
    currency: matching.currency,
    originalAmount: matching.originalAmount,
    estimatedCny: matching.estimatedCny,
    statusType,
    statusDate: serviceEnd(matching.servicePeriod),
    provisionalFx: matching.provisionalFx,
  };
});

const coverageSpans = [
  { product: "copilot", planKey: "copilot-monthly", channel: "github-direct", start: "2022-08-22", end: "2022-12-25" },
  { product: "copilot", planKey: "copilot-monthly", channel: "github-direct", start: "2024-05-17", end: "2025-09-25" },
  { product: "copilot", planKey: "copilot-pro", channel: "github-direct", start: "2025-10-19", end: "2025-12-25" },
  { product: "copilot", planKey: "copilot-pro", channel: "apple-nigeria", start: "2025-12-29", end: "2026-08-29", current: true },
  { product: "chatgpt", planKey: "chatgpt-plus", channel: "apple-turkey", start: "2024-08-27", end: "2026-08-28", current: true },
  { product: "chatgpt", planKey: "chatgpt-pro-20x", channel: "openai-direct", start: "2026-06-11", end: "2026-09-11", current: true },
  { product: "claude", planKey: "claude-pro", channel: "apple-nigeria", start: "2025-09-29", end: "2026-02-28" },
  { product: "claude", planKey: "claude-pro", channel: "apple-nigeria", start: "2026-03-18", end: "2026-04-18" },
  { product: "claude", planKey: "claude-max-5x", channel: "apple-nigeria", start: "2026-04-02", end: "2026-05-02" },
  { product: "claude", planKey: "claude-max-5x", channel: "apple-nigeria", start: "2026-05-10", end: "2026-06-10" },
  { product: "claude", planKey: "claude-max-5x", channel: "anthropic-direct", start: "2026-07-25", end: "2026-09-25", current: true },
];

const coreRecords = records.filter((record) => record.scope === "core");
const sumCny = (items) => round2(items.reduce((sum, item) => sum + item.estimatedCny, 0));
const coreCny = sumCny(coreRecords);
const wideCny = sumCny(records);
const currentCny = sumCny(currentSubscriptions);

const expectedCore = ledger.match(/\*\*核心 AI 小计\*\*.*?\*\*¥([\d,.]+)\*\*/)?.[1];
const expectedWide = ledger.match(/\*\*宽口径 AI 相关合计\*\*.*?\*\*¥([\d,.]+)\*\*/)?.[1];

if (coreRecords.length !== 71 || records.length !== 74) {
  throw new Error(`Unexpected record counts: core=${coreRecords.length}, wide=${records.length}`);
}
if (coreCny !== amount(expectedCore) || wideCny !== amount(expectedWide)) {
  throw new Error(
    `Ledger totals do not reconcile: core=${coreCny}/${expectedCore}, wide=${wideCny}/${expectedWide}`,
  );
}
if (currentCny !== 1766.3) {
  throw new Error(`Unexpected current recurring estimate: ${currentCny}`);
}

const snapshot = {
  schemaVersion: 1,
  asOf,
  integrity: {
    coreRecordCount: coreRecords.length,
    wideRecordCount: records.length,
    coreEstimatedCny: coreCny,
    wideEstimatedCny: wideCny,
    currentEstimatedCny: currentCny,
    hasProvisionalFx: records.some((record) => record.provisionalFx),
  },
  currentSubscriptions,
  coverageSpans,
  records,
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
console.log(
  `Generated ${outputPath}: ${coreRecords.length} core / ${records.length} wide records, ¥${coreCny.toFixed(2)} core total.`,
);
