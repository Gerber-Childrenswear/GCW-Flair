// Theme Triggers seed data.
//
// SEED_TRIGGER_THEME_PRESETS — the curated list of "popular themes" that
// powers the Theme name dropdown on the Add Theme Trigger page. Each
// entry knows which storefront events that theme typically fires;
// admins pick which ones to listen for.
//
// SEED_THEME_TRIGGERS — starter triggers, so the list view has rows the
// first time the admin opens the page.

import type { TriggerThemePreset, ThemeTrigger } from "../types/theme-triggers";

const SEED_TIMESTAMP = new Date().toISOString();

// Popular Shopify theme conventions. "General" matches the vendor
// screenshot exactly; the others approximate well-known themes that ship
// with cart/variant events under standard names. Admins edit the seed
// in JSON when adding new theme support.
export const SEED_TRIGGER_THEME_PRESETS: TriggerThemePreset[] = [
  {
    themeName: "General",
    description: "Standard Shopify storefront events fired by most themes.",
    events: [
      { key: "cart:update",     label: "Event cart:update" },
      { key: "variant:change",  label: "Event variant:change" },
      { key: "variant:update",  label: "Event variant:update" },
    ],
  },
  {
    themeName: "Dawn",
    description: "Shopify's reference theme. Uses publish/subscribe events from theme.js.",
    events: [
      { key: "cart:item-added",     label: "Event cart:item-added" },
      { key: "cart:item-removed",   label: "Event cart:item-removed" },
      { key: "variant:change",      label: "Event variant:change" },
      { key: "quick-add:open",      label: "Event quick-add:open" },
    ],
  },
  {
    themeName: "Refresh",
    description: "Shopify Refresh theme — extends Dawn with extra section events.",
    events: [
      { key: "cart:update",         label: "Event cart:update" },
      { key: "variant:change",      label: "Event variant:change" },
      { key: "section:reloaded",    label: "Event section:reloaded" },
    ],
  },
  {
    themeName: "Sense",
    description: "Shopify Sense theme — wellness/lifestyle vertical.",
    events: [
      { key: "cart:update",         label: "Event cart:update" },
      { key: "variant:change",      label: "Event variant:change" },
      { key: "cart-drawer:open",    label: "Event cart-drawer:open" },
    ],
  },
  {
    themeName: "Custom / Other",
    description: "If your theme isn't listed, use the Event or Content trigger type instead and define your own.",
    events: [],
  },
];

// Seed triggers — gives the admin a non-empty list view on first load.
export const SEED_THEME_TRIGGERS: ThemeTrigger[] = [
  {
    id: "trg_general_default",
    name: "General theme defaults",
    type: "preset",
    enabled: true,
    preset: {
      themeName: "General",
      eventKeys: ["cart:update", "variant:change", "variant:update"],
    },
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  },
];
