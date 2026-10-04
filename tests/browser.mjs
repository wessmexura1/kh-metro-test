import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
const require = createRequire(path.join(tmpdir(), 'kharkiv-metro-qa', 'package.json'));
const { chromium } = require('playwright-core');
const AxeBuilder = require('@axe-core/playwright').default;
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { questions } from '../dist/js/data.js';
const browser = await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
await mkdir('test-artifacts',{recursive:true});
const context=await browser.newContext({viewport:{width:1440,height:1050},reducedMotion:'reduce'});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const base='http://127.0.0.1:5174/';
const checkAxe=async label=>{const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();assert.deepEqual(results.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)})),[],`Accessibility: ${label}`);};
const noOverflow=async()=>assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'No horizontal page overflow');
try {
  await page.goto(base+'#result');await page.locator('h1').waitFor();assert.equal(new URL(page.url()).hash,'#home');
  await page.screenshot({path:'test-artifacts/home-desktop.png',fullPage:true});await checkAxe('home');
  const zoom=page.getByRole('button',{name:'Збільшити'});await zoom.click();assert.equal(await page.locator('dialog').evaluate(d=>d.open),true);await page.keyboard.press('Tab');assert.ok(await page.locator('dialog').evaluate(d=>d.contains(document.activeElement)));await page.keyboard.press('Escape');assert.equal(await zoom.evaluate(e=>e===document.activeElement),true);
  assert.equal(await page.locator('.reference-section,.station-list,.line-legend,.map-panel-foot,.header-link,footer,.hero-copy>.eyebrow,[data-action=original]').count(),0);
  await page.getByRole('button',{name:'Почати тест'}).click();await page.locator('legend').waitFor();assert.equal(await page.locator('[data-action=next]').isDisabled(),true);assert.equal(await page.locator('.metro-map').count(),0);assert.equal(await page.locator('[data-action=back]').count(),0);
  await page.locator('.answer-card').nth(0).click();await page.locator('.answer-card').nth(1).click();assert.equal(await page.locator('input:checked').count(),1);assert.equal(await page.locator('.quiz-top>span').first().textContent(),'Запитання 1 із 12');
  const first=await page.locator('input:checked').inputValue();await page.locator('[data-action=next]').click();await page.locator('[data-action=back]').click();assert.equal(await page.locator('input:checked').inputValue(),first);
  await page.locator('input:checked').focus();await page.keyboard.press('ArrowDown');assert.equal(await page.locator('input:checked').count(),1);assert.notEqual(await page.locator('input:checked').inputValue(),first);
  const order=await page.locator('input').evaluateAll(inputs=>inputs.map(i=>i.value));const answer=await page.locator('input:checked').inputValue();await page.reload();await page.locator('legend').waitFor();assert.deepEqual(await page.locator('input').evaluateAll(inputs=>inputs.map(i=>i.value)),order);assert.equal(await page.locator('input:checked').inputValue(),answer);await checkAxe('quiz');
  await page.screenshot({path:'test-artifacts/question-desktop.png',fullPage:true});
  // Complete the actual interface with all correct answers.
  for(let i=0;i<12;i++){await page.locator(`input[value="${questions[i].correctOptionId}"]`).check({force:true});await page.locator('[data-action=next]').click();}
  await page.locator('.result-score').waitFor();assert.equal(await page.locator('.result-score>span').first().textContent(),'12');await checkAxe('result');await page.screenshot({path:'test-artifacts/result-desktop.png',fullPage:true});
  await page.getByRole('link',{name:'Переглянути відповіді'}).click();await page.locator('.review-card').first().waitFor();assert.equal(await page.locator('.review-card').count(),12);await page.locator('[data-action=filter-errors]').click();assert.ok(await page.getByRole('heading',{name:'Жодної помилки'}).isVisible());await page.locator('[data-action=filter-all]').first().click();await checkAxe('review');
  await page.getByRole('button',{name:'Пройти ще раз'}).click();await page.locator('legend').waitFor();assert.equal(await page.locator('input:checked').count(),0);
  for(let i=0;i<12;i++){const q=questions[i],wrong=q.options.find(o=>o.id!==q.correctOptionId).id;await page.locator(`input[value="${wrong}"]`).check({force:true});await page.locator('[data-action=next]').click();}
  await page.locator('.result-score').waitFor();assert.equal(await page.locator('.result-score>span').first().textContent(),'0');assert.ok((await page.locator('.result-meta').textContent()).includes('Найкраще: 12 із 12'));
  await page.getByRole('link',{name:'Переглянути відповіді'}).click();await page.locator('[data-action=filter-errors]').click();assert.equal(await page.locator('.review-card').count(),12);
  await page.goto(base+'#about');await page.locator('h1').waitFor();assert.equal(new URL(page.url()).hash,'#home');
  for(const size of [{width:390,height:844},{width:320,height:568},{width:844,height:390}]){
    await page.setViewportSize(size);await page.goto(base+'#home');await page.locator('h1').waitFor();await noOverflow();await page.screenshot({path:`test-artifacts/home-${size.width}.png`,fullPage:true});
    await page.locator('[data-action=start],[data-action=resume]').click();await page.locator('legend').waitFor();await noOverflow();
    await page.locator('.answer-card').nth(0).click();await page.locator('[data-action=next]').click();await page.locator('.answer-card').nth(0).click();await page.locator('[data-action=next]').click();await noOverflow();await page.screenshot({path:`test-artifacts/question-${size.width}.png`,fullPage:true});
  }
  const savedIndex=await page.locator('.quiz-top>span').first().textContent();await page.goto(base+'#home');await page.getByRole('button',{name:'Продовжити тест'}).waitFor();assert.equal(await page.getByRole('button',{name:'Почати заново'}).count(),0);await page.reload();await page.getByRole('button',{name:'Продовжити тест'}).click();assert.equal(await page.locator('.quiz-top>span').first().textContent(),savedIndex);
  await page.evaluate(()=>localStorage.setItem('kharkiv-metro-test:v1','{bad'));await page.goto(base+'#home');await page.reload();await page.locator('.storage-notice').waitFor();assert.ok(await page.getByRole('button',{name:'Почати тест'}).isVisible());
  const denied=await browser.newPage({reducedMotion:'reduce'});await denied.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new Error('denied');}}));await denied.goto(base);await denied.getByRole('button',{name:'Почати тест'}).click();await denied.locator('.answer-card').first().click();await denied.locator('[data-action=next]').click();assert.equal(await denied.locator('.quiz-top>span').first().textContent(),'Запитання 2 із 12');await denied.close();
  const failedAnimation=await browser.newPage({reducedMotion:'no-preference'});await failedAnimation.route('**/assets/vendor/**',r=>r.abort());await failedAnimation.goto(base);await failedAnimation.getByRole('button',{name:'Анімація недоступна'}).waitFor();assert.equal(await failedAnimation.locator('.route').count(),3);assert.equal(await failedAnimation.locator('.map-stations').evaluate(e=>e.style.opacity),'');assert.equal(await failedAnimation.locator('.route').first().evaluate(e=>e.style.strokeDashoffset),'');await failedAnimation.getByRole('button',{name:'Почати тест'}).click();await failedAnimation.locator('.answer-card').first().click();assert.ok(await failedAnimation.locator('[data-action=next]').isEnabled());await failedAnimation.close();
  const animated=await browser.newPage({reducedMotion:'no-preference'});animated.on('pageerror',e=>errors.push(e.message));
  let releaseLibrary; const libraryGate=new Promise(resolve=>releaseLibrary=resolve);
  await animated.route('**/assets/vendor/gsap.min.js',async route=>{await libraryGate;await route.continue();});
  await animated.goto(base,{waitUntil:'domcontentloaded'});await animated.locator('.map-stations').waitFor({state:'attached'});
  assert.equal(await animated.locator('.map-stations').evaluate(e=>e.style.opacity),'0');
  assert.ok(Number(await animated.locator('.route').first().evaluate(e=>e.style.strokeDashoffset))>0);
  releaseLibrary();
  await animated.waitForFunction(()=>window.gsap&&window.gsap.globalTimeline.getChildren(true,false,true).filter(t=>t.repeat()===-1).length===3);
  assert.equal(await animated.locator('.train-marker').count(),3);
  const firstPositions=await animated.locator('.train-marker').evaluateAll(ms=>ms.map(m=>m.getAttribute('transform')));
  await animated.waitForTimeout(650);
  const movedPositions=await animated.locator('.train-marker').evaluateAll(ms=>ms.map(m=>m.getAttribute('transform')));
  firstPositions.forEach((position,i)=>assert.notEqual(position,movedPositions[i],`Movement on line ${i}`));
  await animated.getByRole('button',{name:'Призупинити рух поїздів'}).click();
  const pausedPositions=await animated.locator('.train-marker').evaluateAll(ms=>ms.map(m=>m.getAttribute('transform')));await animated.waitForTimeout(350);
  assert.deepEqual(await animated.locator('.train-marker').evaluateAll(ms=>ms.map(m=>m.getAttribute('transform'))),pausedPositions);
  await animated.getByRole('button',{name:'Відновити рух поїздів'}).click();
  await animated.getByRole('button',{name:'Почати тест'}).click();await animated.locator('legend').waitFor();assert.equal(await animated.locator('.train-marker').count(),0);
  await animated.locator('.back-link').click();await animated.locator('.metro-map').waitFor();
  assert.equal(await animated.locator('.route').first().evaluate(e=>e.style.strokeDashoffset),'');
  assert.equal(await animated.locator('.map-stations').evaluate(e=>e.style.opacity),'');
  await animated.waitForFunction(()=>window.gsap.globalTimeline.getChildren(true,false,true).filter(t=>t.repeat()===-1).length===3);
  // Accelerate only the test timelines to verify that motion repeats beyond a whole round trip.
  await animated.evaluate(()=>window.gsap.globalTimeline.getChildren(true,false,true).filter(t=>t.repeat()===-1).forEach(t=>t.timeScale(50)));
  await animated.waitForFunction(()=>window.gsap.globalTimeline.getChildren(true,false,true).filter(t=>t.repeat()===-1).every(t=>t.iteration()>1));
  await animated.emulateMedia({reducedMotion:'reduce'});await animated.waitForFunction(()=>window.gsap.globalTimeline.getChildren(true,false,true).filter(t=>t.repeat()===-1).length===0);assert.equal(await animated.locator('.route').first().evaluate(e=>e.style.strokeDashoffset),'');
  await animated.close();
  assert.deepEqual(errors,[]);
  await writeFile('test-artifacts/browser-report.json',JSON.stringify({status:'passed',checks:['full 12/12 and 0/12 attempts','selection change and keyboard arrows','back and reload restore','persistent shuffled order','best score survives restart','review filter','removed content and route guard','dialog Escape and focus','390/320/844 widths','corrupt storage','denied storage','GSAP failure','reduced motion','intro only on first opening','movement and repeat on all three lines','pause and cleanup','WCAG axe all four screens'],errors},null,2));
  console.log('Browser scenarios, four-screen accessibility and all three looping routes passed.');
} finally {await browser.close();}
