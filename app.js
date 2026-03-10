// Get form elements
const tradeForm = document.getElementById('trade-form');
const tradesTableBody = document.querySelector('#tradesTable tbody');

let trades = JSON.parse(localStorage.getItem('trades') || '[]');
let editingIndex = null;
let monthlyChart;
let cumulativeChart;

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
  renderCumulativeChart();
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

// Chart.js - Cumulative P&L
function renderCumulativeChart() {
  const ctx = document.getElementById('cumulativeChart').getContext('2d');

  let cumulativePnL = [];
  let sum = 0;
let uid
let trades=[]
let editId=null

auth.onAuthStateChanged(user=>{

if(user){

uid=user.uid
document.getElementById("userEmail").innerText=user.email

migrateLocalTrades()

loadTrades()

}else{

window.location="index.html"

}

})

function showTab(tab){

document.querySelectorAll(".tab").forEach(t=>t.style.display="none")
document.getElementById(tab).style.display="block"

}

const form=document.getElementById("trade-form")

form.addEventListener("submit",async e=>{

e.preventDefault()

const trade={

date:date.value,
instrument:instrument.value,
optionType:optionType.value,
entry:parseFloat(entryPrice.value),
exit:parseFloat(exitPrice.value),
qty:parseInt(quantity.value),
strategy:strategy.value

}

trade.pnl=(trade.exit-trade.entry)*trade.qty

if(editId){

await db.collection("users").doc(uid).collection("trades").doc(editId).update(trade)

editId=null

}else{

await db.collection("users").doc(uid).collection("trades").add(trade)

}

loadTrades()

})

async function loadTrades(){

const snapshot=await db.collection("users").doc(uid).collection("trades").get()

trades=[]

snapshot.forEach(doc=>{

trades.push({id:doc.id,...doc.data()})

})

renderTrades()

renderCharts()

}

function renderTrades(){

const tbody=document.querySelector("#tradesTable tbody")

tbody.innerHTML=""

trades.forEach(t=>{

const row=document.createElement("tr")

row.innerHTML=`

<td>${t.date}</td>
<td>${t.instrument}</td>
<td>${t.optionType}</td>
<td>${t.entry}</td>
<td>${t.exit}</td>
<td>${t.qty}</td>
<td>${t.pnl}</td>

<td><button onclick="editTrade('${t.id}')">Edit</button></td>

<td><button onclick="deleteTrade('${t.id}')">X</button></td>

`

tbody.appendChild(row)

})

}

function editTrade(id){

const t=trades.find(x=>x.id===id)

date.value=t.date
instrument.value=t.instrument
optionType.value=t.optionType
entryPrice.value=t.entry
exitPrice.value=t.exit
quantity.value=t.qty
strategy.value=t.strategy

editId=id

showTab("add")

}

async function deleteTrade(id){

await db.collection("users").doc(uid).collection("trades").doc(id).delete()

loadTrades()

}

function logout(){

auth.signOut()

}

async function migrateLocalTrades(){

const localTrades=JSON.parse(localStorage.getItem("trades")||"[]")

if(localTrades.length>0 && !localStorage.getItem("migrated")){

for(const t of localTrades){

await db.collection("users").doc(uid).collection("trades").add(t)

}

localStorage.setItem("migrated","true")

}

}

function renderCharts(){

let cumulative=[]
let sum=0

let monthly={}
let call=0
let put=0
let strategy={}
let wins=0
let losses=0

trades.forEach(t=>{

sum+=t.pnl
cumulative.push(sum)

const month=t.date.slice(0,7)
monthly[month]=(monthly[month]||0)+t.pnl

if(t.optionType==="CALL")call++
else put++

strategy[t.strategy]=(strategy[t.strategy]||0)+1

if(t.pnl>0)wins++
else losses++

})

new Chart(equityChart,{type:"line",data:{labels:trades.map(t=>t.date),datasets:[{data:cumulative,label:"Equity"}]}})

new Chart(monthlyChart,{type:"bar",data:{labels:Object.keys(monthly),datasets:[{data:Object.values(monthly),label:"Monthly PnL"}]}})

new Chart(callPutChart,{type:"pie",data:{labels:["CALL","PUT"],datasets:[{data:[call,put]}]}})

new Chart(strategyChart,{type:"pie",data:{labels:Object.keys(strategy),datasets:[{data:Object.values(strategy)}]}})

new Chart(winLossChart,{type:"pie",data:{labels:["Wins","Losses"],datasets:[{data:[wins,losses]}]}})

}
