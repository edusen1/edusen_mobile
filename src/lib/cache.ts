// ============================================================
// Offline Cache Manager — edusen_mobile
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CachedStudent, Eleve, DetteSummary } from '../types';

const CACHE_KEY = 'edusen_student_cache';
const MAX_ENTRIES = 100;

async function readCache(): Promise<Record<string, CachedStudent>> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, CachedStudent>;
  } catch {
    return {};
  }
}

async function writeCache(cache: Record<string, CachedStudent>): Promise<void> {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

/** Store a student scan in cache (key = studentId or matricule) */
export async function cacheStudent(
  key: string,
  eleve: Eleve,
  dettes: DetteSummary | null,
): Promise<void> {
  const cache = await readCache();

  cache[key] = {
    eleve,
    dettes,
    cachedAt: Date.now(),
  };

  // Evict oldest if over limit
  const entries = Object.entries(cache);
  if (entries.length > MAX_ENTRIES) {
    entries.sort((a, b) => a[1].cachedAt - b[1].cachedAt);
    const toRemove = entries.length - MAX_ENTRIES;
    for (let i = 0; i < toRemove; i++) {
      delete cache[entries[i][0]];
    }
  }

  await writeCache(cache);
}

/** Lookup a student from cache */
export async function getCachedStudent(key: string): Promise<CachedStudent | null> {
  const cache = await readCache();
  return cache[key] ?? null;
}

/** Get all cached students sorted by most recent */
export async function getAllCachedStudents(): Promise<CachedStudent[]> {
  const cache = await readCache();
  return Object.values(cache).sort((a, b) => b.cachedAt - a.cachedAt);
}

/** Clear the entire cache */
export async function clearCache(): Promise<void> {
  await AsyncStorage.removeItem(CACHE_KEY);
}
