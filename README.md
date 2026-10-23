# Hofdoku

Dokumentation für kleine verarbeitende Direktvermarkter — Chargen, Rückverfolgbarkeit,
Eigenkontrolle und ein Ordner, der bei der Lebensmittelkontrolle vorzeigbar ist.

Der Kern: formlose Eingabe (Sprache oder halber Satz) wird automatisch zu strukturierten
Compliance-Daten. Kein Formular, weil an Formularen genau diese Zielgruppe scheitert.

## Aufbau

```
backend/    FastAPI + SQLModel, Postgres (lokal SQLite), Deployment auf Render
frontend/   Vite + React + TypeScript + Tailwind
```

## Backend starten

```bash
cd backend
python -m venv .venv && source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                  # ANTHROPIC_API_KEY eintragen
uvicorn app.main:app --reload
```

API-Dokumentation: http://localhost:8000/docs

Beim ersten Start werden aus `SEED_BETRIEB_*` ein Betrieb und die Standard-Eigenkontrollen
(Kühlraum, Reiferaum, Reinigung) angelegt.

## Frontend starten

```bash
cd frontend
npm install
cp .env.example .env                                  # gleicher Token wie im Backend
npm run dev
```

## Endpunkte

| Methode | Pfad | Zweck |
|---|---|---|
| POST | `/api/chargen` | Notiz aufnehmen, Charge anlegen |
| GET | `/api/chargen` | Chargen listen |
| PATCH | `/api/chargen/{id}` | Rohstoff oder Abgabe nachtragen |
| GET | `/api/hygiene/pflichten` | Eigenkontrollen des Betriebs |
| POST | `/api/hygiene` | Eintrag für heute (überschreibt vorhandenen) |
| GET | `/api/hygiene/tage?tage=7` | Verlauf inklusive Lücken |
| GET | `/api/kontrolle/status` | Ist der Ordner vorzeigbar? |
| GET | `/api/kontrolle/export` | Vollauszug für die Kontrolle |

Authentifizierung über `Authorization: Bearer <betriebs-token>`. Ein Token gehört zu genau
einem Betrieb; alle Abfragen sind darauf eingegrenzt.

## Erkennung der Notizen

`app/parsing.py` schickt die Notiz an das Sprachmodell und erwartet JSON zurück. Schlägt das
fehl — kein Netz am Hof, API nicht erreichbar, kein Key gesetzt — greift ein regelbasierter
Pfad, der Menge, Einheit, Produkt und Rohstoff aus dem Text zieht. Die App bleibt also immer
benutzbar. Der Originaltext wird bei jeder Charge mitgespeichert, damit eine falsche
Interpretation nachvollziehbar und korrigierbar bleibt.

## Vor dem ersten echten Kunden

- **Migrationen**: aktuell `create_all` beim Start. Vor der ersten Schemaänderung im
  Produktivbetrieb auf Alembic umstellen.
- **Token**: `SEED_BETRIEB_TOKEN` ist nur für die Entwicklung. Für mehrere Betriebe eine
  richtige Anmeldung ergänzen (Magic-Link per Mail passt zu dieser Zielgruppe besser als
  Passwörter).
- **Datensicherung**: Compliance-Daten sind der Grund, warum jemand zahlt. Automatische
  Backups der Datenbank einschalten, bevor der erste Betrieb echte Daten einträgt.
- **Offlinefähigkeit**: In Käserei und Stall ist oft kein Netz. Nächster sinnvoller Ausbau:
  Eingaben lokal zwischenspeichern und nachsenden, sobald wieder Verbindung da ist.
- **Aufbewahrungsfristen**: Chargendaten dürfen nicht gelöscht werden, solange die
  gesetzliche Frist läuft — Löschen daher nur als Markierung, nie hart.

## Bewusst nicht drin

Keine Etikettengenerierung, keine Kasse, keine Buchhaltung, keine Tierverwaltung.
Etiketten kommen später — der erste Testbetrieb hat sie ausdrücklich als nachrangig
eingestuft.
