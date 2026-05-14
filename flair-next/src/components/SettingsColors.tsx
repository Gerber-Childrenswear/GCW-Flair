// Settings → Colors — the admin home for the brand palette.
//
// This is the ONLY place in Flair where hex values are visible or editable.
// Style editors and Campaign editors consume colors by ID from here — they
// see name + swatch only. See Decision #5 in the vision brief.
//
// Slice 1 (read-only):     groups sidebar + colors table + audit log preview
// Slice 2 (this commit):   Add color modal + page-header actions

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
  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: 4,
        background: hex,
        border: "1px solid rgba(0,0,0,0.08)",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.4)",
        verticalAlign: "middle",
      }}
    />
  );
}

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

  // Visible list flows: group filter → search filter → sort.
  // When sortBy === "custom" the row order reflects each color's sortOrder
  // (preserved across sessions, mutated via reorder arrows).
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
        // Group first (when "__all"), then sortOrder within group.
        if (a.groupId !== b.groupId) {
          const aIdx = groups.findIndex((g) => g.id === a.groupId);
          const bIdx = groups.findIndex((g) => g.id === b.groupId);
          return (aIdx - bIdx) * dir;
        }
        return (a.sortOrder - b.sortOrder) * dir;
    }
  });

  function handleSortClick(col: "custom" | "name" | "hex" | "usage") {
    if (sortBy === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortDir("asc");
    }
  }

  // Reorder a color within its group by swapping sortOrder with its neighbor.
  // Only meaningful when sortBy === "custom" — sort buttons override the view
  // order without mutating sortOrder.
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

  function addAuditEntry(entry: Omit<ColorAuditEntry, "id" | "timestamp" | "actor">) {
    const e: ColorAuditEntry = {
      id: generateAuditId(),
      timestamp: new Date().toISOString(),
      actor: SETTINGS_ACTOR,
      ...entry,
    };
    setAuditLog((prev) => [e, ...prev]);
  }

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

  // Edit cascades to every Style using this Color ID — by reference, IDs stay
  // stable so no cleanup is needed elsewhere. The audit log records each
  // changed dimension (name / hex / group) as a separate entry for clarity.
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
        action: "edit_name",
        targetType: "color",
        targetId: colorId,
        diff: { before: { name: before.name }, after: { name: after.name } },
      });
    }
    if (before.hex !== after.hex) {
      addAuditEntry({
        action: "edit_hex",
        targetType: "color",
        targetId: colorId,
        diff: { before: { hex: before.hex }, after: { hex: after.hex } },
      });
    }
    if (before.groupId !== after.groupId) {
      addAuditEntry({
        action: "edit_group",
        targetType: "color",
        targetId: colorId,
        diff: { before: { groupId: before.groupId }, after: { groupId: after.groupId } },
      });
    }
    setColorForm(null);
  }

  // Delete forces transfer-or-replace. Two resolutions:
  //   - "transfer": all referencing Styles point to an existing color
  //   - "replace": create a new color on the spot, references move to it
  // In real implementation, the Style table is updated to swap color IDs.
  // Audit log records the delete (and the add, if replace).
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
      // Drop old, append new — Style refs would be rewritten from
      // colorId → replacement.id in real impl.
      setColors((prev) => [...prev.filter((c) => c.id !== colorId), replacement]);
      addAuditEntry({
        action: "add",
        targetType: "color",
        targetId: replacement.id,
        diff: { after: { name: replacement.name, hex: replacement.hex } },
      });
      addAuditEntry({
        action: "delete",
        targetType: "color",
        targetId: colorId,
        diff: { before: { name: before.name, hex: before.hex } },
      });
    } else {
      // Transfer mode: Style refs would be rewritten from
      // colorId → resolution.targetId in real impl. Here we just drop the
      // deleted color from state.
      setColors((prev) => prev.filter((c) => c.id !== colorId));
      addAuditEntry({
        action: "delete",
        targetType: "color",
        targetId: colorId,
        diff: { before: { name: before.name, hex: before.hex } },
      });
    }
    setDeletingColor(null);
  }

  // Export current palette as a downloadable JSON file. Includes colors,
  // groups, and an export timestamp. Audit logs aren't included in exports
  // (they're tenancy-local; not part of the palette content).
  function handleExportJson() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      colors,
      groups,
    };
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
      action: "export",
      targetType: "color",
      targetId: "_palette",
      diff: { after: { name: `Exported ${colors.length} colors` } },
    });
  }

  // Apply a validated import. The validation already confirmed no orphans
  // would be created, so we can safely swap colors/groups in state.
  // Real backend: same payload + atomic Style ref rewrites.
  function handleApplyImport(importedColors: Color[], importedGroups: ColorGroup[]) {
    setColors(importedColors);
    if (importedGroups.length > 0) setGroups(importedGroups);
    addAuditEntry({
      action: "import",
      targetType: "color",
      targetId: "_palette",
      diff: { after: { name: `Imported ${importedColors.length} colors` } },
    });
    setShowImport(false);
  }

  // ─── Group management ──────────────────────────────────────────────────────
  function handleAddGroup(name: string) {
    if (!name.trim()) return;
    const newGroup: ColorGroup = {
      id: generateGroupId(),
      name: name.trim(),
      sortOrder: groups.length,
    };
    setGroups((prev) => [...prev, newGroup]);
    addAuditEntry({
      action: "group_add",
      targetType: "group",
      targetId: newGroup.id,
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
      action: "group_rename",
      targetType: "group",
      targetId: groupId,
      diff: { before: { name: before.name }, after: { name: after.name } },
    });
    setRenamingGroupId(null);
  }

  // Delete a group → all colors in it must move to another group. Mirrors
  // the same "no orphans" discipline as the color-delete flow.
  function handleDeleteGroup(groupId: string, transferToGroupId: string) {
    const before = groups.find((g) => g.id === groupId);
    if (!before) return;
    setColors((prev) =>
      prev.map((c) => (c.groupId === groupId ? { ...c, groupId: transferToGroupId, updatedAt: new Date().toISOString() } : c)),
    );
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    addAuditEntry({
      action: "group_delete",
      targetType: "group",
      targetId: groupId,
      diff: { before: { name: before.name } },
    });
    if (activeGroupId === groupId) setActiveGroupId("__all");
    setDeletingGroup(null);
  }

  return (
    <div className="settings-colors-page" style={{ padding: "24px 32px", maxWidth: 1280 }}>
      <div
        className="settings-page-head"
        style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 24 }}
      >
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#667f8e", marginBottom: 4 }}>
            Settings · Colors
          </div>
          <h1 style={{ margin: 0 }}>Colors</h1>
          <p style={{ marginTop: 8, color: "#667f8e", maxWidth: 720 }}>
            The single source of truth for brand colors. Hex values are entered here only — Style editors
            across the app consume these by name. Renames and recolors cascade automatically; deletions
            require transfer-or-replace.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button type="button" onClick={handleExportJson} style={ghostBtnStyle()}>
            Export JSON
          </button>
          <button type="button" onClick={() => setShowImport(true)} style={ghostBtnStyle()}>
            Import JSON
          </button>
          <button type="button" onClick={() => setColorForm({ mode: "add" })} style={primaryBtnStyle()}>
            + Add color
          </button>
        </div>
      </div>

      <div
        className="settings-colors-layout"
        style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 24, marginTop: 24, alignItems: "start" }}
      >
        {/* Groups sidebar */}
        <aside className="settings-colors-groups panel" style={{ padding: 16, position: "sticky", top: 24 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#667f8e", marginBottom: 12 }}>
            Groups
          </div>
          <button
            type="button"
            onClick={() => setActiveGroupId("__all")}
            style={groupRowStyle(activeGroupId === "__all")}
          >
            <span>All colors</span>
            <span style={{ color: "#667f8e", fontSize: 12 }}>{colors.length}</span>
          </button>
          {groups.map((group) => {
            const count = colors.filter((c) => c.groupId === group.id).length;
            const active = group.id === activeGroupId;
            const isRenaming = renamingGroupId === group.id;
            return (
              <GroupRow
                key={group.id}
                group={group}
                count={count}
                active={active}
                renaming={isRenaming}
                onSelect={() => setActiveGroupId(group.id)}
                onStartRename={() => setRenamingGroupId(group.id)}
                onCommitRename={(name) => handleRenameGroup(group.id, name)}
                onCancelRename={() => setRenamingGroupId(null)}
                onDelete={() => setDeletingGroup(group)}
              />
            );
          })}

          {/* New group inline form / trigger */}
          {addingGroup ? (
            <NewGroupRow
              onCommit={handleAddGroup}
              onCancel={() => setAddingGroup(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setAddingGroup(true)}
              style={{
                ...groupRowStyle(false),
                color: "#667f8e",
                fontSize: 12,
                fontStyle: "italic",
                marginTop: 4,
              }}
            >
              + New group
            </button>
          )}
        </aside>

        {/* Main panel — colors table + audit log */}
        <div>
          {/* Search + sort context bar */}
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search colors by name or hex…"
              style={{
                flex: 1,
                padding: "8px 12px",
                border: "1px solid #e6e8ec",
                borderRadius: 6,
                fontSize: 13,
                fontFamily: "inherit",
              }}
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} style={ghostBtnStyle()}>
                Clear
              </button>
            )}
            <div style={{ fontSize: 12, color: "#667f8e", whiteSpace: "nowrap" }}>
              Showing <strong>{visibleColors.length}</strong>
              {visibleColors.length !== colors.length && (
                <span style={{ color: "#99a9b4" }}> of {colors.length}</span>
              )}
            </div>
          </div>

          <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
            <div style={tableHeaderStyle}>
              <div>Swatch</div>
              <SortHeader label="Name" active={sortBy === "name"} dir={sortDir} onClick={() => handleSortClick("name")} />
              <SortHeader label="Hex" active={sortBy === "hex"} dir={sortDir} onClick={() => handleSortClick("hex")} />
              <SortHeader label="Used by" active={sortBy === "usage"} dir={sortDir} onClick={() => handleSortClick("usage")} />
              <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 6 }}>
                {sortBy !== "custom" && (
                  <button
                    type="button"
                    onClick={() => handleSortClick("custom")}
                    title="Restore manual ordering"
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#667f8e",
                      cursor: "pointer",
                      fontSize: 10,
                      fontFamily: "inherit",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                    }}
                  >
                    Manual
                  </button>
                )}
                <span>Actions</span>
              </div>
            </div>
            {visibleColors.map((color) => {
              const usage = MOCK_USAGE[color.id] ?? { styles: 0, instances: 0 };
              return (
                <div key={color.id} style={tableRowStyle}>
                  <ColorSwatch hex={color.hex} />
                  <div style={{ fontWeight: 500 }}>{color.name}</div>
                  <div style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12, color: "#5d5655" }}>
                    {color.hex.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 12, color: "#5d5655" }}>
                    <strong>{usage.styles}</strong> Style{usage.styles === 1 ? "" : "s"}
                    <div style={{ fontSize: 10, color: "#99a9b4" }}>{usage.instances} live instances</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center" }}>
                    {sortBy === "custom" && (() => {
                      const peers = colors
                        .filter((c) => c.groupId === color.groupId)
                        .sort((a, b) => a.sortOrder - b.sortOrder);
                      const idx = peers.findIndex((c) => c.id === color.id);
                      const canUp = idx > 0;
                      const canDown = idx >= 0 && idx < peers.length - 1;
                      return (
                        <span style={{ display: "inline-flex", gap: 2, marginRight: 4 }}>
                          <button
                            type="button"
                            onClick={() => moveColor(color.id, "up")}
                            disabled={!canUp}
                            title="Move up in group"
                            style={reorderBtnStyle(!canUp)}
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            onClick={() => moveColor(color.id, "down")}
                            disabled={!canDown}
                            title="Move down in group"
                            style={reorderBtnStyle(!canDown)}
                          >
                            ▼
                          </button>
                        </span>
                      );
                    })()}
                    <button
                      type="button"
                      onClick={() => setColorForm({ mode: "edit", colorId: color.id })}
                      style={linkBtnStyle("muted")}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingColor(color)}
                      style={linkBtnStyle("danger")}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Audit log preview */}
          <div className="panel" style={{ marginTop: 24, padding: 16 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#667f8e", marginBottom: 12, fontWeight: 600 }}>
              Recent changes · audit log
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {auditLog.slice(0, 8).map((entry) => (
                <li key={entry.id} style={auditRowStyle}>
                  <span style={{ color: "#667f8e" }}>{new Date(entry.timestamp).toLocaleString()}</span>
                  <span style={auditActionStyle}>{entry.action}</span>
                  <span>
                    <strong>{entry.targetId}</strong>
                    {entry.diff.before && entry.diff.after && (
                      <>
                        <span style={{ color: "#667f8e" }}> — </span>
                        <span>
                          {String((entry.diff.before as Partial<Color>).name ?? (entry.diff.before as Partial<Color>).hex ?? "")} →{" "}
                          {String((entry.diff.after as Partial<Color>).name ?? (entry.diff.after as Partial<Color>).hex ?? "")}
                        </span>
                      </>
                    )}
                    {!entry.diff.before && entry.diff.after && (
                      <>
                        <span style={{ color: "#667f8e" }}> — </span>
                        <span>{String((entry.diff.after as Partial<Color>).name ?? "")}</span>
                      </>
                    )}
                  </span>
                  <span style={{ color: "#667f8e", textAlign: "right" }}>{entry.actor}</span>
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 12, fontSize: 11, color: "#667f8e" }}>Full audit log →</div>
          </div>
        </div>
      </div>

      {/* Add color modal */}
      {colorForm?.mode === "add" && (
        <ColorFormModal
          mode="add"
          groups={groups}
          onCancel={() => setColorForm(null)}
          onSubmit={handleAddColor}
        />
      )}

      {/* Edit color modal — same component, edit mode, cascade hint */}
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

      {/* Delete with forced transfer-or-replace */}
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

      {/* JSON import — validates before apply, rejects orphan-creating imports */}
      {showImport && (
        <ImportColorsModal
          palette={colors}
          groups={groups}
          styleUsage={MOCK_STYLES_BY_COLOR}
          onCancel={() => setShowImport(false)}
          onApply={handleApplyImport}
        />
      )}

      {/* Delete group — forces colors in the group to move to a different group */}
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

// ─── Group row in sidebar — select, hover-rename, hover-delete ──────────────
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
      <div style={{ ...groupRowStyle(true), padding: "4px 6px" }}>
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
          style={{
            flex: 1,
            padding: "4px 6px",
            border: "1px solid #002744",
            borderRadius: 4,
            fontSize: 13,
            fontFamily: "inherit",
            minWidth: 0,
            width: "100%",
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <button type="button" onClick={onSelect} style={groupRowStyle(active)}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{group.name}</span>
        <span style={{ color: "#667f8e", fontSize: 12, flexShrink: 0 }}>
          {hover ? (
            <span style={{ display: "inline-flex", gap: 4 }}>
              <span
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setName(group.name);
                  onStartRename();
                }}
                title="Rename"
                style={{ cursor: "pointer", padding: "0 4px" }}
              >
                ✎
              </span>
              <span
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                title="Delete group"
                style={{ cursor: "pointer", padding: "0 4px", color: "#bf360c" }}
              >
                ×
              </span>
            </span>
          ) : (
            count
          )}
        </span>
      </button>
    </div>
  );
}

// ─── New group inline form ───────────────────────────────────────────────────
function NewGroupRow({ onCommit, onCancel }: { onCommit: (name: string) => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  return (
    <div style={{ ...groupRowStyle(true), padding: "4px 6px" }}>
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
        style={{
          flex: 1,
          padding: "4px 6px",
          border: "1px solid #002744",
          borderRadius: 4,
          fontSize: 13,
          fontFamily: "inherit",
          minWidth: 0,
          width: "100%",
        }}
      />
    </div>
  );
}

// ─── Delete group modal — forces every color in the group to move ────────────
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
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 39, 68, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "white",
          width: 520,
          maxWidth: "calc(100vw - 48px)",
          maxHeight: "calc(100vh - 48px)",
          overflow: "auto",
          borderRadius: 8,
          padding: 24,
          boxShadow: "0 24px 64px rgba(0,39,68,0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: "0 0 8px", fontSize: 18 }}>
          Delete group "{group.name}" — move colors first
        </h3>
        <p style={{ marginBottom: 16, color: "#5d5655", fontSize: 13 }}>
          {colorsInGroup.length > 0 ? (
            <>
              <strong>{group.name}</strong> contains{" "}
              <strong>
                {colorsInGroup.length} color{colorsInGroup.length === 1 ? "" : "s"}
              </strong>
              . Pick another group for them — no homeless colors permitted.
            </>
          ) : (
            <>
              <strong>{group.name}</strong> is empty, but the audit-trail discipline still requires you
              to confirm the delete explicitly.
            </>
          )}
        </p>

        {colorsInGroup.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={labelStyle}>Colors in {group.name}</div>
            <ul
              style={{
                listStyle: "none",
                padding: 12,
                margin: 0,
                background: "#f9f5f3",
                borderRadius: 6,
                border: "1px solid #e6e8ec",
                maxHeight: 140,
                overflow: "auto",
              }}
            >
              {colorsInGroup.map((c) => (
                <li key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 13 }}>
                  <ColorSwatch hex={c.hex} size={14} />
                  <span>{c.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {otherGroups.length > 0 ? (
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Move all colors to</label>
            <select value={targetId} onChange={(e) => setTargetId(e.target.value)} style={inputStyle}>
              {otherGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div style={{ marginBottom: 24, padding: 12, background: "#fbe9e4", border: "1px solid #bf360c", borderRadius: 6, color: "#5d2010", fontSize: 13 }}>
            Can't delete — this is the only group. Create another group first.
          </div>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" onClick={onCancel} style={ghostBtnStyle()}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => canSubmit && onSubmit(targetId)}
            disabled={!canSubmit}
            style={{ ...primaryBtnStyle(!canSubmit), background: canSubmit ? "#bf360c" : "#99a9b4" }}
          >
            Move and delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Color Form Modal (Add — Edit reuses in next slice) ──────────────────────
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
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 39, 68, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "white",
          width: 520,
          maxWidth: "calc(100vw - 48px)",
          borderRadius: 8,
          padding: 24,
          boxShadow: "0 24px 64px rgba(0,39,68,0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: "0 0 8px", fontSize: 18 }}>{mode === "add" ? "Add color" : "Edit color"}</h3>
        <p style={{ marginBottom: cascadeHint ? 12 : 20, color: "#667f8e", fontSize: 13 }}>
          Hex is entered here only — Style editors elsewhere in Flair display this color by name + swatch.
        </p>

        {cascadeHint && (
          <div
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              background: "#fcf4db",
              border: "1px solid #f2c94c",
              color: "#5d5655",
              fontSize: 12,
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 14 }}>⚡</span>
            <span>{cascadeHint}</span>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Summer Maize"
            style={inputStyle}
            autoFocus
          />
        </div>

        <div style={{ marginBottom: 16, display: "grid", gridTemplateColumns: "1fr 80px", gap: 12, alignItems: "end" }}>
          <div>
            <label style={labelStyle}>Hex</label>
            <input
              type="text"
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              placeholder="#000000"
              style={{ ...inputStyle, fontFamily: "ui-monospace, Menlo, monospace" }}
            />
            {!validHex && hex.length > 0 && (
              <div style={{ fontSize: 11, color: "#bf360c", marginTop: 4 }}>Must be a 6-digit hex like #F2C94C</div>
            )}
          </div>
          <div>
            <label style={labelStyle}>Preview</label>
            <div
              style={{
                width: "100%",
                height: 38,
                borderRadius: 6,
                background: validHex ? hex : "transparent",
                border: "1px solid #e6e8ec",
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Group</label>
          <select value={groupId} onChange={(e) => setGroupId(e.target.value)} style={inputStyle}>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" onClick={onCancel} style={ghostBtnStyle()}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => canSubmit && dirty && onSubmit({ name, hex, groupId })}
            disabled={!canSubmit || !dirty}
            style={primaryBtnStyle(!canSubmit || !dirty)}
          >
            {mode === "add" ? "Add color" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete-with-transfer modal ──────────────────────────────────────────────
// Enforces the architectural rule: no orphan color references. The admin must
// either reassign Styles to an existing color, or define a replacement on the
// spot that absorbs the references.
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
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 39, 68, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "white",
          width: 600,
          maxWidth: "calc(100vw - 48px)",
          maxHeight: "calc(100vh - 48px)",
          overflow: "auto",
          borderRadius: 8,
          padding: 24,
          boxShadow: "0 24px 64px rgba(0,39,68,0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <ColorSwatch hex={color.hex} size={28} />
          <h3 style={{ margin: 0, fontSize: 18 }}>
            Delete "{color.name}" — transfer first
          </h3>
        </div>
        <p style={{ marginBottom: 20, color: "#5d5655", fontSize: 13 }}>
          {usingCount > 0 ? (
            <>
              <strong>{color.name}</strong> is currently used by{" "}
              <strong>
                {usingCount} Style{usingCount === 1 ? "" : "s"}
              </strong>
              . You can't delete it without reassigning those references — no orphans permitted.
            </>
          ) : (
            <>
              <strong>{color.name}</strong> isn't currently referenced by any Style, but the
              audit-trail discipline still requires you to pick a resolution explicitly.
            </>
          )}
        </p>

        {usingCount > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={labelStyle}>Styles using {color.name}</div>
            <ul
              style={{
                listStyle: "none",
                padding: 12,
                margin: 0,
                background: "#f9f5f3",
                borderRadius: 6,
                border: "1px solid #e6e8ec",
                maxHeight: 140,
                overflow: "auto",
              }}
            >
              {styleNames.map((s, i) => (
                <li key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 13 }}>
                  <ColorSwatch hex={color.hex} size={14} />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ ...labelStyle, marginBottom: 10 }}>Resolve by</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
          {/* Option 1: transfer to existing */}
          <label
            style={{
              border: `1px solid ${mode === "transfer" ? "#002744" : "#e6e8ec"}`,
              borderRadius: 6,
              padding: 12,
              cursor: "pointer",
              background: mode === "transfer" ? "#f9f5f3" : "white",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="radio"
                checked={mode === "transfer"}
                onChange={() => setMode("transfer")}
                name="resolution"
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>Transfer all references to an existing color</div>
                <div style={{ fontSize: 11, color: "#667f8e" }}>
                  Pick another color from the palette; every Style using {color.name} flips to it.
                </div>
              </div>
            </div>
            {mode === "transfer" && (
              <div style={{ marginTop: 10, marginLeft: 22, maxWidth: 320 }}>
                <select value={targetId} onChange={(e) => setTargetId(e.target.value)} style={inputStyle}>
                  {otherColors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </label>

          {/* Option 2: define replacement */}
          <label
            style={{
              border: `1px solid ${mode === "replace" ? "#002744" : "#e6e8ec"}`,
              borderRadius: 6,
              padding: 12,
              cursor: "pointer",
              background: mode === "replace" ? "#f9f5f3" : "white",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                type="radio"
                checked={mode === "replace"}
                onChange={() => setMode("replace")}
                name="resolution"
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>Define a replacement on the spot</div>
                <div style={{ fontSize: 11, color: "#667f8e" }}>
                  Enter a new Name + Hex; replaces {color.name} everywhere it's referenced.
                </div>
              </div>
            </div>
            {mode === "replace" && (
              <div style={{ marginTop: 10, marginLeft: 22, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={labelStyle}>New name</label>
                  <input
                    type="text"
                    value={replaceName}
                    onChange={(e) => setReplaceName(e.target.value)}
                    placeholder="e.g. Summer Maize"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Hex</label>
                  <input
                    type="text"
                    value={replaceHex}
                    onChange={(e) => setReplaceHex(e.target.value)}
                    placeholder="#000000"
                    style={{ ...inputStyle, fontFamily: "ui-monospace, Menlo, monospace" }}
                  />
                  {!validReplaceHex && replaceHex.length > 0 && (
                    <div style={{ fontSize: 11, color: "#bf360c", marginTop: 4 }}>Invalid hex</div>
                  )}
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Group</label>
                  <select value={replaceGroupId} onChange={(e) => setReplaceGroupId(e.target.value)} style={inputStyle}>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </label>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" onClick={onCancel} style={ghostBtnStyle()}>
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            style={{ ...primaryBtnStyle(!canSubmit), background: canSubmit ? "#bf360c" : "#99a9b4" }}
          >
            Transfer and delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Import JSON modal ───────────────────────────────────────────────────────
// File upload or pasted JSON, validated against current state BEFORE apply.
// Imports that would orphan in-use colors are rejected with the list of
// affected Styles — the user must revise the JSON or specify a target.
// Per the brief: no orphan references permitted, on either the manual delete
// flow OR the bulk import flow.
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
    const importedGroups: ColorGroup[] = Array.isArray(parsed.groups) ? parsed.groups : groups;

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

    const droppedColors = palette.filter((c) => !importIds.has(c.id));
    const toDropInUse: Array<{ color: Color; usingStyleIds: string[] }> = [];
    const toDropFree: Color[] = [];
    for (const c of droppedColors) {
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
    // groups currently unused in validation logic but available for future
    // group-orphan checking
    void importedGroups;
  }

  function apply() {
    if (!validation?.ok) return;
    try {
      const parsed: { colors?: Color[]; groups?: ColorGroup[] } = JSON.parse(jsonText);
      onApply(parsed.colors ?? [], parsed.groups ?? groups);
    } catch {
      // Shouldn't reach here — we already parsed during validation.
    }
  }

  function reset() {
    setJsonText("");
    setValidation(null);
    setParseError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 39, 68, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "white",
          width: 720,
          maxWidth: "calc(100vw - 48px)",
          maxHeight: "calc(100vh - 48px)",
          overflow: "auto",
          borderRadius: 8,
          padding: 24,
          boxShadow: "0 24px 64px rgba(0,39,68,0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: "0 0 8px", fontSize: 18 }}>Import JSON</h3>
        <p style={{ marginBottom: 20, color: "#5d5655", fontSize: 13 }}>
          For brand-refresh-scale changes: edit your exported JSON externally, then re-import. The
          import is validated <strong>before</strong> applying — any change that would orphan an in-use
          color is rejected with the list of affected Styles.
        </p>

        {/* Step 1: input */}
        {!validation && !parseError && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleFileSelect}
                style={{ flex: 1, padding: 8, border: "1px dashed #99a9b4", borderRadius: 6, fontSize: 13 }}
              />
            </div>
            <div style={{ ...labelStyle, marginBottom: 6 }}>Or paste JSON</div>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder={`{\n  "colors": [...],\n  "groups": [...]\n}`}
              style={{
                width: "100%",
                minHeight: 160,
                padding: 12,
                border: "1px solid #e6e8ec",
                borderRadius: 6,
                fontFamily: "ui-monospace, Menlo, monospace",
                fontSize: 12,
                boxSizing: "border-box",
                resize: "vertical",
              }}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
              <button type="button" onClick={onCancel} style={ghostBtnStyle()}>
                Cancel
              </button>
              <button
                type="button"
                onClick={() => runValidation(jsonText)}
                disabled={jsonText.trim().length === 0}
                style={primaryBtnStyle(jsonText.trim().length === 0)}
              >
                Validate
              </button>
            </div>
          </>
        )}

        {/* Parse error */}
        {parseError && (
          <>
            <div
              style={{
                padding: 12,
                background: "#fbe9e4",
                border: "1px solid #bf360c",
                borderRadius: 6,
                color: "#5d2010",
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              <strong>Couldn't parse the file.</strong> {parseError}
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button type="button" onClick={onCancel} style={ghostBtnStyle()}>
                Cancel
              </button>
              <button type="button" onClick={reset} style={primaryBtnStyle()}>
                Try again
              </button>
            </div>
          </>
        )}

        {/* Step 2: validation result */}
        {validation && (
          <>
            <div
              style={{
                padding: 12,
                background: validation.ok ? "#e7f0ec" : "#fbe9e4",
                border: `1px solid ${validation.ok ? "#86b3a1" : "#bf360c"}`,
                borderRadius: 6,
                color: validation.ok ? "#1a4a32" : "#5d2010",
                fontSize: 13,
                marginBottom: 16,
              }}
            >
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

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
              <button type="button" onClick={reset} style={ghostBtnStyle()}>
                Back
              </button>
              <button type="button" onClick={onCancel} style={ghostBtnStyle()}>
                Cancel
              </button>
              <button type="button" onClick={apply} disabled={!validation.ok} style={primaryBtnStyle(!validation.ok)}>
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
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: tone === "danger" ? "#bf360c" : "#667f8e",
          fontWeight: 600,
          marginBottom: 8,
        }}
      >
        {title} ({count})
      </div>
      <div
        style={{
          border: `1px solid ${tone === "danger" ? "#bf360c" : "#e6e8ec"}`,
          borderRadius: 6,
          padding: 8,
          background: tone === "danger" ? "#fbe9e4" : "#f9f5f3",
        }}
      >
        {rows}
      </div>
    </div>
  );
}

// ─── Sortable column header ──────────────────────────────────────────────────
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
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "transparent",
        border: "none",
        padding: 0,
        margin: 0,
        cursor: "pointer",
        fontSize: 11,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: active ? "#002744" : "#667f8e",
        fontWeight: 600,
        fontFamily: "inherit",
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        textAlign: "left",
      }}
    >
      <span>{label}</span>
      <span style={{ fontSize: 9, opacity: active ? 1 : 0.3 }}>{active ? (dir === "asc" ? "▲" : "▼") : "▲"}</span>
    </button>
  );
}

function ValidationRow({ hex, label, sub }: { hex: string; label: string; sub: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 4px", fontSize: 13 }}>
      <span
        style={{
          display: "inline-block",
          width: 18,
          height: 18,
          borderRadius: 3,
          background: hex,
          border: "1px solid rgba(0,0,0,0.08)",
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 11, color: "#667f8e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {sub}
        </div>
      </div>
    </div>
  );
}

// ─── Inline style helpers (extracted to keep JSX readable) ───────────────────
const tableHeaderStyle = {
  display: "grid",
  gridTemplateColumns: "60px 1fr 120px 140px 120px",
  gap: 12,
  padding: "12px 16px",
  background: "#f9f5f3",
  fontSize: 11,
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  color: "#667f8e",
  fontWeight: 600,
  borderBottom: "1px solid #e6e8ec",
};

const tableRowStyle = {
  display: "grid",
  gridTemplateColumns: "60px 1fr 120px 140px 120px",
  gap: 12,
  padding: "12px 16px",
  alignItems: "center",
  borderBottom: "1px solid #f0f0f0",
};

const auditRowStyle = {
  display: "grid",
  gridTemplateColumns: "160px 90px 1fr 200px",
  gap: 12,
  padding: "8px 0",
  borderBottom: "1px dashed #f0f0f0",
  fontSize: 12,
};

const auditActionStyle = {
  fontFamily: "ui-monospace, Menlo, monospace",
  fontSize: 11,
  padding: "2px 8px",
  borderRadius: 4,
  background: "#e6e8ec",
  color: "#5d5655",
  width: "fit-content",
};

const labelStyle = {
  display: "block" as const,
  fontSize: 11,
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  color: "#667f8e",
  marginBottom: 6,
  fontWeight: 600,
};

const inputStyle = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid #e6e8ec",
  borderRadius: 6,
  fontSize: 14,
  fontFamily: "inherit",
  boxSizing: "border-box" as const,
};

function groupRowStyle(active: boolean) {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    padding: "8px 10px",
    border: "none",
    borderRadius: 6,
    background: active ? "#e6e8ec" : "transparent",
    fontWeight: active ? 600 : 400,
    cursor: "pointer",
    marginBottom: 2,
    textAlign: "left" as const,
    fontFamily: "inherit",
    fontSize: 13,
  };
}

function ghostBtnStyle(disabled = false) {
  return {
    padding: "8px 16px",
    background: "transparent",
    border: "1px solid #e6e8ec",
    borderRadius: 6,
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: 13,
    fontFamily: "inherit",
    color: disabled ? "#99a9b4" : "#002744",
    opacity: disabled ? 0.6 : 1,
  };
}

function primaryBtnStyle(disabled = false) {
  return {
    padding: "8px 16px",
    background: disabled ? "#99a9b4" : "#002744",
    color: "white",
    border: "none",
    borderRadius: 6,
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: 13,
    fontFamily: "inherit",
    fontWeight: 600,
    opacity: disabled ? 0.7 : 1,
  };
}

function reorderBtnStyle(disabled = false) {
  return {
    background: "transparent",
    border: "1px solid #e6e8ec",
    borderRadius: 4,
    padding: "2px 6px",
    fontSize: 9,
    color: disabled ? "#cfd4d9" : "#667f8e",
    cursor: disabled ? "not-allowed" : "pointer",
    fontFamily: "inherit",
    lineHeight: 1,
  };
}

function linkBtnStyle(tone: "muted" | "danger", disabled = false) {
  return {
    background: "transparent",
    border: "none",
    color: tone === "danger" ? "#bf360c" : "#667f8e",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: 12,
    fontFamily: "inherit",
    padding: 0,
    opacity: disabled ? 0.5 : 1,
  };
}
