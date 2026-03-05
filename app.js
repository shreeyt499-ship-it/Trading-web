// Get form elements
const tradeForm = document.getElementById('trade-form');
const tradesTableBody = document.querySelector('#tradesTable tbody');

let trades = JSON.parse(localStorage.getItem('trades') || '[]');
let editingIndex = null;

// Save Trade
tradeForm.addEventListener('submit', function(e) {
  e.preventDefault();

  const trade = {
    date: document.getElementById('date').value,
    instrument: document.getElementById('instrument').value,
    optionType: document.getElementById('optionType').value,
    entryPrice: parseFloat(document.getElementById('entryPrice').value),
    exitPrice: parseFloat(document.getElementById('exitPrice').value),
    quantity: parseInt(document.getElementById('quantity').value),
    strategy: document.getElementById('strategy').value,
    mistakes: Array.from(document.querySelectorAll('.mistakes input:checked')).map(i=>i.value),
    reason: document.getElementById('reason').value,
    remarks: document.getElementById('remarks').value
  };

  trade.points = trade.exitPrice - trade.entryPrice;
  trade.netPnL = trade.points * trade.quantity;
  // Prepare cumulative P&L data
let cumulativePnL = [];
let sum = 0;
trades.forEach(trade => {
  sum += trade.net_pnl;
  cumulativePnL.push(sum);
});

let tradeDates = trades.map(t => t.date);
  if (editingIndex !== null) {
    trades[editingIndex] = trade;
    editingIndex = null;
  } else {
    trades.push(trade);
  }

  localStorage.setItem('trades', JSON.stringify(trades));
  tradeForm.reset();
  renderTrades();
});

// Render Trades List
function renderTrades() {
  tradesTableBody.innerHTML = '';
  let wins = 0, totalProfit = 0;
  trades.forEach((trade, index) => {
    const pnlColor = trade.netPnL >= 0 ? 'green' : 'red';
    if (trade.netPnL > 0) wins++;

    totalProfit += trade.netPnL;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${trade.date}</td>
      <td>${trade.instrument}</td>
      <td>${trade.optionType}</td>
      <td>₹${trade.entryPrice.toFixed(2)}</td>
      <td>₹${trade.exitPrice.toFixed(2)}</td>
      <td>${trade.quantity}</td>
      <td>${trade.points.toFixed(2)}</td>
      <td style="color:${pnlColor}">₹${trade.netPnL.toFixed(2)}</td>
      <td>
        <button onclick="editTrade(${index})">Edit</button>
        <button onclick="deleteTrade(${index})">Delete</button>
      </td>
    `;
    tradesTableBody.appendChild(row);
  });

  // Update KPIs
  document.getElementById('totalTrades').innerText = trades.length;
  document.getElementById('wins').innerText = wins;
  document.getElementById('totalProfit').innerText = totalProfit.toFixed(2);
  document.getElementById('winRate').innerText = trades.length ? Math.round((wins/trades.length)*100)+'%' : '0%';

  renderMonthlyChart();
}

// Edit Trade
function editTrade(index) {
  const trade = trades[index];
  document.getElementById('date').value = trade.date;
  document.getElementById('instrument').value = trade.instrument;
  document.getElementById('optionType').value = trade.optionType;
  document.getElementById('entryPrice').value = trade.entryPrice;
  document.getElementById('exitPrice').value = trade.exitPrice;
  document.getElementById('quantity').value = trade.quantity;
  document.getElementById('strategy').value = trade.strategy;
  document.querySelectorAll('.mistakes input').forEach(i => i.checked = trade.mistakes.includes(i.value));
  document.getElementById('reason').value = trade.reason;
  document.getElementById('remarks').value = trade.remarks;

  editingIndex = index;
}

// Delete Trade
function deleteTrade(index) {
  if(confirm('Delete this trade?')) {
    trades.splice(index, 1);
    localStorage.setItem('trades', JSON.stringify(trades));
    renderTrades();
  }
}

// Chart.js - Monthly P&L
let monthlyChart;
function renderMonthlyChart() {
  const ctx = document.getElementById('monthlyChart').getContext('2d');
  const monthly = {};

  trades.forEach(t => {
    const month = t.date.slice(0,7);
    monthly[month] = (monthly[month] || 0) + t.netPnL;
  });

  const labels = Object.keys(monthly);
  const data = Object.values(monthly);

  if(monthlyChart) monthlyChart.destroy();

  monthlyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Monthly P&L',
        data,
        backgroundColor: data.map(v => v >= 0 ? 'green' : 'red')
      }]
    },
    options: {
      responsive: true,
      scales: { y: { beginAtZero: true } }
    }
  });
}

// Initial render
renderTrades();
const ctx = document.getElementById('cumulativeChart').getContext('2d');
const cumulativeChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: tradeDates,
        datasets: [{
            label: 'Cumulative P&L',
            data: cumulativePnL,
            fill: false,
            borderColor: 'rgb(59, 130, 246)', // blue
            tension: 0.1
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: { beginAtZero: true }
        }
    }
});
