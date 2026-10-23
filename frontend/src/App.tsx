import { useCallback, useEffect, useMemo, useState } from "react";
import { ChargeDetail } from "./components/ChargeDetail";
import { ErfassenKarte } from "./components/ErfassenKarte";
import { HygieneVerlauf } from "./components/HygieneVerlauf";
import { Kontrollordner } from "./components/Kontrollordner";
import { PflichtZeile } from "./components/PflichtZeile";
import { Reiterleiste } from "./components/Reiterleiste";
import { Zettel } from "./components/Zettel";
import { api } from "./lib/api";
import { heute, langDatum } from "./lib/format";
import type { Charge, HygieneTag, KontrollStatus, Pflicht, Reiter } from "./types";

const BETRIEB = "Hofladen Pichler";

export default function App() {
  const [reiter, setReiter] = useState<Reiter>("heute");
  const [chargen, setChargen] = useState<Charge[]>([]);
  const [pflichten, setPflichten] = useState<Pflicht[]>([]);
  const [verlauf, setVerlauf] = useState<HygieneTag[]>([]);
  const [status, setStatus] = useState<KontrollStatus | null>(null);
  const [gewaehlt, setGewaehlt] = useState<Charge | null>(null);
  const [ladefehler, setLadefehler] = useState<string | null>(null);
  const [laedt, setLaedt] = useState(true);

  const laden = useCallback(async () => {
    try {
      const [c, p, v, s] = await Promise.all([
        api.chargen.liste(),
        api.hygiene.pflichten(),
        api.hygiene.verlauf(7),
        api.kontrolle.status(),
      ]);
      setChargen(c);
      setPflichten(p);
      setVerlauf(v);
      setStatus(s);
      setLadefehler(null);
    } catch (fehler) {
      setLadefehler((fehler as Error).message);
    } finally {
      setLaedt(false);
    }
  }, []);

  useEffect(() => {
    void laden();
  }, [laden]);

  const heutigerTag = verlauf.find((t) => t.datum === heute());
  const offenePflichten = useMemo(
    () => pflichten.filter((p) => heutigerTag?.offen.includes(p.id) ?? true),
    [pflichten, heutigerTag],
  );
  const chargenHeute = chargen.filter((c) => c.hergestellt_am === heute()).length;

  async function chargeAnlegen(text: string) {
    const neu = await api.chargen.anlegen(text);
    setChargen((alt) => [neu, ...alt]);
    void api.kontrolle.status().then(setStatus);
    return neu;
  }

  async function chargeErgaenzen(id: number, felder: Partial<Charge>) {
    const aktualisiert = await api.chargen.ergaenzen(id, felder);
    setChargen((alt) => alt.map((c) => (c.id === id ? aktualisiert : c)));
    setGewaehlt(aktualisiert);
    void api.kontrolle.status().then(setStatus);
  }

  async function hygieneEintragen(pflichtId: number, wert: number | null) {
    await api.hygiene.eintragen(pflichtId, wert);
    const [v, s] = await Promise.all([api.hygiene.verlauf(7), api.kontrolle.status()]);
    setVerlauf(v);
    setStatus(s);
  }

  return (
    <div className="mx-auto max-w-[430px] px-4 pb-24">
      <header className="pb-2.5 pt-4">
        <div className="flex items-end justify-between gap-3">
          <h1 className="font-display text-xl font-bold tracking-[-0.02em]">{BETRIEB}</h1>
          <span className="font-mono text-xs uppercase tracking-wider text-weich">
            {new Date().toLocaleDateString("de-AT", { weekday: "short", day: "2-digit", month: "2-digit" })}
          </span>
        </div>

        <div className="karte mt-3 px-3.5 py-2.5 text-sm text-weich">
          {laedt ? (
            "Wird geladen …"
          ) : ladefehler ? (
            <span className="text-offen">{ladefehler}</span>
          ) : offenePflichten.length === 0 ? (
            <>
              <b className="font-semibold text-tinte">{chargenHeute} Chargen</b> erfasst · Hygiene
              für heute vollständig
            </>
          ) : (
            <>
              <b className="font-semibold text-tinte">{chargenHeute} Chargen</b> erfasst ·{" "}
              <b className="font-semibold text-tinte">
                {offenePflichten.length} Hygiene-Eintrag{offenePflichten.length > 1 ? "e" : ""}
              </b>{" "}
              fehlen noch
            </>
          )}
        </div>
      </header>

      <main>
        {reiter === "heute" && (
          <>
            <ErfassenKarte beiAnlegen={chargeAnlegen} />

            <section className="mt-6">
              <h3 className="mb-2.5 flex items-baseline justify-between font-display text-[15px] font-semibold">
                Heute noch offen
                <span className="font-mono text-[11px] font-normal text-weich">
                  {offenePflichten.length}/{pflichten.length}
                </span>
              </h3>
              {offenePflichten.length === 0 && pflichten.length > 0 ? (
                <div className="flex items-center gap-3 rounded-karte border border-dashed border-linie px-3.5 py-3">
                  <div className="flex-1">
                    <div className="text-[15px] font-medium">Alles erledigt</div>
                    <div className="text-[12.5px] text-weich">Hygienedoku für heute ist vollständig</div>
                  </div>
                  <span className="font-mono text-xs text-gut">✓</span>
                </div>
              ) : (
                offenePflichten.map((p) => (
                  <PflichtZeile key={p.id} pflicht={p} beiEintragen={hygieneEintragen} />
                ))
              )}
            </section>

            <section className="mt-6">
              <h3 className="mb-2.5 font-display text-[15px] font-semibold">Zuletzt erfasst</h3>
              {chargen.length === 0 ? (
                <Leer text="Noch nichts erfasst. Sag oben, was du gemacht hast." />
              ) : (
                chargen.slice(0, 3).map((c) => (
                  <Zettel key={c.id} charge={c} beiKlick={() => setGewaehlt(c)} />
                ))
              )}
            </section>
          </>
        )}

        {reiter === "chargen" && (
          chargen.length === 0 ? (
            <Leer text="Noch keine Chargen erfasst." />
          ) : (
            Object.entries(
              chargen.reduce<Record<string, Charge[]>>((gruppen, c) => {
                (gruppen[c.hergestellt_am] ??= []).push(c);
                return gruppen;
              }, {}),
            ).map(([tag, liste]) => (
              <section key={tag} className="mt-6">
                <h3 className="mb-2.5 flex items-baseline justify-between font-display text-[15px] font-semibold">
                  {langDatum(tag)}
                  <span className="font-mono text-[11px] font-normal text-weich">
                    {liste.length} Chargen
                  </span>
                </h3>
                {liste.map((c) => (
                  <Zettel key={c.id} charge={c} beiKlick={() => setGewaehlt(c)} />
                ))}
              </section>
            ))
          )
        )}

        {reiter === "hygiene" && (
          <>
            <section className="mt-6">
              <h3 className="mb-2.5 font-display text-[15px] font-semibold">Heute eintragen</h3>
              {pflichten.map((p) => (
                <PflichtZeile
                  key={p.id}
                  pflicht={p}
                  eintrag={heutigerTag?.eintraege.find((e) => e.pflicht_id === p.id)}
                  beiEintragen={hygieneEintragen}
                />
              ))}
            </section>
            {verlauf.length > 0 && <HygieneVerlauf pflichten={pflichten} verlauf={verlauf} />}
          </>
        )}

        {reiter === "kontrolle" && status && (
          <div className="mt-3.5">
            <Kontrollordner status={status} />
            <section className="mt-6">
              <h3 className="mb-2.5 font-display text-[15px] font-semibold">
                Was der Kontrolle vorliegt
              </h3>
              {chargen.length === 0 ? (
                <Leer text="Sobald du Chargen erfasst, liegen sie hier prüffertig auf." />
              ) : (
                chargen.slice(0, 6).map((c) => (
                  <Zettel key={c.id} charge={c} beiKlick={() => setGewaehlt(c)} />
                ))
              )}
              {status.chargen_ohne_rohstoff > 0 && (
                <p className="mt-3.5 text-[12.5px] leading-relaxed text-weich">
                  <b>{status.chargen_ohne_rohstoff} Chargen</b> ohne Rohstoffangabe – tipp die
                  Charge an und ergänze, woraus sie gemacht wurde. Erst dann ist die Kette lückenlos.
                </p>
              )}
            </section>
          </div>
        )}
      </main>

      {gewaehlt && (
        <ChargeDetail
          charge={gewaehlt}
          beiSchliessen={() => setGewaehlt(null)}
          beiErgaenzen={chargeErgaenzen}
        />
      )}

      <Reiterleiste aktiv={reiter} beiWechsel={setReiter} offeneHinweise={offenePflichten.length} />
    </div>
  );
}

function Leer({ text }: { text: string }) {
  return (
    <div className="rounded-karte border border-dashed border-linie px-5 py-6 text-center text-sm text-weich">
      {text}
    </div>
  );
}
