const helpItems = [
  "Launch your first badge in under 5 minutes",
  "Build stack + group promotion logic",
  "Troubleshoot theme app blocks and placement slots",
];

export default function HelpCenter() {
  return (
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
        <h3>How to combine badges, timers, and cart promos without hurting UX</h3>
      </article>
    </section>
  );
}
