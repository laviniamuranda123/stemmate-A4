import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).parent
DB_PATH = BASE_DIR / "stemmate.db"


def get_connection(db_path=None):
    conn = sqlite3.connect(db_path or DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db(db_path=None):
    conn = get_connection(db_path)
    conn.executescript((BASE_DIR / "schema.sql").read_text(encoding="utf-8"))
    conn.executescript((BASE_DIR / "seed.sql").read_text(encoding="utf-8"))
    conn.commit()
    conn.close()


if __name__ == "__main__":
    init_db()
    print("Database ready")