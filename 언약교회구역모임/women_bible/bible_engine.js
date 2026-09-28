/**
 * 원미언약교회 여성 성도 매일 성경 읽기 통독 엔진
 * - Track 1: 이사야부터 전권 순차 통독 (하루 3장)
 * - Track 2: 로마서 16장 무한 순환 로테이션 통독 (하루 2장)
 */

const BIBLE_BOOKS = [
  // === 구약 (39권, 929장) ===
  { id: 1, name: "창세기", abbr: "창", testament: "OT", chapters: 50 },
  { id: 2, name: "출애굽기", abbr: "출", testament: "OT", chapters: 40 },
  { id: 3, name: "레위기", abbr: "레", testament: "OT", chapters: 27 },
  { id: 4, name: "민수기", abbr: "민", testament: "OT", chapters: 36 },
  { id: 5, name: "신명기", abbr: "신", testament: "OT", chapters: 34 },
  { id: 6, name: "여호수아", abbr: "수", testament: "OT", chapters: 24 },
  { id: 7, name: "사사기", abbr: "삿", testament: "OT", chapters: 21 },
  { id: 8, name: "룻기", abbr: "룻", testament: "OT", chapters: 4 },
  { id: 9, name: "사무엘상", abbr: "삼상", testament: "OT", chapters: 31 },
  { id: 10, name: "사무엘하", abbr: "삼하", testament: "OT", chapters: 24 },
  { id: 11, name: "열왕기상", abbr: "왕상", testament: "OT", chapters: 22 },
  { id: 12, name: "열왕기하", abbr: "왕하", testament: "OT", chapters: 25 },
  { id: 13, name: "역대상", abbr: "대상", testament: "OT", chapters: 29 },
  { id: 14, name: "역대하", abbr: "대하", testament: "OT", chapters: 36 },
  { id: 15, name: "에스라", abbr: "스", testament: "OT", chapters: 10 },
  { id: 16, name: "느헤미야", abbr: "느", testament: "OT", chapters: 13 },
  { id: 17, name: "에스더", abbr: "에", testament: "OT", chapters: 10 },
  { id: 18, name: "욥기", abbr: "욥", testament: "OT", chapters: 42 },
  { id: 19, name: "시편", abbr: "시", testament: "OT", chapters: 150 },
  { id: 20, name: "잠언", abbr: "잠", testament: "OT", chapters: 31 },
  { id: 21, name: "전도서", abbr: "전", testament: "OT", chapters: 12 },
  { id: 22, name: "아가", abbr: "아", testament: "OT", chapters: 8 },
  { id: 23, name: "이사야", abbr: "사", testament: "OT", chapters: 66 },
  { id: 24, name: "예레미야", abbr: "렘", testament: "OT", chapters: 52 },
  { id: 25, name: "예레미야애가", abbr: "애", testament: "OT", chapters: 5 },
  { id: 26, name: "에스겔", abbr: "겔", testament: "OT", chapters: 48 },
  { id: 27, name: "다니엘", abbr: "단", testament: "OT", chapters: 12 },
  { id: 28, name: "호세아", abbr: "호", testament: "OT", chapters: 14 },
  { id: 29, name: "요엘", abbr: "욜", testament: "OT", chapters: 3 },
  { id: 30, name: "아모스", abbr: "암", testament: "OT", chapters: 9 },
  { id: 31, name: "오바댜", abbr: "옵", testament: "OT", chapters: 1 },
  { id: 32, name: "요나", abbr: "욘", testament: "OT", chapters: 4 },
  { id: 33, name: "미가", abbr: "미", testament: "OT", chapters: 7 },
  { id: 34, name: "나훔", abbr: "나", testament: "OT", chapters: 3 },
  { id: 35, name: "하박국", abbr: "합", testament: "OT", chapters: 3 },
  { id: 36, name: "스바냐", abbr: "습", testament: "OT", chapters: 3 },
  { id: 37, name: "학개", abbr: "학", testament: "OT", chapters: 2 },
  { id: 38, name: "스가랴", abbr: "슥", testament: "OT", chapters: 14 },
  { id: 39, name: "말라기", abbr: "말", testament: "OT", chapters: 4 },

  // === 신약 (27권, 260장) ===
  { id: 40, name: "마태복음", abbr: "마", testament: "NT", chapters: 28 },
  { id: 41, name: "마가복음", abbr: "막", testament: "NT", chapters: 16 },
  { id: 42, name: "누가복음", abbr: "눅", testament: "NT", chapters: 24 },
  { id: 43, name: "요한복음", abbr: "요", testament: "NT", chapters: 21 },
  { id: 44, name: "사도행전", abbr: "행", testament: "NT", chapters: 28 },
  { id: 45, name: "로마서", abbr: "롬", testament: "NT", chapters: 16 },
  { id: 46, name: "고린도전서", abbr: "고전", testament: "NT", chapters: 16 },
  { id: 47, name: "고린도후서", abbr: "고후", testament: "NT", chapters: 13 },
  { id: 48, name: "갈라디아서", abbr: "갈", testament: "NT", chapters: 6 },
  { id: 49, name: "에베소서", abbr: "엡", testament: "NT", chapters: 6 },
  { id: 50, name: "빌립보서", abbr: "빌", testament: "NT", chapters: 4 },
  { id: 51, name: "골로새서", abbr: "골", testament: "NT", chapters: 4 },
  { id: 52, name: "데살로니가전서", abbr: "살전", testament: "NT", chapters: 5 },
  { id: 53, name: "데살로니가후서", abbr: "살후", testament: "NT", chapters: 3 },
  { id: 54, name: "디모데전서", abbr: "딤전", testament: "NT", chapters: 6 },
  { id: 55, name: "디모데후서", abbr: "딤후", testament: "NT", chapters: 4 },
  { id: 56, name: "디도서", abbr: "딛", testament: "NT", chapters: 3 },
  { id: 57, name: "빌레몬서", abbr: "몬", testament: "NT", chapters: 1 },
  { id: 58, name: "히브리서", abbr: "히", testament: "NT", chapters: 13 },
  { id: 59, name: "야고보서", abbr: "약", testament: "NT", chapters: 5 },
  { id: 60, name: "베드로전서", abbr: "벧전", testament: "NT", chapters: 5 },
  { id: 61, name: "베드로후서", abbr: "벧후", testament: "NT", chapters: 3 },
  { id: 62, name: "요한일서", abbr: "요일", testament: "NT", chapters: 5 },
  { id: 63, name: "요한이서", abbr: "요이", testament: "NT", chapters: 1 },
  { id: 64, name: "요한삼서", abbr: "요삼", testament: "NT", chapters: 1 },
  { id: 65, name: "유다서", abbr: "유", testament: "NT", chapters: 1 },
  { id: 66, name: "요한계시록", abbr: "계", testament: "NT", chapters: 22 }
];

