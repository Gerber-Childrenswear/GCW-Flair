// Nested conditions UI for the Badge editor.
//
// Goes BEYOND real Flair (which is flat ALL/ANY only) by supporting
// nested groups with per-group ALL/ANY + Include/Exclude. Shape:
//
//   Show this badge based on:  (·) ALL  ( ) ANY
//   ─── per row ───
//   [Field ▾]  [is ▾]  [Type to select items …]  🗑
//   ─── per row ───
//   ...
//
//   ┃ AND, EXCEPT when:  (·) ALL  ( ) ANY              ×
//   ┃ ─── per row ───
//   ┃ [Field ▾]  [is ▾]  [Type to select items …]  🗑
//   ┃ + Add condition       + Add nested group
//
//   + Add condition       + Add nested group
//
// ───────────────────────────────────────────────────────────────────────
// FOR NICK — VALUE PICKER WIRING
// ───────────────────────────────────────────────────────────────────────
// The value picker is mocked here as a free-text chip input (type a value,
// press Enter, chip appears). In production this needs to be a real
// type-ahead pulling live data from Shopify — see FIELD_OPTIONS below for
// what each field maps to:
//   - page_type      → enumerated list (product / collection / search / …)
//   - product_tag    → all product tags in the store, type-ahead
//   - collection_id  → all collection handles, type-ahead
//   - product_type   → distinct product types in the catalog
//   - vendor         → distinct vendors in the catalog
//   - customer_tag   → customer tags via Shopify Customers API
// Once the real source is wired, the chip-input swap is the only React
// change needed — the rest of this component already works against the
// existing Campaign types (RuleGroup + RuleCondition).
//
// Underlying data model: groups form a tree via RuleGroup.parentGroupId.
// Each row in the UI maps to one or more RuleConditions on the row's group
// ("is" / "is not" → eq/neq for scalars, contains/not_contains for arrays).

import { useState } from "react";
import type {
  RuleGroup,
  RuleCondition,
  ConditionField,
  Comparator,
  Operator,
  IncludeMode,
} from "../types/campaign";

// ─── Fields surfaced to the Badge editor — a curated subset of the full
//     ConditionField enum. Extend here when Nick is ready to wire more. ──
type FieldOption = {
  value: ConditionField;
  label: string;
  placeholder: string;
};

const FIELD_OPTIONS: FieldOption[] = [
  { value: "page_type",     label: "Page Type",     placeholder: "Search for page types" },
  { value: "product_tag",   label: "Product Tag",   placeholder: "Search for product tags" },
  { value: "collection_id", label: "Collection",    placeholder: "Search for collections" },
  { value: "product_type",  label: "Product Type",  placeholder: "Search for product types" },
  { value: "vendor",        label: "Vendor",        placeholder: "Search for vendors" },
  { value: "customer_tag",  label: "Customer Tag",  placeholder: "Search for customer tags" },
];

// ─── Simplified comparator for the UI; mapped to the real Comparator type
//     per-field when persisting. ──────────────────────────────────────────
type SimpleComparator = "is" | "is_not";

const ARRAY_LIKE: ConditionField[] = ["product_tag", "collection_id", "customer_tag"];

function comparatorToSimple(c: Comparator): SimpleComparator {
  return c === "neq" || c === "not_contains" || c === "not_in" || c === "not_exists"
    ? "is_not"
    : "is";
}

function simpleToComparator(s: SimpleComparator, field: ConditionField): Comparator {
  const isArray = ARRAY_LIKE.includes(field);
  if (s === "is") return isArray ? "contains" : "eq";
  return isArray ? "not_contains" : "neq";
}

// ─── Row model — multiple RuleConditions for the same (field, comparator)
//     in the same group collapse into one row with N chips. ──────────────
type Row = {
  field: ConditionField;
  comparator: SimpleComparator;
  values: string[];
};

function conditionsToRows(conditions: RuleCondition[]): Row[] {
  const grouped = new Map<string, Row>();
  for (const c of conditions) {
    const simple = comparatorToSimple(c.comparator);
    const key = `${c.field}:${simple}`;
    if (!grouped.has(key)) {
      grouped.set(key, { field: c.field, comparator: simple, values: [] });
    }
    grouped.get(key)!.values.push(c.value);
  }
  return Array.from(grouped.values());
}

function rowsToConditions(rows: Row[], groupId: string): RuleCondition[] {
  const out: RuleCondition[] = [];
  let sortOrder = 0;
  for (const row of rows) {
    // Empty rows still represent intent — they re-appear from local state
    // but don't emit dangling conditions until they have at least one chip.
    if (row.values.length === 0) continue;
    for (const value of row.values) {
      out.push({
        id: `rc_${groupId}_${row.field}_${value}_${sortOrder}`,
        groupId,
        field: row.field,
        comparator: simpleToComparator(row.comparator, row.field),
        value,
        sortOrder: sortOrder++,
      });
    }
  }
  return out;
}

