import { lines } from './metro.js';

let libraryPromise;
let introPlayed = false;
let userPaused = false;
const stopCache = new Map();

function loadScript(src) {
  return new Promise(resolve => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.append(script);
  });
}

function animationLibrary() {
  libraryPromise ??= (async () => {
    if (!await loadScript('./assets/vendor/gsap.min.js')) return null;
    if (!await loadScript('./assets/vendor/MotionPathPlugin.min.js')) return null;
    if (!window.gsap || !window.MotionPathPlugin) return null;
    window.gsap.registerPlugin(window.MotionPathPlugin);
    return window.gsap;
  })().catch(() => null);
  return libraryPromise;
}

// Project station coordinates onto the drawn route, rather than stopping at equal intervals.
export function stationStops(path, stations) {
  const key = path.getAttribute('d');
  if (stopCache.has(key)) return stopCache.get(key);
  const length = path.getTotalLength();
  const steps = Math.max(40, Math.ceil(length / 6));
  const samples = Array.from({ length: steps + 1 }, (_, i) => {
    const distance = length * i / steps;
    return { distance, point: path.getPointAtLength(distance) };
  });
  const result = stations.map(([, x, y], i) => {
    if (i === 0) return 0;
    if (i === stations.length - 1) return 1;
    const squaredDistance = p => (p.x - x) ** 2 + (p.y - y) ** 2;
    const nearest = samples.reduce((best, s) => squaredDistance(s.point) < squaredDistance(best.point) ? s : best);
    let low = Math.max(0, nearest.distance - length / steps);
    let high = Math.min(length, nearest.distance + length / steps);
    for (let j = 0; j < 12; j++) {
      const a = low + (high - low) / 3, b = high - (high - low) / 3;
      if (squaredDistance(path.getPointAtLength(a)) < squaredDistance(path.getPointAtLength(b))) high = b;
      else low = a;
    }
    return (low + high) / 2 / length;
  }).sort((a, b) => a - b);
  stopCache.set(key, result);
  return result;
}

export function enterScreen(root, route) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const target = root.querySelector(route === 'quiz' ? '.question-card' : route === 'result' ? '.result-score' : '.screen-title');
  target?.animate([{ opacity: .65, transform: 'translateY(7px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 210, easing: 'ease-out' });
}

export function mountAnimations(root, route) {
  if (route !== 'home') return () => {};
  const svg = root.querySelector('.metro-map');
  if (!svg) return () => {};
  const lifecycle = new AbortController();
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const button = root.querySelector('[data-action="toggle-motion"]');
  const paths = [...svg.querySelectorAll('.route')];
  const stationGroups = [...svg.querySelectorAll('.map-stations, .map-labels, .map-transfers')];
  const markers = [...svg.querySelectorAll('.train-marker')];
  let showIntro = !introPlayed && !media.matches;
  introPlayed = true;
  let gsap, intro, observer, disposed = false, visible = true;
  const journeys = [];

  function showSchema() {
    paths.forEach(p => { p.style.removeProperty('stroke-dasharray'); p.style.removeProperty('stroke-dashoffset'); });
    stationGroups.forEach(g => { g.style.removeProperty('opacity'); g.style.removeProperty('visibility'); });
  }

  // Prepare before the library loads so the first frame does not flash the complete map.
  if (showIntro) {
    paths.forEach(path => {
      const length = path.getTotalLength();
      path.style.strokeDasharray = length;
      path.style.strokeDashoffset = length;
    });
    stationGroups.forEach(group => { group.style.opacity = '0'; });
  }

  function updateButton() {
    if (!button) return;
    button.disabled = media.matches || !gsap;
    const paused = userPaused;
    const label = media.matches ? 'Рух вимкнено в налаштуваннях' : !gsap ? 'Анімація недоступна' : paused ? 'Відновити рух поїздів' : 'Призупинити рух поїздів';
    button.setAttribute('aria-label', label);
    button.setAttribute('aria-pressed', String(paused));
    button.title = label;
    button.innerHTML = `<span aria-hidden="true">${paused ? '▷' : 'Ⅱ'}</span>`;
  }

  function syncPlayback() {
    if (disposed) return;
    const active = gsap && !media.matches && !userPaused && !document.hidden && visible;
    if (intro) {
      active ? intro.resume() : intro.pause();
    } else {
      for (const journey of journeys) active ? journey.resume() : journey.pause();
    }
    updateButton();
  }

  function createJourneys() {
    if (journeys.length || !gsap || disposed || media.matches) return;
    for (const line of lines) {
      const path = svg.querySelector(`.route-${line.id}`);
      const marker = svg.querySelector(`.train-${line.id}`);
      const stops = stationStops(path, line.stations);
      gsap.set(marker, { opacity: 1, motionPath: { path, align: path, alignOrigin: [.5, .5], start: 0, end: 0 } });
      const journey = gsap.timeline({ paused: true, repeat: -1, repeatDelay: .18 });
      // Travel there and back without jumping between terminal stations.
      for (const direction of [stops, [...stops].reverse()]) {
        for (let i = 1; i < direction.length; i++) {
          const start = direction[i - 1], end = direction[i];
          journey.to(marker, { duration: Math.max(.12, Math.abs(end - start) * 6), ease: 'none', motionPath: { path, align: path, alignOrigin: [.5, .5], start, end } });
          journey.to({}, { duration: i === direction.length - 1 ? .55 : .18 });
        }
      }
      journeys.push(journey);
    }
    syncPlayback();
  }

  function initialize() {
    if (disposed || !gsap || media.matches) return;
    if (!showIntro) { showSchema(); createJourneys(); return; }
    showIntro = false;
    intro = gsap.timeline({ paused: true, onComplete() {
      intro = null;
      showSchema();
      createJourneys();
    } });
    gsap.set(stationGroups, { opacity: 0 });
    for (const path of paths) {
      const length = path.getTotalLength();
      intro.fromTo(path, { strokeDasharray: length, strokeDashoffset: length }, { strokeDashoffset: 0, duration: .55, ease: 'power1.inOut' });
    }
    intro.to(stationGroups, { opacity: 1, duration: .4, stagger: .08 });
    syncPlayback();
  }

  button?.addEventListener('click', () => { userPaused = !userPaused; syncPlayback(); }, { signal: lifecycle.signal });
  document.addEventListener('visibilitychange', syncPlayback, { signal: lifecycle.signal });
  media.addEventListener('change', () => {
    if (media.matches) {
      intro?.kill(); intro = null;
      journeys.splice(0).forEach(journey => journey.kill());
      markers.forEach(marker => { marker.style.opacity = '0'; });
      showSchema(); updateButton();
    } else {
      animationLibrary().then(lib => { if (disposed) return; gsap = lib; if (gsap) initialize(); else showSchema(); updateButton(); });
    }
  }, { signal: lifecycle.signal });
  if (typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; syncPlayback(); }, { threshold: .05 });
    observer.observe(svg);
  }
  updateButton();
  if (!media.matches) animationLibrary().then(lib => { if (disposed) return; gsap = lib; if (gsap) initialize(); else showSchema(); updateButton(); });
  return () => {
    disposed = true;
    intro?.kill(); journeys.forEach(journey => journey.kill());
    showSchema(); markers.forEach(marker => { marker.style.opacity = '0'; });
    observer?.disconnect(); lifecycle.abort();
    root.getAnimations({ subtree: true }).forEach(animation => animation.cancel());
  };
}
