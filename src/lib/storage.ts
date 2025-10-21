/**
 * LocalStorage persistence layer for app state
 * Allows data to persist across page refreshes
 */

import { HybridDexState } from "./hybrid-dex";

const STORAGE_KEY = 'forge-art-hub-state';
const STORAGE_VERSION = '1.1';

export interface HuntProgress {
  revealed: string[]; // coordinates that have been opened
  matched: string[]; // coordinates that have been claimed
  failed: string[]; // coordinates that failed (no token)
  foundTokens: number; // total tokens claimed in this hunt
}

export interface StoredState {
  version: string;
  timestamp: number;
  user: {
    usd: number;
    coinTags: number;
    lfts: number;
    clft: number;
    yieldUnits: number;
    realizedRewards: number;
  };
  assets: Array<{
    id: string;
    name: string;
    ticker?: string;
    summary?: string;
    image: string;
    params: any;
    cycle: any;
  }>;
  assetAvailable: Record<string, number>;
  userAssets: Record<string, { coinTags: number; lfts: number }>;
  huntProgress: Record<string, HuntProgress>; // per-asset hunt progress
  hybridDex: HybridDexState;
}

/**
 * Save state to localStorage
 */
export function saveState(state: Partial<StoredState>): void {
  try {
    const dataToStore: StoredState = {
      version: STORAGE_VERSION,
      timestamp: Date.now(),
      user: state.user || { usd: 1000, coinTags: 0, lfts: 0, clft: 0, yieldUnits: 0, realizedRewards: 0 },
      assets: state.assets || [],
      assetAvailable: state.assetAvailable || {},
      userAssets: state.userAssets || {},
      huntProgress: state.huntProgress || {},
      hybridDex: state.hybridDex || {
        currentPrice: 13.13,
        tradingFee: 0.002,
        sellers: [],
        transactions: [],
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToStore));
  } catch (error) {
    console.error('Failed to save state to localStorage:', error);
  }
}

/**
 * Load state from localStorage
 */
export function loadState(): StoredState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as StoredState;
    
    // Version check - if version mismatch, ignore stored data
    if (parsed.version !== STORAGE_VERSION) {
      console.warn('Storage version mismatch, clearing old data');
      clearState();
      return null;
    }

    if (typeof parsed.user?.clft !== 'number') {
      parsed.user = {
        ...parsed.user,
        clft: parsed.user?.clft ?? 0,
      };
    }

    if (!parsed.hybridDex) {
      parsed.hybridDex = {
        currentPrice: 13.13,
        tradingFee: 0.002,
        sellers: [],
        transactions: [],
      };
    }

    return parsed;
  } catch (error) {
    console.error('Failed to load state from localStorage:', error);
    return null;
  }
}

/**
 * Clear all stored state
 */
export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear localStorage:', error);
  }
}

/**
 * Check if state exists in storage
 */
export function hasStoredState(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}
