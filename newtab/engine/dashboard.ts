/* SPDX-License-Identifier: GPL-3.0-only */
import * as DB from "./database";
import { State, WidgetPosition, WidgetState } from "./model";
import { widgets } from "./settings";

/** A stable projection for React and other dashboard consumers. Data/cache edits
 * are handled by each instance and must not remount the dashboard. */
export function dashboardStore(db: DB.Database<State>) {
  function project() {
    const background = DB.get(db, "background");
    const focus = DB.get(db, "focus");
    const items = widgets(db);
    const slots = new Map<WidgetPosition, WidgetState[]>();
    for (const widget of items) {
      const group = slots.get(widget.display.position) ?? [];
      group.push(widget);
      slots.set(widget.display.position, group);
    }
    return {
      background,
      focus,
      items,
      slots,
      theme: (background.display.luminosity ?? 0) > 0 ? "light" : "dark",
    };
  }
  let snapshot = project();
  return {
    read() {
      const next = project();
      if (
        snapshot.background !== next.background ||
        snapshot.focus !== next.focus ||
        snapshot.items.length !== next.items.length ||
        snapshot.items.some((item, i) => item !== next.items[i])
      )
        snapshot = next;
      return snapshot;
    },
    subscribe: (notify: () => void) => DB.listen(db, notify),
  };
}
