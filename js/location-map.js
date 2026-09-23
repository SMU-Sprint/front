const INITIAL_RADIUS_METERS = 1000;
const MAX_API_RADIUS_KM = 20;
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
      reject(new Error("카카오맵 SDK를 불러오지 못했습니다."));
      return;
    }
    const timeoutId = window.setTimeout(
      () => reject(new Error("카카오맵 초기화 시간이 초과됐습니다.")),
      10000,
    );
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

function distanceKm(from, to) {
  const toRadians = (value) => (value * Math.PI) / 180;
  const lat1 = toRadians(from.getLat());
  const lat2 = toRadians(to.getLat());
  const deltaLat = lat2 - lat1;
  const deltaLng = toRadians(to.getLng() - from.getLng());
  const value =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function isInBounds(location, bounds) {
  const southWest = bounds.getSouthWest();
  const northEast = bounds.getNorthEast();
  return (
    location.latitude >= southWest.getLat() &&
    location.latitude <= northEast.getLat() &&
    location.longitude >= southWest.getLng() &&
    location.longitude <= northEast.getLng()
  );
}

function createFacilityMarker(facility) {
  const { kakao } = window;
  const marker = new kakao.maps.Marker({
    position: new kakao.maps.LatLng(
      facility.latitude,
      facility.longitude,
    ),
    title: facility.name,
  });
  kakao.maps.event.addListener(marker, "click", () => {
    sessionStorage.setItem(
      SprintWorkout.SELECTED_FACILITY_KEY,
      JSON.stringify(facility),
    );
    window.location.assign(
      `location_detail.html?locationId=${encodeURIComponent(facility.id)}`,
    );
  });
  return marker;
}

function connectFacilityApi(map, clusterer) {
  const { kakao } = window;
  const service = SprintWorkout.createService();
  let requestVersion = 0;
  let updateTimer;

  async function updateMarkers() {
    const version = ++requestVersion;
    const center = map.getCenter();
    const bounds = map.getBounds();
    const requestedRadiusKm = Math.max(
      0.1,
      distanceKm(center, bounds.getNorthEast()),
    );
    const radiusKm = Math.min(MAX_API_RADIUS_KM, requestedRadiusKm);
    setMapStatus("현재 화면의 체육시설을 불러오는 중입니다.");

    try {
      const facilities = await service.locations({
        latitude: center.getLat(),
        longitude: center.getLng(),
        radiusKm: Number(radiusKm.toFixed(2)),
      });
      if (version !== requestVersion) return;
      const visible = facilities
        .filter((facility) => isInBounds(facility, bounds))
        .slice(0, MAX_VISIBLE_MARKERS);
      clusterer.clear();
      clusterer.addMarkers(visible.map(createFacilityMarker));

      const radiusNotice =
        requestedRadiusKm > MAX_API_RADIUS_KM
          ? " API 조회 한도인 중심 반경 20km까지 표시합니다."
          : "";
      setMapStatus(
        visible.length
          ? `현재 화면에 ${visible.length.toLocaleString("ko-KR")}개 체육시설이 있습니다.${radiusNotice}`
          : `현재 화면에 조회된 체육시설이 없습니다.${radiusNotice}`,
      );
    } catch (error) {
      if (version !== requestVersion) return;
      clusterer.clear();
      setMapStatus(error.message || "체육시설을 불러오지 못했습니다.", true);
    }
  }

  function scheduleUpdate() {
    window.clearTimeout(updateTimer);
    updateTimer = window.setTimeout(updateMarkers, 180);
  }

  kakao.maps.event.addListener(map, "idle", scheduleUpdate);
  scheduleUpdate();
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
    setMapStatus("현재 위치를 불러오는 중입니다.");
    const [position] = await Promise.all([
      getCurrentPosition(),
      waitForKakaoMaps(),
    ]);
    const { kakao } = window;
    const center = new kakao.maps.LatLng(
      position.coords.latitude,
      position.coords.longitude,
    );
    const map = new kakao.maps.Map(container, { center, level: 5 });
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
    connectFacilityApi(map, clusterer);
  } catch (error) {
    console.error("Kakao map initialization failed.", error);
    setMapStatus(
      error?.code === 1
        ? "현재 위치를 표시하려면 브라우저의 위치 권한을 허용해 주세요."
        : error.message || "지도를 불러오지 못했습니다.",
      true,
    );
  }
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", initKakaoMap, { once: true });
} else {
  initKakaoMap();
}
