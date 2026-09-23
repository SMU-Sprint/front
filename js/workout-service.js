(function (root) {
  'use strict';
  const STORAGE_KEY = 'sprint.workouts.demo.v1';
  const API_ACTIVE_KEY = 'sprint.workouts.api.active.v1';
  const API_LAST_KEY = 'sprint.workouts.api.last.v1';
  const API_RECORD_META_KEY = 'sprint.workouts.api.record-meta.v1';
  const SELECTED_FACILITY_KEY = 'sprint.facilities.selected.v1';
  const pad = value => String(value).padStart(2, '0');
  function dateKey(value = new Date()) {
    const d = new Date(value);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  function duration(seconds) {
    const n = Math.max(0, Math.floor(seconds));
    return `${pad(Math.floor(n / 3600))}:${pad(Math.floor(n / 60) % 60)}:${pad(n % 60)}`;
  }
  function level(seconds) {
    if (seconds <= 0) return 'dark';
    if (seconds <= 1800) return 'main1';
    if (seconds <= 5400) return 'main2';
    if (seconds < 7200) return 'main3';
    return 'main4';
  }
  // Used only by the local demo adapter. The API must return server-side totals.
  function splitSession(session) {
    const start = Date.parse(session.startedAt), end = Date.parse(session.endedAt);
    const result = [];
    for (let cursor = start; cursor < end;) {
      const next = new Date(cursor); next.setHours(24, 0, 0, 0);
      const until = Math.min(end, next.getTime());
      const seconds = Math.floor((until - start) / 1000) - Math.floor((cursor - start) / 1000);
      result.push({ ...session, date: dateKey(cursor), durationSeconds: seconds,
        segmentStartedAt: new Date(cursor).toISOString(), segmentEndedAt: new Date(until).toISOString() });
      cursor = until;
    }
    return result;
  }
  const sports = [
    { id: 'tennis', name: '테니스' }, { id: 'running', name: '달리기' },
    { id: 'walking', name: '걷기' }, { id: 'badminton', name: '배드민턴' },
    { id: 'basketball', name: '농구' }, { id: 'cycling', name: '자전거' }
  ];
  const demoLocations = [
    { id: 'demo-1', name: '샘플 운동장 A', latitude: 37.523, longitude: 126.932, sports },
    { id: 'demo-2', name: '샘플 운동장 B', latitude: 37.53, longitude: 126.944, sports: sports.slice(1, 4) }
  ];
  function createService(options = {}) {
    const config = options.config || root.SPRINT_CONFIG || { mode: 'demo' };
    const storage = options.storage || root.localStorage;
    const now = options.now || Date.now;
    const fetcher = options.fetch || root.fetch?.bind(root);
    const locks = options.locks || (root.document ? root.navigator?.locks : null);
    const uuid = options.uuid || (() => root.crypto.randomUUID());
    const demo = config.mode === 'demo';
    if (!demo && config.mode !== 'api') throw new Error('올바른 운동 API 모드를 설정해 주세요.');
    const read = () => {
      const data = storage.getItem(STORAGE_KEY);
      if (!data) return { activeSession: null, sessions: [] };
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed.sessions)) throw new Error('저장된 운동 기록을 읽을 수 없습니다.');
      return parsed;
    };
    const save = state => storage.setItem(STORAGE_KEY, JSON.stringify(state));
    const mutate = fn => locks ? locks.request('sprint-workouts', fn) : Promise.resolve().then(fn);
    const readJson = key => JSON.parse(storage.getItem(key) || 'null');
    const writeJson = (key, value) => {
      if (value === null) storage.removeItem(key);
      else storage.setItem(key, JSON.stringify(value));
    };
    async function request(path, method = 'GET', body) {
      const accessToken = storage.getItem('accessToken');
      if (!accessToken) throw new Error('로그인이 필요합니다. 다시 로그인해 주세요.');
      if (!fetcher) throw new Error('서버 요청 기능을 사용할 수 없습니다.');
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetcher(`${config.apiBase.replace(/\/$/, '')}${path}`, {
          method, credentials: 'include', signal: controller.signal,
          headers: {
            Authorization: `Bearer ${accessToken}`,
            ...(body ? { 'Content-Type': 'application/json' } : {})
          },
          ...(body ? { body: JSON.stringify(body) } : {})
        });
        const payload = await response.json();
        if (!response.ok || payload.isSuccess === false) {
          throw new Error(response.status === 401 ? '로그인이 필요합니다. 다시 로그인해 주세요.' : payload.message || '서버 요청에 실패했습니다. 다시 시도해 주세요.');
        }
        return Object.prototype.hasOwnProperty.call(payload, 'result') ? payload.result : payload;
      } catch (error) {
        if (error.name === 'AbortError') throw new Error('서버 응답이 지연되고 있습니다. 다시 시도해 주세요.');
        throw error;
      } finally { clearTimeout(timer); }
    }
    return {
      demo,
      async locations(options = {}) {
        if (demo) return demoLocations.map(({ sports, ...location }) => location);
        const { latitude, longitude, radiusKm = 3, exerciseName } = options;
        if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
          throw new Error('체육시설 조회에 현재 위치가 필요합니다.');
        }
        const query = new URLSearchParams({ latitude, longitude, radiusKm });
        if (exerciseName) query.set('exerciseName', exerciseName);
        const result = await request(`/facilities?${query}`);
        return result.facilities.map(facility => ({
          id: String(facility.facilityId),
          name: facility.name,
          type: facility.type,
          address: facility.address,
          latitude: facility.latitude,
          longitude: facility.longitude,
          distanceKm: facility.distanceKm,
          openTime: facility.openTime,
          closeTime: facility.closeTime,
        }));
      },
      async sports(locationId, locationOverride) {
        if (!demo) {
          const facilitySport = locationOverride?.type
            ? [{ id: locationOverride.type, name: locationOverride.type }]
            : [];
          return facilitySport.length ? facilitySport : sports;
        }
        const location = demoLocations.find(item => item.id === locationId);
        if (location) return location.sports;
        if (locationOverride?.id === locationId) return sports;
        throw new Error('운동 장소를 다시 선택해 주세요.');
      },
      async overview(from, to) {
        if (!demo) {
          const today = dateKey(now());
          const endDate = to && to < today ? to : today;
          const heatmap = await request(`/members/exercise-records/heatmap?${new URLSearchParams({ endDate })}`);
          const levels = ['dark', 'main1', 'main2', 'main3', 'main4'];
          return {
            activeSession: readJson(API_ACTIVE_KEY),
            lastSession: readJson(API_LAST_KEY),
            dailyTotals: heatmap.days
              .filter(day => !from || day.date >= from)
              .map(day => ({
                date: day.date,
                count: day.count,
                level: levels[day.level] || 'dark',
              })),
          };
        }
        const state = read();
        const sums = new Map();
        state.sessions.flatMap(splitSession).filter(r => r.date >= from && r.date <= to).forEach(r => sums.set(r.date, (sums.get(r.date) || 0) + r.durationSeconds));
        return { activeSession: state.activeSession, lastSession: state.sessions.at(-1) || null,
          dailyTotals: [...sums].map(([date, totalSeconds]) => ({ date, totalSeconds, level: level(totalSeconds) })) };
      },
      async records(date) {
        if (!demo) {
          const result = await request(`/members/exercise-records/daily?${new URLSearchParams({ date })}`);
          const metadata = (readJson(API_RECORD_META_KEY) || [])
            .filter(item => item.exerciseDate === result.date)
            .map(item => ({ ...item, used: false }));
          return {
            date: result.date,
            totalSeconds: result.totalDurationMinutes * 60,
            records: result.records.map((record, index) => {
              const matched = metadata.find(item =>
                !item.used &&
                item.exerciseName === record.exerciseName &&
                item.durationMinutes === record.durationMinutes
              );
              if (matched) matched.used = true;
              return {
                id: matched?.recordId || `${result.date}-${index}`,
                locationName: matched?.locationName || '',
                sportName: record.exerciseName,
                startedAt: matched?.startedAt,
                endedAt: matched?.endedAt,
                durationSeconds: record.durationMinutes * 60,
              };
            }),
          };
        }
        const records = read().sessions.flatMap(splitSession).filter(r => r.date === date);
        return { date, records, totalSeconds: records.reduce((sum, r) => sum + r.durationSeconds, 0) };
      },
      async start(locationId, sportId, locationOverride) {
        if (!demo) {
          if (!storage.getItem('accessToken')) throw new Error('로그인이 필요합니다. 다시 로그인해 주세요.');
          if (readJson(API_ACTIVE_KEY)) throw new Error('진행 중인 운동이 있습니다. 메인에서 먼저 종료해 주세요.');
          const availableSports = await this.sports(locationId, locationOverride);
          const sport = availableSports.find(item => item.id === sportId);
          if (!locationOverride || !sport) throw new Error('운동 장소와 종목을 다시 선택해 주세요.');
          const session = {
            id: uuid(),
            locationId,
            locationName: locationOverride.name,
            sportId,
            sportName: sport.name,
            startedAt: new Date(now()).toISOString(),
          };
          writeJson(API_ACTIVE_KEY, session);
          return session;
        }
        return mutate(() => {
          const state = read();
          if (state.activeSession) throw new Error('진행 중인 운동이 있습니다. 메인에서 먼저 종료해 주세요.');
          const location = demoLocations.find(item => item.id === locationId)
            || (locationOverride?.id === locationId ? locationOverride : null);
          const sport = location
            ? (location.sports || sports).find(item => item.id === sportId)
            : null;
          if (!sport) throw new Error('이 장소에서 가능한 운동을 선택해 주세요.');
          const session = { id: uuid(), locationId, locationName: location.name, sportId, sportName: sport.name, startedAt: new Date(now()).toISOString() };
          state.activeSession = session; save(state); return session;
        });
      },
      async stop(sessionId) {
        if (!demo) {
          const active = readJson(API_ACTIVE_KEY);
          if (!active || active.id !== sessionId) throw new Error('진행 중인 운동을 다시 확인해 주세요.');
          const endedAt = new Date(Math.max(now(), Date.parse(active.startedAt))).toISOString();
          const elapsedSeconds = Math.floor((Date.parse(endedAt) - Date.parse(active.startedAt)) / 1000);
          const durationMinutes = Math.min(1440, Math.max(1, Math.ceil(elapsedSeconds / 60)));
          const created = await request('/members/exercise-records', 'POST', {
            exerciseDate: dateKey(active.startedAt),
            exerciseName: active.sportName,
            durationMinutes,
          });
          const session = {
            ...active,
            recordId: created.recordId,
            endedAt,
            durationSeconds: created.durationMinutes * 60,
          };
          writeJson(API_ACTIVE_KEY, null);
          writeJson(API_LAST_KEY, session);
          const metadata = readJson(API_RECORD_META_KEY) || [];
          metadata.push({
            recordId: created.recordId,
            exerciseDate: created.exerciseDate,
            exerciseName: created.exerciseName,
            durationMinutes: created.durationMinutes,
            locationName: active.locationName,
            startedAt: active.startedAt,
            endedAt,
          });
          writeJson(API_RECORD_META_KEY, metadata.slice(-500));
          return session;
        }
        return mutate(() => {
          const state = read();
          const existing = state.sessions.find(item => item.id === sessionId);
          if (existing) return existing;
          if (state.activeSession?.id !== sessionId) throw new Error('진행 중인 운동을 다시 확인해 주세요.');
          const session = { ...state.activeSession, endedAt: new Date(Math.max(now(), Date.parse(state.activeSession.startedAt))).toISOString() };
          session.durationSeconds = Math.floor((Date.parse(session.endedAt) - Date.parse(session.startedAt)) / 1000);
          state.sessions.push(session); state.activeSession = null;
          save(state); return session;
        });
      }
    };
  }
  const api = { STORAGE_KEY, API_ACTIVE_KEY, API_LAST_KEY, API_RECORD_META_KEY, SELECTED_FACILITY_KEY, dateKey, duration, level, splitSession, createService };
  if (typeof module !== 'undefined') module.exports = api;
  else root.SprintWorkout = api;
})(typeof window === 'undefined' ? globalThis : window);
