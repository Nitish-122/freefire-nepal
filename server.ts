import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { dbManager } from './server-db';
dotenv.config();

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // SHARED DATABASE & APP STATE API
  app.get('/api/app-data', async (req, res) => {
    try {
      const data = await dbManager.getAllData();
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // 1. MANUAL POINT OVERRIDE
  app.post('/api/users/point-override', async (req, res) => {
    try {
      const { uid, action, amount, note } = req.body;
      const result = await dbManager.pointOverride(uid, action, amount, note);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // 2. ACCOUNT STATUS TOGGLE
  app.post('/api/users/toggle-status', async (req, res) => {
    try {
      const { uid } = req.body;
      const result = await dbManager.toggleUserStatus(uid);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // 3. EDIT ROOM CREDENTIALS OVERRIDE
  app.post('/api/tournaments/credentials', async (req, res) => {
    try {
      const { tournamentId, roomId, roomPassword, isReleased } = req.body;
      const result = await dbManager.updateRoomCredentials(tournamentId, roomId, roomPassword, isReleased);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // 4. CANCEL MATCH & REFUND ALL
  app.post('/api/tournaments/cancel-and-refund', async (req, res) => {
    try {
      const { tournamentId, reason } = req.body;
      const result = await dbManager.cancelMatchAndRefund(tournamentId, reason);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // 5. DISTRIBUTE PRIZES
  app.post('/api/tournaments/distribute-prizes', async (req, res) => {
    try {
      const { tournamentId, resultData } = req.body;
      const result = await dbManager.distributePrizes(tournamentId, resultData);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // 6. SAVE TOURNAMENT
  app.post('/api/tournaments/save', async (req, res) => {
    try {
      const { tournament } = req.body;
      const result = await dbManager.saveTournament(tournament);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // 7. SAVE TRANSACTION
  app.post('/api/transactions/save', async (req, res) => {
    try {
      const { transaction } = req.body;
      const result = await dbManager.saveTransaction(transaction);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // 8. UPDATE SETTINGS (Khalti Mobile Number, etc.)
  app.post('/api/settings', async (req, res) => {
    try {
      const result = await dbManager.updateSettings(req.body);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // 9. SYSTEM NOTICE BOARD
  app.post('/api/notices', async (req, res) => {
    try {
      const { title, content } = req.body;
      const result = await dbManager.postNotice(title, content);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete('/api/notices/:id', async (req, res) => {
    try {
      const result = await dbManager.deleteNotice(req.params.id);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // 10. UPSERT USER
  app.post('/api/users/upsert', async (req, res) => {
    try {
      const result = await dbManager.upsertUser(req.body.user);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history } = req.body;
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          ...(history || []),
          { role: 'user', parts: [{ text: message }] }
        ],
        config: {
          systemInstruction: `You are the official AI Support Assistant for "Khiladi Nepal" (Free Fire Esports Nepal Tournament Platform).
Your role is strictly to help users with app-related topics:
1. Tournaments & Scrims (Solo, Duo, Squad, Custom Room ID & Password, Match Timings).
2. Wallet & Points (1 NPR = 1 Point, 10 free starting points, eSewa and Khalti deposit/withdrawal QR, earnings, match rewards).
3. Rules & Fair Play (Anti-cheat, emulator rules, room entry instructions).
4. Account & Profile (IGN, Free Fire UID, Phone Number, changing password, login/signup).

STRICT INSTRUCTION:
- You must ONLY answer questions related to Khiladi Nepal Free Fire Tournaments, app features, wallet points, and gaming rules.
- If a user asks about anything unrelated to this app or Free Fire esports in Nepal (such as general coding, politics, recipes, math homework, movies, etc.), politely decline and remind them you are Khiladi Nepal Support Assistant for Free Fire tournaments.
- Be friendly, professional, and concise in English/Nepali gaming context.`,
        }
      });
      res.json({ reply: response.text });
    } catch (error: any) {
      console.error('Gemini chat error (fallback active):', error);
      
      // Smart Fallback based on user message keywords when API is overloaded or rate-limited
      const userQuery = (req.body?.message || '').toLowerCase();
      let fallbackReply = 'Namaste! 🙏 I am your Khiladi Nepal Support Assistant. ';

      if (userQuery.includes('join') || userQuery.includes('tournament') || userQuery.includes('match') || userQuery.includes('slot')) {
        fallbackReply += 'To join a tournament: 1. Select your desired Free Fire match mode (Solo/Duo/Squad). 2. Click "Select Slot & Join". 3. Ensure you have enough points in your wallet (1 NPR = 1 Point). Once joined, your room credentials will unlock 15 minutes before the match start time.';
      } else if (userQuery.includes('deposit') || userQuery.includes('esewa') || userQuery.includes('khalti') || userQuery.includes('wallet') || userQuery.includes('recharge') || userQuery.includes('points') || userQuery.includes('npr')) {
        fallbackReply += 'Wallet & Points Info: 1 NPR = 1 Point! You start with 10 free points upon signup. To add points, click on your wallet balance, scan the Khalti/eSewa QR code, pay the amount, and submit your Transaction ID (Txn ID) & screenshot proof. Admins approve deposits instantly.';
      } else if (userQuery.includes('room') || userQuery.includes('id') || userQuery.includes('password') || userQuery.includes('credential')) {
        fallbackReply += 'Custom Room ID & Password: Room credentials are strictly protected until 15 minutes before match start time. Go to the match details and click "Room Status" when the timer reaches T-15m to copy your Room ID and Password.';
      } else if (userQuery.includes('withdraw') || userQuery.includes('payout') || userQuery.includes('earn') || userQuery.includes('prize')) {
        fallbackReply += 'Withdrawals & Prizes: Match winnings are credited instantly to your wallet points. You can withdraw your points to your Khalti or eSewa account anytime (Minimum 100 Points = रू 100 NPR).';
      } else if (userQuery.includes('cancel') || userQuery.includes('refund') || userQuery.includes('error')) {
        fallbackReply += 'Cancellations & Refunds: You can cancel your entry anytime before the match starts to get a 100% point refund. If a room/match encounters an error or timeout, hosts/admins will cancel the room with a reason and all points are automatically refunded.';
      } else {
        fallbackReply += 'I am here to help with Khiladi Nepal tournaments, entry fees, wallet deposits, room credentials, and match rules. How can I assist you today?';
      }

      res.json({ reply: fallbackReply });
    }
  });

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);

  app.listen(3000, '0.0.0.0', () => {
    console.log('Server running on http://localhost:3000');
  });
}

startServer();
