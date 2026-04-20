export type CampaignType = "badge" | "banner";

export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "live"
  | "paused"
  | "archived";

export type Operator = "AND" | "OR";
export type IncludeMode = "include" | "exclude";
export type DeviceScope = "desktop" | "mobile" | "all";
export type ConflictMode = "stack" | "replace" | "suppress";

export type ConditionField =
  | "product_tag"
  | "collection_id"
  | "product_type"
  | "vendor"
  | "price"
  | "compare_at_price"
  | "inventory"
  | "variant_option"
  | "customer_tag"
  | "customer_logged_in"
  | "page_type"
  | "placement_slot";

export type Comparator =
  | "eq" | "neq"
  | "gt" | "gte" | "lt" | "lte"
  | "contains" | "not_contains"
  | "in" | "not_in"
  | "exists" | "not_exists";

// ── Rule types ────────────────────────────────────────────────────────────────
export type RuleGroup = {
  id: string;
  parentGroupId: string | null;
  operator: Operator;
  includeMode: IncludeMode;
  sortOrder: number;
};

export type RuleCondition = {
  id: string;
  groupId: string;
  field: ConditionField;
  comparator: Comparator;
  value: string;
  sortOrder: number;
};

// ── Placement types ───────────────────────────────────────────────────────────
export type CampaignPlacement = {
  id: string;
  placementId: string;
  layoutKey: string;
  deviceScope: DeviceScope;
};

// ── Creative ──────────────────────────────────────────────────────────────────
export type Creative = {
  text: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  stylePreset: string;
  contentMode?: "text" | "image";
  textSize?: "12px" | "14px" | "16px" | "18px";
  fontWeight?: "500" | "600" | "700";
  paddingPreset?: "tight" | "normal" | "spacious";
  letterSpacingPreset?: "normal" | "wide" | "wider";
  borderWidthPreset?: "none" | "thin" | "medium";
  shadowPreset?: "none" | "small" | "medium";
  cornerPreset?: "square" | "rounded" | "pill";
};

// ── Schedule ──────────────────────────────────────────────────────────────────
export type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type Schedule = {
  startsAt: string | null;
  endsAt: string | null;
  timezone: string;
  isActive: boolean;
  daysOfWeek?: DayOfWeek[];
  timeOfDayStart?: string; // HH:mm
  timeOfDayEnd?: string;   // HH:mm
};

export type CountdownConfig = {
  enabled: boolean;
  label: string;
  endsAt: string | null;
  urgencyThresholdHours: number;
};

export type TargetScope = "product" | "variant" | "cart";
export type AutomationMode = "manual" | "scheduled" | "always_on" | "rule_based" | "inventory_driven" | "performance_triggered";

export type StyleConfig = {
  customCssRaw: string;
  customCssScoped: string;
  safeMode: "strict" | "balanced" | "off";
};

// ── Variant Targeting ─────────────────────────────────────────────────────────
export type VariantTarget = {
  id: string;
  variantId: string;
  sku: string;
  title: string;
};

// ── A/B Testing ───────────────────────────────────────────────────────────────
export type ABTestVariant = {
  id: string;
  name: string;
  creative: Creative;
  allocationPercent: number;
};

export type ABTestConfig = {
  enabled: boolean;
  testName: string;
  variants: ABTestVariant[];
  winner?: string; // variant id
  winnerCriteria?: "conversion" | "clicks" | "engagement" | "revenue";
  startDate?: string;
  endDate?: string;
  minSampleSize?: number;
};

// ── Workflow Configuration ────────────────────────────────────────────────────
export type WorkflowStep = {
  id: string;
  type: "delay" | "condition" | "action" | "notification";
  delayHours?: number;
  condition?: RuleGroup;
  action?: string;
  notificationType?: "email" | "webhook";
};

export type WorkflowConfig = {
  enabled: boolean;
  name: string;
  trigger: "campaign_start" | "manual" | "schedule" | "performance_milestone";
  steps: WorkflowStep[];
};

