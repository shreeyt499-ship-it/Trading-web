import { auth, db } from "./firebase.js";

// Tabs
window.showTab = function(tab){
    document.querySelectorAll(".tab").forEach(t => t.style.display = "none");
    document.getElementById(tab).style.display = "block";
};

// Variables
let uid;
let trades = [];
let editId = null;

// Elements
const tradeForm = document.getElementById("trade-form");
const tradesTableBody = document.querySelector("#tradesTable tbody");

// Auth check
auth.onAuthStateChanged(user => {
    if (user) {
        uid = user.uid;
        document.getElementById("userEmail").innerText = user.email;

        migrateLocalTrades().then(() => loadTrades());
        showTab("home");
    } else {
        window.location = "index.html";
    }
});

// Add/Edit Trade
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
        pnl: (parseFloat(document.getElementById("exitPrice").value) -
              parseFloat(document.getElementById("entryPrice").value)) *
              parseInt(document.getElementById("quantity").value)
    };

    if(editId){
        await db.collection("users").doc(uid).collection("trades").doc(editId).update(trade);
        editId = null;
    } else {
        await db.collection("users").doc(uid).collection("trades").add(trade);
    }

    tradeForm.reset();
    showTab("trades");
    loadTrades();
});

// Load trades from Firestore
async function loadTrades(){
    const snapshot = await db.collection("users").doc(uid).collection("trades").get();
    trades = [];
    snapshot.forEach(doc => trades.push({ id: doc.id, ...doc.data() }));

    renderTrades();
    renderCharts();
}

// Render trade table
function renderTrades(){
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
            <td>${t.pnl}</td>
            <td><button onclick="editTrade('${t.id}')">Edit</button></td>
            <td><button onclick="deleteTrade('${t.id}')">X</button></td>
        `;
        tradesTableBody.appendChild(row);
    });
}

// Edit trade
window.editTrade = function(id){
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

// Delete trade
window.deleteTrade = async function(id){
    await db.collection("users").doc(uid).collection("trades").doc(id).delete();
    loadTrades();
}

// Logout
window.logout = function(){
    auth.signOut();
}

// Migrate localStorage trades once
async function migrateLocalTrades(){
    const localTrades = JSON.parse(localStorage.getItem("trades") || "[]");
    if(localTrades.length > 0 && !localStorage.getItem("migrated")){
        for(const t of localTrades){
            await db.collection("users").doc(uid).collection("trades").add(t);
        }
        localStorage.setItem("migrated","true");
    }
}

// Render charts
function renderCharts(){
    if(trades.length === 0) return;

    let cumulative = [], sum = 0;
    let monthly = {}, call=0, put=0, strategy={}, wins=0, losses=0;

    trades.forEach(t=>{
        sum += t.pnl;
        cumulative.push(sum);

        const month = t.date.slice(0,7);
        monthly[month] = (monthly[month] || 0) + t.pnl;

        t.optionType === "CALL" ? call++ : put++;
        strategy[t.strategy] = (strategy[t.strategy] || 0) + 1;

        t.pnl > 0 ? wins++ : losses++;
    });

    new Chart(document.getElementById("equityChart"), { type:"line", data:{ labels: trades.map(t=>t.date), datasets:[{ data: cumulative, label:"Equity" }] } });
    new Chart(document.getElementById("monthlyChart"), { type:"bar", data:{ labels: Object.keys(monthly), datasets:[{ data: Object.values(monthly), label:"Monthly PnL" }] } });
    new Chart(document.getElementById("callPutChart"), { type:"pie", data:{ labels:["CALL","PUT"], datasets:[{ data:[call,put] }] } });
    new Chart(document.getElementById("strategyChart"), { type:"pie", data:{ labels:Object.keys(strategy), datasets:[{ data:Object.values(strategy) }] } });
    new Chart(document.getElementById("winLossChart"), { type:"pie", data:{ labels:["Wins","Losses"], datasets:[{ data:[wins,losses] }] } });
}
