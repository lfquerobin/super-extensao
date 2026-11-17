/* SPDX-License-Identifier: GPL-3.0-only */
import React from "react";
import { EditorContext, EditorServices } from "./runtime";
import Settings from "./Settings";
import { useValue } from "../dashboard/Dashboard";
export default function Editor(services: EditorServices) {
  const locale = useValue(services.db, "locale");
  return (
    <EditorContext.Provider value={{ ...services, locale }}>
      <Settings />
    </EditorContext.Provider>
  );
}
