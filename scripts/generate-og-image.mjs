// 生成 AI 订阅页的 OG 分享图(1200×630 @2x):标题 + 累计数字 + 最近 12 个月甘特图。
// 用法:node scripts/generate-og-image.mjs
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { tmpdir } from "node:os";

const root = resolve(import.meta.dirname, "..");
const snapshot = JSON.parse(readFileSync(resolve(root, "src/data/ai-subscriptions.json"), "utf8"));
const icons = JSON.parse(
    readFileSync(resolve(root, "node_modules/@iconify-json/simple-icons/icons.json"), "utf8"),
).icons;

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const today = new Date().toISOString().slice(0, 10);
const domainStart = (() => {
    const d = new Date(`${today}T00:00:00Z`);
    d.setUTCFullYear(d.getUTCFullYear() - 1);
    return d.getTime();
})();
const domainEnd = Date.parse(`${today}T00:00:00Z`) + 75 * 86400000;
const range = domainEnd - domainStart;
const pos = (date) => Math.max(0, Math.min(100, ((Date.parse(`${date}T00:00:00Z`) - domainStart) / range) * 100));

const lifetime = Math.round(snapshot.integrity.coreEstimatedCny);
const nowAt = pos(today);

const INK = {
    chatgpt: "#4269d0",
    claude: "#ff725c",
    copilot: "#a463f2",
    google: "#3ca951",
    kimi: "#efb118",
};

const iconSvg = (name, color) =>
    `<svg viewBox="0 0 24 24" style="width:20px;height:20px;color:${color}" xmlns="http://www.w3.org/2000/svg">${icons[name].body}</svg>`;
const googleG = `<svg viewBox="0 0 48 48" style="width:20px;height:20px"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>`;

const lanes = [
    { product: "chatgpt", name: "ChatGPT", plan: "Plus", icon: iconSvg("openai", "#1f2328"), match: (s) => s.planKey === "chatgpt-plus" },
    { product: "chatgpt", name: "ChatGPT", plan: "Pro 20x", icon: iconSvg("openai", "#1f2328"), match: (s) => s.planKey === "chatgpt-pro-20x" },
    { product: "claude", name: "Claude", plan: "Pro", icon: iconSvg("claude", "#c96f4a"), match: (s) => s.planKey === "claude-pro" },
    { product: "claude", name: "Claude", plan: "Max 5x", icon: iconSvg("claude", "#c96f4a"), match: (s) => s.planKey === "claude-max-5x" },
    { product: "copilot", name: "Copilot", plan: "Pro", icon: iconSvg("githubcopilot", "#1f2328"), match: (s) => s.product === "copilot" },
    { product: "google", name: "Google", plan: "AI Pro", icon: googleG, match: (s) => s.product === "google" },
    { product: "kimi", name: "Kimi", plan: "Code", icon: iconSvg("moonshotai", "#1f2328"), match: (s) => s.product === "kimi" },
];

const laneRows = lanes
    .map((lane) => {
        const spans = snapshot.coverageSpans
            .filter(lane.match)
            .sort((a, b) => a.start.localeCompare(b.start))
            .map((span, i, list) => {
                const clipEnd = Date.parse(`${span.end}T00:00:00Z`) > domainEnd;
                const clipStart = Date.parse(`${span.start}T00:00:00Z`) < domainStart;
                const joinsPrev = i > 0 && list[i - 1].end === span.start;
                const joinsNext = i < list.length - 1 && list[i + 1].start === span.end;
                const left = clipStart ? 0 : pos(span.start);
                const width = Math.max(0.8, (clipEnd ? 100 : pos(span.end)) - left);
                const color = INK[lane.product];
                const solid = span.current;
                let radius = "999px";
                let mask = "";
                if (clipStart) mask = "mask-image:linear-gradient(to left,#000 calc(100% - 30px),transparent);";
                if (clipEnd) mask = "mask-image:linear-gradient(to right,#000 calc(100% - 30px),transparent);";
                const r = { tl: 999, tr: 999, br: 999, bl: 999 };
                if (clipStart || joinsPrev) { r.tl = 0; r.bl = 0; }
                if (clipEnd || joinsNext) { r.tr = 0; r.br = 0; }
                radius = `${r.tl}px ${r.tr}px ${r.br}px ${r.bl}px`;
                const bg = solid ? color : `color-mix(in srgb, ${color} 26%, #fff)`;
                const border = solid ? "" : `box-shadow: inset 0 0 0 1.5px color-mix(in srgb, ${color} 36%, transparent);`;
                const sep = joinsPrev ? "border-left:3px solid #fbfcfd;" : "";
                return `<i style="position:absolute;top:50%;transform:translateY(-50%);height:22px;left:${left}%;width:${width}%;background:${bg};border-radius:${radius};${border}${mask}${sep}"></i>`;
            })
            .join("");
        return `<div class="lane"><span class="label">${lane.icon}<b>${lane.name}</b><small>${lane.plan}</small></span><span class="track">${spans}</span></div>`;
    })
    .join("");

const yearTicks = [];
for (let y = 2023; y <= new Date(domainEnd).getUTCFullYear(); y += 1) {
    const at = pos(`${y}-01-01`);
    if (at > 1 && at < 98) yearTicks.push({ y, at });
}

