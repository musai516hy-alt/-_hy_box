/**
 * 매일 성경 읽기 & 카카오톡 메시지 원클릭 생성기 메인 스크립트
 */

const CONFIG_STORAGE_KEY = 'daily_bible_app_config_v1';
const CHECKLIST_STORAGE_KEY = 'daily_bible_checklist_v1';

// 기본 환경 설정
const DEFAULT_CONFIG = {
  churchName: "언약교회",
  groupName: "4구역",
  leaderName: "손혜영 구역장",
  // 기준일: 2026-09-28 (월) = 열왕기상 10장 (10~12장)
  // 내일(2026-09-29 화)은 열왕기상 13장 (13~15장)으로 자연스럽게 이어짐!
  anchorDate: "2026-09-28",
  anchorBookId: 11, // 열왕기상
  anchorChapter: 10,
  dailyChapters: 3,
  templateStyle: "grace", // 'grace' (은혜나눔형), 'simple' (심플챌린지형), 'warm' (따뜻한아침형)
  members: [
    { id: 1, name: "손혜영", role: "구역장" },
    { id: 2, name: "권가람", role: "부구역장" },
    { id: 3, name: "모점례", role: "구역원" },
    { id: 4, name: "이경숙", role: "구역원" },
    { id: 5, name: "손영란", role: "구역원" },
    { id: 6, name: "권수아", role: "구역원" },
    { id: 7, name: "육선경", role: "구역원" }
  ]
};

// 현재 상태
let appConfig = null;
let selectedDate = new Date();
let dailyChecklists = {}; // { 'YYYY-MM-DD': { memberId: true/false } }
let currentMessageText = "";

document.addEventListener("DOMContentLoaded", () => {
  initDailyBibleApp();
});

function initDailyBibleApp() {
  loadConfig();
  loadChecklists();

  // 현재 날짜 설정 (기본 오늘 날짜)
  selectedDate = new Date();

  // URL 파라미터로 특정 날짜나 'tomorrow' 지정 가능 지원
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("view") === "tomorrow") {
    selectedDate.setDate(selectedDate.getDate() + 1);
  } else if (urlParams.get("date")) {
    const d = new Date(urlParams.get("date"));
    if (!isNaN(d.getTime())) selectedDate = d;
  }

  updateDateDisplay();
  renderDailyContent();
  bindUIEvents();
}

function loadConfig() {
  try {
    const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (saved) {
      appConfig = { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      // 이전 테스트용 더미 명단이 저장되어 있는 경우 실제 구역 식구 명단으로 자동 동기화
      const memberNames = (appConfig.members || []).map(m => m.name);
      if (memberNames.includes("최다윗") || memberNames.includes("이건우") || memberNames.length !== DEFAULT_CONFIG.members.length || !memberNames.includes("권가람")) {
        appConfig.members = JSON.parse(JSON.stringify(DEFAULT_CONFIG.members));
        saveConfig();
      }
    } else {
      appConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
      saveConfig();
    }
  } catch (e) {
    console.error("설정 로드 실패:", e);
    appConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }
}

function saveConfig() {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(appConfig));
  } catch (e) {
    console.error("설정 저장 실패:", e);
  }
}

function loadChecklists() {
  try {
    const saved = localStorage.getItem(CHECKLIST_STORAGE_KEY);
    if (saved) {
      dailyChecklists = JSON.parse(saved);
    } else {
      dailyChecklists = {};
    }
  } catch (e) {
    dailyChecklists = {};
  }
}

function saveChecklists() {
  try {
    localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(dailyChecklists));
  } catch (e) {
    console.error("체크리스트 저장 실패:", e);
  }
}

/**
 * 날짜 포맷팅 헬퍼 (YYYY-MM-DD)
 */
