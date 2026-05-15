import { useState, useCallback, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import StatCards from "./components/StatCards";
import QuickActions from "./components/QuickActions";
import CampaignList from "./components/CampaignList";
import CampaignEditor from "./components/CampaignEditor";
import BadgeEditor from "./components/BadgeEditor";
import Settings from "./components/Settings";
import GlobalStyles from "./components/GlobalStyles";
import AutomationCenter from "./components/AutomationCenter";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
// CountdownManager intentionally not imported — countdowns are a Banner
// sub-feature, not a standalone surface (see brief Decision #2 update on
// 2026-05-15). The file is kept for now as scaffolding reference.
import { generateId, mockBadges, mockBanners } from "./data/mock-campaigns";
import { getDefaultDesignSystemConfig, getDesignPresetById } from "./data/design-system";
import { buildCampaignPlacements, type LayoutDefinition } from "./data/layout-library";
import { createCampaign, fetchCampaigns, updateCampaign } from "./api/client";
import type { Campaign, CampaignType } from "./types/campaign";

type EditorState = {
  type: "badge" | "banner";
  campaign: Campaign | null;
};

function createCampaignDraft(type: CampaignType, layout?: LayoutDefinition): Campaign {
  const now = new Date().toISOString();
  const id = generateId();
  const rootGroupId = `rg_root_${id}`;
  const designSystemConfig = getDefaultDesignSystemConfig();
  const defaultPreset = getDesignPresetById(designSystemConfig.defaultPresetId);

  return {
    id,
    type,
    status: "draft",
    name: layout ? layout.name : "",
    creative: {
      text: "",
      backgroundColor: defaultPreset?.creative.backgroundColor ?? "#1a3a5c",
      textColor: defaultPreset?.creative.textColor ?? "#ffffff",
      borderColor: defaultPreset?.creative.borderColor ?? "#1a3a5c",
      stylePreset: defaultPreset?.creative.stylePreset ?? "solid-dark",
      contentMode: "text",
      textSize: defaultPreset?.creative.textSize ?? "14px",
      fontWeight: defaultPreset?.creative.fontWeight ?? "700",
      paddingPreset: defaultPreset?.creative.paddingPreset ?? "normal",
      letterSpacingPreset: defaultPreset?.creative.letterSpacingPreset ?? "normal",
      borderWidthPreset: defaultPreset?.creative.borderWidthPreset ?? "thin",
      shadowPreset: defaultPreset?.creative.shadowPreset ?? "none",
      cornerPreset: type === "banner" ? "square" : "rounded",
    },
    ruleGroups: [
      { id: rootGroupId, parentGroupId: null, operator: "AND", includeMode: "include", sortOrder: 0 },
    ],
    ruleConditions: [],
    placements: layout ? buildCampaignPlacements(layout) : [],
    priority: 10,
    conflictMode: "replace",
    schedule: { startsAt: null, endsAt: null, timezone: "America/New_York", isActive: false, timeOfDayStart: "00:00", timeOfDayEnd: "03:00" },
    targetScope: "product",
    promotionGroup: null,
    automationMode: "manual",
    countdown: {
      enabled: false,
      label: "Sale ends in",
      endsAt: null,
      urgencyThresholdHours: 24,
    },
    linkUrl: null,
    tags: layout ? [layout.id] : [],
    styleConfig: {
      customCssRaw: "",
      customCssScoped: "",
      safeMode: "balanced",
    },
    designSystemConfig,
    createdAt: now,
    updatedAt: now,
  };
}

export default function App() {
  const [activeView, setActiveView] = useState("Overview");
  // activeLayoutLibrary removed (2026-05-15): Layouts moved to Settings →
  // Theme as an admin-curated surface. Coordinators no longer reach them
  // from Badges/Banners; they pick by name inside the campaign editor.
  const [badges, setBadges] = useState<Campaign[]>(mockBadges);
  const [banners, setBanners] = useState<Campaign[]>(mockBanners);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [notice, setNotice] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const all = await fetchCampaigns();
        if (cancelled) return;

        setBadges(all.filter((c) => c.type === "badge"));
        setBanners(all.filter((c) => c.type === "banner"));
        setNotice("");
      } catch {
        if (cancelled) return;
        setNotice("Using local data fallback. API fetch failed.");
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleNavigate = useCallback((view: string) => {
    setActiveView(view);
    setEditor(null);
  }, []);

  const handleEdit = useCallback(
    (id: string) => {
      const all = [...badges, ...banners];
      const found = all.find((c) => c.id === id);
      if (found) {
        setEditor({ type: found.type, campaign: found });
      }
    },
    [badges, banners],
  );

  const handleAdd = useCallback(
    (type: "badge" | "banner") => {
      setEditor({ type, campaign: null });
    },
    [],
  );

  // handleSelectLayout is invoked from Settings → Theme → Badge/Banner Layouts
  // when an admin clicks a layout. For now, opens a new campaign editor with
  // that layout pre-filled — preserves the original behavior of LayoutLibrary
  // but now reachable from the admin Settings surface rather than the
  // contextual Badges/Banners view.
  const handleSelectLayout = useCallback((layout: LayoutDefinition) => {
    setEditor({ type: layout.type, campaign: createCampaignDraft(layout.type, layout) });
  }, []);

  const handleSave = useCallback(
    async (campaign: Campaign) => {
      const all = [...badges, ...banners];
      const exists = all.some((c) => c.id === campaign.id);

      try {
        const saved = exists
          ? await updateCampaign(campaign.id, campaign)
          : await createCampaign(campaign);

        if (saved.type === "badge") {
          setBadges((prev) => {
            const idx = prev.findIndex((c) => c.id === saved.id);
            return idx >= 0
              ? prev.map((c) => (c.id === saved.id ? saved : c))
              : [...prev, saved];
          });
        } else {
          setBanners((prev) => {
            const idx = prev.findIndex((c) => c.id === saved.id);
            return idx >= 0
              ? prev.map((c) => (c.id === saved.id ? saved : c))
              : [...prev, saved];
          });
        }

        setNotice("");
      } catch {
        // If API fails, keep local save behavior so user can still use the app.
        if (campaign.type === "badge") {
          setBadges((prev) => {
            const idx = prev.findIndex((c) => c.id === campaign.id);
            return idx >= 0
              ? prev.map((c) => (c.id === campaign.id ? campaign : c))
              : [...prev, campaign];
          });
        } else {
          setBanners((prev) => {
            const idx = prev.findIndex((c) => c.id === campaign.id);
            return idx >= 0
              ? prev.map((c) => (c.id === campaign.id ? campaign : c))
              : [...prev, campaign];
          });
        }

        setNotice("Saved locally. API save failed.");
      }

      setEditor(null);
    },
    [badges, banners],
  );

  const handleBulkDuplicate = useCallback((ids: Set<string>) => {
    const allCampaigns = [...badges, ...banners];
    const toDuplicate = allCampaigns.filter((c) => ids.has(c.id));

    toDuplicate.forEach((campaign) => {
      const newId = generateId();
      const duplicate: Campaign = {
        ...campaign,
        id: newId,
        name: `${campaign.name} (Copy)`,
        status: "draft",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (campaign.type === "badge") {
        setBadges((prev) => [...prev, duplicate]);
      } else {
        setBanners((prev) => [...prev, duplicate]);
      }
    });
  }, [badges, banners]);

  const handleBulkStatusChange = useCallback((ids: Set<string>, newStatus: Campaign["status"]) => {
    const allCampaigns = [...badges, ...banners];
    const toUpdate = allCampaigns.filter((c) => ids.has(c.id));

    toUpdate.forEach((campaign) => {
      const updated = { ...campaign, status: newStatus, updatedAt: new Date().toISOString() };

      if (campaign.type === "badge") {
        setBadges((prev) => prev.map((c) => (c.id === campaign.id ? updated : c)));
      } else {
        setBanners((prev) => prev.map((c) => (c.id === campaign.id ? updated : c)));
      }
    });
  }, []);

  const handleBulkDelete = useCallback((ids: Set<string>) => {
    setBadges((prev) => prev.filter((c) => !ids.has(c.id)));
    setBanners((prev) => prev.filter((c) => !ids.has(c.id)));
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditor(null);
  }, []);

  const allCampaigns = [...badges, ...banners];
  const activeViewLabel = activeView;

  // If editor is open, show it. Badge edits use the lean BadgeEditor;
  // banner edits stay on the legacy CampaignEditor for now.
  if (editor) {
    const isBadge = editor.type === "badge";
    return (
      <div className="app-shell">
        <div className="workspace">
          <Sidebar activeApp={activeView} onNavigate={handleNavigate} />
          <main className="content">
            {!isBadge && (
              <section className="workspace-head">
                <div>
                  <p className="workspace-kicker">Gerber Childrenswear</p>
                  <h1>Campaign Builder</h1>
                </div>
                <div className="workspace-head-actions">
                  <span className="workspace-pill">Live mode</span>
                </div>
              </section>
            )}
            {notice && <div className="panel placeholder-msg">{notice}</div>}
            {isBadge ? (
              <BadgeEditor
                campaign={editor.campaign}
                onSave={handleSave}
                onCancel={handleCancelEdit}
              />
            ) : (
              <CampaignEditor
                campaign={editor.campaign}
                type={editor.type}
                onSave={handleSave}
                onCancel={handleCancelEdit}
              />
            )}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="workspace">
        <Sidebar activeApp={activeView} onNavigate={handleNavigate} />

        <main className="content">
          <section className="workspace-head">
            <div>
              <p className="workspace-kicker">Gerber Childrenswear</p>
              <h1>{activeViewLabel}</h1>
            </div>
            <div className="workspace-head-actions">
              <span className="workspace-pill">{allCampaigns.filter((c) => c.status === "live").length} live</span>
              <button className="ghost-btn" onClick={() => handleAdd("badge")}>+ New badge</button>
              <button className="ghost-btn" onClick={() => handleAdd("banner")}>+ New banner</button>
            </div>
          </section>

          {notice && <div className="panel placeholder-msg">{notice}</div>}
          {activeView === "Overview" && (
            <div className="row g-4">
              <StatCards campaigns={allCampaigns} onViewSection={handleNavigate} />
              <QuickActions onNavigate={handleNavigate} />
            </div>
          )}

          {activeView === "Badges" && (
            <CampaignList
              campaigns={badges}
              type="badge"
              onEdit={handleEdit}
              onAdd={() => handleAdd("badge")}
              onBulkDuplicate={handleBulkDuplicate}
              onBulkStatusChange={handleBulkStatusChange}
              onBulkDelete={handleBulkDelete}
            />
          )}

          {activeView === "Banners" && (
            <CampaignList
              campaigns={banners}
              type="banner"
              onEdit={handleEdit}
              onAdd={() => handleAdd("banner")}
              onBulkDuplicate={handleBulkDuplicate}
              onBulkStatusChange={handleBulkStatusChange}
              onBulkDelete={handleBulkDelete}
            />
          )}

          {activeView === "Global Styles" && <GlobalStyles />}

          {activeView === "Campaigns" && (
            <div className="row g-4">
              <div className="col-12">
                <article className="panel">
                  <h2>Campaigns</h2>
                  <p style={{ color: "var(--text-secondary)", marginTop: "var(--space-3)" }}>
                    Time-bounded promotional bundles that group Badges, Banners, and Countdowns under one
                    launch. Soft-linked to the broader Onsite Campaigns program via a free-text{" "}
                    <code>associated_campaign</code> field.
                  </p>
                  <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: "var(--space-2)" }}>
                    Surface coming next — architectural decisions are in the brief
                    (<code>Projects/2026-05-flair-app-redesign/_brief.md</code>, Decision #3).
                  </p>
                </article>
              </div>
            </div>
          )}

          {activeView === "Automations" && <AutomationCenter campaigns={allCampaigns} />}

          {activeView === "Analytics" && <AnalyticsDashboard campaigns={allCampaigns} />}

          {activeView === "Settings" && (
            <Settings onNavigate={handleNavigate} onSelectLayout={handleSelectLayout} />
          )}
        </main>
      </div>
    </div>
  );
}



