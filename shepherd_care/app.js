// 선한 목양 수첩 (Shepherd Care) 메인 애플리케이션 스크립트

const STORAGE_KEY = 'shepherd_care_data_v1';

// 초기 기본 데이터 (손혜영 구역장님 전용 프리셋)
const DEFAULT_DATA = {
  leaderName: "손혜영 구역장님",
  districtName: "믿음 2구역",
  meeting: {
    title: "9월 3주차 정기 구역 예배",
    datetime: "2026-09-20T14:00",
    location: "김은혜 성도님 댁 (은혜마을 102동 405호)",
    scripture: "에베소서 4장 1~6절",
    hymn: "218장 (네 마음에 주를 모셔)",
    memo: "예배 후 다과 및 중보기도 나눔 시간 준비"
  },
  members: [
    {
      id: 1,
      name: "김은혜",
      role: "성도",
      attended: true,
      absenceReason: "",
      weeklyPassage: "창세기 1장 ~ 15장",
      weeklyChapters: 15,
      totalAccumulated: 142,
      isMentoringTarget: false,
      prayers: [
        { id: 101, text: "고3 자녀 수능 시험 앞두고 건강과 지혜, 흔들리지 않는 평안한 마음 주시길", answered: false, date: "2026-09-13" }
      ]
    },
    {
      id: 2,
      name: "이믿음",
      role: "집사",
      attended: true,
      absenceReason: "",
      weeklyPassage: "마태복음 1장 ~ 20장",
      weeklyChapters: 20,
      totalAccumulated: 310,
      isMentoringTarget: false,
      prayers: [
        { id: 201, text: "사업장 신규 프로젝트 계약 체결 감사 및 팀원들과의 소통에 은혜 주시길", answered: false, date: "2026-09-14" },
        { id: 202, text: "믿지 않던 남동생이 주일 예배 처음 출석하여 등록했습니다!", answered: true, date: "2026-08-28", answeredNote: "하나님의 놀라운 타이밍에 감사드립니다" }
      ]
    },
    {
      id: 3,
      name: "박순종",
      role: "집사",
      attended: false,
      absenceReason: "지방 출장 (부산)",
      weeklyPassage: "시편 1편 ~ 30편",
      weeklyChapters: 30,
      totalAccumulated: 185,
      isMentoringTarget: false,
      prayers: [
        { id: 301, text: "출장 기간 중 빗길 안전 운전과 환절기 감기 예방을 위한 기도", answered: false, date: "2026-09-12" }
      ]
    },
    {
      id: 4,
      name: "최찬양",
      role: "권사",
      attended: true,
      absenceReason: "",
      weeklyPassage: "이사야 40장 ~ 45장",
      weeklyChapters: 6,
      totalAccumulated: 450,
      isMentoringTarget: false,
      prayers: [
        { id: 401, text: "무릎 관절 수술 무사히 마치고 재활 순조롭게 회복됨에 감사", answered: true, date: "2026-09-10", answeredNote: "성도님들의 간절한 중보 덕분입니다" },
        { id: 402, text: "믿음의 3대 가정이 주 안에서 하나 되도록 영적 리더십 간구", answered: false, date: "2026-09-14" }
      ]
    },
    {
      id: 5,
      name: "정평안",
      role: "성도",
      attended: true,
      absenceReason: "",
      weeklyPassage: "로마서 1장 ~ 8장",
      weeklyChapters: 8,
      totalAccumulated: 98,
      isMentoringTarget: true,
      mentoringCourse: "일대일 제자양육 성경공부",
      mentoringLesson: "3과: 성경의 권위와 묵상 (완료)",
      nextMentoringDate: "2026-09-18T19:30",
      nextMentoringLocation: "교회 1층 카페 로뎀",
      lastMentoringNote: "바쁜 직장 생활 속에서 매일 아침 15분 큐티(QT) 시간 지키기로 결단함. 에베소서 2장 말씀으로 구원의 확신에 큰 은혜를 누렸다고 나눔.",
      mentoringAssignment: "4과 예습 및 딤후 3:16 암송하기",
      prayers: [
        { id: 501, text: "직장 내 인간관계 속에서 그리스도인의 빛과 소금 역할을 감당하도록", answered: false, date: "2026-09-11" }
      ]
    },
    {
      id: 6,
      name: "윤사랑",
      role: "청년",
      attended: true,
      absenceReason: "",
      weeklyPassage: "창세기 48장 ~ 출애굽기 2장",
      weeklyChapters: 5,
      totalAccumulated: 62,
      isMentoringTarget: false,
      prayers: [
        { id: 601, text: "하반기 기업 채용 면접 일정 가운데 담대함과 평안 주시길", answered: false, date: "2026-09-14" }
      ]
    }
  ],
  reportHeader: "샬롬! 목사님, 이번 주 믿음 2구역 주간 사역 및 모임 결과를 보고드립니다.",
  reportFooter: "구역 식구들 모두 말씀과 기도로 든든히 세워져 가고 있습니다. 목사님의 영육 강건하심을 위해 기도합니다.",
  customNotes: "정평안 성도님 일대일 양육이 매우 순조롭게 진행 중이며, 김은혜 성도님 댁 심방이 은혜롭게 마쳤습니다."
};

