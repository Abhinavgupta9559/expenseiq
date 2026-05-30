// ========== STORAGE KEYS ==========
const STORAGE_KEY   = 'expenseiq_data';
const BUDGET_KEY    = 'expenseiq_budget';
const GOALS_KEY     = 'expenseiq_goals';
const RECURRING_KEY = 'expenseiq_recurring';
const SPLIT_KEY     = 'expenseiq_split';
const USERS_KEY     = 'expenseiq_users';
const SESSION_KEY   = 'expenseiq_session';

// ========== CATEGORY CONFIG ==========
const categoryEmoji = {
  Food:'🍔', Transport:'🚗', Shopping:'🛍️', Bills:'💡',
  Health:'💊', Entertainment:'🎬', Education:'📚', Income:'💰', Other:'📦'
};
const categoryColors = [
  '#f0e040','#22c55e','#3b82f6','#ef4444',
  '#a855f7','#f97316','#06b6d4','#ec4899','#6b7280'
];

// Auto category keywords
const categoryKeywords = {
  Food: ['swiggy','zomato','food','restaurant','cafe','lunch','dinner','breakfast','pizza','burger','biryani','chai','tea','coffee','dominos','kfc','mcdonalds','hotel','dhaba','snack','biscuit','grocery','vegetable','fruit','milk','dmart','bigbasket','blinkit','zepto','dunzo'],
  Transport: ['uber','ola','rapido','petrol','diesel','fuel','bus','metro','train','irctc','flight','auto','rickshaw','cab','toll','parking','redbus','makemytrip','goibibo','taxi'],
  Shopping: ['amazon','flipkart','myntra','ajio','meesho','nykaa','shopee','mall','clothes','shirt','shoes','bag','watch','fashion','online shopping','market'],
  Bills: ['electricity','water','gas','jio','airtel','bsnl','vi','vodafone','recharge','internet','broadband','wifi','emi','loan','insurance','rent','maintenance'],
  Health: ['medicine','doctor','hospital','clinic','pharmacy','medical','health','chemist','apollo','1mg','netmeds','gym','fitness','yoga'],
  Entertainment: ['netflix','hotstar','amazon prime','youtube','spotify','movie','cinema','pvr','inox','bookmyshow','game','concert','show','ticket'],
  Education: ['book','course','udemy','tuition','school','college','fees','coaching','study','pen','notebook','stationery'],
};

// ========== STATE ==========
let currentUser  = null;
let transactions = [];
let budgets      = {};
let goals        = [];
let recurringList= [];
let splits       = [];
let chatHistory  = [];
let categoryChartInstance = null;
let trendChartInstance    = null;
let currentType  = 'expense';

// ========== AUTH HELPERS ==========
function getAllUsers() { return JSON.parse(localStorage.getItem(USERS_KEY)||'{}'); }
function saveAllUsers(u) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }
function getSession() { return localStorage.getItem(SESSION_KEY); }
function setSession(username) { localStorage.setItem(SESSION_KEY, username); }
function clearSession() { localStorage.removeItem(SESSION_KEY); }

function userKey(k) { return `${currentUser.username}_${k}`; }

function loadUserData() {
  transactions  = JSON.parse(localStorage.getItem(userKey(STORAGE_KEY)))   || [];
  budgets       = JSON.parse(localStorage.getItem(userKey(BUDGET_KEY)))     || { Food:5000,Transport:2000,Shopping:3000,Bills:4000,Health:2000,Entertainment:1500,Education:2000,Other:1000 };
  goals         = JSON.parse(localStorage.getItem(userKey(GOALS_KEY)))      || [];
  recurringList = JSON.parse(localStorage.getItem(userKey(RECURRING_KEY)))  || [];
  splits        = JSON.parse(localStorage.getItem(userKey(SPLIT_KEY)))      || [];
}

function save() {
  localStorage.setItem(userKey(STORAGE_KEY),   JSON.stringify(transactions));
  localStorage.setItem(userKey(BUDGET_KEY),    JSON.stringify(budgets));
  localStorage.setItem(userKey(GOALS_KEY),     JSON.stringify(goals));
  localStorage.setItem(userKey(RECURRING_KEY), JSON.stringify(recurringList));
  localStorage.setItem(userKey(SPLIT_KEY),     JSON.stringify(splits));
}

// ========== AUTH UI ==========
function showSignup() {
  document.getElementById('loginForm').style.display  = 'none';
  document.getElementById('signupForm').style.display = 'block';
  document.getElementById('setupForm').style.display  = 'none';
}
function showLogin() {
  document.getElementById('loginForm').style.display  = 'block';
  document.getElementById('signupForm').style.display = 'none';
  document.getElementById('setupForm').style.display  = 'none';
}

function doLogin() {
  const username = document.getElementById('loginUser').value.trim().toLowerCase();
  const password = document.getElementById('loginPass').value;
  if (!username || !password) return showToast('Fill all fields','error');
  const users = getAllUsers();
  if (!users[username]) return showToast('User not found! Create account first.','error');
  if (users[username].password !== btoa(password)) return showToast('Wrong password!','error');
  currentUser = users[username];
  setSession(username);
  loadUserData();
  launchApp();
}

function doSignup() {
  const name     = document.getElementById('signupName').value.trim();
  const username = document.getElementById('signupUser').value.trim().toLowerCase();
  const pass     = document.getElementById('signupPass').value;
  const pass2    = document.getElementById('signupPass2').value;
  if (!name||!username||!pass||!pass2) return showToast('Fill all fields','error');
  if (pass !== pass2) return showToast('Passwords do not match!','error');
  if (pass.length < 4) return showToast('Password must be at least 4 characters','error');
  if (username.length < 3) return showToast('Username must be at least 3 characters','error');
  const users = getAllUsers();
  if (users[username]) return showToast('Username already taken!','error');
  users[username] = { username, name, password: btoa(pass), profile: null };
  saveAllUsers(users);
  document.getElementById('setupNameDisplay').textContent = name;
  document.getElementById('signupForm').style.display = 'none';
  document.getElementById('setupForm').style.display  = 'block';
  currentUser = users[username];
}

function completeSetup() {
  const age        = document.getElementById('setupAge').value;
  const occupation = document.getElementById('setupOccupation').value;
  const income     = document.getElementById('setupIncome').value;
  const goal       = document.getElementById('setupGoal').value;
  const city       = document.getElementById('setupCity').value.trim();
  if (!age||!occupation||!income||!goal) return showToast('Please fill all details','error');
  const users = getAllUsers();
  users[currentUser.username].profile = { age, occupation, income: parseFloat(income), goal, city };
  saveAllUsers(users);
  currentUser = users[currentUser.username];
  setSession(currentUser.username);
  loadUserData();
  launchApp();
  showToast(`Welcome to ExpenseIQ, ${currentUser.name}! 🎉`,'success');
}

function doLogout() {
  clearSession();
  currentUser = null; transactions=[]; budgets={}; goals=[]; recurringList=[]; splits=[]; chatHistory=[];
  document.getElementById('mainApp').style.display   = 'none';
  document.getElementById('authScreen').style.display= 'flex';
  showLogin();
  document.getElementById('loginUser').value='';
  document.getElementById('loginPass').value='';
}

function launchApp() {
  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('mainApp').style.display    = 'flex';
  initApp();
}

// ========== INIT ==========
function initApp() {
  document.getElementById('txnDate').valueAsDate   = new Date();
  document.getElementById('splitDate').valueAsDate = new Date();
  setupNavigation();
  setupDarkMode();
  renderDashboard();
  initChatbot();
}

// Auto-login if session exists
window.addEventListener('DOMContentLoaded', () => {
  const sess = getSession();
  if (sess) {
    const users = getAllUsers();
    if (users[sess]) {
      currentUser = users[sess];
      loadUserData();
      launchApp();
      return;
    }
  }
  document.getElementById('authScreen').style.display = 'flex';
  document.getElementById('mainApp').style.display    = 'none';
});

// ========== NAVIGATION ==========
function setupNavigation() {
  document.querySelectorAll('.nav-item').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      document.querySelectorAll('.nav-item').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      const page = link.dataset.page;
      document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
      document.getElementById('page-' + page).classList.add('active');
      if (page==='dashboard')    renderDashboard();
      if (page==='transactions') renderAllTransactions();
      if (page==='budget')       renderBudget();
      if (page==='goals')        renderGoals();
      if (page==='recurring')    renderRecurring();
      if (page==='split')        renderSplits();
      if (page==='insights')     renderInsights();
      if (page==='predict')      renderPrediction();
      if (page==='report')       initReport();
      if (page==='chatbot')      focusChat();
    });
  });
  document.getElementById('searchBox')?.addEventListener('input', renderAllTransactions);
  document.getElementById('filterCategory')?.addEventListener('change', renderAllTransactions);
  document.getElementById('filterType')?.addEventListener('change', renderAllTransactions);
}

