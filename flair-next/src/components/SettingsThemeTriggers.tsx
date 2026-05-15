// Settings → Theme → Theme Triggers
//
// Storefront event listeners that re-render Flair when the merchant's
// theme fires events (cart:update, variant:change, custom DOM events,
// content mutations).
//
// UX mirrors the Flair vendor app's Add Theme Trigger page apples-to-
// apples: a Type panel (Presets / Event / Content) followed by a
// type-specific configuration panel. See screenshot in
// Projects/2026-05-flair-app-redesign/_brief.md (Decision #7 addendum).
//
// FOR NICK: live-side wiring happens in the storefront app block JS.
// This page only records the merchant's desired trigger config; the app
// block reads it and registers the appropriate listeners / observers.

import { useState } from "react";
import {
  SEED_THEME_TRIGGERS,
  SEED_TRIGGER_THEME_PRESETS,
} from "../data/theme-triggers";
import type {
  ThemeTrigger,
  TriggerType,
  PresetTriggerConfig,
  EventTriggerConfig,
  ContentTriggerConfig,
} from "../types/theme-triggers";

function generateTriggerId(): string {
  return `trg_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function SettingsThemeTriggers() {
  const [triggers, setTriggers] = useState<ThemeTrigger[]>(SEED_THEME_TRIGGERS);
  const [editing, setEditing] = useState<{ mode: "add" } | { mode: "edit"; id: string } | null>(null);

  // ─── Add / Save handler ──────────────────────────────────────────────────
  function handleSaveTrigger(trigger: ThemeTrigger) {
    const now = new Date().toISOString();
    setTriggers((prev) => {
      const idx = prev.findIndex((t) => t.id === trigger.id);
      const next: ThemeTrigger = { ...trigger, updatedAt: now };
      return idx >= 0 ? prev.map((t) => (t.id === trigger.id ? next : t)) : [...prev, next];
    });
    setEditing(null);
  }

  function handleDelete(id: string) {
    setTriggers((prev) => prev.filter((t) => t.id !== id));
  }

  function handleToggleEnabled(id: string) {
    setTriggers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled, updatedAt: new Date().toISOString() } : t)),
    );
  }

  // ─── Add / Edit form view ────────────────────────────────────────────────
  if (editing) {
    const initial = editing.mode === "edit" ? triggers.find((t) => t.id === editing.id) : undefined;
    return (
      <ThemeTriggerForm
        mode={editing.mode}
        initial={initial}
        onCancel={() => setEditing(null)}
        onSave={handleSaveTrigger}
      />
    );
  }

  // ─── List view ───────────────────────────────────────────────────────────
  return (
    <div className="sc-page">
      <div className="sc-page-head">
        <div>
          <div className="sc-eyebrow">Settings · Theme · Theme Triggers</div>
          <h1 className="sc-title">Theme Triggers</h1>
          <p className="sc-deck">
            Storefront events that tell Flair to re-render. When your theme fires events like
            cart:update or variant:change, Flair listens and refreshes its placements so badges and
            banners stay in sync with what the shopper is doing.
          </p>
        </div>
        <div className="sc-page-actions">
          <button
            type="button"
            className="sc-btn sc-btn--primary"
            onClick={() => setEditing({ mode: "add" })}
          >
            + Add Theme Trigger
          </button>
        </div>
      </div>

      {triggers.length === 0 ? (
        <div
          style={{
            padding: "var(--space-6)",
            textAlign: "center",
            background: "var(--bg-page)",
            borderRadius: "var(--radius-md)",
            color: "var(--text-secondary)",
          }}
        >
          No triggers configured yet. Add one to start re-rendering Flair on theme events.
        </div>
      ) : (
        <div className="sc-table">
          <div
            className="sc-table-head"
            style={{ gridTemplateColumns: "minmax(220px, 1.4fr) 100px minmax(220px, 2fr) 90px 120px" }}
          >
            <div>Name</div>
            <div>Type</div>
            <div>What it listens to</div>
            <div>Enabled</div>
            <div style={{ textAlign: "right" }}>Actions</div>
          </div>
          {triggers.map((trigger) => (
            <div
              key={trigger.id}
              className="sc-table-row"
              style={{ gridTemplateColumns: "minmax(220px, 1.4fr) 100px minmax(220px, 2fr) 90px 120px" }}
            >
              <div className="sc-table-name">{trigger.name}</div>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-secondary)", fontWeight: 600 }}>
                {trigger.type}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-primary)", lineHeight: 1.5 }}>
                {summarizeTrigger(trigger)}
              </div>
              <div>
                <label style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12 }}>
                  <input
                    type="checkbox"
                    checked={trigger.enabled}
                    onChange={() => handleToggleEnabled(trigger.id)}
                  />
                  <span style={{ color: trigger.enabled ? "var(--ok)" : "var(--text-muted)" }}>
                    {trigger.enabled ? "On" : "Off"}
                  </span>
                </label>
              </div>
              <div className="sc-table-actions">
                <button
                  type="button"
                  className="sc-row-action"
                  onClick={() => setEditing({ mode: "edit", id: trigger.id })}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="sc-row-action sc-row-action--danger"
                  onClick={() => handleDelete(trigger.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: "var(--space-4)", fontSize: 12, color: "var(--text-secondary)" }}>
        Learn more about <a href="#" style={{ color: "var(--color-focus)" }}>theme triggers</a>.
      </div>
    </div>
  );
}

function summarizeTrigger(trigger: ThemeTrigger): string {
  if (trigger.type === "preset" && trigger.preset) {
    const count = trigger.preset.eventKeys.length;
    return `${trigger.preset.themeName} preset · ${count} event${count === 1 ? "" : "s"}`;
  }
  if (trigger.type === "event" && trigger.event) {
    return `Custom event: ${trigger.event.eventName}${trigger.event.selector ? ` (scope: ${trigger.event.selector})` : ""}`;
  }
  if (trigger.type === "content" && trigger.content) {
    return `DOM mutation on ${trigger.content.selector}`;
  }
  return "—";
}

// ─── Add / Edit form ─────────────────────────────────────────────────────────
function ThemeTriggerForm({
  mode,
  initial,
  onCancel,
  onSave,
}: {
  mode: "add" | "edit";
  initial?: ThemeTrigger;
  onCancel: () => void;
  onSave: (trigger: ThemeTrigger) => void;
}) {
  const [type, setType] = useState<TriggerType>(initial?.type ?? "preset");
  const [name, setName] = useState(initial?.name ?? "");

  // Type-specific working state
  const [preset, setPreset] = useState<PresetTriggerConfig>(
    initial?.preset ?? { themeName: SEED_TRIGGER_THEME_PRESETS[0].themeName, eventKeys: [] },
  );
  const [eventCfg, setEventCfg] = useState<EventTriggerConfig>(
    initial?.event ?? { eventName: "", selector: "" },
  );
  const [contentCfg, setContentCfg] = useState<ContentTriggerConfig>(
    initial?.content ?? { selector: "", observeChildren: true, observeAttributes: false },
  );

  const activePreset = SEED_TRIGGER_THEME_PRESETS.find((p) => p.themeName === preset.themeName);

  function toggleEventKey(key: string) {
    setPreset((prev) => ({
      ...prev,
      eventKeys: prev.eventKeys.includes(key)
        ? prev.eventKeys.filter((k) => k !== key)
        : [...prev.eventKeys, key],
    }));
  }

  function handleSubmit() {
    const id = initial?.id ?? generateTriggerId();
    const now = new Date().toISOString();
    const fallbackName =
      type === "preset"
        ? `${preset.themeName} theme defaults`
        : type === "event"
          ? eventCfg.eventName || "Custom event trigger"
          : contentCfg.selector || "Content mutation trigger";

    const trigger: ThemeTrigger = {
      id,
      name: name.trim() || fallbackName,
      type,
      enabled: initial?.enabled ?? true,
      preset: type === "preset" ? preset : undefined,
      event: type === "event" ? eventCfg : undefined,
      content: type === "content" ? contentCfg : undefined,
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
    };
    onSave(trigger);
  }

  const canSubmit =
    (type === "preset" && preset.eventKeys.length > 0) ||
    (type === "event" && eventCfg.eventName.trim().length > 0) ||
    (type === "content" && contentCfg.selector.trim().length > 0);

  return (
    <div className="sc-page">
      <div className="sc-page-head">
        <div>
          <button type="button" className="sc-back" onClick={onCancel} style={{ margin: 0, marginBottom: 8 }}>
            ‹ Back to Theme Triggers
          </button>
          <h1 className="sc-title">{mode === "add" ? "Add Theme Trigger" : "Edit Theme Trigger"}</h1>
        </div>
      </div>

      <div style={{ display: "grid", gap: "var(--space-4)" }}>
        {/* Name (optional — falls back to a sensible default if blank) */}
        <div className="panel" style={{ padding: "var(--space-4)" }}>
          <label className="sc-field-label" htmlFor="trg-name">Name (optional)</label>
          <input
            id="trg-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. General theme defaults"
            className="sc-field-input"
          />
        </div>

        {/* Type panel */}
        <div className="panel" style={{ padding: "var(--space-4)" }}>
          <h3 style={{ margin: "0 0 var(--space-3)", fontSize: 16, color: "var(--color-oxford-blue)" }}>Type</h3>
          <div style={{ display: "flex", gap: "var(--space-5)", flexWrap: "wrap" }}>
            {(["preset", "event", "content"] as TriggerType[]).map((t) => (
              <label key={t} style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, color: "var(--text-primary)" }}>
                <input
                  type="radio"
                  name="trigger-type"
                  checked={type === t}
                  onChange={() => setType(t)}
                />
                <span style={{ textTransform: "capitalize" }}>{t === "preset" ? "Presets" : t}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Type-specific panel — Presets */}
        {type === "preset" && (
          <div className="panel" style={{ padding: "var(--space-4)" }}>
            <h3 style={{ margin: "0 0 var(--space-2)", fontSize: 16, color: "var(--color-oxford-blue)" }}>Presets</h3>
            <p style={{ margin: "0 0 var(--space-4)", color: "var(--text-secondary)", fontSize: 13 }}>
              Use trigger presets based on popular themes.
            </p>

            <div className="sc-field">
              <label className="sc-field-label" htmlFor="trg-theme">Theme name</label>
              <select
                id="trg-theme"
                value={preset.themeName}
                onChange={(e) => setPreset({ themeName: e.target.value, eventKeys: [] })}
                className="sc-field-select"
              >
                {SEED_TRIGGER_THEME_PRESETS.map((p) => (
                  <option key={p.themeName} value={p.themeName}>
                    {p.themeName}
                  </option>
                ))}
              </select>
              {activePreset?.description && (
                <div style={{ marginTop: "var(--space-1)", fontSize: 11, color: "var(--text-secondary)" }}>
                  {activePreset.description}
                </div>
              )}
            </div>

            <div style={{ marginTop: "var(--space-4)", paddingTop: "var(--space-4)", borderTop: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-3)" }}>
                Choose trigger presets:
              </div>
              {activePreset && activePreset.events.length > 0 ? (
                <div style={{ display: "grid", gap: "var(--space-2)" }}>
                  {activePreset.events.map((ev) => (
                    <label
                      key={ev.key}
                      style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, color: "var(--text-primary)" }}
                    >
                      <input
                        type="checkbox"
                        checked={preset.eventKeys.includes(ev.key)}
                        onChange={() => toggleEventKey(ev.key)}
                      />
                      <span>{ev.label}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>
                  No preset events available for this theme. Switch to the Event or Content type to define your own.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Type-specific panel — Event */}
        {type === "event" && (
          <div className="panel" style={{ padding: "var(--space-4)" }}>
            <h3 style={{ margin: "0 0 var(--space-2)", fontSize: 16, color: "var(--color-oxford-blue)" }}>Custom event</h3>
            <p style={{ margin: "0 0 var(--space-4)", color: "var(--text-secondary)", fontSize: 13 }}>
              Listen for any JavaScript event your theme fires. Use when your theme isn't in the Presets list.
            </p>

            <div className="sc-field">
              <label className="sc-field-label" htmlFor="trg-event-name">Event name</label>
              <input
                id="trg-event-name"
                type="text"
                value={eventCfg.eventName}
                onChange={(e) => setEventCfg({ ...eventCfg, eventName: e.target.value })}
                placeholder="e.g. cart:updated"
                className="sc-field-input sc-field-input--mono"
              />
            </div>

            <div className="sc-field">
              <label className="sc-field-label" htmlFor="trg-event-selector">Selector (optional)</label>
              <input
                id="trg-event-selector"
                type="text"
                value={eventCfg.selector ?? ""}
                onChange={(e) => setEventCfg({ ...eventCfg, selector: e.target.value })}
                placeholder="e.g. #cart-drawer (scope the listener; leave blank for document-wide)"
                className="sc-field-input sc-field-input--mono"
              />
            </div>
          </div>
        )}

        {/* Type-specific panel — Content (DOM mutations) */}
        {type === "content" && (
          <div className="panel" style={{ padding: "var(--space-4)" }}>
            <h3 style={{ margin: "0 0 var(--space-2)", fontSize: 16, color: "var(--color-oxford-blue)" }}>Content / DOM mutation</h3>
            <p style={{ margin: "0 0 var(--space-4)", color: "var(--text-secondary)", fontSize: 13 }}>
              Re-render Flair whenever a matched element's contents change. Useful for themes that swap product cards via AJAX without firing events.
            </p>

            <div className="sc-field">
              <label className="sc-field-label" htmlFor="trg-content-selector">Selector</label>
              <input
                id="trg-content-selector"
                type="text"
                value={contentCfg.selector}
                onChange={(e) => setContentCfg({ ...contentCfg, selector: e.target.value })}
                placeholder="e.g. .product-grid"
                className="sc-field-input sc-field-input--mono"
              />
            </div>

            <div style={{ display: "flex", gap: "var(--space-5)", marginTop: "var(--space-2)" }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={contentCfg.observeChildren}
                  onChange={(e) => setContentCfg({ ...contentCfg, observeChildren: e.target.checked })}
                />
                Observe children
              </label>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={contentCfg.observeAttributes}
                  onChange={(e) => setContentCfg({ ...contentCfg, observeAttributes: e.target.checked })}
                />
                Observe attributes
              </label>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: "var(--space-2)", justifyContent: "flex-start" }}>
          <button
            type="button"
            className="sc-btn sc-btn--primary"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {mode === "add" ? "Save" : "Save changes"}
          </button>
          <button type="button" className="sc-btn sc-btn--ghost" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>

      <div style={{ marginTop: "var(--space-6)", fontSize: 12, color: "var(--text-secondary)", textAlign: "center" }}>
        Learn more about <a href="#" style={{ color: "var(--color-focus)" }}>theme triggers</a>.
      </div>
    </div>
  );
}
