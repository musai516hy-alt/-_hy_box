/**
 * 언약교회 구역모임 앱 - 매일 성경 읽기 & 카카오톡 메시지 원클릭 생성기 통합 모듈
 * - 4구역 모드: 하루 3장 순차 통독 (기본: 열왕기상)
 * - 원미 여성성경 모드: 구약 3장 + 로마서 2장 더블트랙
 * - 카카오톡 나눔 메시지 원터치 복사 및 식구별 완독 체크보드
 */

// 모드 상수
const DAILY_MODE_DISTRICT4 = 'district4';
const DAILY_MODE_WOMEN = 'women';

// 로컬 스토리지 키 (v3: 10월 1일 로마서 3장 시작 동기화)
const DAILY_CONFIG_KEY = 'covenant_daily_bible_config_v3';
const DAILY_CHECKLIST_KEY = 'covenant_daily_checklist_v2';

// 기본 환경 설정
const DEFAULT_DAILY_CONFIG = {
  currentMode: DAILY_MODE_DISTRICT4, // 'district4' 또는 'women'
  // 4구역 모드 설정
  district4: {
    title: "언약교회 4구역 매일 성경 읽기",
    anchorDate: "2026-09-28", // 기준일 (월): 열왕기상 10장~12장 -> 내일(29일 화)은 13장~15장
    anchorBookId: 11, // 열왕기상
    anchorChapter: 10,
    dailyChapters: 3,
    templateStyle: "grace" // 'grace', 'simple', 'warm'
  },
  // 언약성도 모드 설정
  women: {
    title: "언약성도 매일 성경 읽기",
    track1AnchorDate: "2026-09-28",
    track1BookId: 23, // 이사야
    track1Chapter: 14,
    track1Count: 3,
    track2AnchorDate: "2026-10-01", // 내일(10월 1일 목)부터 로마서 3장 시작
    track2Chapter: 3, // 로마서 3장 (3장~4장)
    track2Count: 2,
    templateStyle: "grace"
  }
};

let dailyConfig = null;
let selectedDailyDate = new Date();
let dailyChecklists = {};
let currentKakaoMessageText = "";
let dailyShuffleOffset = 0;

/**
 * 매일성경 모듈 초기화
 */
function initDailyBibleModule() {
  loadDailyConfig();
  loadDailyChecklists();

  selectedDailyDate = new Date();

  // URL 파라미터 지원 (예: ?view=tomorrow)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("view") === "tomorrow") {
    selectedDailyDate.setDate(selectedDailyDate.getDate() + 1);
  } else if (urlParams.get("date")) {
    const d = new Date(urlParams.get("date"));
    if (!isNaN(d.getTime())) selectedDailyDate = d;
  }

  updateDailyDateDisplay();
  renderDailyBibleView();
  bindDailyEvents();
}

/**
 * 설정 불러오기
 */
function loadDailyConfig() {
  try {
    // 구버전(v2) 로컬스토리지 잔여물 정리
    if (localStorage.getItem('covenant_daily_bible_config_v2')) {
      localStorage.removeItem('covenant_daily_bible_config_v2');
    }
    const saved = localStorage.getItem(DAILY_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      dailyConfig = {
        ...DEFAULT_DAILY_CONFIG,
        ...parsed,
        district4: { ...DEFAULT_DAILY_CONFIG.district4, ...(parsed.district4 || {}) },
        women: { ...DEFAULT_DAILY_CONFIG.women, ...(parsed.women || {}) }
      };
      // 로마서 기준일 및 시작 장수 최신화 동기화 (내일 2026-10-01부터 로마서 3장 시작)
      if (dailyConfig.women.track2AnchorDate !== DEFAULT_DAILY_CONFIG.women.track2AnchorDate ||
          dailyConfig.women.track2Chapter !== DEFAULT_DAILY_CONFIG.women.track2Chapter) {
        dailyConfig.women.track2AnchorDate = DEFAULT_DAILY_CONFIG.women.track2AnchorDate;
        dailyConfig.women.track2Chapter = DEFAULT_DAILY_CONFIG.women.track2Chapter;
        saveDailyConfig();
      }
    } else {
      dailyConfig = JSON.parse(JSON.stringify(DEFAULT_DAILY_CONFIG));
      saveDailyConfig();
    }
  } catch (e) {
    dailyConfig = JSON.parse(JSON.stringify(DEFAULT_DAILY_CONFIG));
  }
}

function saveDailyConfig() {
  try {
    localStorage.setItem(DAILY_CONFIG_KEY, JSON.stringify(dailyConfig));
  } catch (e) {
    console.error("매일성경 설정 저장 실패:", e);
  }
}

/**
 * 체크리스트 불러오기/저장 (4구역 / 언약성도 모드별 완전 격리)
 */
function loadDailyChecklists() {
  try {
    const saved = localStorage.getItem(DAILY_CHECKLIST_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // 구버전 마이그레이션: 모드 키가 없으면 기존 데이터를 district4로 보존
      if (parsed && typeof parsed === 'object' && !parsed[DAILY_MODE_DISTRICT4] && !parsed[DAILY_MODE_WOMEN]) {
        dailyChecklists = {
          [DAILY_MODE_DISTRICT4]: parsed,
          [DAILY_MODE_WOMEN]: {}
        };
      } else {
        dailyChecklists = {
          [DAILY_MODE_DISTRICT4]: (parsed && parsed[DAILY_MODE_DISTRICT4]) || {},
          [DAILY_MODE_WOMEN]: (parsed && parsed[DAILY_MODE_WOMEN]) || {}
        };
      }
    } else {
      dailyChecklists = {
        [DAILY_MODE_DISTRICT4]: {},
        [DAILY_MODE_WOMEN]: {}
      };
    }
  } catch (e) {
    dailyChecklists = {
      [DAILY_MODE_DISTRICT4]: {},
      [DAILY_MODE_WOMEN]: {}
    };
  }
}

