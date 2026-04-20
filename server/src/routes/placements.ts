import { Router, Request, Response } from "express";
import { placements } from "../data/store";

const router = Router();

// GET /api/placements
router.get("/", (_req: Request, res: Response) => {
  res.json(placements);
});

// GET /api/placements/by-page/:pageType
router.get("/by-page/:pageType", (req: Request, res: Response) => {
  const filtered = placements.filter((p) => p.pageType === req.params.pageType);
  res.json(filtered);
});

// GET /api/placements/:id
router.get("/:id", (req: Request, res: Response) => {
  const p = placements.find((pl) => pl.id === req.params.id);
  if (!p) return res.status(404).json({ error: "Placement not found." });
  return res.json(p);
});

export default router;
