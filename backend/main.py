from pathlib import Path
import json
import sqlite3

import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DB_PATH = PROJECT_ROOT / "data" / "retail.db"
ANALYTICS_DIR = PROJECT_ROOT / "data" / "processed" / "analytics"
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"

app = FastAPI(
    title="Retail Intelligence API",
    description="Retail analytics and sales forecasting API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def read_sql(query: str) -> pd.DataFrame:
    if not DB_PATH.exists():
        raise HTTPException(status_code=500, detail="Database not found.")

    with sqlite3.connect(DB_PATH) as connection:
        return pd.read_sql_query(query, connection)


def read_csv_file(path: Path) -> list[dict]:
    if not path.exists():
        raise HTTPException(
            status_code=500,
            detail=f"Required file not found: {path.name}",
        )
    return pd.read_csv(path).to_dict(orient="records")


@app.get("/")
def root():
    return {
        "message": "Retail Intelligence API is running",
        "docs": "/docs",
    }


@app.get("/api/overview")
def overview():
    query = """
        SELECT
            ROUND(SUM(Sales), 2) AS total_sales,
            ROUND(SUM(Profit), 2) AS total_profit,
            ROUND(SUM(Profit) * 100.0 / NULLIF(SUM(Sales), 0), 2)
                AS profit_margin_pct,
            COUNT(DISTINCT Order_ID) AS total_orders,
            COUNT(DISTINCT Customer_ID) AS unique_customers
        FROM superstore
    """
    return read_sql(query).iloc[0].to_dict()


@app.get("/api/monthly-trends")
def monthly_trends():
    query = """
        SELECT
            Year_Month AS month,
            ROUND(SUM(Sales), 2) AS sales,
            ROUND(SUM(Profit), 2) AS profit
        FROM superstore
        GROUP BY Year_Month
        ORDER BY Year_Month
    """
    return read_sql(query).to_dict(orient="records")


@app.get("/api/categories")
def categories():
    query = """
        SELECT
            Category AS category,
            ROUND(SUM(Sales), 2) AS sales,
            ROUND(SUM(Profit), 2) AS profit
        FROM superstore
        GROUP BY Category
        ORDER BY sales DESC
    """
    return read_sql(query).to_dict(orient="records")


@app.get("/api/regions")
def regions():
    query = """
        SELECT
            Region AS region,
            ROUND(SUM(Sales), 2) AS sales,
            ROUND(SUM(Profit), 2) AS profit
        FROM superstore
        GROUP BY Region
        ORDER BY sales DESC
    """
    return read_sql(query).to_dict(orient="records")


@app.get("/api/subcategories")
def subcategories():
    query = """
        SELECT
            "Sub-Category" AS sub_category,
            ROUND(SUM(Sales), 2) AS sales,
            ROUND(SUM(Profit), 2) AS profit
        FROM superstore
        GROUP BY "Sub-Category"
        ORDER BY profit DESC
    """
    return read_sql(query).to_dict(orient="records")


@app.get("/api/discount-impact")
def discount_impact():
    return read_csv_file(ANALYTICS_DIR / "query_6.csv")


@app.get("/api/forecast")
def forecast():
    forecast_path = PROCESSED_DIR / "sales_forecast_next_3_months.csv"
    metrics_path = PROCESSED_DIR / "forecast_metrics.json"

    if not metrics_path.exists():
        raise HTTPException(status_code=500, detail="Forecast metrics not found.")

    with metrics_path.open(encoding="utf-8") as file:
        metrics = json.load(file)

    return {
        "forecast_type": "Historical backdated forecast",
        "forecast": read_csv_file(forecast_path),
        "metrics": metrics,
    }