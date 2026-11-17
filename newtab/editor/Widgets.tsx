/* SPDX-License-Identifier: GPL-3.0-only
 * Editor adapted from Tabliss 2.6.0, Joël Shepherd and contributors. */
import React from "react";
import { useEditor, useWidgets } from "./runtime";
import Widget from "./Widget";

const Widgets: React.FC = () => {
  const {
    t,
    catalog,
    actions: { addWidget, removeWidget, reorderWidget },
    ui: { UiField, UiSelect },
  } = useEditor();
  const widgets = useWidgets();

  return (
    <div>
      <h2>{t("Widgets")}</h2>

      <UiField>
        <UiSelect
          value=""
          onChange={(event) => addWidget(event.target.value)}
          className="primary"
        >
          <option disabled value="">
            {t("Add a new widget")}
          </option>
          {catalog.list("widget").map((plugin) => (
            <option key={plugin.key} value={plugin.key}>
              {plugin.name}
            </option>
          ))}
        </UiSelect>
      </UiField>

      {widgets.map((widget, index) => (
        <Widget
          key={widget.id}
          plugin={widget}
          onMoveUp={
            index > 0 ? () => reorderWidget(index, index - 1) : undefined
          }
          onMoveDown={
            index < widgets.length - 1
              ? () => reorderWidget(index, index + 1)
              : undefined
          }
          onRemove={() => removeWidget(widget.id)}
        />
      ))}
    </div>
  );
};

export default Widgets;
