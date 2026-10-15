-- 1. Overall business performance
SELECT
    ROUND(SUM(Sales), 2) AS total_sales,
    ROUND(SUM(Profit), 2) AS total_profit,
    ROUND(SUM(Profit) * 100.0 / SUM(Sales), 2) AS profit_margin_pct,
    COUNT(DISTINCT Order_ID) AS total_orders,
    COUNT(DISTINCT Customer_ID) AS unique_customers
FROM superstore;

-- 2. Monthly sales and profit trends
SELECT
    Year_Month,
    ROUND(SUM(Sales), 2) AS monthly_sales,
    ROUND(SUM(Profit), 2) AS monthly_profit
FROM superstore
GROUP BY Year_Month
ORDER BY Year_Month;

-- 3. Sales and profit by product category
SELECT
    Category,
    ROUND(SUM(Sales), 2) AS total_sales,
    ROUND(SUM(Profit), 2) AS total_profit
FROM superstore
GROUP BY Category
ORDER BY total_sales DESC;

-- 4. Most profitable sub-categories
SELECT
    "Sub-Category" AS Sub_Category,
    ROUND(SUM(Sales), 2) AS total_sales,
    ROUND(SUM(Profit), 2) AS total_profit
FROM superstore
GROUP BY "Sub-Category"
ORDER BY total_profit DESC
LIMIT 10;

-- 5. Regional performance
SELECT
    Region,
    ROUND(SUM(Sales), 2) AS total_sales,
    ROUND(SUM(Profit), 2) AS total_profit
FROM superstore
GROUP BY Region
ORDER BY total_sales DESC;

-- 6. Discount impact
SELECT
    CASE
        WHEN Discount = 0 THEN 'No discount'
        WHEN Discount <= 0.20 THEN 'Low discount'
        WHEN Discount <= 0.40 THEN 'Medium discount'
        ELSE 'High discount'
    END AS discount_band,
    COUNT(*) AS order_lines,
    ROUND(SUM(Sales), 2) AS total_sales,
    ROUND(SUM(Profit), 2) AS total_profit,
    ROUND(AVG(Profit), 2) AS average_profit_per_line
FROM superstore
GROUP BY discount_band
ORDER BY discount_band;