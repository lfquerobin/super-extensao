/* SPDX-License-Identifier: GPL-3.0-only
 * Editor adapted from Tabliss 2.6.0, Joël Shepherd and contributors. */
import { WidgetState } from "../engine/model";
import React from "react";
import { useEditor, ToggleSection, PluginSettings } from "./runtime";
import "./Widget.sass";
import WidgetDisplay from "./WidgetDisplay";

interface Props {
  plugin: WidgetState;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onRemove: () => void;
}

const Widget: React.FC<Props> = ({
  plugin,
  onMoveDown,
  onMoveUp,
  onRemove,
}) => {
  const {
    t,
    catalog,
    Icon,
    IconButton,
    actions: { setWidgetDisplay },
    ui: { UiEditorCard, UiField, UiInput, UiSelect },
  } = useEditor();
  const [isOpen, setIsOpen] = React.useState(false);
  const toggleIsOpen = () => setIsOpen((open) => !open);

  const config = catalog.find(plugin.key);
  const { description, name, settingsComponent } = config ?? {
    name: plugin.key,
    description: t("Unavailable widget"),
  };

  const setDisplay = setWidgetDisplay.bind(null, plugin.id);

  return (
    <UiEditorCard
      title={name}
      description={!isOpen ? description : undefined}
      actions={
        <>
          <IconButton onClick={onRemove} title={t("Remove widget")}>
            <Icon name="trash-2" />
          </IconButton>

          <IconButton
            onClick={toggleIsOpen}
            title={t(isOpen ? "Close widget settings" : "Edit widget settings")}
          >
            <Icon name="settings" />
          </IconButton>

          {onMoveDown && (
            <IconButton onClick={onMoveDown} title={t("Move widget down")}>
              <Icon name="arrow-down" />
            </IconButton>
          )}

          {onMoveUp && (
            <IconButton onClick={onMoveUp} title={t("Move widget up")}>
              <Icon name="arrow-up" />
            </IconButton>
          )}
        </>
      }
    >
      {isOpen && (
        <div>
          {settingsComponent && (
            <div className="settings">
              <PluginSettings item={plugin} />
            </div>
          )}

          <ToggleSection name={t("Display Settings")}>
            <WidgetDisplay display={plugin.display} onChange={setDisplay} />
          </ToggleSection>

          <ToggleSection name={t("Font Settings")}>
            <>
              <UiField>
                {t("Font")}
                <UiInput
                  type="text"
                  value={plugin.display.fontFamily ?? ""}
                  onChange={(event) =>
                    setDisplay({ fontFamily: event.target.value })
                  }
                />
              </UiField>

              <UiField>
                {t("Weight")}
                <UiSelect
                  value={plugin.display.fontWeight ?? ""}
                  onChange={(event) =>
                    setDisplay({
                      fontWeight: event.target.value
                        ? Number(event.target.value)
                        : undefined,
                    })
                  }
                >
                  <option value="">{t("Default")}</option>
                  <option value="100">{t("Thin")}</option>
                  <option value="300">{t("Light")}</option>
                  <option value="400">{t("Regular")}</option>
                  <option value="500">{t("Medium")}</option>
                  <option value="700">{t("Bold")}</option>
                  <option value="900">{t("Black")}</option>
                </UiSelect>
              </UiField>

              <UiField>
                {t("Colour")}
                <UiInput
                  type="color"
                  value={plugin.display.colour ?? "#ffffff"}
                  onChange={(event) =>
                    setDisplay({ colour: event.target.value })
                  }
                />
              </UiField>
            </>
          </ToggleSection>
        </div>
      )}
    </UiEditorCard>
  );
};

export default Widget;
