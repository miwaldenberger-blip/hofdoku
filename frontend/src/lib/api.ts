import type {
  Charge,
  HygieneEintrag,
  HygieneTag,
  KontrollStatus,
  Pflicht,
} from "../types";

const BASIS = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const TOKEN = import.meta.env.VITE_BETRIEB_TOKEN ?? "";

export class ApiFehler extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function anfrage<T>(pfad: string, init: RequestInit = {}): Promise<T> {
  let antwort: Response;
  try {
    antwort = await fetch(`${BASIS}${pfad}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
        ...(init.headers ?? {}),
      },
    });
  } catch {
    throw new ApiFehler(0, "Keine Verbindung. Prüf das Netz und versuch es nochmal.");
  }

  if (!antwort.ok) {
    const text = await antwort.text().catch(() => "");
    let nachricht = "Das hat gerade nicht funktioniert.";
    if (antwort.status === 401) nachricht = "Zugang abgelaufen. Bitte neu anmelden.";
    else if (text) {
      try {
        nachricht = JSON.parse(text).detail ?? nachricht;
      } catch {
        /* Klartext ignorieren */
      }
    }
    throw new ApiFehler(antwort.status, nachricht);
  }

  return antwort.status === 204 ? (undefined as T) : ((await antwort.json()) as T);
}

export const api = {
  chargen: {
    liste: () => anfrage<Charge[]>("/api/chargen"),
    anlegen: (text: string) =>
      anfrage<Charge>("/api/chargen", { method: "POST", body: JSON.stringify({ text }) }),
    ergaenzen: (id: number, felder: Partial<Pick<Charge, "rohstoff" | "abgabe" | "produkt">>) =>
      anfrage<Charge>(`/api/chargen/${id}`, { method: "PATCH", body: JSON.stringify(felder) }),
  },
  hygiene: {
    pflichten: () => anfrage<Pflicht[]>("/api/hygiene/pflichten"),
    verlauf: (tage = 7) => anfrage<HygieneTag[]>(`/api/hygiene/tage?tage=${tage}`),
    eintragen: (pflicht_id: number, wert: number | null) =>
      anfrage<HygieneEintrag>("/api/hygiene", {
        method: "POST",
        body: JSON.stringify({ pflicht_id, wert }),
      }),
  },
  kontrolle: {
    status: () => anfrage<KontrollStatus>("/api/kontrolle/status"),
  },
};
