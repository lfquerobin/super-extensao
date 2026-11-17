/* SPDX-License-Identifier: GPL-3.0-only
 * Editor adapted from Tabliss 2.6.0, Joël Shepherd and contributors. */
import React from "react";
import { useEditor, useKey } from "./runtime";

const System: React.FC = () => {
  const {
    t,
    db,
    TimeZoneInput,
    ui: { UiField, UiSelect, UiStack },
  } = useEditor();
  const [locale, setLocale] = useKey(db, "locale");
  const [timeZone, setTimeZone] = useKey(db, "timeZone");

  return (
    <div>
      <h2>{t("Settings")}</h2>

      <UiStack className="system-fields">
        <UiField className="system-field">
          <span>{t("Language")}</span>
          <UiSelect
            value={locale}
            onChange={(event) => setLocale(event.target.value)}
          >
            <option value="pt-BR">Português do Brasil</option>
            <option value="en">English</option>
          </UiSelect>
        </UiField>

        <UiField className="system-field">
          {t("Time Zone")}
          <TimeZoneInput timeZone={timeZone} onChange={setTimeZone} />
        </UiField>
      </UiStack>
    </div>
  );
};

export default System;
