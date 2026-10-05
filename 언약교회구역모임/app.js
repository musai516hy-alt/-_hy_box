// 언약교회 4구역 목양 수첩 메인 애플리케이션 스크립트

const STORAGE_KEY = 'covenant_church_district4_v2';

// 초기 기본 데이터 (언약교회구역모임 범용 기본값)
const DEFAULT_DATA = {
  appName: "언약교회구역모임",
  leaderName: "손혜영 구역장님",
  districtName: "언약교회 4구역",
  meeting: {
    title: "구역 모임",
    datetime: "2026-09-20T14:00",
    location: "교회예배당",
    memo: "모임 후 다과 및 중보기도 나눔 시간 준비",
    noMeeting: false
  },
  members: [
    { id: 1, name: "손혜영", role: "구역장", attended: true, weeklyPassage: "열왕기상 10-12장", weeklyChapters: 3, totalAccumulated: 303, prayers: [], isMentoringTarget: false },
    { id: 2, name: "권가람", role: "부구역장", attended: true, weeklyPassage: "열왕기상 10-12장", weeklyChapters: 3, totalAccumulated: 303, prayers: [], isMentoringTarget: false },
    { id: 3, name: "모점례", role: "구역원", attended: true, weeklyPassage: "열왕기상 10-12장", weeklyChapters: 3, totalAccumulated: 303, prayers: [], isMentoringTarget: false },
    { id: 4, name: "이경숙", role: "구역원", attended: true, weeklyPassage: "열왕기상 10-12장", weeklyChapters: 3, totalAccumulated: 303, prayers: [], isMentoringTarget: false },
    { id: 5, name: "손영란", role: "구역원", attended: true, weeklyPassage: "열왕기상 10-12장", weeklyChapters: 3, totalAccumulated: 303, prayers: [], isMentoringTarget: false },
    { id: 6, name: "권수아", role: "구역원", attended: true, weeklyPassage: "열왕기상 10-12장", weeklyChapters: 3, totalAccumulated: 303, prayers: [], isMentoringTarget: false },
    { id: 7, name: "육선경", role: "구역원", attended: true, weeklyPassage: "열왕기상 10-12장", weeklyChapters: 3, totalAccumulated: 303, prayers: [], isMentoringTarget: false }
  ],
  reportHeader: "샬롬! 목사님, 이번 주 구역 사역 및 모임 결과를 보고드립니다.",
  reportFooter: "구역 식구들 모두 말씀과 기도로 든든히 세워져 가고 있습니다. 목사님의 영육 강건하심을 위해 기도합니다.",
  customNotes: ""
};

let appData = null;

function initApp() {
  loadData();
  renderAll();
  bindEvents();
  if (typeof initDailyBibleModule === 'function') {
    initDailyBibleModule();
  }
}

function loadData() {
  try {
    if (localStorage.getItem('covenant_church_district4_v1')) {
      localStorage.removeItem('covenant_church_district4_v1');
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      appData = JSON.parse(saved);
      let needsSave = false;
      if (appData.meeting) {
        if (appData.meeting.title) {
          const cleaned = appData.meeting.title
            .replace(/구역\s*(?:예배|교제)/g, '구역모임')
            .replace(/정기\s*/g, '')
            .trim();
          if (cleaned !== appData.meeting.title) {
            appData.meeting.title = cleaned;
            needsSave = true;
          }
        }
        if (!appData.meeting.location || appData.meeting.location === "구역 모임 장소 (추후 공지)" || appData.meeting.location === "미정") {
          appData.meeting.location = "교회예배당";
          needsSave = true;
        }
      }
      if (!appData.members || !Array.isArray(appData.members) || appData.members.length === 0) {
        appData.members = JSON.parse(JSON.stringify(DEFAULT_DATA.members));
        needsSave = true;
      }
      if (appData.members && Array.isArray(appData.members)) {
        appData.members.forEach(m => {
          if (!m.nextMentoringLocation || m.nextMentoringLocation === "교회 카페 로뎀" || m.nextMentoringLocation === "미정") {
            m.nextMentoringLocation = "교회예배당";
            needsSave = true;
          }
          if (m.mentoringCourse === "일대일 제자양육" || m.mentoringCourse === "일대일 제자양육 성경공부") {
            m.mentoringCourse = "성경 말씀";
            needsSave = true;
          }
        });
      }
      if (needsSave) {
        saveData();
      }
    } else {
      appData = JSON.parse(JSON.stringify(DEFAULT_DATA));
      saveData();
    }
  } catch (e) {
    console.error("데이터 로드 실패:", e);
    appData = JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
}

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
  } catch (e) {
    console.error("데이터 저장 실패:", e);
  }
}

function renderAll() {
  renderHeaderAndHero();
  renderHomeSummary();
  renderReadingTab();
  renderPrayerTab();
  renderMentoringTab();
  renderReportTab();
  renderMemberManageTab();
}

function calculateDDay(targetDateStr) {
  if (!targetDateStr) return { text: "미정", days: 999 };
  const target = new Date(targetDateStr);
  const now = new Date();
  
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = targetDay.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return { text: "D-Day (오늘)", days: 0 };
  if (diffDays > 0) return { text: `D-${diffDays}`, days: diffDays };
  return { text: `D+${Math.abs(diffDays)}`, days: diffDays };
}

function renderHeaderAndHero() {
  // 1. 헤더 및 인쇄용 타이틀 동적 반영
  const brandTitleEl = document.getElementById('app-brand-title');
  if (brandTitleEl) brandTitleEl.innerText = appData.appName || "언약교회구역모임";

  const headerLeaderEl = document.getElementById('header-leader-name');
  if (headerLeaderEl) headerLeaderEl.innerText = appData.leaderName || "구역장님";

  const headerDistrictEl = document.getElementById('header-district-name');
  if (headerDistrictEl) headerDistrictEl.innerText = appData.districtName || "언약교회 구역";

  const printTitleEl = document.getElementById('print-report-title');
  if (printTitleEl) printTitleEl.innerText = `${appData.districtName || "언약교회 구역"} 주간 사역 보고서`;

  const printLeaderEl = document.getElementById('print-report-leader');
  if (printLeaderEl) printLeaderEl.innerText = appData.leaderName || "구역장";

  // 2. 홈 히어로 배너 D-Day 및 모임 정보 반영
  const isNoMeeting = !!(appData.meeting && appData.meeting.noMeeting);
  const pillEl = document.getElementById('hero-dday-pill');
  const meetInfoEl = document.getElementById('hero-meeting-info');

  if (isNoMeeting) {
    if (pillEl) {
      pillEl.innerHTML = `<span style="color: #FFE4B5;">모임없음</span> <small>이번 주</small>`;
      pillEl.style.background = "rgba(0, 0, 0, 0.3)";
      pillEl.style.border = "1px solid rgba(255, 255, 255, 0.3)";
    }
    if (meetInfoEl) {
      meetInfoEl.innerHTML = `
        <h2>이번 주 구역모임 없음</h2>
        <p>📍 <strong>안내:</strong> 이번 주는 구역모임이 없습니다.</p>
        <div class="dday-meta">
          <span class="dday-meta-item">🗓️ ${appData.meeting.title || "구역모임 없음"}</span>
        </div>
      `;
    }
  } else {
    const dday = calculateDDay(appData.meeting.datetime);
    if (pillEl) {
      pillEl.innerHTML = `${dday.text} <small>구역모임</small>`;
      pillEl.style.background = "";
      pillEl.style.border = "";
    }

    const meetingDate = new Date(appData.meeting.datetime);
    const formattedDate = isNaN(meetingDate) ? appData.meeting.datetime : 
      `${meetingDate.getFullYear()}년 ${meetingDate.getMonth()+1}월 ${meetingDate.getDate()}일 (${['일','월','화','수','목','금','토'][meetingDate.getDay()]}) ${String(meetingDate.getHours()).padStart(2,'0')}:${String(meetingDate.getMinutes()).padStart(2,'0')}`;

    if (meetInfoEl) {
      meetInfoEl.innerHTML = `
        <h2>${appData.meeting.title || '구역 모임'}</h2>
        <p>📍 <strong>장소:</strong> ${appData.meeting.location || '미정'}</p>
        <div class="dday-meta">
          <span class="dday-meta-item">🗓️ ${formattedDate}</span>
        </div>
      `;
    }
  }
}

