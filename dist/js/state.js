import { questions, categories, QUESTION_VERSION } from './data.js';
export function shuffle(ids, random = Math.random) {
  const result = [...ids];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
export function createAttempt(random = Math.random) {
  return { version: QUESTION_VERSION, currentIndex: 0, answers: {}, order: Object.fromEntries(questions.map(q => [q.id, shuffle(q.options.map(o => o.id), random)])), completed: false };
}
export function isValidAttempt(a) {
  if (!a || typeof a !== 'object' || a.version !== QUESTION_VERSION || !Number.isInteger(a.currentIndex) || a.currentIndex < 0 || a.currentIndex >= 12 || typeof a.completed !== 'boolean' || !a.answers || typeof a.answers !== 'object' || Array.isArray(a.answers) || !a.order || typeof a.order !== 'object') return false;
  if (Object.keys(a.answers).some(id => !questions.some(q => q.id === id))) return false;
  for (const q of questions) {
    const order = a.order[q.id];
    if (!Array.isArray(order) || order.length !== 4 || new Set(order).size !== 4 || !order.every(id => q.options.some(o => o.id === id))) return false;
    if (Object.hasOwn(a.answers, q.id) && !q.options.some(o => o.id === a.answers[q.id])) return false;
  }
  if (a.completed && !questions.every(q => a.answers[q.id])) return false;
  // A later screen requires all preceding answers, preventing malformed resume states.
  if (!questions.slice(0, a.currentIndex).every(q => a.answers[q.id])) return false;
  return true;
}
export function chooseAnswer(attempt, optionId) {
  if (!isValidAttempt(attempt) || attempt.completed) throw new Error('Немає активної спроби.');
  const q = questions[attempt.currentIndex];
  if (!q.options.some(o => o.id === optionId)) throw new Error('Невідомий варіант.');
  return { ...attempt, answers: { ...attempt.answers, [q.id]: optionId } };
}
export function advance(attempt) {
  if (!isValidAttempt(attempt) || attempt.completed || !attempt.answers[questions[attempt.currentIndex].id]) return attempt;
  return attempt.currentIndex === 11 ? { ...attempt, completed: true } : { ...attempt, currentIndex: attempt.currentIndex + 1 };
}
export function retreat(attempt) {return !attempt || attempt.completed ? attempt : { ...attempt, currentIndex: Math.max(0, attempt.currentIndex - 1) };}
export function score(attempt) {
  if (!isValidAttempt(attempt) || !attempt.completed) throw new Error('Спочатку завершіть тест.');
  const correct = questions.filter(q => attempt.answers[q.id] === q.correctOptionId).length;
  return { correct, percent: Math.round(correct / questions.length * 100), level: correct <= 4 ? 'Варто повторити схему' : correct <= 8 ? 'Добре орієнтуєшся' : 'Відмінне знання маршруту', categories: categories.map(c => ({ ...c, correct: questions.filter(q => q.category === c.id && attempt.answers[q.id] === q.correctOptionId).length })) };
}
