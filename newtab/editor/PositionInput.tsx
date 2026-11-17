/* SPDX-License-Identifier: GPL-3.0-only
 * Editor adapted from Tabliss 2.6.0, Joël Shepherd and contributors. */
import { WidgetPosition } from "../engine/model";
import React from "react";
import { useEditor } from "./runtime";
import "./PositionInput.css";

const positions = [
  {
    value: "topLeft",
    icon: "arrow-up-left",
  },
  {
    value: "topCentre",
    icon: "arrow-up",
  },
  {
    value: "topRight",
    icon: "arrow-up-right",
  },
  {
    value: "middleLeft",
    icon: "arrow-left",
  },
  {
    value: "middleCentre",
    icon: "move",
  },
  {
    value: "middleRight",
    icon: "arrow-right",
  },
  {
    value: "bottomLeft",
    icon: "arrow-down-left",
  },
  {
    value: "bottomCentre",
    icon: "arrow-down",
  },
  {
    value: "bottomRight",
    icon: "arrow-down-right",
  },
] as const;

type Props = {
  value: WidgetPosition;
  onChange: (value: WidgetPosition) => void;
};

const PositionInput: React.FC<Props> = ({ value, onChange }) => {
  const {
    t,
    Icon,
    IconButton,
    ui: { UiNote },
  } = useEditor();
  return (
    <div className="PositionInput">
      <UiNote>{t("Position")}</UiNote>

      <div className="grid" role="group" aria-label={t("Position")}>
        {positions.map((position) => (
          <IconButton
            key={position.value}
            onClick={() => onChange(position.value)}
            primary={value === position.value}
            title={t(
              position.value
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (letter) => letter.toUpperCase())
            )}
            aria-pressed={value === position.value}
          >
            <Icon name={position.icon} />
          </IconButton>
        ))}
      </div>
    </div>
  );
};

export default PositionInput;
