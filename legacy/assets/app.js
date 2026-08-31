/* ============================================================
   Smart-Shelf — front-end JavaScript (vanilla, no framework)
   Talks to the PHP API in /api via fetch + JSON.
   ============================================================ */

const API = 'api';

/* ---------------- helpers ---------------- */

function toast(message, type = '') {
    let stack = document.getElementById('toast-stack');
    if (!stack) {
        stack = document.createElement('div');
        stack.id = 'toast-stack';
        document.body.appendChild(stack);
    }
    const el = document.createElement('div');
    el.className = 'toast-ss ' + type;
    el.textContent = message;
    stack.appendChild(el);
    setTimeout(() => el.remove(), 3200);
}

async function api(path, options = {}) {
    const res = await fetch(`${API}/${path}`, {
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
}

const post = (path, body) => api(path, { method: 'POST', body: JSON.stringify(body || {}) });

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
}

function formatDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleDateString(undefined, {
        day: 'numeric', month: 'short', year: 'numeric',
    });
}

/* ---------------- session ---------------- */

let CURRENT_USER = null;

async function loadSession() {
    try {
        const { user } = await api('auth.php?action=me');
        CURRENT_USER = user;
    } catch {
        CURRENT_USER = null;
    }
    renderNavAuth();
    return CURRENT_USER;
}

function renderNavAuth() {
    const slot = document.getElementById('nav-auth');
    if (!slot) return;

    if (CURRENT_USER) {
        slot.innerHTML = `
            <span class="text-white-50 me-3 small">${escapeHtml(CURRENT_USER.full_name)}
                <span class="chip ms-1">${escapeHtml(CURRENT_USER.role)}</span>
            </span>
            <button class="btn btn-sm btn-ss-outline text-white border-light" id="logout-btn">Sign out</button>`;
        document.getElementById('logout-btn').addEventListener('click', async () => {
            await post('auth.php?action=logout');
            window.location.href = 'index.html';
        });
    } else {
        slot.innerHTML = `<a class="btn btn-sm btn-light fw-semibold" href="auth.html">Sign in</a>`;
    }

    const adminLink = document.getElementById('nav-admin');
    if (adminLink) adminLink.classList.toggle('d-none', CURRENT_USER?.role !== 'librarian');
}

async function requireUser() {
    const user = await loadSession();
    if (!user) {
        window.location.href = 'auth.html';
        return null;
    }
    return user;
}

/* ---------------- home page ---------------- */

async function initHome() {
    await loadSession();
    try {
        const { books } = await api('books.php?action=list');
        const titles = books.length;
        const total = books.reduce((s, b) => s + Number(b.total_copies), 0);
        const available = books.reduce((s, b) => s + Number(b.available_copies), 0);
        const categories = new Set(books.map((b) => b.category)).size;

        const set = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };
        set('stat-titles', titles);
        set('stat-copies', total);
        set('stat-available', available);
        set('stat-categories', categories);
    } catch (e) {
        toast(e.message, 'error');
    }
}

/* ---------------- auth page ---------------- */

function initAuth() {
    loadSession().then((user) => {
        if (user) window.location.href = 'books.html';
    });

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target;
        try {
            await post('auth.php?action=login', {
                email: f.email.value,
                password: f.password.value,
            });
            window.location.href = 'books.html';
        } catch (err) {
            toast(err.message, 'error');
        }
    });

    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target;
        try {
            await post('auth.php?action=register', {
                full_name: f.full_name.value,
                email: f.email.value,
                password: f.password.value,
                role: f.role.value,
            });
            window.location.href = 'books.html';
        } catch (err) {
            toast(err.message, 'error');
        }
    });
}

/* ---------------- catalog page ---------------- */

let ALL_BOOKS = [];
let ACTIVE_CATEGORY = 'All';

async function initBooks() {
    await loadSession();

    const search = document.getElementById('search-input');
    search.addEventListener('input', renderBooks);

    try {
        const { books } = await api('books.php?action=list');
        ALL_BOOKS = books;
        renderCategories();
        renderBooks();
    } catch (e) {
        toast(e.message, 'error');
    }
}

function renderCategories() {
    const wrap = document.getElementById('category-filters');
    const categories = ['All', ...Array.from(new Set(ALL_BOOKS.map((b) => b.category))).sort()];
    wrap.innerHTML = categories
        .map(
            (c) =>
                `<button class="btn btn-sm filter-pill ${c === ACTIVE_CATEGORY ? 'btn-ss' : 'btn-ss-outline'}"
                         data-category="${escapeHtml(c)}">${escapeHtml(c)}</button>`
        )
        .join('');
    wrap.querySelectorAll('button').forEach((btn) =>
        btn.addEventListener('click', () => {
            ACTIVE_CATEGORY = btn.dataset.category;
            renderCategories();
            renderBooks();
        })
    );
}