function renderHomeSummary() {
  const weeklyTotal = appData.members.reduce((sum, m) => sum + (m.weeklyChapters || 0), 0);
  const weeklyTotalEl = document.getElementById('home-weekly-total-chapters');
  if (weeklyTotalEl) weeklyTotalEl.innerText = `${weeklyTotal}장`;

  const attendedCount = appData.members.filter(m => m.attended).length;
  const totalMembers = appData.members.length;
  const attendEl = document.getElementById('home-attendance-count');
  if (attendEl) attendEl.innerText = `${attendedCount}명 / ${totalMembers}명`;

  const activePrayers = appData.members.reduce((sum, m) => sum + (m.prayers ? m.prayers.filter(p => !p.answered).length : 0), 0);
  const prayersEl = document.getElementById('home-active-prayers-count');
  if (prayersEl) prayersEl.innerText = `${activePrayers}건`;

  const attendListEl = document.getElementById('home-attendance-list');
  if (attendListEl) {
    if (!appData.members || appData.members.length === 0) {
      attendListEl.innerHTML = `
        <div style="text-align: center; padding: 28px 16px; color: var(--text-muted); background: var(--bg-card-subtle); border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
          <p style="font-size: 0.95rem; margin-bottom: 8px;">아직 등록된 구역 식구가 없습니다.</p>
          <button class="btn btn-gold btn-sm" onclick="openAddMemberModal()">➕ 새 구역 식구 등록하기</button>
        </div>
      `;
    } else {
      attendListEl.innerHTML = appData.members.map(m => `
      <div class="member-row">
        <div class="member-info">
          <div class="member-avatar">${m.name[0]}</div>
          <div>
            <div class="member-name">${m.name} <span class="member-role">${m.role}</span></div>
            <small style="color: ${m.attended ? 'var(--sage-green)' : 'var(--rose-red)'};">
              ${m.attended ? '● 참석 예정' : `○ 결석 (${m.absenceReason || '사유 미기재'})`}
            </small>
          </div>
        </div>
        <button class="btn btn-sm ${m.attended ? 'btn-outline' : 'btn-sage'}" onclick="toggleAttendance(${m.id})">
          ${m.attended ? '결석 처리' : '참석 체크'}
        </button>
      </div>
    `).join('');
    }
  }
}

function toggleAttendance(memberId) {
  const member = appData.members.find(m => m.id === memberId);
  if (!member) return;

  if (member.attended) {
    const reason = prompt(`${member.name} ${member.role}님의 결석 사유를 입력해 주세요:`, member.absenceReason || "");
    if (reason !== null) {
      member.attended = false;
      member.absenceReason = reason.trim() || "개인 사정";
    }
  } else {
    member.attended = true;
    member.absenceReason = "";
  }
  saveData();
  renderAll();
  showToast(`${member.name} 님의 출석 상태가 업데이트되었습니다.`);
}

function getWeeklyDateRangeStr() {
  if (!appData.weeklyStartDate) {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay()); // Go to Sunday
    d.setHours(0,0,0,0);
    appData.weeklyStartDate = d.toISOString();
    if (typeof saveData === 'function') saveData();
  }
  const startDate = new Date(appData.weeklyStartDate);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);
  
  const fmt = (date) => `${date.getFullYear()}.${String(date.getMonth()+1).padStart(2,'0')}.${String(date.getDate()).padStart(2,'0')}(${['일','월','화','수','목','금','토'][date.getDay()]})`;
  
  return `이번 주 통독 기간: ${fmt(startDate)} ~ ${fmt(endDate)}`;
}

function resetWeeklyReading() {
  if (!confirm("목사님께 이번 주 구역 사역 보고를 완료하셨나요?\\n\\n'확인'을 누르시면 이번 주 통독 기간이 다음 주로 넘어가며, 모든 식구들의 '이번 주 통독 장수' 데이터가 0장으로 초기화됩니다.\\n(연간 누적 장수는 그대로 안전하게 유지됩니다)")) {
    return;
  }
  
  // Advance the week by 7 days
  const startDate = new Date(appData.weeklyStartDate);
  startDate.setDate(startDate.getDate() + 7);
  appData.weeklyStartDate = startDate.toISOString();
  
  // Reset all members' weekly chapters
  if (appData.members) {
    appData.members.forEach(m => {
      m.weeklyChapters = 0;
      m.weeklyPassage = "";
    });
  }
  
  if (typeof saveData === 'function') saveData();
  if (typeof renderAll === 'function') renderAll();
  showToast("다음 주로 통독 주간이 변경되었으며, 데이터가 초기화되었습니다.");
}

