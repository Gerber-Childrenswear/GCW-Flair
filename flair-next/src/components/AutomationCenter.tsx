import type { Campaign } from "../types/campaign";

type Props = {
  campaigns: Campaign[];
};

function countVariantTargeted(campaigns: Campaign[]): number {
  return campaigns.filter((c) =>
    c.targetScope === "variant" ||
    c.ruleConditions.some((cond) => cond.field === "variant_option")
  ).length;
}

function countCartPromos(campaigns: Campaign[]): number {
  return campaigns.filter((c) =>
    c.targetScope === "cart" ||
    c.placements.some((p) => p.placementId.toLowerCase().includes("cart"))
  ).length;
}

export default function AutomationCenter({ campaigns }: Props) {
  const live = campaigns.filter((c) => c.status === "live");
  const scheduled = campaigns.filter((c) => c.status === "scheduled");
  const stack = campaigns.filter((c) => c.conflictMode === "stack").length;
  const grouped = campaigns.filter((c) => Boolean(c.promotionGroup)).length;
  const variantTargeted = countVariantTargeted(campaigns);
  const cartPromos = countCartPromos(campaigns);

  const rows = [
    {
      label: "Always-on Promotions",
      value: `${live.length} live`,
      detail: "Badges and banners running continuously",
      state: "healthy",
    },
    {
      label: "Scheduled Launches",
      value: `${scheduled.length} queued`,
      detail: "Campaigns set to auto-start by date/time",
      state: scheduled.length > 0 ? "healthy" : "idle",
    },
    {
      label: "Stack Promotions",
      value: `${stack} active`,
      detail: "Multiple offers can render together",
      state: stack > 0 ? "healthy" : "idle",
    },
    {
      label: "Grouped Promotions",
      value: `${grouped} grouped`,
      detail: "Campaigns grouped by launch or collection strategy",
      state: grouped > 0 ? "healthy" : "idle",
    },
    {
      label: "Variant Promotions",
      value: `${variantTargeted} targeted`,
      detail: "Rules scoped to variant options and attributes",
      state: variantTargeted > 0 ? "healthy" : "idle",
    },
    {
      label: "Cart Promotions",
      value: `${cartPromos} targeted`,
      detail: "Offers triggered in cart-specific placements",
      state: cartPromos > 0 ? "healthy" : "idle",
    },
  ] as const;

  return (
    <section className="automation-center">
      <div className="automation-header">
        <h1>Automations</h1>
        <p>Autopilot controls for scheduling, stacking, grouping, and target-based promotions.</p>
      </div>

      <div className="automation-kpis">
        <article className="panel automation-kpi">
          <p className="automation-kpi-label">Active Flows</p>
          <h3>{rows.filter((r) => r.state === "healthy").length}</h3>
        </article>
        <article className="panel automation-kpi">
          <p className="automation-kpi-label">Queued Campaigns</p>
          <h3>{scheduled.length}</h3>
        </article>
        <article className="panel automation-kpi">
          <p className="automation-kpi-label">Live Promotions</p>
          <h3>{live.length}</h3>
        </article>
      </div>

      <div className="panel automation-table-wrap">
        <table className="automation-table">
          <thead>
            <tr>
              <th>Flow</th>
              <th>Status</th>
              <th>Value</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <td>{row.label}</td>
                <td>
                  <span className={`auto-state auto-state--${row.state}`}>
                    {row.state === "healthy" ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>{row.value}</td>
                <td>{row.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
