const form = document.getElementById("expenseForm");
const list = document.getElementById("transactionList");
const summaryDiv = document.getElementById("summary");

let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let budget = localStorage.getItem("budget") || 0;
let editId = null;
let pieChart = null;

// Save
function saveData() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
}

// Budget
function setBudget() {
    budget = document.getElementById("budgetInput").value;
    localStorage.setItem("budget", budget);
    updateSummary();
}

// Add / Update transaction
form.addEventListener("submit", function(e) {
    e.preventDefault();

    const desc = document.getElementById("desc").value;
    const amount = parseFloat(document.getElementById("amount").value);
    const type = document.getElementById("type").value;
    const category = document.getElementById("category").value;
    const date = document.getElementById("date").value;

    if(editId) {
        // Update transaction
        transactions = transactions.map(t =>
            t.id === editId
            ? { ...t, desc, amount, type, category, date }
            : t
        );
        editId = null;
    } else {
        // Add transaction
        transactions.push({
            id: Date.now(),
            desc,
            amount,
            type,
            category,
            date
        });
    }

    saveData();
    displayTransactions();
    updateSummary();
    drawChart();
    form.reset();
});


// Display transactions
function displayTransactions() {
    list.innerHTML = "";

    transactions.forEach(t => {
        const li = document.createElement("li");
        li.innerHTML = `
        <span>
            ${t.desc} (${t.category}) | ${t.date} -
            <span class="${t.type === 'income' ? 'amount-income' : 'amount-expense'}">
                ₹${t.amount}
            </span>
        </span>

    <span>
        <button class="small-btn" onclick="editTransaction(${t.id})">✏️</button>
        <button class="small-btn" onclick="deleteTransaction(${t.id})">❌</button>
    </span>
`;


        list.appendChild(li);
    });
}

// Edit transaction
function editTransaction(id) {
    const t = transactions.find(t => t.id === id);

    document.getElementById("desc").value = t.desc;
    document.getElementById("amount").value = t.amount;
    document.getElementById("type").value = t.type;
    document.getElementById("category").value = t.category;
    document.getElementById("date").value = t.date;

    editId = id;
}


// Delete transaction
function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveData();
    displayTransactions();
    updateSummary();
    drawChart();
}

// Monthly summary + budget alert
function updateSummary() {
    let income = 0, expense = 0;

    const month = new Date().getMonth();
    const year = new Date().getFullYear();

    transactions.forEach(t => {
        const d = new Date(t.date);
        if(d.getMonth() === month && d.getFullYear() === year) {
            if(t.type === "income") income += t.amount;
            else expense += t.amount;
        }
    });

    const balance = income - expense;

    let alertMsg = "";
    if(budget && expense > budget) {
        alertMsg = `<p class="warning">⚠ Budget exceeded!</p>`;
    }

    summaryDiv.innerHTML = `
        Income: ₹${income}<br>
        Expense: ₹${expense}<br>
        Balance: ₹${balance}<br>
        Budget: ₹${budget || 0}
        ${alertMsg}
    `;
}

// Pie Chart
function drawChart() {
    let categories = {};

    transactions.forEach(t => {
        if(t.type === "expense") {
            categories[t.category] = (categories[t.category] || 0) + t.amount;
        }
    });

    const data = {
        labels: Object.keys(categories),
        datasets: [{
            data: Object.values(categories)
        }]
    };

    if(pieChart) pieChart.destroy();

    pieChart = new Chart(document.getElementById("pieChart"), {
        type: "pie",
        data: data
    });
}

// Initial load
displayTransactions();
updateSummary();
drawChart();
