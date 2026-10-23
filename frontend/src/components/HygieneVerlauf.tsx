import type { HygieneTag, Pflicht } from "../types";

interface Props {
  pflichten: Pflicht[];
  verlauf: HygieneTag[];
}

export function HygieneVerlauf({ pflichten, verlauf }: Props) {
  return (
    <section className="mt-6">
      <h3 className="mb-2.5 flex items-baseline justify-between font-display text-[15px] font-semibold">
        Letzte {verlauf.length} Tage
        <span className="font-mono text-[11px] font-normal text-weich">Lücken sichtbar</span>
      </h3>

      <div className="karte p-3.5">
        {pflichten.map((pflicht) => (
          <div key={pflicht.id} className="flex items-center gap-2 py-1.5">
            <div className="flex-1 text-[13.5px]">{pflicht.name}</div>
            {verlauf.map((tag) => {
              const eintrag = tag.eintraege.find((e) => e.pflicht_id === pflicht.id);
              const farbe = !eintrag
                ? "bg-offenhell border-linie"
                : eintrag.ausserhalb_grenze
                  ? "bg-offen border-offen"
                  : "bg-gut border-gut";
              return (
                <div
                  key={tag.datum}
                  title={`${pflicht.name} · ${tag.datum}${eintrag ? "" : " · fehlt"}`}
                  className={`h-[15px] w-[15px] rounded border ${farbe}`}
                />
              );
            })}
          </div>
        ))}

        <div className="mt-2 flex gap-2 font-mono text-[10px] text-weich">
          <span className="flex-1" />
          {verlauf.map((tag) => (
            <div key={tag.datum} className="w-[15px] text-center">
              {tag.datum.slice(8)}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3.5 text-[12.5px] leading-relaxed text-weich">
        Jede Lücke ist genau das, was bei einer Kontrolle auffällt. Die App erinnert dich,
        solange etwas fehlt.
      </p>
    </section>
  );
}
