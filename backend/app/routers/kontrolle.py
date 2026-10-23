from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select

from app.auth import aktueller_betrieb
from app.db import get_session
from app.models import Betrieb, Charge, HygieneEintrag, Pflicht
from app.schemas import KontrollStatus, Pruefpunkt

router = APIRouter(prefix="/api/kontrolle", tags=["kontrolle"])


@router.get("/status", response_model=KontrollStatus)
def status(
    tage: int = Query(default=7, ge=1, le=90),
    betrieb: Betrieb = Depends(aktueller_betrieb),
    session: Session = Depends(get_session),
):
    """Ist der Ordner vorzeigbar? Und wenn nein: woran genau liegt es."""
    start = date.today() - timedelta(days=tage - 1)

    chargen = session.exec(select(Charge).where(Charge.betrieb_id == betrieb.id)).all()
    ohne_rohstoff = [c for c in chargen if not c.rohstoff]

    pflichten = session.exec(
        select(Pflicht).where(Pflicht.betrieb_id == betrieb.id, Pflicht.aktiv == True)  # noqa: E712
    ).all()
    eintraege = session.exec(
        select(HygieneEintrag).where(
            HygieneEintrag.betrieb_id == betrieb.id, HygieneEintrag.datum >= start
        )
    ).all()

    soll = len(pflichten) * tage
    ist = len({(e.pflicht_id, e.datum) for e in eintraege})

    punkte = [
        Pruefpunkt(
            schluessel="chargen",
            titel="Chargen erfasst",
            erfuellt=len(chargen) > 0,
            detail=f"{len(chargen)} Chargen",
        ),
        Pruefpunkt(
            schluessel="rueckverfolgung",
            titel="Rückverfolgung lückenlos",
            erfuellt=not ohne_rohstoff,
            detail="vollständig" if not ohne_rohstoff else f"{len(ohne_rohstoff)} ohne Rohstoff",
        ),
        Pruefpunkt(
            schluessel="hygiene",
            titel=f"Hygienedoku {tage} Tage",
            erfuellt=soll > 0 and ist >= soll,
            detail=f"{ist}/{soll}",
        ),
    ]

    return KontrollStatus(
        stand=date.today(),
        vollstaendig=all(p.erfuellt for p in punkte),
        punkte=punkte,
        chargen_gesamt=len(chargen),
        chargen_ohne_rohstoff=len(ohne_rohstoff),
    )


@router.get("/export")
def export(
    von: date | None = None,
    bis: date | None = None,
    betrieb: Betrieb = Depends(aktueller_betrieb),
    session: Session = Depends(get_session),
):
    """Vollständiger Auszug für die Kontrolle – Grundlage für den späteren PDF-Ausdruck."""
    von = von or date.today() - timedelta(days=365)
    bis = bis or date.today()

    chargen = session.exec(
        select(Charge)
        .where(
            Charge.betrieb_id == betrieb.id,
            Charge.hergestellt_am >= von,
            Charge.hergestellt_am <= bis,
        )
        .order_by(Charge.hergestellt_am.desc())
    ).all()

    pflichten = {
        p.id: p
        for p in session.exec(select(Pflicht).where(Pflicht.betrieb_id == betrieb.id)).all()
    }
    eintraege = session.exec(
        select(HygieneEintrag)
        .where(
            HygieneEintrag.betrieb_id == betrieb.id,
            HygieneEintrag.datum >= von,
            HygieneEintrag.datum <= bis,
        )
        .order_by(HygieneEintrag.datum.desc())
    ).all()

    return {
        "betrieb": betrieb.name,
        "zeitraum": {"von": von, "bis": bis},
        "erstellt_am": date.today(),
        "chargen": [
            {
                "nummer": c.nummer,
                "produkt": c.produkt,
                "menge": c.menge,
                "einheit": c.einheit,
                "rohstoff": c.rohstoff,
                "abgabe": c.abgabe,
                "hergestellt_am": c.hergestellt_am,
                "hergestellt_um": c.hergestellt_um,
                "originaleingabe": c.rohtext,
            }
            for c in chargen
        ],
        "eigenkontrolle": [
            {
                "pflicht": pflichten[e.pflicht_id].name if e.pflicht_id in pflichten else "unbekannt",
                "wert": e.wert,
                "einheit": pflichten[e.pflicht_id].einheit if e.pflicht_id in pflichten else None,
                "datum": e.datum,
                "zeit": e.zeit,
            }
            for e in eintraege
        ],
    }
