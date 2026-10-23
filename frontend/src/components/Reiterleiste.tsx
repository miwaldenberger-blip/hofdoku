import type { Reiter } from "../types";

const REITER: { id: Reiter; text: string; pfad: React.ReactNode }[] = [
  { id: "heute", text: "Heute", pfad: <><path d="M3 12l9-8 9 8" /><path d="M5 10v10h14V10" /></> },
  { id: "chargen", text: "Chargen", pfad: <path d="M4 7h16M4 12h16M4 17h10" /> },
  { id: "hygiene", text: "Hygiene", pfad: <><path d="M12 3v11" /><circle cx="12" cy="18" r="3" /><path d="M9 6h6" /></> },
  { id: "kontrolle", text: "Kontrolle", pfad: <><path d="M4 5h7l2 2h7v12H4z" /><path d="M9 13l2 2 4-4" /></> },
];

interface Props {
  aktiv: Reiter;
  beiWechsel: (reiter: Reiter) => void;
  offeneHinweise: number;
}

export function Reiterleiste({ aktiv, beiWechsel, offeneHinweise }: Props) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-linie bg-blatt pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid max-w-[430px] grid-cols-4" role="tablist">
        {REITER.map((r) => (
          <button
            key={r.id}
            role="tab"
            aria-selected={aktiv === r.id}
            onClick={() => beiWechsel(r.id)}
            className={`relative flex flex-col items-center gap-1 px-1 pb-3 pt-2.5 text-[11.5px]
              ${aktiv === r.id ? "font-semibold text-stempel" : "text-weich"}`}
          >
            {r.id === "hygiene" && offeneHinweise > 0 && (
              <span className="absolute right-[26%] top-2 h-[7px] w-[7px] rounded-full bg-offen" />
            )}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-[21px] w-[21px]">
              {r.pfad}
            </svg>
            {r.text}
          </button>
        ))}
      </div>
    </nav>
  );
}
