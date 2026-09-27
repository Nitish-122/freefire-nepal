import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

export interface DbUser {
  ign: string;
  uid: string;
  phoneNumber: string;
  password?: string;
  guild?: string;
  rank: 'Grandmaster' | 'Heroic' | 'Master' | 'Diamond';
  avatarUrl?: string;
  city?: string;
  totalMatches: number;
  totalWins: number;
  totalKills: number;
  totalEarnings: number;
  walletPoints: number;
  status: 'ACTIVE' | 'BANNED';
}

export interface DbNotice {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  active: boolean;
}

export interface DbSettings {
  adminKhaltiNumber: string;
  minWithdrawal: number;
  noticeBoardText?: string;
}

const SEED_USERS: DbUser[] = [
  {
    ign: '⚡NEP_SHERPA⚡',
    uid: '2849102847',
    phoneNumber: '9841203948',
    password: 'password123',
    guild: 'Gorkha Squad Nepal',
    rank: 'Grandmaster',
    city: 'Kathmandu',
    totalMatches: 68,
    totalWins: 23,
    totalKills: 284,
    totalEarnings: 8450,
    walletPoints: 250,
    status: 'ACTIVE',
  },
  {
    ign: '🔥GORKHA_ROYAL🔥',
    uid: '1948201842',
    phoneNumber: '9813204910',
    password: 'password123',
    guild: 'Royal Nepali Gaming',
    rank: 'Heroic',
    city: 'Pokhara',
    totalMatches: 42,
    totalWins: 14,
    totalKills: 172,
    totalEarnings: 3200,
    walletPoints: 150,
    status: 'ACTIVE',
  },
  {
    ign: '👑POKHARA_SNIPER👑',
    uid: '7482019481',
    phoneNumber: '9823019482',
    password: 'password123',
    guild: 'Himalayan Snipers',
    rank: 'Grandmaster',
    city: 'Pokhara',
    totalMatches: 89,
    totalWins: 38,
    totalKills: 410,
    totalEarnings: 14200,
    walletPoints: 400,
    status: 'ACTIVE',
  },
  {
    ign: '⚡KATHMANDU_KILLER⚡',
    uid: '3819402841',
    phoneNumber: '9801293847',
    password: 'password123',
    guild: 'Valley Warriors',
    rank: 'Diamond',
    city: 'Lalitpur',
    totalMatches: 19,
    totalWins: 2,
    totalKills: 45,
    totalEarnings: 300,
    walletPoints: 70,
    status: 'BANNED',
  },
  {
    ign: '🎯DHARAN_AIMBOT🎯',
    uid: '9827103841',
    phoneNumber: '9818293019',
    password: 'password123',
    guild: 'Eastern Kings',
    rank: 'Master',
    city: 'Dharan',
    totalMatches: 31,
    totalWins: 9,
    totalKills: 110,
    totalEarnings: 1900,
    walletPoints: 30,
    status: 'ACTIVE',
  },
];

const SEED_NOTICES: DbNotice[] = [
  {
    id: 'notice-1',
    title: 'Welcome to Khiladi Nepal Free Fire Arena!',
    content: 'All user-hosted custom rooms are monitored 24/7. Entry fees (5, 10, 15, 20 Pts) are strictly 1 NPR = 1 Point. Ensure your Free Fire UID is accurate before joining.',
    createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    active: true,
  }
];

const SEED_SETTINGS: DbSettings = {
  adminKhaltiNumber: '9813362603',
  minWithdrawal: 100,
  noticeBoardText: '🔥 OFFICIAL NOTICE: Khiladi Nepal Season 4 is LIVE! Custom Room IDs are released 15 mins before match start. Instant Khalti payouts active.',
};

class DatabaseManager {
  private pool: pg.Pool | null = null;
  private isPostgresConnected = false;
  private localDbPath: string;
  private memoryData = {
    users: [...SEED_USERS],
    tournaments: [] as any[],
    transactions: [] as any[],
    settings: { ...SEED_SETTINGS },
    notices: [...SEED_NOTICES],
  };

  constructor() {
    this.localDbPath = path.resolve(process.cwd(), 'data', 'server-db.json');
    this.loadLocalBackup();
    this.initDatabase();
  }

