// Settings → Colors — the admin home for the brand palette.
//
// This is the ONLY place in Flair where hex values are visible or editable.
// Style editors and Campaign editors consume colors by ID from here — they
// see name + swatch only. See Decision #5 in the vision brief.
//
// Styling lives in src/styles/settings-colors.css (sc-* class prefix).

import { useState, useRef } from "react";
import { SEED_COLOR_GROUPS, SEED_COLORS, SEED_AUDIT_LOG } from "../data/color-palette";
import type { Color, ColorAuditEntry, ColorGroup, ImportValidationResult } from "../types/color";

const SETTINGS_ACTOR = "darilee@gerberchildrenswear.com"; // placeholder until auth wires in

// Mock usage counts — replaced by real counts once Styles reference colors by ID.
const MOCK_USAGE: Record<string, { styles: number; instances: number }> = {
  clr_001: { styles: 6, instances: 42 },
  clr_002: { styles: 2, instances: 8 },
  clr_004: { styles: 3, instances: 17 },
  clr_005: { styles: 4, instances: 23 },
  clr_006: { styles: 1, instances: 3 },
  clr_007: { styles: 2, instances: 11 },
  clr_013: { styles: 5, instances: 31 },
  clr_018: { styles: 3, instances: 14 },
};

// Mock Style names referencing each color — used by the Delete modal to show
// the admin exactly what they're about to reassign. Real implementation queries
// Styles where a creative property's color ID matches.
const MOCK_STYLES_BY_COLOR: Record<string, string[]> = {
  clr_001: ["Default Navy", "PDP Hero", "Header Strip", "Cart Banner", "Newsletter", "Trust Pill"],
  clr_002: ["Trust Badge", "New Arrival"],
  clr_004: ["Soft CTA", "Newsletter Tile", "Footer Surface"],
  clr_005: ["Summer Sale", "Warning Pill", "Spring Promo", "Easter Sale"],
  clr_006: ["Autumn Hero"],
  clr_007: ["Sale Pill", "Clearance Banner"],
  clr_013: ["Default Text", "Hero Headline", "Banner Body", "Subtle Border", "Card Highlight"],
  clr_018: ["Final Hours", "Flash Sale", "Markdown Tag"],
};

function generateColorId(): string {
  return `clr_${Math.random().toString(36).slice(2, 8)}`;
}

function generateAuditId(): string {
  return `audit_${Math.random().toString(36).slice(2, 10)}`;
}

function generateGroupId(): string {
  return `grp_${Math.random().toString(36).slice(2, 8)}`;
}

function ColorSwatch({ hex, size = 24 }: { hex: string; size?: number }) {
  return <span className="sc-swatch" style={{ width: size, height: size, background: hex }} />;
}

// ═══════════════════════════════════════════════════════════════════════════
// Main page
// ═══════════════════════════════════════════════════════════════════════════

