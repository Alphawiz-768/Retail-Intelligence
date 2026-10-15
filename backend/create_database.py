from pathlib import Path
import sqlite3

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
CSV_PATH = PROJECT_ROOT / "data" / "processed" / "superstore_clean.csv"
DB_PATH = PROJECT_ROOT / "data" / "retail.db"


def main():
    if not CSV_PATH.exists():
        raise FileNotFoundError(
            f"Cleaned dataset not found: {CSV_PATH}"
        )

    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(CSV_PATH)

    # SQLite table and database are created automatically.
    with sqlite3.connect(DB_PATH) as connection:
        df.to_sql(
            "superstore",
            connection,
            if_exists="replace",
            index=False,
        )

        row_count = connection.execute(
            "SELECT COUNT(*) FROM superstore"
        ).fetchone()[0]

        table_info = connection.execute(
            "PRAGMA table_info(superstore)"
        ).fetchall()

    print("Database created successfully.")
    print(f"Database: {DB_PATH}")
    print(f"Rows imported: {row_count}")
    print(f"Columns imported: {len(table_info)}")
    print("\nTable columns:")

    for column in table_info:
        print(f"- {column[1]} ({column[2]})")


if __name__ == "__main__":
    main()