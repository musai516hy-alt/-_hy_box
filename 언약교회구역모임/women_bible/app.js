/**
 * 원미언약교회 여성 성도 매일 성경 읽기 & 카카오톡 메시지 원클릭 생성기
 * - 구약 순차 통독 (하루 3장: 이사야부터 전권)
 * - 신약 집중 로테이션 통독 (하루 2장: 로마서 1~16장 무한 순환)
 */

const CONFIG_STORAGE_KEY = 'women_bible_app_config_v1';
const CHECKLIST_STORAGE_KEY = 'women_bible_checklist_v1';

// 기본 환경 설정
const DEFAULT_CONFIG = {
  churchName: "원미언약교회",
  groupName: "여성 성도",
  leaderName: "여성도 모임",
  // 기준일: 2026-09-28 (월)
  // Track 1 (구약): 이사야 14장 (14~16장)
  track1AnchorDate: "2026-09-28",
  track1BookId: 23, // 이사야
  track1Chapter: 14,
  track1Count: 3,

  // Track 2 (로마서): 로마서 12장 (12~13장)
  track2AnchorDate: "2026-09-28",
  track2Chapter: 12,
  track2Count: 2,

  templateStyle: "grace", // 'grace' (은혜나눔형), 'simple' (심플형), 'warm' (따뜻한아침형)
  members: [
    { id: 1, name: "손혜영", role: "성도" },
    { id: 2, name: "권가람", role: "성도" },
    { id: 3, name: "모점례", role: "성도" },
    { id: 4, name: "이경숙", role: "성도" },
    { id: 5, name: "손영란", role: "성도" },
    { id: 6, name: "권수아", role: "성도" },
    { id: 7, name: "육선경", role: "성도" }
  ]
};

let appConfig = null;
let selectedDate = new Date();
let dailyChecklists = {};
let currentMessageText = "";

document.addEventListener("DOMContentLoaded", () => {
  initWomenBibleApp();
});