// 앱 상태 관리 객체
let appData = null;

// 초기화
function initApp() {
  loadData();
  renderAll();
  bindEvents();
}

// 로컬스토리지 로드
function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      appData = JSON.parse(saved);
    } else {
      appData = JSON.parse(JSON.stringify(DEFAULT_DATA));
      saveData();
    }
  } catch (e) {
    console.error("데이터 로드 실패:", e);
    appData = JSON.parse(JSON.stringify(DEFAULT_DATA));
  }
}

// 로컬스토리지 저장
function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
  } catch (e) {
    console.error("데이터 저장 실패:", e);
  }
}

// 전체 렌더링
function renderAll() {
  renderHeaderAndHero();
  renderHomeSummary();
  renderReadingTab();
  renderPrayerTab();
  renderMentoringTab();
  renderReportTab();
  renderMemberManageTab();
}

// D-Day 계산기
function calculateDDay(targetDateStr) {
  if (!targetDateStr) return { text: "미정", days: 999 };
  const target = new Date(targetDateStr);
  const now = new Date();
  
  // 날짜만 비교 (자정 기준)
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = targetDay.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return { text: "D-Day (오늘)", days: 0 };
  if (diffDays > 0) return { text: `D-${diffDays}`, days: diffDays };
  return { text: `D+${Math.abs(diffDays)}`, days: diffDays };
}

// 1. 최상단 헤더 및 D-Day 배너 렌더
function renderHeaderAndHero() {
  const dday = calculateDDay(appData.meeting.datetime);
  const pillEl = document.getElementById('hero-dday-pill');
  if (pillEl) {
    pillEl.innerHTML = `${dday.text} <small>구역예배</small>`;
  }

  const meetingDate = new Date(appData.meeting.datetime);
  const formattedDate = isNaN(meetingDate) ? appData.meeting.datetime : 
    `${meetingDate.getFullYear()}년 ${meetingDate.getMonth()+1}월 ${meetingDate.getDate()}일 (${['일','월','화','수','목','금','토'][meetingDate.getDay()]}) ${String(meetingDate.getHours()).padStart(2,'0')}:${String(meetingDate.getMinutes()).padStart(2,'0')}`;

  const meetInfoEl = document.getElementById('hero-meeting-info');
  if (meetInfoEl) {
    meetInfoEl.innerHTML = `
      <h2>${appData.meeting.title}</h2>
      <p>📍 <strong>장소:</strong> ${appData.meeting.location}</p>
      <div class="dday-meta">
        <span class="dday-meta-item">🗓️ ${formattedDate}</span>
        <span class="dday-meta-item">📖 ${appData.meeting.scripture}</span>
        <span class="dday-meta-item">🎵 ${appData.meeting.hymn}</span>
      </div>
    `;
  }
}

