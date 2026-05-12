import { useEffect, useMemo, useState } from "react";
import type { DeviceScope } from "../types/campaign";
import type { LayoutDefinition } from "../data/layout-library";

type PlacementOption = {
  id: string;
  label: string;
  description: string;
  previewPage: string;
  previewArea: string;
};

const BANNER_PAGE_TYPES = ["product", "product cards", "collection", "home", "search", "cart", "quick view"];
const BADGE_PAGE_TYPES = ["product", "product cards", "collection", "cart drawer", "quick view"];

const BANNER_PLACEMENTS: PlacementOption[] = [
  { id: "pl_pdp_above_price", label: "PDP Above Price", description: "Inline banner above the main price block", previewPage: "product", previewArea: "product-price" },
  { id: "pl_pdp_below_atc", label: "Below Add to Cart", description: "Urgency or offer banner below the buy button", previewPage: "product", previewArea: "product-atc" },
  { id: "pl_col_card_bottom", label: "Product Card Banner", description: "Full-width banner across collection product cards", previewPage: "product cards", previewArea: "card-banner" },
  { id: "pl_collection_top_banner", label: "Collection Top Banner", description: "Banner above collection product grids", previewPage: "collection", previewArea: "page-top" },
  { id: "pl_home_top_banner", label: "Home Top Banner", description: "Announcement banner on the homepage", previewPage: "home", previewArea: "page-top" },
  { id: "pl_search_top_banner", label: "Search Top Banner", description: "Banner above search results", previewPage: "search", previewArea: "page-top" },
  { id: "pl_cart_top_banner", label: "Cart Top Banner", description: "Banner above cart drawer items", previewPage: "cart", previewArea: "page-top" },
  { id: "pl_qv_body", label: "Quick View Body", description: "Banner inside the quick view modal", previewPage: "quick view", previewArea: "modal-body" },
];

const BADGE_PLACEMENTS: PlacementOption[] = [
  { id: "pl_col_card_top", label: "Product Card Top", description: "Overlay chip in the top corner of product cards", previewPage: "product cards", previewArea: "card-corner" },
  { id: "pl_pdp_above_title", label: "Above Title", description: "Inline badge directly above the product title", previewPage: "product", previewArea: "product-title" },
  { id: "pl_pdp_below_price", label: "Below Price", description: "Badge or stack just below price content", previewPage: "product", previewArea: "product-price" },
  { id: "pl_qv_body", label: "Quick View Body", description: "Badge inside quick view content", previewPage: "quick view", previewArea: "modal-body" },
  { id: "pl_cart_item", label: "Cart Drawer Item", description: "Badge inline with cart drawer line items", previewPage: "cart drawer", previewArea: "cart-line" },
];

type Props = {
  type: LayoutDefinition["type"];
  layout: LayoutDefinition;
  onBack: () => void;
  onSave: (layout: LayoutDefinition) => void;
};

