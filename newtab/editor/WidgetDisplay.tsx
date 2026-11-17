/* SPDX-License-Identifier: GPL-3.0-only
 * Editor adapted from Tabliss 2.6.0, Joël Shepherd and contributors. */
import { WidgetDisplay as WidgetDisplayType } from "../engine/model";
import React from "react";
import { useEditor } from "./runtime";
import PositionInput from "./PositionInput";
import "./WidgetDisplay.css";

type Props = {
  display: WidgetDisplayType;
  onChange: (display: Partial<WidgetDisplayType>) => void;
};

const WidgetDisplay: React.FC<Props> = ({ display, onChange }) => {
  const {
    t,
    ui: { UiField, UiInput },
  } = useEditor();
  return (
    <div className="WidgetDisplay">
      <PositionInput
        value={display.position}
        onChange={(position) => onChange({ position })}
      />

      <UiField>
        {t("Size")}
        <br />
        <UiInput
          type="range"
          value={display.fontSize ?? 24}
          min="2"
          max="100"
          step="2"
          onChange={(event) =>
            onChange({ fontSize: Number(event.target.value) })
          }
        />
      </UiField>
    </div>
  );
};

export default WidgetDisplay;
