const HEAVENLY_STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const HEAVENLY_STEMS_KR = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const EARTHLY_BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
const EARTHLY_BRANCHES_KR = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];

export const STEM_COLORS = {
  "甲": "text-emerald-400", "乙": "text-emerald-400",
  "丙": "text-rose-400", "丁": "text-rose-400",
  "戊": "text-amber-500", "己": "text-amber-500",
  "庚": "text-slate-300", "辛": "text-slate-300",
  "壬": "text-blue-400", "癸": "text-blue-400"
};

export const BRANCH_COLORS = {
  "寅": "text-emerald-400", "卯": "text-emerald-400",
  "巳": "text-rose-400", "午": "text-rose-400",
  "辰": "text-amber-500", "戌": "text-amber-500", "丑": "text-amber-500", "未": "text-amber-500",
  "申": "text-slate-300", "酉": "text-slate-300",
  "亥": "text-blue-400", "子": "text-blue-400"
};

export const JI_JANG_GAN = {
  "子": { ratio: "임(10) 계(20)" }, "丑": { ratio: "계(9) 신(3) 기(18)" },
  "寅": { ratio: "무(7) 병(7) 갑(16)" }, "卯": { ratio: "갑(10) 을(20)" },
  "辰": { ratio: "을(9) 계(3) 무(18)" }, "巳": { ratio: "무(7) 경(7) 병(16)" },
  "午": { ratio: "병(10) 기(9) 정(11)" }, "未": { ratio: "정(9) 을(3) 기(18)" },
  "申": { ratio: "무(7) 임(7) 경(16)" }, "酉": { ratio: "경(10) 신(20)" },
  "戌": { ratio: "신(9) 정(3) 무(18)" }, "亥": { ratio: "무(7) 갑(7) 임(16)" }
};

export const getSolarTermDate = (year, termIndex) => {
  const baseOffsets = [
    4.84, 19.95, 4.15, 18.90, 5.18, 20.25, 4.70, 20.12, 5.25, 20.70, 5.85, 21.42,
    6.90, 22.80, 7.50, 23.15, 7.90, 23.10, 7.80, 23.25, 7.40, 22.20, 7.15, 21.90
  ];
  const safeTermIndex = ((termIndex % 24) + 24) % 24; 
  const actualYear = year + Math.floor(termIndex / 24);
  const day = Math.floor(baseOffsets[safeTermIndex] + (actualYear - 2000) * 0.2422 - Math.floor((actualYear - 2000) / 4));
  const month = Math.floor(safeTermIndex / 2);
  return new Date(Date.UTC(actualYear, month, day, -9, 0, 0));
};

export const analyzeHarmonics = (pillars) => {
  const branches = [pillars.year.branch, pillars.month.branch, pillars.day.branch, pillars.hour.branch];
  const analysis = [];

  const chungs = [
    ["子", "午", "자오충"], ["丑", "未", "축미충"], ["寅", "申", "인신충"],
    ["卯", "酉", "묘유충"], ["辰", "戌", "진술충"], ["巳", "亥", "사해충"]
  ];
  const wonjins = [
    ["子", "未", "자미 원진"], ["丑", "午", "축오 원진"], ["寅", "酉", "인유 원진"],
    ["卯", "申", "묘신 원진"], ["辰", "亥", "진해 원진"], ["巳", "戌", "사술 원진"]
  ];

  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      const b1 = branches[i];
      const b2 = branches[j];
      
      chungs.forEach(([x, y, name]) => {
        if ((b1 === x && b2 === y) || (b1 === y && b2 === x)) analysis.push(`${name} 형성`);
      });
      wonjins.forEach(([x, y, name]) => {
        if ((b1 === x && b2 === y) || (b1 === y && b2 === x)) analysis.push(`${name}살 발현`);
      });
    }
  }

  const branchSet = new Set(branches);
  if (branchSet.has("寅") && branchSet.has("巳") && branchSet.has("申")) analysis.push("인사신(寅巳申) 무은지형 성립");
  if (branchSet.has("丑") && branchSet.has("戌") && branchSet.has("未")) analysis.push("축술미(丑戌未) 지세지형 성립");

  const uniqueAnalysis = [...new Set(analysis)];
  return uniqueAnalysis.length > 0 ? uniqueAnalysis.join(", ") : "특이 합충형파해 없음 (안정된 명식)";
};

