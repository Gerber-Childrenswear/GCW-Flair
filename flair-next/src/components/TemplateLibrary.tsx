import { useState } from "react";

// ── Template data (mirrors server) ────────────────────────────────────────────
export type TemplateDef = {
  id: string;
  name: string;
  category: string;
  description: string;
  defaultCreative: {
    backgroundColor: string;
    textColor: string;
    borderColor: string;
    stylePreset: string;
    text?: string;
  };
};

const TEMPLATES: TemplateDef[] = [
  { id: "tmpl_sale",      name: "Sitewide Sale",    category: "Sale",        description: "Broad sitewide discount messaging",               defaultCreative: { backgroundColor: "#1a3a5c", textColor: "#ffffff", borderColor: "#1a3a5c", stylePreset: "solid-dark",   text: "SITEWIDE SALE!\nExtra discount applied in cart." } },
  { id: "tmpl_clearance", name: "Clearance",        category: "Sale",        description: "Final clearance / last chance",                   defaultCreative: { backgroundColor: "#dc2626", textColor: "#ffffff", borderColor: "#dc2626", stylePreset: "solid-red",    text: "LAST CHANCE!\nOther discounts cannot be applied." } },
  { id: "tmpl_new",       name: "New Arrival",      category: "Product",     description: "Highlight newly added products",                  defaultCreative: { backgroundColor: "#2b6ff7", textColor: "#ffffff", borderColor: "#2b6ff7", stylePreset: "solid-blue",   text: "NEW ARRIVAL!\nJust landed in store." } },
  { id: "tmpl_low_stock", name: "Limited Stock",    category: "Urgency",     description: "Low inventory urgency signal",                    defaultCreative: { backgroundColor: "#fff3cd", textColor: "#856404", borderColor: "#ffc107", stylePreset: "solid-yellow", text: "Limited Stock!\nOnly a few left — grab yours now." } },
  { id: "tmpl_organic",   name: "Organic Cotton",   category: "Product",     description: "Highlight organic material certification",         defaultCreative: { backgroundColor: "#d4edda", textColor: "#155724", borderColor: "#c3e6cb", stylePreset: "soft-green",   text: "100% Organic Cotton.\nSoft, safe, and sustainably made." } },
  { id: "tmpl_free_ship", name: "Free Shipping",    category: "Shipping",    description: "Highlight free shipping threshold or eligibility", defaultCreative: { backgroundColor: "#d1ecf1", textColor: "#0c5460", borderColor: "#bee5eb", stylePreset: "soft-blue",    text: "FREE SHIPPING on this order.\nLimited Time Only." } },
  { id: "tmpl_bundle",    name: "Bundle Offer",     category: "Promo",       description: "Cross-sell bundle opportunity",                   defaultCreative: { backgroundColor: "#f0eef5", textColor: "#3a2d5c", borderColor: "#d8d0e8", stylePreset: "soft-purple",  text: "Bundle & Save!\nAdd matching styles to your cart." } },
  { id: "tmpl_holiday",   name: "Holiday Shipping", category: "Shipping",    description: "Holiday shipping cutoff deadlines",               defaultCreative: { backgroundColor: "#fce4ec", textColor: "#880e4f", borderColor: "#f48fb1", stylePreset: "soft-pink",    text: "Holiday Shipping Deadline!\nOrder by Dec 18 for guaranteed delivery." } },
  { id: "tmpl_matching",  name: "Family Matching",  category: "Product",     description: "Calls out family matching sets",                  defaultCreative: { backgroundColor: "#fff8e1", textColor: "#5d4037", borderColor: "#ffe082", stylePreset: "solid-warm",   text: "Shop the Matching Set!\nMade for the whole family." } },
  { id: "tmpl_online",    name: "Online Only",      category: "Exclusivity", description: "Exclusive online-only products",                  defaultCreative: { backgroundColor: "#e8eaf6", textColor: "#283593", borderColor: "#9fa8da", stylePreset: "soft-indigo",  text: "Online Exclusive!\nOnly available on GerberChildrenswear.com." } },
];

const ALL_CATEGORIES = ["All", ...Array.from(new Set(TEMPLATES.map((t) => t.category)))];

// ── Props ─────────────────────────────────────────────────────────────────────
type Props = {
  onApply: (template: TemplateDef) => void;
  onClose?: () => void;
};

export default function TemplateLibrary({ onApply, onClose }: Props) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [hovered, setHovered] = useState<string | null>(null);

  const filtered = activeCategory === "All"
    ? TEMPLATES
    : TEMPLATES.filter((t) => t.category === activeCategory);

  return (
    <div className="row g-4">
      <div className="col-12 template-library-header">
        <div>
          <h2 className="template-library-title">Template Library</h2>
          <p className="template-library-subtitle">Start from a pre-built template or build from scratch.</p>
        </div>
        {onClose && (
          <button className="template-close-btn" onClick={onClose}>
            ✕ Close
          </button>
        )}
      </div>

      {/* Category filter */}
      <div className="col-12 template-categories">
        {ALL_CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`template-cat-pill ${activeCategory === cat ? "active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div className="col-12 template-grid">
        {/* Blank template card */}
        <div
          className="template-card template-card--blank"
          onClick={() => onApply({ id: "blank", name: "Blank", category: "Custom", description: "Start from scratch", defaultCreative: { backgroundColor: "#ffffff", textColor: "#333333", borderColor: "#e2e8f0", stylePreset: "outline-light" } })}
        >
          <div className="template-preview template-preview--blank">
            <span className="template-blank-icon">+</span>
            <span className="template-blank-label">Blank</span>
          </div>
          <div className="template-card-body">
            <div className="template-card-name">Start from Scratch</div>
            <div className="template-card-desc">Full control over all settings</div>
          </div>
        </div>

        {filtered.map((tmpl) => (
          <div
            key={tmpl.id}
            className={`template-card ${hovered === tmpl.id ? "hovered" : ""}`}
            onMouseEnter={() => setHovered(tmpl.id)}
            onMouseLeave={() => setHovered(null)}
          >
            {/* Preview swatch */}
            <div
              className="template-preview"
              style={{
                backgroundColor: tmpl.defaultCreative.backgroundColor,
                color: tmpl.defaultCreative.textColor,
                borderColor: tmpl.defaultCreative.borderColor,
              }}
            >
              {tmpl.defaultCreative.text
                ? tmpl.defaultCreative.text.split("\n").slice(0, 2).map((line, i) => (
                    <div key={i} className={i === 0 ? "tmpl-preview-headline" : "tmpl-preview-sub"}>{line}</div>
                  ))
                : <div className="tmpl-preview-headline">{tmpl.name}</div>
              }
            </div>

            <div className="template-card-body">
              <div className="template-card-header-row">
                <span className="template-card-name">{tmpl.name}</span>
                <span className="template-cat-badge">{tmpl.category}</span>
              </div>
              <div className="template-card-desc">{tmpl.description}</div>
            </div>

            {hovered === tmpl.id && (
              <div className="template-card-overlay">
                <button
                  className="template-apply-btn"
                  onClick={() => onApply(tmpl)}
                >
                  Use Template
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
