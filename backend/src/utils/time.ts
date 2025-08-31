// backend/src/utils/time.ts
import { DateTime } from "luxon";

/**
 * Utilities:
 * - Use UTC for DB storage
 * - Convert local (provider/patient) times -> UTC and back
 */

export const parseLocalTimeToUTC = (dateIso: string, timeHHmm: string, tz: string) => {
  // dateIso e.g. '2025-09-01' timeHHmm '08:30'
  const [hh, mm] = timeHHmm.split(":").map(Number);
  const dt = DateTime.fromISO(dateIso, { zone: tz }).set({ hour: hh, minute: mm, second: 0, millisecond: 0 });
  return dt.toUTC().toJSDate();
};

export const toProviderLocal = (utcDate: Date, providerTz: string) => {
  return DateTime.fromJSDate(utcDate, { zone: "utc" }).setZone(providerTz);
};

export const dateToISODate = (dt: DateTime) => dt.toISODate();

// Round up/down helper
export const roundToNearestMinutes = (dt: DateTime, minutes = 5, ceil = false) => {
  const remainder = dt.minute % minutes;
  if (remainder === 0) return dt.startOf("minute");
  if (ceil) {
    return dt.plus({ minutes: minutes - remainder }).startOf("minute");
  } else {
    return dt.minus({ minutes: remainder }).startOf("minute");
  }
};
