const fs = require('fs');

const API_KEY = process.env.GEMINI_API_KEY || "YOUR_API_KEY";

// 성경 66권과 장 수
const BIBLE_BOOKS = [
  { name: "창세기", chapters: 50 }, { name: "출애굽기", chapters: 40 }, { name: "레위기", chapters: 27 }, { name: "민수기", chapters: 36 },
  { name: "신명기", chapters: 34 }, { name: "여호수아", chapters: 24 }, { name: "사사기", chapters: 21 }, { name: "룻기", chapters: 4 },
  { name: "사무엘상", chapters: 31 }, { name: "사무엘하", chapters: 24 }, { name: "열왕기상", chapters: 22 }, { name: "열왕기하", chapters: 25 },
  { name: "역대상", chapters: 29 }, { name: "역대하", chapters: 36 }, { name: "에스라", chapters: 10 }, { name: "느헤미야", chapters: 13 },
  { name: "에스더", chapters: 10 }, { name: "욥기", chapters: 42 }, { name: "시편", chapters: 150 }, { name: "잠언", chapters: 31 },
  { name: "전도서", chapters: 12 }, { name: "아가", chapters: 8 }, { name: "이사야", chapters: 66 }, { name: "예레미야", chapters: 52 },
  { name: "예레미야애가", chapters: 5 }, { name: "에스겔", chapters: 48 }, { name: "다니엘", chapters: 12 }, { name: "호세아", chapters: 14 },
  { name: "요엘", chapters: 3 }, { name: "아모스", chapters: 9 }, { name: "오바댜", chapters: 1 }, { name: "요나", chapters: 4 },
  { name: "미가", chapters: 7 }, { name: "나훔", chapters: 3 }, { name: "하박국", chapters: 3 }, { name: "스바냐", chapters: 3 },
  { name: "학개", chapters: 2 }, { name: "스가랴", chapters: 14 }, { name: "말라기", chapters: 4 },
  { name: "마태복음", chapters: 28 }, { name: "마가복음", chapters: 16 }, { name: "누가복음", chapters: 24 }, { name: "요한복음", chapters: 21 },
  { name: "사도행전", chapters: 28 }, { name: "로마서", chapters: 16 }, { name: "고린도전서", chapters: 16 }, { name: "고린도후서", chapters: 13 },
  { name: "갈라디아서", chapters: 6 }, { name: "에베소서", chapters: 6 }, { name: "빌립보서", chapters: 4 }, { name: "골로새서", chapters: 4 },
  { name: "데살로니가전서", chapters: 5 }, { name: "데살로니가후서", chapters: 3 }, { name: "디모데전서", chapters: 6 }, { name: "디모데후서", chapters: 4 },
  { name: "디도서", chapters: 3 }, { name: "빌레몬서", chapters: 1 }, { name: "히브리서", chapters: 13 }, { name: "야고보서", chapters: 5 },
  { name: "베드로전서", chapters: 5 }, { name: "베드로후서", chapters: 3 }, { name: "요한1서", chapters: 5 }, { name: "요한2서", chapters: 1 },
  { name: "요한3서", chapters: 1 }, { name: "유다서", chapters: 1 }, { name: "요한계시록", chapters: 22 }
];

const OUTPUT_FILE = './generated_bible_data.json';
const DELAY_MS = 2500; // API Rate Limit 방지용

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchSummaryFromGemini(book, chapter, retries = 5) {
  const prompt = `
당신은 정통 장로교 신학에 입각하여 성경을 요약하는 전문가입니다.
다음 형식에 맞게 엄격히 JSON 포맷으로만 응답해 주세요. (마크다운 백틱 없이 순수 JSON만)
성경 ${book} ${chapter}장에 대한 요약을 작성해 주세요.
{
  "title": "${book} ${chapter}장의 핵심 주제 (1줄)",
  "summary": "${book} ${chapter}장의 주요 내용 줄거리 요약 (2-3줄)",
  "verse": "${book} ${chapter}장 중에서 가장 은혜롭고 대표적인 구절 (구절 내용 - 장:절 표시)",
  "meditation": "이 장을 읽고 삶에 적용할 수 있는 묵상 포인트 (2줄 내외)"
}`;

  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      const data = await response.json();
      
      if (data.error) {
        // 일시적인 과부하, 토큰 제한 오류 발생 시 지연 후 재시도
        if (data.error.message.toLowerCase().includes("high demand") || 
            data.error.message.toLowerCase().includes("quota") || 
            data.error.code === 429 || data.error.code === 503) {
          console.log(`[Retry] ${book} ${chapter}장: API 과부하 (시도 ${i+1}/${retries}). 15초 대기 후 재시도...`);
          await delay(15000);
          continue;
        }
        console.error(`[Error] ${book} ${chapter}장:`, data.error.message);
        return null;
      }

      let text = data.candidates[0].content.parts[0].text;
      
      // 혹시라도 마크다운 백틱이 들어간 경우 제거 (안전장치)
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();

      return JSON.parse(text);
    } catch (error) {
      console.error(`[Fetch Error] ${book} ${chapter}장: ${error.message}. (시도 ${i+1}/${retries}) 15초 대기 후 재시도...`);
      await delay(15000);
    }
  }
  
  return null;
}

async function run() {
  let resultData = {};

  // 기존 파일이 있으면 이어서 작성
  if (fs.existsSync(OUTPUT_FILE)) {
    try {
      resultData = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
      console.log("기존 진행 데이터를 불러왔습니다. (진행 상태 유지)");
    } catch (e) {
      console.log("기존 파일 파싱 오류. 무시하고 덮어씁니다.");
    }
  }

  // 이사야부터 우선 생성하도록 정렬 순서 조정
  const priorityBooks = ["이사야"];
  const otherBooks = BIBLE_BOOKS.filter(b => !priorityBooks.includes(b.name));
  const sortedBooks = [...BIBLE_BOOKS.filter(b => priorityBooks.includes(b.name)), ...otherBooks];

  console.log("총 66권 전체 요약 추출 파이프라인 가동을 재시작합니다... (Auto-Retry 장착)");

  for (const book of sortedBooks) {
    if (!resultData[book.name]) {
      resultData[book.name] = { theme: `${book.name}의 핵심 메시지`, chapters: {} };
    }

    for (let i = 1; i <= book.chapters; i++) {
      if (resultData[book.name].chapters[i]) {
        // 이미 저장된 장은 스킵
        continue;
      }

      console.log(`[Fetch] ${book.name} ${i}장 요약 요청 중...`);
      const summary = await fetchSummaryFromGemini(book.name, i);
      
      if (summary) {
        resultData[book.name].chapters[i] = summary;
        // 즉시 파일 저장하여 잃어버리지 않게 함
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(resultData, null, 2), 'utf8');
        console.log(`[Success] ${book.name} ${i}장 저장 완료`);
      } else {
        console.log(`[Failed] ${book.name} ${i}장 연속 실패. 안정성을 위해 파이프라인을 일시 중단합니다.`);
        return; // 에러 시 즉시 중단
      }

      await delay(DELAY_MS);
    }
  }
  
  console.log("모든 데이터 추출이 완료되었습니다!");
}

run();
