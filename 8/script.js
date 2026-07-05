// ===================== FinTrack Pro — script.js =====================

const KEYS = {
  USERS: 'registeredUsers',
  SESSION: 'user',
  DARK_MODE: 'ft_darkMode'
};

const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  JPY: '¥'
};

let cashFlowChart = null;
let currentFilterType = 'all';
let currentSearch = '';
let editingTransactionId = null;

// ===================== STORAGE HELPERS =====================

function getUsers() {
  return JSON.parse(localStorage.getItem(KEYS.USERS)) || [];
}

function saveUsers(users) {
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
}

function getSession() {
  const raw = localStorage.getItem(KEYS.SESSION);
  return raw ? JSON.parse(raw) : null;
}

function saveSession(session) {
  localStorage.setItem(KEYS.SESSION, JSON.stringify(session));
}

function transactionsKey(username) {
  return `ft_transactions_${username}`;
}

function loadTransactions() {
  const session = getSession();
  if (!session) return [];
  const raw = localStorage.getItem(transactionsKey(session.username));
  return raw ? JSON.parse(raw) : [];
}

function saveTransactions(list) {
  const session = getSession();
  if (!session) return;
  localStorage.setItem(transactionsKey(session.username), JSON.stringify(list));
}

// ===================== AUTH =====================

function registerUser(username, password, currency = 'USD') {
  const users = getUsers();
  if (users.some(u => u.username === username)) {
    return { success: false, message: 'Username already exists! Please choose another.' };
  }
  users.push({ username, password, currency, displayName: username });
  saveUsers(users);
  return { success: true, message: 'Registration successful! You can now log in.' };
}

function loginUser(username, password) {
  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    return { success: false, message: 'Invalid username or password.' };
  }
  saveSession({
    username: user.username,
    currency: user.currency || 'USD',
    displayName: user.displayName || user.username
  });
  return { success: true, message: 'Login successful!' };
}

function logoutUser() {
  localStorage.removeItem(KEYS.SESSION);
  showAuth('login');
}

function updateSessionAndUserRecord(updates) {
  const session = getSession();
  if (!session) return;
  const merged = { ...session, ...updates };
  saveSession(merged);

  const users = getUsers();
  const idx = users.findIndex(u => u.username === session.username);
  if (idx !== -1) {
    users[idx] = { ...users[idx], ...updates };
    saveUsers(users);
  }
}

// ===================== VIEW SWITCHING (auth) =====================

function showAuth(view) {
  document.getElementById('appWrapper').style.display = 'none';
  document.getElementById('authWrapper').style.display = 'flex';
  document.getElementById('loginView').style.display = view === 'login' ? 'block' : 'none';
  document.getElementById('registerView').style.display = view === 'register' ? 'block' : 'none';
}

function showApp() {
  document.getElementById('authWrapper').style.display = 'none';
  document.getElementById('appWrapper').style.display = 'flex';
  initAppView();
}

// ===================== PAGE SWITCHING (dashboard / settings) =====================

function showPage(page) {
  document.getElementById('dashboardPage').style.display = page === 'dashboard' ? 'block' : 'none';
  document.getElementById('settingsPage').style.display = page === 'settings' ? 'block' : 'none';

  document.getElementById('navDashboard').classList.toggle('active', page === 'dashboard');
  document.getElementById('navSettings').classList.toggle('active', page === 'settings');

  if (page === 'dashboard') {
    refreshAll();
  } else {
    populateSettingsForm();
  }
}

// ===================== FORMATTING =====================

function getCurrentCurrencySymbol() {
  const session = getSession();
  const code = (session && session.currency) || 'USD';
  return CURRENCY_SYMBOLS[code] || '$';
}

function formatAmount(value) {
  const symbol = getCurrentCurrencySymbol();
  const sign = value < 0 ? '-' : '';
  return `${sign}${symbol}${Math.abs(value).toFixed(2)}`;
}

// ===================== CALCULATIONS =====================

function calculateTotals(list) {
  let income = 0;
  let expense = 0;
  list.forEach(t => {
    if (t.type === 'income') income += Number(t.amount);
    else expense += Number(t.amount);
  });
  return { income, expense, balance: income - expense, count: list.length };
}

// ===================== RENDERING =====================

function renderCards() {
  const list = loadTransactions();
  const { income, expense, balance, count } = calculateTotals(list);

  const balanceEl = document.getElementById('statBalance');
  balanceEl.textContent = formatAmount(balance);
  balanceEl.classList.remove('text-green', 'text-red');
  if (balance > 0) balanceEl.classList.add('text-green');
  if (balance < 0) balanceEl.classList.add('text-red');

  document.getElementById('statIncome').textContent = formatAmount(income);
  document.getElementById('statExpense').textContent = formatAmount(expense);
  document.getElementById('statCount').textContent = count;
}