function renderReadingTab() {
  const weeklyTotal = appData.members.reduce((sum, m) => sum + (m.weeklyChapters || 0), 0);
  const districtTotal = appData.members.reduce((sum, m) => sum + (m.totalAccumulated || 0), 0);
  
  const weeklyEl = document.getElementById('reading-weekly-sum');
  if (weeklyEl) weeklyEl.innerText = `${weeklyTotal}장`;

  const totalEl = document.getElementById('reading-total-sum');
  if (totalEl) totalEl.innerText = `${districtTotal}장`;
  
  const dateRangeEl = document.getElementById('weekly-reading-date-range');
  if (dateRangeEl) {
    dateRangeEl.innerText = getWeeklyDateRangeStr();
  }

  const listEl = document.getElementById('reading-member-list');
  if (listEl) {
    if (!appData.members || appData.members.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; padding: 28px 16px; color: var(--text-muted); background: var(--bg-card-subtle); border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
          <p style="font-size: 0.95rem; margin-bottom: 8px;">등록된 구역 식구가 없습니다.</p>
          <button class="btn btn-gold btn-sm" onclick="openAddMemberModal()">➕ 새 구역 식구 등록하기</button>
        </div>
      `;
    } else {
      listEl.innerHTML = appData.members.map(m => {
      const percentage = Math.min(100, ((m.totalAccumulated / TOTAL_BIBLE_CHAPTERS) * 100)).toFixed(1);
      return `
        <div class="member-row" style="flex-direction: column; align-items: stretch; gap: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div class="member-info">
              <div class="member-avatar">${m.name[0]}</div>
              <div>
                <div class="member-name">${m.name} <span class="member-role">${m.role}</span></div>
                <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 2px;">
                  이번 주: <strong style="color: var(--primary);">${m.weeklyPassage || '미입력'}</strong>
                </div>
              </div>
            </div>
            <div class="member-stats">
              <span class="badge-chapters">+${m.weeklyChapters || 0}장</span>
              <button class="btn btn-outline btn-sm" style="margin-left: 8px;" onclick="openPassageEditModal(${m.id})">수정</button>
            </div>
          </div>
          <div>
            <div style="display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--text-muted);">
              <span>연간 1독 달성률 (총 1,189장 중 <strong>${m.totalAccumulated}장</strong>)</span>
              <strong>${percentage}%</strong>
            </div>
            <div class="progress-container">
              <div class="progress-bar-fill" style="width: ${percentage}%;"></div>
            </div>
          </div>
        </div>
      `;
    }).join('');
    }
  }
}

function renderPrayerTab() {
  const prayerListEl = document.getElementById('prayer-cards-container');
  const answeredListEl = document.getElementById('answered-prayers-container');

  // 구역원별로 진행 중인 기도제목 그룹핑
  const membersWithActivePrayers = appData.members.map(m => {
    const active = (m.prayers || []).filter(p => !p.answered);
    return { member: m, prayers: active };
  }).filter(item => item.prayers.length > 0);

  // 구역원별로 응답 완료된 기도제목 그룹핑
  const membersWithAnsweredPrayers = appData.members.map(m => {
    const answered = (m.prayers || []).filter(p => p.answered);
    return { member: m, prayers: answered };
  }).filter(item => item.prayers.length > 0);

  if (prayerListEl) {
    if (membersWithActivePrayers.length === 0) {
      prayerListEl.innerHTML = `
        <div style="text-align: center; padding: 36px; background: #fff; border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
          <p style="color: var(--text-muted); margin-bottom: 12px;">현재 등록된 중보 기도제목이 없습니다.</p>
          <button class="btn btn-gold btn-sm" onclick="openAddPrayerModal()">➕ 새 기도제목 등록하기</button>
        </div>
      `;
    } else {
      prayerListEl.innerHTML = membersWithActivePrayers.map(({ member: m, prayers }) => `
        <div class="card prayer-member-group-card" style="margin-bottom: 20px; border-left: 4px solid var(--accent-gold); padding: 18px 20px;">
          <div class="card-header" style="margin-bottom: 12px; padding-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.25rem;">🙏</span>
              <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--primary); margin: 0;">
                ${m.name} <span style="font-size: 0.82rem; color: var(--text-muted); font-weight: 500;">${m.role}</span>
              </h3>
              <span class="badge" style="background: var(--accent-gold-light); color: var(--accent-gold); border: 1px solid var(--accent-gold-border); padding: 2px 8px; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 700;">
                기도제목 ${prayers.length}개
              </span>
            </div>
            <button class="btn btn-outline btn-xs" onclick="openAddPrayerModal(${m.id})">
              ➕ 이 성도님 기도 추가
            </button>
          </div>

          <div class="prayer-subordinated-list" style="display: flex; flex-direction: column; gap: 10px;">
            ${prayers.map((p, idx) => `
              <div class="prayer-sub-item" style="background: var(--bg-card-subtle); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px 14px; position: relative;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                  <span style="font-size: 0.78rem; font-weight: 700; color: var(--accent-gold);">
                    기도제목 #${idx + 1} <span style="font-weight: normal; color: var(--text-muted); margin-left: 6px;">🗓️ ${p.date || ''}</span>
                  </span>
                  <div style="display: flex; gap: 6px;">
                    <button class="btn btn-outline btn-xs" onclick="openEditPrayerModal(${m.id}, ${p.id})" title="기도제목 수정">
                      ✏️ 수정
                    </button>
                    <button class="btn btn-sage btn-xs" onclick="markPrayerAnswered(${m.id}, ${p.id})" title="기도 응답 완료 처리">
                      ✨ 응답!
                    </button>
                    <button class="btn btn-outline btn-xs" style="color: var(--rose-red);" onclick="deletePrayer(${m.id}, ${p.id})" title="삭제">
                      🗑️ 삭제
                    </button>
                  </div>
                </div>
                <div style="font-size: 0.92rem; color: var(--text-main); line-height: 1.6; white-space: pre-wrap; padding-left: 2px;">
                  ${p.text}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('');
    }
  }

  if (answeredListEl) {
    if (membersWithAnsweredPrayers.length === 0) {
      answeredListEl.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 20px;">응답 완료된 기도 간증이 여기에 모입니다.</p>`;
    } else {
      answeredListEl.innerHTML = membersWithAnsweredPrayers.map(({ member: m, prayers }) => `
        <div class="card" style="margin-bottom: 16px; border-left: 4px solid var(--sage-green); background: var(--sage-green-light); padding: 16px;">
          <div class="card-header" style="margin-bottom: 10px; padding-bottom: 8px; border-color: var(--sage-green-border);">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 1.2rem;">🎉</span>
              <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--sage-green); margin: 0;">
                ${m.name} ${m.role} <small style="font-weight: 500; color: var(--text-muted);">(응답 완료 ${prayers.length}건)</small>
              </h3>
            </div>
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${prayers.map(p => `
              <div style="background: #fff; border: 1px solid var(--sage-green-border); border-radius: var(--radius-sm); padding: 10px 14px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <span style="font-size: 0.78rem; color: var(--text-muted);">🗓️ ${p.date || ''}</span>
                  <button class="btn btn-outline btn-xs" onclick="reopenPrayer(${m.id}, ${p.id})">
                    기도 중으로 되돌리기
                  </button>
                </div>
                <div style="font-size: 0.9rem; color: var(--text-main); line-height: 1.5; white-space: pre-wrap;">
                  ${p.text}
                </div>
                ${p.answeredNote ? `<div style="font-size: 0.82rem; color: var(--sage-green); font-weight: 600; margin-top: 6px; padding-top: 6px; border-top: 1px dashed var(--sage-green-border);">💌 은혜 나눔: ${p.answeredNote}</div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `).join('');
    }
  }
}

function markPrayerAnswered(memberId, prayerId) {
  const member = appData.members.find(m => m.id === memberId);
  if (!member) return;
  const prayer = member.prayers.find(p => p.id === prayerId);
  if (!prayer) return;

  const note = prompt("하나님께서 주신 응답의 기쁨이나 감사 한 줄 메모를 남겨주세요:", "");
  prayer.answered = true;
  prayer.answeredNote = note ? note.trim() : "응답 감사";
  saveData();
  renderAll();
  showToast(`🎉 ${member.name} 님의 기도가 응답 완료로 기록되었습니다!`);
}

function reopenPrayer(memberId, prayerId) {
  const member = appData.members.find(m => m.id === memberId);
  if (!member) return;
  const prayer = member.prayers.find(p => p.id === prayerId);
  if (!prayer) return;

  prayer.answered = false;
  delete prayer.answeredNote;
  saveData();
  renderAll();
  showToast("기도제목이 다시 진행 중으로 변경되었습니다.");
}

function deletePrayer(memberId, prayerId) {
  if (!confirm("이 기도제목을 삭제하시겠습니까?")) return;
  const member = appData.members.find(m => m.id === memberId);
  if (!member) return;
  member.prayers = member.prayers.filter(p => p.id !== prayerId);
  saveData();
  renderAll();
  showToast("기도제목이 삭제되었습니다.");
}

function renderMentoringTab() {
  const container = document.getElementById('mentoring-cards-container');
  if (!container) return;

  const mentorees = appData.members.filter(m => m.isMentoringTarget);

  if (mentorees.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; background: #fff; border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
        <p style="color: var(--text-muted); margin-bottom: 12px;">현재 일대일 성경공부 대상자로 지정된 구역원이 없습니다.</p>
        <button class="btn btn-gold" onclick="openMentoringTargetModal()">일대일 성경공부 대상 구역원 지정하기</button>
      </div>
    `;
    return;
  }

  container.innerHTML = mentorees.map(m => {
    return `
      <div class="mentor-card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="mentor-badge" style="background: var(--sky-blue); color: #fff; padding: 4px 10px; border-radius: 12px; font-size: 0.78rem; font-weight: 700;">일대일 성경공부</span>
              <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--primary);">${m.name} ${m.role}</h3>
            </div>
            <div style="font-size: 0.9rem; color: var(--accent-gold); font-weight: 600; margin-top: 6px;">
              📖 현재진도: <strong>${m.mentoringCourse || '미정'}</strong> / 다음진도: <strong>${m.mentoringLesson || '미정'}</strong>
            </div>
          </div>
        </div>

        <div style="background: var(--bg-card-subtle); padding: 12px 16px; border-radius: var(--radius-md); margin-bottom: 12px; font-size: 0.88rem;">
          <div>📝 <strong>기타사항:</strong> ${m.mentoringAssignment || '없음'}</div>
        </div>

        <div class="mentor-review-box">
          <div style="font-weight: 700; color: var(--accent-gold); margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
            💡 <span>직전 회차 핵심 나눔 복기 (만나기 5분 전 꼭 읽기)</span>
          </div>
          <div style="color: var(--text-main); line-height: 1.6;">${m.lastMentoringNote || '기록된 나눔 내용이 없습니다.'}</div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px;">
          <button class="btn btn-outline btn-sm" onclick="openMentoringEditModal(${m.id})">일정 및 진도 수정</button>
          <button class="btn btn-gold btn-sm" onclick="openMentoringLogModal(${m.id})">나눔 일지 작성</button>
        </div>
      </div>
    `;
  }).join('');
}

function generateReportText() {
  const isNoMeeting = !!(appData.meeting && appData.meeting.noMeeting);
  const meetingDate = new Date(appData.meeting.datetime);
  const dateFormatted = isNaN(meetingDate) ? appData.meeting.datetime : 
    `${meetingDate.getFullYear()}년 ${meetingDate.getMonth()+1}월 ${meetingDate.getDate()}일`;

  const attended = appData.members.filter(m => m.attended);
  const absent = appData.members.filter(m => !m.attended);
  const weeklyTotalChapters = appData.members.reduce((sum, m) => sum + (m.weeklyChapters || 0), 0);

  const readingLines = appData.members.length > 0 ? appData.members.map(m => {
    return `   · ${m.name} ${m.role}: ${m.weeklyPassage || '없음'} (${m.weeklyChapters || 0}장 / 누적 ${m.totalAccumulated}장)`;
  }).join('\n') : '   · 등록된 구역원 없음';

  const prayerLines = appData.members.map(m => {
    const active = m.prayers ? m.prayers.filter(p => !p.answered) : [];
    if (active.length === 0) return null;
    return `   · ${m.name} ${m.role}: ${active.map(p => p.text).join(' / ')}`;
  }).filter(Boolean).join('\n');

  const answeredLines = appData.members.map(m => {
    const ans = m.prayers ? m.prayers.filter(p => p.answered) : [];
    if (ans.length === 0) return null;
    return `   · ${m.name} ${m.role}: ${ans.map(p => `${p.text} (${p.answeredNote || '응답'})`).join(' / ')}`;
  }).filter(Boolean).join('\n');

  const mentorees = appData.members.filter(m => m.isMentoringTarget);
  const mentoringLines = mentorees.length > 0 ? mentorees.map(m => {
    return `   · 대상: ${m.name} ${m.role}\n     - 현재진도: ${m.mentoringCourse || '미정'}\n     - 다음진도: ${m.mentoringLesson || '미정'}\n     - 기타사항: ${m.mentoringAssignment || '없음'}\n     - 최근 나눔: ${m.lastMentoringNote || '말씀 묵상 및 기도'}`;
  }).join('\n') : '   · 현재 진행 중인 대상 없음';

  const meetingSection = isNoMeeting ? 
`1. 구역모임 일시 및 장소
   · 모임 없음` :
`1. 구역모임 일시 및 장소
   · 일시: ${dateFormatted}
   · 장소: ${appData.meeting.location || '교회예배당'}`;

  const attendanceSection = isNoMeeting ?
`2. 출석 현황
   · 모임 없음` :
`2. 출석 현황 (총 ${appData.members.length}명 중 ${attended.length}명 참석)
   · 참석자: ${attended.length > 0 ? attended.map(m => `${m.name} ${m.role}`).join(', ') : '없음'}
   ${absent.length > 0 ? `· 결석자: ${absent.map(m => `${m.name} ${m.role}(사유: ${m.absenceReason || '개인사정'})`).join(', ')}` : (appData.members.length > 0 ? '· 결석자 없음 (전원 출석)' : '· 등록된 구역원 없음')}`;

  return `[${appData.districtName || '언약교회 구역'} 주간 구역 사역 보고서]

${appData.reportHeader}

${meetingSection}

${attendanceSection}

3. 주간 성경 통독 현황 (구역 총합: ${weeklyTotalChapters}장 완독)
${readingLines}

4. 일대일 성경공부 진행 상황
${mentoringLines}

5. 구역 중보 기도제목
${prayerLines || '   · 특이 기도제목 없음'}

${answeredLines ? `\n6. [감사 간증] 응답받은 기도\n${answeredLines}` : ''}

7. 구역장 특이사항 및 요청사항
   · ${appData.customNotes || '특이사항 없음'}

${appData.reportFooter}

- ${appData.districtName || '언약교회'} 구역장: ${appData.leaderName} 드림 -`;
}

function renderReportTab() {
  const box = document.getElementById('report-text-preview');
  if (box) {
    box.innerText = generateReportText();
  }
}

function renderMemberManageTab() {
  const listEl = document.getElementById('manage-member-list');
  if (listEl) {
    if (!appData.members || appData.members.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; padding: 36px 16px; color: var(--text-muted); background: var(--bg-card-subtle); border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
          <p style="font-size: 1rem; font-weight: 600; color: var(--primary); margin-bottom: 6px;">등록된 구역 식구가 없습니다.</p>
          <p style="font-size: 0.88rem; margin-bottom: 14px;">새 구역 식구를 등록하여 목양 관리를 시작해 보세요.</p>
          <button class="btn btn-gold" onclick="openAddMemberModal()">➕ 새 구역 식구 등록하기</button>
        </div>
      `;
    } else {
      listEl.innerHTML = appData.members.map(m => `
      <div class="member-row">
        <div class="member-info">
          <div class="member-avatar">${m.name[0]}</div>
          <div>
            <div class="member-name">
              ${m.name} <span class="member-role">${m.role}</span>
              ${m.isMentoringTarget ? '<span class="mentor-badge" style="margin-left: 6px;">1:1 양육중</span>' : ''}
            </div>
            <small style="color: var(--text-muted);">
              누적 통독: ${m.totalAccumulated}장 | 기도제목: ${m.prayers ? m.prayers.length : 0}개
            </small>
          </div>
        </div>
        <div style="display: flex; gap: 6px;">
          <button class="btn btn-outline btn-sm" onclick="editMemberProfile(${m.id})">정보 수정</button>
          <button class="btn btn-outline btn-sm" style="color: var(--rose-red);" onclick="deleteMember(${m.id})">삭제</button>
        </div>
      </div>
    `).join('');
    }
  }

  // 구역 및 구역장 기본 정보 입력란 초기값 동기화
  const districtInput = document.getElementById('setting-district-name');
  if (districtInput) {
    let nameVal = appData.districtName || '4구역';
    nameVal = nameVal.replace(/^언약교회\s*/, '');
    districtInput.value = nameVal;
  }
  const leaderInput = document.getElementById('setting-leader-name');
  if (leaderInput) {
    leaderInput.value = appData.leaderName || '손혜영 구역장님';
  }
}

