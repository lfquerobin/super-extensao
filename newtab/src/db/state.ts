import { DB, Storage } from "../lib";
import { defaultLocale } from "../locales";

import { defaults, State } from "../../engine/model";
export * from "../../engine/model";
const initData = defaults(defaultLocale);

// Database storage
export const db = DB.init<State>(initData);

// Cache storage
export const cache = DB.init<Record<string, unknown | undefined>>();

// Keep the existing keys so an update opens the same layout and local images.
export const dbStorage = Storage.extension(db, "tabliss/config", "sync");
export const cacheStorage = Storage.indexeddb(cache, "tabliss/cache");
