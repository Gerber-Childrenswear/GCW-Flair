export type CampaignType = "badge" | "banner";
export type CampaignStatus = "draft" | "scheduled" | "live" | "paused" | "archived";
export type ConflictMode = "stack" | "replace" | "suppress";
export type Operator = "AND" | "OR";
export type IncludeMode = "include" | "exclude";
export type DeviceScope = "desktop" | "mobile" | "all";

export type Comparator =
  | "eq" | "neq"
  | "gt" | "gte" | "lt" | "lte"
  | "contains" | "not_contains"
  | "in" | "not_in"
  | "exists" | "not_exists";

export type ConditionField =
  | "product_tag" | "collection_id" | "product_type" | "vendor"
  | "price" | "compare_at_price" | "inventory"
  | "variant_option" | "customer_tag" | "customer_logged_in"
  | "page_type" | "placement_slot";

export type PageType = "pdp" | "collection" | "search" | "quick_view" | "cart_drawer";

export type SlotKey =
  | "above_title" | "below_title"
  | "above_price" | "below_price"
  | "above_atc" | "below_atc"
  | "below_swatches"
  | "card_top" | "card_bottom"
  | "quick_view_body"
  | "cart_drawer_item";

// ── Rule Engine ───────────────────────────────
export interface RuleGroup {
  id: string;
  campaignId: string;
  parentGroupId: string | null;
  operator: Operator;
  includeMode: IncludeMode;
  sortOrder: number;
  humanSummary?: string;
}

export interface RuleCondition {
  id: string;
  groupId: string;
  field: ConditionField;
  comparator: Comparator;
  value: string;
  sortOrder: number;
}

// ── Creative ──────────────────────────────────
export interface Creative {
  text: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  stylePreset: string;
}

// ── Placement ─────────────────────────────────
export interface Placement {
  id: string;
  storeId: string;
  pageType: PageType;
  slotKey: SlotKey;
  label: string;
  description: string;
  deviceScope: DeviceScope;
  isEnabled: boolean;
}

export interface CampaignPlacement {
  id: string;
  campaignId: string;
  placementId: string;
  layoutKey: string;
  deviceScope: DeviceScope;
  priorityOverride: number | null;
}

// ── Style ─────────────────────────────────────
export interface StyleConfig {
  id: string;
  campaignId: string;
  tokenOverrides: Record<string, string>;
  customCssRaw: string;
  customCssScoped: string;
  safeMode: "strict" | "balanced" | "advanced";
  lintErrors: string[];
  lintWarnings: string[];
}

// ── Schedule ──────────────────────────────────
export interface Schedule {
  id: string;
  campaignId: string;
  startsAt: string | null;
  endsAt: string | null;
  timezone: string;
  isActive: boolean;
}

// ── Campaign ──────────────────────────────────
export interface Campaign {
  id: string;
  storeId: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  priority: number;
  conflictMode: ConflictMode;
  maxPerPlacement: number;
  templateId: string | null;
  creative: Creative;
  ruleGroups: RuleGroup[];
  ruleConditions: RuleCondition[];
  placements: CampaignPlacement[];
  schedule: Schedule;
  styleConfig: StyleConfig;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

// ── Template ──────────────────────────────────
export interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  defaultCreative: Partial<Creative>;
  defaultRulesJson: string;
  defaultPlacementsJson: string;
  isSystemTemplate: boolean;
  createdAt: string;
}

// ── Analytics ─────────────────────────────────
export type EventType =
  | "impression" | "click"
  | "atc_after_impression" | "checkout_after_impression"
  | "order_attributed";

export interface AnalyticsEvent {
  id: string;
  storeId: string;
  eventType: EventType;
  campaignId: string;
  placementId: string;
  productId: string | null;
  variantId: string | null;
  pageType: string;
  sessionId: string;
  eventTs: string;
}

export interface CampaignMetrics {
  campaignId: string;
  impressions: number;
  clicks: number;
  ctr: number;
  atcs: number;
  revenue: number;
}

// ── Evaluator I/O ─────────────────────────────
export interface EvalContext {
  product: {
    id: string;
    tags: string[];
    productType: string;
    vendor: string;
    collections: string[];
    metafields: Record<string, string>;
  };
  selectedVariant: {
    id: string;
    price: number;
    compareAtPrice: number | null;
    inventory: number;
    options: Record<string, string>;
  };
  customer: {
    isLoggedIn: boolean;
    tags: string[];
  };
  pageType: string;
  placementSlot: string;
  device: string;
}

export interface ConditionResult {
  id: string;
  field: string;
  comparator: string;
  value: string;
  resolvedValue: unknown;
  pass: boolean;
  explanation: string;
}

export interface GroupResult {
  groupId: string;
  operator: Operator;
  includeMode: IncludeMode;
  pass: boolean;
  conditions: ConditionResult[];
  children: GroupResult[];
  explanation: string;
}

export interface EvalResult {
  campaignId: string;
  eligible: boolean;
  decision: "rendered" | "suppressed" | "ineligible" | "draft";
  schedulePass: boolean;
  rulesPass: boolean;
  ruleTrace: GroupResult | null;
  conflictReason: string | null;
  humanSummary: string;
}

export interface PreviewRequest {
  campaignId?: string;
  context: EvalContext;
  placementId?: string;
}

export interface PreviewResponse {
  result: EvalResult;
  resolvedCreative: Creative | null;
  compiledCss: string | null;
  winners?: Array<{ campaignId: string; priority: number }>;
}

export interface ConflictRequest {
  placementId: string;
  candidateIds: string[];
  context: EvalContext;
}

export interface ConflictResponse {
  winners: Campaign[];
  suppressed: Array<{ campaign: Campaign; reason: string }>;
}