function initWomenBibleApp() {
  loadConfig();
  loadChecklists();

  selectedDate = new Date();

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

function formatDateKey(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, "0");
  const d = String(dateObj.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatKoreanDate(dateObj) {
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const y = dateObj.getFullYear();
  const m = dateObj.getMonth() + 1;
  const d = dateObj.getDate();
  const dayName = dayNames[dateObj.getDay()];
  return `${y}년 ${m}월 ${d}일 (${dayName})`;
}

function getDayDiff(date1Str, date2Obj) {
  const parts = date1Str.split("-").map(Number);
  const d1 = new Date(parts[0], parts[1] - 1, parts[2]);
  const d2 = new Date(date2Obj.getFullYear(), date2Obj.getMonth(), date2Obj.getDate());
  
  const diffTime = d2.getTime() - d1.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 선택된 날짜의 두 가지 트랙 본문 계산
 */
function getPassagesForDate(targetDate) {
  const diffDays = getDayDiff(appConfig.track1AnchorDate, targetDate);

  // Track 1: 순차 통독 (기본 이사야 14장부터 3장씩)
  const track1AnchorGlobal = getGlobalChapter(appConfig.track1BookId, appConfig.track1Chapter);
  const track1Count = appConfig.track1Count || 3;
  const track1StartGlobal = track1AnchorGlobal + (diffDays * track1Count);
  const track1Chapters = getTrack1Chapters(track1StartGlobal, track1Count);
  const track1Title = formatPassageRange(track1Chapters);

  // Track 2: 로마서 순환 통독 (기본 로마서 12장부터 2장씩 무한 순환)
  const track2Count = appConfig.track2Count || 2;
  const track2Chapters = getRomansRotationChapters(appConfig.track2Chapter, diffDays, track2Count);
  const track2Title = formatPassageRange(track2Chapters);

  return {
    track1: {
      title: track1Title,
      chapters: track1Chapters,
      details: track1Chapters.map(c => getChapterInfo(c.book.name, c.chapter))
    },
    track2: {
      title: track2Title,
      chapters: track2Chapters,
      details: track2Chapters.map(c => getChapterInfo(c.book.name, c.chapter))
    }
  };
}

/**
 * 화면 렌더링
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

  // 2. 날짜
  const dateKey = formatDateKey(selectedDate);
  const korDateStr = formatKoreanDate(selectedDate);
  const dateDisplayEl = document.getElementById("current-date-title");
  if (dateDisplayEl) dateDisplayEl.innerText = korDateStr;

  const dateInputEl = document.getElementById("date-picker-input");
  if (dateInputEl) dateInputEl.value = dateKey;

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

  // 3. 본문 계산
  const passages = getPassagesForDate(selectedDate);

  // 본문 하이라이트 배너 렌더링 (2개 트랙)
  const track1TitleEl = document.getElementById("track1-range-title");
  if (track1TitleEl) track1TitleEl.innerText = passages.track1.title;

  const track2TitleEl = document.getElementById("track2-range-title");
  if (track2TitleEl) track2TitleEl.innerText = `${passages.track2.title} 함께 읽기`;

  const track1PillsEl = document.getElementById("track1-pills-container");
  if (track1PillsEl) {
    track1PillsEl.innerHTML = passages.track1.chapters.map(ch => `
      <span class="chapter-pill">📜 ${ch.book.name} ${ch.chapter}장</span>
    `).join("");
  }

  const track2PillsEl = document.getElementById("track2-pills-container");
  if (track2PillsEl) {
    track2PillsEl.innerHTML = passages.track2.chapters.map(ch => `
      <span class="chapter-pill pill-romans">🕊️ ${ch.book.name} ${ch.chapter}장</span>
    `).join("");
  }

  // 각 장 요약 리스트 (구약 순차 + 로마서 집중)
  const summaryListEl = document.getElementById("summary-items-list");
  if (summaryListEl) {
    const track1Html = passages.track1.details.map(c => `
      <div class="summary-item-card">
        <div class="summary-item-header">
          <span class="summary-badge">${c.bookName} ${c.chapter}장</span>
          <span class="summary-title">${c.title}</span>
        </div>
        <p class="summary-desc">${c.summary}</p>
      </div>
    `).join("");

    const track2Html = passages.track2.details.map(c => `
      <div class="summary-item-card card-romans">
        <div class="summary-item-header">
          <span class="summary-badge badge-romans">${c.bookName} ${c.chapter}장</span>
          <span class="summary-title">${c.title}</span>
        </div>
        <p class="summary-desc">${c.summary}</p>
      </div>
    `).join("");

    summaryListEl.innerHTML = `
      <div class="track-divider"><span>📜 구약 순차 통독 (하루 3장)</span></div>
      ${track1Html}
      <div class="track-divider divider-romans" style="margin-top: 14px;"><span>🕊️ 신약 로마서 로테이션 (하루 2장)</span></div>
      ${track2Html}
    `;
  }

  // 4. 카카오톡 메시지 텍스트 조립
  currentMessageText = buildKakaoMessage(passages, korDateStr);
  const msgTextareaEl = document.getElementById("kakao-preview-textarea");
  if (msgTextareaEl) {
    msgTextareaEl.value = currentMessageText;
  }

  // 5. 완독 체크보드
  renderMemberCheckboard(dateKey);
}

/**
 * 카카오톡 복사용 텍스트 조립
 */
function buildKakaoMessage(passages, korDateStr) {
  const style = appConfig.templateStyle || "grace";
  const church = appConfig.churchName;
  const group = appConfig.groupName;

  const t1 = passages.track1;
  const t2 = passages.track2;

  const t1Summaries = t1.details.map(c => `• [${c.bookName} ${c.chapter}장] ${c.summary}`).join("\n");
  const t2Summaries = t2.details.map(c => `• [${c.bookName} ${c.chapter}장] ${c.summary}`).join("\n");

  if (style === "simple") {
    return [
      `⚡ [${church} ${group}] 오늘의 성경 통독 릴레이!`,
      `────────────────────`,
      `📅 일시: ${korDateStr}`,
      `📖 오늘의 말씀:`,
      `• ${t1.title} (순차 통독 3장)`,
      `• ${t2.title} 함께 읽습니다 (로마서 2장)`,
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
      `오늘 우리가 함께 마음에 새길 생명의 말씀입니다.`,
      `【${t1.title}】`,
      `【${t2.title} 함께 읽습니다】`,
      ``,
      `오늘 하루도 주님의 선하신 인도하심을 의지하며 담대히 승리하시길 축복합니다.`,
      `말씀을 읽으신 성도님은 편안한 마음으로 '아멘' 또는 '완독'으로 화답해 주세요! 사랑하고 축복합니다. 🕊️`
    ].join("\n");
  }

  // 기본형: grace (은혜 나눔형 - 권장 표준)
  return [
    `🌿 [${church} ${group}] 매일 성경 읽기`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `🗓️ 날짜: ${korDateStr}`,
    `📖 오늘의 본문 말씀:`,
    `• ${t1.title}입니다.`,
    `• ${t2.title} 함께 읽습니다.`,
    ``,
    `[📌 오늘의 핵심 요약]`,
    `【${t1.title}】`,
    t1Summaries,
    ``,
    `【${t2.title}】`,
    t2Summaries,
    ``,
    `[🕊️ 나눔 & 완독 인증]`,
    `오늘도 주의 말씀 안에서 영육이 강건하고 은혜 충만한 복된 날 되시기를 축복합니다!`,
    `말씀을 읽으신 성도님은 단톡방에 '아멘' 또는 '완독'으로 은혜의 응답을 나누어 주세요! 🙏`,
    `━━━━━━━━━━━━━━━━━━━━`
  ].join("\n");
}

function copyKakaoMessage() {
  const textarea = document.getElementById("kakao-preview-textarea");
  const textToCopy = textarea ? textarea.value : currentMessageText;

  if (!navigator.clipboard) {
    try {
      if (textarea) {
        textarea.select();
        document.execCommand("copy");
        showToast("📋 카톡 메시지가 복사되었습니다! 카톡창에 바로 붙여넣기(Ctrl+V) 하세요.");
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
    copyKakaoMessage();
  }
}

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

  document.querySelectorAll(".template-pill-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.style === styleName);
  });

  renderDailyContent();
  showToast(`템플릿이 '${getTemplateName(styleName)}'으로 변경되었습니다.`);
}

function getTemplateName(style) {
  if (style === "simple") return "심플형";
  if (style === "warm") return "따뜻한 아침형";
  return "은혜 나눔형";
}

function openSettingsModal() {
  const modal = document.getElementById("modal-settings");
  if (!modal) return;

  document.getElementById("cfg-church-name").value = appConfig.churchName || "";
  document.getElementById("cfg-group-name").value = appConfig.groupName || "";
  document.getElementById("cfg-leader-name").value = appConfig.leaderName || "";
  document.getElementById("cfg-t1-date").value = appConfig.track1AnchorDate || "2026-09-28";
  
  const bookSelect = document.getElementById("cfg-t1-book");
  if (bookSelect) {
    bookSelect.innerHTML = BIBLE_BOOKS.map(b => `
      <option value="${b.id}" ${b.id === appConfig.track1BookId ? 'selected' : ''}>
        ${b.testament === 'OT' ? '[구약]' : '[신약]'} ${b.name} (${b.chapters}장)
      </option>
    `).join("");
  }

  document.getElementById("cfg-t1-chapter").value = appConfig.track1Chapter || 14;
  document.getElementById("cfg-t2-chapter").value = appConfig.track2Chapter || 12;

  const memberListText = (appConfig.members || []).map(m => `${m.name} ${m.role}`).join("\n");
  document.getElementById("cfg-members-text").value = memberListText;

  modal.classList.add("open");
}

function closeSettingsModal() {
  const modal = document.getElementById("modal-settings");
  if (modal) modal.classList.remove("open");
}

function saveSettingsFromModal() {
  appConfig.churchName = document.getElementById("cfg-church-name").value.trim() || "원미언약교회";
  appConfig.groupName = document.getElementById("cfg-group-name").value.trim() || "여성 성도";
  appConfig.leaderName = document.getElementById("cfg-leader-name").value.trim() || "여성도 모임";
  appConfig.track1AnchorDate = document.getElementById("cfg-t1-date").value || "2026-09-28";
  appConfig.track1BookId = parseInt(document.getElementById("cfg-t1-book").value) || 23;
  appConfig.track1Chapter = parseInt(document.getElementById("cfg-t1-chapter").value) || 14;
  appConfig.track2Chapter = parseInt(document.getElementById("cfg-t2-chapter").value) || 12;

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

function bindUIEvents() {
  const dateInput = document.getElementById("date-picker-input");
  if (dateInput) dateInput.addEventListener("change", handleDateChange);

  document.querySelectorAll(".template-pill-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      changeTemplateStyle(btn.dataset.style);
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeSettingsModal();
    }
  });
}