  private loadLocalBackup() {
    try {
      if (fs.existsSync(this.localDbPath)) {
        const raw = fs.readFileSync(this.localDbPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed.users && parsed.users.length > 0) this.memoryData.users = parsed.users;
        if (parsed.tournaments) this.memoryData.tournaments = parsed.tournaments;
        if (parsed.transactions) this.memoryData.transactions = parsed.transactions;
        if (parsed.settings) this.memoryData.settings = parsed.settings;
        if (parsed.notices) this.memoryData.notices = parsed.notices;
      } else {
        this.saveLocalBackup();
      }
    } catch (e) {
      console.warn('Could not read local db backup, using memory seeds', e);
    }
  }

  private saveLocalBackup() {
    try {
      const dir = path.dirname(this.localDbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.localDbPath, JSON.stringify(this.memoryData, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to write local backup:', e);
    }
  }

  private async initDatabase() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.log('ℹ️ [DB] No DATABASE_URL specified. Running with high-performance persistent server store.');
      return;
    }

    try {
      this.pool = new Pool({
        connectionString: databaseUrl,
        ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
      });

      await this.pool.query('SELECT NOW()');
      this.isPostgresConnected = true;
      console.log('✅ [DB] Successfully connected to PostgreSQL via DATABASE_URL');

      // Create Tables
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          uid VARCHAR(100) PRIMARY KEY,
          ign VARCHAR(100) NOT NULL,
          phone_number VARCHAR(50) NOT NULL,
          password TEXT,
          guild VARCHAR(100),
          rank VARCHAR(50) DEFAULT 'Grandmaster',
          avatar_url TEXT,
          city VARCHAR(100) DEFAULT 'Kathmandu',
          total_matches INT DEFAULT 0,
          total_wins INT DEFAULT 0,
          total_kills INT DEFAULT 0,
          total_earnings INT DEFAULT 0,
          wallet_points INT DEFAULT 10,
          status VARCHAR(20) DEFAULT 'ACTIVE',
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS tournaments (
          id VARCHAR(100) PRIMARY KEY,
          data JSONB NOT NULL,
          status VARCHAR(50) NOT NULL,
          entry_fee INT NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS transactions (
          id VARCHAR(100) PRIMARY KEY,
          data JSONB NOT NULL,
          status VARCHAR(50) NOT NULL,
          type VARCHAR(50) NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS system_settings (
          key VARCHAR(100) PRIMARY KEY,
          value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS system_notices (
          id VARCHAR(100) PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at VARCHAR(100) NOT NULL,
          active BOOLEAN DEFAULT TRUE
        );
      `);

      // Seed if users empty
      const userRes = await this.pool.query('SELECT COUNT(*) FROM users');
      if (parseInt(userRes.rows[0].count) === 0) {
        for (const u of this.memoryData.users) {
          await this.pool.query(
            `INSERT INTO users (uid, ign, phone_number, password, guild, rank, city, total_matches, total_wins, total_kills, total_earnings, wallet_points, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             ON CONFLICT (uid) DO NOTHING`,
            [u.uid, u.ign, u.phoneNumber, u.password || 'password123', u.guild || '', u.rank, u.city || 'Kathmandu', u.totalMatches, u.totalWins, u.totalKills, u.totalEarnings, u.walletPoints, u.status]
          );
        }
      }

      // Sync settings
      await this.pool.query(
        `INSERT INTO system_settings (key, value) VALUES ('adminKhaltiNumber', $1) ON CONFLICT (key) DO NOTHING`,
        [this.memoryData.settings.adminKhaltiNumber]
      );
      await this.pool.query(
        `INSERT INTO system_settings (key, value) VALUES ('noticeBoardText', $1) ON CONFLICT (key) DO NOTHING`,
        [this.memoryData.settings.noticeBoardText || '']
      );

    } catch (err) {
      console.warn('⚠️ [DB] PostgreSQL connection error. Falling back to persistent server store:', err);
      this.isPostgresConnected = false;
    }
  }

  // --- QUERY METHODS ---

  async getAllData() {
    if (this.isPostgresConnected && this.pool) {
      try {
        const usersRes = await this.pool.query('SELECT * FROM users ORDER BY total_earnings DESC');
        const users: DbUser[] = usersRes.rows.map(r => ({
          uid: r.uid,
          ign: r.ign,
          phoneNumber: r.phone_number,
          password: r.password,
          guild: r.guild,
          rank: r.rank,
          avatarUrl: r.avatar_url,
          city: r.city,
          totalMatches: r.total_matches,
          totalWins: r.total_wins,
          totalKills: r.total_kills,
          totalEarnings: r.total_earnings,
          walletPoints: r.wallet_points,
          status: r.status,
        }));

        const tourneysRes = await this.pool.query('SELECT data FROM tournaments ORDER BY updated_at DESC');
        const tournaments = tourneysRes.rows.map(r => r.data);

        const txsRes = await this.pool.query('SELECT data FROM transactions ORDER BY created_at DESC');
        const transactions = txsRes.rows.map(r => r.data);

        const settingsRes = await this.pool.query('SELECT key, value FROM system_settings');
        const settings: DbSettings = { ...this.memoryData.settings };
        for (const row of settingsRes.rows) {
          if (row.key === 'adminKhaltiNumber') settings.adminKhaltiNumber = row.value;
          if (row.key === 'noticeBoardText') settings.noticeBoardText = row.value;
        }

        const noticesRes = await this.pool.query('SELECT * FROM system_notices ORDER BY created_at DESC');
        const notices: DbNotice[] = noticesRes.rows.map(r => ({
          id: r.id,
          title: r.title,
          content: r.content,
          createdAt: r.created_at,
          active: r.active,
        }));

        return { users, tournaments, transactions, settings, notices };
      } catch (e) {
        console.error('Postgres getAllData error, falling back to memory:', e);
      }
    }
    return this.memoryData;
  }

  // 1. MANUAL POINT OVERRIDE
  async pointOverride(uid: string, action: 'ADD' | 'DEDUCT', amount: number, note: string) {
    const pts = Math.abs(Number(amount));
    if (isNaN(pts) || pts <= 0) throw new Error('Points amount must be a positive number.');
    if (!note || note.trim().length === 0) throw new Error('Audit note is mandatory.');

    let updatedUser: DbUser | null = null;
    let newBalance = 0;

    // Local memory update
    const userIndex = this.memoryData.users.findIndex(u => u.uid === uid);
    if (userIndex !== -1) {
      const u = this.memoryData.users[userIndex];
      const delta = action === 'ADD' ? pts : -pts;
      u.walletPoints = Math.max(0, u.walletPoints + delta);
      newBalance = u.walletPoints;
      updatedUser = u;

      // Add audit transaction
      const auditTx = {
        id: `audit-override-${Date.now()}`,
        type: action === 'ADD' ? 'deposit' : 'withdraw',
        amount: pts,
        points: pts,
        date: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        status: 'completed',
        method: action === 'ADD' ? 'eSewa' : 'Khalti',
        referenceId: `ADMIN-OVR-${Date.now()}`,
        note: `[Admin Override: ${action} ${pts} Pts] ${note.trim()}`,
        userIgn: u.ign,
        userUid: u.uid,
        userPhone: u.phoneNumber,
        reviewedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
      this.memoryData.transactions.unshift(auditTx);
      this.saveLocalBackup();
    }

    // Postgres update
    if (this.isPostgresConnected && this.pool) {
      try {
        const delta = action === 'ADD' ? pts : -pts;
        const res = await this.pool.query(
          `UPDATE users SET wallet_points = GREATEST(0, wallet_points + $1) WHERE uid = $2 RETURNING *`,
          [delta, uid]
        );
        if (res.rows[0]) {
          const r = res.rows[0];
          newBalance = r.wallet_points;
          updatedUser = {
            uid: r.uid,
            ign: r.ign,
            phoneNumber: r.phone_number,
            guild: r.guild,
            rank: r.rank,
            city: r.city,
            totalMatches: r.total_matches,
            totalWins: r.total_wins,
            totalKills: r.total_kills,
            totalEarnings: r.total_earnings,
            walletPoints: r.wallet_points,
            status: r.status,
          };

          // Record transaction in DB
          const auditTx = {
            id: `audit-override-${Date.now()}`,
            type: action === 'ADD' ? 'deposit' : 'withdraw',
            amount: pts,
            points: pts,
            date: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            status: 'completed',
            method: action === 'ADD' ? 'eSewa' : 'Khalti',
            referenceId: `ADMIN-OVR-${Date.now()}`,
            note: `[Admin Override: ${action} ${pts} Pts] ${note.trim()}`,
            userIgn: updatedUser.ign,
            userUid: updatedUser.uid,
            userPhone: updatedUser.phoneNumber,
            reviewedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          };
          await this.pool.query(
            `INSERT INTO transactions (id, data, status, type) VALUES ($1, $2, $3, $4)`,
            [auditTx.id, JSON.stringify(auditTx), 'completed', auditTx.type]
          );
        }
      } catch (e) {
        console.error('Postgres pointOverride error:', e);
      }
    }

    if (!updatedUser) throw new Error('User not found.');
    return { user: updatedUser, newBalance };
  }

  // 2. ACCOUNT STATUS TOGGLE (ACTIVE <-> BANNED)
  async toggleUserStatus(uid: string) {
    let updatedStatus: 'ACTIVE' | 'BANNED' = 'ACTIVE';
    let updatedUser: DbUser | null = null;

    const userIndex = this.memoryData.users.findIndex(u => u.uid === uid);
    if (userIndex !== -1) {
      const u = this.memoryData.users[userIndex];
      u.status = u.status === 'BANNED' ? 'ACTIVE' : 'BANNED';
      updatedStatus = u.status;
      updatedUser = u;
      this.saveLocalBackup();
    }

    if (this.isPostgresConnected && this.pool) {
      try {
        const res = await this.pool.query(
          `UPDATE users SET status = CASE WHEN status = 'BANNED' THEN 'ACTIVE' ELSE 'BANNED' END WHERE uid = $1 RETURNING *`,
          [uid]
        );
        if (res.rows[0]) {
          updatedStatus = res.rows[0].status;
        }
      } catch (e) {
        console.error('Postgres toggleUserStatus error:', e);
      }
    }

    return { uid, status: updatedStatus, user: updatedUser };
  }

  // 3. EDIT ROOM CREDENTIALS OVERRIDE
  async updateRoomCredentials(tournamentId: string, roomId: string, roomPassword: string, isReleased: boolean) {
    let updatedTourney: any = null;

    const tIndex = this.memoryData.tournaments.findIndex(t => t.id === tournamentId);
    if (tIndex !== -1) {
      const t = this.memoryData.tournaments[tIndex];
      t.roomDetails = {
        ...t.roomDetails,
        roomId: roomId.trim(),
        roomPassword: roomPassword.trim(),
        isReleased: isReleased,
      };
      updatedTourney = t;
      this.saveLocalBackup();
    }

    if (this.isPostgresConnected && this.pool) {
      try {
        const getRes = await this.pool.query('SELECT data FROM tournaments WHERE id = $1', [tournamentId]);
        if (getRes.rows[0]) {
          const t = getRes.rows[0].data;
          t.roomDetails = {
            ...t.roomDetails,
            roomId: roomId.trim(),
            roomPassword: roomPassword.trim(),
            isReleased: isReleased,
          };
          await this.pool.query(
            'UPDATE tournaments SET data = $1, updated_at = NOW() WHERE id = $2',
            [JSON.stringify(t), tournamentId]
          );
          updatedTourney = t;
        }
      } catch (e) {
        console.error('Postgres updateRoomCredentials error:', e);
      }
    }

    return updatedTourney;
  }

  // 4. CANCEL MATCH & REFUND ALL
  async cancelMatchAndRefund(tournamentId: string, reason: string) {
    let targetTourney: any = null;
    const refundsIssued: { uid: string; amount: number }[] = [];

    // Memory handler
    const tIndex = this.memoryData.tournaments.findIndex(t => t.id === tournamentId);
    if (tIndex !== -1) {
      targetTourney = this.memoryData.tournaments[tIndex];
      targetTourney.status = 'cancelled';
      targetTourney.cancellationReason = reason || 'Admin cancelled and refunded match.';
      targetTourney.cancelledAt = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

      const entryFee = targetTourney.entryFee || 0;
      if (entryFee > 0 && Array.isArray(targetTourney.registeredTeams)) {
        for (const team of targetTourney.registeredTeams) {
          const captainUid = team.captainUid;
          if (captainUid) {
            const user = this.memoryData.users.find(u => u.uid === captainUid);
            if (user) {
              user.walletPoints += entryFee;
              refundsIssued.push({ uid: captainUid, amount: entryFee });
            }
            const refundTx = {
              id: `ref-admin-canc-${Date.now()}-${captainUid}`,
              type: 'refund',
              amount: entryFee,
              points: entryFee,
              date: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              status: 'completed',
              method: 'Tournament Refund',
              referenceId: `REF-${tournamentId}`,
              note: `Admin Match Cancellation Refund: ${targetTourney.title} (+${entryFee} Pts). Reason: ${reason}`,
              userIgn: team.captainIgn,
              userUid: captainUid,
              userPhone: team.captainPhone,
            };
            this.memoryData.transactions.unshift(refundTx);
          }
        }
      }
      this.saveLocalBackup();
    }

    // Postgres handler
    if (this.isPostgresConnected && this.pool) {
      try {
        const getRes = await this.pool.query('SELECT data FROM tournaments WHERE id = $1', [tournamentId]);
        if (getRes.rows[0]) {
          const t = getRes.rows[0].data;
          t.status = 'cancelled';
          t.cancellationReason = reason || 'Admin cancelled and refunded match.';
          t.cancelledAt = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

          const entryFee = t.entryFee || 0;
          if (entryFee > 0 && Array.isArray(t.registeredTeams)) {
            for (const team of t.registeredTeams) {
              const captainUid = team.captainUid;
              if (captainUid) {
                await this.pool.query(
                  'UPDATE users SET wallet_points = wallet_points + $1 WHERE uid = $2',
                  [entryFee, captainUid]
                );
                const refundTx = {
                  id: `ref-admin-canc-${Date.now()}-${captainUid}`,
                  type: 'refund',
                  amount: entryFee,
                  points: entryFee,
                  date: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                  status: 'completed',
                  method: 'Tournament Refund',
                  referenceId: `REF-${tournamentId}`,
                  note: `Admin Match Cancellation Refund: ${t.title} (+${entryFee} Pts). Reason: ${reason}`,
                  userIgn: team.captainIgn,
                  userUid: captainUid,
                  userPhone: team.captainPhone,
                };
                await this.pool.query(
                  'INSERT INTO transactions (id, data, status, type) VALUES ($1, $2, $3, $4)',
                  [refundTx.id, JSON.stringify(refundTx), 'completed', 'refund']
                );
              }
            }
          }
          await this.pool.query(
            'UPDATE tournaments SET data = $1, status = $2, updated_at = NOW() WHERE id = $3',
            [JSON.stringify(t), 'cancelled', tournamentId]
          );
          targetTourney = t;
        }
      } catch (e) {
        console.error('Postgres cancelMatchAndRefund error:', e);
      }
    }

    return { tournament: targetTourney, refundsIssued };
  }

  // START TOURNAMENT
  async startTournament(tournamentId: string) {
    let targetTourney: any = null;

    const tIndex = this.memoryData.tournaments.findIndex(t => t.id === tournamentId);
    if (tIndex !== -1) {
      const t = this.memoryData.tournaments[tIndex];
      t.status = 'live';
      if (!t.roomDetails) t.roomDetails = { roomId: '', roomPassword: '', customRules: '', isReleased: true };
      t.roomDetails.isReleased = true;
      targetTourney = t;
      this.saveLocalBackup();
    }

    if (this.isPostgresConnected && this.pool) {
      try {
        const getRes = await this.pool.query('SELECT data FROM tournaments WHERE id = $1', [tournamentId]);
        if (getRes.rows[0]) {
          const t = getRes.rows[0].data;
          t.status = 'live';
          if (!t.roomDetails) t.roomDetails = { roomId: '', roomPassword: '', customRules: '', isReleased: true };
          t.roomDetails.isReleased = true;
          await this.pool.query(
            'UPDATE tournaments SET data = $1, status = $2, updated_at = NOW() WHERE id = $3',
            [JSON.stringify(t), 'live', tournamentId]
          );
          targetTourney = t;
        }
      } catch (e) {
        console.error('Postgres startTournament error:', e);
      }
    }

    return targetTourney;
  }

  // 5. DISTRIBUTE PRIZES
  async distributePrizes(tournamentId: string, resultData: any) {
    let targetTourney: any = null;
    const payoutsProcessed: any[] = [];

    // Memory
    const tIndex = this.memoryData.tournaments.findIndex(t => t.id === tournamentId);
    if (tIndex !== -1) {
      targetTourney = this.memoryData.tournaments[tIndex];
      targetTourney.status = 'completed';
      targetTourney.results = {
        ...resultData,
        settledAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };

      if (Array.isArray(resultData.placementPayouts)) {
        for (const payout of resultData.placementPayouts) {
          if (payout.captainUid && payout.totalPointsWon > 0) {
            const user = this.memoryData.users.find(u => u.uid === payout.captainUid);
            if (user) {
              user.walletPoints += payout.totalPointsWon;
              user.totalEarnings += payout.totalPointsWon;
              if (payout.rank === 1) user.totalWins += 1;
              payoutsProcessed.push({ uid: payout.captainUid, won: payout.totalPointsWon });
            }
            const prizeTx = {
              id: `prize-${Date.now()}-${payout.captainUid}`,
              type: 'winning',
              amount: payout.totalPointsWon,
              points: payout.totalPointsWon,
              date: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              status: 'completed',
              method: 'Tournament Prize',
              referenceId: `WIN-${tournamentId}`,
              note: `Rank #${payout.rank} Prize: ${targetTourney.title} (+${payout.totalPointsWon} Pts)`,
              userUid: payout.captainUid,
            };
            this.memoryData.transactions.unshift(prizeTx);
          }
        }
      }
      this.saveLocalBackup();
    }

    // Postgres
    if (this.isPostgresConnected && this.pool) {
      try {
        const getRes = await this.pool.query('SELECT data FROM tournaments WHERE id = $1', [tournamentId]);
        if (getRes.rows[0]) {
          const t = getRes.rows[0].data;
          t.status = 'completed';
          t.results = {
            ...resultData,
            settledAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          };

          if (Array.isArray(resultData.placementPayouts)) {
            for (const payout of resultData.placementPayouts) {
              if (payout.captainUid && payout.totalPointsWon > 0) {
                await this.pool.query(
                  `UPDATE users SET wallet_points = wallet_points + $1, total_earnings = total_earnings + $1, total_wins = CASE WHEN $2 = 1 THEN total_wins + 1 ELSE total_wins END WHERE uid = $3`,
                  [payout.totalPointsWon, payout.rank, payout.captainUid]
                );
                const prizeTx = {
                  id: `prize-${Date.now()}-${payout.captainUid}`,
                  type: 'winning',
                  amount: payout.totalPointsWon,
                  points: payout.totalPointsWon,
                  date: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                  status: 'completed',
                  method: 'Tournament Prize',
                  referenceId: `WIN-${tournamentId}`,
                  note: `Rank #${payout.rank} Prize: ${t.title} (+${payout.totalPointsWon} Pts)`,
                  userUid: payout.captainUid,
                };
                await this.pool.query(
                  'INSERT INTO transactions (id, data, status, type) VALUES ($1, $2, $3, $4)',
                  [prizeTx.id, JSON.stringify(prizeTx), 'completed', 'winning']
                );
              }
            }
          }

          await this.pool.query(
            'UPDATE tournaments SET data = $1, status = $2, updated_at = NOW() WHERE id = $3',
            [JSON.stringify(t), 'completed', tournamentId]
          );
          targetTourney = t;
        }
      } catch (e) {
        console.error('Postgres distributePrizes error:', e);
      }
    }

    return { tournament: targetTourney, payoutsProcessed };
  }

