from fastapi import Depends, Header, HTTPException, status
from sqlmodel import Session, select

from app.db import get_session
from app.models import Betrieb


def aktueller_betrieb(
    authorization: str = Header(default=""),
    session: Session = Depends(get_session),
) -> Betrieb:
    """Betriebs-Token aus dem Authorization-Header. Ein Token = ein Betrieb."""
    if not authorization.lower().startswith("bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Kein Zugangstoken übermittelt.")

    token = authorization[7:].strip()
    betrieb = session.exec(select(Betrieb).where(Betrieb.token == token)).first()
    if not betrieb:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Zugangstoken ist ungültig.")
    return betrieb
