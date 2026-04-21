import sqlite3
import os
import bcrypt
import jwt
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), "portfolio.db")
JWT_SECRET = os.environ.get("JWT_SECRET", "nex_trade_secret_key_change_in_prod")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_DAYS = 30  # Long-lived tokens for "keep me signed in"


def init_users_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            email       TEXT    UNIQUE NOT NULL,
            password_hash TEXT  NOT NULL,
            name        TEXT    NOT NULL,
            age         INTEGER NOT NULL,
            created_at  TEXT    NOT NULL
        )
    """)
    conn.commit()
    conn.close()


init_users_db()


def signup(email: str, password: str, name: str, age: int) -> dict | None:
    """Create a new user. Returns user dict on success, None if email already exists."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    # Check if email already exists
    c.execute("SELECT id FROM users WHERE email = ?", (email.lower(),))
    if c.fetchone():
        conn.close()
        return None

    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    c.execute(
        """INSERT INTO users (email, password_hash, name, age, created_at)
           VALUES (?, ?, ?, ?, ?)""",
        (email.lower(), password_hash, name.strip(), age, now),
    )
    conn.commit()
    user_id = c.lastrowid
    conn.close()

    return {"id": user_id, "email": email.lower(), "name": name.strip(), "age": age}


def login(email: str, password: str) -> dict | None:
    """Validate credentials. Returns user dict on success, None on failure."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE email = ?", (email.lower(),))
    row = c.fetchone()
    conn.close()

    if not row:
        return None

    if not bcrypt.checkpw(password.encode("utf-8"), row["password_hash"].encode("utf-8")):
        return None

    return {
        "id": row["id"],
        "email": row["email"],
        "name": row["name"],
        "age": row["age"],
    }


def get_user(user_id: int) -> dict | None:
    """Fetch a user by ID."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT id, email, name, age, created_at FROM users WHERE id = ?", (user_id,))
    row = c.fetchone()
    conn.close()

    if not row:
        return None

    return dict(row)


def create_token(user_id: int) -> str:
    """Create a JWT token for the given user ID."""
    payload = {
        "sub": str(user_id),
        "iat": datetime.utcnow(),
        "exp": datetime.utcnow() + timedelta(days=JWT_EXPIRY_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_token(token: str) -> int | None:
    """Verify a JWT token and return the user ID, or None if invalid."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        sub = payload.get("sub")
        return int(sub) if sub is not None else None
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, ValueError):
        return None
