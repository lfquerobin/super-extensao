/* Super Extensão: inject compatibility components into the own editor. */
import React from "react";
import Editor from "../../../../../newtab/editor/Editor";
import { confirmAction } from "../../../../../ui/confirmation";
import { UiContext } from "../../contexts/ui";
import { db, cache } from "../../db/state";
import { catalog } from "../../plugins";
import { t } from "../../locales/ui";
import * as ui from "../../ui";
import Logo from "../shared/Logo";
import Crashed from "../shared/Crashed";
import TimeZoneInput from "../shared/timeZone/TimeZoneInput";
import { Icon, IconButton } from "../shared";
const confirm = (message: string) => confirmAction(document, message);
export default function SettingsAdapter() {
  const { toggleSettings, pushLoader, popLoader } = React.useContext(UiContext);
  return (
    <Editor
      db={db}
      cache={cache}
      catalog={catalog}
      t={t}
      ui={ui}
      toggleSettings={toggleSettings}
      pushLoader={pushLoader}
      popLoader={popLoader}
      confirm={confirm}
      Logo={Logo}
      TimeZoneInput={TimeZoneInput}
      Failure={Crashed}
      Icon={Icon}
      IconButton={IconButton}
    />
  );
}
