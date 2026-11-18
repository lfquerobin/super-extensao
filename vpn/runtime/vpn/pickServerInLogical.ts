import type { Logical } from "./Logical";
import { pickEndpoint } from "../../engine/selection";
export const pickServerInLogical = (logical: Logical | undefined) =>
	pickEndpoint(logical?.Servers || []);
