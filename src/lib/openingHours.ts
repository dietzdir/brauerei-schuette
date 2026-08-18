import { db } from "@/lib/firebase/config";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { StoreSettings, OpeningHourException } from "@/types";

export interface PickupSlot {
  dateStr: string; // "YYYY-MM-DD"
  formattedDate: string; // "Freitag, 22.08.2025"
  timeRange: string; // "14:00 – 19:00 Uhr"
  label: string; // "Freitag, 22.08.2025 (14:00 – 19:00 Uhr)"
  isSpecial: boolean;
  note?: string;
  type: "regular" | "special_open" | "altered_hours";
}

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  regularDayOfWeek: 5, // Friday
  regularOpenTime: "14:00",
  regularCloseTime: "19:00",
  exceptions: [],
  bannerNotice: "",
  bannerLookaheadDays: 14,
};

const SETTINGS_DOC_PATH = "storeSettings";
const SETTINGS_DOC_ID = "openingHours";

export function getSettingsDocRef() {
  return doc(db, SETTINGS_DOC_PATH, SETTINGS_DOC_ID);
}

export async function fetchStoreSettings(): Promise<StoreSettings> {
  try {
    const snap = await getDoc(getSettingsDocRef());
    if (snap.exists()) {
      const data = snap.data() as StoreSettings;
      return {
        ...DEFAULT_STORE_SETTINGS,
        ...data,
        exceptions: data.exceptions || [],
      };
    }
  } catch (err) {
    console.warn("Could not fetch store settings:", err);
  }
  return DEFAULT_STORE_SETTINGS;
}

export function subscribeStoreSettings(
  callback: (settings: StoreSettings) => void
): () => void {
  return onSnapshot(
    getSettingsDocRef(),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as StoreSettings;
        callback({
          ...DEFAULT_STORE_SETTINGS,
          ...data,
          exceptions: data.exceptions || [],
        });
      } else {
        callback(DEFAULT_STORE_SETTINGS);
      }
    },
    (err) => {
      console.warn("Store settings subscription error:", err);
      callback(DEFAULT_STORE_SETTINGS);
    }
  );
}

export async function saveStoreSettings(settings: StoreSettings): Promise<void> {
  await setDoc(getSettingsDocRef(), settings, { merge: true });
}

export const GERMAN_WEEKDAYS = [
  "Sonntag",
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
];

export const GERMAN_WEEKDAYS_PLURAL = [
  "sonntags",
  "montags",
  "dienstags",
  "mittwochs",
  "donnerstags",
  "freitags",
  "samstags",
];

export function getWeekdayPlural(dayOfWeek: number = 5): string {
  return GERMAN_WEEKDAYS_PLURAL[dayOfWeek] || "freitags";
}

function formatDateGerman(date: Date): string {
  const dayName = GERMAN_WEEKDAYS[date.getDay()];
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${dayName}, ${day}.${month}.${year}`;
}

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Calculates the next N available pickup slots based on regular hours and exceptions.
 */
export function calculatePickupSlots(
  settings: StoreSettings = DEFAULT_STORE_SETTINGS,
  slotCount: number = 6,
  fromDate: Date = new Date()
): PickupSlot[] {
  const exceptionsMap = new Map<string, OpeningHourException>();
  (settings.exceptions || []).forEach((ex) => {
    exceptionsMap.set(ex.date, ex);
  });

  const slots: PickupSlot[] = [];
  const current = new Date(fromDate);
  
  // We will check up to 60 days ahead to find slotCount available slots
  for (let i = 0; i < 60 && slots.length < slotCount; i++) {
    const checkDate = new Date(current);
    checkDate.setDate(current.getDate() + i);
    checkDate.setHours(0, 0, 0, 0);

    const iso = toISODate(checkDate);
    const dayOfWeek = checkDate.getDay();
    const exception = exceptionsMap.get(iso);

    const regularDay = settings.regularDayOfWeek ?? 5;
    const defaultOpen = settings.regularOpenTime || "14:00";
    const defaultClose = settings.regularCloseTime || "19:00";

    if (exception) {
      if (exception.type === "closed") {
        // Explicitly closed -> skip
        continue;
      }

      if (exception.type === "special_open") {
        const openTime = exception.openTime || defaultOpen;
        const closeTime = exception.closeTime || defaultClose;
        const timeRange = `${openTime} – ${closeTime} Uhr`;
        const formattedDate = formatDateGerman(checkDate);
        const noteText = exception.note ? ` (${exception.note})` : " (Sonderöffnung)";

        slots.push({
          dateStr: iso,
          formattedDate,
          timeRange,
          label: `${formattedDate} • ${timeRange}${noteText}`,
          isSpecial: true,
          note: exception.note,
          type: "special_open",
        });
        continue;
      }

      if (exception.type === "altered_hours") {
        const openTime = exception.openTime || defaultOpen;
        const closeTime = exception.closeTime || defaultClose;
        const timeRange = `${openTime} – ${closeTime} Uhr`;
        const formattedDate = formatDateGerman(checkDate);
        const noteText = exception.note ? ` (${exception.note})` : " (Geänderte Öffnungszeit)";

        slots.push({
          dateStr: iso,
          formattedDate,
          timeRange,
          label: `${formattedDate} • ${timeRange}${noteText}`,
          isSpecial: true,
          note: exception.note,
          type: "altered_hours",
        });
        continue;
      }
    } else {
      // Regular schedule
      if (dayOfWeek === regularDay) {
        const timeRange = `${defaultOpen} – ${defaultClose} Uhr`;
        const formattedDate = formatDateGerman(checkDate);

        slots.push({
          dateStr: iso,
          formattedDate,
          timeRange,
          label: `${formattedDate} • ${timeRange}`,
          isSpecial: false,
          type: "regular",
        });
      }
    }
  }

  return slots;
}
