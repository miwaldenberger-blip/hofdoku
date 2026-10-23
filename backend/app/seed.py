"""Erstbefüllung: Betrieb und die üblichen Eigenkontrollen anlegen."""

from sqlmodel import Session, select

from app.config import settings
from app.db import engine
from app.models import Betrieb, Pflicht

STANDARD_PFLICHTEN = [
    ("kuehlraum", "Kühlraum", "Temperatur, täglich", "°C", 0.0, 5.0, 1),
    ("reiferaum", "Reiferaum", "Temperatur, täglich", "°C", 10.0, 14.0, 2),
    ("reinigung", "Produktionsraum", "Reinigung, täglich", None, None, None, 3),
]


def seed() -> None:
    if not (settings.seed_betrieb_name and settings.seed_betrieb_token):
        return

    with Session(engine) as session:
        vorhanden = session.exec(
            select(Betrieb).where(Betrieb.token == settings.seed_betrieb_token)
        ).first()
        if vorhanden:
            return

        betrieb = Betrieb(name=settings.seed_betrieb_name, token=settings.seed_betrieb_token)
        session.add(betrieb)
        session.commit()
        session.refresh(betrieb)

        for schluessel, name, beschreibung, einheit, gmin, gmax, reihenfolge in STANDARD_PFLICHTEN:
            session.add(
                Pflicht(
                    betrieb_id=betrieb.id,
                    schluessel=schluessel,
                    name=name,
                    beschreibung=beschreibung,
                    einheit=einheit,
                    grenze_min=gmin,
                    grenze_max=gmax,
                    reihenfolge=reihenfolge,
                )
            )
        session.commit()