async function copyReportToClipboard() {
  const text = generateReportText();
  try {
    await navigator.clipboard.writeText(text);
    showToast("📋 목사님 보고서가 복사되었습니다! 카톡창에서 붙여넣기(Ctrl+V) 하세요.");
  } catch (err) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast("📋 보고서가 클립보드에 복사되었습니다!");
  }
}

function printReport() {
  window.print();
}

function runSmartParser() {
  if (!appData.members || appData.members.length === 0) {
    alert("등록된 구역 식구가 없습니다. 먼저 새 구역 식구를 등록해 주세요.");
    return;
  }
  const inputEl = document.getElementById('smart-parser-input');
  if (!inputEl) return;
  const rawText = inputEl.value.trim();
  if (!rawText) {
    alert("구역 식구가 카톡으로 보내온 메시지를 입력창에 붙여넣어 주세요.");
    return;
  }

  let targetMember = null;
  for (const m of appData.members) {
    if (rawText.includes(m.name)) {
      targetMember = m;
      break;
    }
  }

  const parsedPassage = parsePassageString(rawText);

  let prayerText = "";
  const prayerMatch = rawText.match(/(?:기도\s*제목|기도|기도부탁|중보|제목)[:\s-]*([^\n]+)/i);
  if (prayerMatch) {
    prayerText = prayerMatch[1].trim();
  }

  let selectedMemberId = targetMember ? targetMember.id : appData.members[0].id;
  
  openSmartParserConfirmModal({
    memberId: selectedMemberId,
    passage: parsedPassage.raw || "직접 입력",
    chapters: parsedPassage.totalChapters || 0,
    prayer: prayerText
  });
}

