// Settings → Theme → App Blocks
//
// Stub status panel. Shows which Flair app blocks are present in the
// merchant's Shopify theme. Read-only for now — wiring it to real data
// requires Shopify Admin API access (theme.assets.get, scanning for
// flair-*.liquid app block files in the active theme).
//
// FOR NICK: When the real integration lands, replace MOCK_BLOCKS below
// with a fetch from /api/theme/app-blocks that returns the actual app
// block state from Shopify. Each block should report:
//   - block id / name (e.g. "flair-product-badge", "flair-banner")
//   - status: detected | missing | error
//   - location in theme (which template file references it)
//   - install / uninstall actions for the merchant
//
// The Overview page already hints at this with the "Theme status —
// 3 app blocks detected" copy. This Settings sub-page should be the
// canonical source for that data; Overview becomes a summary card.

type AppBlockStatus = "detected" | "missing" | "error";

type AppBlock = {
  id: string;
  name: string;
  description: string;
  status: AppBlockStatus;
  location?: string;
};

// MOCK — replace with real Shopify Admin API call. See FOR NICK comment above.
const MOCK_BLOCKS: AppBlock[] = [
  {
    id: "flair-product-badge",
    name: "Product Badge",
    description: "Renders badges on product cards and PDPs.",
    status: "detected",
    location: "sections/product-card.liquid",
  },
  {
    id: "flair-product-banner",
    name: "Product Banner",
    description: "Renders banners on product pages (above the gallery, in the buy box, sticky strips).",
    status: "detected",
    location: "templates/product.liquid",
  },
  {
    id: "flair-collection-banner",
    name: "Collection Banner",
    description: "Renders banners at the top of collection pages.",
    status: "detected",
    location: "templates/collection.liquid",
  },
];

function StatusDot({ status }: { status: AppBlockStatus }) {
  const color =
    status === "detected" ? "var(--ok)" : status === "error" ? "var(--color-coral-sale)" : "var(--idle)";
  return (
    <span
      style={{
        display: "inline-block",
        width: 10,
        height: 10,
        borderRadius: 999,
        background: color,
        flexShrink: 0,
      }}
    />
  );
}

export default function SettingsAppBlocks() {
  const detectedCount = MOCK_BLOCKS.filter((b) => b.status === "detected").length;
  const totalCount = MOCK_BLOCKS.length;

  return (
    <div className="sc-page">
      <div className="sc-page-head">
        <div>
          <div className="sc-eyebrow">Settings · Theme · App Blocks</div>
          <h1 className="sc-title">App Blocks</h1>
          <p className="sc-deck">
            The Flair app blocks installed in your Shopify theme. Read-only for now;
            installation and removal go through the Shopify theme editor.
          </p>
        </div>
        <div className="sc-page-actions">
          <button type="button" className="sc-btn sc-btn--ghost" disabled title="Real Shopify API integration coming later — see FOR NICK note in source.">
            Refresh
          </button>
        </div>
      </div>

      {/* Summary banner */}
      <div
        style={{
          padding: "var(--space-3) var(--space-4)",
          background: detectedCount === totalCount ? "var(--bg-page)" : "var(--color-coral-tint)",
          borderLeft: `3px solid ${detectedCount === totalCount ? "var(--color-sea-nymph)" : "var(--color-coral-sale)"}`,
          marginBottom: "var(--space-4)",
          fontSize: 13,
          color: "var(--text-primary)",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
        }}
      >
        <StatusDot status={detectedCount === totalCount ? "detected" : "error"} />
        <strong>{detectedCount} of {totalCount}</strong> Flair app blocks detected in your active theme.
      </div>

      <div className="sc-table">
        <div
          className="sc-table-head"
          style={{ gridTemplateColumns: "32px minmax(180px, 1fr) minmax(220px, 2fr) 160px 100px" }}
        >
          <div></div>
          <div>Block</div>
          <div>Description</div>
          <div>Location</div>
          <div style={{ textAlign: "right" }}>Status</div>
        </div>
        {MOCK_BLOCKS.map((block) => (
          <div
            key={block.id}
            className="sc-table-row"
            style={{ gridTemplateColumns: "32px minmax(180px, 1fr) minmax(220px, 2fr) 160px 100px" }}
          >
            <StatusDot status={block.status} />
            <div>
              <div style={{ fontWeight: 600, color: "var(--color-oxford-blue)" }}>{block.name}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "ui-monospace, Menlo, monospace" }}>
                {block.id}
              </div>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
              {block.description}
            </div>
            <div style={{ fontSize: 11, fontFamily: "ui-monospace, Menlo, monospace", color: "var(--text-muted)" }}>
              {block.location ?? "—"}
            </div>
            <div style={{ textAlign: "right", fontSize: 12, color: "var(--text-secondary)", textTransform: "capitalize" }}>
              {block.status}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: "var(--space-4)",
          padding: "var(--space-3)",
          background: "var(--bg-muted)",
          borderRadius: "var(--radius-md)",
          fontSize: 11,
          color: "var(--text-secondary)",
          lineHeight: 1.5,
        }}
      >
        <strong>Note for the dev:</strong> This panel currently renders mock data.
        Real integration requires reading the active theme's app blocks via the
        Shopify Admin API (<code>theme.assets.get</code> + a scan for
        <code> flair-*.liquid</code> files). See the FOR NICK comment in
        <code> SettingsAppBlocks.tsx</code> for the expected data shape.
      </div>
    </div>
  );
}
