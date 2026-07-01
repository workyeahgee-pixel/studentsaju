const fs = require('fs');
let code = fs.readFileSync('app/page.js', 'utf8');

code = code.replace(/위 정밀 데이터를 수용하여 종합 사주 및 자미두수 레포트를 작성하세요\./g, "위 정밀 데이터를 수용하여 학생의 진로, 학업, 교우관계 등에 특화된 '학생 진로 및 학업 명리 상담 레포트'를 작성하세요.");
code = code.replace(/최고의 명리학 전문가로서 지장간, 신살, 대운 세수, 자미두수의 이치에 입각해 논리정연하고 권위 있는 레포트 결과값을 한글 JSON으로 제공해 주십시오\./g, "당신은 사주 명리와 자미두수를 바탕으로 학생의 잠재력을 이끌어내는 최고의 청소년 진로 및 학업 전문 카운셀러입니다. 지장간, 신살, 대운 세수, 자미두수의 이치에 입각해 논리정연하고 따뜻한 조언이 담긴 레포트 결과값을 한글 JSON으로 제공해 주십시오.");
code = code.replace(/반갑습니다, \${form\.name}님\. 오차 없이 조율된 만세력과 대운 분석에 기초한 천명 리포트가 완성되었습니다\. 의문나는 부분을 우측 상담창에 적어주시면 천천히 풀어 드리겠습니다\./g, "반갑습니다, ${form.name} 학생(학부모)님. 오차 없이 조율된 만세력과 대운 분석에 기초한 학생 맞춤형 진로/학업 리포트가 완성되었습니다. 궁금한 점이 있으시면 우측 상담창에 질문해 주세요.");
code = code.replace(/당신은 사용자의 사주와 자미두수 분석 레포트를 숙지한 전문 인생 카운셀러입니다\. 명리학적 전문 용어와 실질적인 조언을 알맞게 조화시켜 정중하게 대화하십시오\./g, "당신은 사용자의 사주와 자미두수 분석 레포트를 숙지한 청소년 진로/학업 전문 카운셀러입니다. 학생 본인 또는 학부모가 질문할 수 있음을 인지하고, 명리학적 이치와 실질적인 교육학적 조언을 조화시켜 정중하고 따뜻하게 대화하십시오.");

code = code.replace(/타고난 천성과 기질/g, '타고난 학습 성향 및 기질');
code = code.replace(/report\.innateNature\.description/g, 'report.learningStyle.description');
code = code.replace(/성향적 기질/g, '최적의 공부법');
code = code.replace(/report\.innateNature\.temperament/g, 'report.learningStyle.bestMethod');
code = code.replace(/report\.innateNature\.keywords/g, 'report.learningStyle.keywords');

code = code.replace(/천직\(天職\) 및 추천 커리어/g, '학업 적성 및 전공 추천');
code = code.replace(/report\.career\.aptitude/g, 'report.aptitudeAndMajor.aptitude');
code = code.replace(/상위 5개 구체적 직업군/g, '추천 전공 Top 3 및 문이과 성향');
code = code.replace(/report\.career\.top5Jobs/g, 'report.aptitudeAndMajor.top3Majors');
code = code.replace(/\{report\.career\.top5Jobs\.map/g, '{report.aptitudeAndMajor?.liberalArtsVsScience && <div className="px-3 py-2 bg-slate-950/40 rounded-xl border border-slate-800 text-sm mb-2 text-emerald-300 font-bold">{report.aptitudeAndMajor.liberalArtsVsScience}</div>}\n                        {report.aptitudeAndMajor.top3Majors.map');

code = code.replace(/배필\(配匹\) 및 부부 인연운/g, '교우 관계 및 학교 생활');
code = code.replace(/인연을 만나는 시기/g, '사회성 및 교우 관계 스타일');
code = code.replace(/report\.family\.spouseTiming/g, 'report.peerRelationships.socialStyle');
code = code.replace(/배우자의 외양 및 성정/g, '학교 생활 조언');
code = code.replace(/report\.family\.spouseAppearance/g, 'report.peerRelationships.schoolLifeAdvice');

code = code.replace(/자손\(子孫\) 및 가정운/g, '부모와의 관계 및 지도 방향');
code = code.replace(/예상 자녀수 및 성별 구성/g, '자녀와의 상호작용 (역학적 해석)');
code = code.replace(/report\.family\.childrenGenderCount/g, 'report.parentRelationship.parentChildDynamics');
code = code.replace(/자녀의 운명적 성향/g, '학부모를 위한 올바른 지도 가이드');
code = code.replace(/report\.family\.childrenInfo/g, 'report.parentRelationship.parentGuidance');

code = code.replace(/재물적 전성기 및 사회적 성취 지형도/g, '시험운 및 학업 성취 시기');
code = code.replace(/재물운 대기운 최고점/g, '학업 잠재력 폭발 시기 (운세 기반)');
code = code.replace(/report\.wealthSuccess\.wealthPeak/g, 'report.examLuck.peakExamYears');
code = code.replace(/인생 최고 성장 고도/g, '집중력을 위한 조언');
code = code.replace(/report\.wealthSuccess\.growthCeiling/g, 'report.examLuck.focusAdvice');

// Remove socialStatus div
code = code.replace(/<div className="bg-slate-950\/80 p-5 rounded-2xl border border-slate-800">\s*<p className="text-xs text-slate-500 mb-1\.5 uppercase font-semibold tracking-wider">사회적 도달 격국<\/p>\s*<p className="text-white font-bold text-base">\{report\.wealthSuccess\.socialStatus\}<\/p>\s*<\/div>/g, '');
code = code.replace(/sm:grid-cols-3/g, 'sm:grid-cols-2');

code = code.replace(/AI 제왕의 명리 센터/g, 'AI 학생 진로/학업 상담소');
code = code.replace(/AI 제왕의 명리/g, 'AI 사주 학생 진로 상담소');
code = code.replace(/천문 공식 기반 정밀 알고리즘으로 설계된 평생 명반/g, '명리와 자미두수를 결합한 학생 맞춤형 심층 분석');
code = code.replace(/성명해독 및 천명\(天命\) 총평/g, '학생 진로 및 학업 총평');

fs.writeFileSync('app/page.js', code);
console.log('Update complete');