export default function SettingsColors() {
  const [colors, setColors] = useState<Color[]>(SEED_COLORS);
  const [groups, setGroups] = useState<ColorGroup[]>(SEED_COLOR_GROUPS);
  const [auditLog, setAuditLog] = useState<ColorAuditEntry[]>(SEED_AUDIT_LOG);
  const [activeGroupId, setActiveGroupId] = useState<string>("__all");

  // Modal state for colors
  const [colorForm, setColorForm] = useState<{ mode: "add" | "edit"; colorId?: string } | null>(null);
  const [deletingColor, setDeletingColor] = useState<Color | null>(null);
  const [showImport, setShowImport] = useState(false);

  // Group management state
  const [addingGroup, setAddingGroup] = useState(false);
  const [renamingGroupId, setRenamingGroupId] = useState<string | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<ColorGroup | null>(null);

  // Search / sort / reorder
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"custom" | "name" | "hex" | "usage">("custom");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // ─── Visible list: group filter → search filter → sort ───────────────────
  const groupFiltered: Color[] =
    activeGroupId === "__all" ? colors : colors.filter((c) => c.groupId === activeGroupId);

  const searchFiltered = search.trim()
    ? groupFiltered.filter((c) => {
        const q = search.trim().toLowerCase();
        return c.name.toLowerCase().includes(q) || c.hex.toLowerCase().includes(q);
      })
    : groupFiltered;

  const visibleColors: Color[] = [...searchFiltered].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name) * dir;
      case "hex":
        return a.hex.localeCompare(b.hex) * dir;
      case "usage": {
        const aUsage = MOCK_USAGE[a.id]?.styles ?? 0;
        const bUsage = MOCK_USAGE[b.id]?.styles ?? 0;
        return (aUsage - bUsage) * dir;
      }
      case "custom":
      default:
        if (a.groupId !== b.groupId) {
          const aIdx = groups.findIndex((g) => g.id === a.groupId);
          const bIdx = groups.findIndex((g) => g.id === b.groupId);
          return (aIdx - bIdx) * dir;
        }
        return (a.sortOrder - b.sortOrder) * dir;
    }
  });

  // ─── Audit log helper ────────────────────────────────────────────────────
  function addAuditEntry(entry: Omit<ColorAuditEntry, "id" | "timestamp" | "actor">) {
    const e: ColorAuditEntry = {
      id: generateAuditId(),
      timestamp: new Date().toISOString(),
      actor: SETTINGS_ACTOR,
      ...entry,
    };
    setAuditLog((prev) => [e, ...prev]);
  }

  // ─── Color CRUD ──────────────────────────────────────────────────────────
  function handleAddColor(input: { name: string; hex: string; groupId: string }) {
    const now = new Date().toISOString();
    const newColor: Color = {
      id: generateColorId(),
      name: input.name.trim(),
      hex: input.hex.toLowerCase(),
      groupId: input.groupId,
      sortOrder: colors.filter((c) => c.groupId === input.groupId).length,
      createdAt: now,
      updatedAt: now,
    };
    setColors((prev) => [...prev, newColor]);
    addAuditEntry({
      action: "add",
      targetType: "color",
      targetId: newColor.id,
      diff: { after: { name: newColor.name, hex: newColor.hex } },
    });
    setColorForm(null);
  }

  function handleEditColor(colorId: string, patch: { name: string; hex: string; groupId: string }) {
    const before = colors.find((c) => c.id === colorId);
    if (!before) return;
    const now = new Date().toISOString();
    const after: Color = {
      ...before,
      name: patch.name.trim(),
      hex: patch.hex.toLowerCase(),
      groupId: patch.groupId,
      updatedAt: now,
    };
    setColors((prev) => prev.map((c) => (c.id === colorId ? after : c)));
    if (before.name !== after.name) {
      addAuditEntry({
        action: "edit_name", targetType: "color", targetId: colorId,
        diff: { before: { name: before.name }, after: { name: after.name } },
      });
    }
    if (before.hex !== after.hex) {
      addAuditEntry({
        action: "edit_hex", targetType: "color", targetId: colorId,
        diff: { before: { hex: before.hex }, after: { hex: after.hex } },
      });
    }
    if (before.groupId !== after.groupId) {
      addAuditEntry({
        action: "edit_group", targetType: "color", targetId: colorId,
        diff: { before: { groupId: before.groupId }, after: { groupId: after.groupId } },
      });
    }
    setColorForm(null);
  }

  function handleDeleteColor(
    colorId: string,
    resolution:
      | { mode: "transfer"; targetId: string }
      | { mode: "replace"; name: string; hex: string; groupId: string },
  ) {
    const before = colors.find((c) => c.id === colorId);
    if (!before) return;
    if (resolution.mode === "replace") {
      const now = new Date().toISOString();
      const replacement: Color = {
        id: generateColorId(),
        name: resolution.name.trim(),
        hex: resolution.hex.toLowerCase(),
        groupId: resolution.groupId,
        sortOrder: colors.filter((c) => c.groupId === resolution.groupId).length,
        createdAt: now,
        updatedAt: now,
      };
      setColors((prev) => [...prev.filter((c) => c.id !== colorId), replacement]);
      addAuditEntry({
        action: "add", targetType: "color", targetId: replacement.id,
        diff: { after: { name: replacement.name, hex: replacement.hex } },
      });
      addAuditEntry({
        action: "delete", targetType: "color", targetId: colorId,
        diff: { before: { name: before.name, hex: before.hex } },
      });
    } else {
      setColors((prev) => prev.filter((c) => c.id !== colorId));
      addAuditEntry({
        action: "delete", targetType: "color", targetId: colorId,
        diff: { before: { name: before.name, hex: before.hex } },
      });
    }
    setDeletingColor(null);
  }

  // ─── Sort + reorder ──────────────────────────────────────────────────────
  function handleSortClick(col: "custom" | "name" | "hex" | "usage") {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("asc");
    }
  }

  function moveColor(colorId: string, direction: "up" | "down") {
    const color = colors.find((c) => c.id === colorId);
    if (!color) return;
    const peers = colors
      .filter((c) => c.groupId === color.groupId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = peers.findIndex((c) => c.id === colorId);
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= peers.length) return;
    const a = peers[idx];
    const b = peers[newIdx];
    setColors((prev) =>
      prev.map((c) => {
        if (c.id === a.id) return { ...c, sortOrder: b.sortOrder, updatedAt: new Date().toISOString() };
        if (c.id === b.id) return { ...c, sortOrder: a.sortOrder, updatedAt: new Date().toISOString() };
        return c;
      }),
    );
  }

  // ─── JSON export / import ────────────────────────────────────────────────
  function handleExportJson() {
    const payload = { version: 1, exportedAt: new Date().toISOString(), colors, groups };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gcw-flair-palette-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addAuditEntry({
      action: "export", targetType: "color", targetId: "_palette",
      diff: { after: { name: `Exported ${colors.length} colors` } },
    });
  }

  function handleApplyImport(importedColors: Color[], importedGroups: ColorGroup[]) {
    setColors(importedColors);
    if (importedGroups.length > 0) setGroups(importedGroups);
    addAuditEntry({
      action: "import", targetType: "color", targetId: "_palette",
      diff: { after: { name: `Imported ${importedColors.length} colors` } },
    });
    setShowImport(false);
  }

  // ─── Group CRUD ──────────────────────────────────────────────────────────
  function handleAddGroup(name: string) {
    if (!name.trim()) return;
    const newGroup: ColorGroup = { id: generateGroupId(), name: name.trim(), sortOrder: groups.length };
    setGroups((prev) => [...prev, newGroup]);
    addAuditEntry({
      action: "group_add", targetType: "group", targetId: newGroup.id,
      diff: { after: { name: newGroup.name } },
    });
    setAddingGroup(false);
  }

  function handleRenameGroup(groupId: string, newName: string) {
    const before = groups.find((g) => g.id === groupId);
    if (!before || !newName.trim() || newName.trim() === before.name) {
      setRenamingGroupId(null);
      return;
    }
    const after = { ...before, name: newName.trim() };
    setGroups((prev) => prev.map((g) => (g.id === groupId ? after : g)));
    addAuditEntry({
      action: "group_rename", targetType: "group", targetId: groupId,
      diff: { before: { name: before.name }, after: { name: after.name } },
    });
    setRenamingGroupId(null);
  }

  function handleDeleteGroup(groupId: string, transferToGroupId: string) {
    const before = groups.find((g) => g.id === groupId);
    if (!before) return;
    setColors((prev) =>
      prev.map((c) =>
        c.groupId === groupId ? { ...c, groupId: transferToGroupId, updatedAt: new Date().toISOString() } : c,
      ),
    );
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    addAuditEntry({
      action: "group_delete", targetType: "group", targetId: groupId,
      diff: { before: { name: before.name } },
    });
    if (activeGroupId === groupId) setActiveGroupId("__all");
    setDeletingGroup(null);
  }

  return (
    <div className="sc-page">
      <div className="sc-page-head">
        <div>
          <div className="sc-eyebrow">Settings · Colors</div>
          <h1 className="sc-title">Colors</h1>
          <p className="sc-deck">
            The single source of truth for brand colors. Hex values are entered here only — Style editors
            across the app consume these by name. Renames and recolors cascade automatically; deletions
            require transfer-or-replace.
          </p>
        </div>
        <div className="sc-page-actions">
          <button type="button" onClick={handleExportJson} className="sc-btn sc-btn--ghost">
            Export JSON
          </button>
          <button type="button" onClick={() => setShowImport(true)} className="sc-btn sc-btn--ghost">
            Import JSON
          </button>
          <button type="button" onClick={() => setColorForm({ mode: "add" })} className="sc-btn sc-btn--primary">
            + Add color
          </button>
        </div>
      </div>

      <div className="sc-layout">
        {/* Groups sidebar */}
        <aside className="panel sc-sidebar">
          <div className="sc-sidebar-label">Groups</div>
          <button
            type="button"
            onClick={() => setActiveGroupId("__all")}
            className={"sc-group-row" + (activeGroupId === "__all" ? " is-active" : "")}
          >
            <span className="sc-group-row-name">All colors</span>
            <span className="sc-group-row-count">{colors.length}</span>
          </button>
          {groups.map((group) => {
            const count = colors.filter((c) => c.groupId === group.id).length;
            return (
              <GroupRow
                key={group.id}
                group={group}
                count={count}
                active={group.id === activeGroupId}
                renaming={renamingGroupId === group.id}
                onSelect={() => setActiveGroupId(group.id)}
                onStartRename={() => setRenamingGroupId(group.id)}
                onCommitRename={(name) => handleRenameGroup(group.id, name)}
                onCancelRename={() => setRenamingGroupId(null)}
                onDelete={() => setDeletingGroup(group)}
              />
            );
          })}

          {addingGroup ? (
            <NewGroupRow onCommit={handleAddGroup} onCancel={() => setAddingGroup(false)} />
          ) : (
            <button
              type="button"
              onClick={() => setAddingGroup(true)}
              className="sc-group-row sc-new-group-trigger"
            >
              + New group
            </button>
          )}
        </aside>

        {/* Main panel */}
        <div>
          {/* Toolbar */}
          <div className="sc-toolbar">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search colors by name or hex…"
              className="sc-search"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} className="sc-btn sc-btn--ghost">
                Clear
              </button>
            )}
            <div className="sc-count">
              Showing <strong>{visibleColors.length}</strong>
              {visibleColors.length !== colors.length && (
                <span className="sc-count-faded"> of {colors.length}</span>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="sc-table">
            <div className="sc-table-head">
              <div className="sc-table-head-cell">Swatch</div>
              <SortHeader label="Name" active={sortBy === "name"} dir={sortDir} onClick={() => handleSortClick("name")} />
              <SortHeader label="Hex" active={sortBy === "hex"} dir={sortDir} onClick={() => handleSortClick("hex")} />
              <SortHeader label="Used by" active={sortBy === "usage"} dir={sortDir} onClick={() => handleSortClick("usage")} />
              <div className="sc-table-head-cell sc-table-head-cell--right">
                {sortBy !== "custom" && (
                  <button type="button" onClick={() => handleSortClick("custom")} className="sc-sort-restore" title="Restore manual ordering">
                    Manual
                  </button>
                )}
                <span>Actions</span>
              </div>
            </div>
            {visibleColors.map((color) => {
              const usage = MOCK_USAGE[color.id] ?? { styles: 0, instances: 0 };
              return (
                <div key={color.id} className="sc-table-row">
                  <ColorSwatch hex={color.hex} />
                  <div className="sc-table-name">{color.name}</div>
                  <div className="sc-table-hex">{color.hex.toUpperCase()}</div>
                  <div className="sc-table-used">
                    <strong>{usage.styles}</strong> Style{usage.styles === 1 ? "" : "s"}
                    <div className="sc-table-used-instances">{usage.instances} live instances</div>
                  </div>
                  <div className="sc-table-actions">
                    {sortBy === "custom" && (() => {
                      const peers = colors
                        .filter((c) => c.groupId === color.groupId)
                        .sort((a, b) => a.sortOrder - b.sortOrder);
                      const idx = peers.findIndex((c) => c.id === color.id);
                      const canUp = idx > 0;
                      const canDown = idx >= 0 && idx < peers.length - 1;
                      return (
                        <span className="sc-reorder">
                          <button type="button" onClick={() => moveColor(color.id, "up")} disabled={!canUp} title="Move up in group" className="sc-reorder-btn">▲</button>
                          <button type="button" onClick={() => moveColor(color.id, "down")} disabled={!canDown} title="Move down in group" className="sc-reorder-btn">▼</button>
                        </span>
                      );
                    })()}
                    <button type="button" onClick={() => setColorForm({ mode: "edit", colorId: color.id })} className="sc-row-action">Edit</button>
                    <button type="button" onClick={() => setDeletingColor(color)} className="sc-row-action sc-row-action--danger">Delete</button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Audit log */}
          <div className="panel sc-audit">
            <div className="sc-audit-title">Recent changes · audit log</div>
            <ul className="sc-audit-list">
              {auditLog.slice(0, 8).map((entry) => (
                <li key={entry.id} className="sc-audit-row">
                  <span className="sc-audit-ts">{new Date(entry.timestamp).toLocaleString()}</span>
                  <span className="sc-audit-action">{entry.action}</span>
                  <span>
                    <strong>{entry.targetId}</strong>
                    {entry.diff.before && entry.diff.after && (
                      <>
                        <span className="sc-audit-arrow"> — </span>
                        <span>
                          {String((entry.diff.before as Partial<Color>).name ?? (entry.diff.before as Partial<Color>).hex ?? "")} →{" "}
                          {String((entry.diff.after as Partial<Color>).name ?? (entry.diff.after as Partial<Color>).hex ?? "")}
                        </span>
                      </>
                    )}
                    {!entry.diff.before && entry.diff.after && (
                      <>
                        <span className="sc-audit-arrow"> — </span>
                        <span>{String((entry.diff.after as Partial<Color>).name ?? "")}</span>
                      </>
                    )}
                  </span>
                  <span className="sc-audit-actor">{entry.actor}</span>
                </li>
              ))}
            </ul>
            <div className="sc-audit-more">Full audit log →</div>
          </div>
        </div>
      </div>

      {/* ─── Modals ────────────────────────────────────────────────────── */}

      {colorForm?.mode === "add" && (
        <ColorFormModal
          mode="add"
          groups={groups}
          onCancel={() => setColorForm(null)}
          onSubmit={handleAddColor}
        />
      )}

      {colorForm?.mode === "edit" && colorForm.colorId && (() => {
        const editing = colors.find((c) => c.id === colorForm.colorId);
        if (!editing) return null;
        const usage = MOCK_USAGE[editing.id] ?? { styles: 0, instances: 0 };
        const cascadeHint =
          usage.styles > 0
            ? `Used by ${usage.styles} Style${usage.styles === 1 ? "" : "s"} · cascades to ${usage.instances} live instance${usage.instances === 1 ? "" : "s"}`
            : "Not used in any Style yet — no cascade impact";
        return (
          <ColorFormModal
            mode="edit"
            groups={groups}
            initial={{ name: editing.name, hex: editing.hex, groupId: editing.groupId }}
            cascadeHint={cascadeHint}
            onCancel={() => setColorForm(null)}
            onSubmit={(patch) => handleEditColor(editing.id, patch)}
          />
        );
      })()}

      {deletingColor && (
        <DeleteColorModal
          color={deletingColor}
          palette={colors}
          groups={groups}
          styleNames={MOCK_STYLES_BY_COLOR[deletingColor.id] ?? []}
          onCancel={() => setDeletingColor(null)}
          onSubmit={(resolution) => handleDeleteColor(deletingColor.id, resolution)}
        />
      )}

      {showImport && (
        <ImportColorsModal
          palette={colors}
          groups={groups}
          styleUsage={MOCK_STYLES_BY_COLOR}
          onCancel={() => setShowImport(false)}
          onApply={handleApplyImport}
        />
      )}

      {deletingGroup && (
        <DeleteGroupModal
          group={deletingGroup}
          groups={groups}
          colorsInGroup={colors.filter((c) => c.groupId === deletingGroup.id)}
          onCancel={() => setDeletingGroup(null)}
          onSubmit={(targetGroupId) => handleDeleteGroup(deletingGroup.id, targetGroupId)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════════════════

function SortHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={"sc-sort" + (active ? " is-active" : "")}>
      <span>{label}</span>
      <span className="sc-sort-arrow">{active ? (dir === "asc" ? "▲" : "▼") : "▲"}</span>
    </button>
  );
}

function GroupRow({
  group,
  count,
  active,
  renaming,
  onSelect,
  onStartRename,
  onCommitRename,
  onCancelRename,
  onDelete,
}: {
  group: ColorGroup;
  count: number;
  active: boolean;
  renaming: boolean;
  onSelect: () => void;
  onStartRename: () => void;
  onCommitRename: (name: string) => void;
  onCancelRename: () => void;
  onDelete: () => void;
}) {
  const [hover, setHover] = useState(false);
  const [name, setName] = useState(group.name);

  if (renaming) {
    return (
      <div className="sc-group-row is-active sc-group-edit">
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onCommitRename(name);
            if (e.key === "Escape") onCancelRename();
          }}
          onBlur={() => onCommitRename(name)}
          className="sc-group-edit-input"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={"sc-group-row" + (active ? " is-active" : "")}
    >
      <span className="sc-group-row-name">{group.name}</span>
      <span className="sc-group-row-count">
        {hover ? (
          <span className="sc-group-row-actions">
            <span
              role="button"
              onClick={(e) => { e.stopPropagation(); setName(group.name); onStartRename(); }}
              title="Rename"
              className="sc-group-row-action"
            >
              ✎
            </span>
            <span
              role="button"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              title="Delete group"
              className="sc-group-row-action sc-group-row-action--danger"
            >
              ×
            </span>
          </span>
        ) : (
          count
        )}
      </span>
    </button>
  );
}

function NewGroupRow({ onCommit, onCancel }: { onCommit: (name: string) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  return (
    <div className="sc-group-row is-active sc-group-edit">
      <input
        autoFocus
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && name.trim()) onCommit(name);
          if (e.key === "Escape") onCancel();
        }}
        onBlur={() => (name.trim() ? onCommit(name) : onCancel())}
        placeholder="New group name…"
        className="sc-group-edit-input"
      />
    </div>
  );
}

// ─── Color form modal — Add and Edit ────────────────────────────────────────
function ColorFormModal({
  mode,
  groups,
  initial,
  cascadeHint,
  onCancel,
  onSubmit,
}: {
  mode: "add" | "edit";
  groups: ColorGroup[];
  initial?: { name: string; hex: string; groupId: string };
  cascadeHint?: string;
  onCancel: () => void;
  onSubmit: (input: { name: string; hex: string; groupId: string }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [hex, setHex] = useState(initial?.hex ?? "#85b7ea");
  const [groupId, setGroupId] = useState(initial?.groupId ?? groups[0]?.id ?? "");

  const validHex = /^#[0-9a-fA-F]{6}$/.test(hex);
  const canSubmit = name.trim().length > 0 && validHex && groupId;
  const dirty =
    !initial ||
    name.trim() !== initial.name ||
    hex.toLowerCase() !== initial.hex.toLowerCase() ||
    groupId !== initial.groupId;

  return (
    <div className="sc-modal-backdrop" onClick={onCancel}>
      <div className="sc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sc-modal-title-row">
          <h3 className="sc-modal-title">{mode === "add" ? "Add color" : "Edit color"}</h3>
        </div>
        <p className="sc-modal-body">
          Hex is entered here only — Style editors elsewhere in Flair display this color by name + swatch.
        </p>

        {cascadeHint && (
          <div className="sc-cascade-hint">
            <span>⚡</span>
            <span>{cascadeHint}</span>
          </div>
        )}

        <div className="sc-field">
          <label className="sc-field-label">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Summer Maize"
            className="sc-field-input"
            autoFocus
          />
        </div>

        <div className="sc-field-row">
          <div>
            <label className="sc-field-label">Hex</label>
            <input
              type="text"
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              placeholder="#000000"
              className="sc-field-input sc-field-input--mono"
            />
            {!validHex && hex.length > 0 && <div className="sc-field-error">Must be a 6-digit hex like #F2C94C</div>}
          </div>
          <div>
            <label className="sc-field-label">Preview</label>
            <div className="sc-field-preview" style={{ background: validHex ? hex : "transparent" }} />
          </div>
        </div>

        <div className="sc-field">
          <label className="sc-field-label">Group</label>
          <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="sc-field-select">
            {groups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        <div className="sc-modal-foot">
          <button type="button" onClick={onCancel} className="sc-btn sc-btn--ghost">Cancel</button>
          <button
            type="button"
            onClick={() => canSubmit && dirty && onSubmit({ name, hex, groupId })}
            disabled={!canSubmit || !dirty}
            className="sc-btn sc-btn--primary"
          >
            {mode === "add" ? "Add color" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete color — forced transfer-or-replace ──────────────────────────────
function DeleteColorModal({
  color,
  palette,
  groups,
  styleNames,
  onCancel,
  onSubmit,
}: {
  color: Color;
  palette: Color[];
  groups: ColorGroup[];
  styleNames: string[];
  onCancel: () => void;
  onSubmit: (
    resolution:
      | { mode: "transfer"; targetId: string }
      | { mode: "replace"; name: string; hex: string; groupId: string },
  ) => void;
}) {
  const otherColors = palette.filter((c) => c.id !== color.id);
  const [mode, setMode] = useState<"transfer" | "replace">("transfer");
  const [targetId, setTargetId] = useState<string>(otherColors[0]?.id ?? "");
  const [replaceName, setReplaceName] = useState<string>("");
  const [replaceHex, setReplaceHex] = useState<string>(color.hex);
  const [replaceGroupId, setReplaceGroupId] = useState<string>(color.groupId);

  const validReplaceHex = /^#[0-9a-fA-F]{6}$/.test(replaceHex);
  const canSubmit =
    mode === "transfer" ? !!targetId : replaceName.trim().length > 0 && validReplaceHex && replaceGroupId;

  function submit() {
    if (!canSubmit) return;
    if (mode === "transfer") {
      onSubmit({ mode: "transfer", targetId });
    } else {
      onSubmit({ mode: "replace", name: replaceName, hex: replaceHex, groupId: replaceGroupId });
    }
  }

  const usingCount = styleNames.length;

  return (
    <div className="sc-modal-backdrop" onClick={onCancel}>
      <div className="sc-modal sc-modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="sc-modal-title-row">
          <ColorSwatch hex={color.hex} size={28} />
          <h3 className="sc-modal-title">Delete "{color.name}" — transfer first</h3>
        </div>
        <p className="sc-modal-body">
          {usingCount > 0 ? (
            <>
              <strong>{color.name}</strong> is currently used by{" "}
              <strong>{usingCount} Style{usingCount === 1 ? "" : "s"}</strong>. You can't delete it without reassigning those references — no orphans permitted.
            </>
          ) : (
            <>
              <strong>{color.name}</strong> isn't currently referenced by any Style, but the audit-trail discipline still requires you to pick a resolution explicitly.
            </>
          )}
        </p>

        {usingCount > 0 && (
          <div className="sc-field">
            <div className="sc-field-label">Styles using {color.name}</div>
            <ul className="sc-using-list">
              {styleNames.map((s, i) => (
                <li key={i} className="sc-using-row">
                  <ColorSwatch hex={color.hex} size={14} />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="sc-field-label" style={{ marginBottom: 10 }}>Resolve by</div>
        <div className="sc-resolution-list">
          <label className={"sc-resolution-option" + (mode === "transfer" ? " is-checked" : "")}>
            <div className="sc-resolution-head">
              <input type="radio" checked={mode === "transfer"} onChange={() => setMode("transfer")} name="resolution" />
              <div>
                <div className="sc-resolution-title">Transfer all references to an existing color</div>
                <div className="sc-resolution-sub">
                  Pick another color from the palette; every Style using {color.name} flips to it.
                </div>
              </div>
            </div>
            {mode === "transfer" && (
              <div className="sc-resolution-body" style={{ maxWidth: 320 }}>
                <select value={targetId} onChange={(e) => setTargetId(e.target.value)} className="sc-field-select">
                  {otherColors.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
          </label>

          <label className={"sc-resolution-option" + (mode === "replace" ? " is-checked" : "")}>
            <div className="sc-resolution-head">
              <input type="radio" checked={mode === "replace"} onChange={() => setMode("replace")} name="resolution" />
              <div>
                <div className="sc-resolution-title">Define a replacement on the spot</div>
                <div className="sc-resolution-sub">
                  Enter a new Name + Hex; replaces {color.name} everywhere it's referenced.
                </div>
              </div>
            </div>
            {mode === "replace" && (
              <div className="sc-resolution-body sc-resolution-body--grid">
                <div>
                  <label className="sc-field-label">New name</label>
                  <input type="text" value={replaceName} onChange={(e) => setReplaceName(e.target.value)} placeholder="e.g. Summer Maize" className="sc-field-input" />
                </div>
                <div>
                  <label className="sc-field-label">Hex</label>
                  <input type="text" value={replaceHex} onChange={(e) => setReplaceHex(e.target.value)} placeholder="#000000" className="sc-field-input sc-field-input--mono" />
                  {!validReplaceHex && replaceHex.length > 0 && <div className="sc-field-error">Invalid hex</div>}
                </div>
                <div className="sc-resolution-body--full">
                  <label className="sc-field-label">Group</label>
                  <select value={replaceGroupId} onChange={(e) => setReplaceGroupId(e.target.value)} className="sc-field-select">
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </label>
        </div>

        <div className="sc-modal-foot">
          <button type="button" onClick={onCancel} className="sc-btn sc-btn--ghost">Cancel</button>
          <button type="button" onClick={submit} disabled={!canSubmit} className="sc-btn sc-btn--danger">
            Transfer and delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete group — forces all colors in the group to move first ───────────
function DeleteGroupModal({
  group,
  groups,
  colorsInGroup,
  onCancel,
  onSubmit,
}: {
  group: ColorGroup;
  groups: ColorGroup[];
  colorsInGroup: Color[];
  onCancel: () => void;
  onSubmit: (targetGroupId: string) => void;
}) {
  const otherGroups = groups.filter((g) => g.id !== group.id);
  const [targetId, setTargetId] = useState(otherGroups[0]?.id ?? "");
  const canSubmit = !!targetId && otherGroups.length > 0;

  return (
    <div className="sc-modal-backdrop" onClick={onCancel}>
      <div className="sc-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="sc-modal-title">Delete group "{group.name}" — move colors first</h3>
        <p className="sc-modal-body">
          {colorsInGroup.length > 0 ? (
            <>
              <strong>{group.name}</strong> contains{" "}
              <strong>{colorsInGroup.length} color{colorsInGroup.length === 1 ? "" : "s"}</strong>. Pick another group for them — no homeless colors permitted.
            </>
          ) : (
            <>
              <strong>{group.name}</strong> is empty, but the audit-trail discipline still requires you to confirm the delete explicitly.
            </>
          )}
        </p>

        {colorsInGroup.length > 0 && (
          <div className="sc-field">
            <div className="sc-field-label">Colors in {group.name}</div>
            <ul className="sc-using-list">
              {colorsInGroup.map((c) => (
                <li key={c.id} className="sc-using-row">
                  <ColorSwatch hex={c.hex} size={14} />
                  <span>{c.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {otherGroups.length > 0 ? (
          <div className="sc-field">
            <label className="sc-field-label">Move all colors to</label>
            <select value={targetId} onChange={(e) => setTargetId(e.target.value)} className="sc-field-select">
              {otherGroups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="sc-validation-banner sc-validation-banner--fail">
            Can't delete — this is the only group. Create another group first.
          </div>
        )}

        <div className="sc-modal-foot">
          <button type="button" onClick={onCancel} className="sc-btn sc-btn--ghost">Cancel</button>
          <button type="button" onClick={() => canSubmit && onSubmit(targetId)} disabled={!canSubmit} className="sc-btn sc-btn--danger">
            Move and delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Import JSON modal — validation before apply ────────────────────────────
function ImportColorsModal({
  palette,
  groups,
  styleUsage,
  onCancel,
  onApply,
}: {
  palette: Color[];
  groups: ColorGroup[];
  styleUsage: Record<string, string[]>;
  onCancel: () => void;
  onApply: (colors: Color[], groups: ColorGroup[]) => void;
}) {
  const [jsonText, setJsonText] = useState("");
  const [validation, setValidation] = useState<ImportValidationResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      setJsonText(text);
      runValidation(text);
    };
    reader.readAsText(file);
  }

  function runValidation(text: string) {
    setParseError(null);
    setValidation(null);

    let parsed: { colors?: Color[]; groups?: ColorGroup[] };
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      setParseError(`Invalid JSON: ${(err as Error).message}`);
      return;
    }

    if (!Array.isArray(parsed.colors)) {
      setParseError("JSON is missing a top-level `colors` array.");
      return;
    }

    const importedColors: Color[] = parsed.colors;
    const importIds = new Set(importedColors.map((c) => c.id));
    const currentIds = new Set(palette.map((c) => c.id));

    const toAdd = importedColors.filter((c) => !currentIds.has(c.id));
    const toModify: Array<{ before: Color; after: Color }> = [];
    for (const imp of importedColors) {
      const cur = palette.find((c) => c.id === imp.id);
      if (cur && (cur.name !== imp.name || cur.hex !== imp.hex || cur.groupId !== imp.groupId)) {
        toModify.push({ before: cur, after: imp });
      }
    }

    const dropped = palette.filter((c) => !importIds.has(c.id));
    const toDropInUse: Array<{ color: Color; usingStyleIds: string[] }> = [];
    const toDropFree: Color[] = [];
    for (const c of dropped) {
      const using = styleUsage[c.id] ?? [];
      if (using.length > 0) toDropInUse.push({ color: c, usingStyleIds: using });
      else toDropFree.push(c);
    }

    setValidation({
      ok: toDropInUse.length === 0,
      toAdd,
      toModify,
      toDropInUse,
      toDropFree,
    });
  }

  function apply() {
    if (!validation?.ok) return;
    try {
      const parsed: { colors?: Color[]; groups?: ColorGroup[] } = JSON.parse(jsonText);
      onApply(parsed.colors ?? [], parsed.groups ?? groups);
    } catch {
      /* unreachable */
    }
  }

  function reset() {
    setJsonText("");
    setValidation(null);
    setParseError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="sc-modal-backdrop" onClick={onCancel}>
      <div className="sc-modal sc-modal--xwide" onClick={(e) => e.stopPropagation()}>
        <h3 className="sc-modal-title">Import JSON</h3>
        <p className="sc-modal-body">
          For brand-refresh-scale changes: edit your exported JSON externally, then re-import. The
          import is validated <strong>before</strong> applying — any change that would orphan an in-use
          color is rejected with the list of affected Styles.
        </p>

        {!validation && !parseError && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={handleFileSelect} className="sc-import-file" />
            </div>
            <div className="sc-field-label" style={{ marginBottom: 6 }}>Or paste JSON</div>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder={`{\n  "colors": [...],\n  "groups": [...]\n}`}
              className="sc-import-textarea"
            />
            <div className="sc-modal-foot" style={{ marginTop: 16 }}>
              <button type="button" onClick={onCancel} className="sc-btn sc-btn--ghost">Cancel</button>
              <button
                type="button"
                onClick={() => runValidation(jsonText)}
                disabled={jsonText.trim().length === 0}
                className="sc-btn sc-btn--primary"
              >
                Validate
              </button>
            </div>
          </>
        )}

        {parseError && (
          <>
            <div className="sc-validation-banner sc-validation-banner--fail">
              <strong>Couldn't parse the file.</strong> {parseError}
            </div>
            <div className="sc-modal-foot">
              <button type="button" onClick={onCancel} className="sc-btn sc-btn--ghost">Cancel</button>
              <button type="button" onClick={reset} className="sc-btn sc-btn--primary">Try again</button>
            </div>
          </>
        )}

        {validation && (
          <>
            <div className={"sc-validation-banner " + (validation.ok ? "sc-validation-banner--ok" : "sc-validation-banner--fail")}>
              {validation.ok ? (
                <>
                  <strong>Import looks safe.</strong> No orphans. {validation.toAdd.length} added,{" "}
                  {validation.toModify.length} modified, {validation.toDropFree.length} removed.
                </>
              ) : (
                <>
                  <strong>Import rejected — would orphan {validation.toDropInUse.length} in-use color
                  {validation.toDropInUse.length === 1 ? "" : "s"}.</strong> Either restore those colors
                  in the JSON, or run a manual Delete-with-transfer first.
                </>
              )}
            </div>

            <ValidationSection
              title="Will be added"
              count={validation.toAdd.length}
              rows={validation.toAdd.map((c) => (
                <ValidationRow key={c.id} hex={c.hex} label={c.name} sub={c.id} />
              ))}
            />

            <ValidationSection
              title="Will be modified (cascades to existing Styles)"
              count={validation.toModify.length}
              rows={validation.toModify.map(({ before, after }) => (
                <ValidationRow
                  key={before.id}
                  hex={after.hex}
                  label={`${before.name} → ${after.name}`}
                  sub={`${before.hex.toUpperCase()} → ${after.hex.toUpperCase()}`}
                />
              ))}
            />

            <ValidationSection
              title="Will be removed (not in use — safe)"
              count={validation.toDropFree.length}
              rows={validation.toDropFree.map((c) => (
                <ValidationRow key={c.id} hex={c.hex} label={c.name} sub="Not referenced by any Style" />
              ))}
            />

            {validation.toDropInUse.length > 0 && (
              <ValidationSection
                title="Would orphan — BLOCKS import"
                tone="danger"
                count={validation.toDropInUse.length}
                rows={validation.toDropInUse.map(({ color, usingStyleIds }) => (
                  <ValidationRow
                    key={color.id}
                    hex={color.hex}
                    label={color.name}
                    sub={`Used by ${usingStyleIds.length} Style${usingStyleIds.length === 1 ? "" : "s"}: ${usingStyleIds.join(", ")}`}
                  />
                ))}
              />
            )}

            <div className="sc-modal-foot">
              <button type="button" onClick={reset} className="sc-btn sc-btn--ghost">Back</button>
              <button type="button" onClick={onCancel} className="sc-btn sc-btn--ghost">Cancel</button>
              <button type="button" onClick={apply} disabled={!validation.ok} className="sc-btn sc-btn--primary">
                Apply import
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ValidationSection({
  title,
  count,
  rows,
  tone = "normal",
}: {
  title: string;
  count: number;
  rows: React.ReactNode[];
  tone?: "normal" | "danger";
}) {
  if (count === 0) return null;
  return (
    <div className={"sc-validation-section" + (tone === "danger" ? " sc-validation-section--danger" : "")}>
      <div className="sc-validation-section-title">
        {title} ({count})
      </div>
      <div className="sc-validation-rows">{rows}</div>
    </div>
  );
}

function ValidationRow({ hex, label, sub }: { hex: string; label: string; sub: string }) {
  return (
    <div className="sc-validation-row">
      <span className="sc-validation-row-swatch" style={{ background: hex }} />
      <div className="sc-validation-row-text">
        <div className="sc-validation-row-label">{label}</div>
        <div className="sc-validation-row-sub">{sub}</div>
      </div>
    </div>
  );
}
