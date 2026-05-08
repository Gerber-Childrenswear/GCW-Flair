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

const statCards = [
  { title: "Badges", published: 13, scheduled: 1, unpublished: 263 },
  { title: "Banners", published: 10, scheduled: 1, unpublished: 194 },
];

const quickActions = [
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

function render() {
  const app = document.getElementById("app");
  if (!app) return;

  app.innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <div class="topbar-brand">Shopify</div>
        <div class="topbar-search-wrap">
          <input class="topbar-search" placeholder="Search" aria-label="Search" />
        </div>
        <div class="topbar-user">Gerber Childrenswear</div>
      </header>

      <div class="workspace">
        <aside class="sidebar">
          <div class="side-section">
            ${sideNav
              .map((item) => `<button class="side-link ${item === "Home" ? "active" : ""}">${item}</button>`)
              .join("")}
          </div>
          <div class="side-label">Apps</div>
          <div class="side-section">
            ${appNav
              .map(
                (item) =>
                  `<button class="side-link ${item === "Dashboard" ? "active app-active" : ""}">${item}</button>`,
              )
              .join("")}
          </div>
          <div class="side-footer">Settings</div>
        </aside>

        <main class="content">
          <section class="page-head">
            <h1>Flair Next</h1>
          </section>

          <section class="stats-grid">
            ${statCards
              .map(
                (card) => `
              <article class="panel stat-panel">
                <div class="panel-head">
                  <h2>${card.title}</h2>
                  <button class="ghost-btn">View ${card.title.toLowerCase()}</button>
                </div>
                <div class="status-list">
                  <div class="status-row"><span class="dot ok"></span><span>${card.published} Published</span></div>
                  <div class="status-row"><span class="dot warn"></span><span>${card.scheduled} Scheduled</span></div>
                  <div class="status-row"><span class="dot idle"></span><span>${card.unpublished} Unpublished</span></div>
                </div>
              </article>`,
              )
              .join("")}
          </section>

          <section class="quick-grid">
            ${quickActions
              .map(
                (item) => `
              <article class="panel quick-panel">
                <div class="panel-head">
                  <h3>${item.title}</h3>
                  <button class="ghost-btn">${item.cta}</button>
                </div>
                <p>${item.subtitle}</p>
              </article>`,
              )
              .join("")}
          </section>

          <section class="help-grid">
            <article class="panel help-main">
              <h3>Help center</h3>
              <ul>
                ${helpItems.map((item) => `<li>${item}</li>`).join("")}
              </ul>
            </article>
            <article class="panel promo-panel">
              <p class="promo-kicker">FROM THE BLOG</p>
              <h3>How to Sell on Shopify - Probably The Most Useful Guide You Will Read</h3>
            </article>
          </section>
        </main>
      </div>
    </div>
  `;
}

render();
