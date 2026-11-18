import type { Browser } from "webextension-polyfill";

declare global {
  const GIPHY_API_KEY: string;
  const UNSPLASH_API_KEY: string;

  const browser: Browser;
}
