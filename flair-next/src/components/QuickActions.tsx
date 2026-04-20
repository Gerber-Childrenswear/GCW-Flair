type QuickAction = {
  title: string;
  subtitle: string;
  cta: string;
};

const quickActions: QuickAction[] = [
  {
    title: "Theme status",
    subtitle: "Flair is enabled\n3 app blocks detected",
    cta: "Inspect",
  },
  {
    title: "Automation health",
    subtitle: "2 scheduled launches\n4 always-on promotions",
    cta: "Open",
  },
  {
    title: "Template library",
    subtitle: "Start from proven conversion templates for badges and banners.",
    cta: "Browse",
  },
];

export default function QuickActions() {
  return (
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
  );
}
