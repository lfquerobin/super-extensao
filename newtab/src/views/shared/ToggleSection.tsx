import React from "react";
import {UiDisclosure} from "../../ui";
import {t} from "../../locales/ui";
const ToggleSection: React.FC<{name: string; children: React.ReactNode}> = ({name, children}) => (
  <UiDisclosure title={name} openText={t("Open")} closeText={t("Close")}>{children}</UiDisclosure>
);
export default ToggleSection;
