# Retail Intelligence & Sales Forecasting Platform

A full-stack retail analytics platform that transforms historical sales data into business insights through data cleaning, SQL analytics, interactive visualizations, and machine learning-based sales forecasting.

## Overview

This project analyzes the Sample Superstore retail dataset to understand sales performance, profitability, regional trends, product performance, and the relationship between discount levels and profit.

The platform combines a Python data pipeline, SQLite analytics, a FastAPI backend, a React dashboard, and a Random Forest forecasting model.

## Features

- **Data cleaning:** Prepare and validate the raw retail dataset using Pandas.
- **SQL analytics:** Query business KPIs, monthly trends, category performance, regional results, profitable subcategories, and discount impact.
- **Interactive dashboard:** Explore sales, profit, customers, orders, categories, regions, and product performance.
- **Sales forecasting:** Train a Random Forest regression model and evaluate it against a baseline.
- **REST API:** Serve analytics and forecast results through FastAPI endpoints.
- **Local-first setup:** Run the application locally without paid APIs.

## Technology Stack

| Layer | Technologies |
|---|---|
| Data processing | Python, Pandas, NumPy |
| Database | SQLite, SQL |
| Machine learning | Scikit-learn, Random Forest |
| Backend | FastAPI, Uvicorn |
| Frontend | React, Vite, Recharts, Lucide React |
| Version control | Git, GitHub |

## Key Results

The following results were calculated from the historical dataset used in this project.

| Metric | Result |
|---|---:|
| Total sales | $2,297,200.86 |
| Total profit | $286,397.02 |
| Profit margin | 12.47% |
| Orders | 5,009 |
| Unique customers | 793 |
| Cleaned records | 9,994 |

### Forecast Model Evaluation

The Random Forest model was evaluated on a chronological 12-month test period.

| Metric | Baseline | Random Forest |
|---|---:|---:|
| Mean Absolute Error (MAE) | $24,148.23 | $13,042.55 |
| Root Mean Squared Error (RMSE) | $28,048.46 | $15,754.59 |

The Random Forest achieved a lower MAE than the baseline on this test period. These results are preliminary because the dataset covers only four years and the evaluation period is limited.

### Historical Forecast Output

| Month | Forecast sales |
|---|---:|
| January 2018 | $46,407.36 |
| February 2018 | $40,810.09 |
| March 2018 | $67,706.60 |

**Important:** These are historical backdated forecasts based on a dataset ending in 2017. They are not forecasts for the current year.

## Project Structure

```text
Retail-Intelligence/
├── backend/
│   ├── api/
│   ├── models/
│   ├── services/
│   ├── clean_data.py
│   ├── create_database.py
│   ├── forecast_sales.py
│   ├── inspect_data.py
│   ├── main.py
│   └── run_analytics.py
├── data/
│   ├── raw/
│   ├── processed/
│   └── models/
├── frontend/
│   ├── src/
│   └── package.json
├── sql/
│   └── analytics.sql
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

Install the following before running the project:

- Python
- Node.js and npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Alphawiz-768/Retail-Intelligence.git
cd Retail-Intelligence
```

### 2. Set up the Python environment

On Windows PowerShell:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install pandas numpy scikit-learn fastapi "uvicorn[standard]" python-multipart sqlalchemy "psycopg[binary]" joblib
```

### 3. Prepare the dataset

Place the Sample Superstore CSV at:

```text
data/raw/superstore.csv
```

Run the data pipeline from the project root:

```powershell
python backend/inspect_data.py
python backend/clean_data.py
python backend/create_database.py
python backend/run_analytics.py
python backend/forecast_sales.py
```

Run these steps in order so that the cleaned data, database, analytics outputs, and forecasting artifacts are generated before starting the API.

### 4. Start the backend

From the project root, with the virtual environment activated:

```powershell
uvicorn backend.main:app --reload
```

API documentation:

http://127.0.0.1:8000/docs

### 5. Start the frontend

Open a second terminal:

```powershell
cd frontend
npm install
npm install recharts lucide-react
npm run dev
```

Open the local URL printed by Vite, normally:

http://localhost:5173/

## API Endpoints

| Endpoint | Purpose |
|---|---|
| `/` | Backend health check |
| `/api/overview` | Main business KPIs |
| `/api/monthly-trends` | Monthly sales and profit |
| `/api/categories` | Category performance |
| `/api/regions` | Regional performance |
| `/api/subcategories` | Subcategory profitability |
| `/api/discount-impact` | Profit by discount group |
| `/api/forecast` | Historical forecast and evaluation metrics |

## Analytical Considerations

- Discount-group results show an association and do not establish that discounts caused changes in profit.
- Forecast performance is measured on a chronological holdout rather than a random split.
- The limited historical dataset means model performance should not be assumed to generalize to current retail conditions.
- Dataset and generated artifacts are kept out of version control by default and must be prepared locally before running the full pipeline.

## Future Improvements

- Add date, category, and region filters.
- Improve time-series validation and compare additional forecasting models.
- Add automated tests for data processing and API endpoints.
- Add dashboard screenshots and a reproducible sample-data workflow.

## Author

**Alphawiz-768**

GitHub: https://github.com/Alphawiz-768

---

*Built as a retail analytics and machine learning portfolio project.*
