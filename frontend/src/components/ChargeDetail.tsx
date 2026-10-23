import { useEffect, useState } from "react";
import type { Charge } from "../types";
import { langDatum, mengeText, uhrzeit } from "../lib/format";

interface Props {
  charge: Charge;
  beiSchliessen: () => void;
  beiErgaenzen: (id: number, felder: Partial<Charge>) => Promise<void>;
}

function Nachtrag({
  platzhalter,
  knopf,
  beiSichern,
}: {
  platzhalter: string;
  knopf: string;
  beiSichern: (wert: string) => Promise<void>;
}) {
  const [wert, setWert] = useState("");
  const [laeuft, setLaeuft] = useState(false);

  return (
    <div className="mt-1.5">
      <input
        value={wert}
        onChange={(e) => setWert(e.target.value)}
        placeholder={platzhalter}
        className="feld w-full text-sm"
      />
      <button
        type="button"
        disabled={!wert.trim() || laeuft}
        onClick={async () => {
          setLaeuft(true);
          try {
            await beiSichern(wert.trim());
          } finally {
            setLaeuft(false);
          }
        }}
        className="knopf-klein mt-1.5 disabled:opacity-40"
      >
        {knopf}
      </button>
    </div>
  );
}

export function ChargeDetail({ charge, beiSchliessen, beiErgaenzen }: Props) {
  useEffect(() => {
    const zu = (e: KeyboardEvent) => e.key === "Escape" && beiSchliessen();
    window.addEventListener("keydown", zu);
    return () => window.removeEventListener("keydown", zu);
  }, [beiSchliessen]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-tinte/45"
      onClick={(e) => e.target === e.currentTarget && beiSchliessen()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Charge ${charge.nummer}`}
        className="max-h-[88vh] w-full max-w-[430px] overflow-y-auto rounded-t-[18px] bg-papier px-4 pb-8 pt-5"
      >
        <div className="mb-1 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold tracking-[-0.02em]">{charge.produkt}</h2>
            <div className="font-mono text-xs text-stempel">{charge.nummer}</div>
          </div>
          <button type="button" onClick={beiSchliessen} aria-label="Schließen" className="px-1 text-2xl leading-none text-weich">
            ×
          </button>
        </div>

        <div className="mt-4 border-l-2 border-linie pl-4">
          <Punkt label="Rohstoff">
            {charge.rohstoff ? (
              <div className="text-[15px]">{charge.rohstoff}</div>
            ) : (
              <>
                <div className="text-[15px] text-offen">Noch nicht angegeben</div>
                <Nachtrag
                  platzhalter="z. B. Morgenmilch von Dienstag"
                  knopf="Rohstoff ergänzen"
                  beiSichern={(wert) => beiErgaenzen(charge.id, { rohstoff: wert })}
                />
              </>
            )}
          </Punkt>

          <Punkt label="Herstellung">
            <div className="text-[15px]">{mengeText(charge.menge, charge.einheit)}</div>
            <div className="text-[13px] text-weich">
              {langDatum(charge.hergestellt_am)} um {uhrzeit(charge.hergestellt_um)} Uhr
            </div>
          </Punkt>

          <Punkt label="Abgabe">
            {charge.abgabe ? (
              <div className="text-[15px]">{charge.abgabe}</div>
            ) : (
              <>
                <div className="text-[15px] text-weich">Noch offen</div>
                <Nachtrag
                  platzhalter="z. B. Hofladen oder Markt Zell"
                  knopf="Abgabe eintragen"
                  beiSichern={(wert) => beiErgaenzen(charge.id, { abgabe: wert })}
                />
              </>
            )}
          </Punkt>
        </div>

        <p className="mt-3.5 text-[12.5px] leading-relaxed text-weich">
          So aufgenommen: „{charge.rohtext}“
        </p>
      </div>
    </div>
  );
}

function Punkt({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="relative pb-4 before:absolute before:-left-[21px] before:top-[5px] before:h-2 before:w-2 before:rounded-full before:bg-stempel before:content-['']">
      <div className="eyebrow">{label}</div>
      {children}
    </div>
  );
}
