from pathlib import Path

import pandas as pd

# Locate the project directory and dataset
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = PROJECT_ROOT / "data" / "raw" / "superstore.csv"


def main():
    if not DATA_PATH.exists():
        print(f"Dataset not found: {DATA_PATH}")
        print("Check that superstore.csv is inside data/raw.")
        return

    df = pd.read_csv(DATA_PATH, encoding="latin1")

    print("\n" + "=" * 60)
    print("RETAIL DATASET INSPECTION")
    print("=" * 60)

    print(f"\nNumber of rows: {df.shape[0]}")
    print(f"Number of columns: {df.shape[1]}")

    print("\nColumn names:")
    for column in df.columns:
        print(f"- {column}")

    print("\nFirst 5 rows:")
    print(df.head().to_string(index=False))

    print("\nData types:")
    print(df.dtypes.to_string())

    print("\nMissing values per column:")
    print(df.isnull().sum().to_string())

    print(f"\nDuplicate rows: {df.duplicated().sum()}")

    if "Sales" in df.columns:
        print("\nSales statistics:")
        print(df["Sales"].describe().to_string())
        print(f"\nTotal sales: {df['Sales'].sum():,.2f}")

    if "Profit" in df.columns:
        print(f"Total profit: {df['Profit'].sum():,.2f}")

    print("\nInspection completed.")


if __name__ == "__main__":
    main()