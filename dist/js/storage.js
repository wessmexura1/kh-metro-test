import { isValidAttempt } from './state.js';
import { QUESTION_VERSION } from './data.js';
export const STORAGE_KEY = 'kharkiv-metro-test:v1';
export function browserStorage() {try { return window.localStorage; } catch { return null; }}
export function loadProgress(storage = browserStorage()) {
  const empty = { attempt: null, best: null, notice: '', available: true };
  if (!storage) return { ...empty, available: false, notice: 'Сховище браузера недоступне. Тест працює, але прогрес збережеться лише до закриття сторінки.' };
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return empty;
    const saved = JSON.parse(raw);
    if (!saved || saved.version !== QUESTION_VERSION || (saved.attempt !== null && !isValidAttempt(saved.attempt)) || (saved.best !== null && (!Number.isInteger(saved.best) || saved.best < 0 || saved.best > 12))) {
      storage.removeItem(STORAGE_KEY);
      return { ...empty, notice: 'Попереднє збереження застаріло або пошкоджене. Можна почати новий тест.' };
    }
    return { ...empty, attempt: saved.attempt, best: saved.best };
  } catch {
    // Malformed JSON is recoverable; denial of storage is separately detected.
    try { storage.removeItem(STORAGE_KEY); return { ...empty, notice: 'Пошкоджене збереження скинуто. Можна почати новий тест.' }; }
    catch { return { ...empty, available: false, notice: 'Збереження недоступне. Тест працюватиме в пам’яті цієї сторінки.' }; }
  }
}
export function saveProgress(model, storage = browserStorage()) {
  try { if (!storage) return false; storage.setItem(STORAGE_KEY, JSON.stringify({ version: QUESTION_VERSION, attempt: model.attempt, best: model.best })); return true; }
  catch { return false; }
}
