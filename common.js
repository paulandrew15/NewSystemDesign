// common.js

// — Helpers —
function goBackToRoleSelect() {
    window.location.href = 'index.html';
}
function redirectToRolePage() {
    const role = (localStorage.getItem('selectedRole') || '').toLowerCase();
    if (role === 'admin') return 'admin.html';
    if (role === 'vice president') return 'vicepresident.html';
    if (role === 'faculty') return 'faculty.html';
    return 'staff.html';
}
function showView(id) {
    // 1) Toggle every <section> under .main-content
    document.querySelectorAll('.main-content > section').forEach(sec => {
        sec.style.display = (sec.id === id ? 'block' : 'none');
    });

    // 2) Highlight the sidebar link whose onclick mentions that id
    document.querySelectorAll('.sidebar a').forEach(a => {
        const onclick = a.getAttribute('onclick') || '';
        a.classList.toggle('active', onclick.includes(id));
    });
}
function logout() {
    localStorage.removeItem('selectedRole');
    window.location.href = 'login.html';
}

// — Main initializer —
document.addEventListener('DOMContentLoaded', () => {
    // Login page logic
    const loginForm = document.querySelector('form[onsubmit*="login"]');
    if (loginForm) {
        loginForm.addEventListener('submit', event => {
            event.preventDefault();

            const userId = document.getElementById('id').value;
            const selectedRole = document.getElementById('role').value;

            if (!selectedRole || !userId) {
                alert('Please fill in all fields.');
                return;
            }

            localStorage.setItem('userId', userId);
            localStorage.setItem('selectedRole', selectedRole);
            window.location.href = redirectToRolePage();
        });

    }

    // Role title on login
    const titleEl = document.getElementById('role-title');
    const role = localStorage.getItem('selectedRole');
    if (titleEl && role) titleEl.innerText = 'Login as ' + role;

    const sidebar = document.getElementById("sidebar");
    const toggleBtn = document.getElementById("toggleBtn");

    if (sidebar && toggleBtn) {
        toggleBtn.addEventListener("click", () => {
            sidebar.classList.toggle("collapsed");
        });
    }

    // Handle logout button (for role pages)
    const logoutBtn = document.querySelector(".logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            window.location.href = "main.html"; // back to login
        });
    }

    // LOGIN eye-toggle
    const pw = document.getElementById('password');
    const toggle = document.getElementById('togglePassword');
    if (pw && toggle) {
        toggle.addEventListener('click', e => {
            e.preventDefault();
            const hidden = pw.type === 'password';
            pw.type = hidden ? 'text' : 'password';
            toggle.style.opacity = hidden ? '1' : '0.6';
        });
    }

    // ACCOUNT-SETTINGS eye-toggle (runs on any page that has an #account-view)
    // ACCOUNT‐SETTINGS eye‐toggles (only when enabled)
    if (document.getElementById('account-view')) {
        document.querySelectorAll('#account-view .password-wrapper').forEach(wrapper => {
            const input = wrapper.querySelector('input');
            const btn = wrapper.querySelector('.eye-btn');
            if (!input || !btn) return;

            btn.addEventListener('click', e => {
                // only work when enabled
                if (btn.disabled) return;
                e.preventDefault();
                const hidden = input.type === 'password';
                input.type = hidden ? 'text' : 'password';
                btn.style.opacity = hidden ? '1' : '0.6';
                btn.setAttribute('aria-label', hidden ? 'Hide password' : 'Show password');
            });
        });
    }

    // Multi-view pages (Admin/VP/Faculty/Staff Dashboards)
    if (document.getElementById('dashboard-view')) {
        // Default to dashboard-tab
        showView('dashboard-view');
        document.querySelectorAll('.sidebar a').forEach(a => {
            if ((a.getAttribute('onclick') || '').includes('logout')) {
                a.addEventListener('click', e => { e.preventDefault(); logout(); });
            }
        });

        // Prefill account settings fields
        const roleDisp = document.getElementById('employeeRole');
        const headerId = document.querySelector('#account-view .employee-id');
        const headerName = document.querySelector('#account-view .account-header h1');
        if (roleDisp) roleDisp.value = localStorage.getItem('selectedRole') || '';
        if (headerId) headerId.textContent = 'ID: ' + (localStorage.getItem('userId') || '');
        if (headerName) headerName.textContent = localStorage.getItem('fullName') || headerName.textContent;

        // Edit/Save toggle (leave eye-btns always enabled)
        // inside your common.js or page-specific JS, after you define eyeBtns and headerName:
        const editBtn = document.querySelector('#account-view .btn-edit');
        if (editBtn) {
            const eyeBtns = document.querySelectorAll('#account-view .eye-btn');
            const headerName = document.querySelector('#account-view .account-header h1');

            // disable eye-buttons initially
            eyeBtns.forEach(b => b.disabled = true);

            editBtn.addEventListener('click', () => {
                const isEditing = editBtn.textContent.trim() === 'Edit';

                // toggle all form inputs & selects
                document
                    .querySelectorAll('#account-view .account-form input, #account-view .account-form select')
                    .forEach(f => f.disabled = !isEditing);

                // toggle eye-buttons in sync
                eyeBtns.forEach(b => b.disabled = !isEditing);

                // swap button text
                editBtn.textContent = isEditing ? 'Save' : 'Edit';

                if (!isEditing) {
                    // on Save, persist fullName and update header
                    const fullNameInput = document.getElementById('fullName');
                    if (fullNameInput && headerName) {
                        localStorage.setItem('fullName', fullNameInput.value);
                        headerName.textContent = fullNameInput.value;
                    }
                }
            });
        }


        // Add Email button
        const addEmail = document.querySelector('#account-view .add-email-btn');
        const emailSec = document.querySelector('#account-view .email-section');
        if (addEmail && emailSec) {
            addEmail.addEventListener('click', () => {
                const email = prompt('Enter new email address:');
                if (!email) return;
                const div = document.createElement('div');
                div.className = 'email-item';
                div.innerHTML = `
          <div class="email-left">
            <input type="checkbox" disabled>
            <label>${email}</label>
          </div>
          <span class="email-timestamp">just now</span>
        `;
                emailSec.insertBefore(div, addEmail);
            });
        }
    }
});
