import type { KontrollStatus } from "../types";

export function Kontrollordner({ status }: { status: KontrollStatus }) {
  const vollstaendig = status.vollstaendig;

  return (
    <section className="karte relative overflow-hidden px-4.5 py-5 px-[18px]">
      <div
        aria-hidden
        className={`absolute right-3.5 top-3.5 flex h-14 w-[88px] -rotate-[11deg] flex-col
          items-center justify-center rounded-[50%] border-[2.5px] opacity-90
          ${vollstaendig ? "border-stempel" : "border-offen"}`}
      >
        <div className={`font-mono text-[8px] tracking-[0.12em] ${vollstaendig ? "text-stempel" : "text-offen"}`}>
          EIGENKONTROLLE
        </div>
        <div className={`font-display text-[13px] font-bold leading-none ${vollstaendig ? "text-stempel" : "text-offen"}`}>
          {vollstaendig ? "VOLLSTÄNDIG" : "LÜCKEN"}
        </div>
      </div>

      <h2 className="max-w-[200px] font-display text-[22px] font-bold tracking-[-0.02em]">
        Kontroll&shy;ordner
      </h2>
      <div className="font-mono text-xs uppercase text-weich">
        Stand {new Date(status.stand).toLocaleDateString("de-AT")}
      </div>

      <div className="mt-4 border-t border-linie pt-3.5">
        {status.punkte.map((punkt) => (
          <div key={punkt.schluessel} className="flex items-center gap-2.5 py-1.5 text-[14.5px]">
            <span className={`w-[18px] shrink-0 font-mono text-[13px] ${punkt.erfuellt ? "text-gut" : "text-offen"}`}>
              {punkt.erfuellt ? "✓" : "○"}
            </span>
            <span>{punkt.titel}</span>
            <span className="ml-auto font-mono text-[12.5px] text-weich">{punkt.detail}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
