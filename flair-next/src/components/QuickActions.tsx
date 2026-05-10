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

type QuickActionsProps = {
  onNavigate: (view: string) => void;
};

export default function QuickActions({ onNavigate }: QuickActionsProps) {
  const handleAction = (title: string) => {
    if (title === "Theme status") {
      onNavigate("Settings");
      return;
    }
    if (title === "Automation health") {
      onNavigate("Automations");
      return;
    }
    if (title === "Template library") {
      onNavigate("Templates");
    }
  };

  return (
    <section className="quick-grid">
      {quickActions.map((item) => (
        <article key={item.title} className="panel quick-panel">
          <div className="panel-head">
            <h3>{item.title}</h3>
            <button className="ghost-btn" onClick={() => handleAction(item.title)}>{item.cta}</button>
          </div>
          <p>{item.subtitle}</p>
        </article>
      ))}
    </section>
  );
}
