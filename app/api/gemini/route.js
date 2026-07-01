import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    // 1. API 키 확인 (키가 없으면 여기서 원인을 알려줍니다)
    if (!process.env.GEMINI_API_KEY) {
      console.error("🚨 서버 에러: GEMINI_API_KEY가 없습니다!");
      return NextResponse.json({ error: "API 키가 설정되지 않았습니다." }, { status: 500 });
    }

    // 2. 프론트엔드에서 보낸 데이터(contents, parts) 읽기
    const body = await req.json();
    
    // 프론트엔드에서 보낸 구조에서 정확하게 텍스트(b)만 뽑아냅니다.
    const userText = body.contents[0].parts[0].text;

    // 3. 구글 Gemini AI 연결
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // 사용하는 모델명 (gemini-1.5-flash)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 4. AI에게 사주 프롬프트 전송 및 답변 받기
    const result = await model.generateContent(userText);
    const responseText = result.response.text();

    // 5. 성공적으로 답변을 프론트엔드로 돌려보냄
    // (프론트엔드 코드에 맞게 응답 형태는 변경될 수 있습니다)
    return NextResponse.json({ text: responseText });

  } catch (error) {
    // 💥 500 에러가 나면 화면이 아니라 "터미널(콘솔)"에 진짜 이유를 빨간색으로 출력합니다!
    console.error("🚨 Gemini API 통신 실패 진짜 원인:", error);
    
    return NextResponse.json(
      { error: "API 요청 중 오류가 발생했습니다.", details: error.message },
      { status: 500 }
    );
  }
}
