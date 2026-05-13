// Settings → Colors — the admin home for the brand palette.
//
// This is the ONLY place in Flair where hex values are visible or editable.
// Style editors and Campaign editors consume colors by ID from here — they
// see name + swatch only. See Decision #5 in the vision brief.
//
// This first slice is read-only: it lists the seeded palette by group, with
// an audit log preview. Add / Edit / Delete-with-transfer / JSON I/O land
// in subsequent commits.

import { useState } from "react";
import { SEED_COLOR_GROUPS, SEED_COLORS, SEED_AUDIT_LOG } from "../data/color-palette";
import type { Color } from "../types/color";

// Mock usage counts — in production these are computed from Styles
// referencing each Color ID. Hardcoded here so the "Used by" column tells
// a believable story while the data layer wires in.
const MOCK_USAGE: Record<string, { styles: number; instances: number }> = {
  clr_001: { styles: 6, instances: 42 },  // Oxford Blue
  clr_002: { styles: 2, instances: 8 },   // Jordy Blue
  clr_004: { styles: 3, instances: 17 },  // Spring Wood
  clr_005: { styles: 4, instances: 23 },  // Maize
  clr_006: { styles: 1, instances: 3 },   // Sandy Brown
  clr_007: { styles: 2, instances: 11 },  // Geraldine
  clr_013: { styles: 5, instances: 31 },  // White
  clr_018: { styles: 3, instances: 14 },  // Coral (Sale)
};

function ColorSwatch({ hex }: { hex: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 24,
        height: 24,
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
  const [activeGroupId, setActiveGroupId] = useState<string>("__all");

  const visibleColors: Color[] =
    activeGroupId === "__all"
      ? SEED_COLORS
      : SEED_COLORS.filter((c) => c.groupId === activeGroupId);

  return (
    <div className="settings-colors-page" style={{ padding: "24px 32px", maxWidth: 1280 }}>
      <div className="settings-page-head" style={{ marginBottom: 8 }}>
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

      <div
        className="settings-colors-layout"
        style={{
          display: "grid",
          gridTemplateColumns: "220px 1fr",
          gap: 24,
          marginTop: 24,
          alignItems: "start",
        }}
      >
        {/* Groups sidebar */}
        <aside
          className="settings-colors-groups panel"
          style={{ padding: 16, position: "sticky", top: 24 }}
        >
          <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#667f8e", marginBottom: 12 }}>
            Groups
          </div>
          <button
            type="button"
            onClick={() => setActiveGroupId("__all")}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              padding: "8px 10px",
              border: "none",
              borderRadius: 6,
              background: activeGroupId === "__all" ? "#e6e8ec" : "transparent",
              fontWeight: activeGroupId === "__all" ? 600 : 400,
              cursor: "pointer",
              marginBottom: 2,
              textAlign: "left",
            }}
          >
            <span>All colors</span>
            <span style={{ color: "#667f8e", fontSize: 12 }}>{SEED_COLORS.length}</span>
          </button>
          {SEED_COLOR_GROUPS.map((group) => {
            const count = SEED_COLORS.filter((c) => c.groupId === group.id).length;
            const active = group.id === activeGroupId;
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => setActiveGroupId(group.id)}
                style={{
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
                  textAlign: "left",
                }}
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
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "60px 1fr 120px 140px 120px",
                gap: 12,
                padding: "12px 16px",
                background: "#f9f5f3",
                fontSize: 11,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "#667f8e",
                fontWeight: 600,
                borderBottom: "1px solid #e6e8ec",
              }}
            >
              <div>Swatch</div>
              <div>Name</div>
              <div>Hex</div>
              <div>Used by</div>
              <div style={{ textAlign: "right" }}>Actions</div>
            </div>
            {visibleColors.map((color) => {
              const usage = MOCK_USAGE[color.id] ?? { styles: 0, instances: 0 };
              return (
                <div
                  key={color.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "60px 1fr 120px 140px 120px",
                    gap: 12,
                    padding: "12px 16px",
                    alignItems: "center",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
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
                    <button
                      type="button"
                      disabled
                      title="Edit (coming next slice)"
                      style={{ background: "transparent", border: "none", color: "#667f8e", cursor: "not-allowed", fontSize: 12 }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled
                      title="Delete with forced transfer (coming next slice)"
                      style={{ background: "transparent", border: "none", color: "#bf360c", cursor: "not-allowed", fontSize: 12 }}
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
              {SEED_AUDIT_LOG.map((entry) => (
                <li
                  key={entry.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "160px 90px 1fr 160px",
                    gap: 12,
                    padding: "8px 0",
                    borderBottom: "1px dashed #f0f0f0",
                    fontSize: 12,
                  }}
                >
                  <span style={{ color: "#667f8e" }}>
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                  <span
                    style={{
                      fontFamily: "ui-monospace, Menlo, monospace",
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 4,
                      background: "#e6e8ec",
                      color: "#5d5655",
                      width: "fit-content",
                    }}
                  >
                    {entry.action}
                  </span>
                  <span>
                    <strong>{entry.targetId}</strong>
                    {entry.diff.before && entry.diff.after && (
                      <>
                        <span style={{ color: "#667f8e" }}> — </span>
                        <span>
                          {String((entry.diff.before as any).name ?? "")} → {String((entry.diff.after as any).name ?? "")}
                        </span>
                      </>
                    )}
                    {!entry.diff.before && entry.diff.after && (
                      <>
                        <span style={{ color: "#667f8e" }}> — </span>
                        <span>{String((entry.diff.after as any).name ?? "")}</span>
                      </>
                    )}
                  </span>
                  <span style={{ color: "#667f8e", textAlign: "right" }}>{entry.actor}</span>
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 12, fontSize: 11, color: "#667f8e" }}>
              Full audit log →
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
