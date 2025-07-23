// staff.js
document.addEventListener('DOMContentLoaded', () => {
  // 1) Philippine holidays for 2025
  const PH_HOLIDAYS = [
    '2025-01-01', // New Year’s Day
    '2025-04-17', // Maundy Thursday
    '2025-04-18', // Good Friday
    '2025-04-09', // Araw ng Kagitingan
    '2025-05-01', // Labor Day
    '2025-06-12', // Independence Day
    '2025-08-25', // National Heroes Day
    '2025-11-30', // Bonifacio Day
    '2025-12-25', // Christmas
    '2025-12-30'  // Rizal Day
  ];

  // 2) Grab all the elements we need
  const daysContainer = document.getElementById('calendar-days');
  const monthYearEl = document.getElementById('month-year');
  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');
  const modal = document.getElementById('leave-modal');
  const closeBtn = document.getElementById('close-modal');
  const form = document.getElementById('leave-form');
  const dateSpan = document.getElementById('modal-date');
  const reasonEl = document.getElementById('leave-reason');
  const fileEl = document.getElementById('leave-file');

  if (!daysContainer || !monthYearEl) return;  // nothing to do

  const roleKey = (localStorage.getItem('selectedRole') || 'staff').toLowerCase();
  let currentDate = new Date();

  // 3) Build or rebuild the calendar grid
  function renderCalendar(date) {
    const y = date.getFullYear(),
      m = date.getMonth(),
      firstDow = new Date(y, m, 1).getDay(),
      lastDay = new Date(y, m + 1, 0).getDate(),
      today = new Date();

    // header: e.g. "July 2025"
    monthYearEl.textContent = date.toLocaleString('default', {
      month: 'long', year: 'numeric'
    });

    daysContainer.innerHTML = '';

    // 3a) Leading blanks
    for (let i = 0; i < firstDow; i++) {
      daysContainer.innerHTML += `<div class="day empty"></div>`;
    }

    // 3b) The days themselves
    for (let d = 1; d <= lastDay; d++) {
      const rawKey = `${y}-${m + 1}-${d}`;       // e.g. "2025-7-15"
      const storageKey = `${roleKey}-request-${rawKey}`;
      const rec = JSON.parse(localStorage.getItem(storageKey) || 'null');
      const status = rec?.status || '';
      const isToday =
        d === today.getDate() &&
        m === today.getMonth() &&
        y === today.getFullYear();
      const isHoliday = PH_HOLIDAYS.includes(rawKey);

      daysContainer.innerHTML += `
        <div class="
               day
               ${status}
               ${isToday ? 'today' : ''}
               ${isHoliday ? 'holiday' : ''}
             "
             data-date="${rawKey}">
          ${d}
        </div>`;
    }

    // 3c) Trailing blanks
    const used = firstDow + lastDay,
      trail = (7 - (used % 7)) % 7;
    for (let i = 0; i < trail; i++) {
      daysContainer.innerHTML += `<div class="day empty"></div>`;
    }

    // 3d) Hook up day-cell clicks
    daysContainer.querySelectorAll('.day[data-date]').forEach(cell => {
      cell.addEventListener('click', () => {
        const raw = cell.dataset.date;                    // "2025-7-15"
        const [yy, mm, dd] = raw.split('-').map(Number);
        const dt = new Date(yy, mm - 1, dd);

        // format like "July 15, 2025"
        dateSpan.innerText = dt.toLocaleDateString('default', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        // stash the raw key on the form for submission
        form.dataset.dateKey = raw;

        reasonEl.value = '';
        fileEl.value = '';
        form.style.display = 'block';
        modal.style.display = 'flex';
      });
    });
  }

  // 4) Prev/Next month buttons
  prevBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar(currentDate);
  });
  nextBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar(currentDate);
  });

  // 5) Modal close handlers
  closeBtn.addEventListener('click', () => modal.style.display = 'none');
  modal.addEventListener('click', e => {
    if (e.target === modal) modal.style.display = 'none';
  });

  // 6) Form submission → save & rerender
  form.addEventListener('submit', e => {
    e.preventDefault();
    const dateKey = form.dataset.dateKey;
    if (!dateKey || !fileEl.files.length) return;

    const reader = new FileReader();
    reader.onload = () => {
      localStorage.setItem(
        `${roleKey}-request-${dateKey}`,
        JSON.stringify({
          reason: reasonEl.value,
          fileName: fileEl.files[0].name,
          fileData: reader.result,
          status: 'pending-admin',
          userId: localStorage.getItem('userId'),
          fullName: localStorage.getItem('fullName')
        })
      );
      modal.style.display = 'none';
      renderCalendar(currentDate);
    };
    reader.readAsDataURL(fileEl.files[0]);
  });

  // 7) First draw
  renderCalendar(currentDate);
});
