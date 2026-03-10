// app.js
import { auth, db } from "./firebase.js";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import Chart from "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/+esm";

// Elements
const tradeForm = document.getElementById("trade-form");
const tradesTableBody = document.querySelector("#tradesTable tbody");
let uid = null;
let trades = [];
let editId = null;

// Chart placeholders
const equityChartEl = document.getElementById("equityChart");
const monthlyChartEl = document.getElementById("monthlyChart");
const callPutChartEl = document.getElementById("callPutChart");
const strategyChartEl = document.getElementById("strategyChart");
const winLossChartEl = document.getElementById("winLossChart");
let equityChart, monthlyChart, callPutChart, strategyChart, winLossChart;

// ----------------------- Auth State -----------------------
auth.onAuthStateChanged(async user => {
    if (!user) {
        if (window.location.pathname.includes("dashboard")) window.location = "index.html";
        return;
    }
    uid = user.uid;
    const emailEl = document.getElementById("userEmail");
    if (emailEl) emailEl.innerText = user.email;

    try {
        await migrateLocalTrades();
        await loadTrades();
    } catch (error) {
        console.error("Auth state error:", error);
        alert("Error loading data. Please refresh.");
    }
});

// ----------------------- Tabs -----------------------
window.showTab = function(tab) {
    document.querySelectorAll(".tab").forEach(t => t.style.display = "none");
    const target = document.getElementById(tab);
    if (target) target.style.display = "block";

    // Render charts only when Home tab is visible
    if (tab === "home") {
        setTimeout(renderCharts, 100); // delay ensures canvas dimensions are correct
    }
};

// ----------------------- Save Trade -----------------------
tradeForm.addEventListener("submit", async e => {
    e.preventDefault();
    if (!uid) return alert("User not authenticated!");

    const trade = {
        date: document.getElementById("date").value,
        instrument: document.getElementById("instrument").value,
        optionType: document.getElementById("optionType").value,
        entry: parseFloat(document.getElementById("entryPrice").value),
        exit: parseFloat(document.getElementById("exitPrice").value),
        qty: parseInt(document.getElementById("quantity").value),
        strategy: document.getElementById("strategy").value,
    };

    trade.pnl = (trade.exit - trade.entry) * trade.qty;

    try {
        if (editId) {
            await updateDoc(doc(db, "users", uid, "trades", editId), trade);
            editId = null;
        } else {
            await addDoc(collection(db, "users", uid, "trades"), trade);
        }
        tradeForm.reset();
        await loadTrades();
        showTab("home");
    } catch (error) {
        console.error("Save error:", error);
        alert("Failed to save trade. Please try again.");
    }
});

// ----------------------- Load Trades -----------------------
async function loadTrades() {
    if (!uid) return;
    try {
        const snapshot = await getDocs(collection(db, "users", uid, "trades"));
        trades = [];
        snapshot.forEach(docSnap => trades.push({ id: docSnap.id, ...docSnap.data() }));
        renderTradesTable();
        renderCharts();
    } catch (error) {
        console.error("Load trades error:", error);
    }
}

