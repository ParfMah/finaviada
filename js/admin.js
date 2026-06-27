/**
 * FINAVIA - ADMIN.JS
 * ===================
 * Script du tableau de bord administrateur.
 * Gère : authentification, navigation sidebar,
 * gestion des demandes, CMS, images, emails.
 *
 * NOTE : En production, toutes les requêtes pointent
 * vers le backend Express.js. En mode démo (sans backend),
 * des données mock sont utilisées.
 */

/* ============================================
   CONFIGURATION
   ============================================ */
const API_BASE = window.FINAVIA_API || 'http://localhost:5000';
const TOKEN_KEY = 'finavia_admin_token';

/* ============================================
   1. PAGE LOGIN
   ============================================ */
if (document.getElementById('adminLoginForm')) {
  initLoginPage();
}

function initLoginPage() {
  const form     = document.getElementById('adminLoginForm');
  const emailIn  = document.getElementById('adminEmail');
  const passIn   = document.getElementById('adminPassword');
  const submitBtn = document.getElementById('loginBtn');
  const errorBox  = document.getElementById('loginError');

  if (!form) return;

  // Redirige si déjà connecté
  const existingToken = getToken();
  if (existingToken) {
    window.location.href = 'dashboard.html';
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errorBox) errorBox.style.display = 'none';

    const email    = emailIn ? emailIn.value.trim() : '';
    const password = passIn  ? passIn.value : '';

    if (!email || !password) {
      showLoginError('Veuillez remplir tous les champs.');
      return;
    }

    // Chargement
    setLoginLoading(true);

    try {
      // Tentative de connexion au backend
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        saveToken(data.token);
        saveAdminUser(data.user);
        window.location.href = 'dashboard.html';
      } else {
        const err = await response.json();
        showLoginError(err.message || 'Email ou mot de passe incorrect.');
      }
    } catch (err) {
      // Mode démo : connexion avec identifiants par défaut
      if (email === 'admin@finavia.eu' && password === 'Admin@2024!') {
        const demoToken = 'demo_token_' + Date.now();
        const demoUser  = { name: 'Administrateur', email, role: 'admin' };
        saveToken(demoToken);
        saveAdminUser(demoUser);
        window.location.href = 'dashboard.html';
      } else {
        showLoginError(
          'Backend non connecté. Mode démo : admin@finavia.eu / Admin@2024!'
        );
      }
    } finally {
      setLoginLoading(false);
    }
  });

  // Toggle mot de passe
  const togglePass = document.getElementById('togglePassword');
  if (togglePass && passIn) {
    togglePass.addEventListener('click', () => {
      passIn.type = passIn.type === 'password' ? 'text' : 'password';
      togglePass.innerHTML = passIn.type === 'password'
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
    });
  }
}

function showLoginError(msg) {
  const errorBox = document.getElementById('loginError');
  if (errorBox) {
    errorBox.textContent = msg;
    errorBox.style.display = 'flex';
  }
}

function setLoginLoading(loading) {
  const btn = document.getElementById('loginBtn');
  if (!btn) return;
  if (loading) {
    btn.innerHTML = '<span class="spinner" style="width:20px;height:20px;border-width:2px;"></span>';
    btn.disabled = true;
  } else {
    btn.innerHTML = 'Se connecter';
    btn.disabled = false;
  }
}

/* ============================================
   2. PAGE DASHBOARD
   ============================================ */
if (document.getElementById('adminDashboard')) {
  initDashboard();
}

function initDashboard() {
  // Vérifie l'authentification
  if (!isAuthenticated()) {
    window.location.href = 'index.html';
    return;
  }

  // Initialise les composants
  initSidebar();
  initTopbar();
  loadDashboardData();
  initNavigation();
  initModals();
  initSearch();
  updateUserInfo();

  // Auto-refresh toutes les 60s pour les nouvelles demandes
  setInterval(refreshPendingCount, 60000);
}

/* ============================================
   3. SIDEBAR
   ============================================ */
function initSidebar() {
  const sidebar = document.getElementById('adminSidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const toggleBtn = document.getElementById('sidebarToggle');

  if (!sidebar) return;

  // Navigation active
  const currentPage = getCurrentAdminPage();
  document.querySelectorAll('.admin-nav-link').forEach(link => {
    const href = link.getAttribute('href') || '';
    const page = href.split('=').pop() || '';
    if (page === currentPage) {
      link.classList.add('active');
    }
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetPage = link.getAttribute('data-page') || page;
      navigateTo(targetPage);
    });
  });

  // Toggle sidebar mobile
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      if (overlay) overlay.classList.toggle('visible');
    });
  }

  if (overlay) {
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('visible');
    });
  }
}

/* ============================================
   4. TOPBAR
   ============================================ */
function initTopbar() {
  const logoutBtn = document.querySelectorAll('[data-action="logout"]');
  logoutBtn.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  });
}

function updateUserInfo() {
  const user = getAdminUser();
  if (!user) return;

  const nameEls = document.querySelectorAll('.admin-user-name');
  const roleEls = document.querySelectorAll('.admin-user-role');
  const avatarEls = document.querySelectorAll('.admin-profile-avatar');

  nameEls.forEach(el => { el.textContent = user.name || 'Administrateur'; });
  roleEls.forEach(el => { el.textContent = user.role === 'admin' ? 'Administrateur' : 'Gestionnaire'; });
  avatarEls.forEach(el => {
    const initials = (user.name || 'AD').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    el.textContent = initials;
  });
}

/* ============================================
   5. NAVIGATION ADMIN (SPA-like)
   Charge les sections sans rechargement de page
   ============================================ */
