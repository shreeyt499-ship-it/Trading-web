import { auth, db } from "./firebase.js";
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Elements
const tradeForm = document.getElementById("trade-form");
const tradesTableBody = document.querySelector("#tradesTable tbody");
let uid = null;
let trades = [];
let editId = null;

// Charts placeholders
const equityChartEl = document.getElementById("equityChart");
const monthlyChartEl = document.getElementById("monthlyChart");
const callPutChartEl = document.getElementById("callPutChart");
const strategyChartEl = document.getElementById("strategyChart");
const winLossChartEl = document.getElementById("winLossChart");
let equityChart, monthlyChart, callPutChart, strategyChart, winLossChart;

// Auth state
auth.onAuthStateChanged(async user => {
    if (!user) return window.location = "index.html";
    uid = user.uid;
    document.getElementById("userEmail").innerText = user.email;

    await migrateLocalTrades();
    await loadTrades();
});

// Tabs
function showTab(tab) {
    document.querySelectorAll(".tab").forEach(t => t.style.display = "none");
    document.getElementById(tab).style.display = "block";
}
window.showTab = showTab; // Make globally accessible

// Save Trade
tradeForm.addEventListener("submit", async e => {
    e.preventDefault();

    const trade = {
        date: document.getElementById("date").value,
        instrument: document.getElementById("instrument").value,
        optionType: document.getElementById("optionType").value,
        entry: parseFloat(document.getElementById("entryPrice").value),
        exit: parseFloat(document.getElementById("exitPrice").value),
        qty: parseInt(document.getElementById("quantity").value),
        strategy: document.getElementById("strategy").value,
        pnl: 0
    };

    trade.pnl = (trade.exit - trade.entry) * trade.qty;

    if (editId) {
        await updateDoc(doc(db, "users", uid, "trades", editId), trade);
        editId = null;
    } else {
        await addDoc(collection(db, "users", uid, "trades"), trade);
    }

    tradeForm.reset();
    await loadTrades();
    showTab("home");
});

// Load Trades
async function loadTrades() {
    const snapshot = await getDocs(collection(db, "users", uid, "trades"));
    trades = [];
    snapshot.forEach(docSnap => trades.push({ id: docSnap.id, ...docSnap.data() }));

    renderTradesTable();
    renderCharts();
}

// Render Trades Table
function renderTradesTable() {
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
            <td>${t.pnl.toFixed(2)}</td>
            <td><button onclick="editTrade('${t.id}')">Edit</button></td>
            <td><button onclick="deleteTrade('${t.id}')">X</button></td>
        `;
        tradesTableBody.appendChild(row);
    });
}
window.editTrade = editTrade; // global
async function editTrade(id) {
    const t = trades.find(x => x.id === id);
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

// Delete Trade
window.deleteTrade = async function(id) {
    await deleteDoc(doc(db, "users", uid, "trades", id));
    await loadTrades();
};

// Logout
window.logout = function() {
    auth.signOut();
};

// Migrate localStorage trades
async function migrateLocalTrades() {
    const localTrades = JSON.parse(localStorage.getItem("trades") || "[]");
    if (localTrades.length > 0 && !localStorage.getItem("migrated")) {
        for (const t of localTrades) {
            t.pnl = (t.exitPrice - t.entryPrice) * t.quantity;
            await addDoc(collection(db, "users", uid, "trades"), t);
        }
        localStorage.setItem("migrated", "true");
    }
}

// Render Charts
function renderCharts() {
    if (!trades.length) return;

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

    if (equityChart) equityChart.destroy();
    equityChart = new Chart(equityChartEl, {
        type: "line",
        data: { labels: trades.map(t => t.date), datasets: [{ data: cumulative, label: "Equity", borderColor: "lime", fill: false }] },
    });

    if (monthlyChart) monthlyChart.destroy();
    monthlyChart = new Chart(monthlyChartEl, {
        type: "bar",
        data: { labels: Object.keys(monthly), datasets: [{ data: Object.values(monthly), label: "Monthly PnL", backgroundColor: "cyan" }] },
    });

    if (callPutChart) callPutChart.destroy();
    callPutChart = new Chart(callPutChartEl, {
        type: "pie",
        data: { labels: ["CALL", "PUT"], datasets: [{ data: [call, put], backgroundColor: ["green", "red"] }] },
    });

    if (strategyChart) strategyChart.destroy();
    strategyChart = new Chart(strategyChartEl, {
        type: "pie",
        data: { labels: Object.keys(strategyCount), datasets: [{ data: Object.values(strategyCount), backgroundColor: ["#38bdf8", "#facc15", "#f472b6", "#10b981", "#8b5cf6"] }] },
    });

    if (winLossChart) winLossChart.destroy();
    winLossChart = new Chart(winLossChartEl, {
        type: "pie",
        data: { labels: ["Wins", "Losses"], datasets: [{ data: [wins, losses], backgroundColor: ["green", "red"] }] },
    });
}
