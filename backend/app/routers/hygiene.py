from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from app.auth import aktueller_betrieb
from app.db import get_session
from app.models import Betrieb, HygieneEintrag, Pflicht
from app.schemas import HygieneAnlegen, HygieneAus, HygieneTag, PflichtAus

router = APIRouter(prefix="/api/hygiene", tags=["hygiene"])


def _pflichten(session: Session, betrieb_id: int) -> list[Pflicht]:
    return session.exec(
        select(Pflicht)
        .where(Pflicht.betrieb_id == betrieb_id, Pflicht.aktiv == True)  # noqa: E712
        .order_by(Pflicht.reihenfolge)
    ).all()


def _ausserhalb(pflicht: Pflicht, wert: float | None) -> bool:
    if wert is None:
        return False
    if pflicht.grenze_min is not None and wert < pflicht.grenze_min:
        return True
    if pflicht.grenze_max is not None and wert > pflicht.grenze_max:
        return True
    return False


@router.get("/pflichten", response_model=list[PflichtAus])
def pflichten_liste(
    betrieb: Betrieb = Depends(aktueller_betrieb),
    session: Session = Depends(get_session),
):
    return [PflichtAus(**p.model_dump()) for p in _pflichten(session, betrieb.id)]


@router.post("", response_model=HygieneAus, status_code=status.HTTP_201_CREATED)
def eintragen(
    eingabe: HygieneAnlegen,
    betrieb: Betrieb = Depends(aktueller_betrieb),
    session: Session = Depends(get_session),
):
    pflicht = session.get(Pflicht, eingabe.pflicht_id)
    if not pflicht or pflicht.betrieb_id != betrieb.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Diese Eigenkontrolle gibt es nicht.")
    if pflicht.einheit and eingabe.wert is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Bitte einen Wert in {pflicht.einheit} eintragen.")

    tag = eingabe.datum or date.today()

    # Pro Pflicht und Tag ein Eintrag: erneutes Eintragen überschreibt.
    vorhanden = session.exec(
        select(HygieneEintrag).where(
            HygieneEintrag.betrieb_id == betrieb.id,
            HygieneEintrag.pflicht_id == pflicht.id,
            HygieneEintrag.datum == tag,
        )
    ).first()
    if vorhanden:
        session.delete(vorhanden)
        session.flush()

    eintrag = HygieneEintrag(
        betrieb_id=betrieb.id,
        pflicht_id=pflicht.id,
        wert=eingabe.wert,
        datum=tag,
        zeit=datetime.now().time().replace(microsecond=0),
    )
    session.add(eintrag)
    session.commit()
    session.refresh(eintrag)

    return HygieneAus(**eintrag.model_dump(), ausserhalb_grenze=_ausserhalb(pflicht, eintrag.wert))


@router.get("/tage", response_model=list[HygieneTag])
def verlauf(
    tage: int = Query(default=7, ge=1, le=90),
    betrieb: Betrieb = Depends(aktueller_betrieb),
    session: Session = Depends(get_session),
):
    """Tagesweiser Verlauf inklusive der Lücken – genau das, was bei einer Kontrolle auffällt."""
    pflichten = {p.id: p for p in _pflichten(session, betrieb.id)}
    start = date.today() - timedelta(days=tage - 1)

    eintraege = session.exec(
        select(HygieneEintrag).where(
            HygieneEintrag.betrieb_id == betrieb.id, HygieneEintrag.datum >= start
        )
    ).all()

    ergebnis: list[HygieneTag] = []
    for versatz in range(tage):
        tag = start + timedelta(days=versatz)
        des_tages = [e for e in eintraege if e.datum == tag]
        ergebnis.append(
            HygieneTag(
                datum=tag,
                eintraege=[
                    HygieneAus(
                        **e.model_dump(),
                        ausserhalb_grenze=_ausserhalb(pflichten[e.pflicht_id], e.wert),
                    )
                    for e in des_tages
                    if e.pflicht_id in pflichten
                ],
                offen=[pid for pid in pflichten if pid not in {e.pflicht_id for e in des_tages}],
            )
        )
    return ergebnis
