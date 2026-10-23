"""Formlose Notiz -> strukturierte Chargendaten.

Erst das Sprachmodell, bei Ausfall eine regelbasierte Erkennung. Die App muss
auch dann funktionieren, wenn am Hof das Netz weg ist oder die API klemmt.
"""

from __future__ import annotations

import json
import logging
import re

from pydantic import BaseModel

from app.config import settings

log = logging.getLogger(__name__)

EINHEITEN = r"Gl(?:as|äser)|Laib(?:e)?|kg|Kilo(?:gramm)?|St(?:ü|ue)ck|Liter|l|g|Packung(?:en)?"

PROMPT = """Du wandelst formlose Notizen aus einer österreichischen Hofverarbeitung \
in strukturierte Chargendaten um.

Notiz: "{text}"

Antworte ausschließlich mit JSON, ohne Markdown und ohne Erklärung:
{{"produkt": "...", "menge": Zahl oder null, "einheit": "Glas|Laib|kg|Stück|Liter" oder null, \
"rohstoff": "..." oder null, "notiz": "..." oder null}}

Regeln:
- produkt ist der Produktname in Normalform, z. B. "Erdbeermarmelade", "Bergkäse", "Hauswürstel".
- rohstoff ist der genannte Ausgangsstoff, z. B. "Morgenmilch von Dienstag", "Schwein Nr. 4". \
Wenn keiner genannt wird: null.
- Wenn keine Menge genannt wird: menge und einheit null.
- notiz nur bei Zusatzinfos wie Reifedauer oder Auffälligkeiten, sonst null.
- Erfinde nichts, was nicht in der Notiz steht."""


class Erkannt(BaseModel):
    produkt: str
    menge: float | None = None
    einheit: str | None = None
    rohstoff: str | None = None
    notiz: str | None = None
    quelle: str = "modell"


def _regelbasiert(text: str) -> Erkannt:
    treffer = re.search(rf"(\d+[.,]?\d*)\s*({EINHEITEN})\b", text, re.IGNORECASE)
    rest = text.replace(treffer.group(0), " ") if treffer else text

    teile = re.split(r"\baus\b", rest, maxsplit=1, flags=re.IGNORECASE)
    produkt = teile[0]
    rohstoff = teile[1].strip(" .,") if len(teile) > 1 else None

    produkt = re.sub(
        r"^\s*(heute|jetzt|gerade|hab(?:e)?|ich hab(?:e)?|wir haben)\s+", "", produkt, flags=re.IGNORECASE
    )
    produkt = re.sub(
        r"\s+(gemacht|produziert|abgef(?:ü|ue)llt|eingelegt|hergestellt)\s*[.!]?\s*$",
        "",
        produkt,
        flags=re.IGNORECASE,
    )
    produkt = re.sub(r"\s+", " ", produkt).strip(" .,") or "Unbenanntes Produkt"

    return Erkannt(
        produkt=produkt,
        menge=float(treffer.group(1).replace(",", ".")) if treffer else None,
        einheit=treffer.group(2) if treffer else None,
        rohstoff=rohstoff or None,
        quelle="regel",
    )


def erkenne(text: str) -> Erkannt:
    if not settings.anthropic_api_key:
        return _regelbasiert(text)

    try:
        from anthropic import Anthropic

        client = Anthropic(api_key=settings.anthropic_api_key)
        antwort = client.messages.create(
            model=settings.anthropic_model,
            max_tokens=400,
            messages=[{"role": "user", "content": PROMPT.format(text=text)}],
        )
        roh = "".join(b.text for b in antwort.content if b.type == "text")
        roh = roh.replace("```json", "").replace("```", "").strip()
        daten = json.loads(roh)

        produkt = (daten.get("produkt") or "").strip()
        if not produkt:
            raise ValueError("kein Produkt erkannt")

        return Erkannt(
            produkt=produkt,
            menge=daten.get("menge"),
            einheit=(daten.get("einheit") or None),
            rohstoff=(daten.get("rohstoff") or None),
            notiz=(daten.get("notiz") or None),
        )
    except Exception:
        log.warning("Modell-Erkennung fehlgeschlagen, nutze Regelpfad", exc_info=True)
        return _regelbasiert(text)
