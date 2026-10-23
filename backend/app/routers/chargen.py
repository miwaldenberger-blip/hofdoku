from datetime import date, datetime
import re

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from app.auth import aktueller_betrieb
from app.db import get_session
from app.models import Betrieb, Charge
from app.parsing import erkenne
from app.schemas import ChargeAnlegen, ChargeAus, ChargeKorrektur

router = APIRouter(prefix="/api/chargen", tags=["chargen"])


def _kuerzel(produkt: str) -> str:
    buchstaben = re.sub(r"[^A-Za-zÄÖÜäöüß]", "", produkt).upper()
    return (buchstaben[:3] or "CHG")


def _naechste_nummer(session: Session, betrieb_id: int, produkt: str, tag: date) -> str:
    bestand = session.exec(
        select(Charge).where(Charge.betrieb_id == betrieb_id, Charge.hergestellt_am == tag)
    ).all()
    return f"{_kuerzel(produkt)}-{tag:%y%m%d}-{len(bestand) + 1:02d}"


def _aus(c: Charge) -> ChargeAus:
    return ChargeAus(**c.model_dump(), rueckverfolgbar=bool(c.rohstoff))


@router.post("", response_model=ChargeAus, status_code=status.HTTP_201_CREATED)
def charge_anlegen(
    eingabe: ChargeAnlegen,
    betrieb: Betrieb = Depends(aktueller_betrieb),
    session: Session = Depends(get_session),
):
    """Formlose Notiz aufnehmen und als Charge ablegen."""
    erkannt = erkenne(eingabe.text)
    jetzt = datetime.now()

    charge = Charge(
        betrieb_id=betrieb.id,
        nummer=_naechste_nummer(session, betrieb.id, erkannt.produkt, jetzt.date()),
        produkt=erkannt.produkt,
        menge=erkannt.menge,
        einheit=erkannt.einheit,
        rohstoff=erkannt.rohstoff,
        notiz=erkannt.notiz,
        rohtext=eingabe.text,
        hergestellt_am=jetzt.date(),
        hergestellt_um=jetzt.time().replace(microsecond=0),
    )
    session.add(charge)
    session.commit()
    session.refresh(charge)
    return _aus(charge)


@router.get("", response_model=list[ChargeAus])
def chargen_liste(
    von: date | None = None,
    bis: date | None = None,
    limit: int = Query(default=100, le=500),
    betrieb: Betrieb = Depends(aktueller_betrieb),
    session: Session = Depends(get_session),
):
    abfrage = select(Charge).where(Charge.betrieb_id == betrieb.id)
    if von:
        abfrage = abfrage.where(Charge.hergestellt_am >= von)
    if bis:
        abfrage = abfrage.where(Charge.hergestellt_am <= bis)
    abfrage = abfrage.order_by(Charge.hergestellt_am.desc(), Charge.id.desc()).limit(limit)
    return [_aus(c) for c in session.exec(abfrage).all()]


@router.get("/{charge_id}", response_model=ChargeAus)
def charge_lesen(
    charge_id: int,
    betrieb: Betrieb = Depends(aktueller_betrieb),
    session: Session = Depends(get_session),
):
    charge = session.get(Charge, charge_id)
    if not charge or charge.betrieb_id != betrieb.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Charge nicht gefunden.")
    return _aus(charge)


@router.patch("/{charge_id}", response_model=ChargeAus)
def charge_ergaenzen(
    charge_id: int,
    korrektur: ChargeKorrektur,
    betrieb: Betrieb = Depends(aktueller_betrieb),
    session: Session = Depends(get_session),
):
    """Lücken nachtragen, etwa den fehlenden Rohstoff oder die Abgabe.

    Der Originaltext bleibt unverändert erhalten.
    """
    charge = session.get(Charge, charge_id)
    if not charge or charge.betrieb_id != betrieb.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Charge nicht gefunden.")

    for feld, wert in korrektur.model_dump(exclude_unset=True).items():
        setattr(charge, feld, wert)

    session.add(charge)
    session.commit()
    session.refresh(charge)
    return _aus(charge)
