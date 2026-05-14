type Props = {
  activeApp: string;
  onNavigate: (view: string) => void;
};

// Order mirrors the vision brief Decision #6 (left menu structure).
// Templates is intentionally omitted — likely deprecated by Global Styles.
const appNav = [
  "Overview",
  "Global Styles",
  "Campaigns",
  "Badges",
  "Banners",
  "Countdowns",
  "Automations",
  "Analytics",
  "Settings",
];

function NavIcon({ item }: { item: string }) {
  switch (item) {
    case "Overview":
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" className="side-link-icon">
          <path d="M3 10.1 10 4l7 6.1V17h-5v-4H8v4H3z" fill="currentColor" />
        </svg>
      );
    case "Global Styles":
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" className="side-link-icon">
          <path
            d="M10 2a8 8 0 0 0 0 16c1.1 0 2-.9 2-2 0-.5-.2-.9-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.4A4.6 4.6 0 0 0 20 6.5C20 3.9 15.5 2 10 2zm-4.5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"
            fill="currentColor"
          />
        </svg>
      );
    case "Campaigns":
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" className="side-link-icon">
          <path
            d="M16 3v14l-7-3.5-3 1.5V12H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h2L13 3l3-1zm-9 9.6v3.4l1.6-.8L7 12.6zM6 7v5h1V7H6z"
            fill="currentColor"
          />
        </svg>
      );
    case "Badges":
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" className="side-link-icon">
          <path d="M6 3h8l3 3v8l-3 3H6l-3-3V6zm4 3.1L7.6 8.4l.5 3.2L10 10l2 1.6.5-3.2z" fill="currentColor" />
        </svg>
      );
    case "Banners":
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" className="side-link-icon">
          <path d="M3 5h14v8H6.8L4 15V13H3zm3 3v2h8V8z" fill="currentColor" />
        </svg>
      );
    case "Countdowns":
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" className="side-link-icon">
          <path
            d="M10 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16zm0 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm0 2a1 1 0 0 1 1 1v3.4l2.3 1.3a1 1 0 1 1-1 1.7l-2.8-1.6A1 1 0 0 1 9 11V7a1 1 0 0 1 1-1z"
            fill="currentColor"
          />
        </svg>
      );
    case "Automations":
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" className="side-link-icon">
          <path d="m11 2-7 10h4l-1 6 7-10h-4l1-6z" fill="currentColor" />
        </svg>
      );
    case "Analytics":
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" className="side-link-icon">
          <path
            d="M3 16h14v2H3v-2zM5 9h2v6H5V9zm4-4h2v10H9V5zm4 6h2v4h-2v-4z"
            fill="currentColor"
          />
        </svg>
      );
    case "Settings":
    default:
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" className="side-link-icon">
          <path d="m11.1 2 .4 1.7c.4.1.8.3 1.2.5l1.6-.9 1.6 1.6-.9 1.6c.2.4.4.8.5 1.2L18 8.9v2.2l-1.7.4a5 5 0 0 1-.5 1.2l.9 1.6-1.6 1.6-1.6-.9c-.4.2-.8.4-1.2.5L11.1 18H8.9l-.4-1.7a5 5 0 0 1-1.2-.5l-1.6.9-1.6-1.6.9-1.6a5 5 0 0 1-.5-1.2L2 11.1V8.9l1.7-.4c.1-.4.3-.8.5-1.2l-.9-1.6 1.6-1.6 1.6.9c.4-.2.8-.4 1.2-.5L8.9 2zM10 13.1A3.1 3.1 0 1 0 10 6.9a3.1 3.1 0 0 0 0 6.2" fill="currentColor" />
        </svg>
      );
  }
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
