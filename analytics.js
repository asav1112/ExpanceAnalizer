/* =====================================================
   APP STATE
===================================================== */

const transactions =
    JSON.parse(localStorage.getItem("transactions")) || [];

let pieChart, barChart, balanceChart;

// Current viewing date (changes when arrows clicked)
let currentDate = new Date();


/* =====================================================
   DOM
===================================================== */

const periodText = document.getElementById("currentPeriod");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");


/* =====================================================
   CHART SETTINGS
===================================================== */

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: 30 },
    plugins: { legend: { position: "top" } }
};


/* =====================================================
   PERIOD NAVIGATION
===================================================== */

function updatePeriodText(type="monthly") {

    if (!periodText) return;

    if(type === "daily")
        periodText.textContent = currentDate.toDateString();

    else if(type === "weekly") {
        const start = new Date(currentDate);
        start.setDate(currentDate.getDate() - 6);
        periodText.textContent =
            `${start.toDateString()} → ${currentDate.toDateString()}`;
    }

    else {
        periodText.textContent =
            currentDate.toLocaleString("default", {
                month: "long",
                year: "numeric"
            });
    }
}

// Previous
prevBtn?.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderAllCharts();
});

// Next
nextBtn?.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderAllCharts();
});


/* =====================================================
   FILTER TRANSACTIONS BY PERIOD
===================================================== */

function filterByTime(type) {

    return transactions.filter(t => {

        const d = new Date(t.date);

        if(type === "daily")
            return d.toDateString() === currentDate.toDateString();

        if(type === "weekly") {
            const start = new Date(currentDate);
            start.setDate(currentDate.getDate() - 6);
            return d >= start && d <= currentDate;
        }

        // monthly
        return (
            d.getMonth() === currentDate.getMonth() &&
            d.getFullYear() === currentDate.getFullYear()
        );
    });
}


/* =====================================================
   CATEGORY TOTALS
===================================================== */

function getCategoryTotals(data) {

    const totals = {};

    data.forEach(t => {
        if(t.type === "expense") {
            totals[t.category] =
                (totals[t.category] || 0) + Number(t.amount);
        }
    });

    return {
        labels: Object.keys(totals),
        values: Object.values(totals)
    };
}


/* =====================================================
   CONTINUOUS BALANCE DATA
===================================================== */

function getBalanceData(type="monthly") {

    let start;

    if(type === "daily") start = new Date(currentDate);
    else if(type === "weekly") {
        start = new Date(currentDate);
        start.setDate(currentDate.getDate() - 6);
    }
    else start = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
    );

    const sorted = [...transactions].sort(
        (a,b)=> new Date(a.date)-new Date(b.date)
    );

    let balance = 0;
    const labels = [];
    const values = [];

    sorted.forEach(t => {
        if(new Date(t.date) < start)
            balance += t.type==="income"?+t.amount:-t.amount;
    });

    for(
        let d=new Date(start);
        d<=currentDate;
        d.setDate(d.getDate()+1)
    ){
        const dateStr = d.toISOString().split("T")[0];

        sorted.forEach(t=>{
            if(t.date===dateStr)
                balance+=t.type==="income"?+t.amount:-t.amount;
        });

        labels.push(dateStr);
        values.push(balance);
    }

    return {labels,values};
}


/* =====================================================
   DRAW CHARTS
===================================================== */

function drawPie(type="monthly") {

    if(pieChart) pieChart.destroy();

    const filtered = filterByTime(type);
    const {labels,values}=getCategoryTotals(filtered);

    pieChart=new Chart(
        document.getElementById("pieChart"),
        {type:"pie",data:{labels,datasets:[{data:values}]},
        options:{...chartOptions,aspectRatio:1}}
    );
}

function drawBar(type="monthly") {

    if(barChart) barChart.destroy();

    const filtered = filterByTime(type);
    const {labels,values}=getCategoryTotals(filtered);

    barChart=new Chart(
        document.getElementById("barChart"),
        {type:"bar",
        data:{labels,datasets:[{label:"Expense",data:values}]},
        options:chartOptions}
    );
}

function drawBalance(type="monthly") {

    if(balanceChart) balanceChart.destroy();

    const {labels,values}=getBalanceData(type);

    balanceChart=new Chart(
        document.getElementById("balanceChart"),
        {type:"line",
        data:{labels,datasets:[{label:"Total Balance",data:values,tension:0.3}]},
        options:chartOptions}
    );
}


/* =====================================================
   RADIO FILTER EVENTS
===================================================== */

let pieType="monthly";
let barType="monthly";
let balanceType="monthly";

document.querySelectorAll("input[name='pieTime']")
.forEach(r=>r.addEventListener("change",e=>{
    pieType=e.target.value;
    renderAllCharts();
}));

document.querySelectorAll("input[name='barTime']")
.forEach(r=>r.addEventListener("change",e=>{
    barType=e.target.value;
    renderAllCharts();
}));

document.querySelectorAll("input[name='balanceTime']")
.forEach(r=>r.addEventListener("change",e=>{
    balanceType=e.target.value;
    renderAllCharts();
}));


/* =====================================================
   MAIN RENDER
===================================================== */

function renderAllCharts(){
    updatePeriodText(pieType);
    drawPie(pieType);
    drawBar(barType);
    drawBalance(balanceType);
}


/* =====================================================
   INITIAL LOAD
===================================================== */

renderAllCharts();
