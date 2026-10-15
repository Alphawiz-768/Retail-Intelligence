
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Database,
  Download,
  LayoutDashboard,
  MapPin,
  Package,
  RefreshCw,
  ShoppingCart,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./App.css";

const API = "http://127.0.0.1:8000";

const money = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const compactMoney = (value) => {
  const n = Number(value) || 0;
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

const number = (value) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const first = (object, keys, fallback = 0) => {
  for (const key of keys) {
    if (object?.[key] !== undefined && object?.[key] !== null) {
      return object[key];
    }
  }
  return fallback;
};

const rowsFrom = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.results)) return value.results;
  if (Array.isArray(value?.items)) return value.items;
  return [];
};

const titleCase = (value) =>
  String(value ?? "").replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());

const formatMonth = (value) => {
  if (!value) return "";
  const date = new Date(`${String(value).slice(0, 7)}-01T00:00:00`);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
};

const COLORS = ["#8b7cff", "#45c8b0", "#f5b95c", "#f47d9b", "#6da9ff"];

function KpiCard({ label, value, detail, icon: Icon, accent }) {
  return (
    <article className="kpi-card">
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        <span className={`kpi-icon ${accent}`}>
          <Icon size={19} strokeWidth={1.8} />
        </span>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-detail">
        <span className="detail-dot" />
        {detail}
      </div>
    </article>
  );
}

function Panel({ title, subtitle, children, className = "" }) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function ChartEmpty({ message = "No chart data available yet." }) {
  return (
    <div className="chart-empty">
      <BarChart3 size={25} />
      <span>{message}</span>
    </div>
  );
}

