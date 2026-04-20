import { useState } from "react";
import { v4 as uuid } from "uuid";
import type { RuleGroup, RuleCondition, ConditionField, Comparator } from "../types/campaign";
import { FIELD_LABELS, COMPARATOR_LABELS, getComparatorsForField, BOOLEAN_FIELDS } from "../types/campaign";

// ── Types ─────────────────────────────────────────────────────────────────────
type Props = {
  groups: RuleGroup[];
  conditions: RuleCondition[];
  onChange: (groups: RuleGroup[], conditions: RuleCondition[]) => void;
};

const ALL_FIELDS: ConditionField[] = [
  "product_tag", "collection_id", "product_type", "vendor",
  "price", "compare_at_price", "inventory",
  "variant_option", "customer_tag", "customer_logged_in",
  "page_type", "placement_slot",
];

function getValuePlaceholder(field: ConditionField): string {
  switch (field) {
    case "page_type":
      return "product, collection, search";
    case "product_tag":
    case "customer_tag":
      return "tag value";
    case "collection_id":
      return "collection handle or id";
    case "price":
    case "compare_at_price":
    case "inventory":
      return "0";
    case "variant_option":
      return "Size = 2T";
    case "placement_slot":
      return "pdp, collection, cart";
    default:
      return "Enter value";
  }
}

// ── RuleGroupBlock ─────────────────────────────────────────────────────────────
type BlockProps = {
  group: RuleGroup;
  allGroups: RuleGroup[];
  allConditions: RuleCondition[];
  depth: number;
  onUpdate: (id: string, patch: Partial<RuleGroup>) => void;
  onRemove: (id: string) => void;
  onAddCondition: (groupId: string) => void;
  onUpdateCondition: (id: string, patch: Partial<RuleCondition>) => void;
  onRemoveCondition: (id: string) => void;
  onAddChildGroup: (parentId: string) => void;
};

