/**
 * 언약교회 구역모임 앱 - 매일 성경 읽기 & 카카오톡 메시지 원클릭 생성기 통합 모듈
 * - 4구역 모드: 하루 3장 순차 통독 (기본: 열왕기상)
 * - 원미 여성성경 모드: 구약 3장 + 로마서 2장 더블트랙
 * - 카카오톡 나눔 메시지 원터치 복사 및 식구별 완독 체크보드
 */

// 모드 상수
const DAILY_MODE_DISTRICT4 = 'district4';
const DAILY_MODE_WOMEN = 'women';

// 로컬 스토리지 키
const DAILY_CONFIG_KEY = 'covenant_daily_bible_config_v2';
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
 * 체크리스트 불러오기/저장
 */
function loadDailyChecklists() {
  try {
    const saved = localStorage.getItem(DAILY_CHECKLIST_KEY);
    dailyChecklists = saved ? JSON.parse(saved) : {};
  } catch (e) {
    dailyChecklists = {};
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
 * 4구역 매일성경 렌더링
 */
function renderDistrict4Content(korDateStr) {
  const chaptersList = getDistrict4Passages(selectedDailyDate);
  const passagePkg = generateDailyPassagePackage(chaptersList);

  const titleEl = document.getElementById("daily-passage-range-title");
  if (titleEl) titleEl.innerText = passagePkg.passageTitle;

  const pillsEl = document.getElementById("daily-chapter-pills");
  if (pillsEl) {
    pillsEl.innerHTML = chaptersList.map(ch => `
      <span class="chapter-pill">📖 ${ch.book.name} ${ch.chapter}장</span>
    `).join("");
  }

  // 장별 요약 카드 렌더링 (줄거리 요약만 표시)
  const summaryEl = document.getElementById("daily-summary-cards-container");
  if (summaryEl) {
    summaryEl.innerHTML = passagePkg.chapterDetails.map(c => `
      <div class="summary-item-card">
        <div class="summary-item-header">
          <span class="summary-badge">${c.bookName} ${c.chapter}장</span>
          <span class="summary-title">${c.title}</span>
        </div>
        <p class="summary-desc">${c.summary}</p>
      </div>
    `).join("");
  }

  // 카카오톡 메시지 생성
  const d4Style = dailyConfig?.district4?.templateStyle || "grace";
  currentKakaoMessageText = buildKakaoMessageDistrict4(passagePkg, korDateStr, d4Style);
  const textareaEl = document.getElementById("daily-kakao-preview-textarea");
  if (textareaEl) textareaEl.value = currentKakaoMessageText;
}

/**
 * 여성성경 더블트랙 렌더링
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

  // 장별 요약 카드 렌더링
  const summaryEl = document.getElementById("women-summary-cards-container");
  if (summaryEl) {
    const t1Details = passages.track1.map(c => getChapterInfo(c.book.name, c.chapter));
    const t2Details = passages.track2.map(c => getChapterInfo(c.book.name, c.chapter));

    const html1 = t1Details.map(c => `
      <div class="summary-item-card">
        <div class="summary-item-header">
          <span class="summary-badge">${c.bookName} ${c.chapter}장</span>
          <span class="summary-title">${c.title}</span>
        </div>
        <p class="summary-desc">${c.summary}</p>
      </div>
    `).join("");

    const html2 = t2Details.map(c => `
      <div class="summary-item-card card-romans">
        <div class="summary-item-header">
          <span class="summary-badge badge-romans">${c.bookName} ${c.chapter}장</span>
          <span class="summary-title">${c.title}</span>
        </div>
        <p class="summary-desc">${c.summary}</p>
      </div>
    `).join("");

    summaryEl.innerHTML = html1 + html2;
  }

  // 카카오톡 메시지 생성
  const womenStyle = dailyConfig?.women?.templateStyle || "grace";
  currentKakaoMessageText = buildKakaoMessageWomen(track1Title, track2Title, passages, korDateStr, womenStyle);
  const textareaEl = document.getElementById("daily-kakao-preview-textarea");
  if (textareaEl) textareaEl.value = currentKakaoMessageText;
}

/**
 * 카카오톡 복사용 메시지 조립 (4구역 모드)
 */
function buildKakaoMessageDistrict4(passagePkg, korDateStr, styleOverride) {
  const style = styleOverride || dailyConfig?.district4?.templateStyle || "grace";
  const endingMsg = "언약성도 모두가 주의 말씀으로 세워져 갈 수 있길 기도합니다. 말씀을 읽으신 후 단톡방에 '아멘' 또는 '완독'을 남겨주세요^^";

  // 1. 심플형 (간결하고 정갈한 콤팩트 디자인 - 말씀요약 배제)
  if (style === "simple") {
    return [
      `🌿 [언약교회 4구역] 매일성경`,
      ``,
      `▪ 일시: ${korDateStr}`,
      `▪ 본문: ${passagePkg.passageTitle}`,
      ``,
      endingMsg
    ].join("\n");
  }

  // 2. 아침문안형 (따뜻한 새 아침 축복 인사 - 말씀요약 배제)
  if (style === "warm") {
    return [
      `☀️ 샬롬! 언약교회 4구역 식구 여러분,`,
      `은혜롭고 평안한 새 아침입니다.`,
      ``,
      `🗓 날짜: ${korDateStr}`,
      `📖 오늘 우리가 마음에 새길 생명의 말씀:`,
      `【${passagePkg.passageTitle}】`,
      ``,
      `오늘 하루도 주님의 선하신 은혜 가운데 승리하시기를 축복합니다.`,
      endingMsg
    ].join("\n");
  }

  // 3. 은혜나눔형 (권장 표준형)
  const summaries = passagePkg.chapterDetails.map(c => `• [${c.bookName} ${c.chapter}장] ${c.summary}`).join("\n");
  return [
    `🌿 [언약교회 4구역] 매일 성경 읽기`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `🗓️ 날짜: ${korDateStr}`,
    `📖 본문: ${passagePkg.passageTitle}`,
    ``,
    `[📌 오늘의 성경 말씀 요약]`,
    summaries,
    ``,
    endingMsg,
    `━━━━━━━━━━━━━━━━━━━━`
  ].join("\n");
}

/**
 * 카카오톡 복사용 메시지 조립 (언약성도 모드)
 */
function buildKakaoMessageWomen(track1Title, track2Title, passages, korDateStr, styleOverride) {
  const style = styleOverride || dailyConfig?.women?.templateStyle || "grace";
  const endingMsg = "언약성도 모두가 주의 말씀으로 세워져 갈 수 있길 기도합니다. 말씀을 읽으신 후 단톡방에 '아멘' 또는 '완독'을 남겨주세요^^";

  const t1Details = passages.track1.map(c => getChapterInfo(c.book.name, c.chapter));
  const t2Details = passages.track2.map(c => getChapterInfo(c.book.name, c.chapter));

  // 1. 심플형 (간결하고 정갈한 콤팩트 디자인 - 말씀요약 배제)
  if (style === "simple") {
    return [
      `🌸 [언약교회] 언약성도 매일성경`,
      ``,
      `▪ 일시: ${korDateStr}`,
      `▪ 구약 통독 본문: ${track1Title}`,
      `▪ 신약 통독 본문: ${track2Title}`,
      ``,
      endingMsg
    ].join("\n");
  }

  // 2. 아침문안형 (따뜻한 새 아침 축복 인사 - 말씀요약 배제)
  if (style === "warm") {
    return [
      `☀️ 샬롬! 언약교회 성도 여러분,`,
      `은혜롭고 평안한 새 아침입니다.`,
      ``,
      `🗓 날짜: ${korDateStr}`,
      `📖 오늘 우리가 마음에 새길 생명의 말씀:`,
      `• 구약 통독 본문: ${track1Title}`,
      `• 신약 통독 본문: ${track2Title}`,
      ``,
      `오늘 하루도 주님의 선하신 은혜 가운데 승리하시기를 축복합니다.`,
      endingMsg
    ].join("\n");
  }

  // 3. 은혜나눔형 (권장 표준형)
  const t1Summaries = t1Details.map(c => `• [${c.bookName} ${c.chapter}장] ${c.summary}`).join("\n");
  const t2Summaries = t2Details.map(c => `• [${c.bookName} ${c.chapter}장] ${c.summary}`).join("\n");
  return [
    `🌸 [언약교회] 언약성도 매일 성경 읽기`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `🗓️ 날짜: ${korDateStr}`,
    `📖 1. 구약 통독 본문: ${track1Title}`,
    `📖 2. 신약 통독 본문: ${track2Title}`,
    ``,
    `[📌 구약 통독 요약]`,
    t1Summaries,
    ``,
    `[📌 로마서 통독 요약]`,
    t2Summaries,
    ``,
    endingMsg,
    `━━━━━━━━━━━━━━━━━━━━`
  ].join("\n");
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
 * 구역원 완독 체크보드 렌더링
 */
function renderDailyMemberCheckboard(dateKey) {
  const boardEl = document.getElementById("daily-member-checklist-grid");
  if (!boardEl) return;

  const currentChecklist = dailyChecklists[dateKey] || {};
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
    countEl.innerText = `${checkedCount} / ${members.length}명 완독`;
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
 * 식구 완독 토글 & 축하 효과
 */
function toggleDailyMemberCheck(memberId) {
  const dateKey = formatDailyDateKey(selectedDailyDate);
  if (!dailyChecklists[dateKey]) {
    dailyChecklists[dateKey] = {};
  }

  const newState = !dailyChecklists[dateKey][memberId];
  dailyChecklists[dateKey][memberId] = newState;
  saveDailyChecklists();
  renderDailyMemberCheckboard(dateKey);
  renderDailyReadingProgress();

  const members = (window.appData && window.appData.members) ? window.appData.members : [];
  const member = members.find(m => m.id === memberId);
  const memberName = member ? member.name : "성도";

  if (newState) {
    showToast(`🎉 ${memberName} 성도님 오늘 말씀 완독 완료!`);
    triggerCelebrationConfetti();

    // 메인 구역모임 앱 통독 누적과 연동 (선택적 동기화)
    if (window.appData && window.appData.members) {
      const m = window.appData.members.find(x => x.id === memberId);
      if (m) {
        // 일일 분량(3장)을 주간 통독에 누적 가산 안내
        const chaptersToday = (dailyConfig.currentMode === DAILY_MODE_DISTRICT4) ? 3 : 5;
        // 사용자에게 부담주지 않고 자연스럽게 주간 통독 합산에 반영할 수 있는 상태 유지
      }
    }
  } else {
    showToast(`${memberName} 성도님 완독 체크가 해제되었습니다.`);
  }
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
