import { questions, validateQuestions } from './data.js';
import { createAttempt, chooseAnswer, advance, retreat, score } from './state.js';
import { loadProgress, saveProgress } from './storage.js';
import { homeScreen, quizScreen, resultScreen, reviewScreen } from './screens.js';
import { mapSVG } from './map.js';
import { mountAnimations, enterScreen } from './animation.js';
validateQuestions();
const model = loadProgress();
const main = document.querySelector('#main'), dialog = document.querySelector('#map-dialog');
let currentRoute, cleanupAnimation = () => {}, errorsOnly = false, returnFocus = null;
const announcer = document.querySelector('#announcer');
function persist() {
  if (!saveProgress(model)) { model.available = false; model.notice = 'Сховище браузера недоступне. Тест працює, але прогрес збережеться лише до закриття сторінки.'; }
}
function navigate(route) {
  if (location.hash === `#${route}`) render();
  else location.hash = route;
}
function render({ focus = true } = {}) {
  cleanupAnimation();
  let route = location.hash.slice(1) || 'home';
  if (!['home','quiz','result','review'].includes(route) || (route === 'quiz' && (!model.attempt || model.attempt.completed)) || (['result','review'].includes(route) && !model.attempt?.completed)) {
    route = 'home'; history.replaceState(null, '', '#home');
  }
  currentRoute = route;
  const screens = { home: homeScreen, quiz: quizScreen, result: resultScreen, review: m => reviewScreen(m, errorsOnly) };
  main.innerHTML = screens[route](model);
  document.title = `${{home:'Харківський метрополітен: перевір себе',quiz:`Запитання ${model.attempt?.currentIndex+1} із 12`,result:'Твій результат',review:'Розбір відповідей'}[route]}${route==='home'?'':' · Метро Харкова'}`;
  if (focus) {
    window.scrollTo({top:0, behavior:'instant'});
    main.querySelector('#question-title, h1')?.focus({ preventScroll: true });
  }
  announcer.textContent = route === 'quiz' ? `Запитання ${model.attempt.currentIndex+1} із 12. ${questions[model.attempt.currentIndex].text}` : route==='result' ? `Тест завершено. ${score(model.attempt).correct} правильних відповідей із 12.` : '';
  cleanupAnimation = mountAnimations(main, route);
  enterScreen(main, route);
}
const actions = {
  start() {model.attempt = createAttempt(); model.notice = model.available ? '' : model.notice; errorsOnly = false; persist(); navigate('quiz');},
  resume() {if (model.attempt&&!model.attempt.completed) navigate('quiz');},
  back() {model.attempt = retreat(model.attempt); persist(); render();},
  next() {
    const next = advance(model.attempt);
    if (next === model.attempt) return;
    model.attempt = next;
    if (next.completed) {model.best = Math.max(model.best ?? 0, score(next).correct); persist(); navigate('result');}
    else {persist(); render();}
  },
  'filter-all'() {filter(false);},
  'filter-errors'() {filter(true);},
  map(button) {openMap(button);},
  'close-dialog'() {dialog.close();}
};
function filter(value) {
  errorsOnly = value;
  render({ focus:false });
  main.querySelector(`[data-action="filter-${value?'errors':'all'}"]`)?.focus();
  announcer.textContent = value ? `Показано лише помилки: ${12-score(model.attempt).correct}.` : 'Показано всі 12 запитань.';
}
document.addEventListener('click', e => {
  const button = e.target.closest('[data-action]');
  if (button && !button.disabled) actions[button.dataset.action]?.(button);
});
main.addEventListener('change', e => {
  if (!e.target.matches('input[type="radio"]') || currentRoute !== 'quiz') return;
  model.attempt = chooseAnswer(model.attempt, e.target.value);
  persist();
  main.querySelectorAll('.answer-card').forEach(label => label.classList.toggle('selected', label.querySelector('input').checked));
  main.querySelector('[data-action="next"]').disabled = false;
  main.querySelector('.selection-hint').hidden = true;
  main.querySelector('.answered-count').textContent = `Відповіді: ${Object.keys(model.attempt.answers).length} із 12`;
  main.querySelectorAll('.progress-stop').forEach((stop,i) => stop.classList.toggle('answered', Boolean(model.attempt.answers[questions[i].id])));
  main.querySelector('.route-progress').setAttribute('aria-label', `Запитання ${model.attempt.currentIndex+1} із 12; відповіді: ${Object.keys(model.attempt.answers).length} із 12`);
});
function openMap(button) {
  returnFocus = button;
  document.querySelector('#dialog-body').innerHTML = `${mapSVG('zoom')}<p class="small-note">На вузькому екрані схему можна прокручувати горизонтально.</p>`;
  dialog.showModal();
  document.body.classList.add('dialog-open');
  dialog.querySelector('[data-action="close-dialog"]').focus();
}
dialog.addEventListener('close', () => {
  document.body.classList.remove('dialog-open');
  document.querySelector('#dialog-body').replaceChildren();
  returnFocus?.focus();
  returnFocus = null;
});
dialog.addEventListener('keydown', event => {
  if (event.key !== 'Tab') return;
  const focusable = [...dialog.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(element => !element.disabled && element.getClientRects().length);
  const first = focusable[0], last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
});
dialog.addEventListener('click', e => {if(e.target===dialog){const rect=dialog.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)dialog.close();}});
window.addEventListener('hashchange', () => {if(dialog.open)dialog.close();render();});
render({ focus:false });
const context = document.modelContext;
if (context?.registerTool) {
  const lifecycle = new AbortController();
  const add = tool => {try {void Promise.resolve(context.registerTool(tool, {signal:lifecycle.signal})).catch(()=>{});} catch { }};
  add({ name:'read_metro_test_progress', title:'Переглянути прогрес тесту', description:'Read current question and selected answer. Results appear only after completion.', inputSchema:{type:'object',properties:{},additionalProperties:false}, annotations:{readOnlyHint:true}, execute(){const a=model.attempt;if(!a)return {status:'not_started'};if(a.completed)return {status:'completed',result:score(a)};const q=questions[a.currentIndex];return {status:'in_progress',questionIndex:a.currentIndex+1,question:{id:q.id,text:q.text,options:a.order[q.id].map(id=>q.options.find(o=>o.id===id))},selectedOptionId:a.answers[q.id]??null,answered:Object.keys(a.answers).length};}});
  add({ name:'start_metro_test', title:'Почати тест', description:'Start a new attempt, resetting answers and preserving the local best score.', inputSchema:{type:'object',properties:{},additionalProperties:false}, execute(){actions.start();render();return {status:'started',questions:12};}});
  add({ name:'select_metro_test_answer', title:'Обрати відповідь', description:'Select one option without advancing or revealing correctness.', inputSchema:{type:'object',properties:{optionId:{type:'string'}},required:['optionId'],additionalProperties:false}, execute(input){if(typeof input?.optionId!=='string'||!model.attempt||model.attempt.completed)throw new Error('No active attempt or invalid option.');model.attempt=chooseAnswer(model.attempt,input.optionId);persist();navigate('quiz');render();return {selectedOptionId:input.optionId};}});
  add({ name:'advance_metro_test', title:'Наступне запитання', description:'Advance after selection; on question 12 complete the test and calculate its result.', inputSchema:{type:'object',properties:{},additionalProperties:false}, execute(){if(!model.attempt||model.attempt.completed)throw new Error('No active attempt.');actions.next();render();return model.attempt.completed?{status:'completed',result:score(model.attempt)}:{status:'in_progress',questionIndex:model.attempt.currentIndex+1};}});
  window.addEventListener('pagehide', () => lifecycle.abort(), {once:true});
}
