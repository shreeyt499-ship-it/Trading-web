// Elements
const tradeForm = document.getElementById("trade-form");
const tradesTableBody = document.querySelector("#tradesTable tbody");
let trades = [];
let editIndex = null;

// Charts
const equityChartEl = document.getElementById("equityChart");
const monthlyChartEl = document.getElementById("monthlyChart");
const callPutChartEl = document.getElementById("callPutChart");
const strategyChartEl = document.getElementById("strategyChart");
const winLossChartEl = document.getElementById("winLossChart");
let equityChart, monthlyChart, callPutChart, strategyChart, winLossChart;

// Load trades from localStorage
function loadTrades() {
  trades = JSON.parse(localStorage.getItem("trades") || "[]");
  renderTradesTable();
  renderCharts();
}
loadTrades();

// Show tab
function showTab(tab) {
  document.querySelectorAll(".tab").forEach(t => t.style.display = "none");
  document.getElementById(tab).style.display = "block";
}
window.showTab = showTab;
showTab("home");

// Save trade
tradeForm.addEventListener("submit", e => {
  e.preventDefault();
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

  if (editIndex !== null) {
    trades[editIndex] = trade;
    editIndex = null;
  } else {
    trades.push(trade);
  }

  localStorage.setItem("trades", JSON.stringify(trades));
  tradeForm.reset();
  loadTrades();
  showTab("home");
});

// Render table
function renderTradesTable() {
  tradesTableBody.innerHTML = "";
  trades.forEach((t, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${t.date}</td>
      <td>${t.instrument}</td>
      <td>${t.optionType}</td>
      <td>${t.entry}</td>
      <td>${t.exit}</td>
      <td>${t.qty}</td>
      <td style="color:${t.pnl>=0?'lime':'red'}">${t.pnl.toFixed(2)}</td>
      <td><button onclick="editTrade(${index})">Edit</button></td>
      <td><button onclick="deleteTrade(${index})">X</button></td>
    `;
    tradesTableBody.appendChild(row);
  });
}
window.editTrade = function(index) {
  const t = trades[index];
  document.getElementById("date").value = t.date;
  document.getElementById("instrument").value = t.instrument;
  document.getElementById("optionType").value = t.optionType;
  document.getElementById("entryPrice").value = t.entry;
  document.getElementById("exitPrice").value = t.exit;
  document.getElementById("quantity").value = t.qty;
  document.getElementById("strategy").value = t.strategy;
  editIndex = index;
};
window.deleteTrade = function(index) {
  if (!confirm("Delete this trade?")) return;
  trades.splice(index,1);
  localStorage.setItem("trades", JSON.stringify(trades));
  loadTrades();
};

// Render charts
function renderCharts() {
  if (!trades.length) return;

  [equityChart, monthlyChart, callPutChart, strategyChart, winLossChart].forEach(c => c?.destroy());

  let cumulative=0, equityData=[], monthly={}, call=0, put=0, strategyCount={}, wins=0, losses=0;
  trades.forEach(t => {
    cumulative += t.pnl;
    equityData.push(cumulative);

    const month = t.date.slice(0,7);
    monthly[month] = (monthly[month]||0)+t.pnl;

    if(t.optionType==='CALL') call++; else put++;
    strategyCount[t.strategy] = (strategyCount[t.strategy]||0)+1;
    if(t.pnl>0) wins++; else losses++;
  });

  equityChart = new Chart(equityChartEl, { type:'line', data:{labels:trades.map(t=>t.date), datasets:[{label:'Equity', data:equityData, borderColor:'lime', fill:false}]}, options:{responsive:true, maintainAspectRatio:false} });
  monthlyChart = new Chart(monthlyChartEl, { type:'bar', data:{labels:Object.keys(monthly), datasets:[{label:'Monthly PnL', data:Object.values(monthly), backgroundColor:'cyan'}]}, options:{responsive:true, maintainAspectRatio:false} });
  callPutChart = new Chart(callPutChartEl, { type:'pie', data:{labels:['CALL','PUT'], datasets:[{data:[call,put], backgroundColor:['green','red']}]}, options:{responsive:true, maintainAspectRatio:false} });
  strategyChart = new Chart(strategyChartEl, { type:'pie', data:{labels:Object.keys(strategyCount), datasets:[{data:Object.values(strategyCount), backgroundColor:['#38bdf8','#facc15','#f472b6','#10b981','#8b5cf6']}]}, options:{responsive:true, maintainAspectRatio:false} });
  winLossChart = new Chart(winLossChartEl, { type:'pie', data:{labels:['Wins','Losses'], datasets:[{data:[wins,losses], backgroundColor:['green','red']}]}, options:{responsive:true, maintainAspectRatio:false} });
}
