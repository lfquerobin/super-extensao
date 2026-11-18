/* Super Extensão: compatibility adapter for the own dashboard runtime. */
import React from "react";
import Dashboard from "../../../dashboard/Dashboard";
import { UiContext } from "../../contexts/ui";
import { db, cache } from "../../db/state";
import { getConfig } from "../../plugins";
import Crashed from "../shared/Crashed";
import Overlay from "./Overlay";
const resolve = (key: string) => getConfig(key).dashboardComponent;
export default function DashboardAdapter() {
  const { pushLoader, popLoader } = React.useContext(UiContext);
  return (
    <Dashboard
      db={db}
      cache={cache}
      resolve={resolve}
      pushLoader={pushLoader}
      popLoader={popLoader}
      Overlay={Overlay}
      Failure={Crashed}
    />
  );
}
