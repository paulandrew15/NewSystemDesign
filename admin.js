// admin.js
document.addEventListener('DOMContentLoaded', () => {
    // — 0) Sidebar tab wiring —
    function showView(id) {
        document.querySelectorAll('.main-content > section, .main-content > div.modal').forEach(el => {
            el.style.display = (el.id === id || el.classList.contains('modal')) ? null : 'none';
        });
        document.querySelectorAll('.sidebar a').forEach(a => {
            a.classList.toggle('active', a.getAttribute('onclick')?.includes(id));
        });
        // 🔥 Always load leave history when viewing that section
        if (id === 'leave-view' && typeof loadLeaveHistory === 'function') {
            loadLeaveHistory();
        }
    }
    // default
    showView('calendar-view');


    // — 1) Calendar / Day-detail modal —
    (function initCalendar() {
        const calEl = document.getElementById('monthly-calendar');
        const titleEl = document.getElementById('calendar-title');
        const prevBtn = document.getElementById('prev-month');
        const nextBtn = document.getElementById('next-month');
        const dayModal = document.getElementById('day-modal');
        const closeDay = document.getElementById('close-day-modal');
        const dayDate = document.getElementById('day-date');
        const dayTbody = document.querySelector('#day-request-table tbody');
        const stats = {
            total: document.querySelector('.attendance-summary .stat.total .number'),
            present: document.querySelector('.attendance-summary .stat.present .number'),
            pending: document.querySelector('.attendance-summary .stat.pending .number'),
            late: document.querySelector('.attendance-summary .stat.late   .number'),
        };

        if (!calEl || !titleEl) return;
        let current = new Date();

        function buildCalendar(date) {
            const y = date.getFullYear();
            const m = date.getMonth();
            const firstDow = new Date(y, m, 1).getDay();
            const daysInMon = new Date(y, m + 1, 0).getDate();
            const months = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
            const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

            // header
            titleEl.textContent = `${months[m]} ${y}`;

            // build table
            let html = '<table><thead><tr>';
            weekdays.forEach(d => html += `<th>${d}</th>`);
            html += '</tr></thead><tbody><tr>';

            // leading blanks
            for (let i = 0; i < firstDow; i++) html += '<td></td>';
            // days
            for (let d = 1; d <= daysInMon; d++) {
                const key = `${y}-${m + 1}-${d}`;
                html += `<td><div class="day-cell" data-date="${key}">${d}</div></td>`;
                if ((firstDow + d) % 7 === 0 && d !== daysInMon) html += '</tr><tr>';
            }
            // trailing blanks
            const tail = (firstDow + daysInMon) % 7;
            if (tail) for (let i = tail; i < 7; i++) html += '<td></td>';
            html += '</tr></tbody></table>';

            calEl.innerHTML = html;
            calEl.querySelectorAll('.day-cell').forEach(cell => {
                cell.addEventListener('click', () => openDayModal(cell.dataset.date));
            });
        }

        function openDayModal(dateKey) {
            // 1) Format & show date
            const [y, m, d] = dateKey.split('-').map(Number);
            const dt = new Date(y, m - 1, d);
            dayDate.textContent = dt.toLocaleDateString('default', {
                month: 'long', day: 'numeric', year: 'numeric'
            });

            // 2) Gather & render rows
            const entries = [];
            dayTbody.innerHTML = '';
            Object.keys(localStorage).forEach(k => {
                const match = k.match(/^(\w+)-request-(\d{4}-\d{1,2}-\d{1,2})$/);
                if (!match || match[2] !== dateKey) return;
                const rec = JSON.parse(localStorage.getItem(k));
                rec._storageKey = k;
                entries.push(rec);

                const tr = document.createElement('tr');
                tr.innerHTML = `
          <td>${rec.fullName || ''}</td>
          <td>${rec.reason || ''}</td>
          <td>
            ${rec.fileName
                        ? `<a href="${rec.fileData}" download>${rec.fileName}</a>`
                        : ''}
          </td>
          <td>${rec.status}</td>
          <td class="actions">
            <button class="approve-admin-btn" data-key="${k}">Approve</button>
            <button class="send-to-vp-btn"    data-key="${k}">Send to VP</button>
            <button class="deny-btn"          data-key="${k}">Deny</button>
          </td>`;
                dayTbody.appendChild(tr);
            });

            // 3) Wire row-buttons (they update localStorage + re-open modal)
            dayTbody.querySelectorAll('.approve-admin-btn').forEach(b => {
                b.addEventListener('click', () => {
                    const key = b.dataset.key;
                    const r = JSON.parse(localStorage.getItem(key));
                    r.status = 'approved-admin';
                    localStorage.setItem(key, JSON.stringify(r));
                    openDayModal(dateKey);
                });
            });
            dayTbody.querySelectorAll('.send-to-vp-btn').forEach(b => {
                b.addEventListener('click', () => {
                    const key = b.dataset.key;
                    const r = JSON.parse(localStorage.getItem(key));
                    r.status = 'pending-vp';
                    localStorage.setItem(key, JSON.stringify(r));
                    openDayModal(dateKey);
                });
            });
            dayTbody.querySelectorAll('.deny-btn').forEach(b => {
                b.addEventListener('click', () => {
                    const key = b.dataset.key;
                    const r = JSON.parse(localStorage.getItem(key));
                    r.status = 'denied';
                    localStorage.setItem(key, JSON.stringify(r));
                    openDayModal(dateKey);
                });
            });

            // 4) Compute & render summary cards
            stats.total.textContent = entries.length;
            stats.present.textContent = entries.filter(e => e.status === 'approved-admin' || e.status === 'approved').length;
            stats.pending.textContent = entries.filter(e => e.status === 'pending-admin' || e.status === 'pending-vp' || e.status === 'pending').length;
            stats.late.textContent = entries.filter(e => e.status === 'denied').length;

            // 5) Show it
            dayModal.style.display = 'flex';
        }

        // modal close
        closeDay.addEventListener('click', () => dayModal.style.display = 'none');
        dayModal.addEventListener('click', e => {
            if (e.target === dayModal) dayModal.style.display = 'none';
        });

        // nav
        prevBtn.addEventListener('click', () => { current.setMonth(current.getMonth() - 1); buildCalendar(current); });
        nextBtn.addEventListener('click', () => { current.setMonth(current.getMonth() + 1); buildCalendar(current); });

        // initial
        buildCalendar(current);
    })();


    // — 2) Staff‐list —
    (function initStaffList() {
        const tbody = document.querySelector('#staff-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td>${localStorage.getItem('userId') || ''}</td>
      <td>${localStorage.getItem('fullName') || ''}</td>
      <td>${localStorage.getItem('selectedRole') || ''}</td>`;
        tbody.appendChild(tr);
    })();


    // — 3) Admin “Requests” cards (if you still need it) —
    (function initAdminRequests() {
        const list = document.getElementById('request-list');
        if (!list) return;
        function load() {
            list.innerHTML = '';
            Object.keys(localStorage).forEach(key => {
                if (!key.includes('-request-')) return;
                const r = JSON.parse(localStorage.getItem(key));
                if (r.status !== 'pending-admin') return;
                const date = key.split('-request-')[1];
                const card = document.createElement('div');
                card.className = 'request-card';
                card.innerHTML = `
          <h3>${r.fullName} — ${new Date(date).toLocaleDateString('default', {
                    month: 'long', day: 'numeric', year: 'numeric'
                })
                    }</h3>
          <p>${r.reason}</p>
          <div class="actions">
            <button class="send-to-vp" data-key="${key}">Send to VP</button>
            <button class="deny"        data-key="${key}">Deny</button>
            <span class="status">${r.status}</span>
          </div>`;
                list.appendChild(card);
            });
        }
        list.addEventListener('click', e => {
            const btn = e.target;
            const key = btn.dataset.key; if (!key) return;
            const r = JSON.parse(localStorage.getItem(key));
            if (btn.matches('.send-to-vp')) r.status = 'pending-vp';
            else if (btn.matches('.deny')) r.status = 'denied';
            localStorage.setItem(key, JSON.stringify(r));
            load();
        });
        load();
    })();


    // — 4) Admin Account Settings —
    (function initAdminAccount() {
        const editBtn = document.querySelector('#account-view .btn-edit');
        const fields = document.querySelectorAll('#account-view .account-form input, #account-view .account-form select');
        const eyeBtns = document.querySelectorAll('#account-view .eye-btn');
        const hdrName = document.querySelector('#account-view .account-header h1');
        const hdrId = document.querySelector('#account-view .account-header .employee-id');

        if (!editBtn) return;
        // prefill
        hdrId.textContent = `ID: ${localStorage.getItem('userId') || ''}`;
        hdrName.textContent = localStorage.getItem('fullName') || hdrName.textContent;

        // disable by default
        fields.forEach(i => i.disabled = true);
        eyeBtns.forEach(b => b.disabled = true);

        editBtn.addEventListener('click', () => {
            const editing = editBtn.textContent.trim() === 'Edit';
            fields.forEach(i => i.disabled = !editing);
            eyeBtns.forEach(b => b.disabled = !editing);
            editBtn.textContent = editing ? 'Save' : 'Edit';
            if (!editing) {
                const fn = document.getElementById('fullName');
                if (fn) {
                    localStorage.setItem('fullName', fn.value);
                    hdrName.textContent = fn.value;
                }
            }
        });

        // Add Email
        const addEmail = document.querySelector('#account-view .add-email-btn');
        const emailSec = document.querySelector('#account-view .email-section');
        addEmail?.addEventListener('click', () => {
            const email = prompt('Enter new email:');
            if (!email) return;
            const div = document.createElement('div');
            div.className = 'email-item';
            div.innerHTML = `
        <div class="email-left">
          <input type="checkbox" disabled>
          <label>${email}</label>
        </div>
        <span class="email-timestamp">just now</span>`;
            emailSec.insertBefore(div, addEmail);
        });
    })();

    // — 5) Leave History —
    (function initLeaveHistory() {
        const section = document.getElementById('leave-view');
        if (!section) return;

        const tbody = section.querySelector('tbody');
        if (!tbody) return;

        function loadLeaveHistory() {
            tbody.innerHTML = '';
            Object.keys(localStorage).forEach(key => {
                if (!key.includes('-request-')) return;

                const r = JSON.parse(localStorage.getItem(key));
                const dateStr = key.split('-request-')[1];

                const date = dateStr ? new Date(dateStr) : null;
                if (!date || isNaN(date)) return; // skip invalid dates

                const tr = document.createElement('tr');
                tr.innerHTML = `
            <td>${r.fullName || ''}</td>
            <td>${date.toLocaleDateString('default', {
                    year: 'numeric', month: 'short', day: 'numeric'
                })}</td>
            <td>${r.reason || ''}</td>
            <td>
                ${r.fileName && r.fileData
                        ? `<a href="${r.fileData}" download="${r.fileName}">${r.fileName}</a>`
                        : '—'}
            </td>
            <td>${r.status || ''}</td>`;
                tbody.appendChild(tr);
            });
        }


        // Load when leave-view is shown
        const leaveLink = document.querySelector('.sidebar a[onclick*="leave-view"]');
        if (leaveLink) {
            leaveLink.addEventListener('click', () => {
                showView('leave-view');
                loadLeaveHistory();
            });
        }
    })();



}); 
