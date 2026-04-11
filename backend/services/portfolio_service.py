import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "portfolio.db")

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS portfolio (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id     TEXT    NOT NULL,
            symbol      TEXT    NOT NULL,
            company_name TEXT,
            quantity    REAL    NOT NULL,
            buy_price   REAL    NOT NULL,
            added_on    TEXT
        )
    """)
    conn.commit()
    conn.close()

init_db()


def get_portfolio(user_id: str):
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM portfolio WHERE user_id = ?", (user_id,))
    rows = c.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def add_holding(user_id: str, symbol: str, company_name: str,
                quantity: float, buy_price: float) -> int:
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        """INSERT INTO portfolio
           (user_id, symbol, company_name, quantity, buy_price, added_on)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (user_id, symbol.upper(), company_name, quantity,
         buy_price, datetime.now().strftime("%Y-%m-%d"))
    )
    conn.commit()
    new_id = c.lastrowid
    conn.close()
    return new_id


def remove_holding(holding_id: int, user_id: str) -> bool:
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        "DELETE FROM portfolio WHERE id = ? AND user_id = ?",
        (holding_id, user_id)
    )
    conn.commit()
    deleted = c.rowcount
    conn.close()
    return deleted > 0