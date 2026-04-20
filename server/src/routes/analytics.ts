import { Router, Request, Response } from "express";
import { getCampaignMetrics, campaigns } from "../data/store";

const router = Router();

// GET /api/analytics/metrics
router.get("/metrics", (_req: Request, res: Response) => {
  const metrics = getCampaignMetrics();
  const enriched = metrics.map((m) => {
    const campaign = campaigns.find((c) => c.id === m.campaignId);
    return {
      ...m,
      campaignName: campaign?.name ?? "Unknown",
      campaignType: campaign?.type ?? "badge",
      campaignStatus: campaign?.status ?? "draft",
    };
  });
  res.json(enriched);
});

// GET /api/analytics/summary
router.get("/summary", (_req: Request, res: Response) => {
  const metrics = getCampaignMetrics();
  const total = metrics.reduce(
    (acc, m) => ({
      impressions: acc.impressions + m.impressions,
      clicks: acc.clicks + m.clicks,
      atcs: acc.atcs + m.atcs,
      revenue: acc.revenue + m.revenue,
    }),
    { impressions: 0, clicks: 0, atcs: 0, revenue: 0 }
  );

  const totalCtr = total.impressions > 0
    ? parseFloat(((total.clicks / total.impressions) * 100).toFixed(2))
    : 0;

  const liveCampaigns = campaigns.filter((c) => c.status === "live").length;
  const draftCampaigns = campaigns.filter((c) => c.status === "draft").length;

  res.json({
    ...total,
    ctr: totalCtr,
    liveCampaigns,
    draftCampaigns,
    totalCampaigns: campaigns.length,
  });
});

// GET /api/analytics/top?limit=5
router.get("/top", (req: Request, res: Response) => {
  const limit = parseInt(String(req.query.limit ?? "5"), 10);
  const metrics = getCampaignMetrics()
    .filter((m) => m.impressions > 0)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, limit)
    .map((m) => {
      const campaign = campaigns.find((c) => c.id === m.campaignId);
      return {
        ...m,
        campaignName: campaign?.name ?? "Unknown",
        campaignType: campaign?.type ?? "badge",
        campaignStatus: campaign?.status ?? "draft",
      };
    });

  res.json(metrics);
});

export default router;
