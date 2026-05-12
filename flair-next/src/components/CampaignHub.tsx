import type { Campaign } from "../types/campaign";
import CampaignCard from "./CampaignCard";

type Props = {
  campaigns: Campaign[];
  onEdit: (id: string) => void;
  onOpenBadges: () => void;
  onOpenBanners: () => void;
};

function formatUpdatedLabel(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Recently updated" : `Updated ${date.toLocaleDateString()}`;
}

export default function CampaignHub({ campaigns, onEdit, onOpenBadges, onOpenBanners }: Props) {
  const liveCount = campaigns.filter((campaign) => campaign.status === "live").length;
  const scheduledCount = campaigns.filter((campaign) => campaign.status === "scheduled").length;
  const draftCount = campaigns.filter((campaign) => campaign.status === "draft").length;
  const badges = campaigns.filter((campaign) => campaign.type === "badge");
  const banners = campaigns.filter((campaign) => campaign.type === "banner");
  const recentCampaigns = [...campaigns]
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    .slice(0, 6);

  return (
    <div className="campaign-hub">
      <section className="stats-grid campaign-hub-stats">
        <article className="panel stat-panel">
          <div className="panel-head">
            <h2>Campaign health</h2>
            <span className="workspace-pill">{campaigns.length} total</span>
          </div>
          <div className="status-list">
            <div className="status-row">
              <span className="dot ok" />
              <span>{liveCount} live campaigns</span>
            </div>
            <div className="status-row">
              <span className="dot warn" />
              <span>{scheduledCount} scheduled launches</span>
            </div>
            <div className="status-row">
              <span className="dot idle" />
              <span>{draftCount} drafts in progress</span>
            </div>
          </div>
        </article>

        <article className="panel stat-panel">
          <div className="panel-head">
            <h2>By format</h2>
            <span className="workspace-pill">Mixed inventory</span>
          </div>
          <div className="campaign-hub-split">
            <button className="campaign-hub-format" onClick={onOpenBadges}>
              <span className="campaign-hub-format-label">Badges</span>
              <strong>{badges.length}</strong>
              <span>{badges.filter((campaign) => campaign.status === "live").length} live</span>
            </button>
            <button className="campaign-hub-format" onClick={onOpenBanners}>
              <span className="campaign-hub-format-label">Banners</span>
              <strong>{banners.length}</strong>
              <span>{banners.filter((campaign) => campaign.status === "live").length} live</span>
            </button>
          </div>
        </article>
      </section>

      <section className="panel campaign-hub-panel">
        <div className="panel-head">
          <div>
            <h2>Recent campaigns</h2>
            <p className="campaign-hub-copy">Use this view to manage the full campaign inventory before drilling into badges or banners.</p>
          </div>
        </div>
        <div className="campaign-hub-grid">
          {recentCampaigns.map((campaign) => (
            <div key={campaign.id} className="campaign-hub-item">
              <CampaignCard campaign={campaign} onEdit={onEdit} />
              <div className="campaign-hub-meta">{formatUpdatedLabel(campaign.updatedAt)}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}