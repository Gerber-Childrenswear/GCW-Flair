import { useEffect, useState } from "react";
import LayoutEditor from "./LayoutEditor";
import { getLayoutsByType, type LayoutDefinition } from "../data/layout-library";
import type { CampaignType } from "../types/campaign";

function getStorageKey(type: CampaignType) {
  return `gcw-layout-library-${type}`;
}

function loadLayouts(type: CampaignType): LayoutDefinition[] {
  const defaults = getLayoutsByType(type);
  if (typeof window === "undefined") {
    return defaults;
  }

  const raw = window.localStorage.getItem(getStorageKey(type));
  if (!raw) {
    return defaults;
  }

  try {
    const parsed = JSON.parse(raw) as LayoutDefinition[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaults;
  } catch {
    return defaults;
  }
}

type Props = {
  type: CampaignType;
  onBack: () => void;
  onSelectLayout: (layout: LayoutDefinition) => void;
}

function LayoutPreview({ variant }: { variant: LayoutDefinition["variant"] }) {
  return (
    <div className={`layout-card-preview layout-card-preview--${variant}`} aria-hidden="true">
      <span className="layout-card-preview-bar layout-card-preview-bar--primary" />
      <span className="layout-card-preview-bar layout-card-preview-bar--secondary" />
    </div>
  );
}

export default function LayoutLibrary({ type, onBack, onSelectLayout }: Props) {
  const typeLabel = type === "badge" ? "Badge" : "Banner";
  const [layouts, setLayouts] = useState<LayoutDefinition[]>(() => loadLayouts(type));
  const [editingLayout, setEditingLayout] = useState<LayoutDefinition | null>(null);

  useEffect(() => {
    setLayouts(loadLayouts(type));
    setEditingLayout(null);
  }, [type]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(getStorageKey(type), JSON.stringify(layouts));
  }, [layouts, type]);

  const handleAddLayout = () => {
    setEditingLayout({
      id: `custom-${type}-${Date.now()}`,
      name: `Custom ${typeLabel} Layout`,
      type,
      appliesTo: `Draft ${typeLabel.toLowerCase()} layout`,
      pageTypes: [type === "banner" ? "product" : "product cards"],
      capabilities: ["Flexible targeting", "Custom spacing"],
      variant: "custom",
      isCustom: true,
      placements: [
        { placementId: type === "banner" ? "pl_pdp_above_price" : "pl_col_card_top", deviceScope: "all" },
      ],
    });
  };

  const handleSaveLayout = (nextLayout: LayoutDefinition) => {
    setLayouts((current) => {
      const exists = current.some((layout) => layout.id === nextLayout.id);
      if (exists) {
        return current.map((layout) => (layout.id === nextLayout.id ? nextLayout : layout));
      }
      return [...current, nextLayout];
    });
    setEditingLayout(null);
  };

  if (editingLayout) {
    return (
      <LayoutEditor
        type={type}
        layout={editingLayout}
        onBack={() => setEditingLayout(null)}
        onSave={handleSaveLayout}
      />
    );
  }

  return (
    <div className="row g-4">
      <div className="col-12 layout-library-head">
        <button className="ghost-btn layout-library-back" onClick={onBack}>
          ← {typeLabel}s
        </button>
        <div className="layout-library-actions">
          <span className="layout-library-context">{typeLabel}s</span>
          <button className="primary-btn" onClick={handleAddLayout}>+ Add layout</button>
        </div>
      </div>

      {layouts.map((layout) => (
        <div key={layout.id} className="col-12 col-md-6 col-xl-4">
          <article className="layout-card panel h-100">
            <div className="layout-card-topline">
              <div className="layout-card-title-wrap">
                <span className="layout-card-icon" aria-hidden="true">▣</span>
                <h3>{layout.name}</h3>
              </div>
              <button className="layout-card-menu" aria-label={`More actions for ${layout.name}`}>⋮</button>
            </div>

            <div className="layout-card-body">
              <LayoutPreview variant={layout.variant} />
              <div className="layout-card-meta">
                <div className="layout-card-meta-row">
                  <span className="layout-card-meta-dot" />
                  <span>{layout.appliesTo}</span>
                </div>
                <div className="layout-card-meta-row">
                  <span className="layout-card-meta-dot" />
                  <span>Page types</span>
                </div>
                <div className="layout-card-page-list">
                  {layout.pageTypes.map((pageType) => (
                    <span key={pageType} className="layout-card-page-chip">{pageType}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="layout-card-capabilities">
              {layout.capabilities.map((capability) => (
                <span key={capability} className="layout-card-capability-chip">{capability}</span>
              ))}
              {layout.isCustom && <span className="layout-card-capability-chip layout-card-capability-chip--draft">Draft</span>}
            </div>

            <div className="layout-card-actions">
              <button className="ghost-btn" onClick={() => setEditingLayout(layout)}>
                Edit layout
              </button>
              <button className="primary-btn" onClick={() => onSelectLayout(layout)}>
                Use layout
              </button>
            </div>
          </article>
        </div>
      ))}

      <div className="col-12">
        <p className="layout-library-footer">
          Start from Flair-style layout patterns, then extend them with custom placement logic, richer page coverage, and additional layout variants.
        </p>
      </div>
    </div>
  );
}