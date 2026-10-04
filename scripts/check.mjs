import { readdir, readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { validateQuestions } from '../dist/js/data.js';
validateQuestions();
for(const file of await readdir('dist/js')) {if(file.endsWith('.js')){const r=spawnSync(process.execPath,['--check',`dist/js/${file}`],{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr);}}
const html=await readFile('dist/index.html','utf8');
for(const [,relative] of html.matchAll(/(?:src|href)="(\.\/[^"#]+)"/g))await stat(`dist/${relative.slice(2)}`);
for(const file of ['dist/assets/original-map.png','dist/assets/fonts/e-Ukraine-Regular.otf','dist/assets/fonts/e-Ukraine-Bold.otf','dist/assets/vendor/gsap.min.js','dist/assets/vendor/MotionPathPlugin.min.js'])await stat(file);
const manifest=JSON.parse(await readFile('.openai/hosting.json','utf8'));
if(manifest.static?.directory!=='dist')throw Error('Static output directory must be dist.');
console.log('Data, JavaScript syntax, local assets and static configuration verified.');