function initNavigation() {
  // Page par défaut : overview
  const page = getCurrentAdminPage() || 'overview';
  navigateTo(page);
}

function getCurrentAdminPage() {
  const params = new URLSearchParams(window.location.search);
  return params.get('page') || 'overview';
}

function navigateTo(page) {
  // Met à jour l'URL sans rechargement
  const url = new URL(window.location);
  url.searchParams.set('page', page);
  history.pushState({ page }, '', url.toString());

  // Met à jour les liens actifs
  document.querySelectorAll('.admin-nav-link').forEach(link => {
    const linkPage = link.getAttribute('data-page') || '';
    link.classList.toggle('active', linkPage === page);
  });

  // Charge le contenu de la page
  loadPage(page);

  // Met à jour le titre topbar
  updateTopbarTitle(page);

  // Ferme sidebar mobile
  const sidebar = document.getElementById('adminSidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.remove('open');
  if (overlay) overlay.classList.remove('visible');
}

function updateTopbarTitle(page) {
  const titles = {
    overview:   'Vue d\'ensemble',
    requests:   'Demandes clients',
    content:    'Gestion du contenu',
    services:   'Nos services',
    images:     'Médiathèque',
    emails:     'Emails automatiques',
    settings:   'Paramètres'
  };
  const titleEl = document.getElementById('topbarTitle');
  if (titleEl) titleEl.textContent = titles[page] || page;
}

/**
 * Charge le contenu HTML d'une section admin
 */
function loadPage(page) {
  const content = document.getElementById('adminContent');
  if (!content) return;

  // Affiche un skeleton loader
  content.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;min-height:300px;color:#64748B;">
      <div style="text-align:center;">
        <div class="spinner spinner-green" style="margin:0 auto 1rem;width:32px;height:32px;border-width:3px;"></div>
        <p>Chargement...</p>
      </div>
    </div>
  `;

  // Charge les données selon la page
  switch (page) {
    case 'overview':   renderOverview();   break;
    case 'requests':   renderRequests();   break;
    case 'content':    renderContent();    break;
    case 'services':   renderServices();   break;
    case 'images':     renderImages();     break;
    case 'emails':     renderEmails();     break;
    case 'settings':   renderSettings();   break;
    default:           renderOverview();
  }
}

/* ============================================
   6. CHARGEMENT DONNÉES DASHBOARD
   ============================================ */
async function loadDashboardData() {
  try {
    const data = await apiGet('/api/admin/stats');
    if (data) updateStatCards(data);
  } catch (e) {
    // Mode démo avec données mock
    updateStatCards(getMockStats());
  }
}

function updateStatCards(stats) {
  const els = {
    totalRequests:   document.getElementById('statTotalRequests'),
    pendingRequests: document.getElementById('statPendingRequests'),
    approvedAmount:  document.getElementById('statApprovedAmount'),
    rejectedRequests: document.getElementById('statRejected'),
  };

  if (els.totalRequests && stats.total !== undefined)
    els.totalRequests.textContent = stats.total.toLocaleString('fr-FR');

  if (els.pendingRequests && stats.pending !== undefined) {
    els.pendingRequests.textContent = stats.pending;
    // Met à jour badge sidebar
    const badge = document.querySelector('.admin-nav-badge');
    if (badge) badge.textContent = stats.pending;
  }

  if (els.approvedAmount && stats.approvedAmount !== undefined)
    els.approvedAmount.textContent = formatAdminAmount(stats.approvedAmount);

  if (els.rejectedRequests && stats.rejected !== undefined)
    els.rejectedRequests.textContent = stats.rejected;
}

function getMockStats() {
  return {
    total: 247,
    pending: 12,
    approvedAmount: 2340000,
    rejected: 31,
    thisMonth: 28,
    lastMonth: 22
  };
}

async function refreshPendingCount() {
  try {
    const data = await apiGet('/api/admin/stats/pending');
    if (data && data.count !== undefined) {
      const badge = document.querySelector('.admin-nav-badge');
      if (badge) badge.textContent = data.count;
    }
  } catch (e) { /* ignoré en mode démo */ }
}

/* ============================================
   7. PAGES DE CONTENU
   ============================================ */

/** VUE D'ENSEMBLE */
async function renderOverview() {
  const content = document.getElementById('adminContent');
  if (!content) return;

  // Données mock
  const stats    = getMockStats();
  const requests = getMockRequests().slice(0, 5);

  content.innerHTML = `
    <!-- Stats Cards -->
    <div class="admin-stats-grid" style="margin-bottom:2rem;">
      ${renderStatCard('📋', 'Demandes totales', stats.total.toLocaleString('fr-FR'), '+' + stats.thisMonth + ' ce mois', true, 'admin-stat-icon-blue')}
      ${renderStatCard('⏳', 'En attente', stats.pending, 'À traiter rapidement', null, 'admin-stat-icon-orange')}
      ${renderStatCard('✅', 'Volume approuvé', formatAdminAmount(stats.approvedAmount), '+18% vs mois dernier', true, 'admin-stat-icon-green')}
      ${renderStatCard('❌', 'Refusées', stats.rejected, stats.rejected + ' dossiers', false, 'admin-stat-icon-red')}
    </div>

    <!-- Dernières demandes -->
    <div class="admin-card">
      <div class="admin-card-header">
        <h3 class="admin-card-title">Dernières demandes</h3>
        <button class="btn btn-sm btn-secondary" onclick="navigateTo('requests')">
          Voir tout
        </button>
      </div>
      <div class="admin-card-body--no-pad">
        <div class="admin-table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Type de prêt</th>
                <th>Montant</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${requests.map(r => renderRequestRow(r)).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Graphique sparkline simple -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-top:1.5rem;">
      <div class="admin-card">
        <div class="admin-card-header">
          <h3 class="admin-card-title">Demandes - 7 derniers jours</h3>
        </div>
        <div class="admin-card-body">
          <div class="admin-sparkline">
            ${[6,4,8,12,9,11,8].map((h, i) => `
              <div class="admin-sparkline-bar ${i === 6 ? 'active' : ''}"
                   style="height:${Math.round((h/12)*100)}%;"></div>
            `).join('')}
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:0.75rem;font-size:0.75rem;color:#64748B;">
            ${['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(d => `<span>${d}</span>`).join('')}
          </div>
        </div>
      </div>
      <div class="admin-card">
        <div class="admin-card-header">
          <h3 class="admin-card-title">Répartition par type</h3>
        </div>
        <div class="admin-card-body">
          ${[
            { label: 'Prêt Personnel', pct: 42, color: '#00A878' },
            { label: 'Prêt Auto', pct: 28, color: '#0A2540' },
            { label: 'Prêt Immobilier', pct: 18, color: '#2D6A4F' },
            { label: 'Autres', pct: 12, color: '#64748B' },
          ].map(item => `
            <div style="margin-bottom:0.875rem;">
              <div style="display:flex;justify-content:space-between;font-size:0.8125rem;margin-bottom:0.375rem;">
                <span style="color:#1E293B;font-weight:500;">${item.label}</span>
                <span style="color:#64748B;">${item.pct}%</span>
              </div>
              <div style="height:6px;background:#F1F5F9;border-radius:999px;overflow:hidden;">
                <div style="height:100%;width:${item.pct}%;background:${item.color};border-radius:999px;transition:width 1s ease;"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

/** LISTE DES DEMANDES */
async function renderRequests(filter = 'all') {
  const content = document.getElementById('adminContent');
  if (!content) return;

  let requests;
  try {
    requests = await apiGet('/api/admin/requests');
  } catch(e) {
    requests = getMockRequests();
  }

  const filters = ['all', 'new', 'review', 'approved', 'rejected', 'archived'];

  content.innerHTML = `
    <div class="admin-card">
      <div class="admin-card-header">
        <h3 class="admin-card-title">Demandes clients</h3>
        <div class="admin-filters">
          <div class="admin-search">
            <svg class="admin-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" class="admin-search-input" id="requestSearch" placeholder="Rechercher un client...">
          </div>
          <select class="admin-filter-select" id="statusFilter">
            <option value="all">Tous les statuts</option>
            <option value="new">Nouvelles</option>
            <option value="review">En analyse</option>
            <option value="approved">Approuvées</option>
            <option value="rejected">Refusées</option>
            <option value="archived">Archivées</option>
          </select>
          <select class="admin-filter-select" id="typeFilter">
            <option value="all">Tous les types</option>
            <option value="personal">Prêt Personnel</option>
            <option value="auto">Prêt Auto</option>
            <option value="immo">Prêt Immobilier</option>
            <option value="travaux">Prêt Travaux</option>
          </select>
        </div>
      </div>
      <div class="admin-card-body--no-pad">
        <div class="admin-table-wrapper">
          <table class="admin-table" id="requestsTable">
            <thead>
              <tr>
                <th><input type="checkbox" id="selectAll" title="Sélectionner tout"></th>
                <th>Client</th>
                <th>Type</th>
                <th>Montant</th>
                <th>Pays</th>
                <th>Date</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="requestsBody">
              ${requests.map(r => renderRequestRow(r, true)).join('')}
            </tbody>
          </table>
        </div>
        <div class="admin-pagination">
          <div class="admin-pagination-info">
            Affichage de <strong>1-10</strong> sur <strong>${requests.length}</strong> demandes
          </div>
          <div class="admin-pagination-btns">
            <button class="admin-page-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button class="admin-page-btn active">1</button>
            <button class="admin-page-btn">2</button>
            <button class="admin-page-btn">3</button>
            <button class="admin-page-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Filtre en temps réel
  const searchInput  = document.getElementById('requestSearch');
  const statusFilter = document.getElementById('statusFilter');

  if (searchInput) {
    searchInput.addEventListener('input', () => filterTable(requests));
  }
  if (statusFilter) {
    statusFilter.addEventListener('change', () => filterTable(requests));
  }
}

function filterTable(allRequests) {
  const query  = (document.getElementById('requestSearch')?.value || '').toLowerCase();
  const status = document.getElementById('statusFilter')?.value || 'all';

  const filtered = allRequests.filter(r => {
    const matchSearch = !query ||
      r.name.toLowerCase().includes(query) ||
      r.email.toLowerCase().includes(query);
    const matchStatus = status === 'all' || r.status === status;
    return matchSearch && matchStatus;
  });

  const tbody = document.getElementById('requestsBody');
  if (tbody) {
    tbody.innerHTML = filtered.length
      ? filtered.map(r => renderRequestRow(r, true)).join('')
      : `<tr><td colspan="8" style="text-align:center;padding:3rem;color:#64748B;">Aucune demande trouvée</td></tr>`;
  }
}

/** GESTION DU CONTENU */
function renderContent() {
  const content = document.getElementById('adminContent');
  if (!content) return;

  const faqItems = getMockFAQ();

  content.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr;gap:1.5rem;">
      <!-- Textes de la page d'accueil -->
      <div class="admin-card">
        <div class="admin-card-header">
          <h3 class="admin-card-title">📝 Contenu de la page d'accueil</h3>
          <button class="btn btn-sm btn-secondary" onclick="openContentModal('hero')">
            Modifier le hero
          </button>
        </div>
        <div class="admin-card-body">
          <div class="admin-form-grid">
            <div class="form-group">
              <label class="form-label">Slogan principal</label>
              <input type="text" class="form-input" value="Financer vos projets, simplement et sûrement">
            </div>
            <div class="form-group">
              <label class="form-label">Sous-titre</label>
              <input type="text" class="form-input" value="FINAVIA vous accompagne dans tous vos projets...">
            </div>
            <div class="form-group admin-form-full">
              <label class="form-label">Description section</label>
              <textarea class="form-textarea" rows="3">FINAVIA vous accompagne dans tous vos projets avec des solutions de financement adaptées à votre situation.</textarea>
            </div>
          </div>
          <div style="display:flex;gap:0.75rem;justify-content:flex-end;margin-top:1rem;">
            <button class="btn btn-sm btn-secondary">Annuler</button>
            <button class="btn btn-sm btn-primary" onclick="saveContent()">Sauvegarder</button>
          </div>
        </div>
      </div>

      <!-- FAQ -->
      <div class="admin-card">
        <div class="admin-card-header">
          <h3 class="admin-card-title">❓ FAQ - Questions fréquentes</h3>
          <button class="btn btn-sm btn-primary" onclick="openFAQModal()">+ Ajouter</button>
        </div>
        <div class="admin-card-body--no-pad">
          <div class="admin-table-wrapper">
            <table class="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Question</th>
                  <th>Langue</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${faqItems.map((item, i) => `
                  <tr>
                    <td style="color:#64748B;font-size:0.8125rem;">${i + 1}</td>
                    <td style="max-width:300px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                      ${item.question}
                    </td>
                    <td>${item.lang.toUpperCase()}</td>
                    <td><span class="admin-status admin-status-approved">Publié</span></td>
                    <td>
                      <div class="admin-table-actions">
                        <button class="admin-action-btn" title="Modifier" onclick="editFAQ(${i})">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button class="admin-action-btn delete" title="Supprimer">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

/** SERVICES */
function renderServices() {
  const content = document.getElementById('adminContent');
  if (!content) return;

  const services = getMockServices();

  content.innerHTML = `
    <div class="admin-card">
      <div class="admin-card-header">
        <h3 class="admin-card-title">💰 Nos services / Prêts</h3>
        <button class="btn btn-sm btn-primary" onclick="openServiceModal()">+ Nouveau service</button>
      </div>
      <div class="admin-card-body--no-pad">
        <div class="admin-table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Montant min.</th>
                <th>Montant max.</th>
                <th>TAEG</th>
                <th>Durée</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${services.map(s => `
                <tr>
                  <td>
                    <div style="display:flex;align-items:center;gap:0.75rem;">
                      <span style="font-size:1.25rem;">${s.icon}</span>
                      <div>
                        <div style="font-weight:600;color:#1E293B;">${s.name}</div>
                        <div style="font-size:0.75rem;color:#64748B;">${s.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td>${formatAdminAmount(s.minAmount)}</td>
                  <td>${formatAdminAmount(s.maxAmount)}</td>
                  <td>${s.rate}</td>
                  <td>${s.duration}</td>
                  <td><span class="admin-status admin-status-approved">Actif</span></td>
                  <td>
                    <div class="admin-table-actions">
                      <button class="admin-action-btn" title="Modifier">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button class="admin-action-btn delete" title="Supprimer">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

/** MÉDIATHÈQUE */
async function renderImages() {
  const content = document.getElementById('adminContent');
  if (!content) return;

  let images;
  let isDemo = false;
  try {
    const data = await apiGet('/api/admin/images');
    images = data.data || [];
  } catch (e) {
    // Backend non connecté : bascule en mode démonstration
    images = getPlaceholderImages();
    isDemo = true;
  }

  content.innerHTML = `
    <div class="admin-card">
      <div class="admin-card-header">
        <h3 class="admin-card-title">🖼️ Médiathèque ${isDemo ? '<span style="font-size:0.7rem;color:#F59E0B;font-weight:600;">(mode démo — backend non connecté)</span>' : ''}</h3>
        <button class="btn btn-sm btn-primary" onclick="document.getElementById('imageUpload').click()">
          + Ajouter des images
        </button>
        <input type="file" id="imageUpload" multiple accept="image/*,.webp" style="display:none"
               onchange="handleImageUpload(this)">
      </div>
      <div class="admin-card-body">
        <!-- Zone de drop -->
        <div class="admin-upload-zone" id="uploadZone"
             ondragover="handleDragOver(event)"
             ondrop="handleDrop(event)"
             onclick="document.getElementById('imageUpload').click()">
          <span class="admin-upload-icon">📁</span>
          <div class="admin-upload-text">
            <strong>Glissez vos images ici</strong> ou cliquez pour parcourir
          </div>
          <div class="admin-upload-sub">
            WebP, PNG, JPG • Max 5 Mo par image • Envoyées directement sur Cloudinary
          </div>
        </div>

        <!-- Galerie -->
        <div style="margin-top:1.5rem;">
          <h4 style="font-size:0.875rem;font-weight:600;color:#64748B;margin-bottom:1rem;text-transform:uppercase;letter-spacing:0.05em;">
            Images existantes (${images.length})
          </h4>
          <div class="admin-gallery-grid">
            ${images.map(img => renderGalleryItem(img, isDemo)).join('')}
          </div>
          ${images.length === 0 ? `
            <div class="admin-empty">
              <span class="admin-empty-icon">🖼️</span>
              <h4 class="admin-empty-title">Aucune image pour le moment</h4>
              <p class="admin-empty-text">Uploadez vos premières images, ou ajoutez-les directement depuis votre compte Cloudinary en respectant les identifiants du catalogue (voir CLOUDINARY-IMAGES.md).</p>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

/**
 * Génère le HTML d'une vignette de la médiathèque.
 * - Mode réel : affiche la vraie photo Cloudinary (img._id existe) + bouton supprimer réel.
 * - Mode démo : affiche les pastilles colorées fictives (pas de suppression réelle).
 */
function renderGalleryItem(img, isDemo) {
  const isReal = !isDemo && img._id;
  const thumb = isReal
    ? `<div class="admin-gallery-img" style="background-image:url('${img.url}');background-size:cover;background-position:center;height:100%;"></div>`
    : `<div class="admin-gallery-img" style="background:linear-gradient(135deg,${img.color1},${img.color2});display:flex;align-items:center;justify-content:center;height:100%;font-size:1.5rem;">${img.icon}</div>`;

  const deleteAction = isReal
    ? `onclick="deleteRealImage('${img._id}', this)"`
    : `onclick="this.closest('.admin-gallery-item').remove()"`;

  const label = isReal ? (img.publicId || img.filename) : img.name;

  return `
    <div class="admin-gallery-item">
      ${thumb}
      <div class="admin-gallery-overlay">
        ${isReal ? `
          <a class="admin-gallery-action" title="Voir en grand" href="${img.url}" target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </a>
        ` : `
          <button class="admin-gallery-action" title="Voir">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        `}
        <button class="admin-gallery-action delete" title="Supprimer" ${deleteAction}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
        </button>
      </div>
      <div style="padding:4px 8px;font-size:0.65rem;color:#64748B;background:#F8FAFC;border-top:1px solid #E2E8F0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${label}">
        ${label}
      </div>
    </div>
  `;
}

/**
 * Supprime réellement une image (base de données + fichier Cloudinary)
 * via l'API, puis retire la vignette de l'affichage.
 */
async function deleteRealImage(imageId, btnEl) {
  if (!window.confirm('Supprimer définitivement cette image (base de données ET Cloudinary) ?')) return;

  try {
    const token = getToken();
    const response = await fetch(`${API_BASE}/api/admin/images/${imageId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Échec de la suppression.');

    btnEl.closest('.admin-gallery-item').remove();
    if (window.showToast) window.showToast('Image supprimée.', 'success');
  } catch (error) {
    if (window.showToast) window.showToast(`Erreur : ${error.message}`, 'error');
  }
}

/** EMAILS */
function renderEmails() {
  const content = document.getElementById('adminContent');
  if (!content) return;

  const emailTypes = [
    { id: 'confirmation', name: 'Confirmation de demande', desc: 'Envoyé au client après soumission', active: true, sent: 247 },
    { id: 'admin_notif', name: 'Notification admin', desc: 'Alerte pour les nouvelles demandes', active: true, sent: 247 },
    { id: 'validation', name: 'Validation / Approbation', desc: 'Envoyé quand un dossier est approuvé', active: true, sent: 164 },
    { id: 'rejection', name: 'Refus de dossier', desc: 'Envoyé en cas de refus, avec alternatives', active: true, sent: 31 },
    { id: 'relance', name: 'Relance abandon formulaire', desc: 'Si l\'utilisateur abandonne le formulaire', active: true, sent: 89 },
    { id: 'followup', name: 'Suivi de dossier', desc: 'Rappel si pas de réponse sous 48h', active: false, sent: 0 },
  ];

  content.innerHTML = `
    <div class="admin-card">
      <div class="admin-card-header">
        <h3 class="admin-card-title">📧 Emails automatiques</h3>
      </div>
      <div class="admin-card-body--no-pad">
        <div class="admin-table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Description</th>
                <th>Envois</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${emailTypes.map(e => `
                <tr>
                  <td>
                    <div style="font-weight:600;color:#1E293B;">📧 ${e.name}</div>
                  </td>
                  <td style="color:#64748B;font-size:0.875rem;">${e.desc}</td>
                  <td style="font-weight:600;">${e.sent}</td>
                  <td>
                    <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;">
                      <input type="checkbox" ${e.active ? 'checked' : ''} style="accent-color:#00A878;width:16px;height:16px;">
                      <span style="font-size:0.8rem;color:${e.active ? '#059669' : '#64748B'};">${e.active ? 'Actif' : 'Inactif'}</span>
                    </label>
                  </td>
                  <td>
                    <div class="admin-table-actions">
                      <button class="admin-action-btn" title="Modifier le template" onclick="editEmailTemplate('${e.id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button class="admin-action-btn" title="Envoyer un test" onclick="sendTestEmail('${e.id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

/** PARAMÈTRES */
function renderSettings() {
  const content = document.getElementById('adminContent');
  if (!content) return;

  content.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;">
      <div class="admin-card">
        <div class="admin-card-header"><h3 class="admin-card-title">⚙️ Paramètres généraux</h3></div>
        <div class="admin-card-body">
          <div class="form-group">
            <label class="form-label">Nom du site</label>
            <input type="text" class="form-input" value="FINAVIA">
          </div>
          <div class="form-group">
            <label class="form-label">Email de contact</label>
            <input type="email" class="form-input" value="contact@finavia.eu">
          </div>
          <div class="form-group">
            <label class="form-label">Téléphone</label>
            <input type="text" class="form-input" value="+33 1 23 45 67 89">
          </div>
          <div class="form-group">
            <label class="form-label">Langue par défaut</label>
            <select class="form-select">
              <option value="fr" selected>Français</option>
              <option value="es">Español</option>
              <option value="de">Deutsch</option>
              <option value="pt">Português</option>
              <option value="it">Italiano</option>
            </select>
          </div>
          <button class="btn btn-primary" style="width:100%;">Sauvegarder</button>
        </div>
      </div>
      <div class="admin-card">
        <div class="admin-card-header"><h3 class="admin-card-title">🔒 Sécurité</h3></div>
        <div class="admin-card-body">
          <div class="form-group">
            <label class="form-label">Email administrateur</label>
            <input type="email" class="form-input" value="admin@finavia.eu" disabled style="background:#F8FAFC;">
          </div>
          <div class="form-group">
            <label class="form-label">Nouveau mot de passe</label>
            <input type="password" class="form-input" placeholder="••••••••••">
          </div>
          <div class="form-group">
            <label class="form-label">Confirmer le mot de passe</label>
            <input type="password" class="form-input" placeholder="••••••••••">
          </div>
          <button class="btn btn-dark" style="width:100%;">Changer le mot de passe</button>
        </div>
      </div>
    </div>
  `;
}

/* ============================================
   8. HELPERS DE RENDU
   ============================================ */

function renderStatCard(icon, label, value, change, isPositive, iconClass) {
  return `
    <div class="admin-stat-card">
      <div class="admin-stat-info">
        <div class="admin-stat-label">${label}</div>
        <div class="admin-stat-value">${value}</div>
        <div class="admin-stat-change ${isPositive === true ? 'up' : isPositive === false ? 'down' : ''}">
          ${isPositive === true ? '↑' : isPositive === false ? '↓' : '—'} ${change}
        </div>
      </div>
      <div class="admin-stat-icon ${iconClass}" style="font-size:1.5rem;width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;">
        ${icon}
      </div>
    </div>
  `;
}

function renderRequestRow(r, showCheckbox = false) {
  const statusMap = {
    new:      { cls: 'admin-status-new',      label: 'Nouvelle' },
    review:   { cls: 'admin-status-review',   label: 'En analyse' },
    approved: { cls: 'admin-status-approved', label: 'Approuvée' },
    rejected: { cls: 'admin-status-rejected', label: 'Refusée' },
    archived: { cls: 'admin-status-archived', label: 'Archivée' },
  };
  const status = statusMap[r.status] || statusMap.new;
  const initials = r.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return `
    <tr>
      ${showCheckbox ? `<td><input type="checkbox" style="accent-color:#00A878;"></td>` : ''}
      <td>
        <div class="admin-table-client">
          <div class="admin-table-avatar">${initials}</div>
          <div>
            <div class="admin-table-name">${r.name}</div>
            <div class="admin-table-email">${r.email}</div>
          </div>
        </div>
      </td>
      <td style="font-size:0.8125rem;">${r.type}</td>
      <td style="font-weight:600;">${formatAdminAmount(r.amount)}</td>
      ${showCheckbox ? `<td style="font-size:0.8125rem;">${r.country}</td>` : ''}
      <td style="font-size:0.8rem;color:#64748B;">${r.date}</td>
      <td><span class="admin-status ${status.cls}">${status.label}</span></td>
      <td>
        <div class="admin-table-actions">
          <button class="admin-action-btn" title="Voir le dossier">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
          <button class="admin-action-btn" title="Envoyer email">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
            </svg>
          </button>
          <button class="admin-action-btn delete" title="Archiver">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  `;
}

/* ============================================
   9. MODALS
   ============================================ */
function initModals() {
  // Ferme les modals si clic sur l'overlay
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('admin-modal-overlay')) {
      closeAllModals();
    }
  });

  // Ferme avec Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllModals();
  });
}

function closeAllModals() {
  document.querySelectorAll('.admin-modal-overlay').forEach(m => {
    m.classList.remove('open');
    setTimeout(() => m.remove(), 300);
  });
}

function createModal(title, bodyHTML, footerHTML = '') {
  const overlay = document.createElement('div');
  overlay.className = 'admin-modal-overlay';
  overlay.innerHTML = `
    <div class="admin-modal">
      <div class="admin-modal-header">
        <h3 class="admin-modal-title">${title}</h3>
        <button class="admin-modal-close" onclick="this.closest('.admin-modal-overlay').remove()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="admin-modal-body">${bodyHTML}</div>
      ${footerHTML ? `<div class="admin-modal-footer">${footerHTML}</div>` : ''}
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('open'));
  return overlay;
}

function openContentModal(section) {
  createModal(
    'Modifier le contenu - ' + section,
    `<div class="form-group"><label class="form-label">Titre</label>
     <input type="text" class="form-input" value="Financer vos projets, simplement et sûrement"></div>
     <div class="form-group"><label class="form-label">Sous-titre</label>
     <textarea class="form-textarea">FINAVIA vous accompagne...</textarea></div>`,
    `<button class="btn btn-secondary" onclick="this.closest('.admin-modal-overlay').remove()">Annuler</button>
     <button class="btn btn-primary" onclick="saveContent()">Sauvegarder</button>`
  );
}

function openFAQModal() {
  createModal(
    'Nouvelle question FAQ',
    `<div class="form-group"><label class="form-label">Question</label>
     <input type="text" class="form-input" placeholder="Votre question..."></div>
     <div class="form-group"><label class="form-label">Réponse</label>
     <textarea class="form-textarea" rows="5" placeholder="La réponse détaillée..."></textarea></div>
     <div class="form-group"><label class="form-label">Langue</label>
     <select class="form-select"><option>FR</option><option>ES</option><option>DE</option></select></div>`,
    `<button class="btn btn-secondary" onclick="this.closest('.admin-modal-overlay').remove()">Annuler</button>
     <button class="btn btn-primary">Ajouter</button>`
  );
}

function editEmailTemplate(id) {
  createModal(
    'Modifier le template email',
    `<div class="alert alert-info" style="margin-bottom:1rem;">
       <span>ℹ</span>
       <span>Les variables disponibles : <code>{{client_name}}</code>, <code>{{loan_amount}}</code>, <code>{{loan_type}}</code></span>
     </div>
     <div class="form-group"><label class="form-label">Sujet de l'email</label>
     <input type="text" class="form-input" value="FINAVIA - Votre demande a bien été reçue"></div>
     <div class="form-group"><label class="form-label">Corps de l'email (HTML)</label>
     <textarea class="form-textarea" rows="8">&lt;h2&gt;Bonjour {{client_name}}&lt;/h2&gt;\n&lt;p&gt;Votre demande de {{loan_type}} pour {{loan_amount}} a bien été reçue.&lt;/p&gt;</textarea></div>`,
    `<button class="btn btn-secondary" onclick="this.closest('.admin-modal-overlay').remove()">Annuler</button>
     <button class="btn btn-primary">Sauvegarder</button>`
  );
}

function sendTestEmail(id) {
  const email = prompt('Adresse email de test :');
  if (email) {
    // Simulation
    setTimeout(() => {
      if (window.showToast) window.showToast('Email de test envoyé à ' + email, 'success');
    }, 1000);
  }
}

function saveContent() {
  closeAllModals();
  if (window.showToast) window.showToast('Contenu sauvegardé !', 'success');
}

/* ============================================
   10. RECHERCHE
   ============================================ */
function initSearch() {
  const globalSearch = document.getElementById('globalSearch');
  if (!globalSearch) return;

  globalSearch.addEventListener('input', debounce((e) => {
    const query = e.target.value.trim();
    if (query.length < 3) return;
    // En production, recherche globale via API
    console.log('Global search:', query);
  }, 400));
}

/* ============================================
   11. GESTION IMAGES — UPLOAD RÉEL VERS CLOUDINARY
   ---------------------------------------------
   Chaque fichier sélectionné est envoyé au backend FINAVIA
   (POST /api/admin/images/upload), qui le transfère lui-même
   vers le compte Cloudinary configuré (voir backend/config/cloudinary.js).
   Un identifiant Cloudinary (public_id) peut être précisé pour que
   l'image apparaisse directement au bon emplacement sur le site
   public — voir le catalogue complet dans CLOUDINARY-IMAGES.md.
   ============================================ */
function handleDragOver(e) {
  e.preventDefault();
  document.getElementById('uploadZone')?.classList.add('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  document.getElementById('uploadZone')?.classList.remove('drag-over');
  const files = e.dataTransfer.files;
  processImageFiles(files);
}

function handleImageUpload(input) {
  processImageFiles(input.files);
  input.value = ''; // Permet de re-sélectionner le même fichier ensuite si besoin
}

async function processImageFiles(files) {
  if (!files || !files.length) return;

  for (const file of files) {
    // Demande optionnelle de l'emplacement Cloudinary visé (voir CLOUDINARY-IMAGES.md).
    // Laisser vide = Cloudinary génère un identifiant automatique (upload "libre").
    const publicId = window.prompt(
      `Identifiant Cloudinary pour "${file.name}" (optionnel)\n` +
      `Ex : finavia/loans/personal — laissez vide pour un upload libre.`,
      ''
    );
    // Annulé (Escape / Annuler) → on saute ce fichier sans le bloquer
    if (publicId === null) continue;

    await uploadSingleImageToCloudinary(file, publicId.trim());
  }
}

/**
 * Envoie un unique fichier au backend, qui le relaie vers Cloudinary.
 * Affiche un toast de progression puis de résultat (succès/erreur).
 */
async function uploadSingleImageToCloudinary(file, publicId) {
  const formData = new FormData();
  formData.append('file', file);
  if (publicId) formData.append('publicId', publicId);

  if (window.showToast) {
    window.showToast(`Envoi de "${file.name}" vers Cloudinary...`, 'info');
  }

  try {
    const token = getToken();
    const response = await fetch(`${API_BASE}/api/admin/images/upload`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Échec de l\'upload.');
    }

    if (window.showToast) {
      window.showToast(`"${file.name}" uploadée avec succès !`, 'success');
    }

    // Rafraîchit la médiathèque pour afficher la nouvelle image
    if (document.getElementById('uploadZone')) {
      renderImages();
    }
  } catch (error) {
    console.error('Erreur upload Cloudinary :', error);
    if (window.showToast) {
      window.showToast(
        `Échec de l'upload de "${file.name}" : ${error.message}. ` +
        `Vérifiez que le backend est bien connecté et configuré (CLOUDINARY_*).`,
        'error'
      );
    }
  }
}

/* ============================================
   12. AUTHENTIFICATION
   ============================================ */
function getToken()     { try { return localStorage.getItem(TOKEN_KEY); } catch(e) { return null; } }
function saveToken(t)   { try { localStorage.setItem(TOKEN_KEY, t); } catch(e) {} }
function getAdminUser() { try { return JSON.parse(localStorage.getItem('finavia_admin_user')); } catch(e) { return null; } }
function saveAdminUser(u) { try { localStorage.setItem('finavia_admin_user', JSON.stringify(u)); } catch(e) {} }
function isAuthenticated() { return !!getToken(); }

function logout() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('finavia_admin_user');
  } catch(e) {}
  window.location.href = 'index.html';
}

/* ============================================
   13. API HELPER
   ============================================ */
async function apiGet(endpoint) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/* ============================================
   14. DONNÉES MOCK (MODE DÉMO)
   ============================================ */
function getMockRequests() {
  return [
    { name: 'Marie Dupont',    email: 'marie.d@email.fr',  type: 'Prêt Personnel',      amount: 15000, country: 'France',   date: '15/01/2024', status: 'new' },
    { name: 'Carlos García',   email: 'c.garcia@mail.es',  type: 'Prêt Auto',            amount: 22000, country: 'Espagne',  date: '15/01/2024', status: 'review' },
    { name: 'Klaus Müller',    email: 'k.muller@web.de',   type: 'Regroupement',         amount: 80000, country: 'Allemagne',date: '14/01/2024', status: 'approved' },
    { name: 'Ana Ferreira',    email: 'ana.f@email.pt',    type: 'Prêt Immobilier',      amount: 250000,country: 'Portugal', date: '14/01/2024', status: 'review' },
    { name: 'Marco Rossi',     email: 'm.rossi@mail.it',   type: 'Prêt Travaux',         amount: 35000, country: 'Italie',  date: '13/01/2024', status: 'new' },
    { name: 'Sophie Bernard',  email: 's.b@email.fr',      type: 'Prêt Personnel',       amount: 8000,  country: 'France',  date: '13/01/2024', status: 'approved' },
    { name: 'Pierre Martin',   email: 'p.martin@mail.be',  type: 'Prêt Auto',            amount: 18000, country: 'Belgique',date: '12/01/2024', status: 'rejected' },
    { name: 'Luisa Santos',    email: 'l.s@email.pt',      type: 'Prêt Travaux',         amount: 45000, country: 'Portugal',date: '12/01/2024', status: 'new' },
    { name: 'Hans Weber',      email: 'h.weber@web.de',    type: 'Prêt Immobilier',      amount: 320000,country: 'Allemagne',date: '11/01/2024', status: 'review' },
    { name: 'Isabelle Leroy',  email: 'i.l@email.fr',      type: 'Regroupement',         amount: 65000, country: 'France',  date: '11/01/2024', status: 'archived'},
  ];
}

function getMockFAQ() {
  return [
    { question: 'Quels documents faut-il fournir pour une demande de prêt ?', lang: 'fr' },
    { question: 'Quel est le délai de traitement d\'une demande ?', lang: 'fr' },
    { question: 'Quels sont les montants et durées disponibles ?', lang: 'fr' },
    { question: 'Ma demande est-elle sans engagement ?', lang: 'fr' },
    { question: 'Comment sont calculés les taux d\'intérêt ?', lang: 'fr' },
    { question: '¿Qué documentos se necesitan para solicitar un préstamo?', lang: 'es' },
    { question: 'Welche Dokumente werden für einen Kreditantrag benötigt?', lang: 'de' },
  ];
}

function getMockServices() {
  return [
    { icon: '👤', name: 'Prêt Personnel',      slug: 'personal',      minAmount: 1000,  maxAmount: 75000,   rate: '3,5% – 18,9%', duration: '12 – 84 mois' },
    { icon: '🚗', name: 'Prêt Automobile',     slug: 'auto',          minAmount: 5000,  maxAmount: 80000,   rate: '2,9% – 12,9%', duration: '24 – 84 mois' },
    { icon: '🏠', name: 'Prêt Travaux',        slug: 'travaux',       minAmount: 3000,  maxAmount: 75000,   rate: '3,2% – 14,9%', duration: '12 – 84 mois' },
    { icon: '🏡', name: 'Prêt Immobilier',     slug: 'immo',          minAmount: 50000, maxAmount: 1000000, rate: '1,8% – 4,9%',  duration: '5 – 25 ans' },
    { icon: '💳', name: 'Regroupement',        slug: 'regroupement',  minAmount: 5000,  maxAmount: 150000,  rate: '2,9% – 12,9%', duration: '12 – 120 mois' },
  ];
}

function getPlaceholderImages() {
  return [
    { name: 'hero-main.webp',        icon: '🏙️', color1: '#0A2540', color2: '#0d3060' },
    { name: 'service-personal.webp', icon: '👤', color1: '#00A878', color2: '#2D6A4F' },
    { name: 'service-auto.webp',     icon: '🚗', color1: '#1a3a5c', color2: '#0A2540' },
    { name: 'service-immo.webp',     icon: '🏠', color1: '#2D6A4F', color2: '#00A878' },
    { name: 'team-1.webp',           icon: '👩', color1: '#6366f1', color2: '#8b5cf6' },
    { name: 'team-2.webp',           icon: '👨', color1: '#0891b2', color2: '#06b6d4' },
  ];
}

/* Utilitaires */
function formatAdminAmount(n) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(n);
}

function debounce(fn, delay) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

// Expose les fonctions nécessaires globalement
window.navigateTo    = navigateTo;
window.saveContent   = saveContent;
window.openFAQModal  = openFAQModal;
window.editEmailTemplate = editEmailTemplate;
window.sendTestEmail = sendTestEmail;
window.handleDragOver = handleDragOver;
window.handleDrop    = handleDrop;
window.handleImageUpload = handleImageUpload;
window.deleteRealImage = deleteRealImage;
window.logout        = logout;
