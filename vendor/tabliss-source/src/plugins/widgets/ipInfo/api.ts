import { API } from "../../types";

import { IpData } from "./types";
import { t } from "../../../locales/ui";

export async function getIpInfo(loader: API["loader"]): Promise<IpData> {
  loader.push();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch("https://ipwho.is/", {
      credentials: "omit", redirect: "error", cache: "no-store", signal: controller.signal,
    });
    if (!response.ok) throw new Error();
    const data = await response.json();
    if (data?.success !== true || typeof data.ip !== "string" || !data.ip.trim()) throw new Error();
    return {
      ip: data.ip,
      city: typeof data.city === "string" ? data.city : "",
      country: typeof data.country === "string" ? data.country : "",
      timestamp: Date.now(),
    };
  } catch {
    throw new Error(t("Unable to update IP information. Check your connection and try again later."));
  } finally {
    clearTimeout(timer);
    loader.pop();
  }
}
