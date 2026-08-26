import snapshotJson from "../data/ai-subscriptions.json";

export type Product = "chatgpt" | "claude" | "copilot" | "google" | "kimi" | "mixed";

export interface Transaction {
    date: string;
    scope: "core" | "mixed";
    product: Product;
    app: string;
    planKey: string;
    channel: string;
    currency: string;
    originalAmount: number;
    estimatedCny: number;
    servicePeriod: string | null;
    provisionalFx: boolean;
}

export interface CurrentSubscription {
    product: Exclude<Product, "mixed">;
    app: string;
    planKey: string;
    channel: string;
    currency: string;
    originalAmount: number;
    estimatedCny: number;
    statusType: "through" | "renews";
    statusDate: string;
    provisionalFx: boolean;
}

export interface CoverageSpan {
    product: Exclude<Product, "mixed">;
    planKey: string;
    channel: string;
    start: string;
    end: string;
    current?: boolean;
}

export interface Snapshot {
    schemaVersion: number;
    asOf: string;
    integrity: {
        coreRecordCount: number;
        wideRecordCount: number;
        coreEstimatedCny: number;
        wideEstimatedCny: number;
        currentEstimatedCny: number;
        hasProvisionalFx: boolean;
    };
    currentSubscriptions: CurrentSubscription[];
    coverageSpans: CoverageSpan[];
    records: Transaction[];
}

export const YEARLY_PLANS = new Set(["google-ai-pro"]);

function addPeriod(date: string, yearly: boolean): string {
    const d = new Date(`${date}T00:00:00Z`);
    if (yearly) {
        d.setUTCFullYear(d.getUTCFullYear() + 1);
    } else {
        const month = d.getUTCMonth();
        d.setUTCMonth(month + 1);
        if (d.getUTCMonth() !== (month + 1) % 12) d.setUTCDate(0);
    }
    return d.toISOString().slice(0, 10);
}

/**
 * 自动续费滚动:构建时把过了续费日的订阅按周期滚到今天,并合成新账单。
 * currentSubscriptions 里的计划都视为自动续费;明确停掉的(如 Kimi)不在其中。
 */
export function loadSnapshot(): { snapshot: Snapshot; buildToday: string; asOfDate: string } {
    const snapshot = structuredClone(snapshotJson) as Snapshot;
    const buildToday = new Date().toISOString().slice(0, 10);

    for (const sub of snapshot.currentSubscriptions) {
        const yearly = YEARLY_PLANS.has(sub.planKey);
        while (sub.statusDate < buildToday) {
            const periodStart = sub.statusDate;
            const periodEnd = addPeriod(periodStart, yearly);
            snapshot.records.push({
                date: periodStart,
                scope: "core",
                product: sub.product,
                app: sub.app,
                planKey: sub.planKey,
                channel: sub.channel,
                currency: sub.currency,
                originalAmount: sub.originalAmount,
                estimatedCny: sub.estimatedCny,
                servicePeriod: `${periodStart} - ${periodEnd}`,
                provisionalFx: sub.provisionalFx,
            });
            sub.statusDate = periodEnd;
            const span = snapshot.coverageSpans.find(
                (item) => item.current && item.planKey === sub.planKey && item.channel === sub.channel,
            );
            if (span && span.end < periodEnd) span.end = periodEnd;
        }
    }
    snapshot.records.sort((a, b) => a.date.localeCompare(b.date) || a.app.localeCompare(b.app));
    const asOfDate = snapshot.asOf < buildToday ? buildToday : snapshot.asOf;
    return { snapshot, buildToday, asOfDate };
}
