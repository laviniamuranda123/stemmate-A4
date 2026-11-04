import pytest
from app import app
from db import init_db, get_connection


@pytest.fixture
def client(tmp_path):
    db_file = tmp_path / "test.db"
    init_db(db_file)
    app.config["DB_PATH"] = db_file
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c
    app.config["DB_PATH"] = None


def make_session(**overrides):
    data = {
        "client_id": "t-1",
        "facilitator_code": "F001",
        "session_date": "2026-10-01",
        "topic": "Robotics",
        "attendee_count": 12,
    }
    data.update(overrides)
    return data


def test_save_valid_session(client):
    r = client.post("/api/sessions", json=make_session())
    assert r.status_code == 201
    assert r.get_json()["duplicate"] is False


def test_retry_same_client_id_does_not_duplicate(client):
    client.post("/api/sessions", json=make_session())
    r = client.post("/api/sessions", json=make_session())
    assert r.status_code == 200
    assert r.get_json()["duplicate"] is True
    assert len(client.get("/api/sessions").get_json()) == 1


def test_empty_topic_rejected(client):
    r = client.post("/api/sessions", json=make_session(topic=""))
    assert r.status_code == 400
    assert "topic" in r.get_json()["errors"]


def test_negative_attendees_rejected(client):
    r = client.post("/api/sessions", json=make_session(attendee_count=-5))
    assert r.status_code == 400
    assert "attendee_count" in r.get_json()["errors"]


def test_future_date_rejected(client):
    r = client.post("/api/sessions", json=make_session(session_date="2999-01-01"))
    assert r.status_code == 400


def test_unknown_facilitator_rejected(client):
    r = client.post("/api/sessions", json=make_session(facilitator_code="F999"))
    assert r.status_code == 400


def test_data_persists_in_database_file(client, tmp_path):
    client.post("/api/sessions", json=make_session())
    conn = get_connection(tmp_path / "test.db")
    count = conn.execute("SELECT COUNT(*) FROM sessions").fetchone()[0]
    conn.close()
    assert count == 1