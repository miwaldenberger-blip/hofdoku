export interface Charge {
  id: number;
  nummer: string;
  produkt: string;
  menge: number | null;
  einheit: string | null;
  rohstoff: string | null;
  notiz: string | null;
  rohtext: string;
  hergestellt_am: string;
  hergestellt_um: string;
  abgabe: string | null;
  rueckverfolgbar: boolean;
}

export interface Pflicht {
  id: number;
  schluessel: string;
  name: string;
  beschreibung: string;
  einheit: string | null;
  grenze_min: number | null;
  grenze_max: number | null;
}

export interface HygieneEintrag {
  id: number;
  pflicht_id: number;
  wert: number | null;
  datum: string;
  zeit: string;
  ausserhalb_grenze: boolean;
}

export interface HygieneTag {
  datum: string;
  eintraege: HygieneEintrag[];
  offen: number[];
}

export interface Pruefpunkt {
  schluessel: string;
  titel: string;
  erfuellt: boolean;
  detail: string;
}

export interface KontrollStatus {
  stand: string;
  vollstaendig: boolean;
  punkte: Pruefpunkt[];
  chargen_gesamt: number;
  chargen_ohne_rohstoff: number;
}

export type Reiter = "heute" | "chargen" | "hygiene" | "kontrolle";