// 2. 홈 탭 요약 렌더
function renderHomeSummary() {
  // 이번 주 총 통독 장수 계산
  const weeklyTotal = appData.members.reduce((sum, m) => sum + (m.weeklyChapters || 0), 0);
  const weeklyTotalEl = document.getElementById('home-weekly-total-chapters');
  if (weeklyTotalEl) weeklyTotalEl.innerText = `${weeklyTotal}장`;

  // 출석 인원 계산
  const attendedCount = appData.members.filter(m => m.attended).length;
  const totalMembers = appData.members.length;
  const attendEl = document.getElementById('home-attendance-count');
  if (attendEl) attendEl.innerText = `${attendedCount}명 / ${totalMembers}명`;

  // 기도제목 개수
  const activePrayers = appData.members.reduce((sum, m) => sum + (m.prayers ? m.prayers.filter(p => !p.answered).length : 0), 0);
  const prayersEl = document.getElementById('home-active-prayers-count');
  if (prayersEl) prayersEl.innerText = `${activePrayers}건`;

  // 출석 체크 목록
  const attendListEl = document.getElementById('home-attendance-list');
  if (attendListEl) {
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

// 출석 상태 토글
function toggleAttendance(memberId) {
  const member = appData.members.find(m => m.id === memberId);
  if (!member) return;

  if (member.attended) {
    const reason = prompt(`${member.name} ${member.role}님의 결석 사유를 입력해 주세요 (예: 출장, 병환, 가족행사 등):`, member.absenceReason || "");
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

// 3. 성경 통독 탭 렌더
function renderReadingTab() {
  const weeklyTotal = appData.members.reduce((sum, m) => sum + (m.weeklyChapters || 0), 0);
  const districtTotal = appData.members.reduce((sum, m) => sum + (m.totalAccumulated || 0), 0);
  
  const weeklyEl = document.getElementById('reading-weekly-sum');
  if (weeklyEl) weeklyEl.innerText = `${weeklyTotal}장`;

  const totalEl = document.getElementById('reading-total-sum');
  if (totalEl) totalEl.innerText = `${districtTotal}장`;

  // 구역원별 통독 목록
  const listEl = document.getElementById('reading-member-list');
  if (listEl) {
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

// 4. 기도 제목 탭 렌더
function renderPrayerTab() {
  const prayerListEl = document.getElementById('prayer-cards-container');
  const answeredListEl = document.getElementById('answered-prayers-container');

  const allPrayers = [];
  appData.members.forEach(m => {
    if (m.prayers && m.prayers.length > 0) {
      m.prayers.forEach(p => {
        allPrayers.push({ ...p, memberName: m.name, memberRole: m.role, memberId: m.id });
      });
    }
  });

  const activePrayers = allPrayers.filter(p => !p.answered);
  const answeredPrayers = allPrayers.filter(p => p.answered);

  if (prayerListEl) {
    if (activePrayers.length === 0) {
      prayerListEl.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 20px;">진행 중인 중보 기도제목이 없습니다.</p>`;
    } else {
      prayerListEl.innerHTML = activePrayers.map(p => `
        <div class="prayer-card">
          <div class="prayer-header">
            <span class="prayer-author">🙏 ${p.memberName} ${p.memberRole}</span>
            <span class="prayer-date">${p.date}</span>
          </div>
          <div class="prayer-content">${p.text}</div>
          <div class="prayer-actions">
            <button class="btn btn-sage btn-sm" onclick="markPrayerAnswered(${p.memberId}, ${p.id})">
              ✨ 기도 응답 완료!
            </button>
            <button class="btn btn-outline btn-sm" style="color: var(--rose-red);" onclick="deletePrayer(${p.memberId}, ${p.id})">
              삭제
            </button>
          </div>
        </div>
      `).join('');
    }
  }

  if (answeredListEl) {
    if (answeredPrayers.length === 0) {
      answeredListEl.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 20px;">응답 완료된 기도 간증이 여기에 모입니다.</p>`;
    } else {
      answeredListEl.innerHTML = answeredPrayers.map(p => `
        <div class="prayer-card answered">
          <div class="prayer-header">
            <span class="prayer-author" style="color: var(--sage-green);">🎉 ${p.memberName} ${p.memberRole} (응답 감사)</span>
            <span class="prayer-date">${p.date}</span>
          </div>
          <div class="prayer-content">${p.text}</div>
          ${p.answeredNote ? `<div style="font-size: 0.82rem; color: var(--sage-green); font-weight: 600; margin-top: 4px;">💌 은혜 나눔: ${p.answeredNote}</div>` : ''}
          <div class="prayer-actions">
            <button class="btn btn-outline btn-sm" onclick="reopenPrayer(${p.memberId}, ${p.id})">
              기도 중으로 되돌리기
            </button>
          </div>
        </div>
      `).join('');
    }
  }
}

// 기도 응답 완료 처리
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

// 5. 1:1 성경양육 탭 렌더
function renderMentoringTab() {
  const container = document.getElementById('mentoring-cards-container');
  const mentorees = appData.members.filter(m => m.isMentoringTarget);

  if (!container) return;

  if (mentorees.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; background: #fff; border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
        <p style="color: var(--text-muted); margin-bottom: 12px;">현재 1:1 양육 대상자로 지정된 구역원이 없습니다.</p>
        <button class="btn btn-gold" onclick="openMentoringTargetModal()">양육 대상 구역원 지정하기</button>
      </div>
    `;
    return;
  }

  container.innerHTML = mentorees.map(m => {
    const dday = calculateDDay(m.nextMentoringDate);
    const dateObj = new Date(m.nextMentoringDate);
    const dateStr = isNaN(dateObj) ? m.nextMentoringDate : 
      `${dateObj.getMonth()+1}월 ${dateObj.getDate()}일 (${['일','월','화','수','목','금','토'][dateObj.getDay()]}) ${String(dateObj.getHours()).padStart(2,'0')}:${String(dateObj.getMinutes()).padStart(2,'0')}`;

    return `
      <div class="mentor-card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="mentor-badge">일대일 제자양육</span>
              <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--primary);">${m.name} ${m.role}</h3>
            </div>
            <div style="font-size: 0.9rem; color: var(--accent-gold); font-weight: 600; margin-top: 4px;">
              📚 교재: ${m.mentoringCourse || '미정'} / 현재 진도: <strong>${m.mentoringLesson || '미정'}</strong>
            </div>
          </div>
          <span class="dday-pill" style="min-width: 80px; font-size: 1.1rem; padding: 8px 14px;">
            ${dday.text}
            <small>다음 만남</small>
          </span>
        </div>

        <div style="background: var(--bg-card-subtle); padding: 12px 16px; border-radius: var(--radius-md); margin-bottom: 12px; font-size: 0.88rem;">
          <div>🗓️ <strong>다음 모임 일정:</strong> ${dateStr}</div>
          <div style="margin-top: 4px;">📍 <strong>장소:</strong> ${m.nextMentoringLocation || '미정'}</div>
          <div style="margin-top: 4px;">📝 <strong>과제 점검:</strong> ${m.mentoringAssignment || '없음'}</div>
        </div>

        <div class="mentor-review-box">
          <div style="font-weight: 700; color: var(--accent-gold); margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
            💡 <span>직전 회차 핵심 나눔 복기 (만나기 5분 전 꼭 읽기)</span>
          </div>
          <div style="color: var(--text-main); line-height: 1.6;">${m.lastMentoringNote || '기록된 나눔 내용이 없습니다.'}</div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px;">
          <button class="btn btn-outline btn-sm" onclick="openMentoringEditModal(${m.id})">일정 및 진도 수정</button>
          <button class="btn btn-gold btn-sm" onclick="openMentoringLogModal(${m.id})">새 나눔 일지 작성</button>
        </div>
      </div>
    `;
  }).join('');
}

// 6. 목사님 주간 보고서 텍스트 생성
function generateReportText() {
  const meetingDate = new Date(appData.meeting.datetime);
  const dateFormatted = isNaN(meetingDate) ? appData.meeting.datetime : 
    `${meetingDate.getFullYear()}년 ${meetingDate.getMonth()+1}월 ${meetingDate.getDate()}일`;

  const attended = appData.members.filter(m => m.attended);
  const absent = appData.members.filter(m => !m.attended);
  const weeklyTotalChapters = appData.members.reduce((sum, m) => sum + (m.weeklyChapters || 0), 0);

  // 성경통독 목록
  const readingLines = appData.members.map(m => {
    return `   · ${m.name} ${m.role}: ${m.weeklyPassage || '없음'} (${m.weeklyChapters || 0}장 / 누적 ${m.totalAccumulated}장)`;
  }).join('\n');

  // 기도제목 목록
  const prayerLines = appData.members.map(m => {
    const active = m.prayers ? m.prayers.filter(p => !p.answered) : [];
    if (active.length === 0) return null;
    return `   · ${m.name} ${m.role}: ${active.map(p => p.text).join(' / ')}`;
  }).filter(Boolean).join('\n');

  // 기도 응답 감사 목록
  const answeredLines = appData.members.map(m => {
    const ans = m.prayers ? m.prayers.filter(p => p.answered) : [];
    if (ans.length === 0) return null;
    return `   · ${m.name} ${m.role}: ${ans.map(p => `${p.text} (${p.answeredNote || '응답'})`).join(' / ')}`;
  }).filter(Boolean).join('\n');

  // 1:1 양육 현황
  const mentorees = appData.members.filter(m => m.isMentoringTarget);
  const mentoringLines = mentorees.length > 0 ? mentorees.map(m => {
    return `   · 대상: ${m.name} ${m.role} (${m.mentoringCourse || '일대일 제자양육'})\n     - 현재 진도: ${m.mentoringLesson}\n     - 최근 나눔: ${m.lastMentoringNote || '성실히 묵상 중'}`;
  }).join('\n') : '   · 현재 진행 중인 대상 없음';

  return `[${appData.districtName} 주간 구역 사역 보고서]

${appData.reportHeader}

1. 구역예배 일시 및 장소
   · 일시: ${dateFormatted}
   · 장소: ${appData.meeting.location}
   · 본문/찬송: ${appData.meeting.scripture} / ${appData.meeting.hymn}

2. 출석 현황 (총 ${appData.members.length}명 중 ${attended.length}명 참석)
   · 참석자: ${attended.map(m => `${m.name} ${m.role}`).join(', ')}
   ${absent.length > 0 ? `· 결석자: ${absent.map(m => `${m.name} ${m.role}(사유: ${m.absenceReason || '개인사정'})`).join(', ')}` : '· 결석자 없음 (전원 출석)'}

3. 주간 성경 통독 현황 (구역 총합: ${weeklyTotalChapters}장 완독)
${readingLines}

4. 일대일 성경양육 진행 상황
${mentoringLines}

5. 구역 중보 기도제목
${prayerLines || '   · 특이 기도제목 없음'}

${answeredLines ? `\n6. [감사 간증] 응답받은 기도\n${answeredLines}` : ''}

7. 구역장 특이사항 및 요청사항
   · ${appData.customNotes || '특이사항 없음'}

${appData.reportFooter}

- 구역장: ${appData.leaderName} 드림 -`;
}

// 보고서 탭 렌더
function renderReportTab() {
  const box = document.getElementById('report-text-preview');
  if (box) {
    box.innerText = generateReportText();
  }
}

// 7. 구역원 관리 탭 렌더
function renderMemberManageTab() {
  const listEl = document.getElementById('manage-member-list');
  if (listEl) {
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

// 카카오톡 보고서 원클릭 복사
async function copyReportToClipboard() {
  const text = generateReportText();
  try {
    await navigator.clipboard.writeText(text);
    showToast("📋 목사님 보고서가 복사되었습니다! 카톡창에서 붙여넣기(Ctrl+V) 하세요.");
  } catch (err) {
    // 대체 복사 방식
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast("📋 보고서가 클립보드에 복사되었습니다!");
  }
}

// 보고서 인쇄 (A4 서식)
function printReport() {
  window.print();
}

// 스마트 카톡 텍스트 파서 실행
function runSmartParser() {
  const inputEl = document.getElementById('smart-parser-input');
  if (!inputEl) return;
  const rawText = inputEl.value.trim();
  if (!rawText) {
    alert("구역 식구가 카톡으로 보내온 메시지를 입력창에 붙여넣어 주세요.");
    return;
  }

  // 1. 이름 매칭
  let targetMember = null;
  for (const m of appData.members) {
    if (rawText.includes(m.name)) {
      targetMember = m;
      break;
    }
  }

  // 2. 본문 및 장수 파싱
  const parsedPassage = parsePassageString(rawText);

  // 3. 기도제목 추출
  let prayerText = "";
  const prayerMatch = rawText.match(/(?:기도\s*제목|기도|기도부탁|중보|제목)[:\s-]*([^\n]+)/i);
  if (prayerMatch) {
    prayerText = prayerMatch[1].trim();
  }

  // 매칭 확인 다이얼로그
  let selectedMemberId = targetMember ? targetMember.id : appData.members[0].id;
  
  openSmartParserConfirmModal({
    memberId: selectedMemberId,
    passage: parsedPassage.raw || "직접 입력",
    chapters: parsedPassage.totalChapters || 0,
    prayer: prayerText
  });
}

// 토스트 메시지
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

// 이벤트 바인딩
function bindEvents() {
  // 탭 전환
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetTab = btn.getAttribute('data-tab');
      document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
      const activeContent = document.getElementById(targetTab);
      if (activeContent) activeContent.classList.add('active');

      // 보고서 탭 열었을 때 최신 보고서 갱신
      if (targetTab === 'tab-report') {
        renderReportTab();
      }
    });
  });

  // 성경 실시간 계산기 이벤트 바인딩
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

// 성경 권 셀렉트박스 채우기
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

// 모달 제어 유틸리티
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
}

// 구역모임 정보 수정 모달 열기
function openMeetingEditModal() {
  document.getElementById('edit-meeting-title').value = appData.meeting.title;
  document.getElementById('edit-meeting-datetime').value = appData.meeting.datetime;
  document.getElementById('edit-meeting-location').value = appData.meeting.location;
  document.getElementById('edit-meeting-scripture').value = appData.meeting.scripture;
  document.getElementById('edit-meeting-hymn').value = appData.meeting.hymn;
  openModal('modal-meeting-edit');
}

function saveMeetingEdit() {
  appData.meeting.title = document.getElementById('edit-meeting-title').value.trim();
  appData.meeting.datetime = document.getElementById('edit-meeting-datetime').value;
  appData.meeting.location = document.getElementById('edit-meeting-location').value.trim();
  appData.meeting.scripture = document.getElementById('edit-meeting-scripture').value.trim();
  appData.meeting.hymn = document.getElementById('edit-meeting-hymn').value.trim();
  
  saveData();
  renderAll();
  closeModal('modal-meeting-edit');
  showToast("구역모임 정보가 성공적으로 수정되었습니다.");
}

// 성경 통독 개별 수정 모달
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

  // 누적 통독 차이 반영
  const diff = newChapters - (member.weeklyChapters || 0);
  member.weeklyPassage = newPassage;
  member.weeklyChapters = newChapters;
  member.totalAccumulated = Math.max(0, (member.totalAccumulated || 0) + diff);

  saveData();
  renderAll();
  closeModal('modal-passage-edit');
  showToast(`${member.name} 님의 통독 기록이 저장되었습니다.`);
}

// 스마트 파서 확인 모달
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

// 새 기도제목 추가 모달
function openAddPrayerModal() {
  const select = document.getElementById('new-prayer-member-select');
  select.innerHTML = appData.members.map(m => `
    <option value="${m.id}">${m.name} ${m.role}</option>
  `).join('');
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

// 1:1 양육 일정/진도 수정 모달
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

// 1:1 양육 새 나눔 일지 작성 모달
function openMentoringLogModal(memberId) {
  const member = appData.members.find(m => m.id === memberId);
  if (!member) return;

  document.getElementById('log-mentor-member-id').value = member.id;
  document.getElementById('log-mentor-name').innerText = `${member.name} ${member.role}`;
  document.getElementById('log-mentor-text').value = '';
  document.getElementById('log-mentor-next-lesson').value = '';

  openModal('modal-mentoring-log');
}

function saveMentoringLog() {
  const memberId = parseInt(document.getElementById('log-mentor-member-id').value);
  const member = appData.members.find(m => m.id === memberId);
  if (!member) return;

  const note = document.getElementById('log-mentor-text').value.trim();
  const nextLesson = document.getElementById('log-mentor-next-lesson').value.trim();

  if (note) member.lastMentoringNote = note;
  if (nextLesson) member.mentoringLesson = nextLesson;

  saveData();
  renderAll();
  closeModal('modal-mentoring-log');
  showToast("새 양육 나눔 일지가 저장되었습니다!");
}

// 구역원 추가 모달 열기
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

// 데이터 전체 JSON 내보내기 (백업)
function exportBackupData() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appData, null, 2));
  const downloadAnchor = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `선한목양수첩_데이터백업_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast("💾 전체 데이터 백업 파일이 다운로드되었습니다.");
}

// 데이터 JSON 가져오기 (복원)
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

// 기본 샘플 데이터 리셋
function resetToDefault() {
  if (!confirm("모든 데이터를 처음 기본 상태로 초기화하시겠습니까? (기존 입력 내용은 삭제됩니다)")) return;
  appData = JSON.parse(JSON.stringify(DEFAULT_DATA));
  saveData();
  renderAll();
  showToast("기본 데이터로 초기화되었습니다.");
}

// 앱 실행
document.addEventListener('DOMContentLoaded', initApp);