export default function LayoutEditor({ type, layout, onBack, onSave }: Props) {
  const [draft, setDraft] = useState<LayoutDefinition>(layout);
  const pageTypes = type === "banner" ? BANNER_PAGE_TYPES : BADGE_PAGE_TYPES;
  const placementOptions = type === "banner" ? BANNER_PLACEMENTS : BADGE_PLACEMENTS;
  const [activePreview, setActivePreview] = useState<string>(layout.pageTypes[0] ?? pageTypes[0]);

  useEffect(() => {
    if (draft.pageTypes.includes(activePreview)) {
      return;
    }

    setActivePreview(draft.pageTypes[0] ?? pageTypes[0]);
  }, [activePreview, draft.pageTypes, pageTypes]);

  const previewPlacementOptions = useMemo(
    () => placementOptions.filter((placement) => placement.previewPage === activePreview),
    [activePreview, placementOptions],
  );

  const updatePlacementScope = (placementId: string, deviceScope: DeviceScope) => {
    setDraft((current) => ({
      ...current,
      placements: current.placements.map((placement) =>
        placement.placementId === placementId ? { ...placement, deviceScope } : placement,
      ),
    }));
  };

  const movePlacement = (placementId: string, direction: "up" | "down") => {
    setDraft((current) => {
      const index = current.placements.findIndex((placement) => placement.placementId === placementId);
      if (index === -1) {
        return current;
      }

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.placements.length) {
        return current;
      }

      const nextPlacements = [...current.placements];
      const [movedPlacement] = nextPlacements.splice(index, 1);
      nextPlacements.splice(targetIndex, 0, movedPlacement);

      return {
        ...current,
        placements: nextPlacements,
      };
    });
  };

  const togglePlacement = (placementId: string) => {
    setDraft((current) => {
      const exists = current.placements.some((placement) => placement.placementId === placementId);
      if (exists) {
        return {
          ...current,
          placements: current.placements.filter((placement) => placement.placementId !== placementId),
        };
      }

      return {
        ...current,
        placements: [...current.placements, { placementId, deviceScope: "all" }],
      };
    });
  };

  const togglePageType = (pageType: string) => {
    setDraft((current) => ({
      ...current,
      pageTypes: current.pageTypes.includes(pageType)
        ? current.pageTypes.filter((item) => item !== pageType)
        : [...current.pageTypes, pageType],
    }));
  };

  const handleSave = () => {
    onSave({
      ...draft,
      capabilities: draft.capabilities.filter(Boolean),
      pageTypes: draft.pageTypes.filter(Boolean),
    });
  };

  const renderPreviewSurface = () => {
    const renderPlacementHotspot = (placement: PlacementOption) => {
      const selectedPlacement = draft.placements.find((item) => item.placementId === placement.id);
      const priority = selectedPlacement
        ? draft.placements.findIndex((item) => item.placementId === placement.id) + 1
        : null;
      const placementTone = type === "banner" ? "banner" : "badge";

      return (
        <button
          key={placement.id}
          type="button"
          className={`layout-preview-hotspot layout-preview-hotspot--${placement.previewArea} layout-preview-hotspot--${placementTone} ${selectedPlacement ? "active" : ""}`}
          onClick={() => togglePlacement(placement.id)}
        >
          <span className="layout-preview-hotspot-creative">
            <span className={`layout-preview-merch layout-preview-merch--${placementTone} ${selectedPlacement ? "active" : ""}`}>
              <span className="layout-preview-merch-eyebrow">{type === "banner" ? "Banner" : "Badge"}</span>
              <span className="layout-preview-merch-copy">
                {type === "banner" ? "Limited-time offer for this slot" : "New arrival"}
              </span>
            </span>
          </span>

          <span className="layout-preview-hotspot-copy">
            <span className="layout-preview-hotspot-label-row">
              <span className="layout-preview-hotspot-label">{placement.label}</span>
              {priority && <span className="layout-preview-hotspot-priority">#{priority}</span>}
            </span>
            <span className="layout-preview-hotspot-meta">{selectedPlacement ? "Applied to layout" : "Click to add this slot"}</span>
          </span>
          <span className="layout-preview-hotspot-state">{selectedPlacement ? "Applied" : "Add slot"}</span>
        </button>
      );
    };

    if (activePreview === "product") {
      return (
        <div className="layout-preview-shell layout-preview-shell--product">
          <div className="layout-preview-header-bar" />
          <div className="layout-preview-product-grid">
            <div className="layout-preview-media">
              {type === "badge" && (
                <div className="layout-preview-floating-badge">Best seller</div>
              )}
            </div>
            <div className="layout-preview-product-copy">
              <div className="layout-preview-line layout-preview-line--sm" />
              <div className="layout-preview-line layout-preview-line--lg" />
              <div className="layout-preview-line layout-preview-line--md" />
              {previewPlacementOptions.map(renderPlacementHotspot)}
              <div className="layout-preview-button-row">
                <span className="layout-preview-button" />
                <span className="layout-preview-button layout-preview-button--secondary" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activePreview === "product cards" || activePreview === "collection") {
      return (
        <div className="layout-preview-shell layout-preview-shell--grid">
          <div className="layout-preview-header-bar" />
          {previewPlacementOptions.filter((placement) => placement.previewArea === "page-top").map(renderPlacementHotspot)}
          <div className="layout-preview-card-grid">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="layout-preview-card">
                {previewPlacementOptions.filter((placement) => placement.previewArea === "card-corner" || placement.previewArea === "card-banner").map(renderPlacementHotspot)}
                <div className="layout-preview-card-media" />
                <div className="layout-preview-line layout-preview-line--md" />
                <div className="layout-preview-line layout-preview-line--sm" />
                <div className="layout-preview-card-price-row">
                  <span className="layout-preview-price">$24.00</span>
                  <span className="layout-preview-price layout-preview-price--muted">$32.00</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activePreview === "home" || activePreview === "search") {
      return (
        <div className="layout-preview-shell layout-preview-shell--feed">
          <div className="layout-preview-header-bar" />
          {previewPlacementOptions.map(renderPlacementHotspot)}
          <div className="layout-preview-feed-list">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="layout-preview-feed-row">
                <div className="layout-preview-feed-thumb" />
                <div className="layout-preview-feed-copy">
                  <div className="layout-preview-line layout-preview-line--md" />
                  <div className="layout-preview-line layout-preview-line--sm" />
                  <div className="layout-preview-feed-meta">Shop the collection</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activePreview === "cart" || activePreview === "cart drawer") {
      return (
        <div className="layout-preview-shell layout-preview-shell--cart">
          <div className="layout-preview-cart-frame">
            {previewPlacementOptions.filter((placement) => placement.previewArea === "page-top").map(renderPlacementHotspot)}
            <div className="layout-preview-cart-line">
              <div className="layout-preview-feed-thumb" />
              <div className="layout-preview-feed-copy">
                <div className="layout-preview-line layout-preview-line--md" />
                <div className="layout-preview-line layout-preview-line--sm" />
                <div className="layout-preview-feed-meta">2 items in cart</div>
              </div>
              {previewPlacementOptions.filter((placement) => placement.previewArea === "cart-line").map(renderPlacementHotspot)}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="layout-preview-shell layout-preview-shell--modal">
        <div className="layout-preview-modal">
          <div className="layout-preview-modal-head" />
          <div className="layout-preview-modal-body">
            <div className="layout-preview-line layout-preview-line--lg" />
            <div className="layout-preview-line layout-preview-line--md" />
            <div className="layout-preview-feed-meta">Quick view merchandising</div>
            {previewPlacementOptions.map(renderPlacementHotspot)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="layout-editor panel">
      <div className="layout-editor-head">
        <button className="ghost-btn" onClick={onBack}>← Back to layouts</button>
        <div className="layout-editor-head-actions">
          <button className="ghost-btn" onClick={onBack}>Cancel</button>
          <button className="primary-btn" onClick={handleSave}>Save layout</button>
        </div>
      </div>

      <div className="layout-editor-grid">
        <section className="layout-editor-main">
          <div className="layout-editor-section">
            <div className="layout-editor-preview-head">
              <div>
                <h2>Visual placement map</h2>
                <p>Click a target on the mock storefront to add or remove that slot.</p>
              </div>
              <div className="layout-editor-preview-tabs" role="toolbar" aria-label="Preview page types">
                {draft.pageTypes.map((pageType) => (
                  <button
                    key={pageType}
                    type="button"
                    className={`layout-editor-preview-tab ${activePreview === pageType ? "active" : ""}`}
                    onClick={() => setActivePreview(pageType)}
                  >
                    {pageType}
                  </button>
                ))}
              </div>
            </div>

            {renderPreviewSurface()}
          </div>

          <div className="layout-editor-section">
            <h2>Layout details</h2>
            <label className="field-label">
              Layout name
              <input
                type="text"
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              />
            </label>
            <label className="field-label">
              Applies to
              <input
                type="text"
                value={draft.appliesTo}
                onChange={(event) => setDraft((current) => ({ ...current, appliesTo: event.target.value }))}
              />
            </label>
            <label className="field-label">
              Capabilities
              <input
                type="text"
                value={draft.capabilities.join(", ")}
                onChange={(event) => setDraft((current) => ({
                  ...current,
                  capabilities: event.target.value.split(",").map((item) => item.trim()).filter(Boolean),
                }))}
                placeholder="Sticky ready, theme-safe, countdown compatible"
              />
            </label>
          </div>

          <div className="layout-editor-section">
            <h2>Page coverage</h2>
            <div className="layout-editor-chip-grid">
              {pageTypes.map((pageType) => (
                <button
                  key={pageType}
                  type="button"
                  className={`layout-editor-chip ${draft.pageTypes.includes(pageType) ? "active" : ""}`}
                  onClick={() => togglePageType(pageType)}
                >
                  {pageType}
                </button>
              ))}
            </div>
          </div>
        </section>

        <aside className="layout-editor-side">
          <div className="layout-editor-section">
            <h2>Placement slots</h2>
            <p className="layout-editor-section-copy">Use the visual map or fine-tune enabled slots here.</p>
            {draft.placements.length > 1 && (
              <div className="layout-editor-priority-note">
                Higher priority slots are applied first when a layout uses more than one position.
              </div>
            )}
            <div className="layout-editor-placement-list">
              {placementOptions.map((placement) => {
                const selectedPlacement = draft.placements.find((item) => item.placementId === placement.id);
                const placementIndex = draft.placements.findIndex((item) => item.placementId === placement.id);
                return (
                  <div key={placement.id} className={`layout-editor-placement ${selectedPlacement ? "selected" : ""}`}>
                    <label className="layout-editor-placement-toggle">
                      <input
                        type="checkbox"
                        checked={Boolean(selectedPlacement)}
                        onChange={() => togglePlacement(placement.id)}
                      />
                      <span className="layout-editor-placement-copy">
                        <span className="layout-editor-placement-title-row">
                          <span className="layout-editor-placement-title">{placement.label}</span>
                          {selectedPlacement && (
                            <span className="layout-editor-placement-order">#{placementIndex + 1}</span>
                          )}
                        </span>
                        <span className="layout-editor-placement-desc">{placement.description}</span>
                      </span>
                    </label>

                    {selectedPlacement && (
                      <div className="layout-editor-placement-controls">
                        <div className="layout-editor-scope-row">
                          {(["all", "desktop", "mobile"] as DeviceScope[]).map((scope) => (
                            <button
                              key={scope}
                              type="button"
                              className={`layout-editor-scope-btn ${selectedPlacement.deviceScope === scope ? "active" : ""}`}
                              onClick={() => updatePlacementScope(placement.id, scope)}
                            >
                              {scope}
                            </button>
                          ))}
                        </div>

                        <div className="layout-editor-order-controls">
                          <button
                            type="button"
                            className="layout-editor-order-btn"
                            onClick={() => movePlacement(placement.id, "up")}
                            disabled={placementIndex <= 0}
                          >
                            Move up
                          </button>
                          <button
                            type="button"
                            className="layout-editor-order-btn"
                            onClick={() => movePlacement(placement.id, "down")}
                            disabled={placementIndex === draft.placements.length - 1}
                          >
                            Move down
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
