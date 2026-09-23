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
test('an imported facility uses the default sports in demo mode', async () => {
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
test('API mode uses server totals unchanged, includes credentials, and never falls back to demo', async () => {
  const calls = [];
  const response = { activeSession: null, lastSession: null, dailyTotals: [{date:'2026-09-16',totalSeconds:5,level:'main4'}] };
  const api = createService({ config: {mode:'api', apiBase:'/api'}, storage:memory(), fetch: async (url, options) => { calls.push({url,options}); return {ok:true,json:async()=>response}; } });
  assert.deepEqual(await api.overview('2026-09-01','2026-09-30'),response);
  assert.equal(calls[0].options.credentials,'include');
  assert.match(calls[0].url,/timezone=/);
  const failed = createService({ config:{mode:'api',apiBase:'/api'},storage:memory(),fetch:async()=>({ok:false,status:503}) });
  await assert.rejects(failed.locations(),/서버 요청/);
});
test('API start retry after timeout reuses the key and original payload across reloads', async () => {
  const storage = memory(), calls = []; let fail = true;
  const options = { config:{mode:'api',apiBase:'/api'},storage,uuid:()=> 'stable-key',fetch:async(url,opts)=> {
    calls.push(opts); if(fail) throw new Error('network'); return {ok:true,json:async()=>({session:{id:'server-id'}})};
  }};
  await assert.rejects(createService(options).start('real-place','real-sport'));
  await assert.rejects(createService(options).start('different-place','real-sport'), /이전 시작/);
  fail = false;
  assert.equal((await createService(options).start('real-place','real-sport')).id,'server-id');
  assert.equal(calls[0].headers['Idempotency-Key'],calls[1].headers['Idempotency-Key']);
  assert.equal(calls[0].body,calls[1].body);
});
test('overview recovers an accepted start after a lost response and clears pending retry', async () => {
  const storage = memory();
  storage.setItem('sprint.workouts.api.pendingStart', JSON.stringify({ key:'old',body:{locationId:'p',sportId:'s'} }));
  const api = createService({ config:{mode:'api',apiBase:'/api'},storage,fetch:async()=>({ok:true,json:async()=>({activeSession:{id:'id',locationId:'p',sportId:'s'},lastSession:null,dailyTotals:[]})}) });
  await api.overview('2026-09-01','2026-09-30');
  assert.equal(storage.getItem('sprint.workouts.api.pendingStart'),null);
});
