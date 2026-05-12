type Props = {
  activeApp: string;
  onNavigate: (view: string) => void;
};

const appNav = ["Overview", "Badges", "Banners", "Settings"];

function NavIcon({ item }: { item: string }) {
  if (item === "Overview") {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true" className="side-link-icon">
        <path d="M3 10.1 10 4l7 6.1V17h-5v-4H8v4H3z" fill="currentColor" />
      </svg>
    );
  }

  if (item === "Badges") {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true" className="side-link-icon">
        <path d="M6 3h8l3 3v8l-3 3H6l-3-3V6zm4 3.1L7.6 8.4l.5 3.2L10 10l2 1.6.5-3.2z" fill="currentColor" />
      </svg>
    );
  }

  if (item === "Banners") {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true" className="side-link-icon">
        <path d="M3 5h14v8H6.8L4 15V13H3zm3 3v2h8V8z" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="side-link-icon">
      <path d="m11.1 2 .4 1.7c.4.1.8.3 1.2.5l1.6-.9 1.6 1.6-.9 1.6c.2.4.4.8.5 1.2L18 8.9v2.2l-1.7.4a5 5 0 0 1-.5 1.2l.9 1.6-1.6 1.6-1.6-.9c-.4.2-.8.4-1.2.5L11.1 18H8.9l-.4-1.7a5 5 0 0 1-1.2-.5l-1.6.9-1.6-1.6.9-1.6a5 5 0 0 1-.5-1.2L2 11.1V8.9l1.7-.4c.1-.4.3-.8.5-1.2l-.9-1.6 1.6-1.6 1.6.9c.4-.2.8-.4 1.2-.5L8.9 2zM10 13.1A3.1 3.1 0 1 0 10 6.9a3.1 3.1 0 0 0 0 6.2" fill="currentColor" />
    </svg>
  );
}

export default function Sidebar({ activeApp, onNavigate }: Props) {
  return (
    <aside className="sidebar">
      <div className="side-brand">
        <h2>GCW Campaigns</h2>
        <p>Badges, banners, and storefront messaging</p>
      </div>
      <div className="side-label">Workspace</div>
      <div className="side-section">
        {appNav.map((item) => (
          <button
            key={item}
            className={`side-link ${item === activeApp ? "active app-active" : ""}`}
            onClick={() => onNavigate(item)}
          >
            <NavIcon item={item} />
            <span>{item}</span>
          </button>
        ))}
      </div>
      <div className="side-footer">Gerber Childrenswear</div>
    </aside>
  );
}
