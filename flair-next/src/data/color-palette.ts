// Color palette seed data — initial population of Settings → Colors.
//
// Sourced from the existing data/design-system.ts → GERBER_COLORS array.
// That legacy constant stays where it is; Nick's existing components keep
// importing it unchanged. This file adds a parallel canonical source that
// the new Settings → Colors page (and Styles, later) will consume.
//
// Differences from the legacy GERBER_COLORS:
//   1. Each color gets a stable ID (clr_001..clr_020). Styles reference
//      colors by ID, not by name or hex — so renames and recolors cascade
//      without breaking anything.
//   2. "Ronchi" renames to "Maize" — per Gerber brand vocab. The legacy
//      array stays "Ronchi"; we translate at the seam.
//   3. Groups are first-class entities with IDs (grp_*) instead of free
//      strings on each color. Lets admins rename a group in one place.
//   4. Hex values are canonical lowercase.
//   5. createdAt/updatedAt timestamps recorded.
//
// See Projects/2026-05-flair-app-redesign/_brief.md (Architecture decision #5).

import type { Color, ColorAuditEntry, ColorGroup } from "../types/color";

const SEED_TIMESTAMP = new Date().toISOString();
const SEED_ACTOR = "darilee@gerberchildrenswear.com"; // placeholder; real value comes from Shopify session once auth wires in

export const SEED_COLOR_GROUPS: ColorGroup[] = [
  { id: "grp_brand",    name: "Brand Official", sortOrder: 0 },
  { id: "grp_navy",     name: "Navy Ramp",      sortOrder: 1 },
  { id: "grp_neutrals", name: "Neutrals",       sortOrder: 2 },
  { id: "grp_accents",  name: "Accents",        sortOrder: 3 },
  { id: "grp_semantic", name: "Semantic",       sortOrder: 4 },
];

export const SEED_COLORS: Color[] = [
  // Brand Official — the 8 canonical Gerber brand colors
  { id: "clr_001", name: "Oxford Blue",  hex: "#002744", groupId: "grp_brand",    sortOrder: 0, createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },
  { id: "clr_002", name: "Jordy Blue",   hex: "#85b7ea", groupId: "grp_brand",    sortOrder: 1, createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },
  { id: "clr_003", name: "Hawkes Blue",  hex: "#cee2f7", groupId: "grp_brand",    sortOrder: 2, createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },
  { id: "clr_004", name: "Spring Wood",  hex: "#f9f5f3", groupId: "grp_brand",    sortOrder: 3, createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },
  { id: "clr_005", name: "Maize",        hex: "#f2c94c", groupId: "grp_brand",    sortOrder: 4, createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },
  { id: "clr_006", name: "Sandy Brown",  hex: "#f4a261", groupId: "grp_brand",    sortOrder: 5, createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },
  { id: "clr_007", name: "Geraldine",    hex: "#f28c82", groupId: "grp_brand",    sortOrder: 6, createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },
  { id: "clr_008", name: "Sea Nymph",    hex: "#86b3a1", groupId: "grp_brand",    sortOrder: 7, createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },

  // Navy Ramp — derived shades of Oxford Blue
  { id: "clr_009", name: "Navy 80",      hex: "#335369", groupId: "grp_navy",     sortOrder: 0, createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },
  { id: "clr_010", name: "Navy 60",      hex: "#667f8e", groupId: "grp_navy",     sortOrder: 1, createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },
  { id: "clr_011", name: "Navy 40",      hex: "#99a9b4", groupId: "grp_navy",     sortOrder: 2, createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },
  { id: "clr_012", name: "Navy 20",      hex: "#ccd4d9", groupId: "grp_navy",     sortOrder: 3, createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },

  // Neutrals
  { id: "clr_013", name: "White",        hex: "#ffffff", groupId: "grp_neutrals", sortOrder: 0, createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },
  { id: "clr_014", name: "Off-White 2",  hex: "#f4efec", groupId: "grp_neutrals", sortOrder: 1, createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },
  { id: "clr_015", name: "Hairline",     hex: "#e6e8ec", groupId: "grp_neutrals", sortOrder: 2, createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },

  // Accents — sky tones, focus ring
  { id: "clr_016", name: "Sky",             hex: "#5a9fdb", groupId: "grp_accents", sortOrder: 0, createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },
  { id: "clr_017", name: "Sky 700 (Focus)", hex: "#2b7ac1", groupId: "grp_accents", sortOrder: 1, createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },

  // Semantic — sale, success, etc.
  { id: "clr_018", name: "Coral (Sale)", hex: "#bf360c", groupId: "grp_semantic", sortOrder: 0, createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },
  { id: "clr_019", name: "Coral Tint",   hex: "#fbe9e4", groupId: "grp_semantic", sortOrder: 1, createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },
  { id: "clr_020", name: "Success",      hex: "#1a7f37", groupId: "grp_semantic", sortOrder: 2, createdAt: SEED_TIMESTAMP, updatedAt: SEED_TIMESTAMP },
];

// Seed audit log entries — three illustrative events for the audit display.
// In real use, the audit log accrues every mutation through the Settings UI.
export const SEED_AUDIT_LOG: ColorAuditEntry[] = [
  {
    id: "audit_001",
    timestamp: SEED_TIMESTAMP,
    actor: SEED_ACTOR,
    action: "import",
    targetType: "color",
    targetId: "_palette",
    diff: { after: { name: "Initial palette import (20 colors from Gerber Design System V1.0)" } },
  },
  {
    id: "audit_002",
    timestamp: SEED_TIMESTAMP,
    actor: SEED_ACTOR,
    action: "edit_name",
    targetType: "color",
    targetId: "clr_005",
    diff: {
      before: { name: "Ronchi" },
      after:  { name: "Maize" },
    },
  },
  {
    id: "audit_003",
    timestamp: SEED_TIMESTAMP,
    actor: SEED_ACTOR,
    action: "group_add",
    targetType: "group",
    targetId: "grp_brand",
    diff: { after: { name: "Brand Official" } },
  },
];
