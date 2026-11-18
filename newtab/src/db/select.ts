import { widgets } from "../../engine/settings";
import { db } from "./state";
export const selectWidgets = () => widgets(db);
