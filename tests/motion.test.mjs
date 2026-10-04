import test from 'node:test';
import assert from 'node:assert/strict';
import { stationStops } from '../dist/js/animation.js';
import { homeScreen, quizScreen } from '../dist/js/screens.js';
import { createAttempt } from '../dist/js/state.js';
import { mapSVG } from '../dist/js/map.js';
test('train stops use actual station spacing, including both terminals', () => {
  const path = { getAttribute: () => 'M0 0 H100', getTotalLength: () => 100, getPointAtLength: distance => ({x:distance,y:0}) };
  const stops = stationStops(path, [['a',0,0],['b',25,0],['c',90,0],['d',100,0]]);
  assert.equal(stops.length,4);assert.equal(stops[0],0);assert.equal(stops[3],1);
  assert.ok(Math.abs(stops[1]-.25)<.001);assert.ok(Math.abs(stops[2]-.9)<.001);
  assert.equal(stationStops(path, []),stops,'Station geometry is cached between home visits');
});
test('marked home content is removed while resume and map controls remain', () => {
  const html = homeScreen({attempt:createAttempt(),best:12,notice:''});
  assert.ok(html.includes('Продовжити тест'));
  for(const text of ['Почати заново','Вихідна схема','Одна правильна відповідь','Збережено','Найкращий результат','station-list','line-legend','map-panel-foot','eyebrow'])assert.ok(!html.includes(text),text);
  assert.ok(html.includes('toggle-motion'));assert.ok(html.includes('Збільшити'));
  assert.ok(!quizScreen({attempt:createAttempt(),available:true}).includes('Можна повернутися назад'));
});
test('map has one decorative train per line and a complete accessible station description', () => {
  const html=mapSVG();
  for(const color of ['red','blue','green'])assert.ok(html.includes(`train-${color}`));
  assert.equal((html.match(/class="train-marker /g)||[]).length,3);
  assert.ok(html.includes('Олексіївська: Перемога, Олексіївська, 23 Серпня'));
});
