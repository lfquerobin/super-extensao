/* SPDX-License-Identifier: GPL-3.0-only */
import * as DB from "./database";
import { Catalog } from "./catalog";
import { BackgroundDisplay, State } from "./model";
import { settings } from "./settings";
/** Validate new selections without rejecting historical/unknown imported plugins. */
export function editorActions(
  db: DB.Database<State>,
  cache: DB.Database,
  catalog: Catalog<unknown>
) {
  const actions = settings(db, cache);
  function requireKind(key: string, kind: string) {
    if (!key.startsWith(kind + "/")) throw Error("Invalid plugin type");
    catalog.get(key);
  }
  return {
    ...actions,
    addWidget(key: string) {
      requireKind(key, "widget");
      actions.addWidget(key);
    },
    setBackground(key: string) {
      requireKind(key, "background");
      actions.setBackground(key);
    },
    setBackgroundDisplay(id: string, display: Partial<BackgroundDisplay>) {
      const current = DB.get(db, "background");
      if (current.id === id)
        DB.put(db, "background", {
          ...current,
          display: { ...current.display, ...display },
        });
    },
  };
}
