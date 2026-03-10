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
  const target = document.getElementById(tab);
  if (target) {
    target.style.display = "block";
  }
}
window.showTab = showTab;
showTab("home");

// Save trade
tradeForm.addEventListener("submit", e => {
  e.preventDefault();
  
  const date = document.getElementById("date").value;
  const instrument = document.getElementById("instrument").value;
  const optionType = document.getElementById("optionType").value;
  const entry = parseFloat(document.getElementById("entryPrice").value);
  const exit = parseFloat(document.getElementById("exitPrice").value);
  const qty = parseInt(document.getElementById("quantity").value);
  const strategy = document.getElementById("strategy").value;

  if (!date || !entry || !exit || !qty) {
    alert("Please fill all required fields");
    return;
  }

  const trade = {
    date,
    instrument,
    optionType,
    entry,
    exit,
    qty,
    strategy,
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
  if (!tradesTableBody) return;
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
  if (!trades.length) {
    console.log("No trades to render charts");
    return;
  }

  // Check if Chart.js is loaded
  if (typeof Chart === 'undefined') {
    console.error("Chart.js not loaded!");
    alert("Chart.js failed to load. Please refresh the page.");
    return;
  }

  // Destroy existing charts
  [equityChart, monthlyChart, callPutChart, strategyChart, winLossChart].forEach(c => {
    if (c) {
      try {
        c.destroy();
      } catch (e) {
        console.log("Chart destroy error:", e);
      }
    }
  });

  // Calculate data
  let cumulative = 0, equityData = [], monthly = {}, call = 0, put = 0, strategyCount = {}, wins = 0, losses = 0;
  
  trades.forEach(t => {
    cumulative += t.pnl;
    equityData.push(cumulative);

    const month = t.date.slice(0, 7);
    monthly[month] = (monthly[month] || 0) + t.pnl;

    if (t.optionType === 'CALL') call++; else put++;
    strategyCount[t.strategy] = (strategyCount[t.strategy] || 0) + 1;
    if (t.pnl > 0) wins++; else losses++;
  });

  // Create charts with error handling
  const createChart = (canvasEl, type, data, options) => {
    try {
      if (!canvasEl) {
        console.error("Canvas element not found");
        return null;
      }
      return new Chart(canvasEl, {
        type,
        data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          ...options
        }
      });
    } catch (error) {
      console.error("Chart creation error:", error);
      return null;
    }
  };

  equityChart = createChart(equityChartEl, 'line', {
    labels: trades.map(t => t.date),
    datasets: [{
      label: 'Equity',
      data: equityData,
      borderColor: 'lime',
      fill: false,
      tension: 0.1
    }]
  }, { plugins: { legend: { display: false } } });

  monthlyChart = createChart(monthlyChartEl, 'bar', {
    labels: Object.keys(monthly),
    datasets: [{
      label: 'Monthly PnL',
      data: Object.values(monthly),
      backgroundColor: 'cyan'
    }]
  }, { plugins: { legend: { display: false } } });

  callPutChart = createChart(callPutChartEl, 'pie', {
    labels: ['CALL', 'PUT'],
    datasets: [{
      data: [call, put],
      backgroundColor: ['green', 'red']
    }]
  }, { plugins: { legend: { display: true } } });

  strategyChart = createChart(strategyChartEl, 'pie', {
    labels: Object.keys(strategyCount),
    datasets: [{
      data: Object.values(strategyCount),
      backgroundColor: ['#38bdf8', '#facc15', '#f472b6', '#10b981', '#8b5cf6']
    }]
  }, { plugins: { legend: { display: true } } });

  winLossChart = createChart(winLossChartEl, 'pie', {
    labels: ['Wins', 'Losses'],
    datasets: [{
      data: [wins, losses],
      backgroundColor: ['green', 'red']
    }]
  }, { plugins: { legend: { display: true } } });

  console.log("Charts rendered successfully");
}

// Debug: Check if charts are rendering
console.log("Trading Journal loaded");
console.log("Chart.js available:", typeof Chart !== 'undefined');
console.log("Trades loaded:", trades.length);
