/* =====================================================
   DOM ELEMENTS
===================================================== */

const form = document.getElementById("expenseForm");
const list = document.getElementById("transactionList");
const summaryDiv = document.getElementById("summary");

const notificationPanel = document.getElementById("notificationPanel");
const notificationList = document.getElementById("notificationList");
const bellBtn = document.getElementById("bellBtn");

const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");
const monthText = document.getElementById("currentMonthText");
const totalBalanceEl = document.getElementById("totalBalance");


/* =====================================================
   APP STATE (LOCAL STORAGE)
===================================================== */

let transactions =
    JSON.parse(localStorage.getItem("transactions")) || [];

let budget =
    Number(localStorage.getItem("budget")) || 0;

let minBalance =
    Number(localStorage.getItem("minBalance")) || 0;

let notifications =
    JSON.parse(localStorage.getItem("notifications")) || [];

let editId = null;

/* alert states */
let budgetAlertShown =
    localStorage.getItem("budgetAlertShown") === "true";

let minBalanceAlertShown =
    localStorage.getItem("minBalanceAlertShown") === "true";

/* selected month for summary */
let summaryDate = new Date();


/* =====================================================
   TOTAL ACCOUNT BALANCE
===================================================== */

function updateTotalBalance() {
    if (!totalBalanceEl) return;

    let total = 0;

    transactions.forEach(t => {
        if (t.type === "income") total += Number(t.amount);
        else total -= Number(t.amount);
    });

    totalBalanceEl.textContent = `₹${total}`;

    totalBalanceEl.classList.remove("balance-good", "balance-low");

    if (minBalance && total < minBalance)
        totalBalanceEl.classList.add("balance-low");
    else
        totalBalanceEl.classList.add("balance-good");
}


/* =====================================================
   NOTIFICATION SYSTEM
===================================================== */

bellBtn?.addEventListener("click", () => {
    notificationPanel?.classList.toggle("open");
});

function saveNotifications() {
    localStorage.setItem("notifications", JSON.stringify(notifications));
}

function addNotification(message) {
    notifications.unshift({
        text: message,
        time: new Date().toLocaleString()
    });

    saveNotifications();
    renderNotifications();
}

function deleteNotification(index) {
    notifications.splice(index, 1);
    saveNotifications();
    renderNotifications();
}

