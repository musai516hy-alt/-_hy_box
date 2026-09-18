// 성경 66권 데이터베이스 및 통독 장수 계산 유틸리티
// 구약 39권(929장) + 신약 27권(260장) = 총 66권(1,189장)

const BIBLE_BOOKS = [
  // === 구약 (Old Testament: 39권, 929장) ===
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

  // === 신약 (New Testament: 27권, 260장) ===
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

const TOTAL_BIBLE_CHAPTERS = 1189; // 구약 929 + 신약 260
const OT_CHAPTERS = 929;
const NT_CHAPTERS = 260;

/**
 * 성경 이름 또는 약칭으로 성경 권 정보 찾기
 */
function findBibleBook(nameOrAbbr) {
  if (!nameOrAbbr) return null;
  const clean = nameOrAbbr.trim().replace(/\s+/g, '');
  return BIBLE_BOOKS.find(b => 
    b.name === clean || 
    b.abbr === clean || 
    clean.startsWith(b.name) || 
    clean.startsWith(b.abbr) ||
    b.name.startsWith(clean)
  ) || null;
}

/**
 * 두 지점(권+장) 사이의 총 장수 계산
 * e.g., (창세기, 1) ~ (창세기, 15) => 15장
 * e.g., (창세기, 48) ~ (출애굽기, 3) => 창48..50(3장) + 출1..3(3장) = 6장
 */
function calculateChaptersBetween(startBookName, startChapter, endBookName, endChapter) {
  const startBook = findBibleBook(startBookName);
  const endBook = findBibleBook(endBookName || startBookName);

  if (!startBook) return 0;
  if (!endBook) {
    return 1;
  }

  const sCh = Math.max(1, parseInt(startChapter) || 1);
  const eCh = Math.max(1, parseInt(endChapter) || sCh);

  // 1. 같은 권인 경우
  if (startBook.id === endBook.id) {
    if (eCh >= sCh) {
      return Math.min(eCh, startBook.chapters) - sCh + 1;
    }
    return 1;
  }

  // 2. 다른 권인 경우 (순서대로)
  let firstId = startBook.id;
  let lastId = endBook.id;
  if (firstId > lastId) {
    [firstId, lastId] = [lastId, firstId];
  }

  let total = 0;
  for (let id = firstId; id <= lastId; id++) {
    const book = BIBLE_BOOKS.find(b => b.id === id);
    if (!book) continue;

    if (id === firstId) {
      total += Math.max(0, book.chapters - sCh + 1);
    } else if (id === lastId) {
      total += Math.min(eCh, book.chapters);
    } else {
      total += book.chapters;
    }
  }

  return total;
}

/**
 * 한국어 본문 문자열 자동 해석 및 장수 계산기
 */
function parsePassageString(text) {
  if (!text || typeof text !== 'string') return { summary: '', totalChapters: 0, details: [] };

  const cleaned = text.trim();
  let totalChapters = 0;
  const details = [];

  const parts = cleaned.split(/[,;\n]+/).map(p => p.trim()).filter(Boolean);

  for (const part of parts) {
    // 패턴 A: 다른 권간 범위 (예: 창세기 48장 ~ 출애굽기 3장)
    const crossMatch = part.match(/([가-힣]+)\s*(\d+)\s*(?:장)?\s*[-~]\s*([가-힣]+)\s*(\d+)\s*(?:장)?/);
    if (crossMatch) {
      const b1 = crossMatch[1];
      const ch1 = parseInt(crossMatch[2]);
      const b2 = crossMatch[3];
      const ch2 = parseInt(crossMatch[4]);
      const count = calculateChaptersBetween(b1, ch1, b2, ch2);
      if (count > 0) {
        totalChapters += count;
        details.push({ raw: part, count });
        continue;
      }
    }

    // 패턴 B: 한 권 내 범위 (예: 창세기 1~15장, 창 1-15, 마 5장)
    const singleMatch = part.match(/([가-힣]+)\s*(\d+)\s*(?:장)?\s*(?:[-~]\s*(\d+)\s*(?:장)?)?/);
    if (singleMatch) {
      const bookName = singleMatch[1];
      const startCh = parseInt(singleMatch[2]);
      const endCh = singleMatch[3] ? parseInt(singleMatch[3]) : startCh;
      const count = calculateChaptersBetween(bookName, startCh, bookName, endCh);
      if (count > 0) {
        totalChapters += count;
        details.push({ raw: part, count });
        continue;
      }
    }

    // 패턴 C: "전권" 완독 (예: 룻기 전권)
    const fullMatch = part.match(/([가-힣]+)\s*(?:전권|전체|완독)/);
    if (fullMatch) {
      const book = findBibleBook(fullMatch[1]);
      if (book) {
        totalChapters += book.chapters;
        details.push({ raw: part, count: book.chapters });
        continue;
      }
    }

    // 단순 숫자만 있는 경우 ("15장")
    const justNumMatch = part.match(/(\d+)\s*장/);
    if (justNumMatch) {
      const num = parseInt(justNumMatch[1]);
      totalChapters += num;
      details.push({ raw: part, count: num });
    }
  }

  return {
    raw: text,
    totalChapters,
    details
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    BIBLE_BOOKS,
    TOTAL_BIBLE_CHAPTERS,
    findBibleBook,
    calculateChaptersBetween,
    parsePassageString
  };
}