  // 6. SETTINGS OVERRIDE
  async updateSettings(settings: Partial<DbSettings>) {
    if (settings.adminKhaltiNumber) {
      this.memoryData.settings.adminKhaltiNumber = settings.adminKhaltiNumber.trim();
    }
    if (settings.noticeBoardText !== undefined) {
      this.memoryData.settings.noticeBoardText = settings.noticeBoardText.trim();
    }
    this.saveLocalBackup();

    if (this.isPostgresConnected && this.pool) {
      try {
        if (settings.adminKhaltiNumber) {
          await this.pool.query(
            `INSERT INTO system_settings (key, value) VALUES ('adminKhaltiNumber', $1)
             ON CONFLICT (key) DO UPDATE SET value = $1`,
            [settings.adminKhaltiNumber.trim()]
          );
        }
        if (settings.noticeBoardText !== undefined) {
          await this.pool.query(
            `INSERT INTO system_settings (key, value) VALUES ('noticeBoardText', $1)
             ON CONFLICT (key) DO UPDATE SET value = $1`,
            [settings.noticeBoardText.trim()]
          );
        }
      } catch (e) {
        console.error('Postgres updateSettings error:', e);
      }
    }

    return this.memoryData.settings;
  }

  // 7. SYSTEM NOTICE BOARD POSTING
  async postNotice(title: string, content: string) {
    const newNotice: DbNotice = {
      id: `notice-${Date.now()}`,
      title: title.trim(),
      content: content.trim(),
      createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      active: true,
    };

    this.memoryData.notices.unshift(newNotice);
    // Also sync to settings noticeBoardText
    this.memoryData.settings.noticeBoardText = `${newNotice.title}: ${newNotice.content}`;
    this.saveLocalBackup();

    if (this.isPostgresConnected && this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO system_notices (id, title, content, created_at, active) VALUES ($1, $2, $3, $4, $5)`,
          [newNotice.id, newNotice.title, newNotice.content, newNotice.createdAt, true]
        );
        await this.pool.query(
          `INSERT INTO system_settings (key, value) VALUES ('noticeBoardText', $1)
           ON CONFLICT (key) DO UPDATE SET value = $1`,
          [this.memoryData.settings.noticeBoardText]
        );
      } catch (e) {
        console.error('Postgres postNotice error:', e);
      }
    }

    return newNotice;
  }

  async deleteNotice(id: string) {
    this.memoryData.notices = this.memoryData.notices.filter(n => n.id !== id);
    this.saveLocalBackup();

    if (this.isPostgresConnected && this.pool) {
      try {
        await this.pool.query('DELETE FROM system_notices WHERE id = $1', [id]);
      } catch (e) {
        console.error('Postgres deleteNotice error:', e);
      }
    }
    return { success: true, id };
  }

  // 8. TOURNAMENT CREATION & SYNC
  async saveTournament(tournament: any) {
    const existingIdx = this.memoryData.tournaments.findIndex(t => t.id === tournament.id);
    if (existingIdx !== -1) {
      this.memoryData.tournaments[existingIdx] = tournament;
    } else {
      this.memoryData.tournaments.unshift(tournament);
    }
    this.saveLocalBackup();

    if (this.isPostgresConnected && this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO tournaments (id, data, status, entry_fee, updated_at)
           VALUES ($1, $2, $3, $4, NOW())
           ON CONFLICT (id) DO UPDATE SET data = $2, status = $3, entry_fee = $4, updated_at = NOW()`,
          [tournament.id, JSON.stringify(tournament), tournament.status, tournament.entryFee || 10]
        );
      } catch (e) {
        console.error('Postgres saveTournament error:', e);
      }
    }
    return tournament;
  }

  // 9. TRANSACTIONS
  async saveTransaction(tx: any) {
    const existingIdx = this.memoryData.transactions.findIndex(t => t.id === tx.id);
    if (existingIdx !== -1) {
      this.memoryData.transactions[existingIdx] = tx;
    } else {
      this.memoryData.transactions.unshift(tx);
    }
    this.saveLocalBackup();

    if (this.isPostgresConnected && this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO transactions (id, data, status, type, created_at)
           VALUES ($1, $2, $3, $4, NOW())
           ON CONFLICT (id) DO UPDATE SET data = $2, status = $3, type = $4`,
          [tx.id, JSON.stringify(tx), tx.status, tx.type]
        );
      } catch (e) {
        console.error('Postgres saveTransaction error:', e);
      }
    }
    return tx;
  }

  // 10. AUTH & USER REGISTRATION
  async upsertUser(user: DbUser) {
    const existingIdx = this.memoryData.users.findIndex(u => u.uid === user.uid || u.phoneNumber === user.phoneNumber);
    if (existingIdx !== -1) {
      this.memoryData.users[existingIdx] = { ...this.memoryData.users[existingIdx], ...user };
    } else {
      this.memoryData.users.push(user);
    }
    this.saveLocalBackup();

    if (this.isPostgresConnected && this.pool) {
      try {
        await this.pool.query(
          `INSERT INTO users (uid, ign, phone_number, password, guild, rank, city, total_matches, total_wins, total_kills, total_earnings, wallet_points, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           ON CONFLICT (uid) DO UPDATE SET
             ign = $2,
             phone_number = $3,
             guild = $5,
             rank = $6,
             city = $7,
             wallet_points = $12,
             status = $13`,
          [user.uid, user.ign, user.phoneNumber, user.password || 'password123', user.guild || '', user.rank || 'Grandmaster', user.city || 'Kathmandu', user.totalMatches || 0, user.totalWins || 0, user.totalKills || 0, user.totalEarnings || 0, user.walletPoints ?? 10, user.status || 'ACTIVE']
        );
      } catch (e) {
        console.error('Postgres upsertUser error:', e);
      }
    }
    return user;
  }
}

export const dbManager = new DatabaseManager();
