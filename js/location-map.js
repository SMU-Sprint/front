const DEFAULT_CENTER = { lat: 36.35, lng: 127.8 };
const DEFAULT_LEVEL = 13;
const MARKER_BATCH_SIZE = 800;

function setMapStatus(message, isError = false) {
  const status = document.getElementById("mapStatus");
  if (!status) return;

  status.textContent = message;
  status.classList.toggle("is-error", isError);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function createInfoContent(place) {
  const name = escapeHtml(place.name || "체육시설");
  const placeType = escapeHtml(place.type);
  const placeAddress = escapeHtml(place.address);
  const type = placeType ? `<span>${placeType}</span>` : "";
  const address = placeAddress ? `<p>${placeAddress}</p>` : "";

  return `
    <div class="place-info">
      <strong>${name}</strong>
      ${type}
      ${address}
    </div>
  `;
}

function getValidPlaces() {
  return (window.SPORT_FACILITIES || []).filter((place) => {
    const lat = Number(place.lat);
    const lng = Number(place.lng);

    return (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  });
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

function scheduleNextBatch(callback) {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(callback, { timeout: 120 });
    return;
  }

  window.setTimeout(callback, 0);
}

function renderKakaoMarkersInBatches({ map, clusterer, infoWindow, places }) {
  const { kakao } = window;
  const bounds = new kakao.maps.LatLngBounds();
  let index = 0;

  function renderBatch() {
    const batchEnd = Math.min(index + MARKER_BATCH_SIZE, places.length);
    const markers = [];

    for (; index < batchEnd; index += 1) {
      const place = places[index];
      const position = new kakao.maps.LatLng(
        Number(place.lat),
        Number(place.lng),
      );
      const marker = new kakao.maps.Marker({ position });

      bounds.extend(position);
      kakao.maps.event.addListener(marker, "click", () => {
        infoWindow.setContent(createInfoContent(place));
        infoWindow.open(map, marker);
      });
      markers.push(marker);
    }

    clusterer.addMarkers(markers);
    setMapStatus(
      `${index.toLocaleString("ko-KR")} / ${places.length.toLocaleString("ko-KR")}개 장소를 표시하는 중입니다.`,
    );

    if (index < places.length) {
      scheduleNextBatch(renderBatch);
      return;
    }

    map.setBounds(bounds);
    setMapStatus(
      `${places.length.toLocaleString("ko-KR")}개 장소가 등록되었습니다.`,
    );
  }

  renderBatch();
}

async function initKakaoMap() {
  const container = document.getElementById("kakaoMap");

  if (!container) return;

  const places = getValidPlaces();

  if (!places.length) {
    setMapStatus("좌표가 있는 장소가 없습니다.", true);
    return;
  }

  try {
    await waitForKakaoMaps();
  } catch (error) {
    console.error("Kakao Maps SDK unavailable.", error);
    setMapStatus(
      "카카오맵을 불러오지 못했습니다. Kakao Developers에서 현재 도메인을 등록해 주세요.",
      true,
    );
    return;
  }

  const { kakao } = window;
  const map = new kakao.maps.Map(container, {
    center: new kakao.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
    level: DEFAULT_LEVEL,
  });

  const clusterer = new kakao.maps.MarkerClusterer({
    map,
    averageCenter: true,
    minLevel: 8,
  });

  const infoWindow = new kakao.maps.InfoWindow({ removable: true });

  map.relayout();
  setMapStatus(
    `${places.length.toLocaleString("ko-KR")}개 장소를 준비하는 중입니다.`,
  );
  renderKakaoMarkersInBatches({
    map,
    clusterer,
    infoWindow,
    places,
  });
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", initKakaoMap, { once: true });
} else {
  initKakaoMap();
}
