type QuickAction = {
  title: string;
  subtitle: string;
  cta: string;
};

const quickActions: QuickAction[] = [
  {
    title: "Theme status",
    subtitle: "Campaign app is enabled\n3 app blocks detected",
    cta: "Inspect",
  },
  {
    title: "Badge inventory",
    subtitle: "Review all active badges\nand queued launches.",
    cta: "Open",
  },
  {
    title: "Banner inventory",
    subtitle: "Review all active banners\nand placement coverage.",
    cta: "Open",
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
    if (title === "Badge inventory") {
      onNavigate("Badges");
      return;
    }
    if (title === "Banner inventory") {
      onNavigate("Banners");
    }
  };

  return (
    <>
      {quickActions.map((item) => (
        <div key={item.title} className="col-12 col-md-6 col-lg-4">
          <article className="panel quick-panel h-100">
            <div className="panel-head">
              <h3>{item.title}</h3>
              <button className="ghost-btn" onClick={() => handleAction(item.title)}>{item.cta}</button>
            </div>
            <p>{item.subtitle}</p>
          </article>
        </div>
      ))}
    </>
  );
}
