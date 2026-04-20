import { useState, useMemo } from "react";
import type { Campaign, CampaignStatus, CampaignType } from "../types/campaign";
import CampaignCard from "./CampaignCard";

type Props = {
  campaigns: Campaign[];
  type: CampaignType;
  onEdit: (id: string) => void;
  onAdd: () => void;
};

type LayoutMode = "grid" | "list";

const statusFilters: { label: string; value: CampaignStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Live", value: "live" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Draft", value: "draft" },
  { label: "Paused", value: "paused" },
  { label: "Archived", value: "archived" },
];

export default function CampaignList({ campaigns, type, onEdit, onAdd }: Props) {
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [layout, setLayout] = useState<LayoutMode>("grid");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return campaigns.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [campaigns, statusFilter, search]);

  const published = filtered.filter((c) => c.status === "live" || c.status === "scheduled");
  const unpublished = filtered.filter((c) => c.status !== "live" && c.status !== "scheduled");

  const label = type === "badge" ? "Badges" : "Banners";
  const gridClass = type === "badge" ? "campaign-grid campaign-grid--4" : "campaign-grid campaign-grid--2";

  const handleSelectOne = (id: string, checked: boolean) => {
    const newIds = new Set(selectedIds);
    if (checked) {
      newIds.add(id);
    } else {
      newIds.delete(id);
    }
    setSelectedIds(newIds);
  };

  const handleDuplicateSelected = () => {
    const selectedCampaigns = filtered.filter((c) => selectedIds.has(c.id));
    selectedCampaigns.forEach((campaign) => {
      const duplicate = { ...campaign, id: `camp_${Date.now()}`, name: `${campaign.name} (Copy)`, status: "draft" as const };
      // In a real app, this would call an onDuplicate callback or API
      console.log("Duplicate campaign:", duplicate);
    });
    setSelectedIds(new Set());
  };

  const handleBulkStatusChange = (newStatus: CampaignStatus) => {
    const selectedCampaigns = filtered.filter((c) => selectedIds.has(c.id));
    selectedCampaigns.forEach((campaign) => {
      // In a real app, this would call an onBulkStatusChange callback or API
      console.log("Change status:", campaign.id, newStatus);
    });
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = () => {
    if (confirm(`Delete ${selectedIds.size} campaign(s)? This cannot be undone.`)) {
      selectedIds.forEach((id) => {
        // In a real app, this would call an onDelete callback or API
        console.log("Delete campaign:", id);
      });
      setSelectedIds(new Set());
    }
  };

  return (
    <div className="campaign-list">
      <div className="campaign-list-head">
        <h1>{label}</h1>
        <div className="campaign-list-actions">
          <div className="layout-toggle">
            <button
              className={`layout-btn ${layout === "grid" ? "active" : ""}`}
              onClick={() => setLayout("grid")}
              aria-label="Grid layout"
            >
              ▦ Layouts
            </button>
          </div>
          <button className="primary-btn" onClick={onAdd}>
            + Add {type}
          </button>
        </div>
      </div>

      <div className="campaign-toolbar">
        <div className="filter-pills">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              className={`filter-pill ${statusFilter === f.value ? "active" : ""}`}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          className="campaign-search"
          placeholder={`Search ${label.toLowerCase()}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={`Search ${label.toLowerCase()}`}
        />
      </div>

      {selectedIds.size > 0 && (
        <div className="bulk-actions-bar">
          <div className="bulk-selection-info">
            <strong>{selectedIds.size}</strong> campaign(s) selected
          </div>
          <div className="bulk-actions-buttons">
            <button className="ghost-btn" onClick={handleDuplicateSelected}>
              📋 Duplicate
            </button>
            <button className="ghost-btn" onClick={() => handleBulkStatusChange("live")}>
              ▶ Publish
            </button>
            <button className="ghost-btn" onClick={() => handleBulkStatusChange("paused")}>
              ⏸ Pause
            </button>
            <button className="ghost-btn" onClick={() => handleBulkStatusChange("archived")}>
              📦 Archive
            </button>
            <button className="ghost-btn warn-btn" onClick={handleDeleteSelected}>
              🗑 Delete
            </button>
            <button className="ghost-btn" onClick={() => setSelectedIds(new Set())}>
              Clear
            </button>
          </div>
        </div>
      )}

      {published.length > 0 && (
        <>
          <h3 className="section-divider">Published</h3>
          <div className={layout === "grid" ? gridClass : "campaign-list-view"}>
            {published.map((c) => (
              <CampaignCard 
                key={c.id} 
                campaign={c} 
                onEdit={onEdit} 
                isSelected={selectedIds.has(c.id)}
                onSelect={handleSelectOne}
              />
            ))}
          </div>
        </>
      )}

      {unpublished.length > 0 && (
        <>
          <h3 className="section-divider">Unpublished</h3>
          <div className={layout === "grid" ? gridClass : "campaign-list-view"}>
            {unpublished.map((c) => (
              <CampaignCard 
                key={c.id} 
                campaign={c} 
                onEdit={onEdit} 
                isSelected={selectedIds.has(c.id)}
                onSelect={handleSelectOne}
              />
            ))}
          </div>
        </>
      )}

      {filtered.length === 0 && (
        <div className="empty-state">
          <p>No {label.toLowerCase()} found.</p>
          <button className="primary-btn" onClick={onAdd}>
            + Create your first {type}
          </button>
        </div>
      )}
    </div>
  );
}
