export default function Topbar() {
  return (
    <header className="topbar">
      <div className="topbar-brand">Shopify</div>
      <div className="topbar-search-wrap">
        <input className="topbar-search" placeholder="Search" aria-label="Search" />
      </div>
      <div className="topbar-user">Gerber Childrenswear</div>
    </header>
  );
}
