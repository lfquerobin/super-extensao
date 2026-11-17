/* SPDX-License-Identifier: GPL-3.0-only
 * Plugin identities and descriptions retained from Tabliss 2.6.0. */
export interface PluginDefinition {
  key: string;
  name: string;
  description: string;
  supportsBackdrop?: boolean;
  webOnly?: boolean;
}
export type PluginEntry<B> = B & PluginDefinition;
export interface Catalog<B> {
  get(key: string): PluginEntry<B>;
  find(key: string): PluginEntry<B> | undefined;
  list(kind: "widget" | "background"): PluginEntry<B>[];
}

export const pluginDefinitions: readonly PluginDefinition[] = [
  {
    key: "background/colour",
    name: "Solid Colour",
    description: "Add a splash of colour.",
  },
  {
    key: "background/giphy",
    name: "GIPHY",
    description: "Hurt your eyes in every new tab.",
    supportsBackdrop: true,
  },
  {
    key: "background/gradient",
    name: "Colour Gradient",
    description: "Add more splashes of colour.",
  },
  {
    key: "background/image",
    name: "Upload Images",
    description: "See your own images.",
    supportsBackdrop: true,
  },
  {
    key: "background/unsplash",
    name: "Unsplash",
    description: "Who has time to find their own images.",
    supportsBackdrop: true,
  },
  {
    key: "widget/css",
    name: "Custom CSS",
    description: "Make your new tab more style-ish (advanced users).",
  },
  {
    key: "widget/github",
    name: "GitHub Calendar",
    description: "Get motivated by green squares.",
  },
  {
    key: "widget/greeting",
    name: "Greeting",
    description: "Be personally greeted all day.",
  },
  {
    key: "widget/ipInfo",
    name: "IP Info",
    description: "Displays data on your IP and location",
  },
  {
    key: "widget/js",
    name: "Custom JS",
    description: "Program in your program.",
    webOnly: true,
  },
  {
    key: "widget/links",
    name: "Quick Links",
    description: "I heard you like bookmarks.",
  },
  {
    key: "widget/literature-clock",
    name: "Literature Clock",
    description: "Check the time, with sophistication.",
  },
  {
    key: "widget/message",
    name: "Message",
    description: "Add your own text.",
  },
  {
    key: "widget/nba",
    name: "NBA Scores",
    description: "Keep up to date with today's NBA games.",
  },
  {
    key: "widget/notes",
    name: "Notes",
    description: "Jot something down.",
  },
  {
    key: "widget/quote",
    name: "Quotes",
    description: "Be inspired (or not, there's categories).",
  },
  {
    key: "widget/search",
    name: "Search Box",
    description: "Move your URL bar.",
  },
  {
    key: "widget/time",
    name: "Time",
    description: "Be on time.",
  },
  {
    key: "widget/todo",
    name: "Todos",
    description: "Add reminders to procrastinate.",
  },
  {
    key: "widget/weather",
    name: "Weather",
    description: "Add a window to see outside.",
  },
  {
    key: "widget/workHours",
    name: "Work Hours",
    description: "Count down the working hours.",
  },
];

/** Metadata/availability belong to the host; bindings supply implementations only. */
export function createCatalog<B>(
  bindings: ReadonlyMap<string, B>,
  translate: (text: string) => string,
  target = "chromium"
): Catalog<B> {
  const entries = new Map<string, PluginEntry<B>>();
  for (const definition of pluginDefinitions) {
    if (definition.webOnly && target !== "web") continue;
    if (!bindings.has(definition.key))
      throw Error(`Missing plugin binding: ${definition.key}`);
    const entry = {
      ...bindings.get(definition.key),
      ...definition,
    } as PluginEntry<B>;
    // Keep labels live when the shared language changes.
    Object.defineProperties(entry, {
      name: { get: () => translate(definition.name), enumerable: true },
      description: {
        get: () => translate(definition.description),
        enumerable: true,
      },
    });
    entries.set(definition.key, Object.freeze(entry));
  }
  return {
    get(key) {
      const entry = entries.get(key);
      if (!entry) throw Error(`Unable to find config for plugin: ${key}`);
      return entry;
    },
    find: (key) => entries.get(key),
    list: (kind) =>
      [...entries.values()]
        .filter((entry) => entry.key.startsWith(kind + "/"))
        .sort((a, b) => a.name.localeCompare(b.name)),
  };
}
