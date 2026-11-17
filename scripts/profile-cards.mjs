// Gera em dist/ os cards dinâmicos (estatísticas, linguagens, projetos e contribuições),
// nas versões escura e clara. Roda no GitHub Actions: GITHUB_TOKEN, GH_USER e REPOS.
import { mkdirSync, writeFileSync } from 'node:fs';

const token = process.env.GITHUB_TOKEN;
const user = process.env.GH_USER;
const repos = (process.env.REPOS ?? '').split(',').map((r) => r.trim()).filter(Boolean);
if (!token || !user) throw new Error('Defina GITHUB_TOKEN e GH_USER.');

const FONT = "'JetBrains Mono','Fira Code',Consolas,'Courier New',monospace";
const THEMES = {
  dark: { bg: '#0d1117', line: '#30363d', text: '#c9d1d9', strong: '#ffffff', muted: '#8b949e', accent: '#f0883e', empty: '#161b22', levels: ['#5a2d0c', '#9b4a12', '#d9761f', '#f0883e'] },
  light: { bg: '#ffffff', line: '#d0d7de', text: '#24292f', strong: '#1f2328', muted: '#57606a', accent: '#bc4c00', empty: '#eff2f5', levels: ['#ffd8b5', '#fb8f44', '#d1580e', '#953800'] },
};
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = (n) => new Intl.NumberFormat('pt-BR').format(n);

async function gql(query, variables) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json();
  if (!res.ok || body.errors) throw new Error(JSON.stringify(body.errors ?? body));
  return body.data;
}

const data = await gql(
  `query($login:String!){
    user(login:$login){
      followers{totalCount}
      pullRequests{totalCount}
      issues{totalCount}
      contributionsCollection{
        totalCommitContributions restrictedContributionsCount
        contributionCalendar{totalContributions weeks{contributionDays{contributionCount date}}}
      }
      repositories(first:100, ownerAffiliations:OWNER, isFork:false, privacy:PUBLIC){
        totalCount
        nodes{
          name description stargazerCount forkCount
          primaryLanguage{name color}
          languages(first:10, orderBy:{field:SIZE, direction:DESC}){edges{size node{name color}}}
        }
      }
    }
  }`,
  { login: user }
);
const u = data.user;
const cc = u.contributionsCollection;
const nodes = u.repositories.nodes;

