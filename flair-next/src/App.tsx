type StatCard = {
  title: string;
  published: number;
  scheduled: number;
  unpublished: number;
};

type QuickAction = {
  title: string;
  subtitle: string;
  cta: string;
};

const statCards: StatCard[] = [
  { title: "Badges", published: 13, scheduled: 1, unpublished: 263 },
  { title: "Banners", published: 10, scheduled: 1, unpublished: 194 },
];

const quickActions: QuickAction[] = [
  {
    title: "Theme status",
    subtitle: "Flair is enabled\n2 blocks detected",
    cta: "View",
  },
  {
    title: "Product updates",
    subtitle: "Flair Promotions Now\nSupport Native Translations",
    cta: "View all",
  },
  {
    title: "Need some inspiration?",
    subtitle: "Browse the gallery to start with customizable templates.",
    cta: "Visit gallery",
  },
];

const helpItems = [
  "How to get started",
  "How to run a promotion",
  "How to troubleshoot",
];

const sideNav = [
  "Home",
  "Orders",
  "Products",
  "Customers",
  "Marketing",
  "Discounts",
  "Content",
  "Markets",
  "Finance",
  "Analytics",
];

const appNav = ["Dashboard", "Badges", "Banners", "Settings"];

export default function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">Shopify</div>
        <div className="topbar-search-wrap">
          <input className="topbar-search" placeholder="Search" aria-label="Search" />
        </div>
        <div className="topbar-user">Gerber Childrenswear</div>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <div className="side-section">
            {sideNav.map((item) => (
              <button key={item} className={`side-link ${item === "Home" ? "active" : ""}`}>
                {item}
              </button>
            ))}
          </div>
          <div className="side-label">Apps</div>
          <div className="side-section">
            {appNav.map((item) => (
              <button key={item} className={`side-link ${item === "Dashboard" ? "active app-active" : ""}`}>
                {item}
              </button>
            ))}
          </div>
          <div className="side-footer">Settings</div>
        </aside>

        <main className="content">
          <section className="page-head">
            <h1>Flair Next</h1>
          </section>

          <section className="stats-grid">
            {statCards.map((card) => (
              <article key={card.title} className="panel stat-panel">
                <div className="panel-head">
                  <h2>{card.title}</h2>
                  <button className="ghost-btn">View {card.title.toLowerCase()}</button>
                </div>
                <div className="status-list">
                  <div className="status-row">
                    <span className="dot ok" />
                    <span>{card.published} Published</span>
                  </div>
                  <div className="status-row">
                    <span className="dot warn" />
                    <span>{card.scheduled} Scheduled</span>
                  </div>
                  <div className="status-row">
                    <span className="dot idle" />
                    <span>{card.unpublished} Unpublished</span>
                  </div>
                </div>
              </article>
            ))}
          </section>

          <section className="quick-grid">
            {quickActions.map((item) => (
              <article key={item.title} className="panel quick-panel">
                <div className="panel-head">
                  <h3>{item.title}</h3>
                  <button className="ghost-btn">{item.cta}</button>
                </div>
                <p>{item.subtitle}</p>
              </article>
            ))}
          </section>

          <section className="help-grid">
            <article className="panel help-main">
              <h3>Help center</h3>
              <ul>
                {helpItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article className="panel promo-panel">
              <p className="promo-kicker">FROM THE BLOG</p>
              <h3>How to Sell on Shopify - Probably The Most Useful Guide You Will Read</h3>
            </article>
          </section>
        </main>
      </div>
    </div>
  );
}
