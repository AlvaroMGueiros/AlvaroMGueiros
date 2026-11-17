// Gera os SVGs estáticos do perfil em assets/. Rode localmente: node scripts/build-assets.mjs
import { mkdirSync, writeFileSync } from 'node:fs';

const C = {
  bg: '#0d1117',
  bar: '#161b22',
  line: '#30363d',
  text: '#c9d1d9',
  muted: '#8b949e',
  accent: '#f0883e', // laranja Java
  blue: '#58a6ff',
  purple: '#d2a8ff',
  green: '#3fb950',
  string: '#a5d6ff',
  red: '#ff7b72',
};
const FONT = "'JetBrains Mono','Fira Code',Consolas,'Courier New',monospace";
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const span = (fill, s) => `<tspan fill="${fill}">${esc(s)}</tspan>`;

mkdirSync('assets', { recursive: true });
const save = (name, svg) => writeFileSync(`assets/${name}`, svg.trim() + '\n');

function windowChrome(w, h, title) {
  return `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="14" fill="${C.bg}" stroke="${C.line}" stroke-width="2"/>
<path d="M1 15 a14 14 0 0 1 14 -14 H${w - 15} a14 14 0 0 1 14 14 V46 H1Z" fill="${C.bar}"/>
<rect x="1" y="46" width="${w - 2}" height="1" fill="${C.line}"/>
<circle cx="28" cy="24" r="7" fill="#ff5f57"/><circle cx="50" cy="24" r="7" fill="#febc2e"/><circle cx="72" cy="24" r="7" fill="#28c840"/>
<text x="${w / 2}" y="29" text-anchor="middle" fill="${C.muted}" font-size="14">${esc(title)}</text>`;
}

