from pathlib import Path

import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
RAW_PATH = PROJECT_ROOT / "data" / "raw" / "superstore.csv"
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"
OUTPUT_PATH = PROCESSED_DIR / "superstore_clean.csv"


def main():
    if not RAW_PATH.exists():
        raise FileNotFoundError(
            f"Dataset not found: {RAW_PATH}"
        )

    df = pd.read_csv(RAW_PATH, encoding="latin1")

    # Standardize column names
    df.columns = (
        df.columns.str.strip()
        .str.replace(" ", "_", regex=False)
    )

    print(f"Original rows: {len(df)}")

    # Remove duplicate records
    duplicates = int(df.duplicated().sum())
    df = df.drop_duplicates().copy()

    print(f"Duplicate rows removed: {duplicates}")

    # Clean text columns
    for column in df.select_dtypes(include="object").columns:
        df[column] = df[column].astype("string").str.strip()

    # Parse date columns if present
    for column in ["Order_Date", "Ship_Date"]:
        if column in df.columns:
            df[column] = pd.to_datetime(
                df[column],
                errors="coerce"
            )

    # Convert numeric columns safely
    for column in ["Sales", "Profit", "Discount", "Quantity"]:
        if column in df.columns:
            df[column] = pd.to_numeric(
                df[column],
                errors="coerce"
            )

    # Remove records missing essential analytical fields
    required_columns = [
        column
        for column in ["Order_Date", "Sales", "Quantity"]
        if column in df.columns
    ]

    if required_columns:
        before = len(df)
        df = df.dropna(subset=required_columns).copy()
        print(f"Rows removed for missing essential values: {before - len(df)}")

    # Add useful time-based analytical features
    if "Order_Date" in df.columns:
        df["Year"] = df["Order_Date"].dt.year
        df["Month"] = df["Order_Date"].dt.month
        df["Year_Month"] = df["Order_Date"].dt.to_period("M").astype(str)
        df["Quarter"] = df["Order_Date"].dt.quarter

    # Save cleaned data
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    df.to_csv(OUTPUT_PATH, index=False, date_format="%Y-%m-%d")

    print("\nCleaning completed.")
    print(f"Clean rows: {len(df)}")
    print(f"Columns: {len(df.columns)}")
    print(f"Saved to: {OUTPUT_PATH}")

    print("\nRemaining missing values:")
    print(df.isna().sum().to_string())

    if "Sales" in df.columns:
        print(f"\nTotal sales: {df['Sales'].sum():,.2f}")

    if "Profit" in df.columns:
        print(f"Total profit: {df['Profit'].sum():,.2f}")


if __name__ == "__main__":
    main()