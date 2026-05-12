import type { Campaign } from "../types/campaign";
import { resolveCampaignCreative } from "../data/design-system";

type Props = {
  campaign: Campaign;
};

export default function CampaignPreview({ campaign }: Props) {
  const resolvedCreative = resolveCampaignCreative(campaign);
  const lines = resolvedCreative.text.split("\n");
  const isBanner = campaign.type === "banner";
  const customCss = campaign.styleConfig?.customCssScoped?.trim() ?? campaign.styleConfig?.customCssRaw?.trim() ?? "";
  const previewScopeClass = `gcw-campaign-${campaign.id}`;
  const countdownLine = campaign.countdown?.enabled && campaign.countdown.endsAt
    ? `${campaign.countdown.label}: ${new Date(campaign.countdown.endsAt).toLocaleString()}`
    : null;
  const headline = lines[0] || (isBanner ? "Your text" : "Badge text");
  const bodyLines = lines.slice(1);

  const paddingMap = {
    tight: "8px 10px",
    normal: "12px 14px",
    spacious: "16px 20px",
  } as const;

  const letterSpacingMap = {
    normal: "0",
    wide: "0.03em",
    wider: "0.08em",
  } as const;

  const borderWidthMap = {
    none: "0px",
    thin: "1px",
    medium: "2px",
  } as const;

  const shadowMap = {
    none: "none",
    small: "0 2px 6px rgba(15, 30, 56, 0.15)",
    medium: "0 8px 18px rgba(15, 30, 56, 0.2)",
  } as const;

  const radiusMap = {
    square: "0px",
    rounded: isBanner ? "8px" : "6px",
    pill: "999px",
  } as const;

  const fontSize = resolvedCreative.textSize ?? "14px";
  const fontWeight = resolvedCreative.fontWeight ?? "700";
  const padding = paddingMap[resolvedCreative.paddingPreset ?? "normal"];
  const letterSpacing = letterSpacingMap[resolvedCreative.letterSpacingPreset ?? "normal"];
  const borderWidth = borderWidthMap[resolvedCreative.borderWidthPreset ?? "thin"];
  const boxShadow = shadowMap[resolvedCreative.shadowPreset ?? "none"];
  const borderRadius = radiusMap[resolvedCreative.cornerPreset ?? (isBanner ? "square" : "rounded")];
  const previewCss = `
    .${previewScopeClass} {
      background-color: ${resolvedCreative.backgroundColor};
      color: ${resolvedCreative.textColor};
      border-color: ${resolvedCreative.borderColor};
      border-width: ${borderWidth};
      border-style: solid;
      border-radius: ${borderRadius};
      box-shadow: ${boxShadow};
      padding: ${padding};
      letter-spacing: ${letterSpacing};
      font-size: ${fontSize};
      font-weight: ${fontWeight};
    }

    .${previewScopeClass}.preview-creative--mini {
      padding: 4px 8px;
      font-size: 10px;
    }
  `.trim();

  return (
    <div className="preview-wrapper">
      {(customCss || previewCss) && <style>{[previewCss, customCss].filter(Boolean).join("\n")}</style>}
      <div className="preview-inline-frame">
        <div className="preview-inline-label">Preview</div>
        <div className="preview-inline-surface">
          <div
            className={`preview-creative ${previewScopeClass} gcw-campaign flair-campaign flair-campaign-${campaign.id} ${isBanner ? "preview-creative--banner" : "preview-creative--badge"}`}
          >
            <div className="preview-headline">{headline}</div>
            {bodyLines.map((line, i) => (
              <div key={i} className="preview-body">
                {line}
              </div>
            ))}
            {countdownLine && <div className="preview-countdown">{countdownLine}</div>}
          </div>
        </div>

        {!isBanner && (
          <div className="preview-inline-secondary">
            <div className="preview-secondary-row">
              <div className="preview-secondary-image" />
              <div className="preview-secondary-copy">
                <div className="preview-secondary-title">Sample product</div>
                <div className="preview-secondary-price">$29.99</div>
              </div>
              <div
                className={`preview-creative preview-creative--badge preview-creative--mini ${previewScopeClass} gcw-campaign flair-campaign flair-campaign-${campaign.id}`}
              >
                {headline}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="preview-meta">
        <span className={`status-badge status-badge--${campaign.status}`}>
          {campaign.status}
        </span>
        <span className="preview-type">{campaign.type}</span>
        <span className="preview-priority">Priority: {campaign.priority}</span>
        {campaign.linkUrl && <span className="preview-link">Linked</span>}
        {Boolean(campaign.tags?.length) && <span className="preview-tags">{campaign.tags?.length} tags</span>}
      </div>
    </div>
  );
}
