/**
 * Stockage de l'espace client sur l'appareil (localStorage), en attendant de vrais comptes.
 * Lecture via useSyncExternalStore : l'instantané est mis en cache par valeur brute
 * pour rester stable entre deux rendus.
 */
import { EMPTY_ACCOUNT, parseAccount, type AccountData } from "./schema";

const STORAGE_KEY = "em_account";
const EVENT = "em:account-change";

let cachedRaw: string | null | undefined;
let cachedData: AccountData = EMPTY_ACCOUNT;

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null; // stockage indisponible (navigation privée stricte)
  }
}

export function getAccountSnapshot(): AccountData {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedData = parseAccount(raw);
  }
  return cachedData;
}

export function getAccountServerSnapshot(): AccountData {
  return EMPTY_ACCOUNT;
}

export function subscribeToAccount(callback: () => void): () => void {
  const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && callback();
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

/** Enregistre (renvoie false si le navigateur refuse le stockage). */
export function saveAccount(data: AccountData): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event(EVENT));
    return true;
  } catch {
    return false;
  }
}

/** Droit à l'effacement : supprime toutes les données de l'appareil. */
export function clearAccount(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* rien à effacer */
  }
  window.dispatchEvent(new Event(EVENT));
}
