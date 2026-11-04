import sqlite3
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory

from db import get_connection, init_db
from validation import validate_session

app = Flask(__name__)
app.config["DB_PATH"] = None

FRONTEND = Path(__file__).parent / "Improved frontend"

init_db()


def row_to_dict(row):
    return dict(row) if row else None


@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/api/facilitators")
def list_facilitators():
    conn = get_connection(app.config["DB_PATH"])
    rows = conn.execute("SELECT code, display_name FROM facilitators ORDER BY code").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/sessions", methods=["GET"])
def list_sessions():
    conn = get_connection(app.config["DB_PATH"])
    rows = conn.execute(
        """SELECT s.id, s.client_id, f.code AS facilitator_code, s.session_date,
                  s.topic, s.attendee_count, s.notes, s.created_offline, s.synced_at
           FROM sessions s JOIN facilitators f ON f.id = s.facilitator_id
           ORDER BY s.session_date DESC, s.id DESC"""
    ).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/sessions", methods=["POST"])
def save_session():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"errors": {"body": "Send a JSON object."}}), 400

    cleaned, errors = validate_session(data)
    if errors:
        return jsonify({"errors": errors}), 400

    conn = get_connection(app.config["DB_PATH"])
    try:
        fac = conn.execute(
            "SELECT id FROM facilitators WHERE code = ?", (cleaned["facilitator_code"],)
        ).fetchone()
        if fac is None:
            return jsonify({"errors": {"facilitator_code": "Unknown facilitator."}}), 400

        existing = conn.execute(
            "SELECT * FROM sessions WHERE client_id = ?", (cleaned["client_id"],)
        ).fetchone()
        if existing:
            return jsonify({"session": row_to_dict(existing), "duplicate": True}), 200

        offline = 1 if data.get("created_offline") in (1, True, "1", "true") else 0
        try:
            conn.execute(
                """INSERT INTO sessions
                   (client_id, facilitator_id, session_date, topic, attendee_count, notes, created_offline)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (cleaned["client_id"], fac["id"], cleaned["session_date"], cleaned["topic"],
                 cleaned["attendee_count"], cleaned["notes"], offline),
            )
            conn.commit()
        except sqlite3.IntegrityError:
            existing = conn.execute(
                "SELECT * FROM sessions WHERE client_id = ?", (cleaned["client_id"],)
            ).fetchone()
            return jsonify({"session": row_to_dict(existing), "duplicate": True}), 200

        saved = conn.execute(
            "SELECT * FROM sessions WHERE client_id = ?", (cleaned["client_id"],)
        ).fetchone()
        return jsonify({"session": row_to_dict(saved), "duplicate": False}), 201
    except sqlite3.Error:
        return jsonify({"errors": {"server": "Could not save. Please try again."}}), 500
    finally:
        conn.close()


@app.route("/")
def index():
    return send_from_directory(FRONTEND, "index.html")


@app.route("/<path:filename>")
def frontend_files(filename):
    return send_from_directory(FRONTEND, filename)


if __name__ == "__main__":
    app.run(debug=True)