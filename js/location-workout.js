const FACILITIES_DATA_URL = '../data/facilities.json';

async function loadFacilities() {
  const response = await fetch(FACILITIES_DATA_URL);
  if (!response.ok) throw new Error('운동 장소 정보를 불러오지 못했습니다.');

  const facilities = await response.json();
  return facilities.map(facility => ({
      ...facility,
      latitude: Number(facility.lat),
      longitude: Number(facility.lng),
      imported: true,
    }))
    .filter(facility => Number.isFinite(facility.latitude) && Number.isFinite(facility.longitude));
}

(async () => {
  const { service, dateKey, message } = WorkoutUI;
  const trigger = document.getElementById('sport-trigger');
  const options = document.getElementById('sport-options');
  const start = document.getElementById('startBtn');
  const end = document.getElementById('endBtn');
  const locationName = document.getElementById('location-name');
  const locationMeta = document.getElementById('location-meta');
  let selectedLocation, selectedSport, activeSession, busy = false, requestVersion = 0;
  function render() {
    start.disabled = busy || !selectedSport || Boolean(activeSession);
    end.disabled = busy || !activeSession;
    trigger.disabled = busy || Boolean(activeSession) || !options.children.length;
  }
  function close() { options.hidden = true; trigger.setAttribute('aria-expanded', 'false'); }
  async function selectLocation(location) {
    if (busy || activeSession) { message('진행 중인 운동은 메인에서 확인하거나 종료해 주세요.'); return; }
    const version = ++requestVersion;
    selectedLocation = location; selectedSport = null; options.replaceChildren(); close();
    trigger.textContent = '운동 불러오는 중…';
    locationName.textContent = location.name;
    locationMeta.textContent = [location.type, location.address].filter(Boolean).join(' · ');
    const url = new URL(window.location.href); url.searchParams.set('locationId', location.id); history.replaceState(null, '', url);
    document.querySelectorAll('.location-choice').forEach(button => button.setAttribute('aria-pressed', String(button.textContent === location.name)));
    render();
    try {
      const sports = await service.sports(location.id, location);
      if (version !== requestVersion) return;
      for (const sport of sports) {
        const button = document.createElement('button'); button.type = 'button'; button.textContent = sport.name;
        button.setAttribute('role', 'option'); button.setAttribute('aria-selected', 'false');
        button.addEventListener('click', () => {
          selectedSport = sport; trigger.textContent = `${sport.name} ▾`;
          options.querySelectorAll('button').forEach(b => b.setAttribute('aria-selected', String(b === button)));
          close(); trigger.focus(); render();
        });
        options.append(button);
      }
      trigger.textContent = sports.length ? '운동 선택 ▾' : '가능한 운동 없음';
      message(sports.length ? '' : '이 장소에 등록된 운동이 없습니다.');
    } catch (error) {
      if (version !== requestVersion) return;
      trigger.textContent = '장소를 다시 선택'; message(error.message, true);
    } finally { if (version === requestVersion) render(); }
  }
  trigger.addEventListener('click', () => {
    options.hidden = !options.hidden; trigger.setAttribute('aria-expanded', String(!options.hidden));
    if (!options.hidden) options.querySelector('button')?.focus();
  });
  document.addEventListener('click', event => { if (!event.target.closest('.sport-picker')) close(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') { close(); trigger.focus(); }
    if (!options.hidden && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
      const items = [...options.querySelectorAll('button')];
      const index = items.indexOf(document.activeElement);
      items[(index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
    }
  });
  start.addEventListener('click', async () => {
    if (busy || !selectedSport || activeSession) return;
    busy = true; render(); message('운동을 시작하는 중입니다…');
    try { await service.start(selectedLocation.id, selectedSport.id, selectedLocation); window.location.assign('main.html'); }
    catch (error) { message(error.message, true); busy = false; render(); }
  });
  end.addEventListener('click', async () => {
    if (busy || !activeSession) return;
    busy = true; render(); message('운동 기록을 저장하는 중입니다…');
    try { await service.stop(activeSession.id); window.location.assign('main.html'); }
    catch (error) { message(error.message, true); busy = false; render(); }
  });
  async function syncActive() {
    if (busy) return;
    try {
      const overview = await service.overview(dateKey(), dateKey());
      if (busy) return;
      const previous = activeSession;
      activeSession = overview.activeSession;
      if (activeSession) {
        close();
        locationName.textContent = activeSession.locationName;
        locationMeta.textContent = '';
        trigger.textContent = activeSession.sportName;
      } else if (previous) {
        if (selectedLocation) await selectLocation(selectedLocation);
        else { trigger.textContent = '운동 선택 ▾'; message('지도 또는 목록에서 운동 장소를 선택해 주세요.'); }
      }
      render();
    } catch (error) { message(error.message, true); }
  }
  window.addEventListener('storage', event => { if (event.key === SprintWorkout.STORAGE_KEY) syncActive(); });
  window.addEventListener('pageshow', event => { if (event.persisted) syncActive(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) syncActive(); });
  try {
    const locationId = new URLSearchParams(window.location.search).get('locationId');
    if (!locationId) {
      window.location.replace('location.html');
      return;
    }

    const [facilities, overview] = await Promise.all([
      loadFacilities(),
      service.overview(dateKey(), dateKey()),
    ]);
    const selected = facilities.find(facility => facility.id === locationId);
    if (!selected) {
      window.location.replace('location.html');
      return;
    }

    await WorkoutMap.render(facilities, selectLocation, selected.id);
    activeSession = overview.activeSession;
    if (activeSession) {
      locationName.textContent = activeSession.locationName;
      locationMeta.textContent = '';
      trigger.textContent = activeSession.sportName;
      message('진행 중인 운동이 있습니다. 메인에서 시간을 확인할 수 있습니다.');
    } else if (selected) await selectLocation(selected);
    else message('지도 또는 목록에서 운동 장소를 선택해 주세요.');
  } catch (error) { message(error.message, true); }
  render();
})();