function setupDarkMode() {
  const toggle = document.getElementById('darkToggle');
  const saved  = localStorage.getItem('darkMode_'+currentUser.username);
  if (saved==='true') { document.body.classList.add('dark'); toggle.checked=true; }
  toggle.onchange = function() {
    document.body.classList.toggle('dark', this.checked);
    localStorage.setItem('darkMode_'+currentUser.username, this.checked);
    renderCharts();
  };
}

// ========== HELPERS ==========
function formatCurrency(n) { return '₹'+Number(n).toLocaleString('en-IN',{minimumFractionDigits:0}); }
function formatDate(d) { return new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}); }
function firstName() { return currentUser?.name?.split(' ')[0] || 'You'; }
function nowYM() { const n=new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}`; }
function getLast6Months() {
  const r=[]; const now=new Date();
  for(let i=5;i>=0;i--){ const d=new Date(now.getFullYear(),now.getMonth()-i,1); r.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`); }
  return r;
}
function emptyState(msg) { return `<div class="empty-state"><i class="fa-solid fa-inbox"></i><p>${msg}</p></div>`; }
function easeOut(t) { return 1-(1-t)*(1-t); }
function animateCount(id, target, isCurrency=true) {
  const el=document.getElementById(id); if(!el) return;
  const duration=700; const startTime=performance.now();
  function update(now) {
    const p=Math.min((now-startTime)/duration,1);
    const val=Math.round(target*easeOut(p));
    el.textContent=isCurrency?formatCurrency(val):val+'%';
    if(p<1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// ========== AUTO CATEGORY DETECTION ==========
function autoDetectCategory(title) {
  const t = title.toLowerCase();
  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(k => t.includes(k))) {
      document.getElementById('txnCategory').value = cat;
      document.getElementById('autoCatHint').textContent = '✨ AI detected: '+cat;
      return;
    }
  }
  document.getElementById('autoCatHint').textContent = '';
}

// ========== ADD TRANSACTION ==========
function setType(type) {
  currentType = type;
  document.getElementById('btnExpense').classList.remove('active','expense-btn');
  document.getElementById('btnIncome').classList.remove('active','income-btn');
  if (type==='expense') { document.getElementById('btnExpense').classList.add('active','expense-btn'); document.getElementById('txnCategory').value='Food'; }
  else { document.getElementById('btnIncome').classList.add('active','income-btn'); document.getElementById('txnCategory').value='Income'; }
}

function addTransaction() {
  const title    = document.getElementById('txnTitle').value.trim();
  const amount   = parseFloat(document.getElementById('txnAmount').value);
  const date     = document.getElementById('txnDate').value;
  const category = document.getElementById('txnCategory').value;
  const note     = document.getElementById('txnNote').value.trim();
  if (!title)             return showToast('Please enter a title','error');
  if (!amount||amount<=0) return showToast('Enter a valid amount','error');
  if (!date)              return showToast('Please select a date','error');
  const txn = { id:Date.now(), title, amount, date, category, note, type:currentType };
  transactions.unshift(txn);
  checkUnusualSpending(txn);
  save();
  showToast(`${currentType==='income'?'💰 Income':'💸 Expense'} saved!`,'success');
  document.getElementById('txnTitle').value='';
  document.getElementById('txnAmount').value='';
  document.getElementById('txnNote').value='';
  document.getElementById('txnDate').value='';
  document.getElementById('autoCatHint').textContent='';
}

function deleteTransaction(id) {
  transactions=transactions.filter(t=>t.id!==id);
  save(); renderDashboard(); renderAllTransactions();
  showToast('Transaction deleted','error');
}

// ========== UNUSUAL SPENDING ALERT ==========
function checkUnusualSpending(txn) {
  if (txn.type!=='expense') return;
  const ym = nowYM();
  const sameCat = transactions.filter(t=>t.type==='expense'&&t.category===txn.category&&t.date.startsWith(ym)&&t.id!==txn.id);
  if (sameCat.length < 3) return;
  const avg = sameCat.reduce((s,t)=>s+t.amount,0)/sameCat.length;
  if (txn.amount > avg*2.5) {
    showToast(`⚠️ Unusual: This ${txn.category} expense is ${Math.round(txn.amount/avg)}x your average!`,'error');
  }
}

// ========== DASHBOARD ==========
function renderDashboard() {
  const ym = nowYM();
  const now = new Date();
  document.getElementById('dashMonth').textContent = now.toLocaleString('en',{month:'long',year:'numeric'});

  const hour = now.getHours();
  const greet = hour<12?'Good morning':'hour<17'?'Good afternoon':'Good evening';
  const actualGreet = hour<12?'Good morning ☀️':hour<17?'Good afternoon 🌤️':'Good evening 🌙';
  document.getElementById('dashGreeting').textContent = `${actualGreet}, ${firstName()}! Here's your financial snapshot.`;

  const thisMonth = transactions.filter(t=>t.date.startsWith(ym));
  const totalIncome  = thisMonth.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const totalExpense = thisMonth.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const balance      = totalIncome-totalExpense;
  const savings      = totalIncome>0?Math.round((balance/totalIncome)*100):0;

  animateCount('totalIncome', totalIncome);
  animateCount('totalExpense', totalExpense);
  animateCount('netBalance', balance);
  document.getElementById('netBalance').style.color = balance>=0?'var(--income)':'var(--expense)';
  document.getElementById('savingsRate').textContent = savings+'%';

  // Daily tip
  showDailyTip(thisMonth, totalIncome, totalExpense);

  // Budget alerts
  const alertBanner = document.getElementById('budgetAlertBanner');
  const alerts=[];
  Object.keys(budgets).forEach(cat=>{
    const spent=thisMonth.filter(t=>t.type==='expense'&&t.category===cat).reduce((s,t)=>s+t.amount,0);
    const pct=budgets[cat]>0?(spent/budgets[cat]*100):0;
    if(pct>=100) alerts.push(`🚨 <strong>${cat}</strong> budget exceeded! Spent ${formatCurrency(spent)} of ${formatCurrency(budgets[cat])}`);
    else if(pct>=80) alerts.push(`⚠️ <strong>${cat}</strong> at ${pct.toFixed(0)}% — only ${formatCurrency(budgets[cat]-spent)} left`);
  });
  if(alerts.length){ alertBanner.style.display='block'; alertBanner.innerHTML=`⚡ Hey ${firstName()}, budget alerts:<br>`+alerts.join('<br>'); }
  else alertBanner.style.display='none';

  renderCharts();
  renderRecentList();
}

function showDailyTip(thisMonth, totalIncome, totalExpense) {
  const tip = generateDailyTip(thisMonth, totalIncome, totalExpense);
  const el  = document.getElementById('dailyTipBanner');
  if (tip) { el.style.display='block'; el.innerHTML=`💡 <strong>Daily Tip for ${firstName()}:</strong> ${tip}`; }
  else el.style.display='none';
}

function generateDailyTip(thisMonth, totalIncome, totalExpense) {
  const cats = Object.keys(categoryEmoji).filter(c=>c!=='Income');
  const catSpend = cats.map(c=>({ c, amt:thisMonth.filter(t=>t.type==='expense'&&t.category===c).reduce((s,t)=>s+t.amount,0) }));
  const top = catSpend.sort((a,b)=>b.amt-a.amt)[0];
  const profile = currentUser.profile;
  const name = firstName();

  const tips = [
    top&&top.amt>0 ? `Your biggest expense this month is ${top.c} at ${formatCurrency(top.amt)}. Try reducing it by 10% next month to save ${formatCurrency(top.amt*0.1)}.` : null,
    totalIncome>0&&totalExpense>totalIncome*0.8 ? `${name}, you've used ${Math.round(totalExpense/totalIncome*100)}% of your income. Try to keep expenses under 80%.` : null,
    profile?.goal ? `Remember your goal: "${profile.goal}". Every small saving counts!` : null,
    `Track every small expense too — ₹50 here and there adds up to ${formatCurrency(50*30)} a month!`,
    `${name}, the 50/30/20 rule: 50% needs, 30% wants, 20% savings. Try applying it this month!`,
  ].filter(Boolean);

  return tips[new Date().getDate() % tips.length];
}

// ========== CHARTS ==========
function renderCharts() { renderCategoryChart(); renderTrendChart(); }

function renderCategoryChart() {
  const ctx = document.getElementById('categoryChart')?.getContext('2d');
  if (!ctx) return;
  const ym = nowYM();
  const cats = Object.keys(categoryEmoji).filter(c=>c!=='Income');
  const filtered = cats.map((cat,i)=>({ cat, val:transactions.filter(t=>t.type==='expense'&&t.category===cat&&t.date.startsWith(ym)).reduce((s,t)=>s+t.amount,0), color:categoryColors[i] })).filter(x=>x.val>0);
  if(categoryChartInstance) categoryChartInstance.destroy();
  categoryChartInstance = new Chart(ctx,{
    type:'doughnut', data:{ labels:filtered.map(x=>x.cat), datasets:[{data:filtered.map(x=>x.val),backgroundColor:filtered.map(x=>x.color),borderWidth:0,hoverOffset:8}] },
    options:{ responsive:true, cutout:'65%', plugins:{ legend:{display:false}, tooltip:{callbacks:{label:ctx=>' ₹'+ctx.parsed.toLocaleString('en-IN')}} } }
  });
  document.getElementById('legendContainer').innerHTML = filtered.map(x=>`<div class="legend-item"><div class="legend-dot" style="background:${x.color}"></div>${x.cat}</div>`).join('');
}

function renderTrendChart() {
  const ctx = document.getElementById('trendChart')?.getContext('2d');
  if (!ctx) return;
  const months = getLast6Months();
  const incomeData  = months.map(m=>transactions.filter(t=>t.type==='income'&&t.date.startsWith(m)).reduce((s,t)=>s+t.amount,0));
  const expenseData = months.map(m=>transactions.filter(t=>t.type==='expense'&&t.date.startsWith(m)).reduce((s,t)=>s+t.amount,0));
  const labels = months.map(m=>{ const [y,mo]=m.split('-'); return new Date(y,mo-1).toLocaleString('en',{month:'short'}); });
  if(trendChartInstance) trendChartInstance.destroy();
  trendChartInstance = new Chart(ctx,{
    type:'bar', data:{ labels, datasets:[{label:'Income',data:incomeData,backgroundColor:'#22c55e88',borderRadius:6},{label:'Expense',data:expenseData,backgroundColor:'#ef444488',borderRadius:6}] },
    options:{ responsive:true, plugins:{legend:{position:'top',labels:{font:{family:'Satoshi'},usePointStyle:true}}}, scales:{x:{grid:{display:false}},y:{grid:{color:'rgba(0,0,0,0.05)'},ticks:{callback:v=>'₹'+(v/1000).toFixed(0)+'k'}}} }
  });
}

// ========== RECENT TRANSACTIONS ==========
function renderRecentList() {
  const list = document.getElementById('recentList');
  list.innerHTML = transactions.slice(0,5).length ? transactions.slice(0,5).map(txnHTML).join('') : emptyState('No transactions yet');
}

function renderAllTransactions() {
  const search = (document.getElementById('searchBox')?.value||'').toLowerCase();
  const cat    = document.getElementById('filterCategory')?.value||'all';
  const type   = document.getElementById('filterType')?.value||'all';
  const filtered = transactions.filter(t=> t.title.toLowerCase().includes(search)&&(cat==='all'||t.category===cat)&&(type==='all'||t.type===type));
  document.getElementById('allTxnList').innerHTML = filtered.length?filtered.map(txnHTML).join(''):emptyState('No matching transactions');
}

function txnHTML(t) {
  return `<li class="txn-item">
    <div class="txn-emoji">${categoryEmoji[t.category]||'📦'}</div>
    <div class="txn-info"><div class="txn-title">${t.title}</div><div class="txn-meta">${t.category} · ${formatDate(t.date)}${t.note?' · '+t.note:''}</div></div>
    <div class="txn-amount ${t.type}">${t.type==='income'?'+':'-'}${formatCurrency(t.amount)}</div>
    <button class="txn-del" onclick="deleteTransaction(${t.id})"><i class="fa-solid fa-trash"></i></button>
  </li>`;
}

// ========== BUDGET ==========
function renderBudget() {
  const ym   = nowYM();
  const cats = Object.keys(categoryEmoji).filter(c=>c!=='Income');

  // Smart budget suggestion
  const months = getLast6Months().slice(0,3);
  const suggestions = [];
  cats.forEach(cat=>{
    const avg = months.reduce((s,m)=>s+transactions.filter(t=>t.type==='expense'&&t.category===cat&&t.date.startsWith(m)).reduce((a,t)=>a+t.amount,0),0)/3;
    if(avg>0&&budgets[cat]>0){
      if(avg>budgets[cat]*1.1) suggestions.push(`📈 ${cat}: You avg ₹${Math.round(avg)}/month but budget is ₹${budgets[cat]}. Consider increasing to ₹${Math.round(avg*1.1)}.`);
      if(avg<budgets[cat]*0.6) suggestions.push(`📉 ${cat}: You only use ₹${Math.round(avg)}/month — can reduce budget from ₹${budgets[cat]} to ₹${Math.round(avg*1.2)}.`);
    }
  });
  const sugg = document.getElementById('smartBudgetSuggest');
  if(suggestions.length){ sugg.style.display='block'; sugg.innerHTML=`🤖 <strong>AI Budget Tips for ${firstName()}:</strong><br>`+suggestions.slice(0,3).join('<br>'); }
  else sugg.style.display='none';

  document.getElementById('budgetGrid').innerHTML = cats.map(cat=>{
    const spent=transactions.filter(t=>t.type==='expense'&&t.category===cat&&t.date.startsWith(ym)).reduce((s,t)=>s+t.amount,0);
    const limit=budgets[cat]||0;
    const pct=limit>0?Math.min((spent/limit)*100,100).toFixed(1):0;
    const color=pct>=100?'#ef4444':pct>=80?'#f97316':'#22c55e';
    const warn=pct>=100?`<div class="budget-warn-pct" style="color:#ef4444">🚨 Budget Exceeded!</div>`:pct>=80?`<div class="budget-warn-pct" style="color:#f97316">⚠️ ${pct}% used — careful!</div>`:'';
    return `<div class="budget-card">
      <div class="budget-card-header"><div class="budget-card-title">${categoryEmoji[cat]} ${cat}</div><div class="budget-spent">${formatCurrency(spent)} / ${formatCurrency(limit)}</div></div>
      <div class="budget-bar-wrap"><div class="budget-bar" style="width:${pct}%;background:${color}"></div></div>
      ${warn}
      <div class="budget-input-wrap"><input type="number" id="budget_${cat}" value="${limit}" placeholder="Set budget"/><button class="budget-save" onclick="saveBudget('${cat}')">Save</button></div>
    </div>`;
  }).join('');
}

function saveBudget(cat) {
  const val=parseFloat(document.getElementById('budget_'+cat).value);
  if(!val||val<0) return showToast('Enter valid budget','error');
  budgets[cat]=val; save(); renderBudget(); showToast(`Budget for ${cat} updated!`,'success');
}

// ========== GOALS ==========
function addGoal() {
  const name=document.getElementById('goalName').value.trim();
  const target=parseFloat(document.getElementById('goalTarget').value);
  const deadline=document.getElementById('goalDeadline').value;
  const saved=parseFloat(document.getElementById('goalSaved').value)||0;
  if(!name)return showToast('Enter goal name','error');
  if(!target||target<1)return showToast('Enter target amount','error');
  if(!deadline)return showToast('Select a deadline','error');
  goals.push({id:Date.now(),name,target,deadline,saved});
  save(); renderGoals(); showToast('🎯 Goal added!','success');
  document.getElementById('goalName').value='';
  document.getElementById('goalTarget').value='';
  document.getElementById('goalDeadline').value='';
  document.getElementById('goalSaved').value='';
}
function deleteGoal(id){ goals=goals.filter(g=>g.id!==id); save(); renderGoals(); showToast('Goal removed','error'); }
function renderGoals() {
  const c=document.getElementById('goalsList');
  if(!goals.length){c.innerHTML=emptyState('No goals yet. Add one above!');return;}
  c.innerHTML=goals.map(g=>{
    const pct=Math.min((g.saved/g.target)*100,100).toFixed(1);
    const remaining=g.target-g.saved;
    const daysLeft=Math.ceil((new Date(g.deadline)-new Date())/(1000*60*60*24));
    const monthsLeft=Math.max(1,(daysLeft/30));
    const perMonth=remaining>0?(remaining/monthsLeft).toFixed(0):0;
    const barColor=pct>=100?'#22c55e':pct>=60?'#f0e040':'#3b82f6';
    return `<div class="goal-card">
      <div class="goal-header">
        <div><div class="goal-name">${g.name}</div><div class="goal-deadline">Deadline: ${formatDate(g.deadline)} ${daysLeft>0?'('+daysLeft+' days left)':'⏰ Past deadline'}</div></div>
        <button class="goal-del-btn" onclick="deleteGoal(${g.id})"><i class="fa-solid fa-trash"></i></button>
      </div>
      <div class="goal-amounts">Saved: <strong>${formatCurrency(g.saved)}</strong> of <strong>${formatCurrency(g.target)}</strong> (${formatCurrency(remaining)} to go)</div>
      <div class="goal-bar-wrap"><div class="goal-bar" style="width:${pct}%;background:${barColor}"></div></div>
      <div class="goal-pct">${pct}% complete ${pct>=100?'🎉':''}</div>
      ${remaining>0&&daysLeft>0?`<div class="goal-tip">💡 Save ${formatCurrency(perMonth)}/month to reach your goal in time</div>`:''}
      ${pct<100?`<div style="margin-top:10px;display:flex;gap:8px"><input type="number" id="gs_${g.id}" placeholder="Add savings (₹)" style="flex:1;padding:7px 11px;border:1px solid var(--border);border-radius:8px;background:var(--bg);color:var(--text);font-size:13px;outline:none"/><button onclick="addToGoal(${g.id})" style="padding:7px 14px;background:var(--accent);color:#000;border:none;border-radius:8px;cursor:pointer;font-weight:700;font-size:13px">Add</button></div>`:''}
    </div>`;
  }).join('');
}
function addToGoal(id){
  const val=parseFloat(document.getElementById('gs_'+id).value);
  if(!val||val<=0)return showToast('Enter a valid amount','error');
  const g=goals.find(g=>g.id===id);if(!g)return;
  g.saved=Math.min(g.target,g.saved+val);save();renderGoals();showToast('Progress updated!','success');
}

// ========== RECURRING ==========
function addRecurring(){
  const title=document.getElementById('recTitle').value.trim();
  const amount=parseFloat(document.getElementById('recAmount').value);
  const day=parseInt(document.getElementById('recDay').value);
  const category=document.getElementById('recCategory').value;
  if(!title)return showToast('Enter a title','error');
  if(!amount||amount<1)return showToast('Enter valid amount','error');
  if(!day||day<1||day>28)return showToast('Enter day between 1-28','error');
  recurringList.push({id:Date.now(),title,amount,day,category});
  save();renderRecurring();showToast('🔄 Recurring saved!','success');
  document.getElementById('recTitle').value='';
  document.getElementById('recAmount').value='';
  document.getElementById('recDay').value='';
}
function deleteRecurring(id){recurringList=recurringList.filter(r=>r.id!==id);save();renderRecurring();showToast('Removed','error');}
function renderRecurring(){
  const c=document.getElementById('recurringList');
  if(!recurringList.length){c.innerHTML=emptyState('No recurring expenses yet');return;}
  c.innerHTML=`<div class="rec-list">${recurringList.map(r=>`<div class="rec-item"><div class="txn-emoji">${categoryEmoji[r.category]||'📦'}</div><div class="rec-info"><div class="rec-title">${r.title}</div><div class="rec-meta">${r.category} · Day ${r.day} every month</div></div><div class="rec-amount">-${formatCurrency(r.amount)}/mo</div><button class="rec-del-btn" onclick="deleteRecurring(${r.id})"><i class="fa-solid fa-trash"></i></button></div>`).join('')}</div>`;
}
function processRecurring(){
  if(!recurringList.length)return showToast('No recurring expenses set','error');
  const now=new Date();
  const dateStr=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  let added=0;
  recurringList.forEach(r=>{
    const exists=transactions.some(t=>t.title===r.title&&t.date.startsWith(dateStr.substring(0,7))&&t.note==='auto-recurring');
    if(!exists){transactions.unshift({id:Date.now()+Math.random(),title:r.title,amount:r.amount,date:dateStr,category:r.category,note:'auto-recurring',type:'expense'});added++;}
  });
  save();
  if(added>0){showToast(`✅ ${added} recurring expense(s) added!`,'success');renderDashboard();}
  else showToast('Already processed this month','error');
}

// ========== SPLIT ==========
function addSplit(){
  const desc=document.getElementById('splitDesc').value.trim();
  const total=parseFloat(document.getElementById('splitTotal').value);
  const date=document.getElementById('splitDate').value;
  const raw=document.getElementById('splitPeople').value;
  if(!desc)return showToast('Enter description','error');
  if(!total||total<1)return showToast('Enter total amount','error');
  if(!date)return showToast('Select a date','error');
  if(!raw.trim())return showToast('Enter people names','error');
  const people=raw.split(',').map(p=>p.trim()).filter(Boolean);
  if(!people.length)return showToast('Enter at least one person','error');
  const perPerson=total/(people.length+1);
  splits.push({id:Date.now(),desc,total,date,people:people.map(name=>({name,amount:perPerson,paid:false}))});
  save();renderSplits();showToast('Split expense added!','success');
  document.getElementById('splitDesc').value='';
  document.getElementById('splitTotal').value='';
  document.getElementById('splitDate').value='';
  document.getElementById('splitPeople').value='';
}
function toggleSplitPaid(splitId,i){const s=splits.find(s=>s.id===splitId);if(!s)return;s.people[i].paid=!s.people[i].paid;save();renderSplits();}
function deleteSplit(id){splits=splits.filter(s=>s.id!==id);save();renderSplits();showToast('Split removed','error');}
function renderSplits(){
  const c=document.getElementById('splitList');
  if(!splits.length){c.innerHTML=emptyState('No split expenses yet');return;}
  c.innerHTML=splits.map(s=>{
    const owed=s.people.filter(p=>!p.paid).reduce((sum,p)=>sum+p.amount,0);
    return `<div class="split-card">
      <div class="split-header"><div><div class="split-desc">${s.desc}</div><div class="split-total">Total: ${formatCurrency(s.total)} · ${formatDate(s.date)} · Owed: ${formatCurrency(owed)}</div></div><button class="split-del-btn" onclick="deleteSplit(${s.id})"><i class="fa-solid fa-trash"></i></button></div>
      <div class="split-people">${s.people.map((p,i)=>`<div class="split-person"><span class="split-person-name">👤 ${p.name}</span><span class="split-person-amt">${formatCurrency(p.amount)}</span><button class="split-paid-btn ${p.paid?'paid':'unpaid'}" onclick="toggleSplitPaid(${s.id},${i})">${p.paid?'✅ Paid':'Mark Paid'}</button></div>`).join('')}</div>
    </div>`;
  }).join('');
}

// ========== SMS IMPORT ==========
function parseSMS(){
  const text=document.getElementById('smsText').value.trim();
  if(!text)return showToast('Please paste some SMS text','error');
  const results=extractFromSMS(text);
  const c=document.getElementById('smsResults');
  if(!results.length){c.innerHTML=`<div class="empty-state"><i class="fa-solid fa-comment-slash"></i><p>No expense transactions found.<br><small>Make sure SMS contains debit/payment info.</small></p></div>`;return;}
  c.innerHTML=`<h3 style="font-family:var(--font-head);font-size:16px;font-weight:700;margin-bottom:14px">Found ${results.length} transaction(s):</h3>`+
    results.map((r,i)=>`<div class="sms-result-card" id="smsCard_${i}"><div class="txn-emoji">${categoryEmoji[r.category]||'📦'}</div><div class="sms-info"><div class="sms-title">${r.title}</div><div class="sms-meta">${r.category} · ${r.date}</div></div><div class="sms-amt">-${formatCurrency(r.amount)}</div><button class="sms-add-btn" id="smsBtn_${i}" onclick="addSMSTxn(${i},'${encodeURIComponent(JSON.stringify(r))}')">+ Add</button><button class="sms-ignore-btn" onclick="document.getElementById('smsCard_${i}').remove()">Ignore</button></div>`).join('');
  showToast(`Found ${results.length} transaction(s)!`,'success');
}
function addSMSTxn(idx,encoded){
  const r=JSON.parse(decodeURIComponent(encoded));
  transactions.unshift({id:Date.now(),title:r.title,amount:r.amount,date:r.date,category:r.category,note:'via SMS import',type:'expense'});
  save();
  const btn=document.getElementById('smsBtn_'+idx);
  if(btn){btn.textContent='✅ Added';btn.classList.add('added');btn.disabled=true;}
  showToast('Expense added from SMS!','success');
}
function extractFromSMS(text){
  const skipPatterns=[/otp|one.time.password/i,/credited|received|deposited(?!.*refund)/i,/available.balance|avl.bal/i,/enquiry/i,/sent to yourself/i];
  const amountPatterns=[/(?:Rs\.?|INR|₹)\s*(\d[\d,]*(?:\.\d{1,2})?)/gi,/(\d[\d,]*(?:\.\d{1,2})?)\s*(?:Rs\.?|INR|₹)/gi];
  const merchantPatterns=[/(?:to|at|for|paid to|payment to)\s+([A-Z][A-Za-z0-9\s&'-]{2,30}?)(?:\s+on|\s+via|\.|\,|$)/i,/(?:UPI|IMPS|NEFT).*?(?:to|@)\s*([A-Za-z0-9\s&'-]+?)(?:\s+on|\s+via|\.|\,|$)/i];
  const brandMap={Swiggy:'Food',Zomato:'Food',Amazon:'Shopping',Flipkart:'Shopping',Myntra:'Shopping',Ola:'Transport',Uber:'Transport',Rapido:'Transport',IRCTC:'Transport',Jio:'Bills',Airtel:'Bills',Netflix:'Entertainment',Hotstar:'Entertainment',BookMyShow:'Entertainment',PVR:'Entertainment',BigBasket:'Food',Blinkit:'Food',Zepto:'Food',DMart:'Food'};
  const blocks=[text,...text.split(/\n{2,}/)];
  const results=[]; const seen=new Set();
  blocks.forEach(block=>{
    if(skipPatterns.some(p=>p.test(block)))return;
    if(!/debit|paid|payment|spent|charged|debited|withdrawn|purchase/i.test(block))return;
    let amount=null;
    for(const pat of amountPatterns){pat.lastIndex=0;const m=pat.exec(block);if(m){amount=parseFloat(m[1].replace(/,/g,''));break;}}
    if(!amount||amount<=0||amount>200000)return;
    if(/sent to [A-Z][a-z]+ [A-Z][a-z]+/i.test(block))return;
    let merchant='UPI Payment',category='Other';
    for(const [brand,cat] of Object.entries(brandMap)){if(new RegExp(brand,'i').test(block)){merchant=brand;category=cat;break;}}
    if(merchant==='UPI Payment'){for(const pat of merchantPatterns){const m=pat.exec(block);if(m&&m[1]){merchant=m[1].trim();break;}}}
    // auto-detect category from merchant name
    for(const [cat,kws] of Object.entries(categoryKeywords)){if(kws.some(k=>merchant.toLowerCase().includes(k))){category=cat;break;}}
    let dateStr=new Date().toISOString().split('T')[0];
    const dm=block.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if(dm){let[,d,mo,y]=dm;if(y.length===2)y='20'+y;dateStr=`${y}-${mo.padStart(2,'0')}-${d.padStart(2,'0')}`;}
    const key=`${amount}_${merchant}_${dateStr}`;
    if(seen.has(key))return;seen.add(key);
    results.push({title:merchant+' payment',merchant,amount,date:dateStr,category});
  });
  return results;
}

// ========== AI INSIGHTS ==========
function renderInsights(){
  document.getElementById('insightsSubtitle').textContent=`Personalized analysis for ${firstName()}`;
  const c=document.getElementById('insightsContainer');
  const ym=nowYM();
  const prevD=new Date(); prevD.setMonth(prevD.getMonth()-1);
  const prevYm=`${prevD.getFullYear()}-${String(prevD.getMonth()+1).padStart(2,'0')}`;
  const thisMonth=transactions.filter(t=>t.date.startsWith(ym));
  const lastMonth=transactions.filter(t=>t.date.startsWith(prevYm));
  if(thisMonth.length<2){c.innerHTML=emptyState(`Add at least a few transactions, ${firstName()}, to get AI insights!`);return;}

  const insights=[];
  const cats=Object.keys(categoryEmoji).filter(c=>c!=='Income');
  const catSpend=cats.map(c=>({cat:c,amt:thisMonth.filter(t=>t.type==='expense'&&t.category===c).reduce((s,t)=>s+t.amount,0)}));
  const topCat=catSpend.sort((a,b)=>b.amt-a.amt)[0];
  if(topCat&&topCat.amt>0) insights.push({icon:'🏆',bg:'#fef9c3',color:'#854d0e',title:`${firstName()}'s biggest spend: ${topCat.cat}`,desc:`You spent ${formatCurrency(topCat.amt)} on ${topCat.cat} this month. This is your highest expense category.`,tag:'Top Category',tagBg:'#fef9c3',tagColor:'#854d0e'});

  const thisExp=thisMonth.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const lastExp=lastMonth.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  if(lastExp>0){const diff=thisExp-lastExp;const pct=Math.abs((diff/lastExp)*100).toFixed(0);insights.push({icon:diff>0?'📈':'📉',bg:diff>0?'#fee2e2':'#dcfce7',color:diff>0?'#b91c1c':'#15803d',title:diff>0?`${firstName()}, spending up ${pct}% vs last month`:`Great job ${firstName()}! Spending down ${pct}%`,desc:diff>0?`You spent ${formatCurrency(Math.abs(diff))} more than last month. Check which category increased.`:`You saved ${formatCurrency(Math.abs(diff))} compared to last month. Excellent discipline!`,tag:diff>0?'Warning':'Great Job',tagBg:diff>0?'#fee2e2':'#dcfce7',tagColor:diff>0?'#b91c1c':'#15803d'});}

  const overBudget=cats.filter(cat=>{const spent=thisMonth.filter(t=>t.type==='expense'&&t.category===cat).reduce((s,t)=>s+t.amount,0);return budgets[cat]>0&&spent>budgets[cat];});
  if(overBudget.length) insights.push({icon:'🚨',bg:'#fee2e2',color:'#b91c1c',title:`Over budget in ${overBudget.length} category`,desc:`${firstName()}, you exceeded your budget in: ${overBudget.join(', ')}. Consider adjusting your spending.`,tag:'Action Needed',tagBg:'#fee2e2',tagColor:'#b91c1c'});

  const totalIncome=thisMonth.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  if(totalIncome>0){const saved=totalIncome-thisExp;const rate=(saved/totalIncome*100).toFixed(0);const tip=rate>=30?`Excellent ${firstName()}! You're saving over 30% — financial experts recommend 20-30%.`:rate>=20?`Good savings rate, ${firstName()}! You're hitting the recommended 20% target.`:rate>=10?`You're saving a bit, ${firstName()}. Try to push towards 20% by cutting one category.`:`${firstName()}, your savings rate is low. Track your biggest expense and reduce it by 10% next month.`;insights.push({icon:'💰',bg:'#dbeafe',color:'#1d4ed8',title:`${firstName()}'s savings rate: ${rate}%`,desc:tip,tag:'Savings',tagBg:'#dbeafe',tagColor:'#1d4ed8'});}

  const dayCount={};
  thisMonth.filter(t=>t.type==='expense').forEach(t=>{const day=new Date(t.date).toLocaleString('en',{weekday:'long'});dayCount[day]=(dayCount[day]||0)+1;});
  const topDay=Object.entries(dayCount).sort((a,b)=>b[1]-a[1])[0];
  if(topDay) insights.push({icon:'📅',bg:'#ede9fe',color:'#6d28d9',title:`${firstName()} spends most on ${topDay[0]}s`,desc:`${topDay[0]} is your highest spending day with ${topDay[1]} transactions. Plan purchases on other days to save more.`,tag:'Pattern',tagBg:'#ede9fe',tagColor:'#6d28d9'});

  // Unusual spending detection
  cats.forEach(cat=>{
    const catTxns=thisMonth.filter(t=>t.type==='expense'&&t.category===cat);
    if(catTxns.length<3)return;
    const avg=catTxns.reduce((s,t)=>s+t.amount,0)/catTxns.length;
    const unusual=catTxns.filter(t=>t.amount>avg*2.5);
    if(unusual.length) insights.push({icon:'⚠️',bg:'#fff7ed',color:'#7c2d12',title:`Unusual ${cat} expense detected`,desc:`${firstName()}, you have ${unusual.length} transaction(s) in ${cat} that are more than 2.5x your average. Check: ${unusual.map(t=>t.title+' ('+formatCurrency(t.amount)+')').join(', ')}.`,tag:'Unusual',tagBg:'#fff7ed',tagColor:'#7c2d12'});
  });

  c.innerHTML=insights.map(ins=>`<div class="insight-card"><div class="insight-icon" style="background:${ins.bg};color:${ins.color}">${ins.icon}</div><div class="insight-body"><h4>${ins.title}</h4><p>${ins.desc}</p><span class="insight-tag" style="background:${ins.tagBg};color:${ins.tagColor}">${ins.tag}</span></div></div>`).join('');
}

// ========== AI SPENDING PREDICTION ==========
function renderPrediction(){
  document.getElementById('predictSubtitle').textContent=`Next month forecast for ${firstName()}`;
  const c=document.getElementById('predictContainer');
  const months=getLast6Months().slice(0,3);
  if(transactions.length<5){c.innerHTML=emptyState(`${firstName()}, add more transactions to get predictions!`);return;}
  const cats=Object.keys(categoryEmoji).filter(c=>c!=='Income');
  const predictions=cats.map(cat=>{
    const monthAmts=months.map(m=>transactions.filter(t=>t.type==='expense'&&t.category===cat&&t.date.startsWith(m)).reduce((s,t)=>s+t.amount,0));
    const avg=monthAmts.reduce((s,v)=>s+v,0)/3;
    const latest=monthAmts[0];
    const trend=latest>avg*1.1?'up':latest<avg*0.9?'down':'same';
    const prediction=trend==='up'?avg*1.15:trend==='down'?avg*0.9:avg;
    return {cat,avg,prediction,trend};
  }).filter(x=>x.avg>0).sort((a,b)=>b.prediction-a.prediction);

  const totalPred=predictions.reduce((s,p)=>s+p.prediction,0);
  const profile=currentUser.profile;
  const income=profile?.income||0;

  c.innerHTML=`
    <div class="predict-card">
      <h3>📊 Next Month Prediction for ${firstName()}</h3>
      <div style="background:var(--bg);border-radius:12px;padding:16px;margin-bottom:16px;text-align:center">
        <div style="font-size:13px;color:var(--subtext);margin-bottom:4px">Estimated Total Spending</div>
        <div style="font-family:var(--font-head);font-size:32px;font-weight:700;color:var(--expense)">${formatCurrency(totalPred)}</div>
        ${income>0?`<div style="font-size:13px;color:var(--subtext);margin-top:4px">That's ${Math.round(totalPred/income*100)}% of your monthly income of ${formatCurrency(income)}</div>`:''}
      </div>
      ${predictions.map(p=>`
        <div class="predict-row">
          <div class="predict-cat"><span>${categoryEmoji[p.cat]}</span><span>${p.cat}</span></div>
          <div style="display:flex;align-items:center;gap:10px">
            <span class="predict-amt">${formatCurrency(p.prediction)}</span>
            <span class="predict-trend ${p.trend==='up'?'trend-up':p.trend==='down'?'trend-down':'trend-same'}">${p.trend==='up'?'▲ Going up':p.trend==='down'?'▼ Going down':'→ Stable'}</span>
          </div>
        </div>`).join('')}
    </div>
    <div class="predict-card">
      <h3>💡 ${firstName()}'s Action Plan</h3>
      ${predictions.filter(p=>p.trend==='up').length?
        `<div class="unusual-alert">📈 These categories are trending up: <strong>${predictions.filter(p=>p.trend==='up').map(p=>p.cat).join(', ')}</strong>. Try reducing these next month.</div>`:''}
      ${income>0&&totalPred>income*0.8?
        `<div class="alert-banner">${firstName()}, predicted spending is ${Math.round(totalPred/income*100)}% of income. You might only save ${formatCurrency(income-totalPred)} next month. Try to cut ${formatCurrency(totalPred-income*0.7)} from non-essential categories.</div>`:''}
      ${income>0&&totalPred<=income*0.7?
        `<div class="tip-banner">🎉 Great outlook, ${firstName()}! You're predicted to save ${formatCurrency(income-totalPred)} next month (${Math.round((income-totalPred)/income*100)}% savings rate).</div>`:''}
    </div>`;
}

// ========== AI CHATBOT ==========
function initChatbot(){
  document.getElementById('chatSubtitle').textContent=`Personal AI assistant for ${firstName()}`;
  const msgs=document.getElementById('chatMessages');
  msgs.innerHTML='';
  const greeting=`Namaste ${firstName()}! 👋 Main aapka personal AI financial assistant hoon. Aap mujhse apne finances ke baare mein kuch bhi puch sakte ho — expenses, savings, budget, predictions, ya koi bhi financial advice. Main aapke actual data ke basis par jawab dunga!`;
  appendAIMessage(greeting);
  showSuggestions([
    `Is mahine kitna kharch kiya?`,
    `Meri savings kaise improve karu?`,
    `Kahan se paise bachau?`,
    `Budget advice do`,
    `Next month prediction`
  ]);
}

function focusChat(){ document.getElementById('chatInput')?.focus(); }

function sendChat(){
  const input=document.getElementById('chatInput');
  const msg=input.value.trim();
  if(!msg)return;
  input.value='';
  appendUserMessage(msg);
  chatHistory.push({role:'user',content:msg});
  showTyping();
  setTimeout(()=>{
    const reply=generateChatReply(msg);
    removeTyping();
    appendAIMessage(reply);
    chatHistory.push({role:'assistant',content:reply});
    showSuggestions(getFollowUpSuggestions(msg));
  }, 800);
}

function generateChatReply(msg){
  const m=msg.toLowerCase();
  const name=firstName();
  const ym=nowYM();
  const thisMonth=transactions.filter(t=>t.date.startsWith(ym));
  const totalExpense=thisMonth.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const totalIncome=thisMonth.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const balance=totalIncome-totalExpense;
  const cats=Object.keys(categoryEmoji).filter(c=>c!=='Income');
  const catSpend=cats.map(c=>({cat:c,amt:thisMonth.filter(t=>t.type==='expense'&&t.category===c).reduce((s,t)=>s+t.amount,0)})).filter(x=>x.amt>0).sort((a,b)=>b.amt-a.amt);
  const profile=currentUser?.profile;

  // Total spending
  if(m.includes('kitna kharch')||m.includes('total expense')||m.includes('total spending')||m.includes('kharch kiya')){
    if(totalExpense===0) return `${name}, is mahine abhi tak koi expense add nahi ki hai. Expenses add karo aur main aapko detailed analysis dunga! 😊`;
    return `${name}, is mahine aapne kul **${formatCurrency(totalExpense)}** kharch kiya hai.\n\nCategory-wise breakdown:\n${catSpend.map(c=>`• ${categoryEmoji[c.cat]} ${c.cat}: ${formatCurrency(c.amt)}`).join('\n')}\n\nSabse zyada ${catSpend[0]?.cat||'N/A'} pe kharch hua hai.`;
  }

  // Savings
  if(m.includes('saving')||m.includes('bachau')||m.includes('bache')||m.includes('save')){
    if(totalIncome===0) return `${name}, pehle apni income add karo "Add Transaction" mein — tab main savings calculate kar sakta hoon!`;
    const rate=Math.round((balance/totalIncome)*100);
    const tip=rate>=30?`Excellent! Aap ${rate}% save kar rahe ho — yeh bahut achha hai! 🎉`:rate>=20?`Good job, ${name}! Aap ${rate}% save kar rahe ho. Target 30% rakhein.`:rate>=0?`${name}, abhi aap sirf ${rate}% save kar rahe ho. Kuch tips:\n• ${catSpend[0]?.cat||'Top'} expenses 10% kam karo\n• Recurring subscriptions check karo\n• 50/30/20 rule follow karo`:`${name}, is mahine expenses income se zyada hain! Turant kuch expenses reduce karo.`;
    return `${name}, is mahine:\n• Income: ${formatCurrency(totalIncome)}\n• Expenses: ${formatCurrency(totalExpense)}\n• Saved: ${formatCurrency(balance)} (${rate}%)\n\n${tip}`;
  }

  // Budget
  if(m.includes('budget')){
    const overBudget=cats.filter(cat=>{const s=thisMonth.filter(t=>t.type==='expense'&&t.category===cat).reduce((a,t)=>a+t.amount,0);return budgets[cat]>0&&s>budgets[cat];});
    if(overBudget.length) return `${name}, aap in categories mein budget se zyada kharch kar chuke ho:\n${overBudget.map(c=>{ const s=thisMonth.filter(t=>t.type==='expense'&&t.category===c).reduce((a,t)=>a+t.amount,0); return `• ${categoryEmoji[c]} ${c}: ${formatCurrency(s)} (limit: ${formatCurrency(budgets[c])})`; }).join('\n')}\n\nBudget tab mein jakar limits adjust karo ya expenses kam karo.`;
    return `${name}, abhi aap saare budgets ke andar ho! 🎉\nKisi bhi category ka budget change karne ke liye Budget tab mein jao.`;
  }

  // Food
  if(m.includes('food')||m.includes('khana')||m.includes('restaurant')||m.includes('swiggy')||m.includes('zomato')){
    const foodAmt=thisMonth.filter(t=>t.type==='expense'&&t.category==='Food').reduce((s,t)=>s+t.amount,0);
    const foodBudget=budgets['Food']||0;
    return `${name}, is mahine Food pe ${formatCurrency(foodAmt)} kharch kiya${foodBudget>0?` (Budget: ${formatCurrency(foodBudget)}, ${Math.round(foodAmt/foodBudget*100)}% used)`:''}.\n\nFood expenses kam karne ke tips:\n• Ghar pe khana banao — week mein 2 din\n• Swiggy/Zomato orders limit karo\n• Lunch dabba ghar se le jao\n• Meal plan banao shopping se pehle`;
  }

  // Transport
  if(m.includes('transport')||m.includes('petrol')||m.includes('uber')||m.includes('ola')){
    const tAmt=thisMonth.filter(t=>t.type==='expense'&&t.category==='Transport').reduce((s,t)=>s+t.amount,0);
    return `${name}, Transport pe ${formatCurrency(tAmt)} gaya is mahine.\n\nTransport bachane ke tips:\n• Metro/bus use karo jahan possible ho\n• Carpooling try karo\n• Week mein 1-2 din WFH karo\n• Rapido bike taxi cheaper hota hai`;
  }

  // Prediction
  if(m.includes('predict')||m.includes('agla mahina')||m.includes('next month')||m.includes('forecast')){
    const months=getLast6Months().slice(0,3);
    const avgExp=months.reduce((s,m)=>s+transactions.filter(t=>t.type==='expense'&&t.date.startsWith(m)).reduce((a,t)=>a+t.amount,0),0)/3;
    return `${name}, last 3 months ke data se:\n• Average monthly spending: ${formatCurrency(avgExp)}\n• Next month estimate: ${formatCurrency(avgExp*1.05)}\n\n${profile?.income&&avgExp>profile.income*0.8?`⚠️ Yeh aapki income ka ${Math.round(avgExp/profile.income*100)}% hai — thoda zyada lag raha hai.`:'👍 Aap apni income ke andar kharch kar rahe ho!'}\n\nDetailed prediction ke liye "Prediction" tab dekhein.`;
  }

  // Greeting
  if(m.includes('hello')||m.includes('hi ')||m.includes('namaste')||m.includes('hii')){
    return `Namaste ${name}! 😊 Main theek hoon, shukriya!\n\nAaj main aapki kaise help kar sakta hoon? Aap puch sakte ho:\n• Is mahine ka spending summary\n• Savings improve karne ke tips\n• Budget advice\n• Category-wise analysis\n• Next month prediction`;
  }

  // Tips general
  if(m.includes('tip')||m.includes('advice')||m.includes('suggest')||m.includes('improve')){
    const top2=catSpend.slice(0,2);
    return `${name} ke liye personalized tips:\n\n${top2.map(c=>`💡 ${c.cat} pe ${formatCurrency(c.amt)} kharch kiya — yeh kuch kam karo`).join('\n')}\n\n📌 General tips:\n• Har din expense track karo\n• Emergency fund banao (3 months expenses)\n• Subscriptions audit karo — koi chhoot toh nahi raha?\n• 50/30/20 rule: 50% needs, 30% wants, 20% savings`;
  }

  // Goals
  if(m.includes('goal')||m.includes('target')||m.includes('bachat')){
    if(goals.length===0) return `${name}, abhi koi savings goal set nahi hai. Goals tab mein jaake goal add karo — jaise "New Phone", "Goa Trip", "Emergency Fund" — aur main progress track karne mein help karunga!`;
    return `${name}, aapke current goals:\n${goals.map(g=>{ const pct=Math.min((g.saved/g.target)*100,100).toFixed(0); return `• ${g.name}: ${formatCurrency(g.saved)}/${formatCurrency(g.target)} (${pct}%)`; }).join('\n')}\n\nGoals tab mein savings add karo progress update karne ke liye!`;
  }

  // Fallback
  return `${name}, main samjha nahi poori baat. Aap mujhse puch sakte ho:\n• "Is mahine kitna kharch kiya?"\n• "Savings kaise improve karu?"\n• "Food expenses zyada hain?"\n• "Budget advice do"\n• "Next month prediction"\n• "Goals update karo"\n\nKya aap dobara puchenge? 😊`;
}

function appendUserMessage(msg){
  const c=document.getElementById('chatMessages');
  c.innerHTML+=`<div class="chat-msg user"><div class="chat-avatar"><i class="fa-solid fa-user"></i></div><div class="chat-bubble">${msg}</div></div>`;
  c.scrollTop=c.scrollHeight;
}

function appendAIMessage(msg){
  const c=document.getElementById('chatMessages');
  const formatted=msg.replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');
  c.innerHTML+=`<div class="chat-msg ai"><div class="chat-avatar"><i class="fa-solid fa-robot"></i></div><div class="chat-bubble">${formatted}</div></div>`;
  c.scrollTop=c.scrollHeight;
}

function showTyping(){
  const c=document.getElementById('chatMessages');
  c.innerHTML+=`<div class="chat-msg ai" id="typingIndicator"><div class="chat-avatar"><i class="fa-solid fa-robot"></i></div><div class="chat-bubble"><div class="chat-typing"><span></span><span></span><span></span></div></div></div>`;
  c.scrollTop=c.scrollHeight;
}
function removeTyping(){ document.getElementById('typingIndicator')?.remove(); }

function showSuggestions(list){
  const c=document.getElementById('chatSuggestions');
  c.innerHTML=list.map(s=>`<button class="sugg-chip" onclick="useSuggestion('${s}')">${s}</button>`).join('');
}

function useSuggestion(text){
  document.getElementById('chatInput').value=text;
  sendChat();
}

function getFollowUpSuggestions(msg){
  const m=msg.toLowerCase();
  if(m.includes('kharch')||m.includes('expense')) return [`Kahan se bachau?`,`Budget check karo`,`Category breakdown`];
  if(m.includes('saving')||m.includes('bachau')) return [`Goals dikhao`,`Next month prediction`,`Budget advice`];
  if(m.includes('budget')) return [`Is mahine ka summary`,`Savings rate kya hai?`,`Tips do`];
  return [`Is mahine ka total`,`Savings advice`,`Budget check`,`Next month forecast`];
}

// ========== EXPORT CSV ==========
function exportCSV(){
  if(!transactions.length)return showToast('No transactions to export','error');
  const header=['Date','Title','Category','Type','Amount','Note'];
  const rows=transactions.map(t=>[t.date,t.title,t.category,t.type,t.amount,t.note||''].join(','));
  const csv=[header.join(','),...rows].join('\n');
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  a.download=`ExpenseIQ_${firstName()}_Transactions.csv`;a.click();
  showToast('CSV exported!','success');
}

// ========== MONTHLY REPORT ==========
function initReport(){
  const sel=document.getElementById('reportMonth');
  const months=getLast6Months();
  sel.innerHTML=months.map(m=>{const[y,mo]=m.split('-');return`<option value="${m}">${new Date(y,mo-1).toLocaleString('en',{month:'long',year:'numeric'})}</option>`;}).join('');
  generateReport();
}
function generateReport(){
  const ym=document.getElementById('reportMonth').value;
  const[y,mo]=ym.split('-');
  const monthName=new Date(y,mo-1).toLocaleString('en',{month:'long',year:'numeric'});
  const monthTxns=transactions.filter(t=>t.date.startsWith(ym));
  const income=monthTxns.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
  const expense=monthTxns.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const saved=income-expense;
  const rate=income>0?((saved/income)*100).toFixed(1):0;
  const cats=Object.keys(categoryEmoji).filter(c=>c!=='Income');
  const catBreakdown=cats.map(cat=>({cat,amt:monthTxns.filter(t=>t.type==='expense'&&t.category===cat).reduce((s,t)=>s+t.amount,0)})).filter(x=>x.amt>0).sort((a,b)=>b.amt-a.amt);
  const prevD=new Date(y,mo-2,1);
  const prevYm=`${prevD.getFullYear()}-${String(prevD.getMonth()+1).padStart(2,'0')}`;
  const prevExp=transactions.filter(t=>t.date.startsWith(prevYm)&&t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const diff=expense-prevExp;
  document.getElementById('reportContainer').innerHTML=`
    <h2 style="font-family:var(--font-head);font-size:20px;font-weight:700;margin-bottom:20px">${firstName()}'s ${monthName} Report</h2>
    <div class="report-grid">
      <div class="report-stat"><div class="report-stat-label">Income</div><div class="report-stat-val" style="color:var(--income)">${formatCurrency(income)}</div></div>
      <div class="report-stat"><div class="report-stat-label">Expenses</div><div class="report-stat-val" style="color:var(--expense)">${formatCurrency(expense)}</div></div>
      <div class="report-stat"><div class="report-stat-label">Saved</div><div class="report-stat-val" style="color:${saved>=0?'var(--income)':'var(--expense)'}">${formatCurrency(saved)}</div></div>
      <div class="report-stat"><div class="report-stat-label">Savings Rate</div><div class="report-stat-val">${rate}%</div></div>
      <div class="report-stat"><div class="report-stat-label">Transactions</div><div class="report-stat-val">${monthTxns.length}</div></div>
      <div class="report-stat"><div class="report-stat-label">vs Last Month</div><div class="report-stat-val" style="color:${diff>0?'var(--expense)':'var(--income)'}">${diff>0?'▲':'▼'} ${formatCurrency(Math.abs(diff))}</div></div>
    </div>
    ${catBreakdown.length?`<div class="report-breakdown"><h3>Spending by Category</h3>${catBreakdown.map(c=>`<div class="report-cat-row"><span>${categoryEmoji[c.cat]||'📦'}</span><span class="report-cat-name">${c.cat}</span><span class="report-cat-amt">${formatCurrency(c.amt)}</span><span style="font-size:12px;color:var(--subtext)">${expense>0?((c.amt/expense)*100).toFixed(1):'0'}%</span></div>`).join('')}</div>`:''}
    ${!monthTxns.length?emptyState('No transactions in this month'):''}`;
}

// ========== TOAST ==========
function showToast(msg,type='success'){
  const t=document.getElementById('toast');
  t.textContent=(type==='success'?'✅ ':'❌ ')+msg;
  t.className='toast show '+type;
  setTimeout(()=>t.classList.remove('show'),3000);
}

// ========== RECEIPT PHOTO SCANNER ==========
let receiptImageBase64 = null;

function handleReceiptUpload(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) return showToast('File too large! Max 10MB','error');

  const reader = new FileReader();
  reader.onload = (e) => {
    receiptImageBase64 = e.target.result; // full data URL
    document.getElementById('receiptPreview').src = receiptImageBase64;
    document.getElementById('receiptPreviewWrap').style.display = 'block';
    document.getElementById('receiptScanResult').innerHTML = '';
    // Update upload zone
    document.getElementById('receiptUploadZone').style.borderColor = 'var(--income)';
    showToast('Receipt uploaded! Click Scan to extract.','success');
  };
  reader.readAsDataURL(file);
}

async function scanReceiptWithAI() {
  if (!receiptImageBase64) return showToast('Please upload a receipt photo first','error');

  const resultDiv = document.getElementById('receiptScanResult');
  resultDiv.innerHTML = `<div class="tip-banner" style="text-align:center"><i class="fa-solid fa-spinner fa-spin"></i> &nbsp;AI is reading your receipt, ${firstName()}... Please wait!</div>`;

  try {
    // Extract base64 data (remove data:image/...;base64, prefix)
    const base64Data = receiptImageBase64.split(',')[1];
    const mimeType   = receiptImageBase64.split(';')[0].split(':')[1];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mimeType, data: base64Data }
            },
            {
              type: 'text',
              text: `You are an expense extraction AI. Look at this receipt/bill image and extract the expense details.
Return ONLY a JSON object with these fields (no extra text, no markdown):
{
  "found": true/false,
  "title": "merchant or store name",
  "amount": number (total amount in rupees, just the number),
  "date": "YYYY-MM-DD format or today if not visible",
  "category": one of: Food, Transport, Shopping, Bills, Health, Entertainment, Education, Other,
  "note": "brief description of what was purchased",
  "items": ["item1", "item2"] (top 3 items if visible, else empty array)
}
If no receipt or bill is visible, return {"found": false}.
Today's date is ${new Date().toISOString().split('T')[0]}.`
            }
          ]
        }]
      })
    });

    const data = await response.json();
    const text = data.content?.map(c => c.text || '').join('').trim();
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    if (!parsed.found) {
      resultDiv.innerHTML = `<div class="alert-banner">❌ ${firstName()}, AI could not find a receipt in this image. Please upload a clear photo of a bill or receipt.</div>`;
      return;
    }

    // Fill in extracted data
    const today = new Date().toISOString().split('T')[0];
    const date  = parsed.date || today;

    resultDiv.innerHTML = `
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:20px">
        <h4 style="font-family:var(--font-head);font-size:16px;font-weight:700;margin-bottom:14px;color:var(--income)">✅ Receipt Scanned Successfully!</h4>
        <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px">
          <div style="display:flex;justify-content:space-between;font-size:14px;padding:8px 12px;background:var(--bg);border-radius:8px">
            <span style="color:var(--subtext)">Merchant</span><strong>${parsed.title}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:14px;padding:8px 12px;background:var(--bg);border-radius:8px">
            <span style="color:var(--subtext)">Amount</span><strong style="color:var(--expense)">₹${parsed.amount}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:14px;padding:8px 12px;background:var(--bg);border-radius:8px">
            <span style="color:var(--subtext)">Category</span><strong>${categoryEmoji[parsed.category]||'📦'} ${parsed.category}</strong>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:14px;padding:8px 12px;background:var(--bg);border-radius:8px">
            <span style="color:var(--subtext)">Date</span><strong>${formatDate(date)}</strong>
          </div>
          ${parsed.note?`<div style="display:flex;justify-content:space-between;font-size:14px;padding:8px 12px;background:var(--bg);border-radius:8px"><span style="color:var(--subtext)">Note</span><strong>${parsed.note}</strong></div>`:''}
          ${parsed.items?.length?`<div style="font-size:13px;padding:8px 12px;background:var(--bg);border-radius:8px"><span style="color:var(--subtext)">Items: </span>${parsed.items.join(', ')}</div>`:''}
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn-submit" style="flex:1" onclick="addReceiptExpense('${encodeURIComponent(JSON.stringify({title:parsed.title,amount:parsed.amount,date:date,category:parsed.category,note:parsed.note||''}))}')" >
            <i class="fa-solid fa-check"></i> Add to Expenses
          </button>
          <button style="padding:12px 18px;border:1px solid var(--border);border-radius:12px;background:var(--bg);color:var(--text);cursor:pointer;font-size:14px" onclick="clearReceiptScan()">
            Scan Another
          </button>
        </div>
      </div>`;
  } catch (err) {
    console.error(err);
    resultDiv.innerHTML = `<div class="alert-banner">❌ Could not scan receipt. Make sure the image is clear and shows a bill/receipt. Error: ${err.message}</div>`;
  }
}

