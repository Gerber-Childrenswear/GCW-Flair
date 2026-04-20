import { Router, Request, Response } from "express";
import { campaigns, placements as placementStore } from "../data/store";
import { evaluateCampaign, evaluateCampaignBatch } from "../engine/evaluator";
import { resolveConflicts } from "../engine/conflict";
import type { EvalContext, PreviewRequest } from "../types/index";

const router = Router();

// POST /api/preview/evaluate
// Body: { context: EvalContext, campaignId?: string }
router.post("/evaluate", (req: Request, res: Response) => {
  const body = req.body as PreviewRequest;
  if (!body.context) {
    return res.status(400).json({ error: "context is required." });
  }

  const ctx: EvalContext = body.context;

  if (body.campaignId) {
    const campaign = campaigns.find((c) => c.id === body.campaignId);
    if (!campaign) return res.status(404).json({ error: "Campaign not found." });

    const result = evaluateCampaign(campaign, ctx);
    return res.json({
      result,
      resolvedCreative: result.eligible ? campaign.creative : null,
      compiledCss: null,
    });
  }

  // Evaluate all live campaigns against context
  const liveCampaigns = campaigns.filter((c) => c.status === "live" || c.status === "scheduled");
  const results = evaluateCampaignBatch(liveCampaigns, ctx);
  const qualifiedIds = results.filter((r) => r.eligible).map((r) => r.campaignId);
  const qualified = liveCampaigns.filter((c) => qualifiedIds.includes(c.id));

  const { winners, suppressed } = resolveConflicts(qualified);

  return res.json({
    evaluated: results.length,
    qualified: qualified.length,
    winners: winners.map((w) => ({
      campaignId: w.id,
      priority: w.priority,
      creative: w.creative,
    })),
    suppressed: suppressed.map(({ campaign, reason }) => ({
      campaignId: campaign.id,
      reason,
    })),
    traces: results,
  });
});

// POST /api/preview/placement
// Evaluate which campaigns win for a specific placement
router.post("/placement", (req: Request, res: Response) => {
  const { placementId, context } = req.body as { placementId: string; context: EvalContext };
  if (!placementId || !context) {
    return res.status(400).json({ error: "placementId and context are required." });
  }

  const placement = placementStore.find((p) => p.id === placementId);
  if (!placement) return res.status(404).json({ error: "Placement not found." });

  // Get campaigns assigned to this placement
  const assigned = campaigns.filter((c) =>
    c.placements.some((p) => p.placementId === placementId)
  );

  const results = evaluateCampaignBatch(assigned, context);
  const qualifiedIds = results.filter((r) => r.eligible).map((r) => r.campaignId);
  const qualified = assigned.filter((c) => qualifiedIds.includes(c.id));

  const { winners, suppressed } = resolveConflicts(qualified);

  return res.json({
    placement: { id: placement.id, label: placement.label },
    winners: winners.map((w) => ({
      campaignId: w.id,
      name: w.name,
      priority: w.priority,
      creative: w.creative,
    })),
    suppressed: suppressed.map(({ campaign, reason }) => ({
      campaignId: campaign.id,
      name: campaign.name,
      reason,
    })),
    traces: results,
  });
});

export default router;