mkdirSync('dist', { recursive: true });
function card(name, w, h, body) {
  for (const [mode, t] of Object.entries(THEMES)) {
    const file = mode === 'dark' ? `${name}-dark.svg` : `${name}.svg`;
    writeFileSync(
      `dist/${file}`,
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<style>text{font-family:${FONT};white-space:pre}.f{opacity:0;animation:f .4s ease-out forwards}@keyframes f{to{opacity:1}}</style>
<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="12" fill="${t.bg}" stroke="${t.line}"/>
${body(t)}
</svg>\n`
    );
  }
}

// ---------- estatísticas ----------
const stars = nodes.reduce((sum, r) => sum + r.stargazerCount, 0);
const stats = [
  ['commits no último ano', cc.totalCommitContributions + cc.restrictedContributionsCount],
  ['contribuições no último ano', cc.contributionCalendar.totalContributions],
  ['pull requests', u.pullRequests.totalCount],
  ['repositórios públicos', u.repositories.totalCount],
  ['estrelas recebidas', stars],
  ['seguidores', u.followers.totalCount],
];
card('stats', 440, 250, (t) =>
  [
    `<text x="24" y="40" font-size="15" font-weight="700" fill="${t.accent}">$ git stats --author=${esc(user)}</text>`,
    ...stats.map(
      ([label, value], i) =>
        `<g class="f" style="animation-delay:${(0.15 * i).toFixed(2)}s"><text x="24" y="${78 + i * 28}" font-size="14" fill="${t.muted}">${esc(label)}</text><text x="416" y="${78 + i * 28}" font-size="15" font-weight="700" text-anchor="end" fill="${t.strong}">${fmt(value)}</text></g>`
    ),
  ].join('\n')
);

// ---------- linguagens (bytes somados dos repositórios próprios) ----------
const bytes = new Map();
for (const repo of nodes)
  for (const { size, node } of repo.languages.edges) {
    const cur = bytes.get(node.name) ?? { size: 0, color: node.color ?? '#8b949e' };
    cur.size += size;
    bytes.set(node.name, cur);
  }
const total = [...bytes.values()].reduce((s, l) => s + l.size, 0) || 1;
const langs = [...bytes.entries()].sort((a, b) => b[1].size - a[1].size).slice(0, 6);
card('langs', 440, 250, (t) => {
  let x = 24;
  const bar = langs
    .map(([, l]) => {
      const w = (l.size / total) * 392;
      const r = `<rect x="${x.toFixed(1)}" y="58" width="${w.toFixed(1)}" height="10" fill="${l.color}"/>`;
      x += w;
      return r;
    })
    .join('');
  const rows = langs
    .map(([name, l], i) => {
      const y = 100 + i * 24;
      return `<g class="f" style="animation-delay:${(0.12 * i).toFixed(2)}s"><circle cx="30" cy="${y - 5}" r="5" fill="${l.color}"/><text x="44" y="${y}" font-size="14" fill="${t.text}">${esc(name)}</text><text x="416" y="${y}" font-size="14" text-anchor="end" fill="${t.muted}">${((l.size / total) * 100).toFixed(1)}%</text></g>`;
    })
    .join('\n');
  return `<text x="24" y="40" font-size="15" font-weight="700" fill="${t.accent}">$ linguagens --top</text>
<clipPath id="bar"><rect x="24" y="58" width="392" height="10" rx="5"/></clipPath><g clip-path="url(#bar)">${bar}</g>
${rows}`;
});

// ---------- cards de projetos ----------
function wrap(text, max) {
  const words = String(text ?? 'Sem descrição.').split(/\s+/);
  const lines = [''];
  for (const word of words) {
    const cur = lines[lines.length - 1];
    if ((cur + ' ' + word).trim().length > max) lines.push(word);
    else lines[lines.length - 1] = (cur + ' ' + word).trim();
  }
  if (lines.length > 3) {
    lines.length = 3;
    lines[2] = lines[2].replace(/.{0,3}$/, '…');
  }
  return lines;
}
repos.forEach((name, i) => {
  const repo = nodes.find((r) => r.name.toLowerCase() === name.toLowerCase());
  if (!repo) {
    console.warn(`Repositório não encontrado: ${name}`);
    return;
  }
  const lang = repo.primaryLanguage;
  card(`repo-${i + 1}`, 440, 150, (t) =>
    [
      `<text x="24" y="38" font-size="15" font-weight="700" fill="${t.accent}">${esc(repo.name)}</text>`,
      ...wrap(repo.description, 46).map(
        (line, j) => `<text x="24" y="${66 + j * 20}" font-size="13" fill="${t.text}">${esc(line)}</text>`
      ),
      lang ? `<circle cx="30" cy="127" r="5" fill="${lang.color ?? t.muted}"/><text x="42" y="131" font-size="13" fill="${t.muted}">${esc(lang.name)}</text>` : '',
      `<text x="416" y="131" font-size="13" text-anchor="end" fill="${t.muted}">★ ${repo.stargazerCount}   ⑂ ${repo.forkCount}</text>`,
    ].join('\n')
  );
});

// ---------- contribuições "compiladas": cada dia vira um dígito hexadecimal ----------
const weeks = cc.contributionCalendar.weeks;
const max = Math.max(1, ...weeks.flatMap((w) => w.contributionDays.map((d) => d.contributionCount)));
const CELL = 16.5;
const W = Math.round(60 + weeks.length * CELL + 20);
const H = 60 + 7 * 20 + 40;
card('code-contribution-graph', W, H, (t) => {
  const cells = [];
  weeks.forEach((week, wi) =>
    week.contributionDays.forEach((day) => {
      const dow = new Date(`${day.date}T12:00:00Z`).getUTCDay();
      const x = 60 + wi * CELL;
      const y = 72 + dow * 20;
      if (day.contributionCount === 0) {
        cells.push(`<text x="${x.toFixed(1)}" y="${y}" font-size="12" fill="${t.muted}" opacity=".35">0</text>`);
        return;
      }
      const level = Math.min(3, Math.floor((day.contributionCount / max) * 4));
      const digit = Math.min(15, day.contributionCount).toString(16).toUpperCase();
      cells.push(
        `<text x="${x.toFixed(1)}" y="${y}" font-size="12" font-weight="700" fill="${t.levels[level]}"><title>${day.date}: ${day.contributionCount}</title>${digit}</text>`
      );
    })
  );
  const days = ['dom', '', 'ter', '', 'qui', '', 'sáb'];
  return `<text x="24" y="36" font-size="14" font-weight="700" fill="${t.accent}">$ javac contribuicoes.java &amp;&amp; java Contribuicoes --hex</text>
${days.map((d, i) => `<text x="24" y="${72 + i * 20}" font-size="11" fill="${t.muted}">${d}</text>`).join('')}
${cells.join('')}
<text x="24" y="${H - 16}" font-size="12" fill="${t.muted}">${fmt(cc.contributionCalendar.totalContributions)} contribuições no último ano · cada dígito = commits do dia (F = 15+)</text>`;
});

console.log(`dist/ gerado para ${user}: ${nodes.length} repositórios, ${langs.length} linguagens.`);
