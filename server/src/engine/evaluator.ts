import type {
  Campaign,
  EvalContext,
  EvalResult,
  GroupResult,
  ConditionResult,
  RuleGroup,
  RuleCondition,
  ConditionField,
  Comparator,
} from "../types/index";

// ── Field resolver ────────────────────────────────────────────────────────────
function resolveField(field: ConditionField, ctx: EvalContext): unknown {
  switch (field) {
    case "product_tag":          return ctx.product.tags;
    case "collection_id":        return ctx.product.collections;
    case "product_type":         return ctx.product.productType;
    case "vendor":               return ctx.product.vendor;
    case "price":                return ctx.selectedVariant.price;
    case "compare_at_price":     return ctx.selectedVariant.compareAtPrice;
    case "inventory":            return ctx.selectedVariant.inventory;
    case "variant_option":       return ctx.selectedVariant.options;
    case "customer_tag":         return ctx.customer.tags;
    case "customer_logged_in":   return ctx.customer.isLoggedIn;
    case "page_type":            return ctx.pageType;
    case "placement_slot":       return ctx.placementSlot;
    default:                     return undefined;
  }
}

// ── Comparator evaluator ──────────────────────────────────────────────────────
function applyComparator(
  comparator: Comparator,
  fieldValue: unknown,
  condValue: string
): boolean {
  switch (comparator) {
    case "eq":
      return String(fieldValue) === condValue;
    case "neq":
      return String(fieldValue) !== condValue;
    case "gt":
      return Number(fieldValue) > Number(condValue);
    case "gte":
      return Number(fieldValue) >= Number(condValue);
    case "lt":
      return Number(fieldValue) < Number(condValue);
    case "lte":
      return Number(fieldValue) <= Number(condValue);
    case "contains":
      if (Array.isArray(fieldValue)) return (fieldValue as string[]).includes(condValue);
      return String(fieldValue).toLowerCase().includes(condValue.toLowerCase());
    case "not_contains":
      if (Array.isArray(fieldValue)) return !(fieldValue as string[]).includes(condValue);
      return !String(fieldValue).toLowerCase().includes(condValue.toLowerCase());
    case "in": {
      const opts = condValue.split(",").map((s) => s.trim());
      if (Array.isArray(fieldValue))
        return (fieldValue as string[]).some((v) => opts.includes(v));
      return opts.includes(String(fieldValue));
    }
    case "not_in": {
      const opts = condValue.split(",").map((s) => s.trim());
      if (Array.isArray(fieldValue))
        return !(fieldValue as string[]).some((v) => opts.includes(v));
      return !opts.includes(String(fieldValue));
    }
    case "exists":
      return fieldValue !== undefined && fieldValue !== null;
    case "not_exists":
      return fieldValue === undefined || fieldValue === null;
    default:
      return false;
  }
}

// ── Human-readable explanation ────────────────────────────────────────────────
function explainCondition(
  field: string,
  comparator: string,
  value: string,
  resolvedValue: unknown,
  pass: boolean
): string {
  const displayField = field.replace(/_/g, " ");
  const result = pass ? "✓" : "✗";
  return `${result} ${displayField} ${comparator} "${value}" (got: ${JSON.stringify(resolvedValue)})`;
}

// ── Single condition evaluator ────────────────────────────────────────────────
function evaluateCondition(
  cond: RuleCondition,
  ctx: EvalContext
): ConditionResult {
  const resolvedValue = resolveField(cond.field, ctx);
  const pass = applyComparator(cond.comparator, resolvedValue, cond.value);
  return {
    id: cond.id,
    field: cond.field,
    comparator: cond.comparator,
    value: cond.value,
    resolvedValue,
    pass,
    explanation: explainCondition(cond.field, cond.comparator, cond.value, resolvedValue, pass),
  };
}

