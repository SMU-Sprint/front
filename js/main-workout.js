(() => {
  const { service, dateKey, duration, time, message } = WorkoutUI;
  const end = document.getElementById('endBtn');
  const refreshButton = document.getElementById('refresh-records');
  let activeSession = null, lastSession = null, totals = [], selectedDate = dateKey();
  let busy = false, ready = false, version = 0, recordVersion = 0, renderedDay = dateKey();
  function renderSession() {
    const session = activeSession || lastSession;
    document.getElementById('session-sport').textContent = session?.sportName || '운동 대기';
    document.getElementById('session-location').textContent = session?.locationName || '장소를 선택해 시작하세요';
    document.getElementById('session-start').textContent = time(session?.startedAt);
    document.getElementById('session-start-date').textContent = session ? dateKey(session.startedAt).replaceAll('-', '/') : '';
    document.getElementById('session-status').textContent = activeSession ? '운동 중' : lastSession ? '운동 종료' : '';
    document.getElementById('session-elapsed').textContent = duration(activeSession ? (Date.now() - Date.parse(activeSession.startedAt)) / 1000 : lastSession?.durationSeconds || 0);
    end.disabled = busy || !ready || !activeSession;
    end.textContent = busy ? '저장 중…' : '종료하기';
  }
  function renderCalendar() { WorkoutCalendar.render(totals, selectedDate, selectDate); }
  async function selectDate(date) {
    selectedDate = date; renderCalendar();
    const token = ++recordVersion;
    const list = document.getElementById('record-list');
    document.getElementById('record-date').textContent = `${date.replaceAll('-', '/')} 운동 기록`;
    document.getElementById('record-total').textContent = '';
    list.textContent = '기록을 불러오는 중…';
    try {
      const data = await service.records(date);
      if (token !== recordVersion) return;
      list.replaceChildren();
      document.getElementById('record-total').textContent = `총 ${duration(data.totalSeconds)}`;
      if (!data.records.length) { list.textContent = '완료된 운동 기록이 없습니다.'; return; }
      data.records.forEach(record => {
        const row = document.createElement('li');
        const title = document.createElement('strong'); title.textContent = record.sportName;
        const elapsed = document.createElement('b'); elapsed.textContent = duration(record.durationSeconds);
        const detail = document.createElement('small');
        detail.textContent = `${record.locationName} · ${time(record.segmentStartedAt || record.startedAt)}–${time(record.segmentEndedAt || record.endedAt)}`;
        row.append(title, elapsed, detail); list.append(row);
      });
    } catch (error) {
      if (token !== recordVersion) return;
      list.textContent = '기록을 불러오지 못했습니다. 새로고침을 눌러 주세요.'; message(error.message, true);
    }
  }
  async function refresh() {
    const token = ++version;
    const now = new Date();
    try {
      const data = await service.overview(dateKey(new Date(now.getFullYear(), now.getMonth() - 2, 1)), dateKey(new Date(now.getFullYear(), now.getMonth() + 1, 0)));
      if (token !== version) return;
      activeSession = data.activeSession; lastSession = data.lastSession; totals = data.dailyTotals;
      ready = true; renderSession(); renderCalendar(); await selectDate(selectedDate);
    } catch (error) { if (token === version) message(error.message, true); }
  }
  end.addEventListener('click', async () => {
    if (busy || !activeSession) return;
    busy = true; ++version; renderSession(); message('운동 기록을 저장하는 중입니다…');
    try {
      lastSession = await service.stop(activeSession.id);
      activeSession = null; selectedDate = dateKey(lastSession.endedAt);
      renderSession();
      message(service.demo ? '운동 기록을 이 브라우저에 저장했습니다.' : '운동 기록을 저장했습니다.');
      await refresh();
    } catch (error) { message(`${error.message} 종료하기를 다시 눌러 주세요.`, true); }
    finally { busy = false; renderSession(); }
  });
  refreshButton.addEventListener('click', () => { if (!busy) { message(); refresh(); } });
  window.addEventListener('storage', event => { if (event.key === SprintWorkout.STORAGE_KEY && !busy) refresh(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !busy) refresh(); });
  setInterval(() => {
    renderSession();
    if (renderedDay !== dateKey()) { renderedDay = dateKey(); if (!busy) refresh(); }
  }, 1000);
  setInterval(() => { if (!document.hidden && !busy) refresh(); }, 30000);
  renderSession(); refresh();
})();
