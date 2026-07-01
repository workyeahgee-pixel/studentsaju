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
    
    // 프론트엔드에서 보낸 구조에서 정확하게 텍스트만 뽑아냅니다.
    const userText = body.contents[0].parts[0].text;

    // 3. 구글 Gemini AI 연결
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // 사용하는 모델명 (gemini-2.5-flash)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 4. AI에게 사주 프롬프트 전송 및 답변 받기
    const result = await model.generateContent(userText);
    const responseText = result.response.text();

    // 5. 성공적으로 답변을 프론트엔드로 돌려보냄
    return NextResponse.json({ text: responseText });

  } catch (error) {
    // 💥 에러 발생 시 터미널(콘솔)에 진짜 원인을 출력합니다!
    console.error("🚨  API 통신 실패 진짜 원인:", error);

    // 503 서버 과부하 에러 전용 안내 메시지
    const is503 = error?.status === 503 || error?.message?.includes('503') || error?.message?.includes('Service Unavailable');
    if (is503) {
      return NextResponse.json(
        {
          success: false,
          message:
            "현재 Google Gemini API 서버 자체의 트래픽 과부하 문제로 인해 간헐적으로 503 오류(서버 지연)가 발생할 수 있습니다. " +
            "혹시 테스트 중 응답이 오지 않거나 서버 오류가 뜬다면, 1~2분 정도 후에 다시 시도해 주시면 정상 작동합니다.",
          errorCode: 503,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "API 요청 중 오류가 발생했습니다.", details: error.message },
      { status: 500 }
    );
  }
}
