const transactions = JSON.parse(localStorage.getItem("transactions")) || [];

let pieChart, barChart, lineChart, balanceChart;

/* ==============================
   COMMON CHART OPTIONS (FIX TEXT CUT)
============================== */

const commonOptions = {
    responsive: true,
    maintainAspectRatio: false, // prevents cutting
    layout: { padding: 30 },
    plugins: {
        legend: { position: "top" }
    }
};

/* ==============================
   GROUP DATA BY TIME
============================== */

function groupByTime(type) {
    let result = {};

    transactions.forEach(t => {
        if (t.type !== "expense") return;

        const d = new Date(t.date);
        let key;

        if (type === "daily") {
            key = d.toISOString().split("T")[0];
        }
        else if (type === "weekly") {
            const week = Math.ceil(d.getDate() / 7);
            key = `${d.getFullYear()}-${d.getMonth()+1} W${week}`;
        }
        else { // monthly
            key = `${d.getFullYear()}-${d.getMonth()+1}`;
        }

        result[key] = (result[key] || 0) + Number(t.amount);
    });

    return result;
}

/* ==============================
   CATEGORY DATA
============================== */

function getCategoryData() {
    let categoryTotals = {};

    transactions.forEach(t => {
        if (t.type === "expense") {
            categoryTotals[t.category] =
                (categoryTotals[t.category] || 0) + Number(t.amount);
        }
    });

    return {
        labels: Object.keys(categoryTotals),
        values: Object.values(categoryTotals)
    };
}

/* ==============================
   BALANCE DATA (RUNNING BALANCE)
============================== */

function getBalanceData() {
    let sorted = [...transactions].sort(
        (a,b) => new Date(a.date) - new Date(b.date)
    );

    let balance = 0;
    let labels = [];
    let values = [];

    sorted.forEach(t => {
        if (t.type === "income") balance += Number(t.amount);
        else balance -= Number(t.amount);

        labels.push(t.date);
        values.push(balance);
    });

    return { labels, values };
}

/* ==============================
   DRAW ALL CHARTS
============================== */

function drawCharts(timeType="monthly") {

    /* ----- CATEGORY CHARTS ----- */
    const {labels, values} = getCategoryData();

    if (pieChart) pieChart.destroy();
    if (barChart) barChart.destroy();
    if (lineChart) lineChart.destroy();
    if (balanceChart) balanceChart.destroy();

    // PIE CHART
    const pieCanvas = document.getElementById("pieChart");
    if (pieCanvas) {
        pieChart = new Chart(pieCanvas, {
            type: "pie",
            data: {
                labels: labels,
                datasets: [{ data: values }]
            },
            options: {
                ...commonOptions,
                aspectRatio: 1 // perfect circle
            }
        });
    }

    // BAR CHART
    const barCanvas = document.getElementById("barChart");
    if (barCanvas) {
        barChart = new Chart(barCanvas, {
            type: "bar",
            data: {
                labels: labels,
                datasets: [{
                    label: "Expense Amount",
                    data: values
                }]
            },
            options: commonOptions
        });
    }

    /* ----- TIME TREND CHART ----- */

    const grouped = groupByTime(timeType);

    const lineCanvas = document.getElementById("lineChart");
    if (lineCanvas) {
        lineChart = new Chart(lineCanvas, {
            type: "line",
            data: {
                labels: Object.keys(grouped),
                datasets: [{
                    label: `${timeType} Expense`,
                    data: Object.values(grouped),
                    fill: false,
                    tension: 0.3
                }]
            },
            options: commonOptions
        });
    }

    /* ----- BALANCE CHART ----- */

    const balanceData = getBalanceData();

    const balanceCanvas = document.getElementById("balanceChart");
    if (balanceCanvas) {
        balanceChart = new Chart(balanceCanvas, {
            type: "line",
            data: {
                labels: balanceData.labels,
                datasets: [{
                    label: "Total Balance",
                    data: balanceData.values,
                    fill: false,
                    tension: 0.3
                }]
            },
            options: commonOptions
        });
    }
}

/* ==============================
   FILTER CHANGE EVENT
============================== */

const filter = document.getElementById("timeFilter");

if (filter) {
    filter.addEventListener("change", () => {
        drawCharts(filter.value);
    });
}

/* ==============================
   INITIAL LOAD
============================== */

drawCharts("monthly");
