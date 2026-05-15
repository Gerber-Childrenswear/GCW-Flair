// Style palette seed data — initial population of Global Styles.
//
// Every visual property is a token-ID reference (from data/color-palette.ts
// or data/brand-tokens.ts). No raw values land here — Decision #5 cascade
// protection. Edit a token upstream and every Style using it shifts.

import type { Style, StyleAuditEntry } from "../types/style";

const SEED_TIMESTAMP = new Date().toISOString();
const SEED_ACTOR = "darilee@gerberchildrenswear.com";

// ─── Token shortcuts (read clearly in the seed below) ──────────────────────
const C = {
  oxfordBlue:   "clr_001",
  jordyBlue:    "clr_002",
  hawkesBlue:   "clr_003",
  springWood:   "clr_004",
  maize:        "clr_005",
  sandyBrown:   "clr_006",
  geraldine:    "clr_007",
  seaNymph:     "clr_008",
  white:        "clr_013",
  coralSale:    "clr_018",
  coralTint:    "clr_019",
};

const S = { square: "shp_square", rounded: "shp_rounded", pill: "shp_pill", tag: "shp_tag" };
const B = { none: "brd_none", thin: "brd_thin", medium: "brd_medium", thick: "brd_thick" };
const P = { tight: "pad_tight", normal: "pad_normal", spacious: "pad_spacious", generous: "pad_generous" };
const SH = { none: "shd_none", soft: "shd_soft", card: "shd_card", lifted: "shd_lifted" };
const TSZ = {
  caption: "tsz_caption",
  small:   "tsz_small",
  body:    "tsz_body",
  bodyLg:  "tsz_body_lg",
  h4:      "tsz_h4",
  h3:      "tsz_h3",
};
const TST = {
  regular:  "tst_regular",
  medium:   "tst_medium",
  semibold: "tst_semibold",
  bold:     "tst_bold",
  boldCaps: "tst_bold_caps",
  italic:   "tst_italic",
};
const LSP = { tight: "lsp_tight", normal: "lsp_normal", wide: "lsp_wide", wider: "lsp_wider" };

