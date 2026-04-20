import type { Campaign } from "../types/campaign";

type Props = {
  campaigns: Campaign[];
  onViewSection: (section: string) => void;
};

export default function StatCards({ campaigns, onViewSection }: Props) {
  const badgeCampaigns = campaigns.filter((c) => c.type === "badge");
  const bannerCampaigns = campaigns.filter((c) => c.type === "banner");

  const statCards = [
    {
      title: "Badges",
      published: badgeCampaigns.filter((c) => c.status === "live").length,
      scheduled: badgeCampaigns.filter((c) => c.status === "scheduled").length,
      unpublished: badgeCampaigns.filter((c) => c.status === "draft" || c.status === "paused" || c.status === "archived").length,
    },
    {
      title: "Banners",
      published: bannerCampaigns.filter((c) => c.status === "live").length,
      scheduled: bannerCampaigns.filter((c) => c.status === "scheduled").length,
      unpublished: bannerCampaigns.filter((c) => c.status === "draft" || c.status === "paused" || c.status === "archived").length,
    },
  ];

  return (
    <section className="stats-grid">
      {statCards.map((card) => (
        <article key={card.title} className="panel stat-panel">
          <div className="panel-head">
            <h2>{card.title}</h2>
            <button
              className="ghost-btn"
              onClick={() => onViewSection(card.title)}
            >
              View {card.title.toLowerCase()}
            </button>
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
  );
}
