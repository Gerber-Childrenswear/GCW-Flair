export default function Settings() {
  return (
    <div className="settings-page">
      <h1>Settings</h1>

      <div className="settings-group">
        <div className="settings-group-title">General</div>

        <div className="settings-row">
          <div className="settings-icon">✓</div>
          <div className="settings-info">
            <div className="settings-info-title">Flair status</div>
            <div className="settings-info-subtitle">Flair is enabled</div>
          </div>
          <div className="settings-action">
            <button className="ghost-btn">Disable</button>
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-icon">⊞</div>
          <div className="settings-info">
            <div className="settings-info-title">Billing plan</div>
            <div className="settings-info-subtitle muted">Grow $49</div>
          </div>
          <div className="settings-action">
            <span className="settings-chevron">›</span>
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-icon">⊕</div>
          <div className="settings-info">
            <div className="settings-info-title">Languages</div>
            <div className="settings-info-subtitle muted">No additional languages enabled</div>
          </div>
          <div className="settings-action">
            <span className="settings-chevron">›</span>
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-icon">⚡</div>
          <div className="settings-info">
            <div className="settings-info-title">Flair generation</div>
            <div className="settings-info-subtitle muted">You're using Flair Gen 3.</div>
          </div>
          <div className="settings-action">
            <span className="settings-chevron">›</span>
          </div>
        </div>
      </div>

      <div className="settings-group">
        <div className="settings-group-title">Theme</div>

        <div className="settings-row">
          <div className="settings-icon">⛭</div>
          <div className="settings-info">
            <div className="settings-info-title">Theme setup</div>
            <div className="settings-info-subtitle muted">Configure Flair in your Shopify theme.</div>
          </div>
          <div className="settings-action">
            <span className="settings-chevron">›</span>
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-icon">⇆</div>
          <div className="settings-info">
            <div className="settings-info-title">Theme triggers</div>
            <div className="settings-info-subtitle muted">0 triggers configured</div>
          </div>
          <div className="settings-action">
            <span className="settings-chevron">›</span>
          </div>
        </div>
      </div>
    </div>
  );
}
