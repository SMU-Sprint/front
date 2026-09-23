const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createService, splitSession, dateKey, level, duration } = require('../js/workout-service.js');
const { calendarMonth } = require('../js/calendar.js');
function memory() {
  const data = new Map();
  return { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v), removeItem: k => data.delete(k) };
}
test('start persists, reload resumes, stop is idempotent and daily totals accumulate', async () => {
  let current = new Date(2026, 8, 16, 10).getTime(), id = 0;
  const options = { config: { mode: 'demo' }, storage: memory(), now: () => current, uuid: () => `id-${++id}` };
  const api = createService(options);
  const first = await api.start('demo-1', 'tennis');
  await assert.rejects(api.start('demo-1', 'walking'), /진행 중/);
  const reloaded = createService(options);
  assert.equal((await reloaded.overview('2026-09-01','2026-09-30')).activeSession.id, first.id);
  current += 1800 * 1000;
  assert.equal((await reloaded.stop(first.id)).durationSeconds, 1800);
  await reloaded.stop(first.id);
  const second = await api.start('demo-1', 'running');
  current += 600 * 1000; await api.stop(second.id);
  const overview = await api.overview('2026-09-01','2026-09-30');
  assert.equal(overview.activeSession, null);
  assert.deepEqual(overview.dailyTotals, [{ date: '2026-09-16', totalSeconds: 2400, level: 'main2' }]);
  assert.equal((await api.records('2026-09-16')).records.length, 2);
  assert.equal((await api.records('2026-09-15')).records.length, 0);
});
test('invalid location/sport cannot start; a failed save does not claim success', async () => {
  const storage = memory();
  const api = createService({ config: { mode: 'demo' }, storage, uuid: () => 'test' });
  await assert.rejects(api.start('missing','tennis'));
  await assert.rejects(api.start('demo-2','tennis'));
  const started = await api.start('demo-1','tennis');
  storage.setItem = () => { throw new Error('quota'); };
  await assert.rejects(api.stop(started.id), /quota/);
  assert.equal((await api.overview('2020-01-01','2030-01-01')).activeSession.id, started.id);
});
test('an arbitrary facility uses the default sports in demo mode', async () => {
  const api = createService({ config: { mode: 'demo' }, storage: memory(), uuid: () => 'imported-session' });
  const facility = { id: 'csv-place', name: '테스트 체육관', latitude: 37.5, longitude: 127 };
  const available = await api.sports(facility.id, facility);
  assert.ok(available.some(item => item.id === 'running'));
  const session = await api.start(facility.id, 'running', facility);
  assert.equal(session.locationName, facility.name);
  assert.equal(session.sportName, '달리기');
});
test('midnight/year crossover splits seconds by local calendar date without loss', () => {
  const records = splitSession({ startedAt: new Date(2026,11,31,23,50).toISOString(), endedAt: new Date(2027,0,1,0,20).toISOString() });
  assert.deepEqual(records.map(r => [r.date,r.durationSeconds]), [['2026-12-31',600],['2027-01-01',1200]]);
  assert.equal(dateKey(new Date(2026,0,1,0,1)), '2026-01-01');
});
test('color thresholds, long elapsed time and leap/year calendar boundaries', () => {
  assert.deepEqual([0,1,1800,1801,3600,3601,5400,5401,7199,7200].map(level), ['dark','main1','main1','main2','main2','main2','main2','main3','main3','main4']);
  assert.equal(duration(90061), '25:01:01');
  assert.equal(calendarMonth(2024,1).cells.filter(Boolean).length,29);
  assert.equal(calendarMonth(2025,1).cells.filter(Boolean).length,28);
  assert.equal(calendarMonth(2026,-1).year,2025);
  assert.equal(calendarMonth(2026,7).cells.length,42);
});
test('API heatmap and daily records use the Swagger response contract and bearer token', async () => {
  const storage = memory();
  storage.setItem('accessToken', 'token');
  const calls = [];
  const api = createService({
    config: { mode: 'api', apiBase: 'https://sprintkr.site/api/v1' },
    storage,
    now: () => new Date(2026, 8, 16, 12).getTime(),
    fetch: async (url, options) => {
      calls.push({ url, options });
      const result = url.includes('/heatmap')
        ? { days: [{ date: '2026-09-16', count: 2, level: 3 }] }
        : { date: '2026-09-16', totalDurationMinutes: 35, records: [{ exerciseName: '러닝', durationMinutes: 35 }] };
      return { ok: true, status: 200, json: async () => ({ isSuccess: true, result }) };
    },
  });
  const overview = await api.overview('2026-07-01', '2026-09-30');
  assert.deepEqual(overview.dailyTotals, [{ date: '2026-09-16', count: 2, level: 'main3' }]);
  const daily = await api.records('2026-09-16');
  assert.equal(daily.totalSeconds, 2100);
  assert.equal(daily.records[0].sportName, '러닝');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer token');
  assert.match(calls[0].url, /exercise-records\/heatmap\?endDate=2026-09-16/);
  assert.match(calls[1].url, /exercise-records\/daily\?date=2026-09-16/);
});
test('API mode keeps the live timer locally and submits a completed record on stop', async () => {
  const storage = memory();
  storage.setItem('accessToken', 'token');
  const calls = [];
  let current = new Date(2026, 8, 16, 10).getTime();
  const options = {
    config: { mode: 'api', apiBase: 'https://sprintkr.site/api/v1' },
    storage,
    now: () => current,
    uuid: () => 'local-session',
    fetch: async (url, request) => {
      calls.push({ url, request });
      return { ok: true, status: 200, json: async () => ({ isSuccess: true, result: { recordId: 7, exerciseDate: '2026-09-16', exerciseName: '러닝', durationMinutes: 2 } }) };
    },
  };
  const api = createService(options);
  const facility = { id: '10', name: '한강 운동장', type: '러닝' };
  const started = await api.start(facility.id, '러닝', facility);
  assert.equal(started.id, 'local-session');
  await assert.rejects(api.start(facility.id, '러닝', facility), /진행 중/);
  current += 61 * 1000;
  const stopped = await api.stop(started.id);
  assert.equal(stopped.recordId, 7);
  assert.equal(stopped.durationSeconds, 120);
  assert.equal(calls[0].url, 'https://sprintkr.site/api/v1/members/exercise-records');
  assert.deepEqual(JSON.parse(calls[0].request.body), { exerciseDate: '2026-09-16', exerciseName: '러닝', durationMinutes: 2 });
});
test('facility search maps the Swagger facility fields without CSV data', async () => {
  const storage = memory();
  storage.setItem('accessToken', 'token');
  const api = createService({
    config: { mode: 'api', apiBase: '/api/v1' },
    storage,
    fetch: async (url) => ({
      ok: true,
      status: 200,
      json: async () => ({ isSuccess: true, result: { facilities: [{ facilityId: 3, name: '체육관', type: '배드민턴', address: '서울', latitude: 37.5, longitude: 127, distanceKm: 0.4 }] } }),
    }),
  });
  const facilities = await api.locations({ latitude: 37.5, longitude: 127, radiusKm: 1 });
  assert.deepEqual(facilities[0], { id: '3', name: '체육관', type: '배드민턴', address: '서울', latitude: 37.5, longitude: 127, distanceKm: 0.4, openTime: undefined, closeTime: undefined });
});
