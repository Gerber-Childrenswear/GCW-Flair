import type { Campaign } from "../types/campaign";
import { resolveCampaignCreative } from "../data/design-system";
import { SEED_STYLES } from "../data/style-palette";
import { BadgePreview, BannerPreview } from "./StylePreviews";

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
  const tagCount = campaign.ruleConditions.filter((c) => c.field === "product_tag").length;
  const previewLabel = lines[0] || campaign.name || "Untitled";
  const previewBody = lines.slice(1).join(" ").trim();

  // Look up the Style the campaign references. If found AND the campaign's
  // surface (badge/banner) is configured on that Style, render through the
  // new Style cascade. Otherwise fall back to the legacy swatch.
  const style = campaign.styleId ? SEED_STYLES.find((s) => s.id === campaign.styleId) : null;
  const styleConfig =
    style && (campaign.type === "badge" ? style.badge : style.banner);

  const previewClass = campaign.type === "banner" ? "campaign-card-swatch campaign-card-swatch--banner" : "campaign-card-swatch campaign-card-swatch--badge";
  const toneClass = `campaign-card-tone campaign-card-tone--${resolvedCreative.stylePreset ?? "custom"}`;

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
      <div className="campaign-card-topline">
        <span className={`status-badge status-badge--${campaign.status}`}>{campaign.status}</span>
        <span className="campaign-card-topline-meta">{condCount} condition{condCount !== 1 ? "s" : ""}</span>
      </div>
      <div className="campaign-card-preview-shell">
        {styleConfig ? (
          campaign.type === "badge" ? (
            <BadgePreview
              config={styleConfig as import("../types/style").BadgeStyleConfig}
              label={previewLabel.toUpperCase().slice(0, 22)}
              scale={0.9}
            />
          ) : (
            <BannerPreview
              config={styleConfig as import("../types/style").BannerStyleConfig}
              headlineText={previewLabel}
              copyText={lines[1] ?? ""}
              detailsText={lines[2] ?? ""}
              scale={0.6}
            />
          )
        ) : (
          <div className={`${previewClass} ${toneClass}`}>
            <div className="preview-headline">{previewLabel}</div>
            {campaign.type === "banner" && previewBody && (
              <div className="preview-body">{previewBody}</div>
            )}
          </div>
        )}
      </div>
      <div className="campaign-card-name">{campaign.name || lines[0] || "Untitled"}</div>
      <div className="campaign-card-meta">
        <span className={`dot ${statusDot[campaign.status]}`} />
        <span className="campaign-card-type">{campaign.type}</span>
        {tagCount > 0 && (
          <span className="campaign-card-tag">
            {tagCount} tag{tagCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </article>
  );
}