const TOTAL_BIBLE_CHAPTERS = 1189;

/**
 * 전역 장수 인덱스 (1 ~ 1189) 구하기
 */
function getGlobalChapter(bookId, chapter) {
  let acc = 0;
  for (let i = 0; i < BIBLE_BOOKS.length; i++) {
    const book = BIBLE_BOOKS[i];
    if (book.id === bookId) {
      return acc + Math.max(1, Math.min(chapter, book.chapters));
    }
    acc += book.chapters;
  }
  return 1;
}

/**
 * 전역 장수 인덱스로부터 책과 장수 구하기
 */
function getBookAndChapterFromGlobal(globalIndex) {
  let normalized = ((globalIndex - 1) % TOTAL_BIBLE_CHAPTERS) + 1;
  if (normalized < 1) normalized += TOTAL_BIBLE_CHAPTERS;

  let acc = 0;
  for (let i = 0; i < BIBLE_BOOKS.length; i++) {
    const book = BIBLE_BOOKS[i];
    if (acc + book.chapters >= normalized) {
      return {
        book,
        chapter: normalized - acc,
        globalIndex: normalized
      };
    }
    acc += book.chapters;
  }
  return { book: BIBLE_BOOKS[0], chapter: 1, globalIndex: 1 };
}

/**
 * [Track 1] 시작 전역 인덱스로부터 연속 n개 장 목록 반환
 */
function getTrack1Chapters(startGlobalIndex, count = 3) {
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(getBookAndChapterFromGlobal(startGlobalIndex + i));
  }
  return result;
}

/**
 * [Track 2] 로마서(총 16장) 순환 로테이션 n개 장 목록 반환
 * anchorCh: 기준일 로마서 시작 장수 (예: 9월 28일 로마서 12장)
 * diffDays: 기준일로부터의 일수 차이
 * count: 하루 읽을 장수 (기본 2장)
 */
function getRomansRotationChapters(anchorCh, diffDays, count = 2) {
  const romansBook = BIBLE_BOOKS.find(b => b.id === 45); // 로마서
  const totalRomansChapters = 16;
  
  // 0-indexed로 정규화 연산
  let start0 = ((anchorCh - 1) + (diffDays * count)) % totalRomansChapters;
  if (start0 < 0) start0 += totalRomansChapters;

  const result = [];
  for (let i = 0; i < count; i++) {
    const ch = ((start0 + i) % totalRomansChapters) + 1;
    result.push({
      book: romansBook,
      chapter: ch
    });
  }
  return result;
}

/**
 * 연속된 장 목록을 사람이 읽기 편한 한국어 범위 문자열로 변환
 */
function formatPassageRange(chaptersList) {
  if (!chaptersList || chaptersList.length === 0) return "";
  const first = chaptersList[0];
  const last = chaptersList[chaptersList.length - 1];

  if (first.book.id === last.book.id) {
    if (first.chapter === last.chapter) {
      return `${first.book.name} ${first.chapter}장`;
    }
    // 로마서 순환으로 16장 다음 1장이 오는 경우 처리
    if (first.chapter > last.chapter) {
      return `${first.book.name} ${first.chapter}장, ${last.chapter}장`;
    }
    return `${first.book.name} ${first.chapter}장 - ${last.chapter}장`;
  } else {
    return `${first.book.name} ${first.chapter}장 - ${last.book.name} ${last.chapter}장`;
  }
}
