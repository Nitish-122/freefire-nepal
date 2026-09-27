import { Tournament } from '../types';

export interface TournamentTimingInfo {
  startTimeMs: number;
  closingTimeMs: number;
  isStartReached: boolean;
  isClosingTimeReached: boolean;
  remainingSecondsToStart: number;
  remainingSecondsToClose: number;
  formattedStartTime: string;
  formattedClosingTime: string;
}

/**
 * Calculates deterministic start and closing timestamps for any tournament.
 * If scheduledStartTimeMs / closingTimeMs are not set, falls back gracefully
 * to startsInMinutes and createdAtMs.
 */
export function getTournamentTimes(tournament: Tournament): TournamentTimingInfo {
  const now = Date.now();
  let startTimeMs: number;
  let closingTimeMs: number;

  if (tournament.scheduledStartTimeMs && tournament.closingTimeMs) {
    startTimeMs = tournament.scheduledStartTimeMs;
    closingTimeMs = tournament.closingTimeMs;
  } else {
    // Fallback: use startsInMinutes and createdAtMs
    const createdAt = tournament.createdAtMs || (now - 5 * 60 * 1000);
    const startsInMinutes = tournament.startsInMinutes !== undefined ? tournament.startsInMinutes : 30;
    startTimeMs = createdAt + startsInMinutes * 60 * 1000;
    
    // Default closing window: 15 minutes after start time
    const fixedCloseWindowMinutes = tournament.fixedClosingTimeMinutes || 15;
    closingTimeMs = startTimeMs + fixedCloseWindowMinutes * 60 * 1000;
  }

  const remainingSecondsToStart = Math.max(0, Math.floor((startTimeMs - now) / 1000));
  const remainingSecondsToClose = Math.max(0, Math.floor((closingTimeMs - now) / 1000));

  const isStartReached = now >= startTimeMs;
  const isClosingTimeReached = now >= closingTimeMs;

  const formattedStartTime = new Date(startTimeMs).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedClosingTime = new Date(closingTimeMs).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return {
    startTimeMs,
    closingTimeMs,
    isStartReached,
    isClosingTimeReached,
    remainingSecondsToStart,
    remainingSecondsToClose,
    formattedStartTime,
    formattedClosingTime,
  };
}

/**
 * Formats seconds into human readable MM:SS or Xh Ym
 */
export function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return '00:00';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return `${mm}:${ss}`;
}
