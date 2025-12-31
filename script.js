const pollForm = document.getElementById('pollForm');
const voteBtn = document.getElementById('voteBtn');
const changeBtn = document.getElementById('changeBtn');
const resetBtn = document.getElementById('resetBtn');
const statusEl = document.getElementById('status');
const resultsSubtitle = document.getElementById('resultsSubtitle');
const resultsList = document.getElementById('resultsList');
const suggestionWrap = document.getElementById('suggestionWrap');
const suggestionInput = document.getElementById('suggestionInput');
const suggestionsEl = document.getElementById('suggestions');

const POLL_ID = 'jogos-2-enquete-v1';
const STORAGE_KEY = `poll:${POLL_ID}`;

const OPTIONS = [
  {
    id: 'opt1',
    title: 'Opção 1',
    label: 'Sugestões + votação (9 e 7 números)'
  },
  {
    id: 'opt2',
    title: 'Opção 2',
    label: 'Duas surpresinhas (caixa sorteia)'
  },
  {
    id: 'opt3',
    title: 'Opção 3',
    label: '2 pessoas montam os jogos'
  },
  {
    id: 'opt4',
    title: 'Outras opções',
    label: 'Sugestão livre'
  }
];

function nowIso() {
  return new Date().toISOString();
}

function formatDateTime(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date);
}