function showToast(message) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>✨</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) toast.parentNode.removeChild(toast);
  }, 3000);
}

function bindEvents() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetTab = btn.getAttribute('data-tab');
      document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
      const activeContent = document.getElementById(targetTab);
      if (activeContent) activeContent.classList.add('active');

      if (targetTab === 'tab-report') {
        renderReportTab();
      }
      if (targetTab === 'tab-daily-bible') {
        if (typeof renderDailyBibleView === 'function') {
          renderDailyBibleView();
        }
      }
    });
  });

  const calcStartBook = document.getElementById('calc-start-book');
  const calcStartCh = document.getElementById('calc-start-ch');
  const calcEndBook = document.getElementById('calc-end-book');
  const calcEndCh = document.getElementById('calc-end-ch');

  if (calcStartBook && calcStartCh && calcEndBook && calcEndCh) {
    populateBibleBookSelect(calcStartBook);
    populateBibleBookSelect(calcEndBook);

    const updateCalc = () => {
      const b1 = calcStartBook.value;
      const c1 = parseInt(calcStartCh.value) || 1;
      const b2 = calcEndBook.value || b1;
      const c2 = parseInt(calcEndCh.value) || c1;
      const chapters = calculateChaptersBetween(b1, c1, b2, c2);
      const resultEl = document.getElementById('calc-result-text');
      if (resultEl) resultEl.innerText = `${chapters}장`;
    };

    calcStartBook.addEventListener('change', () => {
      if (!calcEndBook.value) calcEndBook.value = calcStartBook.value;
      updateCalc();
    });
    calcStartCh.addEventListener('input', updateCalc);
    calcEndBook.addEventListener('change', updateCalc);
    calcEndCh.addEventListener('input', updateCalc);
  }
}

function populateBibleBookSelect(selectEl) {
  if (!selectEl) return;
  selectEl.innerHTML = '';
  
  const otGroup = document.createElement('optgroup');
  otGroup.label = "구약 (39권)";
  const ntGroup = document.createElement('optgroup');
  ntGroup.label = "신약 (27권)";

  BIBLE_BOOKS.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b.name;
    opt.textContent = `${b.name} (${b.chapters}장)`;
    if (b.testament === 'OT') otGroup.appendChild(opt);
    else ntGroup.appendChild(opt);
  });

  selectEl.appendChild(otGroup);
  selectEl.appendChild(ntGroup);
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

function toggleNoMeetingFields(isNoMeeting) {
  const container = document.getElementById('meeting-fields-container');
  if (container) {
    if (isNoMeeting) {
      container.style.opacity = '0.45';
      container.style.pointerEvents = 'none';
    } else {
      container.style.opacity = '1';
      container.style.pointerEvents = 'auto';
    }
  }
}

