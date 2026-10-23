export const heute = () => new Date().toISOString().slice(0, 10);

export const kurzDatum = (iso: string) =>
  new Date(iso).toLocaleDateString("de-AT", { day: "2-digit", month: "2-digit" });

export const langDatum = (iso: string) =>
  new Date(iso).toLocaleDateString("de-AT", { weekday: "long", day: "2-digit", month: "long" });

export const uhrzeit = (zeit: string) => zeit.slice(0, 5);

export const mengeText = (menge: number | null, einheit: string | null) => {
  if (menge === null) return "Menge offen";
  const zahl = Number.isInteger(menge) ? menge : menge.toFixed(1).replace(".", ",");
  return einheit ? `${zahl} ${einheit}` : String(zahl);
};
