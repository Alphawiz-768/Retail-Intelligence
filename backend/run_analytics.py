from pathlib import Path
import sqlite3

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DB_PATH = PROJECT_ROOT / "data" / "retail.db"
SQL_PATH = PROJECT_ROOT / "sql" / "analytics.sql"
OUTPUT_DIR = PROJECT_ROOT / "data" / "processed" / "analytics"


def main():
    if not DB_PATH.exists():
        raise FileNotFoundError(f"Database not found: {DB_PATH}")

    if not SQL_PATH.exists():
        raise FileNotFoundError(f"SQL file not found: {SQL_PATH}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    sql_text = SQL_PATH.read_text(encoding="utf-8")

    # Split the file into individual SQL statements.
    statements = [
        statement.strip()
        for statement in sql_text.split(";")
        if statement.strip()
    ]

    with sqlite3.connect(DB_PATH) as connection:
        for index, statement in enumerate(statements, start=1):
            # Ignore SQL comments when checking for a query.
            cleaned_statement = "\n".join(
                line
                for line in statement.splitlines()
                if not line.strip().startswith("--")
            ).strip()

            if not cleaned_statement:
                continue

            result = pd.read_sql_query(
                cleaned_statement,
                connection,
            )

            output_path = OUTPUT_DIR / f"query_{index}.csv"
            result.to_csv(output_path, index=False)

            print(f"\n{'=' * 55}")
            print(f"QUERY {index}")
            print("=" * 55)
            print(result.to_string(index=False))
            print(f"\nSaved: {output_path}")

    print("\nAll SQL analytics queries completed.")


if __name__ == "__main__":
    main()