function openMeetingEditModal() {
  const isNoMeeting = !!(appData.meeting && appData.meeting.noMeeting);
  const noMeetingCb = document.getElementById('edit-meeting-no-meeting');
  if (noMeetingCb) {
    noMeetingCb.checked = isNoMeeting;
    toggleNoMeetingFields(isNoMeeting);
  }

  document.getElementById('edit-meeting-title').value = appData.meeting.title || '구역 모임';
  
  const rawDt = appData.meeting.datetime || '';
  if (rawDt.includes('T')) {
    const parts = rawDt.split('T');
    const dateEl = document.getElementById('edit-meeting-date-only');
    const timeEl = document.getElementById('edit-meeting-time-only');
    if (dateEl) dateEl.value = parts[0];
    if (timeEl) timeEl.value = parts[1].slice(0, 5);
  } else {
    const dateEl = document.getElementById('edit-meeting-date-only');
    const timeEl = document.getElementById('edit-meeting-time-only');
    if (dateEl) dateEl.value = '2026-09-20';
    if (timeEl) timeEl.value = '14:00';
  }

  document.getElementById('edit-meeting-location').value = appData.meeting.location || '교회예배당';
  openModal('modal-meeting-edit');
}

function setMeetingTimePreset(timeStr) {
  const el = document.getElementById('edit-meeting-time-only');
  if (el) el.value = timeStr;
}

function saveMeetingEdit() {
  const isNoMeeting = document.getElementById('edit-meeting-no-meeting') ? document.getElementById('edit-meeting-no-meeting').checked : false;

  if (!appData.meeting) appData.meeting = {};
  appData.meeting.noMeeting = isNoMeeting;
  appData.meeting.title = document.getElementById('edit-meeting-title').value.trim() || (isNoMeeting ? "구역모임 없음" : "구역 모임");
  
  const dateVal = document.getElementById('edit-meeting-date-only') ? document.getElementById('edit-meeting-date-only').value : '';
  const timeVal = document.getElementById('edit-meeting-time-only') ? document.getElementById('edit-meeting-time-only').value : '14:00';
  if (dateVal) {
    appData.meeting.datetime = `${dateVal}T${timeVal || '14:00'}`;
  }
  appData.meeting.location = document.getElementById('edit-meeting-location').value.trim() || '교회예배당';
  
  saveData();
  renderAll();
  closeModal('modal-meeting-edit');
  showToast(isNoMeeting ? "🚫 '이번 주 구역모임 없음'으로 설정되었습니다." : "✅ 구역모임 일정이 성공적으로 수정되었습니다.");
}

function saveDistrictSettings() {
  const districtInput = document.getElementById('setting-district-name');
  const leaderInput = document.getElementById('setting-leader-name');

  const districtRaw = districtInput ? districtInput.value.trim() : '';
  const leaderRaw = leaderInput ? leaderInput.value.trim() : '';

  if (districtRaw) {
    if (districtRaw.startsWith('언약교회')) {
      appData.districtName = districtRaw;
    } else {
      appData.districtName = `언약교회 ${districtRaw}`;
    }
  }

  if (leaderRaw) {
    appData.leaderName = leaderRaw;
  }

  saveData();
  renderAll();
  showToast(`✅ ${appData.districtName} | ${appData.leaderName} 설정이 저장되었습니다.`);
}

function openPassageEditModal(memberId) {
  const member = appData.members.find(m => m.id === memberId);
  if (!member) return;

  document.getElementById('edit-passage-member-id').value = member.id;
  document.getElementById('edit-passage-member-name').innerText = `${member.name} ${member.role}`;
  document.getElementById('edit-passage-text').value = member.weeklyPassage || '';
  document.getElementById('edit-passage-chapters').value = member.weeklyChapters || 0;
  
  openModal('modal-passage-edit');
}

function autoCalcPassageInModal() {
  const text = document.getElementById('edit-passage-text').value;
  const parsed = parsePassageString(text);
  if (parsed.totalChapters > 0) {
    document.getElementById('edit-passage-chapters').value = parsed.totalChapters;
    showToast(`장수가 자동으로 계산되었습니다: ${parsed.totalChapters}장`);
  }
}

function savePassageEdit() {
  const memberId = parseInt(document.getElementById('edit-passage-member-id').value);
  const member = appData.members.find(m => m.id === memberId);
  if (!member) return;

  const newPassage = document.getElementById('edit-passage-text').value.trim();
  const newChapters = parseInt(document.getElementById('edit-passage-chapters').value) || 0;

  const diff = newChapters - (member.weeklyChapters || 0);
  member.weeklyPassage = newPassage;
  member.weeklyChapters = newChapters;
  member.totalAccumulated = Math.max(0, (member.totalAccumulated || 0) + diff);

  saveData();
  renderAll();
  closeModal('modal-passage-edit');
  showToast(`${member.name} 님의 통독 기록이 저장되었습니다.`);
}

function openSmartParserConfirmModal(data) {
  const select = document.getElementById('parser-confirm-member-select');
  select.innerHTML = appData.members.map(m => `
    <option value="${m.id}" ${m.id === data.memberId ? 'selected' : ''}>${m.name} ${m.role}</option>
  `).join('');

  document.getElementById('parser-confirm-passage').value = data.passage;
  document.getElementById('parser-confirm-chapters').value = data.chapters;
  document.getElementById('parser-confirm-prayer').value = data.prayer;

  openModal('modal-parser-confirm');
}

function saveSmartParserResult() {
  const memberId = parseInt(document.getElementById('parser-confirm-member-select').value);
  const member = appData.members.find(m => m.id === memberId);
  if (!member) return;

  const passage = document.getElementById('parser-confirm-passage').value.trim();
  const chapters = parseInt(document.getElementById('parser-confirm-chapters').value) || 0;
  const prayer = document.getElementById('parser-confirm-prayer').value.trim();

  if (passage) {
    const diff = chapters - (member.weeklyChapters || 0);
    member.weeklyPassage = passage;
    member.weeklyChapters = chapters;
    member.totalAccumulated = Math.max(0, (member.totalAccumulated || 0) + diff);
  }

  if (prayer) {
    if (!member.prayers) member.prayers = [];
    const todayStr = new Date().toISOString().split('T')[0];
    member.prayers.unshift({
      id: Date.now(),
      text: prayer,
      answered: false,
      date: todayStr
    });
  }

  saveData();
  renderAll();
  closeModal('modal-parser-confirm');
  document.getElementById('smart-parser-input').value = "";
  showToast(`✨ ${member.name} 님의 성경통독 및 기도제목이 자동 반영되었습니다!`);
}

function openAddPrayerModal(defaultMemberId) {
  if (!appData.members || appData.members.length === 0) {
    alert("등록된 구역 식구가 없습니다. 먼저 구역원을 등록해 주세요.");
    return;
  }
  const select = document.getElementById('new-prayer-member-select');
  select.innerHTML = appData.members.map(m => `
    <option value="${m.id}" ${defaultMemberId && m.id === defaultMemberId ? 'selected' : ''}>${m.name} ${m.role}</option>
  `).join('');
  if (defaultMemberId) {
    select.value = defaultMemberId;
  }
  document.getElementById('new-prayer-text').value = '';
  openModal('modal-add-prayer');
}