function getFilteredTransactions() {
  let list = loadTransactions();

  if (currentFilterType !== 'all') {
    list = list.filter(t => t.type === currentFilterType);
  }
  if (currentSearch.trim()) {
    const q = currentSearch.trim().toLowerCase();
    list = list.filter(t => t.description.toLowerCase().includes(q));
  }
  return list.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
}

function renderTable() {
  const list = getFilteredTransactions();
  const tbody = document.getElementById('transactionsBody');
  const emptyState = document.getElementById('emptyState');
  tbody.innerHTML = '';

  if (list.length === 0) {
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  list.forEach(t => {
    const tr = document.createElement('tr');
    const amountClass = t.type === 'income' ? 'text-green' : 'text-red';
    const amountSign = t.type === 'income' ? '+' : '-';
    const symbol = getCurrentCurrencySymbol();

    tr.innerHTML = `
      <td>${t.date}</td>
      <td class="tx-desc">${escapeHtml(t.description)}</td>
      <td><span class="category-tag">${escapeHtml(t.category)}</span></td>
      <td class="amount-cell ${amountClass}">${amountSign}${symbol}${Number(t.amount).toFixed(2)}</td>
      <td class="actions-cell">
        <button class="icon-btn edit-btn" data-id="${t.id}" title="Edit" aria-label="Edit transaction">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 20h9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button class="icon-btn delete-btn" data-id="${t.id}" title="Delete" aria-label="Delete transaction">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.id));
  });
  tbody.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteTransaction(btn.dataset.id));
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderChart() {
  const list = loadTransactions().slice().sort((a, b) => new Date(a.date) - new Date(b.date));
  const canvas = document.getElementById('cashFlowChart');
  if (!canvas) return;

  const byDate = {};
  list.forEach(t => {
    if (!byDate[t.date]) byDate[t.date] = { income: 0, expense: 0 };
    byDate[t.date][t.type] += Number(t.amount);
  });

  const labels = Object.keys(byDate);
  const incomeData = labels.map(d => byDate[d].income);
  const expenseData = labels.map(d => byDate[d].expense);

  if (cashFlowChart) {
    cashFlowChart.destroy();
  }

  const isDark = document.body.classList.contains('dark');
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const tickColor = isDark ? '#9aa0ae' : '#6b7280';

  cashFlowChart = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: labels.length ? labels : ['No data'],
      datasets: [
        { label: 'Income', data: incomeData.length ? incomeData : [0], backgroundColor: '#17a34a', borderRadius: 4, maxBarThickness: 42 },
        { label: 'Expenses', data: expenseData.length ? expenseData : [0], backgroundColor: '#dc2626', borderRadius: 4, maxBarThickness: 42 }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: tickColor } },
        y: { grid: { color: gridColor }, ticks: { color: tickColor }, beginAtZero: true }
      }
    }
  });
}

function refreshAll() {
  renderCards();
  renderTable();
  renderChart();
}

// ===================== TRANSACTION CRUD =====================

function deleteTransaction(id) {
  if (!confirm('Delete this transaction? This cannot be undone.')) return;
  const list = loadTransactions().filter(t => String(t.id) !== String(id));
  saveTransactions(list);
  refreshAll();
}

function openModal(id) {
  const modal = document.getElementById('transactionModal');
  const form = document.getElementById('transactionForm');
  form.reset();

  if (id) {
    const list = loadTransactions();
    const tx = list.find(t => String(t.id) === String(id));
    if (!tx) return;
    editingTransactionId = tx.id;
    document.getElementById('modalTitle').textContent = 'Edit Transaction';
    document.getElementById('modalSaveBtn').textContent = 'Update Transaction';
    document.getElementById('txId').value = tx.id;
    document.getElementById('txDescription').value = tx.description;
    document.getElementById('txAmount').value = tx.amount;
    document.getElementById('txDate').value = tx.date;
    document.getElementById('txCategory').value = tx.category;
    setActiveType(tx.type);
  } else {
    editingTransactionId = null;
    document.getElementById('modalTitle').textContent = 'Add Transaction';
    document.getElementById('modalSaveBtn').textContent = 'Save Transaction';
    document.getElementById('txId').value = '';
    document.getElementById('txDate').value = new Date().toISOString().slice(0, 10);
    setActiveType('expense');
  }

  modal.style.display = 'flex';
}

function closeModal() {
  document.getElementById('transactionModal').style.display = 'none';
  editingTransactionId = null;
}

function setActiveType(type) {
  document.getElementById('typeExpenseBtn').classList.toggle('active', type === 'expense');
  document.getElementById('typeIncomeBtn').classList.toggle('active', type === 'income');
}

function getActiveType() {
  return document.getElementById('typeIncomeBtn').classList.contains('active') ? 'income' : 'expense';
}

function handleTransactionSubmit(e) {
  e.preventDefault();

  const description = document.getElementById('txDescription').value.trim();
  const amount = parseFloat(document.getElementById('txAmount').value);
  const date = document.getElementById('txDate').value;
  const category = document.getElementById('txCategory').value;
  const type = getActiveType();

  if (!description || isNaN(amount) || amount <= 0 || !date || !category) {
    alert('Please fill in all fields with valid values before saving.');
    return;
  }

  const list = loadTransactions();

  if (editingTransactionId) {
    const idx = list.findIndex(t => String(t.id) === String(editingTransactionId));
    if (idx !== -1) {
      list[idx] = { ...list[idx], description, amount, date, category, type };
    }
  } else {
    list.push({ id: Date.now(), type, description, amount, date, category });
  }

  saveTransactions(list);
  closeModal();
  refreshAll();
}

// ===================== SETTINGS =====================

function populateSettingsForm() {
  const session = getSession();
  if (!session) return;
  document.getElementById('settingsName').value = session.displayName || session.username;
  document.getElementById('settingsCurrency').value = session.currency || 'USD';
}

function handleSaveSettings() {
  const displayName = document.getElementById('settingsName').value.trim() || getSession().username;
  const currency = document.getElementById('settingsCurrency').value;
  updateSessionAndUserRecord({ displayName, currency });
  document.getElementById('usernameDisplay').textContent = displayName;
  alert('Settings saved.');
  refreshAll();
}

// ===================== RESET =====================

function handleResetAllData() {
  if (!confirm('This will permanently delete all your transactions. Continue?')) return;
  saveTransactions([]);
  refreshAll();
}

// ===================== DARK MODE =====================

function applyDarkModePreference() {
  const isDark = localStorage.getItem(KEYS.DARK_MODE) === 'true';
  document.body.classList.toggle('dark', isDark);
  const toggle = document.getElementById('darkModeToggle');
  if (toggle) toggle.checked = isDark;
}

function toggleDarkMode(checked) {
  document.body.classList.toggle('dark', checked);
  localStorage.setItem(KEYS.DARK_MODE, checked ? 'true' : 'false');
  renderChart();
}

// ===================== INIT =====================

function initAppView() {
  const session = getSession();
  if (session) {
    document.getElementById('usernameDisplay').textContent = session.displayName || session.username;
  }
  showPage('dashboard');
}

function wireEvents() {
  // Auth switching
  document.getElementById('goToRegister').addEventListener('click', (e) => {
    e.preventDefault();
    showAuth('register');
  });
  document.getElementById('goToLogin').addEventListener('click', (e) => {
    e.preventDefault();
    showAuth('login');
  });

  // Login
  document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const result = loginUser(username, password);
    if (result.success) {
      showApp();
    } else {
      alert(result.message);
    }
  });

  // Register
  document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value.trim();
    const password = document.getElementById('registerPassword').value;
    if (!username || !password) {
      alert('Please fill in both fields.');
      return;
    }
    const result = registerUser(username, password);
    alert(result.message);
    if (result.success) {
      document.getElementById('registerForm').reset();
      showAuth('login');
    }
  });

  // Nav
  document.getElementById('navDashboard').addEventListener('click', () => showPage('dashboard'));
  document.getElementById('navSettings').addEventListener('click', () => showPage('settings'));

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', logoutUser);

  // Modal
  document.getElementById('addTransactionBtn').addEventListener('click', () => openModal());
  document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
  document.getElementById('modalCancelBtn').addEventListener('click', closeModal);
  document.getElementById('transactionModal').addEventListener('click', (e) => {
    if (e.target.id === 'transactionModal') closeModal();
  });
  document.getElementById('transactionForm').addEventListener('submit', handleTransactionSubmit);
  document.getElementById('typeExpenseBtn').addEventListener('click', () => setActiveType('expense'));
  document.getElementById('typeIncomeBtn').addEventListener('click', () => setActiveType('income'));

  // Table controls
  document.getElementById('searchInput').addEventListener('input', (e) => {
    currentSearch = e.target.value;
    renderTable();
  });
  document.getElementById('filterType').addEventListener('change', (e) => {
    currentFilterType = e.target.value;
    renderTable();
  });

  // Preferences
  document.getElementById('darkModeToggle').addEventListener('change', (e) => {
    toggleDarkMode(e.target.checked);
  });
  document.getElementById('resetDataBtn').addEventListener('click', handleResetAllData);

  // Settings
  document.getElementById('saveSettingsBtn').addEventListener('click', handleSaveSettings);
}

document.addEventListener('DOMContentLoaded', () => {
  applyDarkModePreference();
  wireEvents();

  const session = getSession();
  if (session) {
    showApp();
  } else {
    showAuth('login');
  }
});