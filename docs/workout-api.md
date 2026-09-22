# 운동 기록 프론트 연동 계약

현재 기본값은 `js/workout-config.js`의 `mode: 'demo'`입니다. 샘플 장소와 종목을 사용하고, `localStorage`에 이 브라우저의 운동 기록을 보관합니다. 실제 사용자 계정·서버 업로드와 연결되어 있지 않습니다. demo 데이터를 운영 데이터로 자동 업로드하지 않습니다.

백엔드 구현 후 `mode: 'api', apiBase: '/api'`로 변경합니다. 아래 경로·응답은 이번 프론트에서 제안한 계약입니다. 기존 서버 계약이 생기면 `workout-service.js`의 API 어댑터에서 맞춰 주세요. Live Server 등 HTTP 서버로 pages/location.html을 열어 사용합니다.

## 흐름과 서버 책임

1. `GET /locations`로 지도 마커 목록을 받습니다. 마커를 클릭하면 locationId를 가지고 상세 페이지로 이동합니다.
2. `GET /locations/{locationId}/sports`로 해당 장소의 종목을 받습니다. 종목 버튼은 최대 높이를 넘으면 스크롤됩니다.
3. 시작 요청이 성공한 뒤 main으로 이동합니다. 서버의 startedAt을 기준으로 경과시간을 표시합니다. 새로고침 시 진행 중인 운동을 서버에서 다시 조회합니다.
4. 종료 요청이 성공해야 타이머를 정지하고 기록을 다시 조회합니다. 실패 시 성공 표시를 하지 않고 재시도 버튼을 유지합니다.
5. 날짜별 합계와 색상 단계는 **서버에서 계산**합니다. API 모드 프론트는 dailyTotals와 기록 조회의 totalSeconds를 그대로 표시합니다.

서버는 사용자 인증·소유권 확인, 장소별 가능한 종목 검증, 사용자당 진행 중인 운동 1개 제한, 서버 시각 기준 시작·종료 계산을 처리해야 합니다. 시작/종료 요청의 `Idempotency-Key`를 사용자 범위로 저장하고 중복 요청에는 기존 결과를 반환해야 합니다. 종료 저장·세션 종료·합계 변경은 하나의 트랜잭션으로 처리합니다.

프론트는 `credentials: 'include'`로 요청합니다. 동일 출처 세션 쿠키 인증을 기본 가정하며 서버에서 쿠키 보안, Origin/CSRF 검증을 구현해야 합니다. 다른 출처라면 명시적 Origin과 credentials를 허용하는 CORS가 필요합니다. 토큰 방식으로 확정되면 공통 request()에 기존 인증 방식을 연결합니다. 비밀키는 프론트 설정에 넣지 않습니다.

날짜는 컴퓨터의 현지 날짜·요일이며, API에 IANA timezone(예: Asia/Seoul)을 전달합니다. ISO 시간은 UTC 오프셋 또는 Z를 포함해야 합니다. 서버는 이 timezone 기준으로 자정을 넘는 운동을 날짜별 구간으로 분리하여 합산합니다. 동일 workout id가 여러 날짜의 기록에 나타날 수 있습니다. 시작·종료 시각을 클라이언트 입력으로 신뢰하면 안 됩니다.

## 엔드포인트

아래 경로 앞에는 apiBase가 붙습니다. 성공 응답은 JSON(200 또는 201), 오류 응답은 적절한 4xx/5xx를 사용합니다. 저장 요청은 JSON 본문과 Idempotency-Key 헤더를 받습니다.

### GET /locations

```json
{"locations":[{"id":"place-1","name":"운동장 이름","latitude":37.523,"longitude":126.932}]}
```

