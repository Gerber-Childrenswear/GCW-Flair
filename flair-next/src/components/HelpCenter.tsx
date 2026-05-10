const helpItems = [
  "Launch your first badge in under 5 minutes",
  "Build stack + group promotion logic",
  "Troubleshoot theme app blocks and placement slots",
];

type HelpCenterProps = {
  onNavigate: (view: string) => void;
};

export default function HelpCenter({ onNavigate }: HelpCenterProps) {
  const routeForIndex = (index: number) => {
    if (index === 0) return "Badges";
    if (index === 1) return "Automations";
    return "Settings";
  };

  return (
    <section className="help-grid">
      <article className="panel help-main">
        <h3>Help center</h3>
        <ul>
          {helpItems.map((item, index) => (
            <li key={item}>
              <button className="ghost-btn" onClick={() => onNavigate(routeForIndex(index))}>
                {item}
              </button>
            </li>
          ))}
        </ul>
      </article>
      <article className="panel promo-panel">
        <p className="promo-kicker">FROM THE BLOG</p>
        <h3>How to combine badges, timers, and cart promos without hurting UX</h3>
        <button className="ghost-btn" onClick={() => onNavigate("Templates")}>Open templates</button>
      </article>
    </section>
  );
}
