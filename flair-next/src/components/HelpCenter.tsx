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
    <section className="row g-4">
      <div className="col-12 col-md-8">
        <article className="panel help-main h-100">
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
      </div>
      <div className="col-12 col-md-4">
        <article className="panel promo-panel h-100">
          <p className="promo-kicker">FROM THE BLOG</p>
          <h3>How to combine badges, timers, and cart promos without hurting UX</h3>
          <button className="ghost-btn" onClick={() => onNavigate("Templates")}>Open templates</button>
        </article>
      </div>
    </section>
  );
}