function safeJsonParse(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function emptyState() {
  return {
    version: 1,
    counts: Object.fromEntries(OPTIONS.map(o => [o.id, 0])),
    my_vote: null,
    suggestions: []
  };
}

function loadState() {
  const stored = safeJsonParse(localStorage.getItem(STORAGE_KEY));
  if (!stored || typeof stored !== 'object') return emptyState();

  const base = emptyState();
  const counts = stored.counts && typeof stored.counts === 'object'
    ? stored.counts
    : {};

  for (const opt of OPTIONS) {
    const value = counts[opt.id];
    base.counts[opt.id] = Number.isFinite(value) ? value : 0;
  }

  if (stored.my_vote && typeof stored.my_vote === 'object') {
    base.my_vote = {
      option_id: stored.my_vote.option_id || null,
      suggestion: stored.my_vote.suggestion || '',
      voted_at: stored.my_vote.voted_at || null
    };
  }

  if (Array.isArray(stored.suggestions)) {
    base.suggestions = stored.suggestions
      .filter(s => s && typeof s === 'object')
      .slice(-25)
      .map(s => ({
        text: String(s.text || '').slice(0, 300),
        at: String(s.at || '')
      }))
      .filter(s => s.text.length > 0);
  }

  return base;
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getSelectedOptionId() {
  const selected = pollForm.querySelector('input[name="vote"]:checked');
  return selected ? selected.value : null;
}

function getOptionById(id) {
  return OPTIONS.find(o => o.id === id) || null;
}

function setStatus(message) {
  statusEl.textContent = message || '';
}

function shouldShowSuggestion(optionId) {
  return optionId === 'opt4';
}

function getSuggestionValue() {
  return String(suggestionInput.value || '').trim();
}

function renderSuggestionVisibility() {
  const optionId = getSelectedOptionId();
  const show = shouldShowSuggestion(optionId);
  suggestionWrap.hidden = !show;
  if (!show) {
    suggestionInput.value = '';
  }
}

function totalVotes(counts) {
  return OPTIONS.reduce((sum, opt) => sum + (counts[opt.id] || 0), 0);
}

function renderSuggestions(state) {
  const items = state.suggestions || [];
  if (items.length === 0) {
    suggestionsEl.hidden = true;
    suggestionsEl.innerHTML = '';
    return;
  }

  const listItems = items
    .slice()
    .reverse()
    .map(s => {
      const when = s.at ? ` (${formatDateTime(s.at)})` : '';
      return `<li>${escapeHtml(s.text)}<span class="muted">${escapeHtml(when)}</span></li>`;
    })
    .join('');

  suggestionsEl.hidden = false;
  suggestionsEl.innerHTML = `
    <h3>Sugestões recentes (salvas neste navegador)</h3>
    <ul>${listItems}</ul>
  `.trim();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderResults(state) {
  const total = totalVotes(state.counts);
  const myOptionId = state.my_vote ? state.my_vote.option_id : null;

  const subtitleParts = [];
  subtitleParts.push(`Total: ${total} voto${total === 1 ? '' : 's'} (neste navegador)`);
  if (myOptionId) {
    const opt = getOptionById(myOptionId);
    const when = state.my_vote && state.my_vote.voted_at
      ? ` em ${formatDateTime(state.my_vote.voted_at)}`
      : '';
    subtitleParts.push(`Seu voto: ${opt ? opt.title : myOptionId}${when}`);
  } else {
    subtitleParts.push('Você ainda não votou');
  }
  resultsSubtitle.textContent = subtitleParts.join(' • ');

  const max = Math.max(1, ...OPTIONS.map(o => state.counts[o.id] || 0));
  const barsHtml = OPTIONS.map(opt => {
    const count = state.counts[opt.id] || 0;
    const pctOfMax = Math.round((count / max) * 100);
    const isMine = myOptionId === opt.id;
    const fillClass = isMine ? 'bar-fill is-mine' : 'bar-fill';

    return `
      <div class="bar">
        <div class="bar-row">
          <div>
            <div class="bar-title">${escapeHtml(opt.title)}</div>
            <div class="bar-meta">${escapeHtml(opt.label)}</div>
          </div>
          <div class="bar-meta">${count} voto${count === 1 ? '' : 's'}</div>
        </div>
        <div class="${fillClass}" style="width: ${pctOfMax}%" aria-hidden="true"></div>
      </div>
    `.trim();
  }).join('');

  resultsList.innerHTML = barsHtml;
  renderSuggestions(state);
}

function syncFormWithState(state) {
  const myOptionId = state.my_vote ? state.my_vote.option_id : null;
  if (!myOptionId) {
    changeBtn.hidden = true;
    voteBtn.hidden = false;
    return;
  }

  const radio = pollForm.querySelector(`input[name="vote"][value="${myOptionId}"]`);
  if (radio) radio.checked = true;

  if (myOptionId === 'opt4') {
    suggestionWrap.hidden = false;
    suggestionInput.value = state.my_vote && state.my_vote.suggestion
      ? state.my_vote.suggestion
      : '';
  } else {
    suggestionWrap.hidden = true;
    suggestionInput.value = '';
  }

  changeBtn.hidden = false;
  voteBtn.hidden = true;
}

function validateVote(optionId) {
  if (!optionId) {
    return { ok: false, message: 'Selecione uma opção para votar.' };
  }

  if (optionId === 'opt4') {
    const suggestion = getSuggestionValue();
    if (suggestion.length < 3) {
      return { ok: false, message: 'Escreva uma sugestão (mínimo de 3 caracteres).' };
    }
  }

  return { ok: true, message: '' };
}

function applyVote(state, optionId, suggestion) {
  const previous = state.my_vote ? state.my_vote.option_id : null;
  if (previous && state.counts[previous] > 0) {
    state.counts[previous] -= 1;
  }

  state.counts[optionId] = (state.counts[optionId] || 0) + 1;
  state.my_vote = {
    option_id: optionId,
    suggestion: suggestion || '',
    voted_at: nowIso()
  };

  if (optionId === 'opt4' && suggestion) {
    state.suggestions = Array.isArray(state.suggestions) ? state.suggestions : [];
    state.suggestions.push({ text: suggestion, at: state.my_vote.voted_at });
    state.suggestions = state.suggestions.slice(-25);
  }

  return state;
}

function enableVotingMode() {
  voteBtn.hidden = false;
  changeBtn.hidden = true;
  setStatus('Você pode alterar a seleção e confirmar de novo.');
}

function init() {
  const state = loadState();
  renderResults(state);
  syncFormWithState(state);
  renderSuggestionVisibility();
  setStatus('');
}

pollForm.addEventListener('change', () => {
  renderSuggestionVisibility();
  setStatus('');
});

pollForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const optionId = getSelectedOptionId();
  const validation = validateVote(optionId);
  if (!validation.ok) {
    setStatus(validation.message);
    return;
  }

  const suggestion = optionId === 'opt4' ? getSuggestionValue() : '';
  const state = loadState();
  applyVote(state, optionId, suggestion);
  saveState(state);

  const opt = getOptionById(optionId);
  setStatus(`Voto confirmado: ${opt ? opt.title : optionId}.`);
  renderResults(state);
  syncFormWithState(state);
});

changeBtn.addEventListener('click', () => {
  enableVotingMode();
});

resetBtn.addEventListener('click', () => {
  const ok = window.confirm(
    'Isso apaga o voto, contagens e sugestões salvos neste navegador. Confirmar?'
  );
  if (!ok) return;
  localStorage.removeItem(STORAGE_KEY);
  suggestionInput.value = '';
  pollForm.reset();
  init();
  setStatus('Dados apagados neste navegador.');
});

init();