function saveNewPrayer() {
  const memberId = parseInt(document.getElementById('new-prayer-member-select').value);
  const text = document.getElementById('new-prayer-text').value.trim();
  if (!text) {
    alert("기도제목을 입력해 주세요.");
    return;
  }
  const member = appData.members.find(m => m.id === memberId);
  if (!member) return;

  if (!member.prayers) member.prayers = [];
  const todayStr = new Date().toISOString().split('T')[0];
  member.prayers.unshift({
    id: Date.now(),
    text: text,
    answered: false,
    date: todayStr
  });

  saveData();
  renderAll();
  closeModal('modal-add-prayer');
  showToast(`${member.name} 님의 새 기도제목이 등록되었습니다.`);
}

function openEditPrayerModal(memberId, prayerId) {
  const member = appData.members.find(m => m.id === memberId);
  if (!member) return;
  const prayer = (member.prayers || []).find(p => p.id === prayerId);
  if (!prayer) return;

  document.getElementById('edit-prayer-member-id').value = memberId;
  document.getElementById('edit-prayer-id').value = prayerId;
  document.getElementById('edit-prayer-author').innerText = `${member.name} ${member.role}`;
  document.getElementById('edit-prayer-text').value = prayer.text;
  openModal('modal-edit-prayer');
}

function saveEditedPrayer() {
  const memberId = parseInt(document.getElementById('edit-prayer-member-id').value);
  const prayerId = parseInt(document.getElementById('edit-prayer-id').value);
  const member = appData.members.find(m => m.id === memberId);
  if (!member) return;
  const prayer = (member.prayers || []).find(p => p.id === prayerId);
  if (!prayer) return;

  const newText = document.getElementById('edit-prayer-text').value.trim();
  if (!newText) {
    alert("기도제목 내용을 입력해 주세요.");
    return;
  }

  prayer.text = newText;
  saveData();
  renderAll();
  closeModal('modal-edit-prayer');
  showToast(`✅ [${member.name}] 님의 기도제목이 수정되었습니다.`);
}

function openMentoringEditModal(memberId) {
  const member = appData.members.find(m => m.id === memberId);
  if (!member) return;

  document.getElementById('edit-mentor-member-id').value = member.id;
  document.getElementById('edit-mentor-name').innerText = `${member.name} ${member.role}`;
  document.getElementById('edit-mentor-course').value = member.mentoringCourse || '';
  document.getElementById('edit-mentor-lesson').value = member.mentoringLesson || '';
  document.getElementById('edit-mentor-date').value = member.nextMentoringDate || '';
  document.getElementById('edit-mentor-loc').value = member.nextMentoringLocation || '';
  document.getElementById('edit-mentor-assignment').value = member.mentoringAssignment || '';

  openModal('modal-mentoring-edit');
}

function saveMentoringEdit() {
  const memberId = parseInt(document.getElementById('edit-mentor-member-id').value);
  const member = appData.members.find(m => m.id === memberId);
  if (!member) return;

  member.mentoringCourse = document.getElementById('edit-mentor-course').value.trim();
  member.mentoringLesson = document.getElementById('edit-mentor-lesson').value.trim();
  member.nextMentoringDate = document.getElementById('edit-mentor-date').value;
  member.nextMentoringLocation = document.getElementById('edit-mentor-loc').value.trim();
  member.mentoringAssignment = document.getElementById('edit-mentor-assignment').value.trim();

  saveData();
  renderAll();
  closeModal('modal-mentoring-edit');
  showToast("1:1 양육 일정이 갱신되었습니다.");
}

function openMentoringTargetModal() {
  const listContainer = document.getElementById('mentoring-target-checklist');
  if (!listContainer) return;

  listContainer.innerHTML = appData.members.map(m => `
    <label style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--bg-card-subtle); border-radius: var(--radius-md); border: 1px solid var(--border-color); cursor: pointer;">
      <div style="display: flex; align-items: center; gap: 10px;">
        <input type="checkbox" class="target-member-checkbox" value="${m.id}" ${m.isMentoringTarget ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--accent-gold);">
        <span style="font-weight: 600; color: var(--text-main); font-size: 0.95rem;">${m.name} <span class="member-role">${m.role}</span></span>
      </div>
      <span style="font-size: 0.8rem; color: ${m.isMentoringTarget ? 'var(--accent-gold)' : 'var(--text-muted)'}; font-weight: 600;">
        ${m.isMentoringTarget ? '● 현재 양육중' : '미지정'}
      </span>
    </label>
  `).join('');

  openModal('modal-mentoring-target');
}

function saveMentoringTargets() {
  const checkboxes = document.querySelectorAll('.target-member-checkbox');
  checkboxes.forEach(cb => {
    const memberId = parseInt(cb.value);
    const member = appData.members.find(m => m.id === memberId);
    if (member) {
      const wasTarget = member.isMentoringTarget;
      member.isMentoringTarget = cb.checked;
      if (cb.checked && !wasTarget) {
        if (!member.mentoringCourse) member.mentoringCourse = "성경 말씀";
        if (!member.mentoringLesson) member.mentoringLesson = "1과: 말씀과 믿음";
        if (!member.nextMentoringDate) {
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 7);
          nextWeek.setHours(14, 0, 0, 0);
          member.nextMentoringDate = nextWeek.toISOString().slice(0, 16);
        }
        if (!member.nextMentoringLocation) member.nextMentoringLocation = "교회예배당";
      }
    }
  });

  saveData();
  renderAll();
  closeModal('modal-mentoring-target');
  showToast("일대일 성경공부 대상자가 성공적으로 업데이트되었습니다.");
}

function openMentoringLogModal(memberId) {
  const member = appData.members.find(m => m.id === memberId);
  if (!member) return;

  document.getElementById('log-mentor-member-id').value = member.id;
  document.getElementById('log-mentor-name').innerText = `${member.name} ${member.role}`;
  document.getElementById('log-mentor-text').value = member.lastMentoringNote || '';

  openModal('modal-mentoring-log');
}

function saveMentoringLog() {
  const memberId = parseInt(document.getElementById('log-mentor-member-id').value);
  const member = appData.members.find(m => m.id === memberId);
  if (!member) return;

  const note = document.getElementById('log-mentor-text').value.trim();

  if (note) member.lastMentoringNote = note;

  saveData();
  renderAll();
  closeModal('modal-mentoring-log');
  showToast("새 성경공부 나눔 일지가 저장되었습니다!");
}

