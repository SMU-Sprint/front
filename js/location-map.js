window.WorkoutMap = {
  render(locations, onSelect, selectedId) {
    const host = document.getElementById('workout-map');
    const list = document.getElementById('location-list');
    list.replaceChildren();
    for (const location of locations) {
      const button = document.createElement('button');
      button.type = 'button'; button.textContent = location.name;
      button.className = 'location-choice';
      button.setAttribute('aria-pressed', String(location.id === selectedId));
      button.addEventListener('click', () => onSelect(location));
      list.append(button);
    }
    if (!window.L) {
      host.textContent = '지도를 불러오지 못했습니다. 아래 목록에서 운동 장소를 선택해 주세요.';
      host.classList.add('map-unavailable'); return;
    }
    const coordinates = locations.filter(p => Number.isFinite(p.latitude) && Number.isFinite(p.longitude));
    const selected = coordinates.find(p => p.id === selectedId) || coordinates[0];
    const map = L.map(host).setView(selected ? [selected.latitude, selected.longitude] : [37.5665, 126.978], 14);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    coordinates.forEach(location => {
      const marker = L.marker([location.latitude, location.longitude], { title: location.name, alt: location.name }).addTo(map);
      const label = document.createElement('span'); label.textContent = location.name;
      marker.bindTooltip(label).on('click', () => onSelect(location));
    });
    if (!selectedId && coordinates.length > 1) map.fitBounds(coordinates.map(p => [p.latitude, p.longitude]), { padding: [40, 40] });
  }
};
if (document.body.dataset.workoutPage === 'locations') {
  (async () => {
    try {
      const locations = await WorkoutUI.service.locations();
      WorkoutMap.render(locations, location => {
        location && window.location.assign(`location_detail.html?locationId=${encodeURIComponent(location.id)}`);
      });
      if (!locations.length) WorkoutUI.message('등록된 운동 장소가 없습니다.');
    } catch (error) { WorkoutUI.message(error.message, true); }
  })();
}