// ── Notifications ─────────────────────────────────────────────────────────────
export type NotificationConfig = {
  emailOnLaunch: boolean;
  emailOnPause: boolean;
  emailOnWarnings: boolean;
  emailAddresses: string[];
  webhookUrl?: string;
  alertThresholds?: {
    lowPerformanceRatio?: number;
    lowCTR?: number;
    conversionDrop?: number;
  };
};

// ── Metrics & ROI ─────────────────────────────────────────────────────────────
export type MetricsSnapshot = {
  timestamp: string;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  avgOrderValue: number;
};

export type MetricsConfig = {
  enabled: boolean;
  trackingEnabled: boolean;
  conversionPixel?: string;
  roiTarget?: number;
  costPerImpression?: number;
  costPerClick?: number;
  snapshots: MetricsSnapshot[];
};

// ── Smart Recommendations ─────────────────────────────────────────────────────
export type RecommendationConfig = {
  enabled: boolean;
  basedOnInventory: boolean;
  basedOnSales: boolean;
  basedOnPerformance: boolean;
  recommendations: string[];
  lastUpdated?: string;
};

// ── Campaign ──────────────────────────────────────────────────────────────────
export type Campaign = {
  id: string;
  type: CampaignType;
  status: CampaignStatus;
  name: string;
  creative: Creative;
  ruleGroups: RuleGroup[];
  ruleConditions: RuleCondition[];
  placements: CampaignPlacement[];
  priority: number;
  conflictMode: ConflictMode;
  schedule: Schedule;
  targetScope?: TargetScope;
  promotionGroup?: string | null;
  automationMode?: AutomationMode;
  countdown?: CountdownConfig;
  linkUrl?: string | null;
  tags?: string[];
  styleConfig?: StyleConfig;
  // New features
  variantTargets?: VariantTarget[];
  abTestConfig?: ABTestConfig;
  workflowConfig?: WorkflowConfig;
  notificationConfig?: NotificationConfig;
  metricsConfig?: MetricsConfig;
  recommendationConfig?: RecommendationConfig;
  // Metadata
  createdAt: string;
  updatedAt: string;
};

// ── Field display helpers ─────────────────────────────────────────────────────
export const FIELD_LABELS: Record<ConditionField, string> = {
  product_tag:       "Product Tag",
  collection_id:     "Collection",
  product_type:      "Product Type",
  vendor:            "Vendor",
  price:             "Price",
  compare_at_price:  "Compare-At Price",
  inventory:         "Inventory",
  variant_option:    "Variant Option",
  customer_tag:      "Customer Tag",
  customer_logged_in:"Customer Logged In",
  page_type:         "Page Type",
  placement_slot:    "Placement Slot",
};

export const COMPARATOR_LABELS: Record<Comparator, string> = {
  eq:          "equals",
  neq:         "does not equal",
  gt:          "greater than",
  gte:         "≥",
  lt:          "less than",
  lte:         "≤",
  contains:    "contains",
  not_contains:"does not contain",
  in:          "is in",
  not_in:      "is not in",
  exists:      "exists",
  not_exists:  "does not exist",
};

// Comparators valid for each field category
export const NUMERIC_FIELDS: ConditionField[] = ["price", "compare_at_price", "inventory"];
export const BOOLEAN_FIELDS: ConditionField[] = ["customer_logged_in"];
export const ARRAY_FIELDS: ConditionField[]  = ["product_tag", "collection_id", "customer_tag"];

export function getComparatorsForField(field: ConditionField): Comparator[] {
  if (BOOLEAN_FIELDS.includes(field)) return ["eq"];
  if (NUMERIC_FIELDS.includes(field)) return ["gt", "gte", "lt", "lte", "eq", "neq"];
  if (ARRAY_FIELDS.includes(field))   return ["contains", "not_contains", "in", "not_in"];
  return ["eq", "neq", "contains", "not_contains"];
}
