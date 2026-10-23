import { useState } from "react";
import type { HygieneEintrag, Pflicht } from "../types";
import { uhrzeit } from "../lib/format";

interface Props {
  pflicht: Pflicht;
  eintrag?: HygieneEintrag;
  beiEintragen: (pflichtId: number, wert: number | null) => Promise<void>;
}

export function PflichtZeile({ pflicht, eintrag, beiEintragen }: Props) {
  const [wert, setWert] = useState("");
  const [laeuft, setLaeuft] = useState(false);

  if (eintrag) {
    return (
      <div className="mb-2 flex items-center gap-3 rounded-karte border border-dashed border-linie px-3.5 py-3">
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-medium">{pflicht.name}</div>
          <div className="text-[12.5px] text-weich">
            {eintrag.wert !== null && `${eintrag.wert} ${pflicht.einheit ?? ""} · `}
            {uhrzeit(eintrag.zeit)} Uhr
            {eintrag.ausserhalb_grenze && " · außerhalb Grenzwert"}
          </div>
        </div>
        <span className={`font-mono text-xs ${eintrag.ausserhalb_grenze ? "text-offen" : "text-gut"}`}>
          {eintrag.ausserhalb_grenze ? "!" : "✓"}
        </span>
      </div>
    );
  }

  async function sichern() {
    if (pflicht.einheit && !wert.trim()) return;
    setLaeuft(true);
    try {
      await beiEintragen(pflicht.id, pflicht.einheit ? Number(wert.replace(",", ".")) : null);
      setWert("");
    } finally {
      setLaeuft(false);
    }
  }

  return (
    <div className="karte mb-2 flex items-center gap-3 px-3.5 py-3">
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-medium">{pflicht.name}</div>
        <div className="text-[12.5px] text-weich">{pflicht.beschreibung}</div>
      </div>

      {pflicht.einheit && (
        <input
          type="number"
          inputMode="decimal"
          value={wert}
          onChange={(e) => setWert(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sichern()}
          placeholder={pflicht.einheit}
          aria-label={`${pflicht.name} in ${pflicht.einheit}`}
          className="feld w-[74px] py-2 text-center text-sm"
        />
      )}

      <button type="button" onClick={sichern} disabled={laeuft} className="knopf-klein">
        {pflicht.einheit ? "Sichern" : "Erledigt"}
      </button>
    </div>
  );
}
