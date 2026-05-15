// Generic brand-token sub-page (Shapes / Borders / Padding / Shadows /
// Text Sizes / Text Styles / Letter Spacing). Read-only list view in
// this slice; full CRUD with audit + delete-with-transfer follows the
// Colors pattern in a later commit.
//
// See types/brand-tokens.ts and data/brand-tokens.ts for the type shapes
// and seeded values, and Projects/2026-05-flair-app-redesign/_brief.md
// (Decision #5) for the architecture.

import type { ReactNode } from "react";

export type BrandTokenColumn<T> = {
  label: string;
  render: (token: T) => ReactNode;
  width?: string; // CSS grid column size, e.g. "120px" or "1fr"
};

type Props<T extends { id: string; name: string }> = {
  eyebrow: string;
  title: string;
  description: string;
  tokens: T[];
  columns: Array<BrandTokenColumn<T>>;
};

export default function SettingsBrandToken<T extends { id: string; name: string }>({
  eyebrow,
  title,
  description,
  tokens,
  columns,
}: Props<T>) {
  const gridTemplate = ["minmax(160px, 1fr)", ...columns.map((c) => c.width ?? "1fr"), "120px"].join(" ");

  return (
    <div className="sc-page">
      <div className="sc-page-head">
        <div>
          <div className="sc-eyebrow">Settings · Brand · {eyebrow}</div>
          <h1 className="sc-title">{title}</h1>
          <p className="sc-deck">{description}</p>
        </div>
        <div className="sc-page-actions">
          <button type="button" className="sc-btn sc-btn--ghost" disabled title="Coming next slice">
            Export JSON
          </button>
          <button type="button" className="sc-btn sc-btn--ghost" disabled title="Coming next slice">
            Import JSON
          </button>
          <button type="button" className="sc-btn sc-btn--primary" disabled title="Coming next slice">
            + Add {title.toLowerCase().replace(/s$/, "")}
          </button>
        </div>
      </div>

      <div className="sc-table">
        <div className="sc-table-head" style={{ gridTemplateColumns: gridTemplate }}>
          <div>Name</div>
          {columns.map((c) => (
            <div key={c.label}>{c.label}</div>
          ))}
          <div style={{ textAlign: "right" }}>Actions</div>
        </div>
        {tokens.map((token) => (
          <div key={token.id} className="sc-table-row" style={{ gridTemplateColumns: gridTemplate }}>
            <div className="sc-table-name">{token.name}</div>
            {columns.map((c) => (
              <div key={c.label}>{c.render(token)}</div>
            ))}
            <div className="sc-table-actions">
              <button type="button" disabled className="sc-row-action" title="Coming next slice">Edit</button>
              <button type="button" disabled className="sc-row-action sc-row-action--danger" title="Coming next slice">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