// ── Group evaluator (recursive) ───────────────────────────────────────────────
function evaluateGroup(
  group: RuleGroup,
  allGroups: RuleGroup[],
  allConditions: RuleCondition[],
  ctx: EvalContext
): GroupResult {
  const directConditions = allConditions
    .filter((c) => c.groupId === group.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const childGroups = allGroups
    .filter((g) => g.parentGroupId === group.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const conditionResults = directConditions.map((c) => evaluateCondition(c, ctx));
  const childResults = childGroups.map((cg) =>
    evaluateGroup(cg, allGroups, allConditions, ctx)
  );

  const allPasses = [
    ...conditionResults.map((r) => r.pass),
    ...childResults.map((r) => r.pass),
  ];

  let rawPass: boolean;
  if (allPasses.length === 0) {
    rawPass = true; // empty group always passes
  } else if (group.operator === "AND") {
    rawPass = allPasses.every((p) => p);
  } else {
    rawPass = allPasses.some((p) => p);
  }

  const finalPass = group.includeMode === "exclude" ? !rawPass : rawPass;

  const modeLabel = group.includeMode === "exclude" ? "EXCEPT when" : "when";
  const opLabel = group.operator;
  const passLabel = finalPass ? "PASS" : "FAIL";

  return {
    groupId: group.id,
    operator: group.operator,
    includeMode: group.includeMode,
    pass: finalPass,
    conditions: conditionResults,
    children: childResults,
    explanation: `[${passLabel}] ${modeLabel} ${opLabel} of ${allPasses.length} condition(s) match`,
  };
}

// ── Schedule check ────────────────────────────────────────────────────────────
function checkSchedule(campaign: Campaign): boolean {
  const now = Date.now();
  const { startsAt, endsAt } = campaign.schedule;
  if (campaign.status === "draft" || campaign.status === "paused" || campaign.status === "archived") {
    return false;
  }
  if (startsAt && new Date(startsAt).getTime() > now) return false;
  if (endsAt && new Date(endsAt).getTime() < now) return false;
  return true;
}

// ── Human summary generator ───────────────────────────────────────────────────
function buildHumanSummary(result: EvalResult): string {
  if (!result.schedulePass) {
    if (result.decision === "draft") return "Campaign is in draft — not published.";
    return "Campaign is outside its scheduled window.";
  }
  if (!result.rulesPass && result.ruleTrace) {
    const failedConds = gatherFailedConditions(result.ruleTrace);
    if (failedConds.length > 0) {
      return `Rules did not match: ${failedConds.slice(0, 3).join("; ")}`;
    }
    return "Rules did not match for current context.";
  }
  if (result.conflictReason) return result.conflictReason;
  if (result.eligible) return "Campaign qualifies and will be rendered.";
  return "Campaign did not qualify.";
}

function gatherFailedConditions(group: GroupResult): string[] {
  const failed: string[] = [];
  for (const cond of group.conditions) {
    if (!cond.pass) failed.push(cond.explanation);
  }
  for (const child of group.children) {
    failed.push(...gatherFailedConditions(child));
  }
  return failed;
}

// ── Main evaluator ────────────────────────────────────────────────────────────
export function evaluateCampaign(
  campaign: Campaign,
  ctx: EvalContext
): EvalResult {
  const schedulePass = checkSchedule(campaign);

  if (!schedulePass) {
    const decision = campaign.status === "draft" ? "draft" : "ineligible";
    const partial: EvalResult = {
      campaignId: campaign.id,
      eligible: false,
      decision,
      schedulePass: false,
      rulesPass: false,
      ruleTrace: null,
      conflictReason: null,
      humanSummary: "",
    };
    partial.humanSummary = buildHumanSummary(partial);
    return partial;
  }

  // Find root group (no parent)
  const rootGroup = campaign.ruleGroups.find((g) => g.parentGroupId === null);

  let rulesPass = true;
  let ruleTrace: GroupResult | null = null;

  if (rootGroup) {
    ruleTrace = evaluateGroup(
      rootGroup,
      campaign.ruleGroups,
      campaign.ruleConditions,
      ctx
    );
    rulesPass = ruleTrace.pass;
  }

  const eligible = rulesPass;
  const result: EvalResult = {
    campaignId: campaign.id,
    eligible,
    decision: eligible ? "rendered" : "ineligible",
    schedulePass: true,
    rulesPass,
    ruleTrace,
    conflictReason: null,
    humanSummary: "",
  };
  result.humanSummary = buildHumanSummary(result);
  return result;
}

// ── Batch evaluator (for placement resolution) ────────────────────────────────
export function evaluateCampaignBatch(
  campaigns: Campaign[],
  ctx: EvalContext
): EvalResult[] {
  return campaigns.map((c) => evaluateCampaign(c, ctx));
}
