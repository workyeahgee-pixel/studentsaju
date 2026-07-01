"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, User, Calendar, Clock, Send, MessageSquare, ChevronRight, Award, Briefcase, Heart, Users, TrendingUp, RefreshCcw, Info, Star, Shield, Zap, Gem, AlertCircle, X, History, Menu, Trash2, Save, FileText, Code, BookOpen } from 'lucide-react';
import { app, auth, db, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp } from '../lib/firebase';
import { STEM_COLORS, BRANCH_COLORS, JI_JANG_GAN, getSolarTermDate, analyzeHarmonics, calculateSajuPillars, calculateMajorFortunes, calculateZiweiPalace, fetchGemini } from '../lib/saju';

const appId = process.env.NEXT_PUBLIC_APP_ID || 'saju-counseling-app';

const KingSajuZiwei = () => {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [form, setForm] = useState({ name: '', gender: 'male', calendar: 'solar', date: '', time: '', isTimeUnknown: false });
  const [report, setReport] = useState(null);
  const [calculatedSaju, setCalculatedSaju] = useState(null);
  const [calculatedDaeun, setCalculatedDaeun] = useState(null);
  const [ziweiPalace, setZiweiPalace] = useState(null);
  const [harmonicsText, setHarmonicsText] = useState("");
  const [chat, setChat] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [histories, setHistories] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [currentDocId, setCurrentDocId] = useState(null);
  const [counselingNote, setCounselingNote] = useState('');
  const [modalType, setModalType] = useState(null);

  const chatEndRef = useRef(null);

  // Firebase Auth & Real-time History Fetch
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        setView(prev => prev === 'login' ? 'input' : prev);
      } else {
        setView('login');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Google Login Error:", error);
      setErrorMessage("구글 로그인 중 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    if (!user || !db || !appId) return;
    const reportsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'saju_reports');
    const unsubscribe = onSnapshot(reportsRef, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setHistories(data);
    }, (error) => console.error("Snapshot error:", error));
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat, isChatting]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setView('loading');
    setErrorMessage('');

    try {
      const timeInput = form.isTimeUnknown ? "" : form.time;
      const pillars = calculateSajuPillars(form.date, timeInput);
      const daeunData = calculateMajorFortunes(form.date, timeInput, form.gender, pillars);
      const ziwei = calculateZiweiPalace(pillars);
      const harmony = analyzeHarmonics(pillars);

      setCalculatedSaju(pillars);
      setCalculatedDaeun(daeunData);
      setZiweiPalace(ziwei);
      setHarmonicsText(harmony);

      const prompt = `
        사용자 이름: ${form.name} (${form.gender === 'male' ? '남성' : '여성'})
        생년월일: ${form.date} (${form.calendar === 'solar' ? '양력' : '음력'})
        태어난 시각: ${form.isTimeUnknown ? '모름' : form.time}

        [연산 완료된 원국 간지 데이터]
        - 년주: ${pillars.year.stem}${pillars.year.branch}
        - 월주: ${pillars.month.stem}${pillars.month.branch}
        - 일주: ${pillars.day.stem}${pillars.day.branch}
        - 시주: ${pillars.hour.stem}${pillars.hour.branch}

        [대운 정보]
        - 대운수: ${daeunData.majorAge}세 / 방향: ${daeunData.direction}
        - 대운 흐름: ${daeunData.fortunes.map(f => `${f.age}세(${f.stem}${f.branch})`).join(", ")}

        [자미두수 명반]
        - 명궁: ${ziwei.lifePalace}궁 / 신궁: ${ziwei.bodyPalace}궁

        [합충형파해]: ${harmony}

        위 정밀 데이터를 수용하여 학생의 진로, 학업, 교우관계 등에 특화된 '학생 진로 및 학업 명리 상담 레포트'를 작성하세요.
      `;

      const data = await fetchGemini({
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: "당신은 사주 명리와 자미두수를 바탕으로 학생의 잠재력을 이끌어내는 최고의 청소년 진로 및 학업 전문 카운셀러입니다. 지장간, 신살, 대운 세수, 자미두수의 이치에 입각해 논리정연하고 따뜻한 조언이 담긴 레포트 결과값을 한글 JSON으로 제공해 주십시오." }] }
      }, true);

      const initialChat = [{ role: 'model', text: `반갑습니다, ${form.name} 학생(학부모)님. 오차 없이 조율된 만세력과 대운 분석에 기초한 학생 맞춤형 진로/학업 리포트가 완성되었습니다. 궁금한 점이 있으시면 우측 상담창에 질문해 주세요.` }];
      
      setReport(data);
      setChat(initialChat);
      setView('report');

      // Firestore 저장
      if (user && db && appId) {
        const newDocRef = await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'saju_reports'), {
          createdAt: serverTimestamp(),
          form,
          report: data,
          calculatedSaju: pillars,
          calculatedDaeun: daeunData,
          ziweiPalace: ziwei,
          harmonicsText: harmony,
          chat: initialChat,
          counselingNote: ''
        });
        setCurrentDocId(newDocRef.id);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("하늘의 기운을 해독하는 과정에서 통신 장해가 발생했습니다. 잠시 후 다시 해독을 시작해 주세요.");
      setView('input');
    }
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatting) return;
    
    const userMsg = chatInput;
    setChatInput('');
    const newChat = [...chat, { role: 'user', text: userMsg }];
    setChat(newChat);
    setIsChatting(true);

    try {
      const history = [
        { 
          role: 'user', 
          parts: [{ text: `
            내 사주 리포트 데이터: ${JSON.stringify(report)}. 
            확정 원국: 년주(${calculatedSaju.year.stem}${calculatedSaju.year.branch}), 월주(${calculatedSaju.month.stem}${calculatedSaju.month.branch}), 일주(${calculatedSaju.day.stem}${calculatedSaju.day.branch}), 시주(${calculatedSaju.hour.stem}${calculatedSaju.hour.branch}).
            확정 대운: ${calculatedDaeun.fortunes.map(f => `${f.age}세(${f.stem}${f.branch})`).join(", ")}.
            이 틀에 근거해서 질문에 답해줘.` }] 
        },
        { role: 'model', parts: [{ text: "네, 확정된 사주원국과 대운 나이대를 명확히 지키며 심도 있는 대화를 나누겠습니다." }] },
        ...newChat.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }))
      ];

      const res = await fetchGemini({ 
        contents: history,
        systemInstruction: { parts: [{ text: "당신은 사용자의 사주와 자미두수 분석 레포트를 숙지한 청소년 진로/학업 전문 카운셀러입니다. 학생 본인 또는 학부모가 질문할 수 있음을 인지하고, 명리학적 이치와 실질적인 교육학적 조언을 조화시켜 정중하고 따뜻하게 대화하십시오." }] }
      });
      
      const finalChat = [...newChat, { role: 'model', text: res }];
      setChat(finalChat);

      // Firestore 대화 내역 업데이트
      if (user && db && appId && currentDocId) {
        await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'saju_reports', currentDocId), {
          chat: finalChat
        });
      }
    } catch (err) {
      setChat(prev => [...prev, { role: 'model', text: "기운이 일시적으로 분산되어 답변을 가져오지 못했습니다. 다시 한 번 질문해 주시겠습니까?" }]);
    } finally {
      setIsChatting(false);
    }
  };

  const loadHistoryItem = (item) => {
    setForm(item.form);
    setReport(item.report);
    setCalculatedSaju(item.calculatedSaju);
    setCalculatedDaeun(item.calculatedDaeun);
    setZiweiPalace(item.ziweiPalace);
    setHarmonicsText(item.harmonicsText);
    setChat(item.chat || []);
    setCounselingNote(item.counselingNote || '');
    setCurrentDocId(item.id);
    setView('report');
    setIsHistoryOpen(false);
  };

  const resetToInput = () => {
    setView('input');
    setForm({ name: '', gender: 'male', calendar: 'solar', date: '', time: '', isTimeUnknown: false });
    setCurrentDocId(null);
    setCounselingNote('');
  };

  const handleDeleteHistory = async (e, id) => {
    e.stopPropagation();
    if (confirm('이 기록을 정말 삭제하시겠습니까?')) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'saju_reports', id));
        if (currentDocId === id) resetToInput();
      } catch (err) {
        console.error("Delete Error:", err);
      }
    }
  };

  const handleSaveNote = async () => {
    if (!currentDocId || !user) return;
    try {
      await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'saju_reports', currentDocId), {
        counselingNote
      });
      alert('상담 일지가 저장되었습니다.');
    } catch (err) {
      console.error("Note Save Error:", err);
      alert('저장에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-amber-500/30 overflow-x-hidden relative flex flex-col md:flex-row">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black pointer-events-none z-0"></div>

      {/* History Sidebar */}
      <div className={`fixed inset-0 z-50 transform ${isHistoryOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 md:relative md:translate-x-0 ${isHistoryOpen ? 'w-full md:w-80' : 'w-0'} flex shrink-0`}>
        {/* Mobile backdrop */}
        <div className="absolute inset-0 bg-black/60 md:hidden" onClick={() => setIsHistoryOpen(false)}></div>
        
        <div className={`relative bg-slate-900 border-r border-slate-800 h-full overflow-y-auto flex flex-col shadow-2xl w-80 max-w-[80vw] ${!isHistoryOpen && 'hidden md:flex'}`}>
          <div className="p-5 border-b border-slate-800 flex justify-between items-center sticky top-0 bg-slate-900/90 backdrop-blur z-10">
            <h2 className="text-white font-bold flex items-center gap-2"><History className="w-5 h-5 text-amber-500" /> 이전 해독 기록</h2>
            <button className="md:hidden" onClick={() => setIsHistoryOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
          </div>
          <div className="p-4 flex flex-col gap-3">
            {histories.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-10">저장된 기록이 없습니다.</p>
            ) : (
              histories.map(h => (
                <div key={h.id} className={`p-4 rounded-xl border transition flex flex-col gap-1.5 ${currentDocId === h.id ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800'}`}>
                  <div className="flex justify-between items-start cursor-pointer" onClick={() => loadHistoryItem(h)}>
                    <span className="text-amber-400 font-bold text-[15px] flex items-center gap-2">
                      {h.form.name} 
                      <span className="px-2 py-0.5 bg-slate-950 rounded-md text-slate-400 text-[10px] font-normal">{h.form.gender === 'male' ? '남' : '여'}</span>
                    </span>
                    <button onClick={(e) => handleDeleteHistory(e, h.id)} className="p-1.5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition" title="기록 삭제">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-slate-400 text-xs flex items-center gap-1.5 cursor-pointer" onClick={() => loadHistoryItem(h)}>
                    <Calendar className="w-3 h-3" /> {h.form.date} 
                    {h.form.time && <><Clock className="w-3 h-3 ml-1" /> {h.form.time}</>}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col relative z-10 min-w-0">
        
        {/* Mobile Header Toggle */}
        <div className="md:hidden p-4 flex items-center justify-between bg-slate-900 border-b border-slate-800">
          <button onClick={() => setIsHistoryOpen(true)} className="p-2 bg-slate-800 rounded-lg text-amber-500 flex items-center gap-2 text-sm font-bold">
            <Menu className="w-5 h-5" /> 기록
          </button>
          <span className="text-white font-bold tracking-tight">타고난 기질로 파악하는 학생 사주상담</span>
        </div>

        {view === 'login' && (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-amber-500/30 p-10 shadow-[0_0_60px_rgba(245,158,11,0.15)] text-center">
              <div className="inline-block p-4 rounded-full bg-amber-500/10 mb-6 border border-amber-500/20">
                <Shield className="w-10 h-10 text-amber-500" />
              </div>
              <h1 className="text-3xl font-extrabold text-white mb-3 tracking-tight">명리 센터 입장</h1>
              <p className="text-slate-400 text-sm mb-8">구글 계정으로 로그인하여 나만의 사주와 자미두수 명반을 영구적으로 저장하세요.</p>
              
              {errorMessage && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3 text-red-200 animate-fadeIn text-left">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
                  <div className="flex-1 text-sm leading-relaxed">
                    <p className="font-bold mb-1">오류</p>
                    <p>{errorMessage}</p>
                  </div>
                </div>
              )}

              <button 
                onClick={handleGoogleLogin} 
                className="w-full py-4 px-6 bg-white hover:bg-slate-50 text-slate-900 rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl border border-slate-200"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google 계정으로 계속하기
              </button>
            </div>
          </div>
        )}

        {view === 'input' && (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="max-w-xl w-full bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-amber-500/30 p-8 shadow-[0_0_60px_rgba(245,158,11,0.15)]">
              
              {errorMessage && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-start gap-3 text-red-200 animate-fadeIn">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
                  <div className="flex-1 text-sm leading-relaxed">
                    <p className="font-bold mb-1">해독 실패</p>
                    <p>{errorMessage}</p>
                  </div>
                  <button onClick={() => setErrorMessage('')} className="p-1 hover:bg-white/10 rounded-lg transition"><X className="w-4 h-4 text-red-400" /></button>
                </div>
              )}

              <div className="text-center mb-8">
                <div className="inline-block p-4 rounded-full bg-amber-500/10 mb-4 border border-amber-500/20">
                  <Star className="w-8 h-8 text-amber-500 animate-pulse" />
                </div>
                <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">AI 학생 진로/학업 상담소</h1>
                <p className="text-slate-400 text-sm">명리와 자미두수를 결합한 학생 맞춤형 심층 분석</p>
              </div>

              <form onSubmit={handleGenerate} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-slate-300 flex items-center gap-2 font-medium"><User className="w-4 h-4 text-amber-400"/> 성함</label>
                    <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition" placeholder="성함 입력" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-slate-300 font-medium">성별</label>
                    <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value})} className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500 transition">
                      <option value="male">남성</option>
                      <option value="female">여성</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm text-slate-300 flex items-center gap-2 font-medium"><Calendar className="w-4 h-4 text-amber-400"/> 생년월일</label>
                    <input required type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500 transition" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-slate-300 font-medium">양/음력</label>
                    <select value={form.calendar} onChange={e => setForm({...form, calendar: e.target.value})} className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500 transition">
                      <option value="solar">양력</option>
                      <option value="lunar">음력</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-slate-300 flex items-center gap-2 font-medium">
                    <Clock className="w-4 h-4 text-amber-400"/> 태어난 시간
                    <span className="text-xs text-slate-500">(자미두수의 정확한 격국 구성을 위해 중요)</span>
                  </label>
                  <div className="flex gap-4">
                    <input disabled={form.isTimeUnknown} required={!form.isTimeUnknown} type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} className="flex-1 bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-3 text-white outline-none focus:border-amber-500 transition disabled:opacity-40" />
                    <label className="flex items-center gap-2 text-slate-400 cursor-pointer text-sm">
                      <input type="checkbox" checked={form.isTimeUnknown} onChange={e => setForm({...form, isTimeUnknown: e.target.checked})} className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0 focus:ring-offset-0" /> 시간모름
                    </label>
                  </div>
                </div>

                <button type="submit" className="w-full mt-2 py-4 bg-gradient-to-r from-amber-600 to-amber-500 rounded-xl text-white font-bold text-lg hover:from-amber-500 hover:to-amber-400 shadow-[0_4px_25px_rgba(245,158,11,0.25)] transition-all active:scale-[0.98]">
                  천명 해독 시작
                </button>
              </form>
            </div>
          </div>
        )}

        {view === 'loading' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="relative mb-8">
              <div className="w-24 h-24 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center"><Star className="w-8 h-8 text-amber-500 animate-pulse" /></div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">명반(命盤) 및 대운(大運) 정밀 계산 중...</h2>
            <p className="text-slate-400 max-w-md mx-auto text-sm leading-relaxed">절입 시간 오차를 차단하기 위한 24절기 천문 좌표 상수 산출 및 데이터 동기화 중입니다.</p>
          </div>
        )}

        {view === 'report' && report && calculatedSaju && calculatedDaeun && ziweiPalace && (
          <div className="flex-1 flex flex-col h-full md:h-screen max-h-screen">
            
            <header className="border-b border-slate-800 bg-slate-900/75 backdrop-blur-md px-6 py-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                  <Award className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight line-clamp-1">{report.reportTitle}</h1>
                  <p className="text-amber-500 text-[10px] font-mono uppercase tracking-widest flex items-center gap-1 mt-0.5">
                    <Star className="w-2.5 h-2.5" /> 100% 정밀 연정 만세력 배합
                  </p>
                </div>
              </div>
              <button onClick={resetToInput} className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl transition text-slate-300 flex items-center gap-2 text-sm whitespace-nowrap">
                <RefreshCcw className="w-4 h-4" /> <span className="hidden sm:inline">새로 입력</span>
              </button>
            </header>

            <main className="flex-1 p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden min-h-0">
              
              <div className="lg:col-span-7 xl:col-span-8 space-y-6 overflow-y-auto pr-2 custom-scrollbar pb-10">
                
                <div className="bg-slate-900/90 p-6 rounded-3xl border border-amber-500/30 shadow-2xl">
                  <h2 className="text-sm font-bold text-slate-400 mb-4 tracking-widest flex items-center gap-2"><Info className="w-4 h-4 text-amber-500"/> 확정된 사주 원국 (四柱原局)</h2>
                  <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center">
                    {[
                      { label: "시주 (時柱)", stem: calculatedSaju.hour.stem, stemKr: calculatedSaju.hour.stemKr, branch: calculatedSaju.hour.branch, branchKr: calculatedSaju.hour.branchKr },
                      { label: "일주 (日柱)", stem: calculatedSaju.day.stem, stemKr: calculatedSaju.day.stemKr, branch: calculatedSaju.day.branch, branchKr: calculatedSaju.day.branchKr },
                      { label: "월주 (月柱)", stem: calculatedSaju.month.stem, stemKr: calculatedSaju.month.stemKr, branch: calculatedSaju.month.branch, branchKr: calculatedSaju.month.branchKr },
                      { label: "년주 (年柱)", stem: calculatedSaju.year.stem, stemKr: calculatedSaju.year.stemKr, branch: calculatedSaju.year.branch, branchKr: calculatedSaju.year.branchKr }
                    ].map((p, idx) => (
                      <div key={idx} className="bg-slate-950/60 p-3 sm:p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
                        <span className="text-[10px] text-slate-500 font-bold mb-2 block">{p.label}</span>
                        <div className="flex flex-col gap-1 my-1">
                          <span className={`text-2xl sm:text-3xl font-extrabold ${STEM_COLORS[p.stem] || 'text-white'}`}>{p.stem}</span>
                          <span className="text-xs text-slate-400 font-medium">{p.stemKr}</span>
                        </div>
                        <div className="h-px bg-slate-800 my-2"></div>
                        <div className="flex flex-col gap-1">
                          <span className={`text-2xl sm:text-3xl font-extrabold ${BRANCH_COLORS[p.branch] || 'text-amber-500'}`}>{p.branch}</span>
                          <span className="text-xs text-slate-400 font-medium">{p.branchKr}</span>
                        </div>
                        <div className="mt-3 p-1.5 sm:p-2 bg-slate-900/50 rounded-lg hidden sm:block">
                          <span className="text-[9px] text-slate-600 block mb-1">지장간 분포</span>
                          <span className="text-[10px] text-amber-400/80 font-mono font-semibold">{JI_JANG_GAN[p.branch]?.ratio || "-"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800">
                  <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                    <h2 className="text-sm font-bold text-slate-400 tracking-widest flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-400"/> 대운 흐름 (大運) — 시작세수 {calculatedDaeun.majorAge}세</h2>
                    <span className="text-xs text-emerald-400 font-semibold px-2 py-1 bg-emerald-500/10 rounded">{calculatedDaeun.direction}</span>
                  </div>
                  <div className="grid grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
                    {calculatedDaeun.fortunes.map((f, idx) => (
                      <div key={idx} className="bg-slate-950/60 p-2 sm:p-3 rounded-xl border border-slate-800 text-center flex flex-col justify-between">
                        <span className="text-[10px] sm:text-[11px] text-emerald-400 font-bold">{f.age}세</span>
                        <div className="my-1.5 flex flex-col justify-center items-center">
                          <span className="text-base sm:text-lg font-bold text-white">{f.stem}{f.branch}</span>
                          <span className="text-[10px] sm:text-xs text-slate-400 mt-0.5">{f.stemKr}{f.branchKr}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-900/90 to-slate-950/90 p-8 rounded-3xl border border-amber-500/20 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none"><Gem className="w-48 h-48 text-amber-500" /></div>
                  <h2 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-amber-400"/> 학생 진로 및 학업 총평</h2>
                  <p className="text-sm sm:text-base leading-relaxed text-slate-100 font-serif whitespace-pre-line">{report.summary}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-slate-900/60 backdrop-blur-sm p-6 rounded-3xl border border-slate-800/80 space-y-4">
                    <h3 className="text-white font-bold flex items-center gap-2 text-base"><User className="w-5 h-5 text-blue-400"/> 타고난 학습 성향 및 기질</h3>
                    <div className="space-y-3">
                      <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-line">{report.learningStyle.description}</p>
                      <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                        <p className="text-xs text-slate-400 font-semibold mb-1">최적의 공부법</p>
                        <p className="text-xs text-slate-300">{report.learningStyle.bestMethod}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {report.learningStyle.keywords.map((k, i) => <span key={i} className="px-2.5 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full border border-blue-500/20">#{k}</span>)}
                    </div>
                  </div>

                  <div className="bg-slate-900/60 backdrop-blur-sm p-6 rounded-3xl border border-slate-800/80 space-y-4">
                    <h3 className="text-white font-bold flex items-center gap-2 text-base"><Briefcase className="w-5 h-5 text-emerald-400"/> 학업 적성 및 전공 추천</h3>
                    <p className="text-sm text-slate-300 leading-relaxed">{report.aptitudeAndMajor.aptitude}</p>
                    <div className="space-y-2">
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">추천 전공 Top 3 및 문이과 성향</p>
                      <div className="grid grid-cols-1 gap-2">
                        {report.aptitudeAndMajor.top3Majors.map((job, i) => (
                          <div key={i} className="flex items-center gap-3 px-3 py-2 bg-slate-950/40 rounded-xl border border-slate-800 text-sm">
                            <span className="text-emerald-400 font-bold font-mono">0{i+1}</span>
                            <span className="text-slate-200 font-medium">{job}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/60 backdrop-blur-sm p-6 sm:p-8 rounded-3xl border border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-white font-bold flex items-center gap-2 text-base"><Heart className="w-5 h-5 text-rose-400"/> 교우 관계 및 학교 생활</h3>
                    <div className="space-y-3">
                      <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                        <p className="text-xs text-rose-300 font-semibold mb-1">사회성 및 교우 관계 스타일</p>
                        <p className="text-sm text-slate-200">{report.peerRelationships.socialStyle}</p>
                      </div>
                      <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                        <p className="text-xs text-rose-300 font-semibold mb-1">학교 생활 조언</p>
                        <p className="text-sm text-slate-300 leading-relaxed">{report.peerRelationships.schoolLifeAdvice}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-white font-bold flex items-center gap-2 text-base"><Users className="w-5 h-5 text-blue-400"/> 부모와의 관계 및 지도 방향</h3>
                    <div className="space-y-3">
                      <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                        <p className="text-xs text-blue-300 font-semibold mb-1">자녀와의 상호작용 (역학적 해석)</p>
                        <p className="text-sm text-slate-200">{report.parentRelationship.parentChildDynamics}</p>
                      </div>
                      <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                        <p className="text-xs text-blue-300 font-semibold mb-1">학부모를 위한 올바른 지도 가이드</p>
                        <p className="text-sm text-slate-300 leading-relaxed">{report.parentRelationship.parentGuidance}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-500/10 via-transparent to-transparent p-6 sm:p-8 rounded-3xl border border-amber-500/20 shadow-xl space-y-6">
                  <h3 className="text-lg font-bold text-amber-500 flex items-center gap-2"><TrendingUp className="w-6 h-6"/> 시험운 및 학업 성취 시기</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800">
                      <p className="text-xs text-slate-500 mb-1.5 uppercase font-semibold tracking-wider">학업 잠재력 폭발 시기 (운세 기반)</p>
                      <p className="text-amber-400 font-bold text-base">{report.examLuck.peakExamYears}</p>
                    </div>
                    <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800">
                      <p className="text-xs text-slate-500 mb-1.5 uppercase font-semibold tracking-wider">집중력을 위한 조언</p>
                      <p className="text-white font-bold text-base">{report.examLuck.focusAdvice}</p>
                    </div>
                    
                  </div>
                </div>

                <div className="bg-slate-900/30 p-6 rounded-3xl border border-slate-800/80 border-dashed space-y-4">
                  <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2"><Info className="w-4 h-4 text-indigo-400"/> 명학 분석 논리 (대운세수 & 자미두수 종합판정)</h3>
                  <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
                    <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-800">
                      <span className="text-amber-400 font-bold text-xs uppercase tracking-widest block mb-1">대운(大運) 해석</span>
                      <p className="whitespace-pre-line">{report.mysticalInterpretation.daeunAnalysis}</p>
                    </div>
                    <div className="p-4 bg-slate-950/40 rounded-2xl border border-slate-800">
                      <span className="text-blue-400 font-bold text-xs uppercase tracking-widest block mb-1">자미두수(紫微斗數) 격국 구성</span>
                      <p><strong>명궁 방향:</strong> {ziweiPalace.lifePalace}궁 / <strong>신궁 방향:</strong> {ziweiPalace.bodyPalace}궁 <br /> {report.mysticalInterpretation.ziweiDetails}</p>
                    </div>
                  </div>
                </div>

                {/* 상담 일지 */}
                <div className="bg-slate-900/80 p-6 rounded-3xl border border-amber-500/20 mt-6 shadow-xl">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white font-bold flex items-center gap-2"><FileText className="w-5 h-5 text-amber-500" /> 상담 일지 기록</h3>
                    <button onClick={handleSaveNote} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 text-sm font-bold rounded-xl transition shadow-lg flex items-center gap-2">
                      <Save className="w-4 h-4" /> 저장
                    </button>
                  </div>
                  <textarea 
                    value={counselingNote}
                    onChange={(e) => setCounselingNote(e.target.value)}
                    placeholder="학생과의 상담 내용, 특이사항, 향후 지도 계획 등을 자유롭게 기록하세요."
                    className="w-full h-40 bg-slate-950/80 border border-slate-700/80 rounded-xl p-4 text-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition resize-none custom-scrollbar text-sm leading-relaxed"
                  />
                </div>

              </div>

              <div className="lg:col-span-5 xl:col-span-4 flex flex-col bg-slate-900/90 backdrop-blur-md rounded-3xl border border-slate-800 overflow-hidden shadow-2xl h-[500px] lg:h-full">
                <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center gap-3 shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <MessageSquare className="w-5 h-5 text-slate-950" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-sm">실시간 AI 명리 주치의</h3>
                    <p className="text-xs text-slate-400">오차 0% 정밀 연정 기반 상담</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-900/50">
                  {chat.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-amber-600 text-white rounded-tr-none shadow-md font-medium' : 'bg-slate-800/80 text-slate-200 rounded-tl-none border border-slate-700 shadow-sm whitespace-pre-line'}`}>
                        {m.text}
                      </div>
                    </div>
                  ))}
                  {isChatting && (
                    <div className="flex justify-start">
                      <div className="bg-slate-800/80 px-4 py-3 rounded-2xl rounded-tl-none border border-slate-700 flex gap-1.5 items-center">
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce delay-75"></div>
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce delay-150"></div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleChat} className="p-4 bg-slate-950/80 border-t border-slate-800 shrink-0">
                  <div className="relative flex items-center">
                    <input 
                      value={chatInput} onChange={e => setChatInput(e.target.value)} disabled={isChatting}
                      placeholder="예: 내년의 운 흐름은 어떨까요?" 
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-4 pr-12 py-3.5 text-sm text-white placeholder-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition"
                    />
                    <button type="submit" disabled={isChatting || !chatInput.trim()} className="absolute right-2 p-2 text-amber-500 hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition">
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              </div>

            </main>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-auto bg-slate-900 border-t border-slate-800 p-6 flex flex-col items-center gap-4 z-10 shrink-0">
          <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-400 font-medium">
            <button onClick={() => setModalType('privacy')} className="hover:text-amber-500 transition">개인정보처리방침</button>
            <span className="text-slate-700">|</span>
            <button onClick={() => setModalType('terms')} className="hover:text-amber-500 transition">사용약관</button>
            <span className="text-slate-700">|</span>
            <button onClick={() => setModalType('usage')} className="hover:text-amber-500 transition">사용방법</button>
            <span className="text-slate-700">|</span>
            <a href="https://github.com/workyeahgee-pixel/studentsaju" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-amber-500 transition">
              <Code className="w-4 h-4" /> GitHub
            </a>
          </div>
          <div className="text-center text-slate-500 text-sm">
            학교명: <strong className="text-slate-300">서울정민학교</strong> &nbsp;|&nbsp; 제작자: <strong className="text-slate-300">신예지</strong>
          </div>
        </footer>
      </div>

      {/* Modals */}
      {modalType && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn" onClick={() => setModalType(null)}>
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-lg w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setModalType(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition">
              <X className="w-5 h-5" />
            </button>
            
            {modalType === 'privacy' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Shield className="w-6 h-6 text-amber-500" /> 개인정보처리방침</h2>
                <div className="space-y-4 text-sm text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto custom-scrollbar pr-2 whitespace-pre-wrap">
                  {`2. 표준 개인정보처리방침 (전문)

  [학생사주](이하 본 서비스)은(는) 개인정보 보호법 제30조에 따라 정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.
제1조 (개인정보의 처리 목적)
 본 서비스는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보 보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
학생 정보 관리: 학생의 생년월일, 생년월일에 따른 정보, 상담내용 등
제2조 (개인정보의 처리 및 보유기간)
 ① 본 서비스는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다. ② 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다.
보유 기간: 해당 학년도 종료 시(익년 2월 말) 또는 학생의 졸업/진급 시까지
파기 시점: 보유 기간 종료 후 지체 없이(5일 이내) 파기
제3조 (처리하는 개인정보 항목) 본 서비스는 학습 지원을 위해 필요한 최소한의 개인정보만을 수집합니다.
수집 항목: 아이디, 비밀번호, 이름(또는 닉네임), 학년, 반, 번호
수집하지 않는 항목: 주민등록번호, 주소, 전화번호, 이메일 등 불필요한 민감 정보
제4조 (만 14세 미만 아동의 개인정보 처리에 관한 사항)
 ① 본 서비스는 만 14세 미만 아동의 개인정보를 처리하기 위하여 가입 단계 또는 학기 초 학교 가정통신문(개인정보 수집·이용 동의서)을 통하여 법정대리인의 동의를 받습니다. ② 법정대리인이 동의하지 않는 경우, 해당 아동은 서비스 가입 및 이용이 제한될 수 있습니다.
제5조 (개인정보의 파기 절차 및 방법)
 ① 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다. 
② 파기 방법: 전자적 파일 형태로 기록·저장된 개인정보는 기록을 재생할 수 없도록 파기(DB 영구 삭제)하며, 종이 문서는 분쇄하거나 소각하여 파기합니다.
제6조 (개인정보의 안전성 확보조치)
 본 서비스는 개인정보 보호법 제29조에 따라 다음과 같이 안전성 확보에 필요한 기술적/관리적 및 물리적 조치를 하고 있습니다.
비밀번호 암호화: 이용자의 비밀번호는 일방향 암호화(Hash) 되어 저장 및 관리되며, 개발자(관리자)도 알 수 없습니다.
해킹 등에 대비한 기술적 대책: 보안 인증을 획득한 전문 클라우드 플랫폼([예: Google Firebase / AWS / Azure / Vercel 등 사용 플랫폼 기재])을 기반으로 운영되며, 전 구간 보안 통신(HTTPS)을 사용하여 데이터를 암호화하여 전송합니다.
개인정보 취급 직원의 최소화: 개인정보를 처리하는 담당자를 개발 교사 1인으로 지정하여 접근 권한을 관리합니다.
제7조 (정보주체와 법정대리인의 권리·의무 및 행사방법)
 ① 정보주체(학생) 및 법정대리인은 언제든지 개인정보 열람·정정·삭제·처리정지 요구 등의 권리를 행사할 수 있습니다. 
 ② 권리 행사는 서비스 내 [회원탈퇴] 기능을 통하여 즉시 가능하며, 또는 개발 교사에게 구두나 서면으로 요청하면 지체 없이 조치하겠습니다.
제8조 (개인정보 보호책임자)
 본 서비스는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
성명: [신예지] (개발자)
소속: [서울정민학교]
직위: 교사
연락처: [02-978-8406] (학교 교무실 내선 번호) (※ 개인정보보호를 위해 교사의 개인 휴대전화 번호는 기재하지 않습니다.)
제9조 (개인정보 처리방침 변경) 이 개인정보 처리방침은 2026년 [7]월 [1]일부터 적용됩니다.`}
                </div>
              </div>
            )}}
            
            {modalType === 'terms' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><FileText className="w-6 h-6 text-amber-500" /> 사용약관</h2>
                <div className="space-y-4 text-sm text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto custom-scrollbar pr-2 whitespace-pre-wrap">
                  {`2. 표준 개인정보처리방침 (전문)

  [학생사주](이하 본 서비스)은(는) 개인정보 보호법 제30조에 따라 정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.
제1조 (개인정보의 처리 목적)
 본 서비스는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보 보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
학생 정보 관리: 학생의 생년월일, 생년월일에 따른 정보, 상담내용 등
제2조 (개인정보의 처리 및 보유기간)
 ① 본 서비스는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다. ② 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다.
보유 기간: 해당 학년도 종료 시(익년 2월 말) 또는 학생의 졸업/진급 시까지
파기 시점: 보유 기간 종료 후 지체 없이(5일 이내) 파기
제3조 (처리하는 개인정보 항목) 본 서비스는 학습 지원을 위해 필요한 최소한의 개인정보만을 수집합니다.
수집 항목: 아이디, 비밀번호, 이름(또는 닉네임), 학년, 반, 번호
수집하지 않는 항목: 주민등록번호, 주소, 전화번호, 이메일 등 불필요한 민감 정보
제4조 (만 14세 미만 아동의 개인정보 처리에 관한 사항)
 ① 본 서비스는 만 14세 미만 아동의 개인정보를 처리하기 위하여 가입 단계 또는 학기 초 학교 가정통신문(개인정보 수집·이용 동의서)을 통하여 법정대리인의 동의를 받습니다. ② 법정대리인이 동의하지 않는 경우, 해당 아동은 서비스 가입 및 이용이 제한될 수 있습니다.
제5조 (개인정보의 파기 절차 및 방법)
 ① 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다. 
② 파기 방법: 전자적 파일 형태로 기록·저장된 개인정보는 기록을 재생할 수 없도록 파기(DB 영구 삭제)하며, 종이 문서는 분쇄하거나 소각하여 파기합니다.
제6조 (개인정보의 안전성 확보조치)
 본 서비스는 개인정보 보호법 제29조에 따라 다음과 같이 안전성 확보에 필요한 기술적/관리적 및 물리적 조치를 하고 있습니다.
비밀번호 암호화: 이용자의 비밀번호는 일방향 암호화(Hash) 되어 저장 및 관리되며, 개발자(관리자)도 알 수 없습니다.
해킹 등에 대비한 기술적 대책: 보안 인증을 획득한 전문 클라우드 플랫폼([예: Google Firebase / AWS / Azure / Vercel 등 사용 플랫폼 기재])을 기반으로 운영되며, 전 구간 보안 통신(HTTPS)을 사용하여 데이터를 암호화하여 전송합니다.
개인정보 취급 직원의 최소화: 개인정보를 처리하는 담당자를 개발 교사 1인으로 지정하여 접근 권한을 관리합니다.
제7조 (정보주체와 법정대리인의 권리·의무 및 행사방법)
 ① 정보주체(학생) 및 법정대리인은 언제든지 개인정보 열람·정정·삭제·처리정지 요구 등의 권리를 행사할 수 있습니다. 
 ② 권리 행사는 서비스 내 [회원탈퇴] 기능을 통하여 즉시 가능하며, 또는 개발 교사에게 구두나 서면으로 요청하면 지체 없이 조치하겠습니다.
제8조 (개인정보 보호책임자)
 본 서비스는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
성명: [신예지] (개발자)
소속: [서울정민학교]
직위: 교사
연락처: [02-978-8406] (학교 교무실 내선 번호) (※ 개인정보보호를 위해 교사의 개인 휴대전화 번호는 기재하지 않습니다.)
제9조 (개인정보 처리방침 변경) 이 개인정보 처리방침은 2026년 [7]월 [1]일부터 적용됩니다.`}
                </div>
              </div>
            )}}

            {modalType === 'usage' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><BookOpen className="w-6 h-6 text-amber-500" /> 사용방법 안내</h2>
                <div className="space-y-4 text-sm text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto custom-scrollbar pr-2 whitespace-pre-wrap">
                  {`사주팔자는 미신이 아닙니다. 생년월일일시로 그날의 타고난 기운을 알아볼 수 있는 신비한 학문이지요. 생년월일만 알아도 그사람의 기질과 성격을 80%는 알 수 있습니다. 따라서 학생들을 상담할때 활용하시기 바랍니다.`}
                </div>
              </div>
            )}}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f59e0b; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
      `}} />
    </div>
  );
};

export default KingSajuZiwei;