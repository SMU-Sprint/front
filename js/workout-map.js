(function initializeWorkoutMap(root) {
  "use strict";

  const MAX_VISIBLE_MARKERS = 1500;
  const MAX_LIST_ITEMS = 40;

  function waitForKakaoMaps() {
    return new Promise((resolve, reject) => {
      if (!root.kakao?.maps) {
        reject(new Error("카카오맵 SDK를 불러오지 못했습니다."));
        return;
      }

      const timeoutId = root.setTimeout(() => {
        reject(new Error("카카오맵 초기화 시간이 초과됐습니다."));
      }, 10000);

      root.kakao.maps.load(() => {
        root.clearTimeout(timeoutId);
        resolve();
      });
    });
  }

  function normalizeLocation(location) {
    const latitude = Number(location.latitude ?? location.lat);
    const longitude = Number(location.longitude ?? location.lng);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { ...location, latitude, longitude };
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function createInfoContent(location) {
    const type = location.type
      ? `<span style="display:block;margin-top:4px;color:#52655b">${escapeHtml(location.type)}</span>`
      : "";
    const address = location.address
      ? `<p style="margin:6px 0 0;max-width:240px;color:#64716a;line-height:1.4">${escapeHtml(location.address)}</p>`
      : "";

    return `<div style="padding:10px 12px;min-width:160px"><strong>${escapeHtml(location.name)}</strong>${type}${address}</div>`;
  }

  function getVisibleLocations(locations, bounds, center) {
    const southWest = bounds.getSouthWest();
    const northEast = bounds.getNorthEast();
    const centerLat = center.getLat();
    const centerLng = center.getLng();
    const visible = locations
      .filter(
        (location) =>
          location.latitude >= southWest.getLat() &&
          location.latitude <= northEast.getLat() &&
          location.longitude >= southWest.getLng() &&
          location.longitude <= northEast.getLng(),
      )
      .map((location) => ({
        location,
        distance:
          (location.latitude - centerLat) ** 2 +
          (location.longitude - centerLng) ** 2,
      }))
      .sort((a, b) => a.distance - b.distance);

    return {
      total: visible.length,
      locations: visible
        .slice(0, MAX_VISIBLE_MARKERS)
        .map(({ location }) => location),
    };
  }

  async function render(locations, onSelect, selectedId) {
    const container = document.getElementById("workout-map");
    const list = document.getElementById("location-list");
    if (!container || !list) return;

    await waitForKakaoMaps();

    const validLocations = locations.map(normalizeLocation).filter(Boolean);
    if (!validLocations.length) {
      container.classList.add("map-unavailable");
      container.textContent = "지도에 표시할 운동 장소가 없습니다.";
      list.replaceChildren();
      return;
    }

    const { kakao } = root;
    const first =
      validLocations.find((location) => location.id === selectedId) ||
      validLocations[0];
    const map = new kakao.maps.Map(container, {
      center: new kakao.maps.LatLng(first.latitude, first.longitude),
      level: 4,
    });
    const clusterer = new kakao.maps.MarkerClusterer({
      map,
      averageCenter: true,
      minLevel: 5,
    });
    const infoWindow = new kakao.maps.InfoWindow({ removable: true });
    const controls = new Map();
    let selectedLocationId = first.id;
    let ignoreNextMapClick = false;

    map.addControl(
      new kakao.maps.ZoomControl(),
      kakao.maps.ControlPosition.RIGHT,
    );

    function markSelected(location) {
      controls.forEach((button, id) => {
        button.setAttribute("aria-pressed", String(id === location.id));
      });
    }

    function select(location, marker, position) {
      ignoreNextMapClick = true;
      root.setTimeout(() => {
        ignoreNextMapClick = false;
      }, 50);
      selectedLocationId = location.id;
      markSelected(location);
      infoWindow.setContent(createInfoContent(location));
      infoWindow.open(map, marker);
      map.panTo(position);
      onSelect(location);
    }

    function renderVisibleLocations() {
      const visible = getVisibleLocations(
        validLocations,
        map.getBounds(),
        map.getCenter(),
      );
      const markers = [];
      let selectedMarker = null;

      controls.clear();
      list.replaceChildren();

      visible.locations.forEach((location, index) => {
        const position = new kakao.maps.LatLng(
          location.latitude,
          location.longitude,
        );
        const marker = new kakao.maps.Marker({
          position,
          title: location.name,
        });

        kakao.maps.event.addListener(marker, "click", () => {
          select(location, marker, position);
        });
        markers.push(marker);

        if (location.id === selectedLocationId) selectedMarker = marker;
        if (index >= MAX_LIST_ITEMS) return;

        const button = document.createElement("button");
        button.type = "button";
        button.className = "location-choice";
        button.textContent = location.name;
        button.setAttribute(
          "aria-pressed",
          String(location.id === selectedLocationId),
        );
        button.addEventListener("click", () => {
          select(location, marker, position);
        });
        controls.set(location.id, button);
        list.append(button);
      });

      clusterer.clear();
      clusterer.addMarkers(markers);

      if (selectedMarker) {
        const selectedLocation = visible.locations.find(
          (location) => location.id === selectedLocationId,
        );
        infoWindow.setContent(createInfoContent(selectedLocation));
        infoWindow.open(map, selectedMarker);
      }
      list.setAttribute(
        "aria-label",
        `현재 화면의 운동 장소 ${visible.total.toLocaleString("ko-KR")}개`,
      );
    }

    kakao.maps.event.addListener(map, "click", () => {
      if (ignoreNextMapClick) return;
      root.location.assign("location.html");
    });
    kakao.maps.event.addListener(map, "idle", renderVisibleLocations);

    map.relayout();
    map.setCenter(new kakao.maps.LatLng(first.latitude, first.longitude));
    renderVisibleLocations();
  }

  root.WorkoutMap = { render };
})(window);
