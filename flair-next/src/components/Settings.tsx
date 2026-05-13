import { useState } from "react";
import SettingsColors from "./SettingsColors";

type SettingsProps = {
  onNavigate: (view: string) => void;
};

// Sub-pages within Settings. "general" is Nick's existing settings content;
// "colors" is the new brand palette manager (Decision #5 in the vision brief).
type SettingsSubView = "general" | "colors";

export default function Settings({ onNavigate }: SettingsProps) {
  const [subView, setSubView] = useState<SettingsSubView>("general");

  if (subView === "colors") {
    return (
      <div>
        <button
          type="button"
          onClick={() => setSubView("general")}
          style={{ margin: "16px 32px 0", background: "transparent", border: "none", cursor: "pointer", color: "#667f8e", fontSize: 12 }}
        >
          ‹ Back to Settings
        </button>
        <SettingsColors />
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-page-head">
        <h1>Settings</h1>
      </div>

      <div className="settings-group">
        <div className="settings-group-title">General</div>

        <div className="settings-card-surface">
          <div className="settings-row settings-row--status">
            <div className="settings-icon settings-icon--status">✓</div>
            <div className="settings-info">
              <div className="settings-info-title">App status</div>
              <div className="settings-info-subtitle">Campaign app is enabled</div>
            </div>
            <div className="settings-action">
              <button className="ghost-btn settings-action-btn" onClick={() => onNavigate("Overview")}>Disable</button>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-group-title">Brand</div>

        <div className="settings-card-surface">
          <button className="settings-row settings-row--nav" onClick={() => setSubView("colors")}>
            <span className="settings-icon settings-icon--nav">◐</span>
            <span className="settings-info">
              <span className="settings-info-title">Colors</span>
              <span className="settings-info-subtitle muted">Brand palette — the single source of truth for hex values. Styles consume these by name.</span>
            </span>
            <span className="settings-chevron">›</span>
          </button>
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-group-title">Theme</div>

        <div className="settings-card-surface">
          <button className="settings-row settings-row--nav" onClick={() => onNavigate("Badges")}>
            <span className="settings-icon settings-icon--nav">⛭</span>
            <span className="settings-info">
              <span className="settings-info-title">Theme setup</span>
              <span className="settings-info-subtitle muted">Configure badges and banners in your storefront theme.</span>
            </span>
            <span className="settings-chevron">›</span>
          </button>

          <button className="settings-row settings-row--nav" onClick={() => onNavigate("Banners")}>
            <span className="settings-icon settings-icon--nav">⇆</span>
            <span className="settings-info">
              <span className="settings-info-title">Theme triggers</span>
              <span className="settings-info-subtitle muted">0 triggers configured</span>
            </span>
            <span className="settings-chevron">›</span>
          </button>
        </div>
      </div>
    </div>
  );
}