// Random short id for new groups. Stable enough for the editor session —
// the persistence layer can re-id on save if it wants global uniqueness.
function shortId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}_${Date.now().toString(36).slice(-4)}`;
}

// Collect descendant group ids (excluding the root). Used when a group is
// removed so its whole subtree comes with it.
function collectDescendants(groupId: string, allGroups: RuleGroup[]): Set<string> {
  const out = new Set<string>();
  const children = allGroups.filter((g) => g.parentGroupId === groupId);
  for (const child of children) {
    out.add(child.id);
    for (const descId of collectDescendants(child.id, allGroups)) {
      out.add(descId);
    }
  }
  return out;
}

// ═══════════════════════════════════════════════════════════════════════════
// Chip-input — the mocked value picker. Free-text in, chip out on Enter.
// FOR NICK: replace this with a live type-ahead per-field (see file header).
// ═══════════════════════════════════════════════════════════════════════════
function ChipInput({
  values,
  placeholder,
  onAdd,
  onRemove,
}: {
  values: string[];
  placeholder: string;
  onAdd: (v: string) => void;
  onRemove: (v: string) => void;
}) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const v = draft.trim();
    if (!v) return;
    onAdd(v);
    setDraft("");
  };

  return (
    <div className="bc-chip-input">
      <input
        type="text"
        className="bc-chip-input-field"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            commit();
          } else if (e.key === "Backspace" && !draft && values.length > 0) {
            onRemove(values[values.length - 1]);
          }
        }}
        onBlur={commit}
        placeholder={placeholder}
      />
      {values.length > 0 && (
        <div className="bc-chips">
          {values.map((v) => (
            <span key={v} className="bc-chip">
              {v}
              <button
                type="button"
                className="bc-chip-remove"
                onClick={() => onRemove(v)}
                aria-label={`Remove ${v}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// GroupBlock — recursive. Renders one RuleGroup's rows + nested children.
// Reads from the full allGroups/allConditions arrays so updates can produce
// the next full arrays in a single onChange dispatch.
// ═══════════════════════════════════════════════════════════════════════════
type GroupBlockProps = {
  groupId: string;
  depth: number;
  parentOperator: Operator | null; // null at root
  allGroups: RuleGroup[];
  allConditions: RuleCondition[];
  onChange: (groups: RuleGroup[], conditions: RuleCondition[]) => void;
};

