type Props = {
  activeView: string;
};

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="topbar-icon">
      <path d="M13.5 12h-.8l-.3-.3a5 5 0 1 0-.7.7l.3.3v.8L16.5 18 18 16.5zM8.5 12A3.5 3.5 0 1 1 12 8.5 3.5 3.5 0 0 1 8.5 12" fill="currentColor" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="topbar-icon">
      <path d="M10 2.5a4 4 0 0 0-4 4v2c0 .8-.3 1.6-.8 2.2L4 12.2V14h12v-1.8l-1.2-1.5a3.5 3.5 0 0 1-.8-2.2v-2a4 4 0 0 0-4-4m0 15a2.3 2.3 0 0 1-2.1-1.5h4.2A2.3 2.3 0 0 1 10 17.5" fill="currentColor" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="topbar-icon">
      <path d="m11.1 2 .4 1.7c.4.1.8.3 1.2.5l1.6-.9 1.6 1.6-.9 1.6c.2.4.4.8.5 1.2L18 8.9v2.2l-1.7.4a5 5 0 0 1-.5 1.2l.9 1.6-1.6 1.6-1.6-.9c-.4.2-.8.4-1.2.5L11.1 18H8.9l-.4-1.7a5 5 0 0 1-1.2-.5l-1.6.9-1.6-1.6.9-1.6a5 5 0 0 1-.5-1.2L2 11.1V8.9l1.7-.4c.1-.4.3-.8.5-1.2l-.9-1.6 1.6-1.6 1.6.9c.4-.2.8-.4 1.2-.5L8.9 2zM10 13.1A3.1 3.1 0 1 0 10 6.9a3.1 3.1 0 0 0 0 6.2" fill="currentColor" />
    </svg>
  );
}

export default function Topbar({ activeView }: Props) {
  return (
    <header className="topbar">
      <div className="topbar-shopify">Shopify</div>
      <div className="topbar-search-wrap">
        <div className="topbar-search-shell">
          <SearchIcon />
          <input className="topbar-search" type="text" placeholder="Search" aria-label="Search" />
          <span className="topbar-shortcut">Ctrl K</span>
        </div>
      </div>
      <div className="topbar-actions">
        <button className="topbar-action-btn" aria-label="Admin settings">
          <SettingsIcon />
        </button>
        <button className="topbar-action-btn" aria-label="Notifications">
          <AlertIcon />
        </button>
        <div className="topbar-storefront">
          <span className="topbar-avatar">GC</span>
          <div className="topbar-storefront-copy">
            <span className="topbar-storefront-name">Gerber Childrenswear</span>
            <span className="topbar-storefront-view">{activeView}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
