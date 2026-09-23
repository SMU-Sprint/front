const FACILITIES_DATA_URL = "../data/facilities.json";
const INITIAL_RADIUS_METERS = 1000;
const MAX_VISIBLE_MARKERS = 1500;

function setMapStatus(message, isError = false) {
  const status = document.getElementById("mapStatus");
  if (!status) return;

  status.textContent = message;
  status.classList.toggle("is-error", isError);
}

function waitForKakaoMaps() {
  return new Promise((resolve, reject) => {
    if (!window.kakao?.maps) {
      reject(new Error("Kakao Maps SDK was not loaded."));
      return;
    }

    const timeoutId = window.setTimeout(() => {
      reject(new Error("Kakao Maps SDK initialization timed out."));
    }, 10000);

    window.kakao.maps.load(() => {
      window.clearTimeout(timeoutId);
      resolve();
    });
  });
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("이 브라우저에서는 위치 정보를 사용할 수 없습니다."));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 60000,
    });
  });
}

async function loadFacilities() {
  const response = await fetch(FACILITIES_DATA_URL);
  if (!response.ok) {
    throw new Error(`시설 데이터를 불러오지 못했습니다: ${response.status}`);
  }

  const facilities = await response.json();
  if (!Array.isArray(facilities)) {
    throw new Error("시설 데이터 형식이 올바르지 않습니다.");
  }

  return facilities;
}

function getFacilitiesInBounds(facilities, bounds, center) {
  const southWest = bounds.getSouthWest();
  const northEast = bounds.getNorthEast();
  const south = southWest.getLat();
  const west = southWest.getLng();
  const north = northEast.getLat();
  const east = northEast.getLng();
  const centerLat = center.getLat();
  const centerLng = center.getLng();
  const visible = facilities.filter(
    (facility) =>
      facility.lat >= south &&
      facility.lat <= north &&
      facility.lng >= west &&
      facility.lng <= east,
  );

  if (visible.length <= MAX_VISIBLE_MARKERS) {
    return { total: visible.length, facilities: visible };
  }

  const nearestFacilities = visible
    .map((facility) => ({
      facility,
      centerDistance:
        (facility.lat - centerLat) ** 2 + (facility.lng - centerLng) ** 2,
    }))
    .sort((a, b) => a.centerDistance - b.centerDistance)
    .slice(0, MAX_VISIBLE_MARKERS)
    .map(({ facility }) => facility);

  return { total: visible.length, facilities: nearestFacilities };
}

function createFacilityMarker(map, facility) {
  const { kakao } = window;
  const marker = new kakao.maps.Marker({
    position: new kakao.maps.LatLng(facility.lat, facility.lng),
    title: facility.name,
  });

  kakao.maps.event.addListener(marker, "click", () => {
    const locationId = encodeURIComponent(facility.id);
    window.location.assign(`location_detail.html?locationId=${locationId}`);
  });

  return marker;
}

function connectVisibleMarkers(map, clusterer, facilities) {
  const { kakao } = window;

  function updateMarkers() {
    const visible = getFacilitiesInBounds(
      facilities,
      map.getBounds(),
      map.getCenter(),
    );
    const markers = visible.facilities.map((facility) =>
      createFacilityMarker(map, facility),
    );

    clusterer.clear();
    clusterer.addMarkers(markers);

    if (visible.total > MAX_VISIBLE_MARKERS) {
      setMapStatus(
        `현재 화면의 ${visible.total.toLocaleString("ko-KR")}개 시설 중 중심과 가까운 ${MAX_VISIBLE_MARKERS.toLocaleString("ko-KR")}개를 표시합니다. 지도를 확대하면 더 정확히 볼 수 있습니다.`,
      );
      return;
    }

    setMapStatus(
      visible.facilities.length
        ? `현재 화면에 ${visible.facilities.length.toLocaleString("ko-KR")}개 체육시설이 있습니다.`
        : "현재 화면에 등록된 체육시설이 없습니다. 지도를 이동해 보세요.",
    );
  }

  kakao.maps.event.addListener(map, "idle", updateMarkers);
  updateMarkers();
}

function renderCurrentLocation(map, center) {
  const { kakao } = window;
  const circle = new kakao.maps.Circle({
    map,
    center,
    radius: INITIAL_RADIUS_METERS,
    strokeWeight: 2,
    strokeColor: "#1478ff",
    strokeOpacity: 0.75,
    strokeStyle: "dashed",
    fillColor: "#7ab5ff",
    fillOpacity: 0.1,
  });

  new kakao.maps.CustomOverlay({
    map,
    position: center,
    content: '<div class="user-location-marker" title="현재 위치"></div>',
    xAnchor: 0.5,
    yAnchor: 0.5,
    zIndex: 5,
  });

  map.setBounds(circle.getBounds(), 40, 40, 40, 40);
}

async function initKakaoMap() {
  const container = document.getElementById("kakaoMap");
  if (!container) return;

  try {
    setMapStatus("현재 위치와 체육시설 데이터를 불러오는 중입니다.");
    const [position, facilities] = await Promise.all([
      getCurrentPosition(),
      loadFacilities(),
      waitForKakaoMaps(),
    ]);
    const { kakao } = window;
    const center = new kakao.maps.LatLng(
      position.coords.latitude,
      position.coords.longitude,
    );
    const map = new kakao.maps.Map(container, {
      center,
      level: 5,
    });
    const clusterer = new kakao.maps.MarkerClusterer({
      map,
      averageCenter: true,
      minLevel: 5,
    });

    map.addControl(
      new kakao.maps.ZoomControl(),
      kakao.maps.ControlPosition.RIGHT,
    );
    map.relayout();
    renderCurrentLocation(map, center);
    connectVisibleMarkers(map, clusterer, facilities);
  } catch (error) {
    console.error("Kakao map initialization failed.", error);
    const isPermissionError = error?.code === 1;
    setMapStatus(
      isPermissionError
        ? "현재 위치를 표시하려면 브라우저의 위치 권한을 허용해 주세요."
        : "지도를 불러오지 못했습니다. 위치 권한과 데이터 연결을 확인해 주세요.",
      true,
    );
  }
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", initKakaoMap, { once: true });
} else {
  initKakaoMap();
}