export const calculateSajuPillars = (dateStr, timeStr) => {
  const date = new Date(`${dateStr}T${timeStr || "12:00"}:00+09:00`);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  let solarTermIpchun = getSolarTermDate(year, 2); 
  let isAfterIpchun = date >= solarTermIpchun;
  let sajuYear = isAfterIpchun ? year : year - 1;

  const yearStemIdx = ((sajuYear - 4) % 10 + 10) % 10;
  const yearBranchIdx = ((sajuYear - 4) % 12 + 12) % 12;
  const yearPillar = { stem: HEAVENLY_STEMS[yearStemIdx], stemKr: HEAVENLY_STEMS_KR[yearStemIdx], branch: EARTHLY_BRANCHES[yearBranchIdx], branchKr: EARTHLY_BRANCHES_KR[yearBranchIdx] };

  let termIdx = -1;
  for (let i = 0; i < 24; i++) {
    if (date >= getSolarTermDate(year, i)) termIdx = i;
  }
  if (termIdx === -1) termIdx = 23; 

  const monthlyBranches = ["丑", "丑", "寅", "寅", "卯", "卯", "辰", "辰", "巳", "巳", "午", "午", "未", "未", "申", "申", "酉", "酉", "戌", "戌", "亥", "亥", "子", "子"];
  const currentMonthBranch = monthlyBranches[termIdx];
  const branchIndex = EARTHLY_BRANCHES.indexOf(currentMonthBranch);
  
  const monthlyStemsTable = [
    ["丙", "丁", "戊", "己", "庚", "辛", "壬", "癸", "甲", "乙", "丙", "丁"], 
    ["戊", "己", "庚", "辛", "壬", "癸", "甲", "乙", "丙", "丁", "戊", "己"], 
    ["庚", "辛", "壬", "癸", "甲", "乙", "丙", "丁", "戊", "己", "庚", "辛"], 
    ["壬", "癸", "甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"], 
    ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸", "甲", "乙"]  
  ];
  const stemGroup = yearStemIdx % 5;
  const monthStemIdxLookup = ((branchIndex - 2) % 12 + 12) % 12;
  const monthStem = monthlyStemsTable[stemGroup][monthStemIdxLookup];

  const monthPillar = { stem: monthStem, stemKr: HEAVENLY_STEMS_KR[HEAVENLY_STEMS.indexOf(monthStem)], branch: currentMonthBranch, branchKr: EARTHLY_BRANCHES_KR[branchIndex] };

  const utcDate = Date.UTC(year, month - 1, day, 12, 0, 0);
  const julianDay = (utcDate / 86400000) + 2440587.5;
  const dayIndex = Math.floor(julianDay + 49) % 60;
  
  const dayStemIdx = ((dayIndex % 10) + 10) % 10;
  const dayBranchIdx = ((dayIndex % 12) + 12) % 12;
  const dayPillar = { stem: HEAVENLY_STEMS[dayStemIdx], stemKr: HEAVENLY_STEMS_KR[dayStemIdx], branch: EARTHLY_BRANCHES[dayBranchIdx], branchKr: EARTHLY_BRANCHES_KR[dayBranchIdx] };

  let hourVal = 0;
  if (timeStr) {
    const parts = timeStr.split(":");
    hourVal = (parseInt(parts[0], 10) || 0) + (parseInt(parts[1], 10) || 0) / 60;
  }
  
  const kstHour = (hourVal + 0.5) % 24; 
  const hourBranchIdx = Math.floor(kstHour / 2) % 12;
  const currentHourBranch = EARTHLY_BRANCHES[hourBranchIdx];

  const hourlyStemsTable = [
    ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸", "甲", "乙"], 
    ["丙", "丁", "戊", "己", "庚", "辛", "壬", "癸", "甲", "乙", "丙", "丁"], 
    ["戊", "己", "庚", "辛", "壬", "癸", "甲", "乙", "丙", "丁", "戊", "己"], 
    ["庚", "辛", "壬", "癸", "甲", "乙", "丙", "丁", "戊", "己", "庚", "辛"], 
    ["壬", "癸", "甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"]  
  ];
  const hourStem = hourlyStemsTable[dayStemIdx % 5][hourBranchIdx];

  const hourPillar = { stem: hourStem, stemKr: HEAVENLY_STEMS_KR[HEAVENLY_STEMS.indexOf(hourStem)], branch: currentHourBranch, branchKr: EARTHLY_BRANCHES_KR[hourBranchIdx] };

  return { year: yearPillar, month: monthPillar, day: dayPillar, hour: hourPillar, genderFactor: yearStemIdx % 2 === 0 ? "陽" : "陰" };
};

