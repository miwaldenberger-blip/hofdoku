import type { Charge } from "../types";
import { kurzDatum, mengeText, uhrzeit } from "../lib/format";

export function Zettel({ charge, beiKlick }: { charge: Charge; beiKlick: () => void }) {
  return (
    <button type="button" onClick={beiKlick} className="zettel mt-2.5 block">
      <div className="flex items-baseline justify-between gap-2.5">
        <span className="font-display font-semibold text-base tracking-[-0.01em]">
          {charge.produkt}
        </span>
        <span className="font-mono text-[11.5px] text-stempel whitespace-nowrap">
          {charge.nummer}
        </span>
      </div>

      <div className="mt-0.5 text-[13.5px] text-weich">
        {mengeText(charge.menge, charge.einheit)}
        {charge.rohstoff && ` · aus ${charge.rohstoff}`}
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className="marke bg-stempelhell text-stempel">
          {kurzDatum(charge.hergestellt_am)} {uhrzeit(charge.hergestellt_um)}
        </span>
        {charge.rueckverfolgbar ? (
          <span className="marke bg-guthell text-gut">rückverfolgbar</span>
        ) : (
          <span className="marke bg-offenhell text-offen">Rohstoff fehlt</span>
        )}
      </div>
    </button>
  );
}
