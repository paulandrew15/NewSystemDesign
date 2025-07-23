document.addEventListener('DOMContentLoaded', () => {
  const tbody = document.getElementById('request-table-body');
  if (!tbody) return;

  function loadVPRequests() {
    tbody.innerHTML = '';
    // look for both staff- and faculty- requests:
    ['staff', 'faculty'].forEach(role => {
      const prefix = `${role}-request-`;
      Object.keys(localStorage).forEach(key => {
        if (!key.startsWith(prefix)) return;
        const req = JSON.parse(localStorage.getItem(key));
        if (req.status !== 'pending-vp') return;

        const dateKey = key.slice(prefix.length);
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${req.userId}</td>
          <td>${req.fullName}</td>
          <td>${new Date(dateKey).toLocaleDateString('default',{
            year: 'numeric', month: 'long', day: 'numeric'
          })}</td>
          <td>${req.reason}</td>
          <td>
            <a href="${req.fileData}" download>${req.fileName}</a>
          </td>
          <td>
            <button class="approve-btn" data-key="${key}">Approve</button>
            <button class="deny-btn"    data-key="${key}">Deny</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    });

    // wire up the Approve/Deny buttons
    tbody.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        const req = JSON.parse(localStorage.getItem(key));
        req.status = btn.matches('.approve-btn') ? 'approved' : 'denied';
        localStorage.setItem(key, JSON.stringify(req));
        loadVPRequests();
      });
    });
  }

  loadVPRequests();
});
