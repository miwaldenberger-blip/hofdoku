import { useCallback, useEffect, useRef, useState } from "react";

/** Diktat über die Spracherkennung des Browsers (Chrome/Edge, auch mobil). */
export function useSpracheingabe(beiText: (text: string) => void) {
  const [hoert, setHoert] = useState(false);
  const [verfuegbar, setVerfuegbar] = useState(false);
  const [fehler, setFehler] = useState<string | null>(null);
  const erkennung = useRef<any>(null);
  const callback = useRef(beiText);
  callback.current = beiText;

  useEffect(() => {
    const SR =
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) return;

    setVerfuegbar(true);
    const sr = new SR();
    sr.lang = "de-AT";
    sr.interimResults = true;
    sr.continuous = false;

    sr.onstart = () => {
      setHoert(true);
      setFehler(null);
    };
    sr.onresult = (e: any) => {
      let text = "";
      for (const ergebnis of e.results) text += ergebnis[0].transcript;
      callback.current(text);
    };
    sr.onerror = (e: any) => {
      setFehler(
        e.error === "not-allowed"
          ? "Mikrofon ist nicht freigegeben. Tipp es einfach ein."
          : "Spracheingabe hat nicht geklappt. Tipp es einfach ein.",
      );
    };
    sr.onend = () => setHoert(false);

    erkennung.current = sr;
    return () => {
      sr.onresult = null;
      sr.onend = null;
      try {
        sr.abort();
      } catch {
        /* bereits beendet */
      }
    };
  }, []);

  const umschalten = useCallback(() => {
    const sr = erkennung.current;
    if (!sr) {
      setFehler("Spracheingabe geht in diesem Browser nicht. Tipp es einfach ein.");
      return;
    }
    if (hoert) sr.stop();
    else sr.start();
  }, [hoert]);

  return { hoert, verfuegbar, fehler, umschalten };
}
