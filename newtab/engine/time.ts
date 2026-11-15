/* SPDX-License-Identifier: GPL-3.0-only */
export function validTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || !value || value.length > 128) return false;
  // date-fns-tz also accepts fixed offsets, including older exported settings.
  if (/^[+-](?:[01]\d|2[0-3])(?::?[0-5]\d)?$/.test(value)) return true;
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format(0);
    return true;
  } catch { return false; }
}

/** A damaged stored setting must not prevent opening the editor to repair it. */
export function zonedTime(
  absolute: Date,
  zone: unknown,
  convert: (date: Date, zone: string) => Date,
): Date {
  if (!validTimeZone(zone)) return absolute;
  try {
    const result = convert(absolute, zone);
    return Number.isFinite(result.getTime()) ? result : absolute;
  } catch { return absolute; }
}
