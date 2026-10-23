import { useState } from "react";
import { useSpracheingabe } from "../hooks/useSpracheingabe";
import type { Charge } from "../types";

const BEISPIELE = [
  { kurz: "30 Glas Marmelade", lang: "30 Glas Erdbeermarmelade" },
  { kurz: "Bergkäse 40 Laibe", lang: "Bergkäse 40 Laibe aus der Morgenmilch" },
  { kurz: "12 kg Hauswürstel", lang: "12 kg Hauswürstel gemacht" },
];

interface Props {
  beiAnlegen: (text: string) => Promise<Charge>;
}

export function ErfassenKarte({ beiAnlegen }: Props) {
  const [text, setText] = useState("");
  const [laeuft, setLaeuft] = useState(false);
  const [meldung, setMeldung] = useState<{ art: "gut" | "fehler"; text: string } | null>(null);
  const sprache = useSpracheingabe(setText);

  async function absenden() {
    const eingabe = text.trim();
    if (!eingabe) return;

    setLaeuft(true);
    setMeldung(null);
    try {
      const charge = await beiAnlegen(eingabe);
      setText("");
      setMeldung({
        art: "gut",
        text: charge.rueckverfolgbar
          ? `Angelegt: ${charge.produkt} · ${charge.nummer}`
          : `Angelegt: ${charge.nummer} – Rohstoff fehlt noch, tipp den Zettel an.`,
      });
    } catch (fehler) {
      setMeldung({ art: "fehler", text: (fehler as Error).message });
    } finally {
      setLaeuft(false);
    }
  }

  return (
    <section className="karte mt-3.5 p-4">
      <p className="eyebrow mb-2">Erfassen</p>
      <h2 className="font-display text-[19px] font-semibold tracking-[-0.015em]">
        Was hast du gemacht?
      </h2>
      <p className="mt-1 mb-3.5 text-sm text-weich">
        Einfach sprechen oder tippen – so, wie du es sagen würdest.
      </p>

      <div className="flex gap-2.5">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="z. B. 30 Glas Erdbeermarmelade aus der Ernte von gestern"
          rows={3}
          className="feld flex-1 resize-none text-[15px]"
        />
        <button
          type="button"
          onClick={sprache.umschalten}
          aria-pressed={sprache.hoert}
          aria-label={sprache.hoert ? "Aufnahme beenden" : "Sprechen"}
          className={`w-[74px] shrink-0 rounded-[11px] border border-stempel flex flex-col
            items-center justify-center gap-1 text-[11px] font-semibold transition-colors
            ${sprache.hoert ? "bg-stempelhell text-stempel animate-pulse" : "bg-stempel text-white"}`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-[22px] h-[22px]">
            <rect x="9" y="3" width="6" height="11" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0" />
            <path d="M12 18v3" />
          </svg>
          {sprache.hoert ? "Hört zu" : "Sagen"}
        </button>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {BEISPIELE.map((b) => (
          <button
            key={b.kurz}
            type="button"
            onClick={() => setText(b.lang)}
            className="rounded-full border border-dashed border-linie px-2.5 py-1
                       text-[12.5px] text-weich hover:border-stempel hover:text-stempel"
          >
            {b.kurz}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={absenden}
        disabled={!text.trim() || laeuft}
        className="knopf-haupt mt-3"
      >
        {laeuft ? "Wird eingetragen …" : "Charge anlegen"}
      </button>

      <p
        role="status"
        className={`mt-2.5 min-h-[18px] text-[13px] ${
          meldung?.art === "fehler" ? "text-offen" : "text-weich"
        }`}
      >
        {sprache.fehler ?? meldung?.text ?? ""}
      </p>
    </section>
  );
}
