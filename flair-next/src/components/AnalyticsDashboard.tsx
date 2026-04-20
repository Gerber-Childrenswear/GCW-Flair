import { useState } from "react";
import type { Campaign } from "../types/campaign";

// ── Mock metrics type ─────────────────────────────────────────────────────────
type CampaignMetrics = {
  campaignId: string;
  campaignName: string;
  campaignType: "badge" | "banner";
  campaignStatus: string;
  impressions: number;
  clicks: number;
  ctr: number;
  atcs: number;
  revenue: number;
};

// ── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_METRICS: CampaignMetrics[] = [
  { campaignId: "camp_1",  campaignName: "SITEWIDE SALE",        campaignType: "badge",  campaignStatus: "live",  impressions: 48200, clicks: 4100, ctr: 8.51, atcs: 920, revenue: 28400 },
  { campaignId: "camp_10", campaignName: "SITEWIDE SALE Banner", campaignType: "banner", campaignStatus: "live",  impressions: 41000, clicks: 3500, ctr: 8.54, atcs: 780, revenue: 24300 },
  { campaignId: "camp_4",  campaignName: "BEST PAJAMA SETS EVER",campaignType: "badge",  campaignStatus: "live",  impressions: 22100, clicks: 1820, ctr: 8.23, atcs: 490, revenue: 14600 },
  { campaignId: "camp_17", campaignName: "FREE SHIPPING $50+",   campaignType: "banner", campaignStatus: "live",  impressions: 19800, clicks: 2200, ctr: 11.11,atcs: 560, revenue: 18900 },
  { campaignId: "camp_5",  campaignName: "SNUGGLY-SOFT FOOTED PJS",campaignType:"badge", campaignStatus: "live",  impressions: 18400, clicks: 1340, ctr: 7.28, atcs: 360, revenue: 10200 },
  { campaignId: "camp_2",  campaignName: "Oops - Upside Down",   campaignType: "badge",  campaignStatus: "live",  impressions: 12400, clicks:  980, ctr: 7.90, atcs: 210, revenue: 6800  },
  { campaignId: "camp_11", campaignName: "Oops Banner",          campaignType: "banner", campaignStatus: "live",  impressions: 11200, clicks:  890, ctr: 7.95, atcs: 190, revenue: 5800  },
  { campaignId: "camp_3",  campaignName: "FREE EMBROIDERY",      campaignType: "badge",  campaignStatus: "live",  impressions:  9800, clicks:  640, ctr: 6.53, atcs: 180, revenue: 5200  },
  { campaignId: "camp_12", campaignName: "FREE EMBROIDERY Banner",campaignType:"banner",  campaignStatus: "live",  impressions:  8900, clicks:  580, ctr: 6.52, atcs: 160, revenue: 4600  },
  { campaignId: "camp_7",  campaignName: "LAST CHANCE",          campaignType: "badge",  campaignStatus: "live",  impressions:  6200, clicks:  820, ctr: 13.23,atcs: 240, revenue: 7100  },
];

const STATUS_COLORS: Record<string, string> = {
  live:      "#16a34a",
  draft:     "#64748b",
  paused:    "#d97706",
  archived:  "#94a3b8",
  scheduled: "#2563eb",
};

type SortKey = keyof CampaignMetrics;
type SortDir = "asc" | "desc";

