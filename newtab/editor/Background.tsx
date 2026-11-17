/* SPDX-License-Identifier: GPL-3.0-only
 * Editor adapted from Tabliss 2.6.0, Joël Shepherd and contributors. */
import { BackgroundDisplay } from "../engine/model";
import React from "react";
import { useEditor, useKey, ToggleSection, PluginSettings } from "./runtime";

const Background: React.FC = () => {
  const {
    t,
    db,
    catalog,
    actions: { setBackground, setBackgroundDisplay: updateDisplay },
    ui: { UiEditorCard, UiField, UiInput, UiSelect },
  } = useEditor();
  const [data] = useKey(db, "background");

  const plugin = catalog.find(data.key);

  const setBackgroundDisplay = (display: BackgroundDisplay): void => {
    updateDisplay(data.id, display);
  };

  return (
    <div>
      <h2>{t("Background")}</h2>

      <UiField>
        <UiSelect
          value={data.key}
          onChange={(event) => setBackground(event.target.value)}
          className="primary"
        >
          {!plugin && <option value={data.key}>{data.key}</option>}
          {catalog.list("background").map((plugin) => (
            <option key={plugin.key} value={plugin.key}>
              {plugin.name}
            </option>
          ))}
        </UiSelect>
      </UiField>

      {plugin && (
        <UiEditorCard as="div" title={plugin.name}>
          {plugin.settingsComponent && (
            <div className="settings">
              <PluginSettings item={data} background />
            </div>
          )}

          {plugin.supportsBackdrop && (
            <ToggleSection name={t("Display Settings")}>
              <>
                <UiField>
                  {t("Blur ")}
                  <br />
                  <UiInput
                    type="range"
                    list="blur-markers"
                    min="0"
                    max="50"
                    step="2"
                    value={data.display.blur ?? 0}
                    onChange={(event) =>
                      setBackgroundDisplay({
                        blur: Number(event.target.value),
                      })
                    }
                  />
                  <datalist id="blur-markers">
                    <option value="0" />
                    <option value="50" />
                  </datalist>
                </UiField>

                <UiField>
                  {t("Luminosity ")}
                  <br />
                  <UiInput
                    type="range"
                    list="luminosity-markers"
                    min="-1"
                    max="1"
                    step="0.1"
                    value={data.display.luminosity ?? 0}
                    onChange={(event) =>
                      setBackgroundDisplay({
                        luminosity: Number(event.target.value),
                      })
                    }
                  />
                  <datalist id="luminosity-markers">
                    <option value="-1" label={t("Darken")} />
                    <option value="0" />
                    <option value="1" label={t("Lighten")} />
                  </datalist>
                </UiField>
              </>
            </ToggleSection>
          )}
        </UiEditorCard>
      )}
    </div>
  );
};

export default Background;