// ----------------------- Render Trades Table -----------------------
function renderTradesTable() {
    if (!tradesTableBody) return;
    tradesTableBody.innerHTML = "";
    trades.forEach(t => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${t.date}</td>
            <td>${t.instrument}</td>
            <td>${t.optionType}</td>
            <td>${t.entry}</td>
            <td>${t.exit}</td>
            <td>${t.qty}</td>
            <td style="color: ${t.pnl >= 0 ? 'lime' : 'red'}">${t.pnl.toFixed(2)}</td>
            <td><button onclick="editTrade('${t.id}')">Edit</button></td>
            <td><button onclick="deleteTrade('${t.id}')">X</button></td>
        `;
        tradesTableBody.appendChild(row);
    });
}
window.editTrade = editTrade;

// ----------------------- Edit Trade -----------------------
async function editTrade(id) {
    const t = trades.find(x => x.id === id);
    if (!t) return;
    document.getElementById("date").value = t.date;
    document.getElementById("instrument").value = t.instrument;
    document.getElementById("optionType").value = t.optionType;
    document.getElementById("entryPrice").value = t.entry;
    document.getElementById("exitPrice").value = t.exit;
    document.getElementById("quantity").value = t.qty;
    document.getElementById("strategy").value = t.strategy;
    editId = id;
    showTab("add");
}

// ----------------------- Delete Trade -----------------------
window.deleteTrade = async function(id) {
    if (!confirm("Are you sure you want to delete this trade?")) return;
    try {
        await deleteDoc(doc(db, "users", uid, "trades", id));
        await loadTrades();
    } catch (error) {
        console.error("Delete error:", error);
        alert("Failed to delete trade.");
    }
};

// ----------------------- Logout -----------------------
window.logout = function() {
    auth.signOut().then(() => window.location = "index.html").catch(console.error);
};

// ----------------------- Migrate Local Storage -----------------------
async function migrateLocalTrades() {
    if (!uid) return;
    const localTrades = JSON.parse(localStorage.getItem("trades") || "[]");
    if (localTrades.length > 0 && !localStorage.getItem("migrated")) {
        try {
            for (const t of localTrades) {
                t.pnl = (t.exitPrice - t.entryPrice) * t.quantity;
                await addDoc(collection(db, "users", uid, "trades"), t);
            }
            localStorage.setItem("migrated", "true");
            localStorage.removeItem("trades");
        } catch (error) {
            console.error("Migration error:", error);
        }
    }
}

// ----------------------- Render Charts -----------------------
function renderCharts() {
    if (!trades.length) return;

    // Destroy old charts
    [equityChart, monthlyChart, callPutChart, strategyChart, winLossChart].forEach(c => {
        if (c) c.destroy();
    });

    // Calculate chart data
    let cumulative = [], sum = 0;
    let monthly = {}, call = 0, put = 0, strategyCount = {}, wins = 0, losses = 0;

    trades.forEach(t => {
        sum += t.pnl;
        cumulative.push(sum);

        const month = t.date.slice(0, 7);
        monthly[month] = (monthly[month] || 0) + t.pnl;

        if (t.optionType === "CALL") call++; else put++;

        strategyCount[t.strategy] = (strategyCount[t.strategy] || 0) + 1;

        if (t.pnl > 0) wins++; else losses++;
    });

    const createChart = (el, type, data, options = {}) => {
        if (!el) return null;
        return new Chart(el, { type, data, options: { responsive: true, maintainAspectRatio: false, ...options } });
    };

    equityChart = createChart(equityChartEl, "line", {
        labels: trades.map(t => t.date),
        datasets: [{ data: cumulative, label: "Equity", borderColor: "lime", fill: false }]
    });

    monthlyChart = createChart(monthlyChartEl, "bar", {
        labels: Object.keys(monthly),
        datasets: [{ data: Object.values(monthly), label: "Monthly PnL", backgroundColor: "cyan" }]
    });

    callPutChart = createChart(callPutChartEl, "pie", {
        labels: ["CALL", "PUT"],
        datasets: [{ data: [call, put], backgroundColor: ["green", "red"] }]
    });

    strategyChart = createChart(strategyChartEl, "pie", {
        labels: Object.keys(strategyCount),
        datasets: [{ data: Object.values(strategyCount), backgroundColor: ["#38bdf8", "#facc15", "#f472b6", "#10b981", "#8b5cf6"] }]
    });

    winLossChart = createChart(winLossChartEl, "pie", {
        labels: ["Wins", "Losses"],
        datasets: [{ data: [wins, losses], backgroundColor: ["green", "red"] }]
    });
}

// ----------------------- Resize charts on window resize -----------------------
window.addEventListener('resize', () => {
    if (window.location.pathname.includes("dashboard.html")) renderCharts();
});