const page = (isZh) => `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { width:1200px; height:630px; background:#f7f9fb; overflow:hidden;
    font-family:Inter,"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif; color:#17191b; position:relative; }
  body::before { content:""; position:absolute; inset:0;
    background:
      radial-gradient(70% 60% at 0% 0%, rgba(198,226,238,.4) 0%, transparent 60%),
      radial-gradient(70% 60% at 100% 0%, rgba(141,190,225,.34) 0%, transparent 64%),
      linear-gradient(rgba(31,38,44,.05) 1px, transparent 1px) 0 0 / 46px 46px,
      linear-gradient(90deg, rgba(31,38,44,.05) 1px, transparent 1px) 0 0 / 46px 46px; }
  .card { position:relative; padding:46px 64px 38px; height:100%; display:flex; flex-direction:column; }
  .eyebrow { display:flex; align-items:center; gap:10px; font-family:"JetBrains Mono","SF Mono",Menlo,monospace;
    font-size:17px; letter-spacing:.1em; color:#7b858b; font-weight:500; }
  .eyebrow i { width:11px; height:11px; background:#4b79c5; }
  .head { display:flex; justify-content:space-between; align-items:flex-end; margin-top:18px; }
  h1 { font-family:Georgia,"Songti SC",serif; font-size:54px; font-weight:600; letter-spacing:-0.01em; }
  h1 em { font-style:normal; color:#4b79c5; border-bottom:3px solid #4b79c5; }
  .total { text-align:right; }
  .total small { display:block; font-family:"JetBrains Mono",Menlo,monospace; font-size:15px;
    letter-spacing:.1em; color:#7b858b; margin-bottom:6px; }
  .total b { font-family:Georgia,"Songti SC",serif; font-size:58px; font-weight:600; line-height:1;
    border-bottom:5px double rgba(23,25,27,.72); padding-bottom:8px; }
  .chart { flex:1; margin-top:24px; position:relative; background:#fbfcfd; border:1.5px solid #dfe8ee;
    border-radius:18px; padding:14px 26px 10px; }
  .lane { display:grid; grid-template-columns:196px 1fr; align-items:center; height:44px;
    border-bottom:1.5px solid rgba(223,232,238,.6); }
  .lane:last-child { border-bottom:0; }
  .label { display:flex; align-items:center; gap:9px; }
  .label b { font-size:19px; font-weight:700; white-space:nowrap; }
  .label small { font-family:"JetBrains Mono",Menlo,monospace; font-size:14px; color:#7b858b; white-space:nowrap; }
  .track { position:relative; height:100%; }
  .grid { position:absolute; top:16px; bottom:14px; width:1.5px; background:rgba(223,232,238,.85); }
  .now { position:absolute; top:16px; bottom:14px; width:2px; background:rgba(23,25,27,.42); }
  .now b { position:absolute; top:2px; left:50%; transform:translate(-50%,0); background:#17191b; color:#f7f9fb;
    font-family:"JetBrains Mono",Menlo,monospace; font-size:13px; font-weight:700; padding:3px 10px; border-radius:999px; white-space:nowrap; }
  .year { position:absolute; top:-2px; transform:translateX(-50%); font-family:"JetBrains Mono",Menlo,monospace;
    font-size:14px; color:#7b858b; }
  .foot { display:flex; justify-content:space-between; margin-top:16px;
    font-family:"JetBrains Mono",Menlo,monospace; font-size:16px; color:#7b858b; letter-spacing:.04em; }
</style></head><body>
<div class="card">
  <p class="eyebrow"><i></i>AI SUBSCRIPTION LEDGER · 2022—${today.slice(0, 4)}</p>
  <div class="head">
    <h1>${isZh ? '我为 AI <em>付费</em>这四年' : 'four years of <em>paying</em> for ai'}</h1>
    <div class="total"><small>${isZh ? "截至目前 · TO DATE" : "TO DATE"}</small><b>¥${lifetime.toLocaleString("en-US")}</b></div>
  </div>
  <div class="chart">
    <div style="position:relative;height:20px;">
      ${yearTicks.map((t) => `<span class="year" style="left:calc(196px + (100% - 196px) * ${t.at} / 100)">${t.y}</span>`).join("")}
    </div>
    ${laneRows}
    ${yearTicks.map((t) => `<span class="grid" style="left:calc(26px + 196px + (100% - 52px - 196px) * ${t.at} / 100)"></span>`).join("")}
    <span class="now" style="left:calc(26px + 196px + (100% - 52px - 196px) * ${nowAt} / 100)"><b>${isZh ? "今天" : "TODAY"}</b></span>
  </div>
  <div class="foot"><span>${isZh ? "最近 12 个月 · LAST 12 MONTHS" : "LAST 12 MONTHS"}</span><span>yizhe.me/ai-subscriptions</span></div>
</div>
</body></html>`;

mkdirSync(resolve(root, "public/og"), { recursive: true });
for (const [lang, isZh] of [["zh", true], ["en", false]]) {
    const htmlPath = resolve(tmpdir(), `og-ai-subs-${lang}.html`);
    writeFileSync(htmlPath, page(isZh), "utf8");
    const out = resolve(root, `public/og/ai-subscriptions-${lang}.png`);
    execFileSync(CHROME, [
        "--headless=new",
        `--screenshot=${out}`,
        "--window-size=1200,630",
        "--force-device-scale-factor=2",
        "--hide-scrollbars",
        "--disable-gpu",
        `file://${htmlPath}`,
    ], { stdio: "pipe" });
    console.log(`generated ${out}`);
}
