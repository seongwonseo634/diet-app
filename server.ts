import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleAuth } from 'google-auth-library';
import { google } from 'googleapis';

// 1. 구글 시트 API를 위한 초기화 함수
async function getSheetsClient() {
  const auth = new GoogleAuth({
    keyFile: '/etc/secrets/google-credentials.json', // Render의 Secret Files 마운트 경로
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  return google.sheets({ version: 'v4', auth });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // 2. 구글 시트 연동 API 엔드포인트
  app.get('/api/diet/food-data', async (req, res) => {
    try {
      const sheets = await getSheetsClient();
      const spreadsheetId = process.env.SHEET_ID;
      
      if (!spreadsheetId) {
        throw new Error("SHEET_ID 환경변수가 설정되지 않았습니다.");
      }

      // '음식DB' 시트의 데이터를 범위로 읽어옴
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: '음식DB!A:C',
      });

      const rows = response.data.values;
      if (!rows || rows.length <= 1) {
        return res.json({ db: {}, categories: [] });
      }

      // 기존 Apps Script의 데이터 파싱 구조 유지
      const db: any = {};
      const categories: string[] = [];

      // 헤더(1행) 제외하고 데이터 처리
      for (let i = 1; i < rows.length; i++) {
        const [category, name, kcal] = rows[i];
        if (!category || !name) continue;
        if (!db[category]) {
          db[category] = {};
          categories.push(category);
        }
        db[category][name] = kcal;
      }

      res.json({ db, categories });
    } catch (e: any) {
      console.error("Google Sheets API Error:", e);
      res.status(500).json({ error: e.toString() });
    }
  });

  // --- 기존 코드 (AI 기능 등) 시작 ---
  app.post('/api/ai/report', async (req, res) => {
    try {
      const { generateFinancialAdvice } = await import('./src/lib/geminiService');
      const { transactions, assets, budgets, question } = req.body;
      const advice = await generateFinancialAdvice({ transactions, assets, budgets }, question);
      res.json({ advice });
    } catch (e: any) {
      console.error("AI Report Route Error:", e);
      res.status(500).json({ error: 'AI 분석 중 오류 발생' });
    }
  });
  // ... (이하 기존의 다른 app.post(...) 라우트들 동일하게 유지)
  
  // (중략 - 기존의 다른 모든 API 라우트들을 여기에 그대로 두세요)

  // --- 기존 코드 유지 끝 ---

  // 정적 파일 및 SPA Fallback 설정
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), 'dist')));
  }

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(
      process.env.NODE_ENV === 'production'
        ? path.join(process.cwd(), 'dist', 'index.html')
        : path.join(process.cwd(), 'index.html')
    );
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();