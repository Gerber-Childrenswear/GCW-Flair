// Settings → Colors — the admin home for the brand palette.
//
// This is the ONLY place in Flair where hex values are visible or editable.
// Style editors and Campaign editors consume colors by ID from here — they
// see name + swatch only. See Decision #5 in the vision brief.
//
// Slice 1 (read-only):     groups sidebar + colors table + audit log preview
// Slice 2 (this commit):   Add color modal + page-header actions

import { useState } from "react";
import { SEED_COLOR_GROUPS, SEED_COLORS, SEED_AUDIT_LOG } from "../data/color-palette";
import type { Color, ColorAuditEntry, ColorGroup } from "../types/color";

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

function generateColorId(): string {
  return `clr_${Math.random().toString(36).slice(2, 8)}`;
}

function generateAuditId(): string {
  return `audit_${Math.random().toString(36).slice(2, 10)}`;
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
  const [groups] = useState<ColorGroup[]>(SEED_COLOR_GROUPS); // editing groups lands in a later slice
  const [auditLog, setAuditLog] = useState<ColorAuditEntry[]>(SEED_AUDIT_LOG);
  const [activeGroupId, setActiveGroupId] = useState<string>("__all");

  // Modal state — "form" handles both Add and Edit in later slices.
  const [colorForm, setColorForm] = useState<{ mode: "add" | "edit"; colorId?: string } | null>(null);

  const visibleColors: Color[] =
    activeGroupId === "__all" ? colors : colors.filter((c) => c.groupId === activeGroupId);

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
          <button type="button" disabled title="Coming next slice" style={ghostBtnStyle(true)}>
            Export JSON
          </button>
          <button type="button" disabled title="Coming next slice" style={ghostBtnStyle(true)}>
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
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => setActiveGroupId(group.id)}
                style={groupRowStyle(active)}
              >
                <span>{group.name}</span>
                <span style={{ color: "#667f8e", fontSize: 12 }}>{count}</span>
              </button>
            );
          })}
        </aside>

        {/* Main panel — colors table + audit log */}
        <div>
          <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
            <div style={tableHeaderStyle}>
              <div>Swatch</div>
              <div>Name</div>
              <div>Hex</div>
              <div>Used by</div>
              <div style={{ textAlign: "right" }}>Actions</div>
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
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <button type="button" disabled title="Edit (coming next slice)" style={linkBtnStyle("muted", true)}>
                      Edit
                    </button>
                    <button type="button" disabled title="Delete with forced transfer (coming next slice)" style={linkBtnStyle("danger", true)}>
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
    </div>
  );
}

// ─── Color Form Modal (Add — Edit reuses in next slice) ──────────────────────
function ColorFormModal({
  mode,
  groups,
  initial,
  onCancel,
  onSubmit,
}: {
  mode: "add" | "edit";
  groups: ColorGroup[];
  initial?: { name: string; hex: string; groupId: string };
  onCancel: () => void;
  onSubmit: (input: { name: string; hex: string; groupId: string }) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [hex, setHex] = useState(initial?.hex ?? "#85b7ea");
  const [groupId, setGroupId] = useState(initial?.groupId ?? groups[0]?.id ?? "");

  const validHex = /^#[0-9a-fA-F]{6}$/.test(hex);
  const canSubmit = name.trim().length > 0 && validHex && groupId;

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
        <p style={{ marginBottom: 20, color: "#667f8e", fontSize: 13 }}>
          Hex is entered here only — Style editors elsewhere in Flair display this color by name + swatch.
        </p>

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
            onClick={() => canSubmit && onSubmit({ name, hex, groupId })}
            disabled={!canSubmit}
            style={primaryBtnStyle(!canSubmit)}
          >
            {mode === "add" ? "Add color" : "Save changes"}
          </button>
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
