/* Super Extensão: compatibility facade for the own catalog. */
import { createCatalog } from "../../../../newtab/engine/catalog";
import { t } from "../locales/ui";
import { bindings } from "./bindings";
export const catalog = createCatalog(bindings, t, BUILD_TARGET);
export const getConfig = catalog.get;
export const backgroundConfigs = catalog.list("background");
export const widgetConfigs = catalog.list("widget");
