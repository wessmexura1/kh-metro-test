let libraryPromise, introPlayed = false;
function loadScript(src) {
  return new Promise(resolve => {const script=document.createElement('script');script.src=src;script.async=true;script.onload=()=>resolve(true);script.onerror=()=>resolve(false);document.head.append(script);});
}
function animationLibrary() {
  if (!libraryPromise) libraryPromise = (async()=>{
    if(!await loadScript('./assets/vendor/gsap.min.js'))return null;
    if(!await loadScript('./assets/vendor/MotionPathPlugin.min.js'))return null;
    if(!window.gsap||!window.MotionPathPlugin)return null;
    window.gsap.registerPlugin(window.MotionPathPlugin);
    return window.gsap;
  })().catch(()=>null);
  return libraryPromise;
}
export function enterScreen(root, route) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const target=root.querySelector(route==='quiz'?'.question-card':route==='result'?'.result-score':'.screen-title');
  target?.animate([{opacity:.65,transform:'translateY(7px)'},{opacity:1,transform:'translateY(0)'}],{duration:210,easing:'ease-out'});
}
export function mountAnimations(root, route) {
  const lifecycle=new AbortController(), media=matchMedia('(prefers-reduced-motion: reduce)');
  let timeline=null, observer=null, disposed=false, gsap=null;
  const svg=root.querySelector('.metro-map'), button=root.querySelector('[data-action="animate"]');
  const paths=svg?[...svg.querySelectorAll('.route')]:[], labels=svg?[svg.querySelector('.map-stations'),svg.querySelector('.map-labels')]:[];
  const marker=svg?.querySelector('.train-marker');
  function reset() {
    timeline?.kill(); timeline=null;
    paths.forEach(p=>{p.style.removeProperty('stroke-dasharray');p.style.removeProperty('stroke-dashoffset');});
    labels.forEach(l=>{l.style.removeProperty('opacity');l.style.removeProperty('visibility');});
    if(marker)marker.style.opacity='0';
    if(button){button.textContent='▷ Відтворити анімацію';button.setAttribute('aria-label','Відтворити анімацію схеми');}
  }
  function play() {
    reset();
    if(!gsap||disposed||media.matches||document.hidden)return;
    button.textContent='Ⅱ Зупинити анімацію';button.setAttribute('aria-label','Зупинити анімацію схеми');
    timeline=gsap.timeline({onComplete:reset});
    for(const path of paths){const length=path.getTotalLength();timeline.fromTo(path,{strokeDasharray:length,strokeDashoffset:length},{strokeDashoffset:0,duration:.65,ease:'power1.inOut'});}
    timeline.fromTo(labels,{opacity:.35},{opacity:1,duration:.4},'-=.15');
    const blue=svg.querySelector('.route-blue');
    timeline.set(marker,{opacity:1,x:0,y:0});
    for(let i=0;i<7;i++){timeline.to(marker,{duration:.65,ease:'none',motionPath:{path:blue,align:blue,alignOrigin:[.5,.5],start:i/7,end:(i+1)/7}});timeline.to({}, {duration:.12});}
    timeline.to(marker,{opacity:0,duration:.2});
  }
  if(route==='home') {
    button?.addEventListener('click',()=>{if(timeline)reset();else play();},{signal:lifecycle.signal});
    if(media.matches){if(button){button.disabled=true;button.textContent='Рух вимкнено в налаштуваннях';}}
    else animationLibrary().then(lib=>{if(disposed)return;gsap=lib;if(!lib){button.disabled=true;button.textContent='Анімація недоступна';return;}if(!introPlayed){introPlayed=true;play();}});
    media.addEventListener('change',()=>{reset();button.disabled=media.matches;button.textContent=media.matches?'Рух вимкнено в налаштуваннях':'▷ Відтворити анімацію';if(!media.matches&&!gsap)animationLibrary().then(lib=>{if(!disposed)gsap=lib;});},{signal:lifecycle.signal});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();},{signal:lifecycle.signal});
    const reference=root.querySelector('.reference-image');
    if(reference&&!media.matches&&typeof IntersectionObserver!=='undefined'){
      observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){reference.animate([{opacity:.4,transform:'translateY(14px)',clipPath:'inset(10% 0 0)'},{opacity:1,transform:'translateY(0)',clipPath:'inset(0)'}],{duration:550,easing:'ease-out'});observer.disconnect();}},{threshold:.1});observer.observe(reference);
    }
  }
  return ()=>{disposed=true;reset();observer?.disconnect();lifecycle.abort();root.getAnimations({subtree:true}).forEach(a=>a.cancel());};
}
