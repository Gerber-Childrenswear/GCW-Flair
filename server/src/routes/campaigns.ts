import { Router, Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { campaigns, findCampaign, saveCampaign, deleteCampaign } from "../data/store";

const router = Router();

// GET /api/campaigns
router.get("/", (_req: Request, res: Response) => {
  res.json(campaigns);
});

// GET /api/campaigns/:id
router.get("/:id", (req: Request, res: Response) => {
  const campaign = findCampaign(req.params.id);
  if (!campaign) return res.status(404).json({ error: "Campaign not found." });
  return res.json(campaign);
});

// POST /api/campaigns
router.post("/", (req: Request, res: Response) => {
  const body = req.body;
  if (!body.name || !body.type) {
    return res.status(400).json({ error: "name and type are required." });
  }
  const now = new Date().toISOString();
  const id = `camp_${uuid().slice(0, 8)}`;
  const rootGroupId = `rg_root_${id}`;

  const campaign = {
    ...body,
    id,
    storeId: "gcw",
    status: body.status ?? "draft",
    priority: body.priority ?? 10,
    conflictMode: body.conflictMode ?? "replace",
    maxPerPlacement: body.maxPerPlacement ?? 1,
    ruleGroups: body.ruleGroups ?? [
      { id: rootGroupId, campaignId: id, parentGroupId: null, operator: "AND", includeMode: "include", sortOrder: 0 },
    ],
    ruleConditions: body.ruleConditions ?? [],
    placements: body.placements ?? [],
    schedule: body.schedule ?? {
      id: `sched_${id}`, campaignId: id,
      startsAt: null, endsAt: null,
      timezone: "America/New_York", isActive: false,
    },
    styleConfig: body.styleConfig ?? {
      id: `style_${id}`, campaignId: id,
      tokenOverrides: {}, customCssRaw: "", customCssScoped: "",
      safeMode: "balanced", lintErrors: [], lintWarnings: [],
    },
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
  };

  const saved = saveCampaign(campaign);
  return res.status(201).json(saved);
});

// PATCH /api/campaigns/:id
router.patch("/:id", (req: Request, res: Response) => {
  const existing = findCampaign(req.params.id);
  if (!existing) return res.status(404).json({ error: "Campaign not found." });
  const updated = saveCampaign({ ...existing, ...req.body, id: existing.id });
  return res.json(updated);
});

// DELETE /api/campaigns/:id
router.delete("/:id", (req: Request, res: Response) => {
  const deleted = deleteCampaign(req.params.id);
  if (!deleted) return res.status(404).json({ error: "Campaign not found." });
  return res.json({ success: true });
});

// POST /api/campaigns/:id/publish
router.post("/:id/publish", (req: Request, res: Response) => {
  const campaign = findCampaign(req.params.id);
  if (!campaign) return res.status(404).json({ error: "Campaign not found." });
  const updated = saveCampaign({
    ...campaign,
    status: "live",
    publishedAt: new Date().toISOString(),
  });
  return res.json(updated);
});

// POST /api/campaigns/:id/pause
router.post("/:id/pause", (req: Request, res: Response) => {
  const campaign = findCampaign(req.params.id);
  if (!campaign) return res.status(404).json({ error: "Campaign not found." });
  const updated = saveCampaign({ ...campaign, status: "paused" });
  return res.json(updated);
});

// POST /api/campaigns/:id/archive
router.post("/:id/archive", (req: Request, res: Response) => {
  const campaign = findCampaign(req.params.id);
  if (!campaign) return res.status(404).json({ error: "Campaign not found." });
  const updated = saveCampaign({ ...campaign, status: "archived" });
  return res.json(updated);
});

// POST /api/campaigns/:id/duplicate
router.post("/:id/duplicate", (req: Request, res: Response) => {
  const original = findCampaign(req.params.id);
  if (!original) return res.status(404).json({ error: "Campaign not found." });

  const now = new Date().toISOString();
  const newId = `camp_${uuid().slice(0, 8)}`;
  const rootGroupId = `rg_root_${newId}`;

  // Remap group/condition IDs
  const groupIdMap: Record<string, string> = {};
  original.ruleGroups.forEach((g) => {
    groupIdMap[g.id] = g.parentGroupId === null ? rootGroupId : `rg_${uuid().slice(0, 8)}`;
  });

  const newGroups = original.ruleGroups.map((g) => ({
    ...g,
    id: groupIdMap[g.id],
    campaignId: newId,
    parentGroupId: g.parentGroupId ? groupIdMap[g.parentGroupId] ?? null : null,
  }));

  const newConditions = original.ruleConditions.map((c) => ({
    ...c,
    id: `rc_${uuid().slice(0, 8)}`,
    groupId: groupIdMap[c.groupId] ?? c.groupId,
  }));

  const newPlacements = original.placements.map((p) => ({
    ...p,
    id: `cp_${uuid().slice(0, 8)}`,
    campaignId: newId,
  }));

  const copy = {
    ...original,
    id: newId,
    name: `${original.name} (Copy)`,
    status: "draft" as const,
    ruleGroups: newGroups,
    ruleConditions: newConditions,
    placements: newPlacements,
    schedule: { ...original.schedule, id: `sched_${newId}`, campaignId: newId, isActive: false },
    styleConfig: { ...original.styleConfig, id: `style_${newId}`, campaignId: newId },
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
  };

  const saved = saveCampaign(copy);
  return res.status(201).json(saved);
});

export default router;
