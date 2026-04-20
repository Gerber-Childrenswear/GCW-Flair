type Props = {
  activeApp: string;
  onNavigate: (view: string) => void;
};

const appNav = ["Dashboard", "Badges", "Banners", "Templates", "Automations", "Countdowns", "Analytics", "Settings"];

export default function Sidebar({ activeApp, onNavigate }: Props) {
  return (
    <aside className="sidebar">
      <div className="side-brand">
        <h2>Flair Next</h2>
        <p>Conversion Studio</p>
      </div>
      <div className="side-label">Workspace</div>
      <div className="side-section">
        {appNav.map((item) => (
          <button
            key={item}
            className={`side-link ${item === activeApp ? "active app-active" : ""}`}
            onClick={() => onNavigate(item)}
          >
            {item === "Dashboard" ? "Overview" : item}
          </button>
        ))}
      </div>
      <div className="side-footer">Flair Product Badges + CRO</div>
    </aside>
  );
}