export const calculateMajorFortunes = (birthDateStr, timeStr, gender, pillars) => {
  const birthDateTime = new Date(`${birthDateStr}T${timeStr || "12:00"}:00+09:00`);
  const birthYear = birthDateTime.getFullYear();
  
  let foundIdx = -1;
  for (let i = 0; i < 24; i++) {
    if (birthDateTime >= getSolarTermDate(birthYear, i)) {
      foundIdx = i;
    }
  }

  let prevTerm, nextTerm;
  if (foundIdx === -1) {
    prevTerm = getSolarTermDate(birthYear - 1, 23);
    nextTerm = getSolarTermDate(birthYear, 0);
  } else if (foundIdx === 23) {
    prevTerm = getSolarTermDate(birthYear, 23);
    nextTerm = getSolarTermDate(birthYear + 1, 0);
  } else {
    prevTerm = getSolarTermDate(birthYear, foundIdx);
    nextTerm = getSolarTermDate(birthYear, foundIdx + 1);
  }

  const isYangYear = pillars.genderFactor === "陽";
  const isMale = gender === "male";
  const isForward = (isYangYear && isMale) || (!isYangYear && !isMale);

  let diffDays = isForward
    ? (nextTerm.getTime() - birthDateTime.getTime()) / (1000 * 60 * 60 * 24)
    : (birthDateTime.getTime() - prevTerm.getTime()) / (1000 * 60 * 60 * 24);

  if (diffDays < 0) diffDays = 0;

  let majorAgeNum = Math.floor(diffDays / 3);
  const remainder = diffDays % 3;
  if (remainder >= 2) majorAgeNum += 1;
  if (majorAgeNum === 0 || isNaN(majorAgeNum)) majorAgeNum = 1; 

  const list = [];
  const currentMonthStemIdx = HEAVENLY_STEMS.indexOf(pillars.month.stem);
  const currentMonthBranchIdx = EARTHLY_BRANCHES.indexOf(pillars.month.branch);

  for (let i = 1; i <= 8; i++) {
    const step = isForward ? i : -i;
    const stemIdx = ((currentMonthStemIdx + step) % 10 + 10) % 10;
    const branchIdx = ((currentMonthBranchIdx + step) % 12 + 12) % 12;
    const age = majorAgeNum + (i - 1) * 10;
    
    list.push({
      age: age,
      stem: HEAVENLY_STEMS[stemIdx],
      stemKr: HEAVENLY_STEMS_KR[stemIdx],
      branch: EARTHLY_BRANCHES[branchIdx],
      branchKr: EARTHLY_BRANCHES_KR[branchIdx]
    });
  }

  return { majorAge: majorAgeNum, direction: isForward ? "순행(順行)" : "역행(逆行)", fortunes: list };
};

export const calculateZiweiPalace = (pillars) => {
  const monthIdx = EARTHLY_BRANCHES.indexOf(pillars.month.branch) + 1; 
  const hourIdx = EARTHLY_BRANCHES.indexOf(pillars.hour.branch) + 1; 

  const lifePalaceIdx = ((2 + (monthIdx - 1) - (hourIdx - 1)) % 12 + 12) % 12;
  const bodyPalaceIdx = ((2 + (monthIdx - 1) + (hourIdx - 1)) % 12 + 12) % 12;

  const palaces = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];
  return { lifePalace: palaces[lifePalaceIdx], bodyPalace: palaces[bodyPalaceIdx] };
};

export const fetchGemini = async (payload, isJson = false) => {
  const url = `/api/gemini`;

  // generationConfig를 payload에서 분리
  const { generationConfig, ...rest } = payload;
  const body = {
    contents: rest.contents,
    generationConfig: isJson
      ? {
          ...generationConfig,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              reportTitle: { type: "STRING" },
              summary: { type: "STRING" },
              learningStyle: { type: "OBJECT", properties: { description: { type: "STRING" }, bestMethod: { type: "STRING" }, keywords: { type: "ARRAY", items: { type: "STRING" } } } },
              aptitudeAndMajor: { type: "OBJECT", properties: { aptitude: { type: "STRING" }, top3Majors: { type: "ARRAY", items: { type: "STRING" } }, liberalArtsVsScience: { type: "STRING" } } },
              peerRelationships: { type: "OBJECT", properties: { socialStyle: { type: "STRING" }, schoolLifeAdvice: { type: "STRING" } } },
              examLuck: { type: "OBJECT", properties: { peakExamYears: { type: "STRING" }, focusAdvice: { type: "STRING" } } },
              parentRelationship: { type: "OBJECT", properties: { parentChildDynamics: { type: "STRING" }, parentGuidance: { type: "STRING" } } },
              mysticalInterpretation: { type: "OBJECT", properties: { daeunAnalysis: { type: "STRING" }, ziweiDetails: { type: "STRING" } } }
            },
            required: ["reportTitle", "summary", "learningStyle", "aptitudeAndMajor", "peerRelationships", "examLuck", "parentRelationship", "mysticalInterpretation"]
          }
        }
      : generationConfig,
    isJson,
  };

  const delays = [1000, 2000, 4000, 8000, 16000];
  let lastError = null;

  for (let i = 0; i < 5; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error(`API 응답 실패 (${response.status})`);
      const data = await response.json();
      if (!data.success) throw new Error(data.message || "서버 오류");
      return isJson ? JSON.parse(data.text) : data.text;
    } catch (error) {
      lastError = error;
      if (i < 4) await new Promise(r => setTimeout(r, delays[i]));
    }
  }
  throw lastError;
};
