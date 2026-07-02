import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    // 1. API 키 확인
    if (!process.env.GEMINI_API_KEY) {
      console.error("🚨 서버 에러: GEMINI_API_KEY가 없습니다!");
      return NextResponse.json({ success: false, message: "API 키가 설정되지 않았습니다." }, { status: 500 });
    }

    // 2. 프론트엔드에서 보낸 데이터 읽기
    const body = await req.json();
    const { contents, generationConfig, isJson } = body;

    // 3. 구글 Gemini AI 연결
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // generationConfig가 있으면 모델 옵션에 포함
    const modelOptions = { model: "gemini-2.5-flash" };
    if (generationConfig) {
      modelOptions.generationConfig = generationConfig;
    }
    const model = genAI.getGenerativeModel(modelOptions);

    // 4. AI에게 프롬프트 전송 및 답변 받기
    const result = await model.generateContent({ contents });
    const responseText = result.response.text();

    // 5. 성공적으로 답변을 프론트엔드로 돌려보냄 (success: true 필수!)
    return NextResponse.json({ success: true, text: responseText });

  } catch (error) {
    console.error("🚨  API 통신 실패 진짜 원인:", error);

    // 429 한도 초과 에러
    const is429 = error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('Too Many Requests') || error?.message?.includes('quota');
    if (is429) {
      return NextResponse.json(
        {
          success: false,
          message:
            "현재 AI 분석 요청 한도(무료 플랜)에 도달하였습니다. " +
            "하루 사용 한도를 초과하였으므로 내일 다시 이용하시거나, " +
            "잠시 후(약 1분) 다시 시도해 주시면 정상 작동합니다.",
        },
        { status: 429 }
      );
    }

    // 503 서버 과부하 에러
    const is503 = error?.status === 503 || error?.message?.includes('503') || error?.message?.includes('Service Unavailable');
    if (is503) {
      return NextResponse.json(
        {
          success: false,
          message:
            "현재 Google Gemini API 서버 자체의 트래픽 과부하 문제로 인해 간헐적으로 503 오류(서버 지연)가 발생할 수 있습니다. " +
            "혹시 테스트 중 응답이 오지 않거나 서버 오류가 뜬다면, 1~2분 정도 후에 다시 시도해 주시면 정상 작동합니다.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { success: false, message: "API 요청 중 오류가 발생했습니다: " + (error.message || "알 수 없는 오류") },
      { status: 500 }
    );
  }
}
