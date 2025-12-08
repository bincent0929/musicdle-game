"""
Backend server for user authentication and database management.
Uses SQLite for storage and Flask for handling HTTP requests.
"""

from flask import Flask, request, jsonify
import sqlite3
from typing import Optional

app = Flask(__name__)

DB_FILE = "users.db"

def get_db_connection():
    """Open and return a new database connection."""
    return sqlite3.connect(DB_FILE)


def create_users_table():
    """Create user table if it does not exist."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE (
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            );
        """)
        conn.commit()

@app.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()
    username: Optional[str] = data.get("username")
    password: Optional[str] = data.get("password")

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO users (username, password) VALUES (?, ?)",
                (username, password)
            )
            conn.commit()
    except sqlite3.IntegrityError:
        return jsonify({"error": "Username already exists"}), 409

    return jsonify({"message": "Account created successfully"}), 201


@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username: Optional[str] = data.get("username")
    password: Optional[str] = data.get("password")

    if not username or not password:
        return jsonify({"error": "Username and password required"}), 400

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT password FROM users WHERE username=?",
            (username,)
        )
        row = cursor.fetchone()

    if row and row[0] == password:
        return jsonify({"message": "Login successful"}), 200

    return jsonify({"error": "Invalid username or password"}), 401

if __name__ == "__main__":
    create_users_table()
    print("Backend server running at http://localhost:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)