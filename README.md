# STEMMate Namibia: Backend Vertical Slice

Priority workflow: a facilitator saves a session. If the device goes offline, the
session is kept as a draft and retried later. The server accepts retries safely
using a unique `client_id`, so no duplicate records are created.

Stack: Python 3.10+, Flask, SQLite. Synthetic data only. No secrets or real learner data.

## Setup (Windows PowerShell)
```powershell
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python db.py
```

## Run
```powershell
flask --app app run
```
Check: http://127.0.0.1:5000/api/health returns `{"status":"ok"}`.

## Run the automated tests
```powershell
python -m pytest -v
```

## API
| Method | Path | Purpose |
|---|---|---|
| GET | /api/health | Server check |
| GET | /api/facilitators | List synthetic facilitators |
| GET | /api/sessions | List saved sessions |
| POST | /api/sessions | Save a session (idempotent on `client_id`) |

POST body (JSON): `client_id`, `facilitator_code`, `session_date` (YYYY-MM-DD),
`topic`, `attendee_count`, optional `notes`, optional `created_offline`.
Responses: 201 saved, 200 duplicate retry (`duplicate: true`), 400 validation errors.

## Known limitations
- Development server only, not production-ready.
- No login or access control in this slice.
- Offline draft and retry logic lives in the frontend (see frontend files).