// ─── Seeded Styles ───────────────────────────────────────────────────────────
export const SEED_STYLES: Style[] = [
  {
    id: "sty_default_navy",
    name: "Default Navy",
    description: "The system default. Solid Oxford Blue with white text — the safe answer when a campaign doesn't specify a style.",
    isDefault: true,
    badge: {
      bgColor: C.oxfordBlue,
      textColor: C.white,
      borderColor: null,
      borderSize: B.none,
      shape: S.rounded,
      textSize: TSZ.small,
      textStyle: TST.boldCaps,
      padding: P.normal,
      letterSpacing: LSP.wide,
      shadow: SH.none,
    },
    banner: {
      bgColor: C.oxfordBlue,
      borderColor: null,
      borderSize: B.none,
      padding: P.spacious,
      shadow: SH.none,
      textAlign: "center",
      headline: { textSize: TSZ.h4, textStyle: TST.boldCaps, letterSpacing: LSP.wide, color: C.white },
      copy:     { textSize: TSZ.body, textStyle: TST.regular, letterSpacing: LSP.normal, color: C.white },
      details:  { textSize: TSZ.small, textStyle: TST.italic, letterSpacing: LSP.normal, color: C.white },
      countdown: {
        variant: "blocks",
        blockBgColor: C.white,
        blockBorderColor: null,
        blockBorderSize: B.none,
        blockShape: S.rounded,
        blockPadding: P.normal,
        blockShadow: SH.none,
        separatorColor: C.white,
        digit: { textSize: TSZ.h4, textStyle: TST.bold,    letterSpacing: LSP.normal, color: C.oxfordBlue },
        label: { textSize: TSZ.caption, textStyle: TST.boldCaps, letterSpacing: LSP.wide, color: C.oxfordBlue },
      },
    },
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: "sty_summer_sale",
    name: "Summer Sale",
    description: "Maize background with Oxford Blue text. Used through the warm-weather promo windows.",
    badge: {
      bgColor: C.maize,
      textColor: C.oxfordBlue,
      borderColor: null,
      borderSize: B.none,
      shape: S.pill,
      textSize: TSZ.small,
      textStyle: TST.boldCaps,
      padding: P.normal,
      letterSpacing: LSP.wide,
      shadow: SH.none,
    },
    banner: {
      bgColor: C.maize,
      borderColor: null,
      borderSize: B.none,
      padding: P.spacious,
      shadow: SH.none,
      textAlign: "center",
      headline: { textSize: TSZ.h4, textStyle: TST.boldCaps, letterSpacing: LSP.wide, color: C.oxfordBlue },
      copy:     { textSize: TSZ.body, textStyle: TST.regular, letterSpacing: LSP.normal, color: C.oxfordBlue },
      details:  { textSize: TSZ.small, textStyle: TST.italic, letterSpacing: LSP.normal, color: C.oxfordBlue },
      countdown: {
        variant: "blocks",
        blockBgColor: C.oxfordBlue,
        blockBorderColor: null,
        blockBorderSize: B.none,
        blockShape: S.rounded,
        blockPadding: P.normal,
        blockShadow: SH.none,
        separatorColor: C.oxfordBlue,
        digit: { textSize: TSZ.h4, textStyle: TST.bold,    letterSpacing: LSP.normal, color: C.white },
        label: { textSize: TSZ.caption, textStyle: TST.boldCaps, letterSpacing: LSP.wide, color: C.white },
      },
    },
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: "sty_final_hours",
    name: "Final Hours",
    description: "Sale red treatment — short-window promos, last-chance messaging.",
    badge: {
      bgColor: C.coralSale,
      textColor: C.white,
      borderColor: null,
      borderSize: B.none,
      shape: S.square,
      textSize: TSZ.small,
      textStyle: TST.boldCaps,
      padding: P.normal,
      letterSpacing: LSP.wider,
      shadow: SH.none,
    },
    banner: {
      bgColor: C.coralSale,
      borderColor: null,
      borderSize: B.none,
      padding: P.spacious,
      shadow: SH.none,
      textAlign: "center",
      headline: { textSize: TSZ.h4, textStyle: TST.boldCaps, letterSpacing: LSP.wider, color: C.white },
      copy:     { textSize: TSZ.body, textStyle: TST.medium, letterSpacing: LSP.normal, color: C.white },
      details:  { textSize: TSZ.small, textStyle: TST.italic, letterSpacing: LSP.normal, color: C.coralTint },
      countdown: {
        variant: "blocks",
        blockBgColor: C.white,
        blockBorderColor: null,
        blockBorderSize: B.none,
        blockShape: S.square,
        blockPadding: P.normal,
        blockShadow: SH.soft,
        separatorColor: C.white,
        digit: { textSize: TSZ.h3, textStyle: TST.bold,    letterSpacing: LSP.normal, color: C.coralSale },
        label: { textSize: TSZ.caption, textStyle: TST.boldCaps, letterSpacing: LSP.wider, color: C.coralSale },
      },
    },
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: "sty_trust_pill",
    name: "Trust Pill",
    description: "Soft Hawkes Blue pill — newsletter, free-shipping reassurance, product trust signals. Badge only.",
    badge: {
      bgColor: C.hawkesBlue,
      textColor: C.oxfordBlue,
      borderColor: null,
      borderSize: B.none,
      shape: S.pill,
      textSize: TSZ.caption,
      textStyle: TST.medium,
      padding: P.tight,
      letterSpacing: LSP.normal,
      shadow: SH.none,
    },
    banner: null,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
  {
    id: "sty_soft_newsletter",
    name: "Soft Newsletter",
    description: "Spring Wood surface with Oxford Blue type. Quiet announcements, newsletter signups. Banner only.",
    badge: null,
    banner: {
      bgColor: C.springWood,
      borderColor: C.hawkesBlue,
      borderSize: B.thin,
      padding: P.generous,
      shadow: SH.none,
      textAlign: "left",
      headline: { textSize: TSZ.h4, textStyle: TST.semibold, letterSpacing: LSP.tight, color: C.oxfordBlue },
      copy:     { textSize: TSZ.body, textStyle: TST.regular, letterSpacing: LSP.normal, color: C.oxfordBlue },
      details:  { textSize: TSZ.small, textStyle: TST.regular, letterSpacing: LSP.normal, color: C.oxfordBlue },
      countdown: {
        variant: "blocks",
        blockBgColor: C.hawkesBlue,
        blockBorderColor: null,
        blockBorderSize: B.none,
        blockShape: S.rounded,
        blockPadding: P.normal,
        blockShadow: SH.none,
        separatorColor: C.oxfordBlue,
        digit: { textSize: TSZ.h4, textStyle: TST.semibold, letterSpacing: LSP.normal, color: C.oxfordBlue },
        label: { textSize: TSZ.caption, textStyle: TST.medium, letterSpacing: LSP.normal, color: C.oxfordBlue },
      },
    },
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
];

// ─── Seed audit log ──────────────────────────────────────────────────────────
export const SEED_STYLE_AUDIT_LOG: StyleAuditEntry[] = [
  {
    id: "style_audit_001",
    timestamp: SEED_TIMESTAMP,
    actor: SEED_ACTOR,
    action: "add",
    targetId: "_palette",
    diff: { after: { name: "Initial Style library — 5 starter Styles" } },
  },
];
