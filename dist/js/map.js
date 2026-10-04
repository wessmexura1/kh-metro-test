import { lines, transfers } from './metro.js';
export function mapSVG(id = 'hero') {
  const all = lines.flatMap(l => l.stations);
  return `<svg class="metro-map" viewBox="0 0 800 800" role="img" aria-labelledby="${id}-title ${id}-desc" xmlns="http://www.w3.org/2000/svg">
    <title id="${id}-title">Схема Харківського метрополітену</title>
    <desc id="${id}-desc">Три лінії та 30 станцій. Назви перевірено за офіційним сайтом. Пересадки: Майдан Конституції — Історичний музей; Університет — Держпром; Спортивна — Метробудівників. ${lines.map(l => l.name + ": " + l.stations.map(s => s[0]).join(", ")).join(". ")}</desc>
    <g class="map-river" aria-hidden="true"><path d="M95 42L230 270Q252 310 225 350L190 408H344Q365 408 375 390Q385 372 410 372H539Q582 372 585 337Q588 320 566 284L497 183Q481 159 497 130L550 36"/></g>
    <g class="map-lines" aria-hidden="true">${lines.map(l=>`<path id="${id}-${l.id}" class="route route-${l.id}" d="${l.path}" stroke="${l.color}"/>`).join('')}</g>
    <g class="map-stations" aria-hidden="true">${lines.map(l=>l.stations.map((s,i)=>`<path class="station-tick" stroke="${l.color}" d="M${s[1]-5} ${s[2]+3}l10 -6" stroke-width="${i===0||i===l.stations.length-1?7:5}"/>`).join('')).join('')}</g>
    <g class="map-labels" fill="#17212B">${all.map(s=>`<text x="${s[3]}" y="${s[4]}" text-anchor="${s[5]}">${s[0]}</text>`).join('')}</g>
    <g class="map-transfers" aria-hidden="true">${transfers.map(t=>{const a=all.find(s=>s[0]===t[0]),b=all.find(s=>s[0]===t[1]);return `<path d="M${a[1]} ${a[2]}L${b[1]} ${b[2]}" stroke="#17212B" stroke-width="8"/><path d="M${a[1]} ${a[2]}L${b[1]} ${b[2]}" stroke="white" stroke-width="4"/><circle cx="${a[1]}" cy="${a[2]}" r="5"/><circle cx="${b[1]}" cy="${b[2]}" r="5"/>`}).join('')}</g>
    ${lines.map(l=>`<circle class="train-marker train-${l.id}" data-line="${l.id}" r="7" fill="${l.color}" stroke="white" stroke-width="3" aria-hidden="true" opacity="0"/>`).join('')}
    <g aria-hidden="true" class="map-key"><rect x="55" y="574" width="24" height="24" rx="5" fill="#DF2638"/><text x="67" y="591" text-anchor="middle" fill="white">1</text><text x="91" y="591">Холодногірсько-заводська</text><rect x="55" y="616" width="24" height="24" rx="5" fill="#087EAD"/><text x="67" y="633" text-anchor="middle" fill="white">2</text><text x="91" y="633">Салтівська</text><rect x="55" y="658" width="24" height="24" rx="5" fill="#00965E"/><text x="67" y="675" text-anchor="middle" fill="white">3</text><text x="91" y="675">Олексіївська</text></g>
  </svg>`;
}
