// vicepresident.js
document.addEventListener('DOMContentLoaded', () => {
    const requestList = document.getElementById("request-list");
    if (!requestList) return;

    const roleKey = 'staff'|'faculty'; // VP sees staff requests
    function loadVPRequests() {
        requestList.innerHTML = '';
        Object.keys(localStorage).forEach(key => {
            if (!key.startsWith(`${roleKey}-request-`)) return;
            const req = JSON.parse(localStorage.getItem(key));
            const date = key.replace(`${roleKey}-request-`, '');
            const card = document.createElement('div');
            card.className = 'request-card';
            card.innerHTML = `
        <h3>${date}</h3>
        <p><a href="${req.fileData}" download="${req.fileName}">
             ${req.fileName}
           </a></p>
        <div class="actions">
          <button class="approve" data-key="${key}">Approve</button>
          <button class="deny"    data-key="${key}">Deny</button>
          <span class="status">${req.status}</span>
        </div>`;
            requestList.appendChild(card);
        });
    }

    // delegate approve/deny
    requestList.addEventListener('click', e => {
        const btn = e.target;
        if (!btn.matches('button.approve, button.deny')) return;
        const key = btn.dataset.key;
        const req = JSON.parse(localStorage.getItem(key));
        req.status = btn.matches('.approve') ? 'approved' : 'denied';
        localStorage.setItem(key, JSON.stringify(req));
        loadVPRequests();
    });

    loadVPRequests();

    function loadVPRequests() {
        const tbody = document.getElementById('request-table-body');
        tbody.innerHTML = '';

        const prefix = 'staff-request-';
        Object.keys(localStorage).forEach(key => {
            if (!key.startsWith(prefix)) return;
            const req = JSON.parse(localStorage.getItem(key));
            const date = key.slice(prefix.length);

            const tr = document.createElement('tr');
            tr.innerHTML = `
      <td>${req.userId}</td>
      <td>${req.fullName}</td>
      <td>${date}</td>
      <td>${req.reason}</td>
      <td><a href="${req.fileData}" download="${req.fileName}">${req.fileName}</a></td>
      <td>
        <button class="approve-btn" data-key="${key}">Approve</button>
        <button class="deny-btn"    data-key="${key}">Deny</button>
        <button class="delete-btn"  data-key="${key}">Delete</button>
      </td>
    `;
            tbody.appendChild(tr);
        });

        // handle Approve
        tbody.querySelectorAll('.approve-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.dataset.key;
                const req = JSON.parse(localStorage.getItem(key));
                req.status = 'approved';
                localStorage.setItem(key, JSON.stringify(req));
                loadVPRequests();
            });
        });

        // handle Deny
        tbody.querySelectorAll('.deny-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.dataset.key;
                const req = JSON.parse(localStorage.getItem(key));
                req.status = 'denied';
                localStorage.setItem(key, JSON.stringify(req));
                loadVPRequests();
            });
        });

        // existing Delete
        tbody.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                localStorage.removeItem(btn.dataset.key);
                loadVPRequests();
            });
        });
    }


});