// ── AnalyticsDashboard ────────────────────────────────────────────────────────
export default function AnalyticsDashboard({ campaigns }: { campaigns: Campaign[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("impressions");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [period, setPeriod] = useState("30d");

  // Merge live campaign names with mock metrics
  const metrics = MOCK_METRICS.map((m) => {
    const campaign = campaigns.find((c) => c.id === m.campaignId);
    return campaign ? { ...m, campaignName: campaign.name, campaignStatus: campaign.status } : m;
  });

  const sorted = [...metrics].sort((a, b) => {
    const av = a[sortKey] as number | string;
    const bv = b[sortKey] as number | string;
    if (typeof av === "number" && typeof bv === "number") {
      return sortDir === "desc" ? bv - av : av - bv;
    }
    return sortDir === "desc"
      ? String(bv).localeCompare(String(av))
      : String(av).localeCompare(String(bv));
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return " ↕";
    return sortDir === "desc" ? " ↓" : " ↑";
  };

  // Summary totals
  const totals = metrics.reduce(
    (acc, m) => ({
      impressions: acc.impressions + m.impressions,
      clicks: acc.clicks + m.clicks,
      atcs: acc.atcs + m.atcs,
      revenue: acc.revenue + m.revenue,
    }),
    { impressions: 0, clicks: 0, atcs: 0, revenue: 0 }
  );
  const totalCtr = totals.impressions > 0
    ? ((totals.clicks / totals.impressions) * 100).toFixed(2)
    : "0.00";

  const maxImpressions = Math.max(...metrics.map((m) => m.impressions), 1);

  const fmt = (n: number) => n.toLocaleString();
  const fmtCurrency = (n: number) => `$${n.toLocaleString()}`;

  return (
    <div className="analytics-dashboard">
      {/* Header */}
      <div className="analytics-header">
        <div>
          <h1 className="analytics-title">Analytics</h1>
          <p className="analytics-subtitle">Campaign performance overview</p>
        </div>
        <div className="analytics-period-select">
          {["7d", "30d", "90d", "all"].map((p) => (
            <button
              key={p}
              className={`period-btn ${period === p ? "active" : ""}`}
              onClick={() => setPeriod(p)}
            >
              {p === "all" ? "All Time" : `Last ${p.replace("d", " days")}`}
            </button>
          ))}
        </div>
      </div>

      {/* KPI summary row */}
      <div className="analytics-kpi-row">
        <div className="analytics-kpi">
          <div className="kpi-label">Impressions</div>
          <div className="kpi-value">{fmt(totals.impressions)}</div>
        </div>
        <div className="analytics-kpi">
          <div className="kpi-label">Clicks</div>
          <div className="kpi-value">{fmt(totals.clicks)}</div>
        </div>
        <div className="analytics-kpi">
          <div className="kpi-label">Avg. CTR</div>
          <div className="kpi-value">{totalCtr}%</div>
        </div>
        <div className="analytics-kpi">
          <div className="kpi-label">Add-to-Carts</div>
          <div className="kpi-value">{fmt(totals.atcs)}</div>
        </div>
        <div className="analytics-kpi">
          <div className="kpi-label">Attributed Revenue</div>
          <div className="kpi-value">{fmtCurrency(totals.revenue)}</div>
        </div>
      </div>

      {/* Impression bar chart (top 5) */}
      <div className="analytics-chart-section">
        <h3 className="analytics-section-title">Top Campaigns by Impressions</h3>
        <div className="analytics-bar-chart">
          {metrics
            .sort((a, b) => b.impressions - a.impressions)
            .slice(0, 5)
            .map((m) => (
              <div key={m.campaignId} className="bar-row">
                <div className="bar-label" title={m.campaignName}>
                  {m.campaignName.length > 28 ? m.campaignName.slice(0, 25) + "…" : m.campaignName}
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${(m.impressions / maxImpressions) * 100}%` }}
                  />
                </div>
                <div className="bar-value">{fmt(m.impressions)}</div>
              </div>
            ))}
        </div>
      </div>

      {/* Data table */}
      <div className="analytics-table-section">
        <h3 className="analytics-section-title">All Campaigns</h3>
        <div className="analytics-table-wrap">
          <table className="analytics-table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort("campaignName")}>Campaign{sortIcon("campaignName")}</th>
                <th>Type</th>
                <th>Status</th>
                <th className="sortable num" onClick={() => handleSort("impressions")}>Impressions{sortIcon("impressions")}</th>
                <th className="sortable num" onClick={() => handleSort("clicks")}>Clicks{sortIcon("clicks")}</th>
                <th className="sortable num" onClick={() => handleSort("ctr")}>CTR{sortIcon("ctr")}</th>
                <th className="sortable num" onClick={() => handleSort("atcs")}>ATCs{sortIcon("atcs")}</th>
                <th className="sortable num" onClick={() => handleSort("revenue")}>Revenue{sortIcon("revenue")}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((m) => (
                <tr key={m.campaignId}>
                  <td className="analytics-campaign-name">{m.campaignName}</td>
                  <td>
                    <span className={`type-badge type-badge--${m.campaignType}`}>
                      {m.campaignType}
                    </span>
                  </td>
                  <td>
                    <span
                      className="status-dot-label"
                      style={{ color: STATUS_COLORS[m.campaignStatus] ?? "#64748b" }}
                    >
                      ● {m.campaignStatus}
                    </span>
                  </td>
                  <td className="num">{fmt(m.impressions)}</td>
                  <td className="num">{fmt(m.clicks)}</td>
                  <td className="num">{m.ctr.toFixed(2)}%</td>
                  <td className="num">{fmt(m.atcs)}</td>
                  <td className="num">{fmtCurrency(m.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