function GroupBlock({
  groupId,
  depth,
  parentOperator,
  allGroups,
  allConditions,
  onChange,
}: GroupBlockProps) {
  const group = allGroups.find((g) => g.id === groupId);
  if (!group) return null;

  const isRoot = group.parentGroupId === null;
  const myConditions = allConditions
    .filter((c) => c.groupId === groupId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const rows = conditionsToRows(myConditions);
  const childGroups = allGroups
    .filter((g) => g.parentGroupId === groupId)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Commit a new set of rows for THIS group only, preserving conditions in
  // every other group.
  const commitRows = (nextRows: Row[]) => {
    const others = allConditions.filter((c) => c.groupId !== groupId);
    const mine = rowsToConditions(nextRows, groupId);
    onChange(allGroups, [...others, ...mine]);
  };

  const updateGroup = (patch: Partial<RuleGroup>) => {
    onChange(
      allGroups.map((g) => (g.id === groupId ? { ...g, ...patch } : g)),
      allConditions,
    );
  };

  const removeGroup = () => {
    const idsToRemove = collectDescendants(groupId, allGroups);
    idsToRemove.add(groupId);
    onChange(
      allGroups.filter((g) => !idsToRemove.has(g.id)),
      allConditions.filter((c) => !idsToRemove.has(c.groupId)),
    );
  };

  const addChildGroup = () => {
    const newGroup: RuleGroup = {
      id: shortId("rg"),
      parentGroupId: groupId,
      operator: "AND",
      includeMode: "include",
      sortOrder: childGroups.length,
    };
    onChange([...allGroups, newGroup], allConditions);
  };

  const addRow = () => {
    commitRows([...rows, { field: "page_type", comparator: "is", values: [] }]);
  };

  // Local-only state for in-progress empty rows so a brand-new row can sit
  // visible without immediately persisting an empty RuleCondition. We track
  // empty-row count by inferring from local visible rows below.
  // (Rows with at least one chip round-trip cleanly through the data model.)
  const [emptyRowCount, setEmptyRowCount] = useState<number>(0);

  // Visible rows = persisted rows + any locally-staged empty rows.
  const visibleRows: Row[] = [
    ...rows,
    ...Array.from({ length: emptyRowCount }, () => ({
      field: "page_type" as ConditionField,
      comparator: "is" as SimpleComparator,
      values: [] as string[],
    })),
  ];

  const handleAddRow = () => {
    // Either bump the staged-empty counter or commit a real row if there
    // is no existing empty one to reuse.
    if (rows.some((r) => r.values.length === 0)) {
      // already an empty row — no-op
      return;
    }
    setEmptyRowCount((n) => n + 1);
  };

  const handleRemoveRow = (i: number) => {
    if (i < rows.length) {
      // Removing a persisted row
      commitRows(rows.filter((_, idx) => idx !== i));
    } else {
      // Removing a locally-staged empty row
      setEmptyRowCount((n) => Math.max(0, n - 1));
    }
  };

  const handleFieldChange = (i: number, field: ConditionField) => {
    if (i < rows.length) {
      commitRows(rows.map((r, idx) => (idx === i ? { ...r, field } : r)));
    }
    // Empty staged rows: field only matters when chips get added; we'll
    // commit on first chip with the field value at that moment.
  };

  const handleComparatorChange = (i: number, comparator: SimpleComparator) => {
    if (i < rows.length) {
      commitRows(rows.map((r, idx) => (idx === i ? { ...r, comparator } : r)));
    }
  };

  const handleAddChip = (i: number, value: string) => {
    const v = value.trim();
    if (!v) return;
    if (i < rows.length) {
      commitRows(
        rows.map((r, idx) =>
          idx === i
            ? { ...r, values: r.values.includes(v) ? r.values : [...r.values, v] }
            : r,
        ),
      );
    } else {
      // First chip on a staged empty row → promote it to a real row
      const stagedIndex = i - rows.length;
      const row = visibleRows[i];
      const promoted: Row = { ...row, values: [v] };
      commitRows([...rows, promoted]);
      // Decrement staged count; the promoted row is now persisted.
      setEmptyRowCount((n) => Math.max(0, n - 1));
      // (stagedIndex referenced for clarity; nothing else uses it)
      void stagedIndex;
    }
  };

  const handleRemoveChip = (i: number, value: string) => {
    if (i < rows.length) {
      commitRows(
        rows.map((r, idx) =>
          idx === i ? { ...r, values: r.values.filter((x) => x !== value) } : r,
        ),
      );
    }
  };

  // ── Header copy ─────────────────────────────────────────────────────────
  // Root: "Show this badge based on: …"
  // Nested: "AND, EXCEPT when:" / "AND, where:" / "OR, EXCEPT when:" / …
  const renderHeader = () => {
    if (isRoot) {
      return (
        <div className="bc-operator-row">
          <span className="bc-operator-label">Show this badge based on:</span>
          <label className="bc-radio">
            <input
              type="radio"
              name={`bc-operator-${groupId}`}
              checked={group.operator === "AND"}
              onChange={() => updateGroup({ operator: "AND" })}
            />
            <span>
              <strong>ALL</strong> conditions
            </span>
          </label>
          <label className="bc-radio">
            <input
              type="radio"
              name={`bc-operator-${groupId}`}
              checked={group.operator === "OR"}
              onChange={() => updateGroup({ operator: "OR" })}
            />
            <span>
              <strong>ANY</strong> conditions
            </span>
          </label>
        </div>
      );
    }

    // Nested group header. parentOperator joins this group to its siblings;
    // group.includeMode toggles match-vs-negate; group.operator is its own
    // internal join.
    const joinWord = parentOperator === "OR" ? "OR" : "AND";
    const behaviorWord = group.includeMode === "exclude" ? "EXCEPT when" : "where";

    return (
      <div className="bc-nested-head">
        <div className="bc-nested-prefix">
          <span className="bc-join-word">{joinWord}</span>
          <span className="bc-nested-sep">,</span>
          <button
            type="button"
            className={`bc-mode-pill ${group.includeMode}`}
            onClick={() =>
              updateGroup({
                includeMode: (group.includeMode === "exclude" ? "include" : "exclude") as IncludeMode,
              })
            }
            title={
              group.includeMode === "exclude"
                ? "Negated group — click to switch to match"
                : "Match group — click to switch to negate (EXCEPT when)"
            }
          >
            {behaviorWord}:
          </button>
        </div>
        <div className="bc-nested-operator">
          <label className="bc-radio bc-radio--compact">
            <input
              type="radio"
              name={`bc-operator-${groupId}`}
              checked={group.operator === "AND"}
              onChange={() => updateGroup({ operator: "AND" })}
            />
            <span>
              <strong>ALL</strong>
            </span>
          </label>
          <label className="bc-radio bc-radio--compact">
            <input
              type="radio"
              name={`bc-operator-${groupId}`}
              checked={group.operator === "OR"}
              onChange={() => updateGroup({ operator: "OR" })}
            />
            <span>
              <strong>ANY</strong>
            </span>
          </label>
        </div>
        <button
          type="button"
          className="bc-nested-remove"
          onClick={removeGroup}
          title="Remove nested group"
          aria-label="Remove nested group"
        >
          <svg viewBox="0 0 20 20" aria-hidden="true" width="14" height="14">
            <path
              d="M7 3h6l1 2h3v2H3V5h3l1-2zm-2 5h10l-1 9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 8zm3 2v8h1v-8H8zm3 0v8h1v-8h-1z"
              fill="currentColor"
            />
          </svg>
        </button>
      </div>
    );
  };

  const groupClass = isRoot ? "bc-group bc-group--root" : `bc-group bc-group--nested bc-group--depth-${Math.min(depth, 4)}`;

  // Used so the add-condition affordance below the rows only renders once a
  // brand-new staged row's add button hasn't already given them a working row.
  void addRow;

  return (
    <div className={groupClass}>
      {renderHeader()}
      {(visibleRows.length > 0 || childGroups.length > 0) && isRoot && (
        <hr className="bc-divider" />
      )}

      {visibleRows.map((row, i) => {
        const fieldOpt = FIELD_OPTIONS.find((f) => f.value === row.field);
        return (
          <div key={`row-${i}`} className="bc-row">
            <select
              className="bc-select"
              value={row.field}
              onChange={(e) => handleFieldChange(i, e.target.value as ConditionField)}
            >
              {FIELD_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
            <select
              className="bc-select"
              value={row.comparator}
              onChange={(e) => handleComparatorChange(i, e.target.value as SimpleComparator)}
            >
              <option value="is">is</option>
              <option value="is_not">is not</option>
            </select>
            <div className="bc-value-cell">
              <ChipInput
                values={row.values}
                placeholder={fieldOpt?.placeholder ?? "Enter values"}
                onAdd={(v) => handleAddChip(i, v)}
                onRemove={(v) => handleRemoveChip(i, v)}
              />
            </div>
            <button
              type="button"
              className="bc-row-remove"
              onClick={() => handleRemoveRow(i)}
              title="Remove condition"
              aria-label="Remove condition"
            >
              <svg viewBox="0 0 20 20" aria-hidden="true" width="16" height="16">
                <path
                  d="M7 3h6l1 2h3v2H3V5h3l1-2zm-2 5h10l-1 9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 8zm3 2v8h1v-8H8zm3 0v8h1v-8h-1z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        );
      })}

      {childGroups.map((child) => (
        <GroupBlock
          key={child.id}
          groupId={child.id}
          depth={depth + 1}
          parentOperator={group.operator}
          allGroups={allGroups}
          allConditions={allConditions}
          onChange={onChange}
        />
      ))}

      {/* "Add nested group" (not "Add nested condition") — what gets added
          is a CONTAINER that then holds multiple conditions, each with its
          own field/comparator/value row. Calling it "nested condition"
          would imply one click → one condition, which breaks down as soon
          as the merchant adds a second row inside the nested block. The
          indentation already conveys nesting visually, so an alternative
          phrasing of just "+ Add condition group" would also work if the
          word "nested" reads too technical to merchants later. */}
      <div className="bc-group-actions">
        <button type="button" className="bc-add-btn" onClick={handleAddRow}>
          <span className="bc-add-btn-icon" aria-hidden>+</span>
          Add condition
        </button>
        <button type="button" className="bc-add-btn bc-add-btn--group" onClick={addChildGroup}>
          <span className="bc-add-btn-icon" aria-hidden>+</span>
          Add nested group
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main component — drop-in replacement for the old RuleBuilder inside
// BadgeEditor. Same interface (groups + conditions + onChange).
// ═══════════════════════════════════════════════════════════════════════════
type Props = {
  groups: RuleGroup[];
  conditions: RuleCondition[];
  onChange: (groups: RuleGroup[], conditions: RuleCondition[]) => void;
};

export default function BadgeConditions({ groups, conditions, onChange }: Props) {
  // Ensure a single root group exists. If callers loaded a campaign that
  // happens to have no root, we pin one in immediately so the recursive
  // renderer has something to anchor on.
  const rootGroup = groups.find((g) => g.parentGroupId === null);

  if (!rootGroup) {
    const seeded: RuleGroup = {
      id: shortId("rg_root"),
      parentGroupId: null,
      operator: "AND",
      includeMode: "include",
      sortOrder: 0,
    };
    // Defer to the next render — pushing the seeded root up to the parent
    // gives it ownership and re-enters this component with a root present.
    queueMicrotask(() => onChange([seeded, ...groups], conditions));
    return null;
  }

  return (
    <div className="bc-root">
      <GroupBlock
        groupId={rootGroup.id}
        depth={0}
        parentOperator={null}
        allGroups={groups}
        allConditions={conditions}
        onChange={onChange}
      />
    </div>
  );
}