실제 위치와 가능한 종목은 서버 데이터로 제공해야 합니다. 체험 모드의 샘플 명칭·좌표·종목은 운영 정보가 아닙니다. 지도는 [Leaflet 1.9.4](https://leafletjs.com/examples/quick-start/)와 OpenStreetMap 타일을 사용하며 지도 로드 실패 시 장소 목록으로 선택할 수 있습니다. 운영 트래픽에 맞는 타일 제공자 선정이 필요합니다.

### GET /locations/{locationId}/sports

```json
{"sports":[{"id":"tennis","name":"테니스"},{"id":"running","name":"달리기"}]}
```

빈 배열이면 시작 버튼을 비활성화합니다. id는 문자열입니다.

### POST /workouts/start

본문: `{"locationId":"place-1","sportId":"tennis","timezone":"Asia/Seoul"}`

응답:

```json
{"session":{"id":"workout-1","locationId":"place-1","locationName":"운동장 이름","sportId":"tennis","sportName":"테니스","startedAt":"2026-09-16T10:00:00.000Z"}}
```

요청 타임아웃 후에도 프론트는 같은 키와 본문으로 재시도합니다. 다른 탭에서도 서버가 중복 시작을 막아야 합니다. 다른 요청 키로 이미 진행 중인 운동이 있다면 409를 반환합니다.

### POST /workouts/{workoutId}/stop

본문: `{"timezone":"Asia/Seoul"}`

응답: 위 session 객체에 `endedAt`과 정수 `durationSeconds`를 추가합니다. 같은 운동을 여러 번 종료해도 기록이 중복 생성되면 안 됩니다.

### GET /workouts/overview?from=2026-07-01&to=2026-09-30&timezone=Asia%2FSeoul

```json
{
  "activeSession": null,
  "lastSession": {"id":"workout-1","locationId":"place-1","locationName":"운동장 이름","sportId":"tennis","sportName":"테니스","startedAt":"2026-09-16T10:00:00.000Z","endedAt":"2026-09-16T10:35:00.000Z","durationSeconds":2100},
  "dailyTotals": [{"date":"2026-09-16","totalSeconds":2100,"level":"main2"}]
}
```

진행 중일 때 activeSession은 시작 응답의 session과 같습니다. 기록이 없으면 lastSession은 null, dailyTotals는 빈 배열입니다. 완료된 운동만 합산합니다. 동일 날짜는 한 행으로 반환합니다. 날짜별 조회 범위 양끝은 포함합니다. 프론트는 30초마다/화면 복귀 시/종료 직후에 갱신합니다.

### GET /workouts?date=2026-09-16&timezone=Asia%2FSeoul

```json
{
  "date":"2026-09-16",
  "totalSeconds":2100,
  "records":[{"id":"workout-1","locationName":"운동장 이름","sportName":"테니스","startedAt":"2026-09-16T10:00:00.000Z","endedAt":"2026-09-16T10:35:00.000Z","segmentStartedAt":"2026-09-16T10:00:00.000Z","segmentEndedAt":"2026-09-16T10:35:00.000Z","durationSeconds":2100}]
}
```

자정 경계를 넘는 경우 segmentStartedAt/segmentEndedAt과 durationSeconds는 요청 날짜에 해당하는 부분입니다. 전체 세션의 시작·종료는 startedAt/endedAt에 보존합니다. 하루 총합은 서버가 반환한 totalSeconds를 표시합니다.

## 합계 색상 경계

사용자 요청에서 main2가 두 번 사용되어 두 구간을 동일 색상으로 유지했습니다. 겹치는 경계는 아래처럼 정의했습니다.

| 합계(초) | 색상 |
| --- | --- |
| 0 | dark |
| 1–1800 (30분까지) | main1 |
| 1801–3600 (1시간까지) | main2 |
| 3601–5400 (1시간반까지) | main2 |
| 5401–7199 (2시간 미만) | main3 |
| 7200 이상 | main4 |

체험 어댑터에서만 로컬 합계/색상을 계산합니다. API 어댑터는 로컬 저장으로 자동 전환하지 않으며, 요청 실패는 화면에 표시합니다.