function saveDailyChecklists() {
  try {
    localStorage.setItem(DAILY_CHECKLIST_KEY, JSON.stringify(dailyChecklists));
  } catch (e) {
    console.error("매일성경 체크리스트 저장 실패:", e);
  }
}

/**
 * 날짜 키 포맷팅 (YYYY-MM-DD)
 */
function formatDailyDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * 한국어 날짜 포맷 (예: 2026년 9월 29일 (화))
 */
function formatKoreanDailyDate(d) {
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${dayNames[d.getDay()]})`;
}

/**
 * 날짜 일수 차이 (d2 - d1Str)
 */
function getDailyDayDiff(d1Str, d2) {
  const parts = d1Str.split("-").map(Number);
  const d1 = new Date(parts[0], parts[1] - 1, parts[2]);
  const target = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return Math.round((target.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * 모드 전환 함수
 */
function setDailyBibleMode(mode) {
  dailyConfig.currentMode = mode;
  saveDailyConfig();
  updateModeSwitcherUI();
  renderDailyBibleView();
  showToast(mode === DAILY_MODE_DISTRICT4 ? "👑 4구역 매일성경 모드로 전환되었습니다." : "🌸 언약성도 매일성경 모드로 전환되었습니다.");
}

function updateModeSwitcherUI() {
  const btnD4 = document.getElementById("daily-mode-btn-d4");
  const btnWomen = document.getElementById("daily-mode-btn-women");
  if (!btnD4 || !btnWomen) return;

  if (dailyConfig.currentMode === DAILY_MODE_DISTRICT4) {
    btnD4.classList.add("active");
    btnWomen.classList.remove("active");
  } else {
    btnWomen.classList.add("active");
    btnD4.classList.remove("active");
  }
}

/**
 * 날짜 디스플레이 갱신
 */
function updateDailyDateDisplay() {
  const dateKey = formatDailyDateKey(selectedDailyDate);
  const korDateStr = formatKoreanDailyDate(selectedDailyDate);

  const titleEl = document.getElementById("daily-date-title");
  if (titleEl) titleEl.innerText = korDateStr;

  const inputEl = document.getElementById("daily-date-picker");
  if (inputEl) inputEl.value = dateKey;

  const today = new Date();
  const isToday = formatDailyDateKey(today) === dateKey;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = formatDailyDateKey(tomorrow) === dateKey;

  const badgeEl = document.getElementById("daily-date-badge");
  if (badgeEl) {
    if (isToday) {
      badgeEl.className = "date-badge badge-today";
      badgeEl.innerText = "오늘 말씀";
    } else if (isTomorrow) {
      badgeEl.className = "date-badge badge-tomorrow";
      badgeEl.innerText = "내일 본문 (미리보기)";
    } else {
      const diff = getDailyDayDiff(formatDailyDateKey(today), selectedDailyDate);
      badgeEl.className = "date-badge badge-other";
      badgeEl.innerText = diff > 0 ? `${diff}일 후` : `${Math.abs(diff)}일 전`;
    }
  }
}

/**
 * 4구역 모드 본문 계산
 */
function getDistrict4Passages(targetDate) {
  const cfg = dailyConfig.district4;
  const diffDays = getDailyDayDiff(cfg.anchorDate, targetDate);
  const anchorGlobal = getGlobalChapter(cfg.anchorBookId, cfg.anchorChapter);
  const count = cfg.dailyChapters || 3;
  const startGlobal = anchorGlobal + (diffDays * count);

  return getConsecutiveChapters(startGlobal, count);
}

/**
 * 여성 성도 모드 본문 계산 (더블 트랙)
 */
function getWomenPassages(targetDate) {
  const cfg = dailyConfig.women;
  const track1DiffDays = getDailyDayDiff(cfg.track1AnchorDate, targetDate);

  // Track 1 (구약 순차 통독)
  const track1AnchorGlobal = getGlobalChapter(cfg.track1BookId, cfg.track1Chapter);
  const track1Count = cfg.track1Count || 3;
  const track1StartGlobal = track1AnchorGlobal + (track1DiffDays * track1Count);
  const track1Chapters = getConsecutiveChapters(track1StartGlobal, track1Count);

  // Track 2 (로마서 순환 통독)
  const track2AnchorDate = cfg.track2AnchorDate || cfg.track1AnchorDate;
  const track2DiffDays = getDailyDayDiff(track2AnchorDate, targetDate);
  const track2Count = cfg.track2Count || 2;
  const track2Chapters = getRomansRotationChapters(cfg.track2Chapter, track2DiffDays, track2Count);

  return {
    track1: track1Chapters,
    track2: track2Chapters
  };
}

function getRomansRotationChapters(anchorCh, diffDays, count = 2) {
  const ROMANS_TOTAL = 16;
  const startOffset = ((anchorCh - 1 + (diffDays * count)) % ROMANS_TOTAL + ROMANS_TOTAL) % ROMANS_TOTAL;
  const romansBook = BIBLE_BOOKS.find(b => b.name === "로마서") || { id: 45, name: "로마서", abbr: "롬", chapters: 16 };

  const result = [];
  for (let i = 0; i < count; i++) {
    const ch = ((startOffset + i) % ROMANS_TOTAL) + 1;
    result.push({
      book: romansBook,
      chapter: ch,
      globalIndex: getGlobalChapter(romansBook.id, ch)
    });
  }
  return result;
}

/**
 * 전체 매일성경 뷰 렌더링
 */
function renderDailyBibleView() {
  updateModeSwitcherUI();
  updateTemplatePillsUI();
  updateDailyDateDisplay();

  const isD4Mode = dailyConfig.currentMode === DAILY_MODE_DISTRICT4;
  const korDateStr = formatKoreanDailyDate(selectedDailyDate);
  const dateKey = formatDailyDateKey(selectedDailyDate);

  // 모드별 레이아웃 제어
  const d4Container = document.getElementById("daily-d4-passage-section");
  const womenContainer = document.getElementById("daily-women-passage-section");

  if (isD4Mode) {
    if (d4Container) d4Container.style.display = "block";
    if (womenContainer) womenContainer.style.display = "none";

    renderDistrict4Content(korDateStr);
  } else {
    if (d4Container) d4Container.style.display = "none";
    if (womenContainer) womenContainer.style.display = "block";

    renderWomenContent(korDateStr);
  }

  // 구역 식구 완독 체크보드
  renderDailyMemberCheckboard(dateKey);

  // 통독 누적 달성률 게이지
  renderDailyReadingProgress();
}

/**
 * 🔄 카카오톡 메시지 문구 다시 섞기
 */
function shuffleDailyKakaoMessage() {
  dailyShuffleOffset++;
  const isD4Mode = dailyConfig.currentMode === DAILY_MODE_DISTRICT4;
  const korDateStr = formatKoreanDailyDate(selectedDailyDate);
  if (isD4Mode) {
    renderDistrict4Content(korDateStr);
  } else {
    renderWomenContent(korDateStr);
  }
  showToast("🔄 새로운 추천 문구로 재조합되었습니다.");
}

/**
 * 날짜 기반 결정론적 시드 번호 산출 (당일 동일 문구 유지)
 */
function getDailySeed(date) {
  const dObj = date || new Date();
  const y = dObj.getFullYear();
  const m = dObj.getMonth() + 1;
  const d = dObj.getDate();
  return (y * 365 + m * 31 + d) >>> 0;
}

/**
 * 4대 절기 자동 감지 배너 (부활절, 추수감사주일, 성탄절, 송구영신)
 */
function detectSpecialSeason(date) {
  const m = date.getMonth() + 1;
  const d = date.getDate();

  // 1. 성탄절 (12월 24일 ~ 12월 25일)
  if (m === 12 && (d === 24 || d === 25)) {
    return {
      badge: "🎄 [성탄의 축복]",
      message: "우리를 구원하시기 위해 이 땅에 낮아져 오신 아기 예수님의 크신 사랑과 하늘의 평화가 성도님들의 가정과 삶에 가득하시기를 축복합니다."
    };
  }

  // 2. 송구영신 (12월 31일 ~ 1월 1일)
  if ((m === 12 && d === 31) || (m === 1 && d === 1)) {
    return {
      badge: "🌅 [송구영신]",
      message: "지나온 한 해를 주님의 신실하신 은혜로 아름답게 매듭짓고, 변함없는 주의 언약의 말씀과 함께 새해를 믿음과 소망으로 힘차게 출발합니다."
    };
  }

  // 3. 추수감사주일 (11월 셋째 주간: 11월 15일 ~ 11월 21일)
  if (m === 11 && d >= 15 && d <= 21) {
    return {
      badge: "🌾 [추수감사]",
      message: "올 한 해도 우리의 모든 삶을 선한 길로 인도하시고 풍성한 은혜와 결실로 채워주신 에벤에셀 하나님께 마음 깊이 감사와 영광을 드립니다."
    };
  }

  // 4. 부활절 (매년 봄 부활 주간 - 2026년 기준 4월 5일 부활 주간)
  const y = date.getFullYear();
  const isEasterWeek2026 = (y === 2026 && ((m === 3 && d >= 30) || (m === 4 && d <= 5)));
  if (isEasterWeek2026) {
    return {
      badge: "🕊️ [부활의 소망]",
      message: "사망 권세를 깨뜨리시고 다시 살아나신 우리 주 예수 그리스도의 영원한 부활 생명과 승리의 능력이 성도님들의 심령 위에 충만하시길 기도합니다."
    };
  }

  return null;
}

/**
 * 요일별 맞춤 축복 & 권면 문구 모음
 */
const DAY_OF_WEEK_GREETINGS = {
  // 0: 일요일
  0: [
    "거룩하고 복된 주일, 공예배를 통해 부어주실 하늘의 큰 은혜와 감격을 사모합니다.",
    "주의 날에 함께 모여 하나님을 찬양하며 말씀으로 하나 되는 기쁨의 날입니다.",
    "예배의 감격과 함께 말씀을 마음에 새기며 영혼의 깊은 안식을 누리는 주일 되세요."
  ],
  // 1: 월요일
  1: [
    "새로운 한 주의 첫걸음, 생명의 말씀으로 활기차고 담대하게 출발합니다.",
    "월요일 아침, 하나님의 신실하신 약속을 굳게 붙잡고 믿음으로 승리하세요.",
    "주의 말씀이 이번 한 주간 우리의 생각과 걸음을 환하게 비추어 주실 것입니다."
  ],
  // 2: 화요일
  2: [
    "화요일의 일상 속에서도 주의 평강과 기쁨이 성도님의 삶에 가득하시기를 축복합니다.",
    "오늘도 말씀의 거울 앞에 나를 비추며 주님과 동행하는 은혜의 하루 되세요.",
    "우리의 호흡과 발걸음마다 주님의 선하신 손길이 늘 함께하심을 믿습니다."
  ],
  // 3: 수요일
  3: [
    "분주한 주중의 삶 한가운데서 영혼을 맑게 채우는 생수의 말씀입니다.",
    "수요일, 지친 일상을 잠시 내려놓고 말씀 안에서 참된 쉼과 새 힘을 얻으시길 바랍니다.",
    "주님을 앙망하는 자에게 독수리 날개 치며 올라감 같은 새 능력을 더하여 주십니다."
  ],
  // 4: 목요일
  4: [
    "말씀을 묵상하며 세상 속에서 거룩한 빛과 소금으로 살아가는 복된 목요일 되세요.",
    "믿음의 든든한 반석 위에 우리의 생각과 가정을 굳게 세워가는 하루입니다.",
    "보이지 않아도 우리를 위해 가장 선한 길을 예비하시는 신실하신 주님을 신뢰합니다."
  ],
  // 5: 금요일
  5: [
    "한 주간을 감사함으로 돌아보며 말씀 앞에 머무는 평안한 금요일입니다.",
    "은혜 가운데 한 주를 잘 매듭짓고, 다가오는 주일을 기대함으로 준비합니다.",
    "우리 삶에 새겨진 하나님의 은혜의 흔적들을 헤아리며 찬양을 올려드립니다."
  ],
  // 6: 토요일
  6: [
    "내일 주일 공예배의 큰 은혜를 사모하며 정결한 마음으로 말씀을 묵상합니다.",
    "한 주 동안 인도해 주신 하나님께 감사하며, 복된 안식과 회복의 주일을 맞이해요.",
    "주님의 거룩한 날을 준비하는 토요일, 말씀과 함께 평안하고 고요한 쉼을 누리세요."
  ]
};

/**
 * 날마다 다채롭게 순환되는 말씀 격려 한마디
 */
const DAILY_ENCOURAGEMENTS = [
  "오늘 하루도 말씀이 우리의 기준이 되고 기도가 우리의 호흡이 되길 축복합니다.",
  "살아있고 활력 있는 주의 말씀이 우리의 심령과 삶을 온전하게 회복시키십니다.",
  "세상의 분주함 속에서도 말씀 앞에 머무는 10분이 우리의 하루를 변화시킵니다.",
  "우리의 연약함을 아시는 주님께서 오늘도 넉넉한 은혜와 평강으로 붙들어 주십니다.",
  "작은 순종의 발걸음마다 주님의 크신 사랑과 인도하심이 풍성하게 임할 것입니다.",
  "주의 법을 사랑하는 자에게는 큰 평안이 있으니 아무것도 흔들 수 없습니다.",
  "말씀의 깊은 뿌리를 내릴 때 어떤 가뭄과 시련 속에서도 푸른 잎사귀를 냅니다."
];

/**
 * 4구역 통독 이정표(Milestone) 감지 (성경 권 전환 및 누적 진도율)
 */
function getDistrict4Milestone(chaptersList, targetDate) {
  if (!chaptersList || chaptersList.length === 0) return null;

  const firstCh = chaptersList[0];
  const lastCh = chaptersList[chaptersList.length - 1];
  const cfg = dailyConfig.district4;
  const diffDays = getDailyDayDiff(cfg.anchorDate, targetDate);
  const count = cfg.dailyChapters || 3;
  const anchorGlobal = getGlobalChapter(cfg.anchorBookId, cfg.anchorChapter);
  const currentEndGlobal = anchorGlobal + (diffDays * count) + count - 1;
  const totalBibleChapters = 1189;
  const progressPercent = Math.min(100, Math.max(0, ((currentEndGlobal / totalBibleChapters) * 100))).toFixed(1);

  let bookChangeNotice = null;
  // 당일 읽기 중 성경 권이 바뀌는 경우
  if (firstCh.book.id !== lastCh.book.id) {
    bookChangeNotice = `📌 [통독 이정표] 오늘 [${firstCh.book.name}]를 완독하고 [${lastCh.book.name}]을 새롭게 출발합니다!`;
  } else {
    // 어제 본문과의 책 전환 확인
    const yesterdayDate = new Date(targetDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayChapters = getDistrict4Passages(yesterdayDate);
    if (yesterdayChapters && yesterdayChapters.length > 0) {
      const yLast = yesterdayChapters[yesterdayChapters.length - 1];
      if (yLast.book.id !== firstCh.book.id) {
        bookChangeNotice = `📌 [통독 이정표] 오늘부터 [${firstCh.book.name}] 통독이 새롭게 시작됩니다!`;
      }
    }
  }

  return {
    bookChangeNotice,
    progressText: `📊 [통독 진도] 전체 성경 1,189장 중 ${currentEndGlobal}장 통독 완료 (${progressPercent}%)`
  };
}

/**
 * 언약성도 통독 이정표 감지
 */
function getWomenMilestone(passages) {
  if (!passages || !passages.track2 || passages.track2.length === 0) return null;

  const t2 = passages.track2;
  // 로마서 1장이 포함된 날 (16장 완독 후 순환 재시작)
  const startsRomans1 = t2.some(c => c.chapter === 1);
  if (startsRomans1) {
    return `📌 [통독 이정표] 로마서 16장 전장을 완독하고 새 마음으로 1장부터 다시 출발합니다!`;
  }
  return null;
}

/**
 * 4구역 매일성경 렌더링 (요약 카드 완전 배제, 다이나믹 메시지 연동)
 */
function renderDistrict4Content(korDateStr) {
  const chaptersList = getDistrict4Passages(selectedDailyDate);
  const passageTitle = formatPassageRange(chaptersList);

  const titleEl = document.getElementById("daily-passage-range-title");
  if (titleEl) titleEl.innerText = passageTitle;

  const pillsEl = document.getElementById("daily-chapter-pills");
  if (pillsEl) {
    pillsEl.innerHTML = chaptersList.map(ch => `
      <span class="chapter-pill">📖 ${ch.book.name} ${ch.chapter}장</span>
    `).join("");
  }

  // 카카오톡 메시지 생성
  const d4Style = dailyConfig?.district4?.templateStyle || "grace";
  currentKakaoMessageText = buildKakaoMessageDistrict4(passageTitle, chaptersList, korDateStr, d4Style, selectedDailyDate);
  const textareaEl = document.getElementById("daily-kakao-preview-textarea");
  if (textareaEl) textareaEl.value = currentKakaoMessageText;
}

/**
 * 여성성경 더블트랙 렌더링 (요약 카드 완전 배제, 다이나믹 메시지 연동)
 */
function renderWomenContent(korDateStr) {
  const passages = getWomenPassages(selectedDailyDate);
  const track1Title = formatPassageRange(passages.track1);
  const track2Title = formatPassageRange(passages.track2);

  const t1TitleEl = document.getElementById("women-track1-title");
  if (t1TitleEl) t1TitleEl.innerText = track1Title;

  const t2TitleEl = document.getElementById("women-track2-title");
  if (t2TitleEl) t2TitleEl.innerText = `${track2Title} (통독 본문)`;

  const t1PillsEl = document.getElementById("women-track1-pills");
  if (t1PillsEl) {
    t1PillsEl.innerHTML = passages.track1.map(ch => `
      <span class="chapter-pill">📜 ${ch.book.name} ${ch.chapter}장</span>
    `).join("");
  }

  const t2PillsEl = document.getElementById("women-track2-pills");
  if (t2PillsEl) {
    t2PillsEl.innerHTML = passages.track2.map(ch => `
      <span class="chapter-pill pill-romans">🕊️ ${ch.book.name} ${ch.chapter}장</span>
    `).join("");
  }

  // 카카오톡 메시지 생성
  const womenStyle = dailyConfig?.women?.templateStyle || "grace";
  currentKakaoMessageText = buildKakaoMessageWomen(track1Title, track2Title, passages, korDateStr, womenStyle, selectedDailyDate);
  const textareaEl = document.getElementById("daily-kakao-preview-textarea");
  if (textareaEl) textareaEl.value = currentKakaoMessageText;
}

/**
 * 카카오톡 복사용 메시지 조립 (4구역 모드 - 다이나믹 감성 엔진)
 */
function buildKakaoMessageDistrict4(passageTitle, chaptersList, korDateStr, styleOverride, targetDate) {
  const dateObj = targetDate || selectedDailyDate;
  const style = styleOverride || dailyConfig?.district4?.templateStyle || "grace";
  const endingMsg = "언약성도 모두가 주의 말씀으로 세워져 갈 수 있길 기도합니다. 말씀을 읽으신 후 단톡방에 '아멘' 또는 '완독'을 남겨주세요^^";

  const baseSeed = getDailySeed(dateObj);
  const dayOfWeek = dateObj.getDay();
  const dayGreetings = DAY_OF_WEEK_GREETINGS[dayOfWeek] || DAY_OF_WEEK_GREETINGS[1];
  const dayGreeting = dayGreetings[(baseSeed + dailyShuffleOffset) % dayGreetings.length];
  const encouragement = DAILY_ENCOURAGEMENTS[(baseSeed + dailyShuffleOffset * 2) % DAILY_ENCOURAGEMENTS.length];
  const holiday = detectSpecialSeason(dateObj);
  const milestone = getDistrict4Milestone(chaptersList, dateObj);

  // 1. 심플형 (간결하고 콤팩트한 디자인)
  if (style === "simple") {
    const lines = [
      `🌿 [언약교회 4구역] 매일성경`,
      ``,
      `▪ 일시: ${korDateStr}`,
      `▪ 본문: ${passageTitle}`
    ];
    if (holiday) {
      lines.push(``, `${holiday.badge} ${holiday.message}`);
    } else if (milestone && milestone.bookChangeNotice) {
      lines.push(``, milestone.bookChangeNotice);
    }
    lines.push(``, endingMsg);
    return lines.join("\n");
  }

  // 2. 아침문안형 (따뜻한 아침 축복 인사)
  if (style === "warm") {
    const lines = [
      `☀️ 샬롬! 언약교회 4구역 식구 여러분,`,
      `은혜롭고 평안한 새 아침입니다.`,
      ``,
      `🗓 날짜: ${korDateStr}`,
      `📖 오늘 우리가 마음에 새길 생명의 말씀:`,
      `【${passageTitle}】`,
      ``,
      dayGreeting
    ];
    if (holiday) {
      lines.push(``, `${holiday.badge} ${holiday.message}`);
    }
    if (milestone && milestone.bookChangeNotice) {
      lines.push(``, milestone.bookChangeNotice);
    }
    lines.push(
      ``,
      `오늘 하루도 주님의 선하신 은혜 가운데 승리하시기를 축복합니다.`,
      endingMsg
    );
    return lines.join("\n");
  }

  // 3. 은혜나눔형 (권장 표준형: 감성 인사 + 이정표 + 격려 문구)
  const lines = [
    `🌿 [언약교회 4구역] 매일 성경 읽기`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `🗓️ 날짜: ${korDateStr}`,
    `📖 본문: ${passageTitle}`,
    ``,
    `✨ ${dayGreeting}`
  ];

  if (holiday) {
    lines.push(``, `${holiday.badge} ${holiday.message}`);
  }

  if (milestone) {
    if (milestone.bookChangeNotice) {
      lines.push(``, milestone.bookChangeNotice);
    }
    lines.push(``, milestone.progressText);
  }

  lines.push(
    ``,
    `💬 ${encouragement}`,
    ``,
    endingMsg,
    `━━━━━━━━━━━━━━━━━━━━`
  );

  return lines.join("\n");
}

/**
 * 카카오톡 복사용 메시지 조립 (언약성도 모드 - 다이나믹 감성 엔진)
 */
function buildKakaoMessageWomen(track1Title, track2Title, passages, korDateStr, styleOverride, targetDate) {
  const dateObj = targetDate || selectedDailyDate;
  const style = styleOverride || dailyConfig?.women?.templateStyle || "grace";
  const endingMsg = "언약성도 모두가 주의 말씀으로 세워져 갈 수 있길 기도합니다. 말씀을 읽으신 후 단톡방에 '아멘' 또는 '완독'을 남겨주세요^^";

  const baseSeed = getDailySeed(dateObj);
  const dayOfWeek = dateObj.getDay();
  const dayGreetings = DAY_OF_WEEK_GREETINGS[dayOfWeek] || DAY_OF_WEEK_GREETINGS[1];
  const dayGreeting = dayGreetings[(baseSeed + dailyShuffleOffset) % dayGreetings.length];
  const encouragement = DAILY_ENCOURAGEMENTS[(baseSeed + dailyShuffleOffset * 2) % DAILY_ENCOURAGEMENTS.length];
  const holiday = detectSpecialSeason(dateObj);
  const milestoneNotice = getWomenMilestone(passages);

  // 1. 심플형
  if (style === "simple") {
    const lines = [
      `🌸 [언약교회] 언약성도 매일성경`,
      ``,
      `▪ 일시: ${korDateStr}`,
      `▪ 구약 통독 본문: ${track1Title}`,
      `▪ 신약 통독 본문: ${track2Title}`
    ];
    if (holiday) {
      lines.push(``, `${holiday.badge} ${holiday.message}`);
    } else if (milestoneNotice) {
      lines.push(``, milestoneNotice);
    }
    lines.push(``, endingMsg);
    return lines.join("\n");
  }

  // 2. 아침문안형
  if (style === "warm") {
    const lines = [
      `☀️ 샬롬! 언약교회 성도 여러분,`,
      `은혜롭고 평안한 새 아침입니다.`,
      ``,
      `🗓 날짜: ${korDateStr}`,
      `📖 오늘 우리가 마음에 새길 생명의 말씀:`,
      `• 구약 통독 본문: ${track1Title}`,
      `• 신약 통독 본문: ${track2Title}`,
      ``,
      dayGreeting
    ];
    if (holiday) {
      lines.push(``, `${holiday.badge} ${holiday.message}`);
    }
    if (milestoneNotice) {
      lines.push(``, milestoneNotice);
    }
    lines.push(
      ``,
      `오늘 하루도 주님의 선하신 은혜 가운데 승리하시기를 축복합니다.`,
      endingMsg
    );
    return lines.join("\n");
  }

  // 3. 은혜나눔형 (권장 표준형)
  const lines = [
    `🌸 [언약교회] 언약성도 매일 성경 읽기`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `🗓️ 날짜: ${korDateStr}`,
    `📖 1. 구약 통독 본문: ${track1Title}`,
    `📖 2. 신약 통독 본문: ${track2Title}`,
    ``,
    `✨ ${dayGreeting}`
  ];

  if (holiday) {
    lines.push(``, `${holiday.badge} ${holiday.message}`);
  }

  if (milestoneNotice) {
    lines.push(``, milestoneNotice);
  }

  lines.push(
    ``,
    `💬 ${encouragement}`,
    ``,
    endingMsg,
    `━━━━━━━━━━━━━━━━━━━━`
  );

  return lines.join("\n");
}

/**
 * 카카오톡 메시지 클립보드 원클릭 복사
 */
function copyDailyKakaoMessage() {
  const textarea = document.getElementById("daily-kakao-preview-textarea");
  const textToCopy = textarea ? textarea.value : currentKakaoMessageText;

  if (!navigator.clipboard) {
    if (textarea) {
      textarea.select();
      document.execCommand("copy");
      showToast("📋 카톡 메시지가 복사되었습니다! 카톡창에서 바로 붙여넣기(Ctrl+V) 하세요.");
      triggerDailyCopyAnimation();
    }
    return;
  }

  navigator.clipboard.writeText(textToCopy).then(() => {
    showToast("📋 카톡 메시지가 복사되었습니다! 단톡방에 붙여넣기(Ctrl+V) 하세요.");
    triggerDailyCopyAnimation();
  }).catch(() => {
    if (textarea) {
      textarea.select();
      document.execCommand("copy");
      showToast("📋 카톡 메시지가 복사되었습니다!");
      triggerDailyCopyAnimation();
    }
  });
}

function triggerDailyCopyAnimation() {
  const btn = document.getElementById("btn-copy-daily-kakao");
  if (btn) {
    const originalText = btn.innerHTML;
    btn.innerHTML = `<span>✅</span> 복사 완료!`;
    btn.classList.add("btn-copied");
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.classList.remove("btn-copied");
    }, 2000);
  }
}

/**
 * 모바일 카카오톡 / SNS 공유 (Web Share API)
 */
function shareDailyKakaoDirect() {
  const textarea = document.getElementById("daily-kakao-preview-textarea");
  const textToShare = textarea ? textarea.value : currentKakaoMessageText;

  if (navigator.share) {
    navigator.share({
      title: "매일 성경 나눔",
      text: textToShare
    }).catch(err => {
      if (err.name !== 'AbortError') {
        copyDailyKakaoMessage();
      }
    });
  } else {
    copyDailyKakaoMessage();
  }
}

/**
 * 구역원 완독 체크보드 렌더링 (4구역 / 언약성도 모드별 분리)
 */
function renderDailyMemberCheckboard(dateKey) {
  const boardEl = document.getElementById("daily-member-checklist-grid");
  if (!boardEl) return;

  const currentMode = dailyConfig?.currentMode || DAILY_MODE_DISTRICT4;
  if (!dailyChecklists[currentMode]) {
    dailyChecklists[currentMode] = {};
  }
  const currentChecklist = dailyChecklists[currentMode][dateKey] || {};

  // 메인 appData의 members 활용, 없을 경우 기본값
  const members = (window.appData && window.appData.members) ? window.appData.members : [
    { id: 1, name: "손혜영" },
    { id: 2, name: "권가람" },
    { id: 3, name: "모점례" },
    { id: 4, name: "이경숙" },
    { id: 5, name: "손영란" },
    { id: 6, name: "권수아" },
    { id: 7, name: "육선경" }
  ];

  const checkedCount = members.filter(m => !!currentChecklist[m.id]).length;
  const countEl = document.getElementById("daily-checklist-count-display");
  if (countEl) {
    const modeName = currentMode === DAILY_MODE_DISTRICT4 ? "4구역" : "언약성도";
    countEl.innerText = `[${modeName}] ${checkedCount} / ${members.length}명 완독`;
  }

  boardEl.innerHTML = members.map(m => {
    const isChecked = !!currentChecklist[m.id];
    return `
      <button type="button" 
        class="member-check-chip ${isChecked ? 'checked' : ''}" 
        onclick="toggleDailyMemberCheck(${m.id})">
        <span class="chip-avatar">${m.name[0]}</span>
        <span class="chip-name">${m.name}</span>
        <span class="chip-icon">${isChecked ? '✓' : '+'}</span>
      </button>
    `;
  }).join("");
}

/**
 * 식구 완독 토글 & 4구역/언약성도 모드별 통독 연동
 */
function toggleDailyMemberCheck(memberId) {
  const currentMode = dailyConfig?.currentMode || DAILY_MODE_DISTRICT4;
  const dateKey = formatDailyDateKey(selectedDailyDate);

  if (!dailyChecklists[currentMode]) {
    dailyChecklists[currentMode] = {};
  }
  if (!dailyChecklists[currentMode][dateKey]) {
    dailyChecklists[currentMode][dateKey] = {};
  }

  const newState = !dailyChecklists[currentMode][dateKey][memberId];
  dailyChecklists[currentMode][dateKey][memberId] = newState;
  saveDailyChecklists();

  // 당일 모드별 읽은 장수 및 본문 파트 산출
  let chaptersToday = 0;
  let targetParts = [];

  if (currentMode === DAILY_MODE_DISTRICT4) {
    chaptersToday = dailyConfig?.district4?.dailyChapters || 3;
    const chaptersList = getDistrict4Passages(selectedDailyDate);
    const passageTitle = formatPassageRange(chaptersList);
    if (passageTitle) {
      targetParts = [passageTitle];
    }
  } else {
    // 언약성도 모드 (구약 track1 + 로마서 track2 = 5장)
    const t1Count = dailyConfig?.women?.track1Count || 3;
    const t2Count = dailyConfig?.women?.track2Count || 2;
    chaptersToday = t1Count + t2Count;

    const passages = getWomenPassages(selectedDailyDate);
    const track1Title = formatPassageRange(passages.track1);
    const track2Title = formatPassageRange(passages.track2);
    if (track1Title) targetParts.push(track1Title);
    if (track2Title) targetParts.push(track2Title);
  }

  if (window.appData && Array.isArray(window.appData.members)) {
    // 깊은 복사로 안전하게 새 배열 생성하여 참조 얽힘 원천 차단
    window.appData.members = window.appData.members.map(m => {
      if (m.id === memberId) {
        const newWeekly = (m.weeklyChapters || 0) + (newState ? chaptersToday : -chaptersToday);
        const newTotal = (m.totalAccumulated || 0) + (newState ? chaptersToday : -chaptersToday);

        // 본문 텍스트 연동: 추가 또는 제거 (무결성 보장)
        let parts = (m.weeklyPassage || "").split(", ").map(s => s.trim()).filter(Boolean);
        if (newState) {
          targetParts.forEach(p => {
            if (p && !parts.includes(p)) {
              parts.push(p);
            }
          });
        } else {
          parts = parts.filter(p => !targetParts.includes(p));
        }

        return {
          ...m,
          weeklyChapters: Math.max(0, newWeekly),
          totalAccumulated: Math.max(0, newTotal),
          weeklyPassage: parts.join(", ")
        };
      }
      return { ...m };
    });
  }

  renderDailyMemberCheckboard(dateKey);
  renderDailyReadingProgress();

  const member = window.appData?.members?.find(m => m.id === memberId);
  const memberName = member ? member.name : "성도";
  const modeTitle = currentMode === DAILY_MODE_DISTRICT4 ? "4구역 매일성경" : "언약성도 매일성경";

  if (newState) {
    showToast(`🎉 ${memberName} 성도님 [${modeTitle}] 완독 완료!`);
    triggerCelebrationConfetti();
  } else {
    showToast(`${memberName} 성도님 [${modeTitle}] 완독 체크가 해제되었습니다.`);
  }

  if (typeof window.saveData === 'function') window.saveData();
  if (typeof window.renderAll === 'function') window.renderAll();
}

/**
 * 통독 누적 달성률 게이지 계산
 */
function renderDailyReadingProgress() {
  const gaugeFill = document.getElementById("daily-progress-fill");
  const gaugeText = document.getElementById("daily-progress-percent");
  const readCountEl = document.getElementById("daily-progress-chapters");

  if (!gaugeFill || !gaugeText) return;

  // 기준일로부터 오늘까지의 읽은 분량 계산
  const isD4 = dailyConfig.currentMode === DAILY_MODE_DISTRICT4;
  const cfg = isD4 ? dailyConfig.district4 : dailyConfig.women;
  const anchorDateStr = isD4 ? cfg.anchorDate : cfg.track1AnchorDate;
  const daysPassed = Math.max(0, getDailyDayDiff(anchorDateStr, selectedDailyDate) + 1);
  const dailyChapters = isD4 ? (cfg.dailyChapters || 3) : 5;

  // 전체 성경 1189장 기준 (기존 누적치 약 303장에 오늘까지 진행 분량 합산)
  const baseAccumulated = 303; // 현재 4구역의 열왕기상 10장 이전 누적 장수
  const currentTotalRead = Math.min(TOTAL_BIBLE_CHAPTERS, baseAccumulated + (daysPassed * dailyChapters));
  const percent = ((currentTotalRead / TOTAL_BIBLE_CHAPTERS) * 100).toFixed(1);

  gaugeFill.style.width = `${percent}%`;
  gaugeText.innerText = `${percent}%`;
  if (readCountEl) {
    readCountEl.innerText = `${currentTotalRead.toLocaleString()}장 / ${TOTAL_BIBLE_CHAPTERS.toLocaleString()}장`;
  }
}

/**
 * 날짜 탐색 함수들
 */
function changeDailyDateOffset(offset) {
  selectedDailyDate.setDate(selectedDailyDate.getDate() + offset);
  renderDailyBibleView();
}

function goDailyToday() {
  selectedDailyDate = new Date();
  renderDailyBibleView();
}

function goDailyTomorrow() {
  selectedDailyDate = new Date();
  selectedDailyDate.setDate(selectedDailyDate.getDate() + 1);
  renderDailyBibleView();
}

function handleDailyDatePick(event) {
  const val = event.target.value;
  if (!val) return;
  const parts = val.split("-").map(Number);
  selectedDailyDate = new Date(parts[0], parts[1] - 1, parts[2]);
  renderDailyBibleView();
}

/**
 * 템플릿 스타일 변경
 */
function changeDailyTemplateStyle(style) {
  if (!dailyConfig) loadDailyConfig();
  if (dailyConfig.currentMode === DAILY_MODE_DISTRICT4) {
    if (!dailyConfig.district4) dailyConfig.district4 = {};
    dailyConfig.district4.templateStyle = style;
  } else {
    if (!dailyConfig.women) dailyConfig.women = {};
    dailyConfig.women.templateStyle = style;
  }
  saveDailyConfig();
  updateTemplatePillsUI();
  renderDailyBibleView();

  const styleNames = { grace: "은혜나눔형", simple: "심플형", warm: "아침문안형" };
  showToast(`💬 ${styleNames[style] || style} 양식이 적용되었습니다.`);
}

/**
 * 템플릿 선택 버튼 UI 동기화
 */
function updateTemplatePillsUI() {
  const isD4 = dailyConfig?.currentMode === DAILY_MODE_DISTRICT4;
  const currentStyle = (isD4 ? dailyConfig?.district4?.templateStyle : dailyConfig?.women?.templateStyle) || "grace";
  const btns = document.querySelectorAll(".template-pill-btn");
  btns.forEach(b => {
    b.classList.toggle("active", b.getAttribute("data-style") === currentStyle);
  });
}

/**
 * 축하 폭죽(Confetti) 애니메이션 효과
 */
function triggerCelebrationConfetti() {
  try {
    const colors = ['#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6'];
    const count = 35;
    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      el.className = "confetti-piece";
      el.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      el.style.left = `${Math.random() * 100}%`;
      el.style.top = `${Math.random() * 20}%`;
      el.style.animationDuration = `${1.2 + Math.random() * 1.5}s`;
      el.style.animationDelay = `${Math.random() * 0.3}s`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2500);
    }
  } catch (e) {}
}

/**
 * 성경 본문 읽기 외부 링크 열기
 */
function openBibleReaderOnline() {
  // 개역개정 성경 링크 (대한성서공회 또는 GoodTV 웹성경)
  window.open("https://www.bskorea.or.kr/bible/korbibReadpage.php", "_blank");
}

/**
 * 이벤트 바인딩
 */
function bindDailyEvents() {
  const datePicker = document.getElementById("daily-date-picker");
  if (datePicker) {
    datePicker.addEventListener("change", handleDailyDatePick);
  }
}
