// Color palette types — the foundation of the Settings → Colors feature
// that Styles consume by reference. Single source of truth for color tokens
// in Flair.
//
// Architectural rules (see Projects/2026-05-flair-app-redesign/_brief.md
// Architecture decisions, Decision #5):
//
//   1. Hex lives ONLY in Settings — never displayed or entered in the Style
//      editor surfaces. Average users see name + swatch.
//   2. Styles reference colors by stable ID, never by name or hex. Renaming
//      a color does not break any Style.
//   3. Names are display labels — they can change without cascade impact.
//   4. Delete is forced-transfer-or-replace; no orphan references permitted.
//   5. Every Settings change writes an audit log entry (timestamp, actor,
//      action, before/after). Enables recovery from bad imports, regretted
//      recolors, and compliance trail.

export type ColorId = string; // e.g. "clr_002744" — stable across renames/recolors

export type ColorGroup = {
  id: string;
  name: string;       // user-defined, e.g. "Brand Primary", "Seasonal — Summer 2026"
  sortOrder: number;
};

export type Color = {
  id: ColorId;
  name: string;       // display label, e.g. "Maize" (NOT "Ronchi" — see brand vocab)
  hex: string;        // canonical lowercase, e.g. "#f2c94c"
  groupId: string;    // FK to ColorGroup — every color belongs to a group
  sortOrder: number;
  createdAt: string;  // ISO timestamp
  updatedAt: string;  // ISO timestamp
};

// Discrete action types for the audit log. Each Settings mutation maps to one.
export type ColorAuditAction =
  | "add"
  | "edit_name"
  | "edit_hex"
  | "edit_group"
  | "delete"
  | "import"
  | "export"
  | "group_add"
  | "group_rename"
  | "group_delete";

export type ColorAuditEntry = {
  id: string;
  timestamp: string;  // ISO timestamp
  actor: string;      // user identifier (Shopify staff user)
  action: ColorAuditAction;
  targetType: "color" | "group";
  targetId: string;   // ColorId or ColorGroup id
  diff: {
    before?: Partial<Color> | Partial<ColorGroup>;
    after?: Partial<Color> | Partial<ColorGroup>;
  };
};

// Result of validating a JSON import against current state. The architecture
// requires this validation to run BEFORE applying — imports that would orphan
// any in-use color are rejected with the list of affected Styles, so the user
// can either revise the JSON or specify transfer targets.
export type ImportValidationResult = {
  ok: boolean;
  // Colors that would be added (in import, not in current).
  toAdd: Color[];
  // Colors that would be modified (same ID, different name/hex/group).
  // These cascade to every Style using the ID.
  toModify: Array<{ before: Color; after: Color }>;
  // Colors currently in use that the import would DROP — these trigger
  // forced-transfer-or-replace before the import can apply.
  toDropInUse: Array<{ color: Color; usingStyleIds: string[] }>;
  // Colors not in use that would be dropped — safe to drop without transfer.
  toDropFree: Color[];
};