function formatDateKey(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * 한국어 요일 포맷 (예: 2026년 9월 29일 (화))
 */
function formatKoreanDate(dateObj) {
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const y = dateObj.getFullYear();
  const m = dateObj.getMonth() + 1;
  const d = dateObj.getDate();
  const dayName = dayNames[dateObj.getDay()];
  return `${y}년 ${m}월 ${d}일 (${dayName})`;
}

/**
 * 두 날짜 사이의 일수 차이 (date2 - date1)
 */
function getDayDiff(date1Str, date2Obj) {
  const parts = date1Str.split("-").map(Number);
  const d1 = new Date(parts[0], parts[1] - 1, parts[2]);
  const d2 = new Date(date2Obj.getFullYear(), date2Obj.getMonth(), date2Obj.getDate());
  
  const diffTime = d2.getTime() - d1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 선택된 날짜의 성경 본문 3장 목록 계산
 */
function getPassageForDate(targetDate) {
  const diffDays = getDayDiff(appConfig.anchorDate, targetDate);
  const anchorGlobal = getGlobalChapter(appConfig.anchorBookId, appConfig.anchorChapter);
  const count = appConfig.dailyChapters || 3;
  const startGlobal = anchorGlobal + (diffDays * count);

  return getConsecutiveChapters(startGlobal, count);
}

/**
 * 전체 화면 렌더링
 */
function renderDailyContent() {
  // 1. 헤더 브랜딩
  const titleEl = document.getElementById("header-app-title");
  if (titleEl) {
    titleEl.innerText = `${appConfig.churchName} ${appConfig.groupName} 매일 성경 읽기`;
  }
  const leaderBadgeEl = document.getElementById("header-leader-badge");
  if (leaderBadgeEl) {
    leaderBadgeEl.innerText = appConfig.leaderName;
  }

  // 2. 날짜 관련 텍스트
  const dateKey = formatDateKey(selectedDate);
  const korDateStr = formatKoreanDate(selectedDate);
  const dateDisplayEl = document.getElementById("current-date-title");
  if (dateDisplayEl) dateDisplayEl.innerText = korDateStr;

  const dateInputEl = document.getElementById("date-picker-input");
  if (dateInputEl) dateInputEl.value = dateKey;

  // D-Day / 오늘 배너 판별
  const today = new Date();
  const isToday = formatDateKey(today) === dateKey;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = formatDateKey(tomorrow) === dateKey;

  const badgeEl = document.getElementById("date-status-badge");
  if (badgeEl) {
    if (isToday) {
      badgeEl.className = "date-badge badge-today";
      badgeEl.innerText = "오늘 말씀";
    } else if (isTomorrow) {
      badgeEl.className = "date-badge badge-tomorrow";
      badgeEl.innerText = "내일 본문 (미리보기)";
    } else {
      const diff = getDayDiff(formatDateKey(today), selectedDate);
      badgeEl.className = "date-badge badge-other";
      badgeEl.innerText = diff > 0 ? `${diff}일 후` : `${Math.abs(diff)}일 전`;
    }
  }

  // 3. 본문 3장 계산 및 데이터 생성
  const chaptersList = getPassageForDate(selectedDate);
  const passagePkg = generateDailyPassagePackage(chaptersList);

  // 본문 요약 카드 렌더링
  const passageTitleEl = document.getElementById("passage-range-title");
  if (passageTitleEl) passageTitleEl.innerText = passagePkg.passageTitle;

  const chapterPillsEl = document.getElementById("chapter-pills-container");
  if (chapterPillsEl) {
    chapterPillsEl.innerHTML = chaptersList.map(ch => `
      <span class="chapter-pill">
        📖 ${ch.book.name} ${ch.chapter}장
      </span>
    `).join("");
  }

  // 각 장 요약 리스트
  const summaryListEl = document.getElementById("summary-items-list");
  if (summaryListEl) {
    summaryListEl.innerHTML = passagePkg.chapterDetails.map(c => `
      <div class="summary-item-card">
        <div class="summary-item-header">
          <span class="summary-badge">${c.bookName} ${c.chapter}장</span>
          <span class="summary-title">${c.title}</span>
        </div>
        <p class="summary-desc">${c.summary}</p>
      </div>
    `).join("");
  }

  // 4. 카카오톡 메시지 텍스트 조립
  currentMessageText = buildKakaoMessage(passagePkg, korDateStr);
  const msgTextareaEl = document.getElementById("kakao-preview-textarea");
  if (msgTextareaEl) {
    msgTextareaEl.value = currentMessageText;
  }

  // 5. 구역원 완독 체크보드 렌더링
  renderMemberCheckboard(dateKey);
}

/**
 * 카카오톡 복사용 텍스트 조립 (스타일별)
 */
function buildKakaoMessage(passagePkg, korDateStr) {
  const style = appConfig.templateStyle || "grace";
  const church = appConfig.churchName;
  const group = appConfig.groupName;

  if (style === "simple") {
    return [
      `⚡ [${church} ${group}] 오늘의 성경 통독 릴레이!`,
      `────────────────────`,
      `📅 일시: ${korDateStr}`,
      `📖 본문: ${passagePkg.passageTitle} (${passagePkg.chaptersCount}장)`,
      ``,
      `🎯 통독 완료 미션:`,
      `오늘 말씀을 모두 읽으신 분은 단톡방에 "완독!" 또는 "아멘" 답글을 남겨주세요!`,
      `말씀과 함께 은혜 가득한 하루 되세요! 샬롬! 🙌`,
      `────────────────────`
    ].join("\n");
  }

  if (style === "warm") {
    return [
      `☀️ 샬롬! 사랑하는 ${church} ${group} 식구 여러분,`,
      `은혜롭고 평안한 새 아침입니다.`,
      ``,
      `🗓️ ${korDateStr}`,
      `오늘 우리가 함께 마음에 새길 생명의 말씀은`,
      `【${passagePkg.passageTitle}】입니다.`,
      ``,
      `오늘 하루도 주님의 선하신 인도하심을 의지하며 담대히 승리하시길 축복합니다.`,
      `말씀을 읽으신 성도님은 편안한 마음으로 '아멘' 또는 '완독'으로 화답해 주세요! 사랑하고 축복합니다. 🕊️`
    ].join("\n");
  }

  // 기본형: grace (은혜 나눔형 - 권장 표준)
  const summaries = passagePkg.chapterDetails.map(c => `• [${c.bookName} ${c.chapter}장] ${c.summary}`).join("\n");

  return [
    `🌿 [${church} ${group}] 매일 성경 읽기`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `🗓️ 날짜: ${korDateStr}`,
    `📖 본문: ${passagePkg.passageTitle}`,
    ``,
    `[📌 오늘의 핵심 요약]`,
    summaries,
    ``,
    `[🕊️ 나눔 & 완독 인증]`,
    `오늘도 주의 말씀 안에서 영육이 강건하고 승리하는 복된 날 되시기를 축복합니다!`,
    `말씀을 읽으신 성도님은 단톡방에 '아멘' 또는 '완독'으로 은혜의 응답을 나누어 주세요! 🙏`,
    `━━━━━━━━━━━━━━━━━━━━`
  ].join("\n");
}

/**
 * 카카오톡 클립보드 원클릭 복사 기능
 */
function copyKakaoMessage() {
  const textarea = document.getElementById("kakao-preview-textarea");
  const textToCopy = textarea ? textarea.value : currentMessageText;

  if (!navigator.clipboard) {
    // 대체 복사 방식
    try {
      if (textarea) {
        textarea.select();
        document.execCommand("copy");
        showToast("📋 카톡 메시지가 복사되었습니다! 카톡에 붙여넣기(Ctrl+V) 하세요.");
        triggerCopySuccessAnimation();
        return;
      }
    } catch (err) {
      alert("복사에 실패했습니다. 텍스트를 직접 복사해 주세요.");
      return;
    }
  }

  navigator.clipboard.writeText(textToCopy).then(() => {
    showToast("📋 카톡 메시지가 복사되었습니다! 카톡창에서 바로 붙여넣기(Ctrl+V) 하세요.");
    triggerCopySuccessAnimation();
  }).catch(err => {
    console.error("클립보드 에러:", err);
    if (textarea) {
      textarea.select();
      document.execCommand("copy");
      showToast("📋 복사되었습니다! 카톡창에 붙여넣으세요.");
      triggerCopySuccessAnimation();
    }
  });
}

function triggerCopySuccessAnimation() {
  const btn = document.getElementById("btn-copy-kakao");
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
 * 모바일 카카오톡 / 외부 앱 공유 (Web Share API)
 */
function shareKakaoDirect() {
  const textarea = document.getElementById("kakao-preview-textarea");
  const textToShare = textarea ? textarea.value : currentMessageText;

  if (navigator.share) {
    navigator.share({
      title: `${appConfig.churchName} ${appConfig.groupName} 매일 성경 읽기`,
      text: textToShare
    }).catch(err => {
      if (err.name !== 'AbortError') {
        copyKakaoMessage();
      }
    });
  } else {
    // Web Share를 지원하지 않는 환경에서는 즉시 클립보드 복사
    copyKakaoMessage();
  }
}

/**
 * 구역원 완독 체크보드 렌더링
 */
function renderMemberCheckboard(dateKey) {
  const boardEl = document.getElementById("member-checklist-grid");
  if (!boardEl) return;

  const currentChecklist = dailyChecklists[dateKey] || {};
  const members = appConfig.members || [];

  const checkedCount = members.filter(m => !!currentChecklist[m.id]).length;
  const countEl = document.getElementById("checklist-count-display");
  if (countEl) {
    countEl.innerText = `${checkedCount} / ${members.length}명 완독`;
  }

  boardEl.innerHTML = members.map(m => {
    const isChecked = !!currentChecklist[m.id];
    return `
      <button type="button" 
        class="member-check-chip ${isChecked ? 'checked' : ''}" 
        onclick="toggleMemberCheck(${m.id})">
        <span class="chip-avatar">${m.name[0]}</span>
        <span class="chip-name">${m.name}</span>
        <span class="chip-icon">${isChecked ? '✓' : '+'}</span>
      </button>
    `;
  }).join("");
}

function toggleMemberCheck(memberId) {
  const dateKey = formatDateKey(selectedDate);
  if (!dailyChecklists[dateKey]) {
    dailyChecklists[dateKey] = {};
  }

  dailyChecklists[dateKey][memberId] = !dailyChecklists[dateKey][memberId];
  saveChecklists();
  renderMemberCheckboard(dateKey);

  const member = appConfig.members.find(m => m.id === memberId);
  const status = dailyChecklists[dateKey][memberId] ? "완독 체크됨" : "체크 해제됨";
  showToast(`${member ? member.name : ''} 성도님 ${status}`);
}

/**
 * 날짜 탐색 함수들
 */
function updateDateDisplay() {
  const dateKey = formatDateKey(selectedDate);
  const dateInput = document.getElementById("date-picker-input");
  if (dateInput) dateInput.value = dateKey;
}

function changeDateByOffset(offset) {
  selectedDate.setDate(selectedDate.getDate() + offset);
  updateDateDisplay();
  renderDailyContent();
}

function goToToday() {
  selectedDate = new Date();
  updateDateDisplay();
  renderDailyContent();
}

function goToTomorrow() {
  selectedDate = new Date();
  selectedDate.setDate(selectedDate.getDate() + 1);
  updateDateDisplay();
  renderDailyContent();
}

function handleDateChange(event) {
  const newDateVal = event.target.value;
  if (!newDateVal) return;
  const parts = newDateVal.split("-").map(Number);
  selectedDate = new Date(parts[0], parts[1] - 1, parts[2]);
  renderDailyContent();
}

function changeTemplateStyle(styleName) {
  appConfig.templateStyle = styleName;
  saveConfig();

  // 탭 스타일 액티브 클래스 업데이트
  document.querySelectorAll(".template-pill-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.style === styleName);
  });

  renderDailyContent();
  showToast(`템플릿이 '${getTemplateName(styleName)}'으로 변경되었습니다.`);
}

function getTemplateName(style) {
  if (style === "simple") return "심플 챌린지형";
  if (style === "warm") return "따뜻한 아침형";
  return "은혜 나눔형";
}

/**
 * 설정 모달 열기 및 저장
 */
function openSettingsModal() {
  const modal = document.getElementById("modal-settings");
  if (!modal) return;

  // 값 채우기
  document.getElementById("cfg-church-name").value = appConfig.churchName || "";
  document.getElementById("cfg-group-name").value = appConfig.groupName || "";
  document.getElementById("cfg-leader-name").value = appConfig.leaderName || "";
  document.getElementById("cfg-anchor-date").value = appConfig.anchorDate || "2026-09-28";
  
  // 성경 권 셀렉트박스 채우기
  const bookSelect = document.getElementById("cfg-anchor-book");
  if (bookSelect) {
    bookSelect.innerHTML = BIBLE_BOOKS.map(b => `
      <option value="${b.id}" ${b.id === appConfig.anchorBookId ? 'selected' : ''}>
        ${b.testament === 'OT' ? '[구약]' : '[신약]'} ${b.name} (${b.chapters}장)
      </option>
    `).join("");
  }

  document.getElementById("cfg-anchor-chapter").value = appConfig.anchorChapter || 1;
  document.getElementById("cfg-daily-chapters").value = appConfig.dailyChapters || 3;

  // 구역원 명단
  const memberListText = (appConfig.members || []).map(m => `${m.name} ${m.role}`).join("\n");
  document.getElementById("cfg-members-text").value = memberListText;

  modal.classList.add("open");
}

function closeSettingsModal() {
  const modal = document.getElementById("modal-settings");
  if (modal) modal.classList.remove("open");
}

function saveSettingsFromModal() {
  appConfig.churchName = document.getElementById("cfg-church-name").value.trim() || "언약교회";
  appConfig.groupName = document.getElementById("cfg-group-name").value.trim() || "4구역";
  appConfig.leaderName = document.getElementById("cfg-leader-name").value.trim() || "구역장";
  appConfig.anchorDate = document.getElementById("cfg-anchor-date").value || "2026-09-28";
  appConfig.anchorBookId = parseInt(document.getElementById("cfg-anchor-book").value) || 11;
  appConfig.anchorChapter = parseInt(document.getElementById("cfg-anchor-chapter").value) || 10;
  appConfig.dailyChapters = parseInt(document.getElementById("cfg-daily-chapters").value) || 3;

  // 구역원 목록 파싱
  const lines = document.getElementById("cfg-members-text").value.split("\n");
  const newMembers = [];
  let idAcc = 1;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(/\s+/);
    const name = parts[0];
    const role = parts[1] || "성도";
    newMembers.push({ id: idAcc++, name, role });
  }

  if (newMembers.length > 0) {
    appConfig.members = newMembers;
  }

  saveConfig();
  closeSettingsModal();
  renderDailyContent();
  showToast("⚙️ 설정이 안전하게 저장되었습니다.");
}

/**
 * 간편 본문 직접 조정 모달
 */
function openQuickAdjustModal() {
  const modal = document.getElementById("modal-quick-adjust");
  if (!modal) return;

  const chaptersList = getPassageForDate(selectedDate);
  const first = chaptersList[0];

  const bookSelect = document.getElementById("quick-book-select");
  if (bookSelect) {
    bookSelect.innerHTML = BIBLE_BOOKS.map(b => `
      <option value="${b.id}" ${b.id === first.book.id ? 'selected' : ''}>
        ${b.name} (${b.chapters}장)
      </option>
    `).join("");
  }

  const chInput = document.getElementById("quick-chapter-input");
  if (chInput) chInput.value = first.chapter;

  document.getElementById("quick-target-date-label").innerText = formatKoreanDate(selectedDate);

  modal.classList.add("open");
}

function closeQuickAdjustModal() {
  const modal = document.getElementById("modal-quick-adjust");
  if (modal) modal.classList.remove("open");
}

function applyQuickAdjust() {
  const bookId = parseInt(document.getElementById("quick-book-select").value);
  const chapter = parseInt(document.getElementById("quick-chapter-input").value);

  // 선택된 날짜를 새로운 기준일(anchorDate)로 설정
  appConfig.anchorDate = formatDateKey(selectedDate);
  appConfig.anchorBookId = bookId;
  appConfig.anchorChapter = chapter;

  saveConfig();
  closeQuickAdjustModal();
  renderDailyContent();
  showToast(`📖 ${formatKoreanDate(selectedDate)} 본문이 수정되었습니다.`);
}

/**
 * 토스트 메시지 알림
 */
function showToast(msg) {
  let toastEl = document.getElementById("app-toast");
  if (!toastEl) {
    toastEl = document.createElement("div");
    toastEl.id = "app-toast";
    toastEl.className = "toast-message";
    document.body.appendChild(toastEl);
  }

  toastEl.innerText = msg;
  toastEl.classList.add("show");

  if (toastEl.timeoutId) clearTimeout(toastEl.timeoutId);
  toastEl.timeoutId = setTimeout(() => {
    toastEl.classList.remove("show");
  }, 2800);
}

/**
 * 이벤트 바인딩
 */
function bindUIEvents() {
  const dateInput = document.getElementById("date-picker-input");
  if (dateInput) dateInput.addEventListener("change", handleDateChange);

  // 템플릿 필 버튼들
  document.querySelectorAll(".template-pill-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      changeTemplateStyle(btn.dataset.style);
    });
  });

  // ESC 키로 모달 닫기
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeSettingsModal();
      closeQuickAdjustModal();
    }
  });
}