function RuleGroupBlock({
  group, allGroups, allConditions, depth,
  onUpdate, onRemove, onAddCondition,
  onUpdateCondition, onRemoveCondition, onAddChildGroup,
}: BlockProps) {
  const directConditions = allConditions
    .filter((c) => c.groupId === group.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const childGroups = allGroups
    .filter((g) => g.parentGroupId === group.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const isRoot = group.parentGroupId === null;
  const depthColors = ["#8c9196", "#b0b4b8", "#c9cccf", "#d2d5d8", "#dfe3e8"];
  const borderColor = depthColors[Math.min(depth, depthColors.length - 1)];

  return (
    <div
      className="rule-group"
      style={{ "--group-color": borderColor } as React.CSSProperties}
    >
      <div className="rule-group-header">
        <div className="rule-group-controls">
          <span className="rule-group-label">{isRoot ? "Condition set" : "Nested group"}</span>
          <button
            className={`rule-toggle ${group.operator === "AND" ? "active" : ""}`}
            onClick={() => onUpdate(group.id, { operator: "AND" })}
            title="All conditions must match"
          >ALL</button>
          <button
            className={`rule-toggle ${group.operator === "OR" ? "active" : ""}`}
            onClick={() => onUpdate(group.id, { operator: "OR" })}
            title="Any condition may match"
          >ANY</button>
          <span className="rule-group-label" style={{ marginLeft: "12px" }}>Behavior</span>
          <button
            className={`rule-mode-toggle ${group.includeMode === "include" ? "include" : ""}`}
            onClick={() => onUpdate(group.id, { includeMode: "include" })}
          >Include</button>
          <button
            className={`rule-mode-toggle ${group.includeMode === "exclude" ? "exclude" : ""}`}
            onClick={() => onUpdate(group.id, { includeMode: "exclude" })}
          >Exclude</button>
        </div>

        <div className="rule-group-actions">
          <button className="rule-btn rule-btn--ghost" onClick={() => onAddCondition(group.id)}>
            + Condition
          </button>
          <button className="rule-btn rule-btn--ghost" onClick={() => onAddChildGroup(group.id)}>
            + Sub-group
          </button>
          {!isRoot && (
            <button className="rule-btn rule-btn--remove" onClick={() => onRemove(group.id)} title="Remove group">
              ×
            </button>
          )}
        </div>
      </div>

      {/* Condition rows */}
      <div className="rule-conditions">
        {directConditions.length === 0 && childGroups.length === 0 && (
          <p className="rule-empty">No conditions yet. Add a condition to target where this promotion should appear.</p>
        )}
        {directConditions.map((cond) => (
          <ConditionRow
            key={cond.id}
            condition={cond}
            onUpdate={(patch) => onUpdateCondition(cond.id, patch)}
            onRemove={() => onRemoveCondition(cond.id)}
          />
        ))}
      </div>

      {/* Child groups */}
      {childGroups.map((child) => (
        <RuleGroupBlock
          key={child.id}
          group={child}
          allGroups={allGroups}
          allConditions={allConditions}
          depth={depth + 1}
          onUpdate={onUpdate}
          onRemove={onRemove}
          onAddCondition={onAddCondition}
          onUpdateCondition={onUpdateCondition}
          onRemoveCondition={onRemoveCondition}
          onAddChildGroup={onAddChildGroup}
        />
      ))}
    </div>
  );
}

// ── ConditionRow ──────────────────────────────────────────────────────────────
type ConditionRowProps = {
  condition: RuleCondition;
  onUpdate: (patch: Partial<RuleCondition>) => void;
  onRemove: () => void;
};

function ConditionRow({ condition, onUpdate, onRemove }: ConditionRowProps) {
  const comparators = getComparatorsForField(condition.field);
  const isBoolean = BOOLEAN_FIELDS.includes(condition.field);
  const showValue = !isBoolean && condition.comparator !== "exists" && condition.comparator !== "not_exists";

  const handleFieldChange = (field: ConditionField) => {
    const newComparators = getComparatorsForField(field);
    const comparator = newComparators.includes(condition.comparator)
      ? condition.comparator
      : newComparators[0];
    onUpdate({ field, comparator, value: "" });
  };

  return (
    <div className="rule-condition-row">
      <div className="rule-condition-chip">{FIELD_LABELS[condition.field]}</div>

      <select
        className="rule-select rule-select--field"
        value={condition.field}
        onChange={(e) => handleFieldChange(e.target.value as ConditionField)}
      >
        {ALL_FIELDS.map((f) => (
          <option key={f} value={f}>{FIELD_LABELS[f]}</option>
        ))}
      </select>

      <select
        className="rule-select rule-select--comparator"
        value={condition.comparator}
        onChange={(e) => onUpdate({ comparator: e.target.value as Comparator })}
      >
        {comparators.map((c) => (
          <option key={c} value={c}>{COMPARATOR_LABELS[c]}</option>
        ))}
      </select>

      {showValue && (
        <input
          type={condition.field === "price" || condition.field === "compare_at_price" || condition.field === "inventory" ? "number" : "text"}
          className="rule-input rule-input--value"
          placeholder={getValuePlaceholder(condition.field)}
          value={condition.value}
          onChange={(e) => onUpdate({ value: e.target.value })}
        />
      )}

      {!showValue && <div className="rule-condition-static">No value needed</div>}

      <button className="rule-btn rule-btn--remove" onClick={onRemove} title="Remove condition">
        ×
      </button>
    </div>
  );
}

// ── Human summary builder ─────────────────────────────────────────────────────
function buildSummary(groups: RuleGroup[], conditions: RuleCondition[]): string {
  const rootGroup = groups.find((g) => g.parentGroupId === null);
  if (!rootGroup) return "No rules defined — campaign will match all products.";

  const directConds = conditions.filter((c) => c.groupId === rootGroup.id);
  const childGroups = groups.filter((g) => g.parentGroupId === rootGroup.id);

  const parts: string[] = directConds.map((c) => {
    const fieldLabel = FIELD_LABELS[c.field];
    const compLabel = COMPARATOR_LABELS[c.comparator];
    return c.comparator === "exists" || c.comparator === "not_exists"
      ? `${fieldLabel} ${compLabel}`
      : `${fieldLabel} ${compLabel} "${c.value}"`;
  });

  const subParts: string[] = childGroups.map((g) => {
    const mode = g.includeMode === "exclude" ? "EXCEPT when" : "AND when";
    const subConds = conditions.filter((c) => c.groupId === g.id);
    if (subConds.length === 0) return `${mode} (empty sub-group)`;
    const subDesc = subConds.map((c) => c.comparator === "exists" || c.comparator === "not_exists"
      ? `${FIELD_LABELS[c.field]} ${COMPARATOR_LABELS[c.comparator]}`
      : `${FIELD_LABELS[c.field]} ${COMPARATOR_LABELS[c.comparator]} "${c.value}"`).join(` ${g.operator} `);
    return `${mode} ${subDesc}`;
  });

  if (parts.length === 0 && subParts.length === 0) {
    return "No conditions — campaign will match all products.";
  }

  let summary = parts.join(` ${rootGroup.operator} `);
  if (subParts.length > 0) {
    summary = (summary ? summary + " " : "") + subParts.join(". ");
  }

  const mode = rootGroup.includeMode === "exclude" ? "EXCLUDE when" : "Show when";
  return `${mode} ${summary}`;
}

// ── RuleBuilder (main export) ─────────────────────────────────────────────────
export default function RuleBuilder({ groups, conditions, onChange }: Props) {
  const rootGroup = groups.find((g) => g.parentGroupId === null);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleUpdateGroup = (id: string, patch: Partial<RuleGroup>) => {
    onChange(
      groups.map((g) => (g.id === id ? { ...g, ...patch } : g)),
      conditions
    );
  };

  const handleRemoveGroup = (id: string) => {
    // Remove group and all its descendants + conditions
    const idsToRemove = collectDescendants(id, groups);
    idsToRemove.add(id);
    onChange(
      groups.filter((g) => !idsToRemove.has(g.id)),
      conditions.filter((c) => !idsToRemove.has(c.groupId))
    );
  };

  const handleAddCondition = (groupId: string) => {
    const newCond: RuleCondition = {
      id: `rc_${uuid().slice(0, 8)}`,
      groupId,
      field: "product_tag",
      comparator: "contains",
      value: "",
      sortOrder: conditions.filter((c) => c.groupId === groupId).length,
    };
    onChange(groups, [...conditions, newCond]);
  };

  const handleUpdateCondition = (id: string, patch: Partial<RuleCondition>) => {
    onChange(groups, conditions.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const handleRemoveCondition = (id: string) => {
    onChange(groups, conditions.filter((c) => c.id !== id));
  };

  const handleAddChildGroup = (parentId: string) => {
    const newGroup: RuleGroup = {
      id: `rg_${uuid().slice(0, 8)}`,
      parentGroupId: parentId,
      operator: "AND",
      includeMode: "include",
      sortOrder: groups.filter((g) => g.parentGroupId === parentId).length,
    };
    onChange([...groups, newGroup], conditions);
  };

  // ── Init root if missing ───────────────────────────────────────────────────
  const [initialized, setInitialized] = useState(false);
  if (!rootGroup && !initialized) {
    setInitialized(true);
    const rootId = `rg_root_${uuid().slice(0, 8)}`;
    onChange(
      [{ id: rootId, parentGroupId: null, operator: "AND", includeMode: "include", sortOrder: 0 }],
      conditions
    );
    return null;
  }

  const summary = buildSummary(groups, conditions);

  return (
    <div className="rule-builder">
      {rootGroup && (
        <RuleGroupBlock
          group={rootGroup}
          allGroups={groups}
          allConditions={conditions}
          depth={0}
          onUpdate={handleUpdateGroup}
          onRemove={handleRemoveGroup}
          onAddCondition={handleAddCondition}
          onUpdateCondition={handleUpdateCondition}
          onRemoveCondition={handleRemoveCondition}
          onAddChildGroup={handleAddChildGroup}
        />
      )}
      <div className="rule-summary">
        <span className="rule-summary-label">Summary:</span>
        <span className="rule-summary-text">{summary}</span>
      </div>
    </div>
  );
}

function collectDescendants(groupId: string, groups: RuleGroup[]): Set<string> {
  const result = new Set<string>();
  const children = groups.filter((g) => g.parentGroupId === groupId);
  for (const child of children) {
    result.add(child.id);
    for (const id of collectDescendants(child.id, groups)) {
      result.add(id);
    }
  }
  return result;
}