function renderBooks() {
    const q = document.getElementById('search-input').value.trim().toLowerCase();
    const grid = document.getElementById('book-grid');

    const list = ALL_BOOKS.filter((b) => {
        const inCategory = ACTIVE_CATEGORY === 'All' || b.category === ACTIVE_CATEGORY;
        const match =
            !q ||
            b.title.toLowerCase().includes(q) ||
            b.author.toLowerCase().includes(q) ||
            b.category.toLowerCase().includes(q);
        return inCategory && match;
    });

    if (!list.length) {
        grid.innerHTML = '<p class="text-muted">No books match that search.</p>';
        return;
    }

    grid.innerHTML = list
        .map((b) => {
            const available = Number(b.available_copies);
            const action = CURRENT_USER
                ? `<button class="btn btn-ss w-100" data-issue="${b.id}" ${available < 1 ? 'disabled' : ''}>
                     ${available > 0 ? 'Issue book' : 'All copies out'}</button>`
                : `<a class="btn btn-ss-outline w-100" href="auth.html">Sign in to borrow</a>`;
            return `
            <div class="col-12 col-sm-6 col-lg-4">
              <div class="card-ss">
                <div class="card-body d-flex flex-column">
                  <span class="chip mb-2 align-self-start">${escapeHtml(b.category)}</span>
                  <h3 class="h5 mb-1">${escapeHtml(b.title)}</h3>
                  <p class="text-muted small mb-2">${escapeHtml(b.author)}</p>
                  <p class="small text-muted flex-grow-1">${escapeHtml(b.description || '')}</p>
                  <div class="d-flex justify-content-between small mb-3">
                    <span class="${available > 0 ? 'text-success' : 'text-danger'}">
                      ${available} of ${b.total_copies} available</span>
                    ${b.isbn ? `<span class="text-muted">ISBN ${escapeHtml(b.isbn)}</span>` : ''}
                  </div>
                  ${action}
                </div>
              </div>
            </div>`;
        })
        .join('');

    grid.querySelectorAll('[data-issue]').forEach((btn) =>
        btn.addEventListener('click', async () => {
            btn.disabled = true;
            try {
                await post('issues.php?action=issue', { book_id: Number(btn.dataset.issue) });
                toast('Book issued — due in 14 days.', 'success');
                const { books } = await api('books.php?action=list');
                ALL_BOOKS = books;
                renderBooks();
            } catch (e) {
                toast(e.message, 'error');
                btn.disabled = false;
            }
        })
    );
}

/* ---------------- circulation page ---------------- */

async function initCirculation() {
    if (!(await requireUser())) return;
    await loadLoans();
}

async function loadLoans() {
    const body = document.getElementById('loans-body');
    try {
        const { loans } = await api('issues.php?action=mine');
        const active = loans.filter((l) => l.status === 'issued');
        const overdue = active.filter((l) => Number(l.days_left) < 0);

        document.getElementById('stat-active').textContent = active.length;
        document.getElementById('stat-overdue').textContent = overdue.length;
        document.getElementById('stat-history').textContent = loans.length;

        if (!loans.length) {
            body.innerHTML = '<tr><td colspan="6" class="text-muted p-3">No loans yet.</td></tr>';
            return;
        }

        body.innerHTML = loans
            .map((l) => {
                const days = Number(l.days_left);
                let badge = `<span class="chip chip-success">Returned</span>`;
                if (l.status === 'issued') {
                    badge =
                        days < 0
                            ? `<span class="chip chip-danger">${Math.abs(days)} days overdue</span>`
                            : `<span class="chip">Due in ${days} days</span>`;
                }
                return `<tr>
                  <td><strong>${escapeHtml(l.title)}</strong><br><span class="text-muted small">${escapeHtml(l.author)}</span></td>
                  <td>${formatDate(l.issue_date)}</td>
                  <td>${formatDate(l.due_date)}</td>
                  <td>${formatDate(l.return_date)}</td>
                  <td>${badge}</td>
                  <td class="text-end">${
                      l.status === 'issued'
                          ? `<button class="btn btn-sm btn-ss" data-return="${l.id}">Return</button>`
                          : ''
                  }</td>
                </tr>`;
            })
            .join('');

        body.querySelectorAll('[data-return]').forEach((btn) =>
            btn.addEventListener('click', async () => {
                btn.disabled = true;
                try {
                    await post('issues.php?action=return', { issue_id: Number(btn.dataset.return) });
                    toast('Book returned. Thank you!', 'success');
                    loadLoans();
                } catch (e) {
                    toast(e.message, 'error');
                    btn.disabled = false;
                }
            })
        );
    } catch (e) {
        toast(e.message, 'error');
    }
}

