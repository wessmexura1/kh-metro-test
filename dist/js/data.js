export const QUESTION_VERSION = '2026-10-04.1';
// This is an explicit review date, never derived from the visitor's clock.
export const VERIFIED_AT = '2026-10-04';
const official = (title, slug) => ({ title, url: `https://www.metro.kharkiv.ua/${slug}` });
export const sources = {
  company: official('Про підприємство', 'pro-pidpriemstvo/'),
  saltivskaLine: official('Салтівська лінія', 'saltivska-liniia/'),
  oleksiivskaLine: official('Олексіївська лінія', 'oleksiivska-liniia/'),
  redLine: official('Холодногірсько-заводська лінія', 'kholodnohikrsko-zavodska-liniia/'),
  museum: official('Історичний музей', 'istorychnyi-muzei.html'),
  saltivska: official('Салтівська', 'saltivska.html'),
  universityTransfer: official('Університет: пересадка', 'stantsiia-%C2%ABunivekrsytet%C2%BB.html'),
  universityHistory: official('Університет: історія', 'universytet.html'),
  sport: official('Спортивна: пересадка', 'stantsiia-%C2%ABspokrtyvna%C2%BB.html')
};
export const categories = [
  { id: 'saltivska', label: 'Салтівська лінія', total: 6, color: 'blue' },
  { id: 'oleksiivska', label: 'Олексіївська лінія', total: 2, color: 'green' },
  { id: 'red', label: 'Холодногірсько-заводська лінія', total: 2, color: 'red' },
  { id: 'general', label: 'Загальні знання', total: 2, color: 'neutral' }
];
const question = (id, text, options, correctOptionId, explanation, category, refs) => ({
  id, text, options: options.map(([id, text]) => ({ id, text })), correctOptionId, explanation, category, sources: refs
});
export const questions = [
  question('q1', 'Скільки ліній має Харківський метрополітен?', [['two','Дві'],['three','Три'],['four','Чотири'],['five','П’ять']], 'three', 'Метро складається з трьох ліній: Холодногірсько-заводської, Салтівської та Олексіївської.', 'general', [sources.company]),
  question('q2', 'Скільки станцій має Салтівська лінія?', [['seven','Сім'],['nine','Дев’ять'],['eight','Вісім'],['ten','Десять']], 'eight', 'На Салтівській лінії вісім станцій. Це підтверджує офіційний опис підприємства.', 'saltivska', [sources.company]),
  question('q3', 'Які станції є кінцевими на Салтівській лінії?', [['university-student','Університет і Студентська'],['museum-saltivska','Історичний музей і Салтівська'],['kyiv-pavlov','Київська і Академіка Павлова'],['derzhprom-peremoha','Держпром і Перемога']], 'museum-saltivska', 'Кінцеві станції Салтівської лінії — «Історичний музей» та «Салтівська».', 'saltivska', [sources.museum, sources.saltivska]),
  question('q4', 'На яку станцію можна перейти зі станції «Університет»?', [['naukova','Наукова'],['beketov','Архітектора Бекетова'],['constitution','Майдан Конституції'],['derzhprom','Держпром']], 'derzhprom', 'Пересадка поєднує «Університет» Салтівської лінії та «Держпром» Олексіївської лінії.', 'saltivska', [sources.universityTransfer]),
  question('q5', 'На яку станцію можна перейти зі станції «Історичний музей»?', [['constitution','Майдан Конституції'],['market','Центральний ринок'],['university','Університет'],['sport','Спортивна']], 'constitution', '«Історичний музей» і «Майдан Конституції» утворюють пересадочний вузол між синьою та червоною лініями.', 'saltivska', [sources.museum]),
  question('q6', 'Яка станція розташована між «Київською» та «Академіка Павлова»?', [['student','Студентська'],['mudryi','Ярослава Мудрого'],['barabashov','Академіка Барабашова'],['university','Університет']], 'barabashov', 'Порядок станцій: «Київська» → «Академіка Барабашова» → «Академіка Павлова».', 'saltivska', [sources.saltivskaLine]),
  question('q7', 'Коли відкрили першу ділянку Салтівської лінії?', [['1975','22 серпня 1975 року'],['1995','6 травня 1995 року'],['2004','21 серпня 2004 року'],['1984','11 серпня 1984 року']], '1984', 'Першу пускову ділянку Салтівської лінії з п’ятьма станціями відкрили 11 серпня 1984 року.', 'saltivska', [sources.universityHistory]),
  question('q8', 'До якої лінії належить станція «Наукова»?', [['saltivska','Салтівська'],['oleksiivska','Олексіївська'],['red','Холодногірсько-заводська'],['both','До двох ліній одночасно']], 'oleksiivska', '«Наукова» належить до Олексіївської лінії, позначеної зеленим на схемі. Використовуємо офіційну українську назву «Наукова».', 'oleksiivska', [sources.oleksiivskaLine]),
  question('q9', 'Між якими станціями розташована «Наукова»?', [['oleksiivska-23','Олексіївська і 23 Серпня'],['university-mudryi','Університет і Ярослава Мудрого'],['derzhprom-garden','Держпром і Ботанічний сад'],['beketov-defenders','Архітектора Бекетова і Захисників України']], 'derzhprom-garden', 'Сусідні станції «Наукової» — «Держпром» і «Ботанічний сад».', 'oleksiivska', [sources.oleksiivskaLine]),
  question('q10', 'Скільки станцій має Холодногірсько-заводська лінія?', [['thirteen','Тринадцять'],['twelve','Дванадцять'],['eight','Вісім'],['nine','Дев’ять']], 'thirteen', 'Холодногірсько-заводська лінія має 13 станцій за офіційним описом підприємства.', 'red', [sources.company]),
  question('q11', 'На яку станцію можна перейти зі станції «Спортивна»?', [['defenders','Захисників України'],['beketov','Архітектора Бекетова'],['derzhprom','Держпром'],['metrobuilders','Метробудівників']], 'metrobuilders', 'Пересадка поєднує «Спортивну» Холодногірсько-заводської лінії та «Метробудівників» Олексіївської лінії.', 'red', [sources.sport]),
  question('q12', 'У якому році почав діяти Харківський метрополітен?', [['1960','1960'],['1984','1984'],['1975','1975'],['1995','1995']], '1975', 'Харківський метрополітен діє з 22 серпня 1975 року. У запитанні йдеться саме про рік.', 'general', [sources.company])
];
export function validateQuestions(bank = questions) {
  if (bank.length !== 12 || new Set(bank.map(q => q.id)).size !== 12) throw new Error('Потрібно рівно 12 запитань з унікальними id.');
  for (const q of bank) {
    if (q.options.length !== 4 || new Set(q.options.map(o => o.id)).size !== 4 || !q.options.some(o => o.id === q.correctOptionId)) throw new Error(`Некоректні варіанти: ${q.id}`);
    if (!q.text || !q.explanation || !q.sources.length || !q.sources.every(s => s.title && s.url.startsWith('https://www.metro.kharkiv.ua/'))) throw new Error(`Некоректний вміст: ${q.id}`);
  }
  for (const c of categories) if (bank.filter(q => q.category === c.id).length !== c.total) throw new Error(`Некоректна кількість: ${c.id}`);
  return true;
}
