import { DESIGN_ASSETS, DESIGN_PRESETS, GERBER_COLORS, getDefaultDesignSystemConfig, getDesignPresetById } from "../data/design-system";

function toClassToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function GlobalStyles() {
  const config = getDefaultDesignSystemConfig();
  const defaultPreset = getDesignPresetById(config.defaultPresetId);
  const defaultToneClass = `global-styles-swatch--${defaultPreset?.creative.stylePreset ?? "custom"}`;

  return (
    <div className="global-styles-page">
      <section className="stats-grid">
        <article className="panel stat-panel">
          <div className="panel-head">
            <h2>Default style</h2>
            <span className="workspace-pill">Applied to new campaigns</span>
          </div>
          <div className="global-styles-default">
            <div className={`global-styles-default-swatch ${defaultToneClass}`}>
              <span>{defaultPreset?.label ?? "Default preset"}</span>
              <strong>Campaign default</strong>
            </div>
            <p className="campaign-hub-copy">New badges and banners inherit this system preset before campaign-level overrides are applied.</p>
          </div>
        </article>

        <article className="panel stat-panel">
          <div className="panel-head">
            <h2>Rule coverage</h2>
            <span className="workspace-pill">Automatic mapping</span>
          </div>
          <div className="status-list">
            <div className="status-row">
              <span className="dot ok" />
              <span>{config.productTagRules.length} product tag rules</span>
            </div>
            <div className="status-row">
              <span className="dot warn" />
              <span>{config.metafieldRules.length} metafield rules</span>
            </div>
            <div className="status-row">
              <span className="dot idle" />
              <span>{config.metaobjectRules.length} metaobject rules</span>
            </div>
          </div>
        </article>
      </section>

      <section className="panel campaign-hub-panel">
        <div className="panel-head">
          <div>
            <h2>Preset library</h2>
            <p className="campaign-hub-copy">These are the house presets currently available across the editor, previews, and list cards.</p>
          </div>
        </div>
        <div className="global-styles-preset-grid">
          {DESIGN_PRESETS.map((preset) => (
            <article key={preset.id} className="global-styles-preset-card">
              <div className={`global-styles-preset-swatch global-styles-swatch--${preset.creative.stylePreset ?? "custom"}`}>
                {preset.label}
              </div>
              <div className="campaign-hub-meta">{preset.id}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="quick-grid global-styles-bottom-grid">
        <article className="panel quick-panel">
          <div className="panel-head">
            <h3>Style assets</h3>
          </div>
          <div className="global-styles-list">
            {DESIGN_ASSETS.map((asset) => (
              <div key={asset.id} className="global-styles-list-row">
                <strong>{asset.label}</strong>
                <span>{asset.description}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel quick-panel">
          <div className="panel-head">
            <h3>Brand palette</h3>
          </div>
          <div className="global-styles-color-grid">
            {GERBER_COLORS.slice(0, 10).map((color) => (
              <div key={color.name} className="global-styles-color-chip">
                <span className={`global-styles-color-dot global-styles-color-dot--${toClassToken(color.name)}`} />
                <span>{color.name}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel quick-panel">
          <div className="panel-head">
            <h3>Current direction</h3>
          </div>
          <p>Global styles now act as the shared starting point for badges and banners, which keeps the UI aligned with the campaign-first model you asked for.</p>
        </article>
      </section>
    </div>
  );
}