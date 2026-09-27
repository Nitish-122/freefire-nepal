import express from 'express';
import { createServer as createViteServer } from 'vite';
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

  // 3b. START TOURNAMENT
  app.post('/api/tournaments/start', async (req, res) => {
    try {
      const { tournamentId } = req.body;
      const result = await dbManager.startTournament(tournamentId);
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
