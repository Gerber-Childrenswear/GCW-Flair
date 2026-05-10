import type { Campaign } from "../types/campaign";
import { resolveCampaignCreative } from "../data/design-system";

type Props = {
  campaign: Campaign;
  onEdit: (id: string) => void;
  isSelected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
};

const statusDot: Record<string, string> = {
  live: "ok",
  scheduled: "warn",
  draft: "idle",
  paused: "idle",
  archived: "idle",
};

export default function CampaignCard({ campaign, onEdit, isSelected, onSelect }: Props) {
  const resolvedCreative = resolveCampaignCreative(campaign);
  const lines = resolvedCreative.text.split("\n");
  const condCount = campaign.ruleConditions.length;

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(campaign.id, !isSelected);
    }
  };

  return (
    <article
      className={`campaign-card ${isSelected ? "selected" : ""}`}
      onClick={() => !isSelected && onEdit(campaign.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onEdit(campaign.id);
      }}
    >
      {onSelect && (
        <div className="campaign-card-checkbox">
          <input
            type="checkbox"
            checked={isSelected || false}
            onChange={() => {}}
            onClick={handleCheckboxClick}
            aria-label={`Select ${campaign.name}`}
          />
        </div>
      )}
      <div
        className="campaign-card-preview"
        style={{
          backgroundColor: resolvedCreative.backgroundColor,
          color: resolvedCreative.textColor,
          borderColor: resolvedCreative.borderColor,
        }}
      >
        {lines.map((line, i) => (
          <div key={i} className={i === 0 ? "preview-headline" : "preview-body"}>
            {line}
          </div>
        ))}
      </div>
      <div className="campaign-card-name">{campaign.name || lines[0] || "Untitled"}</div>
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
