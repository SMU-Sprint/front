const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function memory(values = {}) {
  const data = new Map(Object.entries(values));
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  };
}

function loadSurvey4(values) {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "js", "survey4.js"),
    "utf8",
  );
  const nextBtn = {
    addEventListener() {},
    classList: { add() {}, remove() {} },
    hasAttribute() { return false; },
    removeAttribute() {},
    setAttribute() {},
  };
  const context = {
    console,
    sessionStorage: memory(values),
    localStorage: memory({ accessToken: "token" }),
    document: {
      addEventListener() {},
      getElementById: () => nextBtn,
      querySelectorAll: () => [],
    },
    window: { confirm: () => true, location: { href: "" } },
  };
  vm.createContext(context);
  vm.runInContext(
    `${source}\nthis.payload = buildSurveyPayload(); this.validate = validateSurveyPayload;`,
    context,
  );
  return context;
}

const validStorage = {
  survey_purpose: "체력증진",
  survey_experienceFlag: "true",
  survey_constraintTypes: JSON.stringify(["시간부족", "부상이나통증"]),
  survey_occupationType: "활동",
  survey_exerciseSpot: "산책로",
  survey_preferredSport: "수영",
  survey_vigorousDays: "2",
  survey_moderateDays: "4",
  survey_walkingDays: "5",
  survey_fatigueFlag: "false",
  survey_stairClimbFlag: "true",
  survey_walk300mFlag: "true",
  survey_weightLossFlag: "false",
};

test("survey payload matches the Swagger scalar and array field types", () => {
  const { payload, validate } = loadSurvey4(validStorage);
  assert.equal(payload.exercisePurpose, "체력증진");
  assert.equal(payload.preferredSport, "수영");
  assert.deepEqual(
    Array.from(payload.constraintTypes),
    ["시간부족", "부상이나통증"],
  );
  assert.equal(payload.occupationType, "활동");
  assert.equal(payload.exerciseSpot, "산책로");
  assert.doesNotThrow(() => validate(payload));
});

test("only constraintTypes accepts multiple answers", () => {
  const { payload } = loadSurvey4({
    ...validStorage,
    survey_purpose: JSON.stringify(["다이어트", "체력증진"]),
    survey_preferredSport: JSON.stringify(["수영", "테니스"]),
  });
  assert.equal(payload.exercisePurpose, "다이어트");
  assert.equal(payload.preferredSport, "수영");
  assert.equal(Array.isArray(payload.exercisePurpose), false);
  assert.equal(Array.isArray(payload.preferredSport), false);
  assert.equal(Array.isArray(payload.constraintTypes), true);
});

test("invalid enum values are rejected before calling the API", () => {
  const { payload, validate } = loadSurvey4({
    ...validStorage,
    survey_purpose: "체력측정",
  });
  assert.throws(() => validate(payload), /운동 목적/);
});

test("details are required when 기타 is selected", () => {
  const { payload, validate } = loadSurvey4({
    ...validStorage,
    survey_exerciseSpot: "기타",
    survey_exerciseSpotEtc: "",
  });
  assert.throws(() => validate(payload), /기타 운동 장소/);
});

test("recommendation response from Swagger is normalized for survey5", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "js", "survey5.js"),
    "utf8",
  );
  const context = {
    console,
    localStorage: memory(),
    sessionStorage: memory(),
    document: {
      addEventListener() {},
      getElementById() { return null; },
    },
    window: { location: { href: "" } },
  };
  vm.createContext(context);
  vm.runInContext(
    `${source}\nthis.normalized = normalizeRecommendations({ result: { recommendations: [{ rank: 1, exerciseName: "수영", reason: "관절 부담이 적음", improvements: "심폐지구력 향상" }] } }); this.box = { innerHTML: "" }; renderRecommendations(this.box, this.normalized);`,
    context,
  );

  assert.deepEqual(JSON.parse(JSON.stringify(context.normalized)), [
    {
      rank: 1,
      exerciseName: "수영",
      reason: "관절 부담이 적음",
      improvements: "심폐지구력 향상",
    },
  ]);
  assert.match(context.box.innerHTML, /1\. 수영/);
  assert.match(context.box.innerHTML, /추천 이유:<\/strong> 관절 부담이 적음/);
  assert.match(context.box.innerHTML, /기대 효과:<\/strong> 심폐지구력 향상/);
});
