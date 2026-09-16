function calendarMonth(year, month) {
  const first = new Date(year, month, 1);
  const count = new Date(year, month + 1, 0).getDate();
  const cells = Array(Math.ceil((first.getDay() + count) / 7) * 7).fill(null);
  for (let day = 1; day <= count; day++) cells[first.getDay() + day - 1] = day;
  return { year: first.getFullYear(), month: first.getMonth(), cells };
}
if (typeof module !== 'undefined') module.exports = { calendarMonth };
if (typeof document !== 'undefined') window.WorkoutCalendar = {
  render(dailyTotals, selectedDate, onSelect) {
    const now = new Date();
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const totals = new Map(dailyTotals.map(row => [row.date, row]));
    const cards = [...document.querySelectorAll('.mini-card'), document.querySelector('.calendar-card')];
    const focusDate = document.activeElement?.dataset.date;
    cards.forEach((card, index) => {
      const model = calendarMonth(now.getFullYear(), now.getMonth() + index - 2);
      card.querySelector('h1, h2').textContent = `${model.month + 1}월`;
      const grid = card.querySelector('.mini-grid, .month-grid');
      grid.setAttribute('aria-label', `${model.year}년 ${model.month + 1}월`); grid.replaceChildren();
      if (index < 2) weekdays.forEach(day => {
        const label = document.createElement('small'); label.textContent = day; grid.append(label);
      });
      model.cells.forEach(day => {
        const cell = document.createElement(day === null ? 'i' : 'button');
        if (day === null) { cell.className = 'empty'; cell.setAttribute('aria-hidden', 'true'); }
        else {
          const date = `${model.year}-${String(model.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const total = totals.get(date);
          const color = ['dark', 'main1', 'main2', 'main3', 'main4'].includes(total?.level) ? total.level : 'dark';
          cell.type = 'button'; cell.className = `calendar-day level-${color}`;
          cell.textContent = day; cell.dataset.date = date;
          cell.setAttribute('aria-pressed', String(date === selectedDate));
          cell.title = `${date} · ${WorkoutUI.duration(total?.totalSeconds || 0)}`;
          cell.setAttribute('aria-label', `${date}, 운동 ${WorkoutUI.duration(total?.totalSeconds || 0)}`);
          if (date === WorkoutUI.dateKey(now)) { cell.classList.add('today'); cell.setAttribute('aria-current', 'date'); }
          cell.addEventListener('click', () => onSelect(date));
        }
        grid.append(cell);
      });
    });
    if (focusDate) document.querySelector(`.calendar-day[data-date="${focusDate}"]`)?.focus();
  }
};