function App() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError("");

    const endpoints = [
      ["overview", "/api/overview"],
      ["monthly", "/api/monthly-trends"],
      ["categories", "/api/categories"],
      ["regions", "/api/regions"],
      ["subcategories", "/api/subcategories"],
      ["discount", "/api/discount-impact"],
      ["forecast", "/api/forecast"],
    ];

    try {
      const results = await Promise.all(
        endpoints.map(async ([key, path]) => {
          const response = await fetch(`${API}${path}`);
          if (!response.ok) {
            throw new Error(`${path} returned HTTP ${response.status}`);
          }
          return [key, await response.json()];
        })
      );

      setData(Object.fromEntries(results));
      setLastUpdated(new Date());
    } catch (err) {
      setError(
        `Could not load dashboard data. Make sure your FastAPI backend is running at ${API}. ${err.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const overview = data.overview || {};

  const monthly = useMemo(
    () =>
      rowsFrom(data.monthly)
        .map((row) => ({
          month: formatMonth(
            first(row, ["month", "Month", "order_month", "date", "Order Date"], "")
          ),
          sales: Number(first(row, ["total_sales", "sales", "Sales", "sum_sales"], 0)),
          profit: Number(first(row, ["total_profit", "profit", "Profit", "sum_profit"], 0)),
          rawMonth: first(row, ["month", "Month", "order_month", "date"], ""),
        }))
        .filter((row) => row.month)
        .sort((a, b) => String(a.rawMonth).localeCompare(String(b.rawMonth))),
    [data.monthly]
  );

  const categories = useMemo(
    () =>
      rowsFrom(data.categories).map((row) => ({
        name: String(first(row, ["category", "Category", "name"], "Other")),
        sales: Number(first(row, ["total_sales", "sales", "Sales"], 0)),
        profit: Number(first(row, ["total_profit", "profit", "Profit"], 0)),
      })),
    [data.categories]
  );

  const regions = useMemo(
    () =>
      rowsFrom(data.regions).map((row) => ({
        name: String(first(row, ["region", "Region", "name"], "Other")),
        sales: Number(first(row, ["total_sales", "sales", "Sales"], 0)),
        profit: Number(first(row, ["total_profit", "profit", "Profit"], 0)),
      })),
    [data.regions]
  );

  const subcategories = useMemo(
    () =>
      rowsFrom(data.subcategories)
        .map((row) => ({
          name: String(
            first(row, ["Sub-Category", "sub_category", "subcategory", "name"], "Other")
          ),
          profit: Number(first(row, ["total_profit", "profit", "Profit"], 0)),
        }))
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 7),
    [data.subcategories]
  );

  const discountRows = useMemo(
    () =>
      rowsFrom(data.discount).map((row) => ({
        name: String(
          first(row, ["discount_band", "discount_level", "discount", "Discount"], "Discount")
        ),
        sales: Number(first(row, ["total_sales", "sales", "Sales"], 0)),
        profit: Number(first(row, ["total_profit", "profit", "Profit"], 0)),
      })),
    [data.discount]
  );

  // FIX: The API returns { forecast_type, forecast: [...], metrics: {...} }.
  // Each forecast row uses the exact keys Month and Forecast_Sales.
  const forecastPayload = data.forecast || {};

  const forecastRows = useMemo(() => {
    const rows = rowsFrom(
      forecastPayload.forecast ??
      forecastPayload.predictions ??
      forecastPayload.data ??
      forecastPayload
    );

    return rows.map((row) => ({
      month: first(row, ["Month", "month", "date"], ""),
      sales: Number(
        first(
          row,
          ["Forecast_Sales", "forecast_sales", "predicted_sales", "sales", "prediction"],
          0
        )
      ),
    }));
  }, [forecastPayload]);

  // FIX: The API nests model scores under metrics.random_forest.MAE and RMSE.
  const metrics = forecastPayload.metrics || {};
  const rfMetrics = metrics.random_forest || {};
  const baselineMetrics = metrics.baseline || {};

  const totalSales = Number(first(overview, ["total_sales", "sales"], 0));
  const totalProfit = Number(first(overview, ["total_profit", "profit"], 0));
  const margin = Number(
    first(
      overview,
      ["profit_margin_pct", "profit_margin", "margin_pct"],
      totalSales ? (totalProfit / totalSales) * 100 : 0
    )
  );
  const orders = Number(first(overview, ["total_orders", "orders", "order_count"], 0));
  const customers = Number(
    first(overview, ["unique_customers", "customers", "customer_count"], 0)
  );

  const bestCategory = [...categories].sort((a, b) => b.sales - a.sales)[0];
  const bestRegion = [...regions].sort((a, b) => b.sales - a.sales)[0];
  const bestSubcategory = subcategories[0];
  const worstDiscount = [...discountRows].sort((a, b) => a.profit - b.profit)[0];

  const downloadData = () => {
    const rows = [
      ["Metric", "Value"],
      ["Total Sales", totalSales],
      ["Total Profit", totalProfit],
      ["Profit Margin (%)", margin],
      ["Orders", orders],
      ["Unique Customers", customers],
    ];

    const csv = rows.map((row) => row.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "retail-intelligence-summary.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <BarChart3 size={23} />
          </div>
          <div className="brand-copy">
            <strong>RetailIQ</strong>
            <span>INTELLIGENCE PLATFORM</span>
          </div>
        </div>

        <div className="side-label">WORKSPACE</div>
        <nav className="side-nav">
          <a className="nav-link active" href="#overview">
            <LayoutDashboard size={18} /> Overview
          </a>
          <a className="nav-link" href="#sales">
            <Activity size={18} /> Sales analytics
          </a>
          <a className="nav-link" href="#products">
            <Package size={18} /> Product performance
          </a>
          <a className="nav-link" href="#forecast">
            <Sparkles size={18} /> Forecasting
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="data-status">
            <span className="status-indicator" />
            <div>
              <strong>Local data source</strong>
              <span>SQLite · FastAPI</span>
            </div>
          </div>
          <div className="sidebar-footnote">RETAIL INTELLIGENCE · PROJECT</div>
        </div>
      </aside>

      <section className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <span className="breadcrumb-separator">/</span>
            <strong>Overview</strong>
          </div>
          <div className="topbar-actions">
            <div className="date-chip">
              <CalendarDays size={15} />
              Historical dataset · 2014–2017
            </div>
            <button className="icon-button" onClick={loadDashboard} title="Refresh data">
              <RefreshCw size={17} className={loading ? "spin" : ""} />
            </button>
            <button className="export-button" onClick={downloadData}>
              <Download size={16} /> Export summary
            </button>
          </div>
        </header>

        <div className="page-content" id="overview">
          <div className="page-title-row">
            <div>
              <div className="eyebrow"><span /> BUSINESS PERFORMANCE</div>
              <h1>Retail overview</h1>
              <p className="page-subtitle">
                A unified view of sales, profitability, products, and forecasting.
              </p>
            </div>
            <div className="updated-label">
              <span className="live-dot" />
              {lastUpdated
                ? `Updated ${lastUpdated.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : "Connecting to API"}
            </div>
          </div>

          {error && (
            <div className="error-banner">
              <AlertCircle size={19} />
              <div>
                <strong>Backend connection issue</strong>
                <p>{error}</p>
                <button onClick={loadDashboard}>Try again</button>
              </div>
            </div>
          )}

          {loading && !data.overview ? (
            <div className="loading-card">
              <RefreshCw size={23} className="spin" />
              <strong>Loading your retail analytics</strong>
              <span>Fetching metrics and charts from the local API…</span>
            </div>
          ) : (
            <>
              <div className="section-heading">
                <div>
                  <h2>Performance snapshot</h2>
                  <p>Key metrics across the complete dataset</p>
                </div>
                <span className="section-tag"><Database size={14} /> 9,994 records</span>
              </div>

              <div className="kpi-grid">
                <KpiCard label="Total sales" value={money(totalSales)} detail="All recorded sales" icon={CircleDollarSign} accent="purple" />
                <KpiCard label="Total profit" value={money(totalProfit)} detail="Net recorded profit" icon={Wallet} accent="green" />
                <KpiCard label="Profit margin" value={`${margin.toFixed(2)}%`} detail="Profit as a share of sales" icon={Activity} accent="amber" />
                <KpiCard label="Orders" value={number(orders)} detail="Distinct order IDs" icon={ShoppingCart} accent="blue" />
                <KpiCard label="Customers" value={number(customers)} detail="Unique customer IDs" icon={Users} accent="pink" />
              </div>

              <div className="chart-grid" id="sales">
                <Panel title="Sales & profit trend" subtitle="Monthly performance over the dataset period" className="large-panel">
                  {monthly.length ? (
                    <div className="chart-wrap trend-chart">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthly} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#8b7cff" stopOpacity={0.28} />
                              <stop offset="100%" stopColor="#8b7cff" stopOpacity={0.01} />
                            </linearGradient>
                            <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#45c8b0" stopOpacity={0.22} />
                              <stop offset="100%" stopColor="#45c8b0" stopOpacity={0.01} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#28303f" />
                          <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "#8993a7", fontSize: 11 }} minTickGap={25} />
                          <YAxis tickFormatter={compactMoney} tickLine={false} axisLine={false} width={58} tick={{ fill: "#8993a7", fontSize: 11 }} />
                          <Tooltip contentStyle={{ background: "#171e2b", border: "1px solid #30394b", borderRadius: 12, color: "#f5f6fa" }} formatter={(value, name) => [money(value), titleCase(name)]} />
                          <Legend iconType="circle" wrapperStyle={{ color: "#aab2c2", fontSize: 12, paddingTop: 14 }} />
                          <Area type="monotone" dataKey="sales" name="Sales" stroke="#9b8cff" strokeWidth={2.5} fill="url(#salesGradient)" />
                          <Area type="monotone" dataKey="profit" name="Profit" stroke="#45c8b0" strokeWidth={2.2} fill="url(#profitGradient)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <ChartEmpty message="Monthly trend data was not returned by the API." />}
                </Panel>

                <Panel title="Sales by category" subtitle="Revenue contribution">
                  {categories.length ? (
                    <>
                      <div className="chart-wrap donut-chart">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={categories} dataKey="sales" nameKey="name" innerRadius="62%" outerRadius="83%" paddingAngle={4} stroke="none">
                              {categories.map((entry, index) => (
                                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => money(value)} contentStyle={{ background: "#171e2b", border: "1px solid #30394b", borderRadius: 12 }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="donut-center">
                          <span>TOTAL SALES</span>
                          <strong>{compactMoney(totalSales)}</strong>
                        </div>
                      </div>
                      <div className="category-legend">
                        {categories.map((category, index) => (
                          <div className="legend-row" key={category.name}>
                            <span className="legend-name"><i style={{ background: COLORS[index % COLORS.length] }} />{category.name}</span>
                            <strong>{compactMoney(category.sales)}</strong>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : <ChartEmpty message="Category data is not available." />}
                </Panel>
              </div>

              <div className="chart-grid second-grid" id="products">
                <Panel title="Regional performance" subtitle="Sales by geographic region">
                  {regions.length ? (
                    <div className="chart-wrap region-chart">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={regions} layout="vertical" margin={{ top: 4, right: 12, left: 10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 5" horizontal={false} stroke="#28303f" />
                          <XAxis type="number" tickFormatter={compactMoney} tickLine={false} axisLine={false} tick={{ fill: "#8993a7", fontSize: 10 }} />
                          <YAxis type="category" dataKey="name" width={65} tickLine={false} axisLine={false} tick={{ fill: "#b6becc", fontSize: 12 }} />
                          <Tooltip formatter={(value) => money(value)} contentStyle={{ background: "#171e2b", border: "1px solid #30394b", borderRadius: 12 }} />
                          <Bar dataKey="sales" name="Sales" fill="#8b7cff" radius={[0, 6, 6, 0]} barSize={22} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <ChartEmpty message="Regional data is not available." />}
                </Panel>

                <Panel title="Most profitable subcategories" subtitle="Ranked by recorded profit">
                  {subcategories.length ? (
                    <div className="rank-list">
                      {subcategories.map((item, index) => {
                        const max = Math.max(...subcategories.map((x) => Math.abs(x.profit)), 1);
                        return (
                          <div className="rank-item" key={item.name}>
                            <span className="rank-number">{String(index + 1).padStart(2, "0")}</span>
                            <div className="rank-main">
                              <div className="rank-label">
                                <span>{item.name}</span>
                                <strong className={item.profit < 0 ? "negative" : ""}>{money(item.profit)}</strong>
                              </div>
                              <div className="rank-track"><span style={{ width: `${Math.max(3, (Math.abs(item.profit) / max) * 100)}%` }} /></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : <ChartEmpty message="Subcategory data is not available." />}
                </Panel>
              </div>

              <div className="insight-grid">
                <div className="insight-card">
                  <div className="insight-icon purple"><ArrowUpRight size={19} /></div>
                  <div className="insight-content">
                    <span>TOP SALES CATEGORY</span>
                    <strong>{bestCategory?.name || "—"}</strong>
                    <p>{bestCategory ? `${money(bestCategory.sales)} in recorded sales` : "Category data unavailable"}</p>
                  </div>
                </div>
                <div className="insight-card">
                  <div className="insight-icon green"><MapPin size={19} /></div>
                  <div className="insight-content">
                    <span>LEADING REGION</span>
                    <strong>{bestRegion?.name || "—"}</strong>
                    <p>{bestRegion ? `${money(bestRegion.sales)} in recorded sales` : "Regional data unavailable"}</p>
                  </div>
                </div>
                <div className="insight-card">
                  <div className="insight-icon amber"><Package size={19} /></div>
                  <div className="insight-content">
                    <span>TOP PROFIT SUBCATEGORY</span>
                    <strong>{bestSubcategory?.name || "—"}</strong>
                    <p>{bestSubcategory ? `${money(bestSubcategory.profit)} in recorded profit` : "Subcategory data unavailable"}</p>
                  </div>
                </div>
              </div>

              <div className="chart-grid lower-grid">
                <Panel title="Discount impact" subtitle="Recorded profit across discount groups">
                  {discountRows.length ? (
                    <div className="chart-wrap discount-chart">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={discountRows} margin={{ top: 10, right: 6, left: 0, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#28303f" />
                          <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#aab2c2", fontSize: 11 }} />
                          <YAxis tickFormatter={compactMoney} tickLine={false} axisLine={false} width={58} tick={{ fill: "#8993a7", fontSize: 10 }} />
                          <Tooltip formatter={(value) => money(value)} contentStyle={{ background: "#171e2b", border: "1px solid #30394b", borderRadius: 12 }} />
                          <Bar dataKey="profit" name="Profit" radius={[5, 5, 0, 0]} barSize={38}>
                            {discountRows.map((row, index) => <Cell key={`${row.name}-${index}`} fill={row.profit < 0 ? "#f47d9b" : "#45c8b0"} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <ChartEmpty message="Discount impact data is not available." />}
                  {worstDiscount && (
                    <div className="panel-note">
                      <AlertCircle size={15} />
                      Lowest-profit group: <strong>{worstDiscount.name}</strong> ({money(worstDiscount.profit)}).
                      <span> This is an association, not proof that discounts caused the result.</span>
                    </div>
                  )}
                </Panel>

                <Panel title="Sales forecast" subtitle="Model output based on historical data">
                  <div className="forecast-badge"><Sparkles size={14} /> HISTORICAL BACKDATED FORECAST</div>

                  {forecastRows.length ? (
                    <div className="forecast-list">
                      {forecastRows.map((row, index) => (
                        <div className="forecast-row" key={`${row.month}-${index}`}>
                          <div className="forecast-month">
                            <CalendarDays size={16} />
                            <span>{row.month}</span>
                          </div>
                          <strong>{money(row.sales)}</strong>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="forecast-empty">
                      <div className="forecast-symbol"><Sparkles size={22} /></div>
                      <strong>Forecast data unavailable</strong>
                      <p>The forecast endpoint returned no forecast rows.</p>
                    </div>
                  )}

                  <div className="model-info">
                    <div>
                      <span>Model</span>
                      <strong>Random Forest</strong>
                    </div>
                    <div>
                      <span>Random Forest test MAE</span>
                      <strong>{rfMetrics.MAE !== undefined ? money(rfMetrics.MAE) : "Unavailable"}</strong>
                    </div>
                    <div>
                      <span>Random Forest test RMSE</span>
                      <strong>{rfMetrics.RMSE !== undefined ? money(rfMetrics.RMSE) : "Unavailable"}</strong>
                    </div>
                    <div>
                      <span>Baseline test MAE</span>
                      <strong>{baselineMetrics.MAE !== undefined ? money(baselineMetrics.MAE) : "Unavailable"}</strong>
                    </div>
                  </div>

                  <p className="forecast-disclaimer">
                    The dataset ends in 2017. These are historical model forecasts for January–March 2018, not current predictions.
                    Evaluation uses a 12-month chronological test period; results should be interpreted cautiously given the limited history.
                  </p>
                </Panel>
              </div>
            </>
          )}

          <footer className="page-footer">
            <div><CheckCircle2 size={15} /> Retail Intelligence &amp; Sales Forecasting Platform</div>
            <span>Built with Python · SQL · FastAPI · React</span>
          </footer>
        </div>
      </section>
    </main>
  );
}

export default App;