function openMentoringEditModal(memberId) {
  const member = appData.members.find(m => m.id === memberId);
  if (!member) return;

  document.getElementById('edit-mentor-member-id').value = member.id;
  document.getElementById('edit-mentor-name').innerText = `${member.name} ${member.role}`;
  document.getElementById('edit-mentor-course').value = member.mentoringCourse || '성경 말씀';
  document.getElementById('edit-mentor-lesson').value = member.mentoringLesson || '';

  if (member.nextMentoringDate && member.nextMentoringDate.includes('T')) {
    const parts = member.nextMentoringDate.split('T');
    const dateEl = document.getElementById('edit-mentor-date-only');
    const timeEl = document.getElementById('edit-mentor-time-only');
    if (dateEl) dateEl.value = parts[0];
    if (timeEl) timeEl.value = parts[1].slice(0, 5);
  } else {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const dateEl = document.getElementById('edit-mentor-date-only');
    const timeEl = document.getElementById('edit-mentor-time-only');
    if (dateEl) dateEl.value = nextWeek.toISOString().slice(0, 10);
    if (timeEl) timeEl.value = '14:00';
  }

  document.getElementById('edit-mentor-loc').value = member.nextMentoringLocation || '교회예배당';
  document.getElementById('edit-mentor-assignment').value = member.mentoringAssignment || '';

  openModal('modal-mentoring-edit');
}

function setMentorTimePreset(timeStr) {
  const el = document.getElementById('edit-mentor-time-only');
  if (el) el.value = timeStr;
}

function saveMentoringEdit() {
  const memberId = parseInt(document.getElementById('edit-mentor-member-id').value);
  const member = appData.members.find(m => m.id === memberId);
  if (!member) return;

  member.mentoringCourse = document.getElementById('edit-mentor-course').value.trim();
  member.mentoringLesson = document.getElementById('edit-mentor-lesson').value.trim();
  member.mentoringAssignment = document.getElementById('edit-mentor-assignment').value.trim();

  saveData();
  renderAll();
  closeModal('modal-mentoring-edit');
  showToast(`✅ [${member.name}] 님의 일대일 성경공부 일정이 저장되었습니다.`);
}

function openAddMemberModal() {
  document.getElementById('new-member-name').value = '';
  document.getElementById('new-member-role').value = '성도';
  openModal('modal-add-member');
}

function saveNewMember() {
  const name = document.getElementById('new-member-name').value.trim();
  const role = document.getElementById('new-member-role').value.trim();
  if (!name) {
    alert("이름을 입력해 주세요.");
    return;
  }

  const newId = Date.now();
  appData.members.push({
    id: newId,
    name: name,
    role: role,
    attended: true,
    absenceReason: "",
    weeklyPassage: "",
    weeklyChapters: 0,
    totalAccumulated: 0,
    isMentoringTarget: false,
    prayers: []
  });

  saveData();
  renderAll();
  closeModal('modal-add-member');
  showToast(`새 구역 식구 [${name} ${role}] 님이 등록되었습니다.`);
}

function deleteMember(memberId) {
  const member = appData.members.find(m => m.id === memberId);
  if (!member) return;
  if (!confirm(`정말로 ${member.name} ${member.role}님을 구역 목록에서 삭제하시겠습니까?`)) return;

  appData.members = appData.members.filter(m => m.id !== memberId);
  saveData();
  renderAll();
  showToast("구역원이 삭제되었습니다.");
}

function editMemberProfile(memberId) {
  const member = appData.members.find(m => m.id === memberId);
  if (!member) return;

  document.getElementById('edit-profile-id').value = member.id;
  document.getElementById('edit-profile-name').value = member.name;
  
  const roleSelect = document.getElementById('edit-profile-role');
  let found = false;
  for (let i = 0; i < roleSelect.options.length; i++) {
    if (roleSelect.options[i].value === member.role) {
      roleSelect.selectedIndex = i;
      found = true;
      break;
    }
  }
  if (!found && member.role) {
    const opt = document.createElement('option');
    opt.value = member.role;
    opt.textContent = member.role;
    opt.selected = true;
    roleSelect.appendChild(opt);
  }

  document.getElementById('edit-profile-accumulated').value = member.totalAccumulated || 0;
  document.getElementById('edit-profile-passage').value = member.weeklyPassage || '';
  document.getElementById('edit-profile-chapters').value = member.weeklyChapters || 0;
  document.getElementById('edit-profile-mentoring').checked = !!member.isMentoringTarget;

  openModal('modal-edit-member');
}

function saveMemberProfile() {
  const memberId = parseInt(document.getElementById('edit-profile-id').value);
  const member = appData.members.find(m => m.id === memberId);
  if (!member) return;

  const name = document.getElementById('edit-profile-name').value.trim();
  if (!name) {
    alert("성도 이름을 입력해 주세요.");
    return;
  }

  member.name = name;
  member.role = document.getElementById('edit-profile-role').value;
  member.totalAccumulated = parseInt(document.getElementById('edit-profile-accumulated').value) || 0;
  member.weeklyPassage = document.getElementById('edit-profile-passage').value.trim();
  member.weeklyChapters = parseInt(document.getElementById('edit-profile-chapters').value) || 0;
  const wasTarget = member.isMentoringTarget;
  member.isMentoringTarget = document.getElementById('edit-profile-mentoring').checked;

  if (member.isMentoringTarget && !wasTarget) {
    if (!member.mentoringCourse) member.mentoringCourse = "성경 말씀";
    if (!member.mentoringLesson) member.mentoringLesson = "1과: 말씀과 믿음";
    if (!member.nextMentoringDate) {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      nextWeek.setHours(14, 0, 0, 0);
      member.nextMentoringDate = nextWeek.toISOString().slice(0, 16);
    }
    if (!member.nextMentoringLocation) member.nextMentoringLocation = "교회예배당";
  }

  saveData();
  renderAll();
  closeModal('modal-edit-member');
  showToast(`${member.name} ${member.role} 님의 정보가 수정되었습니다.`);
}

function exportBackupData() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appData, null, 2));
  const downloadAnchor = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  const districtPrefix = (appData.districtName || "언약교회구역").replace(/\s+/g, '_');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `${districtPrefix}_목양데이터백업_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast("💾 전체 데이터 백업 파일이 다운로드되었습니다.");
}

function importBackupData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (imported && imported.members) {
        appData = imported;
        saveData();
        renderAll();
        showToast("✅ 백업 파일로부터 성공적으로 데이터가 복원되었습니다!");
      } else {
        alert("올바른 목양 수첩 백업 파일 형식이 아닙니다.");
      }
    } catch (err) {
      alert("백업 파일을 읽는 중 오류가 발생했습니다.");
    }
  };
  reader.readAsText(file);
}

function resetToDefault() {
  if (!confirm("모든 데이터를 처음 기본 상태로 초기화하시겠습니까?")) return;
  appData = JSON.parse(JSON.stringify(DEFAULT_DATA));
  saveData();
  renderAll();
  showToast("기본 데이터로 초기화되었습니다.");
}

/**
 * 매일 성경 탭으로 즉시 이동하고 모드를 설정하는 헬퍼 함수
 */
function switchTabToDaily(mode = 'district4') {
  const tabBtn = document.querySelector('.tab-btn[data-tab="tab-daily-bible"]');
  if (tabBtn) {
    tabBtn.click();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  if (typeof setDailyBibleMode === 'function') {
    setDailyBibleMode(mode);
  }
}

document.addEventListener('DOMContentLoaded', initApp);