// ---------- terminal.svg: whoami animado ----------
{
  const W = 1000;
  const CH = 10.2; // largura aproximada de um caractere a 17px
  const prompt = [span(C.green, 'alvaro@github'), span(C.muted, ':'), span(C.blue, '~'), span(C.muted, '$ ')].join('');
  const promptLen = 'alvaro@github:~$ '.length;
  const steps = [
    { cmd: 'whoami', out: [[C.text, 'Álvaro Miguel — '], [C.accent, 'Software Engineer · Backend & Full Stack']] },
    { cmd: 'cat stack.txt', out: [[C.purple, 'Java · Spring Boot · NestJS · C#/.NET · React · TypeScript']] },
    { cmd: 'cat local.txt', out: [[C.text, '📍 Garanhuns, Pernambuco — Brasil']] },
    {
      cmd: './experiencia --resumo',
      out: [[C.green, '✔ '], [C.text, '3+ anos em produção · saúde pública, logística e corporativo']],
    },
  ];
  let y = 90;
  let t = 0.3;
  const lines = [];
  for (const step of steps) {
    const typeDur = step.cmd.length * 0.055;
    const coverX = 30 + promptLen * CH;
    lines.push(`<g class="o" style="animation-delay:${t.toFixed(2)}s"><text x="30" y="${y}" xml:space="preserve">${prompt}${span(C.text, step.cmd)}</text>
<rect x="${coverX.toFixed(1)}" y="${y - 16}" width="${(step.cmd.length * CH + 6).toFixed(1)}" height="22" fill="${C.bg}" class="type" style="animation-delay:${t.toFixed(2)}s;animation-duration:${typeDur.toFixed(2)}s;animation-timing-function:steps(${step.cmd.length})"/></g>`);
    t += typeDur + 0.35;
    y += 30;
    lines.push(`<text x="30" y="${y}" class="o" style="animation-delay:${t.toFixed(2)}s" xml:space="preserve">${step.out.map(([f, s]) => span(f, s)).join('')}</text>`);
    t += 0.45;
    y += 40;
  }
  lines.push(`<text x="30" y="${y}" class="o" style="animation-delay:${t.toFixed(2)}s" xml:space="preserve">${prompt}</text>`);
  lines.push(`<rect x="${(30 + promptLen * CH).toFixed(1)}" y="${y - 15}" width="10" height="19" fill="${C.accent}" class="cur" style="animation-delay:${t.toFixed(2)}s"/>`);
  const H = y + 40;

  // Monograma "AM" em blocos de contribuição, à direita
  const glyph = [
    '.###..#...#',
    '#...#.##.##',
    '#...#.#.#.#',
    '#####.#...#',
    '#...#.#...#',
    '#...#.#...#',
  ];
  const cells = [];
  glyph.forEach((row, r) =>
    [...row].forEach((ch, c) => {
      if (ch === '#') cells.push(`<rect x="${790 + c * 15}" y="${100 + r * 15}" width="12" height="12" rx="2" fill="url(#g)"/>`);
    })
  );

  save(
    'terminal.svg',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<style>
text{font-family:${FONT};font-size:17px;white-space:pre}
.o{opacity:0;animation:o .01s linear forwards}
@keyframes o{to{opacity:1}}
.type{transform-box:fill-box;transform-origin:right;animation-name:tp;animation-fill-mode:forwards}
@keyframes tp{to{transform:scaleX(0)}}
.cur{opacity:0;animation:o .01s linear forwards,bl 1s steps(1) infinite}
@keyframes bl{50%{fill:transparent}}
.glow{animation:gl 3s ease-in-out infinite}@keyframes gl{50%{opacity:.55}}
</style>
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.accent}"/><stop offset="1" stop-color="${C.blue}"/></linearGradient>
<filter id="gw" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
${windowChrome(W, H, 'alvaro@github: ~ — bash')}
<g class="glow" filter="url(#gw)">${cells.join('')}</g>
${lines.join('\n')}
</svg>`
  );
}

// ---------- cabeçalhos de seção ----------
const sections = [
  ['h-sobre.svg', '01.', 'sobre_mim'],
  ['h-tecnologias.svg', '02.', 'tecnologias'],
  ['h-experiencia.svg', '03.', 'experiencia'],
  ['h-projetos.svg', '04.', 'projetos'],
  ['h-formacao.svg', '05.', 'formacao'],
  ['h-estatisticas.svg', '06.', 'estatisticas'],
  ['h-contribuicoes.svg', '07.', 'contribuicoes'],
];
for (const [file, num, name] of sections) {
  const chars = `${num} // ${name}()`.length;
  const curX = 18 + chars * 13.3 + 4;
  save(
    file,
    `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="56" viewBox="0 0 900 56">
<style>.cur{animation:bl 1s steps(1) infinite}@keyframes bl{50%{opacity:0}}</style>
<defs><linearGradient id="l" x1="0" x2="1"><stop offset="0" stop-color="${C.accent}"/><stop offset="1" stop-color="${C.accent}" stop-opacity="0"/></linearGradient></defs>
<rect x="1" y="1" width="898" height="54" rx="10" fill="${C.bg}" stroke="${C.line}"/>
<text x="18" y="36" font-family="${esc(FONT)}" font-size="22" font-weight="700" xml:space="preserve">${span(C.accent, num)}${span(C.muted, ' // ')}${span(C.text, name)}${span(C.purple, '()')}</text>
<rect class="cur" x="${curX.toFixed(0)}" y="18" width="11" height="22" fill="${C.accent}"/>
<rect x="${(curX + 24).toFixed(0)}" y="28" width="${(890 - curX - 24).toFixed(0)}" height="2" fill="url(#l)"/>
</svg>`
  );
}

