// admin.js
document.addEventListener('DOMContentLoaded', () => {
    // 0) Show the Calendar tab by default
    showView('calendar-view');

    // ─── 1) Calendar ───────────────────────────────────────────────
    const calEl = document.getElementById('monthly-calendar');
    const titleEl = document.getElementById('calendar-title');
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');
    const dayModal = document.getElementById('day-modal');
    const closeDay = document.getElementById('close-day-modal');
    const dayDate = document.getElementById('day-date');
    const dayTbody = document.querySelector('#day-request-table tbody');

    if (calEl && titleEl && prevBtn && nextBtn && dayModal && closeDay && dayTbody) {
        let now = new Date();

        function buildCalendar(date) {
            const y = date.getFullYear(), m = date.getMonth();
            const firstDow = new Date(y, m, 1).getDay();
            const daysInMon = new Date(y, m + 1, 0).getDate();
            const months = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
            const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

            // set header text
            titleEl.textContent = `${months[m]} ${y}`;

            // build table
            let html = '<table><thead><tr>';
            weekdays.forEach(d => html += `<th>${d}</th>`);
            html += '</tr></thead><tbody><tr>';

            // leading blanks
            for (let i = 0; i < firstDow; i++) html += '<td></td>';

            // day cells
            for (let d = 1; d <= daysInMon; d++) {
                const key = `${y}-${m + 1}-${d}`;
                html += `
          <td>
            <div class="day-cell" data-date="${key}">${d}</div>
          </td>`;
                if ((firstDow + d) % 7 === 0 && d !== daysInMon) html += '</tr><tr>';
            }

            // trailing blanks
            const tail = (firstDow + daysInMon) % 7;
            if (tail) for (let i = tail; i < 7; i++) html += '<td></td>';

            html += '</tr></tbody></table>';
            calEl.innerHTML = html;

            // wire day clicks
            calEl.querySelectorAll('.day-cell').forEach(cell => {
                cell.addEventListener('click', () => openDayModal(cell.dataset.date));
            });
        }

        function openDayModal(dateKey) {
            const [y, m, d] = dateKey.split('-').map(Number);
            const dt = new Date(y, m - 1, d);

            // Format like “July 15, 2025”
            dayDate.textContent = dt.toLocaleDateString('default', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            dayTbody.innerHTML = '';
            // …populate your table…
            dayModal.style.display = 'flex';

            // find all {role}-request-{dateKey}
            Object.keys(localStorage).forEach(k => {
                const m = k.match(/^(\w+)-request-(\d{4}-\d{1,2}-\d{1,2})$/);
                if (!m || m[2] !== dateKey) return;
                const role = m[1], rec = JSON.parse(localStorage.getItem(k));
                const tr = document.createElement('tr');
                tr.innerHTML = `
          <td>${role}</td>
          <td>${rec.reason || ''}</td>
          <td>${rec.fileName
                        ? `<a href="${rec.fileData}" download="${rec.fileName}">${rec.fileName}</a>`
                        : ''}</td>
          <td>${rec.status}</td>`;
                dayTbody.appendChild(tr);
            });

            dayModal.style.display = 'flex';
        }

        // modal close
        closeDay.addEventListener('click', () => dayModal.style.display = 'none');
        dayModal.addEventListener('click', e => {
            if (e.target === dayModal) dayModal.style.display = 'none';
        });

        // nav
        prevBtn.addEventListener('click', () => { now.setMonth(now.getMonth() - 1); buildCalendar(now); });
        nextBtn.addEventListener('click', () => { now.setMonth(now.getMonth() + 1); buildCalendar(now); });

        // initial draw
        buildCalendar(now);
    }

    // ─── 2) Staff List ─────────────────────────────────────────────
    const staffTbody = document.querySelector('#staff-table tbody');
    if (staffTbody) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
      <td>${localStorage.getItem('userId') || ''}</td>
      <td>${localStorage.getItem('fullName') || ''}</td>
      <td>${localStorage.getItem('selectedRole') || ''}</td>`;
        staffTbody.appendChild(tr);
    }

    // ─── 3) VP Request Cards ───────────────────────────────────────
    const requestList = document.getElementById('request-list');
    if (requestList) {
        function loadCards() {
            requestList.innerHTML = '';
            const prefix = 'staff-request-';
            Object.keys(localStorage).forEach(key => {
                if (!key.startsWith(prefix)) return;
                const req = JSON.parse(localStorage.getItem(key));
                const date = key.slice(prefix.length);
                const card = document.createElement('div');
                card.className = 'request-card';
                card.innerHTML = `
          <h3>${date}</h3>
          <p><a href="${req.fileData}" download="${req.fileName}">
            ${req.fileName}
          </a></p>
          <div class="actions">
            <button class="approve-btn" data-key="${key}">Approve</button>
            <button class="deny-btn"    data-key="${key}">Deny</button>
            <button class="delete-btn"  data-key="${key}">Delete</button>
            <span class="status">${req.status}</span>
          </div>`;
                requestList.appendChild(card);
            });

            // wire buttons
            requestList.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('click', () => {
                    const key = btn.dataset.key;
                    if (btn.matches('.delete-btn')) {
                        localStorage.removeItem(key);
                    } else {
                        const r = JSON.parse(localStorage.getItem(key));
                        r.status = btn.matches('.approve-btn') ? 'approved' : 'denied';
                        localStorage.setItem(key, JSON.stringify(r));
                    }
                    loadCards();
                });
            });
        }
        loadCards();
    }

    // ─── 4) Admin Account-Settings ──────────────────────────────────
    const adminEditBtn = document.querySelector('#account-view .btn-edit');
    const adminFields = document.querySelectorAll(
        '#account-view .account-form input, #account-view .account-form select'
    );
    const adminEyes = document.querySelectorAll('#account-view .eye-btn');
    const hdrName = document.querySelector('#account-view .account-header h1');
    const hdrId = document.querySelector('#account-view .account-header .employee-id');

    // Prefill header
    const storedId = localStorage.getItem('userId');
    const storedName = localStorage.getItem('fullName');
    if (storedId && hdrId) hdrId.textContent = `ID: ${storedId}`;
    if (storedName && hdrName) hdrName.textContent = storedName;

    // disable everything initially
    adminFields.forEach(f => f.disabled = true);
    adminEyes.forEach(b => b.disabled = true);

    // Edit ⇄ Save
    if (adminEditBtn) {
        adminEditBtn.addEventListener('click', () => {
            const editing = adminEditBtn.textContent.trim() === 'Edit';
            adminFields.forEach(f => f.disabled = !editing);
            adminEyes.forEach(b => b.disabled = !editing);
            adminEditBtn.textContent = editing ? 'Save' : 'Edit';

            if (!editing) {
                // save fullName back into header + localStorage
                const inp = document.getElementById('fullName');
                if (inp) {
                    localStorage.setItem('fullName', inp.value);
                    if (hdrName) hdrName.textContent = inp.value;
                }
            }
        });
    }

});
