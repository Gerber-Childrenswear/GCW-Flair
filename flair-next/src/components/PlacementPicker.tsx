import { useState } from "react";
import { getLayoutById } from "../data/layout-library";
import type { CampaignPlacement, DeviceScope } from "../types/campaign";

// ── Placement slot registry (mirrors server store) ────────────────────────────
export type PlacementSlotDef = {
  id: string;
  pageType: string;
  slotKey: string;
  label: string;
  description: string;
};

const ALL_PLACEMENTS: PlacementSlotDef[] = [
  { id: "pl_pdp_above_title",    pageType: "pdp",         slotKey: "above_title",      label: "Above Title",        description: "Directly above the product title" },
  { id: "pl_pdp_below_title",    pageType: "pdp",         slotKey: "below_title",      label: "Below Title",        description: "Between title and price" },
  { id: "pl_pdp_above_price",    pageType: "pdp",         slotKey: "above_price",      label: "Above Price",        description: "Directly above the price block" },
  { id: "pl_pdp_below_price",    pageType: "pdp",         slotKey: "below_price",      label: "Below Price",        description: "Between price and add-to-cart" },
  { id: "pl_pdp_below_swatches", pageType: "pdp",         slotKey: "below_swatches",   label: "Below Swatches",     description: "Below variant swatch selector" },
  { id: "pl_pdp_above_atc",      pageType: "pdp",         slotKey: "above_atc",        label: "Above Add to Cart",  description: "Just above the add-to-cart button" },
  { id: "pl_pdp_below_atc",      pageType: "pdp",         slotKey: "below_atc",        label: "Below Add to Cart",  description: "Below add-to-cart button" },
  { id: "pl_col_card_top",       pageType: "collection",  slotKey: "card_top",         label: "Card Top",           description: "Overlay on top-left of product card" },
  { id: "pl_col_card_bottom",    pageType: "collection",  slotKey: "card_bottom",      label: "Card Bottom",        description: "Banner across card bottom" },
  { id: "pl_collection_top_banner", pageType: "collection", slotKey: "top_banner",    label: "Top Banner",        description: "Full-width banner at the top of collection pages" },
  { id: "pl_home_top_banner",    pageType: "index",       slotKey: "top_banner",       label: "Home Top Banner",    description: "Announcement or promo banner above homepage content" },
  { id: "pl_search_top_banner",  pageType: "search",      slotKey: "top_banner",       label: "Search Top Banner",  description: "Promo banner above search results" },
  { id: "pl_qv_body",            pageType: "quick_view",  slotKey: "quick_view_body",  label: "Quick View Body",    description: "Inside quick view modal, below price" },
  { id: "pl_cart_top_banner",    pageType: "cart_drawer", slotKey: "top_banner",       label: "Cart Top Banner",    description: "Promo banner above cart drawer items" },
  { id: "pl_cart_item",          pageType: "cart_drawer", slotKey: "cart_drawer_item", label: "Cart Drawer Item",   description: "Inline with cart line items" },
];

const PAGE_TYPE_LABELS: Record<string, string> = {
  pdp:         "Product Detail",
  collection:  "Collection",
  index:       "Home",
  search:      "Search",
  quick_view:  "Quick View",
  cart_drawer: "Cart Drawer",
};

const PAGE_TYPES = Array.from(new Set(ALL_PLACEMENTS.map((p) => p.pageType)));

// ── Types ─────────────────────────────────────────────────────────────────────
type Props = {
  selected: CampaignPlacement[];
  onChange: (updated: CampaignPlacement[]) => void;
};

