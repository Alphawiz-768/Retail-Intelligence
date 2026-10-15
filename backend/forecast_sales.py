from pathlib import Path
import json

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = PROJECT_ROOT / "data" / "processed" / "superstore_clean.csv"
MODEL_DIR = PROJECT_ROOT / "data" / "models"
OUTPUT_DIR = PROJECT_ROOT / "data" / "processed"

TARGET = "Sales"
LAGS = [1, 2, 3, 6, 12]


def load_monthly_sales():
    df = pd.read_csv(DATA_PATH, parse_dates=["Order_Date"])

    monthly = (
        df.groupby(pd.Grouper(key="Order_Date", freq="MS"))[TARGET]
        .sum()
        .sort_index()
        .asfreq("MS", fill_value=0)
    )

    monthly.index.name = "Month"
    return monthly


def create_features(monthly):
    data = pd.DataFrame({"Sales": monthly})

    # Calendar features
    data["month_number"] = data.index.month
    data["quarter"] = data.index.quarter
    data["year"] = data.index.year
    data["time_index"] = np.arange(len(data))

    # Past sales values only
    for lag in LAGS:
        data[f"sales_lag_{lag}"] = data["Sales"].shift(lag)

    # Rolling average uses only previous months
    data["rolling_mean_3"] = data["Sales"].shift(1).rolling(3).mean()
    data["rolling_mean_6"] = data["Sales"].shift(1).rolling(6).mean()

    return data.dropna().copy()


def calculate_metrics(actual, predicted):
    return {
        "MAE": round(float(mean_absolute_error(actual, predicted)), 2),
        "RMSE": round(
            float(np.sqrt(mean_squared_error(actual, predicted))), 2
        ),
    }


def main():
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Dataset not found: {DATA_PATH}")

    monthly = load_monthly_sales()
    featured = create_features(monthly)

    # Hold out the latest 12 months for chronological testing.
    test_size = 12

    if len(featured) <= test_size:
        raise ValueError("Not enough monthly data for a 12-month test.")

    train = featured.iloc[:-test_size]
    test = featured.iloc[-test_size:]

    feature_columns = [
        column for column in featured.columns if column != TARGET
    ]

    X_train = train[feature_columns]
    y_train = train[TARGET]
    X_test = test[feature_columns]
    y_test = test[TARGET]

    # Baseline: predict each month using the previous month's sales.
    baseline_predictions = test["sales_lag_1"].to_numpy()

    model = RandomForestRegressor(
        n_estimators=400,
        max_depth=6,
        min_samples_leaf=2,
        random_state=42,
    )

    model.fit(X_train, y_train)
    predictions = model.predict(X_test)

    baseline_metrics = calculate_metrics(y_test, baseline_predictions)
    model_metrics = calculate_metrics(y_test, predictions)

    # Save test-set predictions
    comparison = pd.DataFrame({
        "Month": test.index.strftime("%Y-%m"),
        "Actual_Sales": y_test.to_numpy(),
        "Baseline_Prediction": baseline_predictions,
        "Model_Prediction": predictions,
    })

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    comparison_path = OUTPUT_DIR / "forecast_test_results.csv"
    comparison.to_csv(comparison_path, index=False)

    # Refit on all available historical months for future forecasting.
    model.fit(featured[feature_columns], featured[TARGET])

    model_path = MODEL_DIR / "sales_forecast_model.joblib"
    joblib.dump(
        {
            "model": model,
            "features": feature_columns,
            "lags": LAGS,
        },
        model_path,
    )

    # Recursive forecast for the next 3 months.
    history = monthly.copy()
    future_rows = []

    for _ in range(3):
        next_month = history.index[-1] + pd.offsets.MonthBegin(1)
        values = {
            "month_number": next_month.month,
            "quarter": next_month.quarter,
            "year": next_month.year,
            "time_index": len(history),
        }

        for lag in LAGS:
            values[f"sales_lag_{lag}"] = float(history.iloc[-lag])

        values["rolling_mean_3"] = float(history.iloc[-3:].mean())
        values["rolling_mean_6"] = float(history.iloc[-6:].mean())

        row = pd.DataFrame([values], columns=feature_columns)
        forecast = max(0.0, float(model.predict(row)[0]))

        history.loc[next_month] = forecast
        future_rows.append({
            "Month": next_month.strftime("%Y-%m"),
            "Forecast_Sales": round(forecast, 2),
        })

    future_path = OUTPUT_DIR / "sales_forecast_next_3_months.csv"
    pd.DataFrame(future_rows).to_csv(future_path, index=False)

    # Save metrics for later dashboard integration.
    metrics = {
        "training_months": int(len(train)),
        "test_months": int(len(test)),
        "baseline": baseline_metrics,
        "random_forest": model_metrics,
    }

    metrics_path = OUTPUT_DIR / "forecast_metrics.json"
    metrics_path.write_text(json.dumps(metrics, indent=2), encoding="utf-8")

    print("\n" + "=" * 55)
    print("MONTHLY SALES FORECASTING RESULTS")
    print("=" * 55)

    print(f"Historical months: {len(monthly)}")
    print(f"Training samples: {len(train)}")
    print(f"Testing samples: {len(test)}")

    print("\nBaseline metrics (previous month's sales):")
    print(json.dumps(baseline_metrics, indent=2))

    print("\nRandom Forest metrics:")
    print(json.dumps(model_metrics, indent=2))

    if model_metrics["MAE"] < baseline_metrics["MAE"]:
        print("\nThe model improved MAE over the baseline.")
    else:
        print("\nThe model did not improve MAE over the baseline.")

    print("\nTest-set predictions:")
    print(comparison.round(2).to_string(index=False))

    print("\nNext 3 months:")
    print(pd.DataFrame(future_rows).to_string(index=False))

    print(f"\nSaved model: {model_path}")
    print(f"Saved test results: {comparison_path}")
    print(f"Saved forecasts: {future_path}")
    print(f"Saved metrics: {metrics_path}")


if __name__ == "__main__":
    main()