const fs = require('fs'); 
const content = fs.readFileSync('C:/Users/sh678/Desktop/saju/saju', 'utf8'); 
const componentCode = content.substring(content.indexOf('const KingSajuZiwei = () => {')); 
const imports = `"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, User, Calendar, Clock, Send, MessageSquare, ChevronRight, Award, Briefcase, Heart, Users, TrendingUp, RefreshCcw, Info, Star, Shield, Zap, Gem, AlertCircle, X, History, Menu } from 'lucide-react';
import { app, auth, db, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, collection, doc, addDoc, updateDoc, onSnapshot, serverTimestamp } from '../lib/firebase';
import { STEM_COLORS, BRANCH_COLORS, JI_JANG_GAN, getSolarTermDate, analyzeHarmonics, calculateSajuPillars, calculateMajorFortunes, calculateZiweiPalace, fetchGemini } from '../lib/saju';

const appId = process.env.NEXT_PUBLIC_APP_ID || 'saju-counseling-app';

`; 
fs.writeFileSync('app/page.js', imports + componentCode);