// ---------- editor.svg: classe Java "sobre mim" ----------
{
  const k = (s) => [C.red, s];
  const ty = (s) => [C.accent, s];
  const id = (s) => [C.blue, s];
  const str = (s) => [C.string, s];
  const p = (s) => [C.text, s];
  const num = (s) => [C.purple, s];
  const code = [
    [k('public class '), ty('AlvaroMiguel'), p(' {')],
    [p('  '), ty('String'), id(' cargo'), p(' = '), str('"Software Engineer"'), p(';')],
    [p('  '), ty('String'), id(' foco'), p(' = '), str('"Backend & Full Stack"'), p(';')],
    [p('  '), ty('String'), id(' local'), p(' = '), str('"Garanhuns, PE"'), p(';')],
    [p('  '), ty('List'), p('<'), ty('String'), p('>'), id(' stack'), p(' = '), ty('List'), p('.of(')],
    [p('    '), str('"Java"'), p(', '), str('"Spring"'), p(', '), str('"NestJS"'), p(',')],
    [p('    '), str('"C#/.NET"'), p(', '), str('"React"'), p(', '), str('"TS"'), p(');')],
    [p('  '), k('int'), id(' anosEmProducao'), p(' = '), num('3'), p(';')],
    [p('  '), k('boolean'), id(' abertoAColaborar'), p(' = '), num('true'), p(';')],
    [p('}')],
  ];
  const W = 570;
  const H = 104 + code.length * 23 + 14;
  const rows = code
    .map((parts, i) => {
      const y = 104 + i * 23;
      return `<text x="32" y="${y}" fill="${C.muted}" font-size="13" text-anchor="end" opacity=".6">${i + 1}</text>
<text x="48" y="${y}" class="ln" style="animation-delay:${(0.3 + i * 0.18).toFixed(2)}s" xml:space="preserve">${parts.map(([f, s]) => span(f, s)).join('')}</text>`;
    })
    .join('\n');
  save(
    'editor.svg',
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<style>
text{font-family:${FONT};font-size:14px;white-space:pre}
.ln{opacity:0;animation:ln .35s ease-out forwards}
@keyframes ln{from{opacity:0;transform:translateX(-5px)}to{opacity:1;transform:none}}
</style>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="12" fill="${C.bg}" stroke="${C.line}" stroke-width="2"/>
<path d="M1 13 a12 12 0 0 1 12 -12 H${W - 13} a12 12 0 0 1 12 12 V40 H1Z" fill="${C.bar}"/>
<circle cx="22" cy="20" r="6" fill="#ff5f57"/><circle cx="40" cy="20" r="6" fill="#febc2e"/><circle cx="58" cy="20" r="6" fill="#28c840"/>
<rect x="1" y="40" width="${W - 2}" height="34" fill="${C.bar}"/>
<rect x="1" y="40" width="200" height="34" fill="${C.bg}"/><rect x="1" y="40" width="200" height="2" fill="${C.accent}"/>
<text x="16" y="62" fill="${C.accent}" font-size="12" font-weight="700">J</text><text x="32" y="62" fill="${C.text}" font-size="13">AlvaroMiguel.java</text>
<text x="220" y="62" fill="${C.muted}" font-size="13">application.yml</text>
<rect x="1" y="74" width="${W - 2}" height="1" fill="${C.line}"/>
${rows}
</svg>`
  );
}

// ---------- rodape.svg ----------
save(
  'rodape.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="80" viewBox="0 0 900 80">
<style>text{font-family:${FONT};white-space:pre}.cur{animation:bl 1s steps(1) infinite}@keyframes bl{50%{opacity:0}}</style>
<rect x="1" y="1" width="898" height="78" rx="10" fill="${C.bg}" stroke="${C.line}"/>
<text x="24" y="34" font-size="16" xml:space="preserve">${span(C.green, 'alvaro@github')}${span(C.muted, ':')}${span(C.blue, '~')}${span(C.muted, '$ ')}${span(C.text, 'exit')}</text>
<text x="24" y="60" font-size="16" xml:space="preserve">${span(C.accent, '> ')}${span(C.text, 'Obrigado pela visita! Até o próximo commit.')}</text>
<rect class="cur" x="482" y="46" width="9" height="18" fill="${C.accent}"/>
</svg>`
);

console.log('assets gerados');
