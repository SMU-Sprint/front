(function (root) {
  'use strict';
  const STORAGE_KEY = 'sprint.workouts.demo.v1';
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
    const timezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
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
    async function request(path, method = 'GET', body, key) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetcher(`${config.apiBase.replace(/\/$/, '')}${path}`, {
          method, credentials: 'include', signal: controller.signal,
          headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(key ? { 'Idempotency-Key': key } : {}) },
          ...(body ? { body: JSON.stringify(body) } : {})
        });
        if (!response.ok) throw new Error(response.status === 401 ? '로그인이 필요합니다.' : '서버 요청에 실패했습니다. 다시 시도해 주세요.');
        return await response.json();
      } catch (error) {
        if (error.name === 'AbortError') throw new Error('서버 응답이 지연되고 있습니다. 다시 시도해 주세요.');
        throw error;
      } finally { clearTimeout(timer); }
    }
    return {
      demo,
      async locations() { return demo ? demoLocations.map(({ sports, ...location }) => location) : (await request('/locations')).locations; },
      async sports(locationId) {
        if (!demo) return (await request(`/locations/${encodeURIComponent(locationId)}/sports`)).sports;
        const location = demoLocations.find(item => item.id === locationId);
        if (!location) throw new Error('운동 장소를 다시 선택해 주세요.');
        return location.sports;
      },
      async overview(from, to) {
        if (!demo) {
          const data = await request(`/workouts/overview?${new URLSearchParams({ from, to, timezone: timezone() })}`);
          const pending = JSON.parse(storage.getItem('sprint.workouts.api.pendingStart') || 'null');
          if (pending && data.activeSession?.locationId === pending.body.locationId && data.activeSession?.sportId === pending.body.sportId) {
            storage.removeItem('sprint.workouts.api.pendingStart');
          }
          return data;
        }
        const state = read();
        const sums = new Map();
        state.sessions.flatMap(splitSession).filter(r => r.date >= from && r.date <= to).forEach(r => sums.set(r.date, (sums.get(r.date) || 0) + r.durationSeconds));
        return { activeSession: state.activeSession, lastSession: state.sessions.at(-1) || null,
          dailyTotals: [...sums].map(([date, totalSeconds]) => ({ date, totalSeconds, level: level(totalSeconds) })) };
      },
      async records(date) {
        if (!demo) return request(`/workouts?${new URLSearchParams({ date, timezone: timezone() })}`);
        const records = read().sessions.flatMap(splitSession).filter(r => r.date === date);
        return { date, records, totalSeconds: records.reduce((sum, r) => sum + r.durationSeconds, 0) };
      },
      async start(locationId, sportId) {
        if (!demo) {
          // Keep the same key and payload after a timeout, even after navigation/reload.
          const pendingKey = 'sprint.workouts.api.pendingStart';
          let pending = JSON.parse(storage.getItem(pendingKey) || 'null');
          if (pending && (pending.body.locationId !== locationId || pending.body.sportId !== sportId)) {
            throw new Error('이전 시작 요청의 결과 확인이 필요합니다. 이전에 선택한 장소·운동으로 다시 시도해 주세요.');
          }
          if (!pending) { pending = { key: uuid(), body: { locationId, sportId, timezone: timezone() } }; storage.setItem(pendingKey, JSON.stringify(pending)); }
          const data = await request('/workouts/start', 'POST', pending.body, pending.key);
          storage.removeItem(pendingKey);
          return data.session;
        }
        return mutate(() => {
          const state = read();
          if (state.activeSession) throw new Error('진행 중인 운동이 있습니다. 메인에서 먼저 종료해 주세요.');
          const location = demoLocations.find(item => item.id === locationId);
          const sport = location?.sports.find(item => item.id === sportId);
          if (!sport) throw new Error('이 장소에서 가능한 운동을 선택해 주세요.');
          const session = { id: uuid(), locationId, locationName: location.name, sportId, sportName: sport.name, startedAt: new Date(now()).toISOString() };
          state.activeSession = session; save(state); return session;
        });
      },
      async stop(sessionId) {
        if (!demo) {
          const data = await request(`/workouts/${encodeURIComponent(sessionId)}/stop`, 'POST', { timezone: timezone() }, `stop-${sessionId}`);
          storage.removeItem('sprint.workouts.api.pendingStart');
          return data.session;
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
  const api = { STORAGE_KEY, dateKey, duration, level, splitSession, createService };
  if (typeof module !== 'undefined') module.exports = api;
  else root.SprintWorkout = api;
})(typeof window === 'undefined' ? globalThis : window);
