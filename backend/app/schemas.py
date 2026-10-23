from datetime import date, time

from pydantic import BaseModel, Field


class ChargeAnlegen(BaseModel):
    text: str = Field(min_length=2, max_length=1000)


class ChargeKorrektur(BaseModel):
    produkt: str | None = None
    menge: float | None = None
    einheit: str | None = None
    rohstoff: str | None = None
    abgabe: str | None = None
    notiz: str | None = None


class ChargeAus(BaseModel):
    id: int
    nummer: str
    produkt: str
    menge: float | None
    einheit: str | None
    rohstoff: str | None
    notiz: str | None
    rohtext: str
    hergestellt_am: date
    hergestellt_um: time
    abgabe: str | None
    rueckverfolgbar: bool


class PflichtAus(BaseModel):
    id: int
    schluessel: str
    name: str
    beschreibung: str
    einheit: str | None
    grenze_min: float | None
    grenze_max: float | None


class HygieneAnlegen(BaseModel):
    pflicht_id: int
    wert: float | None = None
    datum: date | None = None


class HygieneAus(BaseModel):
    id: int
    pflicht_id: int
    wert: float | None
    datum: date
    zeit: time
    ausserhalb_grenze: bool


class HygieneTag(BaseModel):
    datum: date
    eintraege: list[HygieneAus]
    offen: list[int]


class Pruefpunkt(BaseModel):
    schluessel: str
    titel: str
    erfuellt: bool
    detail: str


class KontrollStatus(BaseModel):
    stand: date
    vollstaendig: bool
    punkte: list[Pruefpunkt]
    chargen_gesamt: int
    chargen_ohne_rohstoff: int