// ── PlacementPicker ───────────────────────────────────────────────────────────
export default function PlacementPicker({ selected, onChange }: Props) {
  const [activeTab, setActiveTab] = useState(PAGE_TYPES[0]);

  const slotsForTab = ALL_PLACEMENTS.filter((p) => p.pageType === activeTab);

  const isSelected = (placementId: string) =>
    selected.some((s) => s.placementId === placementId);

  const getPlacement = (placementId: string): CampaignPlacement | undefined =>
    selected.find((s) => s.placementId === placementId);

  const togglePlacement = (def: PlacementSlotDef) => {
    if (isSelected(def.id)) {
      onChange(selected.filter((s) => s.placementId !== def.id));
    } else {
      const newPlacement: CampaignPlacement = {
        id: `cp_${def.id}_${Date.now()}`,
        placementId: def.id,
        layoutKey: "default",
        deviceScope: "all",
      };
      onChange([...selected, newPlacement]);
    }
  };

  const updateDeviceScope = (placementId: string, deviceScope: DeviceScope) => {
    onChange(
      selected.map((s) =>
        s.placementId === placementId ? { ...s, deviceScope } : s
      )
    );
  };

  const totalSelected = selected.length;
  const selectedLayoutKeys = Array.from(new Set(selected.map((placement) => placement.layoutKey).filter((key) => key !== "default")));
  const appliedLayout = selectedLayoutKeys.length === 1 ? getLayoutById(selectedLayoutKeys[0]) : undefined;

  return (
    <div className="placement-picker">
      <div className="placement-picker-header">
        <span className="placement-picker-count">
          {totalSelected} placement{totalSelected !== 1 ? "s" : ""} selected
        </span>
        {totalSelected > 0 && (
          <button
            className="placement-clear-btn"
            onClick={() => onChange([])}
          >
            Clear all
          </button>
        )}
      </div>

      {appliedLayout && (
        <div className="placement-layout-summary">
          <div>
            <div className="placement-layout-summary-label">Preset layout</div>
            <div className="placement-layout-summary-title">{appliedLayout.name}</div>
          </div>
          <div className="placement-layout-summary-copy">
            {appliedLayout.pageTypes.join(" • ")} | {appliedLayout.capabilities.join(" • ")}
          </div>
        </div>
      )}

      {/* Page type tabs */}
      <div className="placement-tabs" role="toolbar" aria-label="Placement page types">
        {PAGE_TYPES.map((pt) => {
          const count = selected.filter((s) =>
            ALL_PLACEMENTS.find((p) => p.id === s.placementId)?.pageType === pt
          ).length;
          return (
            <button
              key={pt}
              type="button"
              className={`placement-tab ${activeTab === pt ? "active" : ""}`}
              onClick={() => setActiveTab(pt)}
            >
              {PAGE_TYPE_LABELS[pt] ?? pt}
              {count > 0 && <span className="placement-tab-badge">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Slot grid */}
      <div className="placement-slot-grid">
        {slotsForTab.map((def) => {
          const checked = isSelected(def.id);
          const existing = getPlacement(def.id);
          return (
            <div
              key={def.id}
              className={`placement-slot ${checked ? "selected" : ""}`}
            >
              <label className="placement-slot-label">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => togglePlacement(def)}
                  className="placement-slot-checkbox"
                />
                <div className="placement-slot-info">
                  <span className="placement-slot-name">{def.label}</span>
                  <span className="placement-slot-desc">{def.description}</span>
                  {existing && existing.layoutKey !== "default" && (
                    <span className="placement-slot-layout-badge">
                      {getLayoutById(existing.layoutKey)?.name ?? existing.layoutKey}
                    </span>
                  )}
                </div>
              </label>

              {checked && existing && (
                <div className="placement-device-scope">
                  {(["all", "desktop", "mobile"] as DeviceScope[]).map((scope) => (
                    <button
                      key={scope}
                      className={`device-scope-btn ${existing.deviceScope === scope ? "active" : ""}`}
                      onClick={() => updateDeviceScope(def.id, scope)}
                    >
                      {scope}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Visual mockup key */}
      <div className="placement-legend">
        <span className="placement-legend-dot selected-dot" /> Selected
        <span className="placement-legend-spacer" />
        <span className="placement-legend-dot unselected-dot" /> Available
      </div>
    </div>
  );
}