function renderNotifications() {
    if (!notificationList) return;

    notificationList.innerHTML = "";

    notifications.forEach((n, index) => {
        const li = document.createElement("li");

        li.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong>${n.text}</strong><br>
                    <small>${n.time}</small>
                </div>
                <button class="delete-noti-btn"
                    onclick="deleteNotification(${index})">❌</button>
            </div>
        `;

        notificationList.appendChild(li);
    });
}


/* =====================================================
   STORAGE HELPERS
===================================================== */

function saveData() {
    localStorage.setItem("transactions", JSON.stringify(transactions));
}

function setBudget() {
    budget = Number(document.getElementById("budgetInput").value);
    localStorage.setItem("budget", budget);
    updateSummary();
    updateTotalBalance();
}

function setMinBalance() {
    minBalance = Number(document.getElementById("minBalanceInput").value);
    localStorage.setItem("minBalance", minBalance);
    updateSummary();
    updateTotalBalance();
}


/* =====================================================
   TRANSACTION CRUD
===================================================== */

form?.addEventListener("submit", (e) => {
    e.preventDefault();

    const desc = document.getElementById("desc").value;
    const amount = parseFloat(document.getElementById("amount").value);
    const type = document.getElementById("type").value;
    const category = document.getElementById("category").value;
    const date = document.getElementById("date").value;

    if (editId) {
        transactions = transactions.map(t =>
            t.id === editId
                ? { ...t, desc, amount, type, category, date }
                : t
        );
        editId = null;
    } else {
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
    updateTotalBalance();

    form.reset();
});


// Display transactions (newest first)
function displayTransactions() {
    if (!list) return;

    list.innerHTML = "";

    const sortedTransactions = [...transactions].sort(
        (a, b) => b.id - a.id
    );

    sortedTransactions.forEach(t => {
        const li = document.createElement("li");

        li.innerHTML = `
            <span>
                ${t.desc} (${t.category}) | ${t.date} -
                <span class="${
                    t.type === "income"
                        ? "amount-income"
                        : "amount-expense"
                }">
                    ₹${t.amount}
                </span>
            </span>

            <span>
                <button class="small-btn"
                    onclick="editTransaction(${t.id})">✏️</button>
                <button class="small-btn"
                    onclick="deleteTransaction(${t.id})">❌</button>
            </span>
        `;

        list.appendChild(li);
    });
}

function editTransaction(id) {
    const t = transactions.find(t => t.id === id);
    if (!t) return;

    document.getElementById("desc").value = t.desc;
    document.getElementById("amount").value = t.amount;
    document.getElementById("type").value = t.type;
    document.getElementById("category").value = t.category;
    document.getElementById("date").value = t.date;

    editId = id;
}

function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);

    saveData();
    displayTransactions();
    updateSummary();
    updateTotalBalance();
}


/* =====================================================
   MONTH NAVIGATION
===================================================== */

function updateMonthText() {
    if (!monthText) return;

    monthText.textContent =
        summaryDate.toLocaleString("default", {
            month: "long",
            year: "numeric"
        });
}

prevMonthBtn?.addEventListener("click", () => {
    summaryDate.setMonth(summaryDate.getMonth() - 1);
    updateSummary();
});

nextMonthBtn?.addEventListener("click", () => {
    summaryDate.setMonth(summaryDate.getMonth() + 1);
    updateSummary();
});


/* =====================================================
   MONTHLY SUMMARY + ALERTS
===================================================== */

function updateSummary() {
    if (!summaryDiv) return;

    updateMonthText();

    let income = 0;
    let expense = 0;

    const month = summaryDate.getMonth();
    const year = summaryDate.getFullYear();

    transactions.forEach(t => {
        const d = new Date(t.date);

        if (d.getMonth() === month && d.getFullYear() === year) {
            if (t.type === "income") income += Number(t.amount);
            else expense += Number(t.amount);
        }
    });

    const balance = income - expense;

    const today = new Date();

    /* Budget alert (current month only) */
    if (
        month === today.getMonth() &&
        year === today.getFullYear()
    ) {
        if (budget && expense > budget && !budgetAlertShown) {
            const message =
                `Budget exceeded! Expense: ₹${expense}, Limit: ₹${budget}`;

            alert("⚠ " + message);
            addNotification(message);

            budgetAlertShown = true;
            localStorage.setItem("budgetAlertShown", "true");
        }

        if (expense <= budget) {
            budgetAlertShown = false;
            localStorage.setItem("budgetAlertShown", "false");
        }
    }

    /* Minimum balance alert */
    if (minBalance && balance < minBalance && !minBalanceAlertShown) {
        const message =
            `Balance below minimum! Current: ₹${balance}, Minimum: ₹${minBalance}`;

        alert("⚠ " + message);
        addNotification(message);

        minBalanceAlertShown = true;
        localStorage.setItem("minBalanceAlertShown", "true");
    }

    if (balance >= minBalance) {
        minBalanceAlertShown = false;
        localStorage.setItem("minBalanceAlertShown", "false");
    }

    summaryDiv.innerHTML = `
        Income: ₹${income}<br>
        Expense: ₹${expense}<br>
        Balance: ₹${balance}<br>
        Budget: ₹${budget || 0}<br>
        Minimum Balance: ₹${minBalance || 0}
    `;
}


/* =====================================================
   INITIAL LOAD
===================================================== */

displayTransactions();
updateMonthText();
updateSummary();
renderNotifications();
updateTotalBalance();
