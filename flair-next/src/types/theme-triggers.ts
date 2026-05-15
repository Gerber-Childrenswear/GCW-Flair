// Theme Triggers — storefront event listeners that re-render Flair when
// the Shopify theme fires events (cart:update, variant:change, etc.).
//
// Modeled apples-to-apples to the Flair vendor app's Add Theme Trigger
// page (see screenshot referenced in brief Decision #7 addendum).
//
// Three trigger types:
//   - "preset": pick from a curated list of trigger sets keyed by
//     theme name (General / Dawn / Refresh / Sense / etc.). Each preset
//     contains the events Flair should listen for under that theme's
//     JS conventions.
//   - "event": custom JS event listener. The admin types an event name
//     (e.g. "cart:updated") and optionally a selector that scopes which
//     elements trigger the re-render.
//   - "content": DOM mutation observer — Flair re-renders when the
//     matched selector's children change.
//
// FOR NICK: live-side wiring happens in the storefront app block JS, not
// in this admin UI. This Settings surface just records the triggers the
// merchant wants; the app block loads that config and registers the
// appropriate event listeners / mutation observers.

export type TriggerId = string;
export type TriggerType = "preset" | "event" | "content";

// ─── Preset trigger ─────────────────────────────────────────────────────────
// Selected from the seeded list of known theme conventions.
export type PresetTriggerConfig = {
  themeName: string;        // "General" | "Dawn" | "Refresh" | "Sense" | ...
  eventKeys: string[];      // selected events from that theme's preset, e.g. ["cart:update", "variant:change"]
};

// ─── Custom event listener ──────────────────────────────────────────────────
export type EventTriggerConfig = {
  eventName: string;        // e.g. "cart:updated", "section:loaded"
  selector?: string;        // optional scope selector
};

// ─── Content / DOM mutation watcher ─────────────────────────────────────────
export type ContentTriggerConfig = {
  selector: string;         // CSS selector for the mutation target
  observeChildren: boolean;
  observeAttributes: boolean;
};

// ─── Theme Trigger record ───────────────────────────────────────────────────
export type ThemeTrigger = {
  id: TriggerId;
  name: string;             // admin label, defaulted from preset themeName or event name
  type: TriggerType;
  enabled: boolean;
  preset?: PresetTriggerConfig;
  event?: EventTriggerConfig;
  content?: ContentTriggerConfig;
  createdAt: string;
  updatedAt: string;
};

// ─── Catalog of preset themes available for the Presets type ───────────────
// Each entry surfaces in the "Theme name" dropdown of the Add page.
export type TriggerThemePreset = {
  themeName: string;        // dropdown label
  description: string;
  events: Array<{
    key: string;            // checkbox value
    label: string;          // checkbox display, e.g. "Event cart:update"
  }>;
};
