import type { Campaign } from "../types/campaign";

type Props = {
  campaign: Campaign;
  onEdit: (id: string) => void;
};

const statusDot: Record<string, string> = {
  live: "ok",
  scheduled: "warn",
  draft: "idle",
  paused: "idle",
  archived: "idle",
};

export default function CampaignCard({ campaign, onEdit }: Props) {
  const lines = campaign.creative.text.split("\n");
  const condCount = campaign.ruleConditions.length;

  return (
    <article
      className="campaign-card"
      onClick={() => onEdit(campaign.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onEdit(campaign.id);
      }}
    >
      <div
        className="campaign-card-preview"
        style={{
          backgroundColor: campaign.creative.backgroundColor,
          color: campaign.creative.textColor,
          borderColor: campaign.creative.borderColor,
        }}
      >
        {lines.map((line, i) => (
          <div key={i} className={i === 0 ? "preview-headline" : "preview-body"}>
            {line}
          </div>
        ))}
      </div>
      <div className="campaign-card-meta">
        <span className={`dot ${statusDot[campaign.status]}`} />
        <span className="campaign-card-conditions">
          {condCount} condition{condCount !== 1 ? "s" : ""}
        </span>
        {campaign.ruleConditions.some((c) => c.field === "product_tag") && (
          <span className="campaign-card-tag">
            {campaign.ruleConditions.filter((c) => c.field === "product_tag").length} tag
            {campaign.ruleConditions.filter((c) => c.field === "product_tag").length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </article>
  );
}
