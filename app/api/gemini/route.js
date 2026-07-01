import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    // 1. 환경변수(API 키) 체크
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("서버에 GEMINI_API_KEY가 설정되지 않았습니다.");
    }

    // 2. 프론트엔드에서 보낸 페이로드 받기
    const body = await req.json();
    const { contents, generationConfig, isJson } = body;

    // 3. Gemini AI 초기화 및 호출
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      ...(isJson && generationConfig ? { generationConfig } : {}),
    });

    const result = await model.generateContent({ contents });
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ success: true, text });

  } catch (error) {
    console.error("Gemini 통신 중 에러 발생:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