function addReceiptExpense(encoded) {
  const r = JSON.parse(decodeURIComponent(encoded));
  transactions.unshift({
    id: Date.now(), title: r.title, amount: parseFloat(r.amount),
    date: r.date, category: r.category, note: r.note || 'via receipt scan', type: 'expense'
  });
  save();
  showToast(`✅ ${r.title} expense added!`, 'success');
  clearReceiptScan();
}

function clearReceiptScan() {
  receiptImageBase64 = null;
  document.getElementById('receiptFileInput').value = '';
  document.getElementById('receiptPreviewWrap').style.display = 'none';
  document.getElementById('receiptScanResult').innerHTML = '';
  document.getElementById('receiptUploadZone').style.borderColor = 'var(--border)';
}

// ========== MOBILE NAV ==========
function mobileNav(page, el) {
  // Update bottom nav active state
  document.querySelectorAll('.bottom-nav-item').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');

  // Also update sidebar
  document.querySelectorAll('.nav-item').forEach(l => l.classList.remove('active'));
  const sideLink = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (sideLink) sideLink.classList.add('active');

  // Switch page
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');

  if (page==='dashboard')    renderDashboard();
  if (page==='transactions') renderAllTransactions();
  if (page==='budget')       renderBudget();
  if (page==='goals')        renderGoals();
  if (page==='recurring')    renderRecurring();
  if (page==='split')        renderSplits();
  if (page==='insights')     renderInsights();
  if (page==='predict')      renderPrediction();
  if (page==='report')       initReport();
  if (page==='chatbot')      focusChat();

  // Scroll to top on mobile
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