/* ---------------- admin dashboard ---------------- */

async function initAdmin() {
    const user = await requireUser();
    if (!user) return;
    if (user.role !== 'librarian') {
        document.getElementById('admin-root').innerHTML =
            '<div class="alert alert-warning">Librarian access only.</div>';
        return;
    }

    document.getElementById('add-book-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const f = e.target;
        try {
            await post('books.php?action=create', {
                title: f.title.value,
                author: f.author.value,
                category: f.category.value,
                isbn: f.isbn.value,
                description: f.description.value,
                total_copies: Number(f.total_copies.value),
            });
            f.reset();
            toast('Book added to inventory.', 'success');
            loadAdminData();
        } catch (err) {
            toast(err.message, 'error');
        }
    });

    loadAdminData();
}

async function loadAdminData() {
    try {
        const [{ stats }, { books }, { loans }, { members }] = await Promise.all([
            api('issues.php?action=stats'),
            api('books.php?action=list'),
            api('issues.php?action=all'),
            api('issues.php?action=members'),
        ]);

        const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
        set('kpi-titles', stats.titles);
        set('kpi-loans', stats.active_loans);
        set('kpi-overdue', stats.overdue);
        set('kpi-members', stats.members);
        set('kpi-available', stats.available_copies);

        /* inventory */
        document.getElementById('inventory-body').innerHTML = books
            .map(
                (b) => `<tr>
                  <td><strong>${escapeHtml(b.title)}</strong><br><span class="text-muted small">${escapeHtml(b.author)}</span></td>
                  <td><span class="chip">${escapeHtml(b.category)}</span></td>
                  <td>${b.available_copies} / ${b.total_copies}</td>
                  <td class="text-end"><button class="btn btn-sm btn-outline-danger" data-delete="${b.id}">Remove</button></td>
                </tr>`
            )
            .join('');

        document.querySelectorAll('[data-delete]').forEach((btn) =>
            btn.addEventListener('click', async () => {
                if (!confirm('Remove this book from the catalog?')) return;
                try {
                    await post('books.php?action=delete', { id: Number(btn.dataset.delete) });
                    toast('Book removed.', 'success');
                    loadAdminData();
                } catch (e) {
                    toast(e.message, 'error');
                }
            })
        );

        /* loans */
        document.getElementById('admin-loans-body').innerHTML = loans.length
            ? loans
                  .map((l) => {
                      const days = Number(l.days_left);
                      const badge =
                          l.status === 'returned'
                              ? '<span class="chip chip-success">Returned</span>'
                              : days < 0
                                ? `<span class="chip chip-danger">${Math.abs(days)}d overdue</span>`
                                : `<span class="chip">Due in ${days}d</span>`;
                      return `<tr>
                        <td>${escapeHtml(l.title)}</td>
                        <td>${escapeHtml(l.full_name)}<br><span class="text-muted small">${escapeHtml(l.email)}</span></td>
                        <td>${formatDate(l.issue_date)}</td>
                        <td>${formatDate(l.due_date)}</td>
                        <td>${badge}</td>
                        <td class="text-end">${
                            l.status === 'issued'
                                ? `<button class="btn btn-sm btn-ss" data-force-return="${l.id}">Mark returned</button>`
                                : ''
                        }</td>
                      </tr>`;
                  })
                  .join('')
            : '<tr><td colspan="6" class="text-muted p-3">No loans recorded.</td></tr>';

        document.querySelectorAll('[data-force-return]').forEach((btn) =>
            btn.addEventListener('click', async () => {
                try {
                    await post('issues.php?action=return', { issue_id: Number(btn.dataset.forceReturn) });
                    toast('Loan closed.', 'success');
                    loadAdminData();
                } catch (e) {
                    toast(e.message, 'error');
                }
            })
        );

        /* members */
        document.getElementById('members-body').innerHTML = members
            .map(
                (m) => `<tr>
                  <td>${escapeHtml(m.full_name)}</td>
                  <td>${escapeHtml(m.email)}</td>
                  <td><span class="chip">${escapeHtml(m.role)}</span></td>
                  <td>${m.active_loans || 0}</td>
                  <td>${formatDate(m.created_at)}</td>
                </tr>`
            )
            .join('');
    } catch (e) {
        toast(e.message, 'error');
    }
}
