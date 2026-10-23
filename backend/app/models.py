from datetime import date, datetime, time

from sqlmodel import Field, SQLModel


class Betrieb(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    token: str = Field(index=True, unique=True)
    erstellt_am: datetime = Field(default_factory=datetime.utcnow)


class Pflicht(SQLModel, table=True):
    """Wiederkehrende Eigenkontrolle, z. B. Kuehlraumtemperatur."""

    id: int | None = Field(default=None, primary_key=True)
    betrieb_id: int = Field(foreign_key="betrieb.id", index=True)
    schluessel: str                      # "kuehlraum"
    name: str                            # "Kühlraum"
    beschreibung: str                    # "Temperatur, täglich"
    einheit: str | None = None           # "°C" oder None fuer Abhaken
    grenze_min: float | None = None
    grenze_max: float | None = None
    reihenfolge: int = 0
    aktiv: bool = True


class Charge(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    betrieb_id: int = Field(foreign_key="betrieb.id", index=True)
    nummer: str = Field(index=True)
    produkt: str
    menge: float | None = None
    einheit: str | None = None
    rohstoff: str | None = None
    notiz: str | None = None
    rohtext: str                          # Originaleingabe, revisionssicher
    hergestellt_am: date = Field(index=True)
    hergestellt_um: time
    abgabe: str | None = None
    erstellt_am: datetime = Field(default_factory=datetime.utcnow)


class HygieneEintrag(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    betrieb_id: int = Field(foreign_key="betrieb.id", index=True)
    pflicht_id: int = Field(foreign_key="pflicht.id", index=True)
    wert: float | None = None
    datum: date = Field(index=True)
    zeit: time
    erstellt_am: datetime = Field(default_factory=datetime.utcnow)
