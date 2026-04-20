import { Router, Request, Response } from "express";
import { templates } from "../data/store";

const router = Router();

// GET /api/templates
router.get("/", (req: Request, res: Response) => {
  const { category } = req.query;
  if (category) {
    return res.json(templates.filter((t) => t.category === category));
  }
  return res.json(templates);
});

// GET /api/templates/categories
router.get("/categories", (_req: Request, res: Response) => {
  const cats = Array.from(new Set(templates.map((t) => t.category)));
  res.json(cats);
});

// GET /api/templates/:id
router.get("/:id", (req: Request, res: Response) => {
  const tmpl = templates.find((t) => t.id === req.params.id);
  if (!tmpl) return res.status(404).json({ error: "Template not found." });
  return res.json(tmpl);
});

export default router;
