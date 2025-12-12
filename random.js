const generateBtn = document.getElementById('generateBtn');
const copyBtn = document.getElementById('copyBtn');
const randomText = document.getElementById('randomText');
const randomMeta = document.getElementById('randomMeta');

/**
 * Micro-desafios propositalmente curtos.
 * Mantido local (sem API) pra funcionar offline/GitHub Pages.
 */
const CHALLENGES = [
    { text: 'Escreva uma tarefa que você vem evitando e que dá pra iniciar em 2 minutos.', tag: 'clareza' },
    { text: 'Revise sua lista e delete 1 tarefa que não faz mais sentido.', tag: 'priorização' },
    { text: 'Pegue a tarefa mais fácil e conclua agora, sem perfeccionismo.', tag: 'impulso' },
    { text: 'Transforme uma tarefa grande em 3 passos pequenos e registre.', tag: 'quebra' },
    { text: 'Faça um “arrume a mesa”: organize 1 coisa ao seu redor por 60s.', tag: 'ambiente' },
    { text: 'Defina 1 tarefa “MIT” (mais importante) para hoje e destaque.', tag: 'foco' },
    { text: 'Programe um bloco de 10 minutos e trabalhe em uma tarefa sem distrações.', tag: 'execução' },
    { text: 'Escreva uma frase: “Hoje eu aceito progresso, não perfeição”.', tag: 'mindset' },
    { text: 'Escolha uma tarefa e defina o critério de “feito” em 1 linha.', tag: 'definição' },
    { text: 'Se uma tarefa está vaga, reescreva com verbo + resultado.', tag: 'clareza' }
];

function pickRandom(list) {
    const idx = Math.floor(Math.random() * list.length);
    return list[idx];
}

function formatNow() {
    return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short'
    }).format(new Date());
}

function generate() {
    const challenge = pickRandom(CHALLENGES);
    randomText.textContent = challenge.text;
    randomMeta.textContent = `Categoria: ${challenge.tag} • Gerado em: ${formatNow()}`;

    copyBtn.disabled = false;
    copyBtn.dataset.copyValue = challenge.text;
}

async function copyToClipboard() {
    const value = copyBtn.dataset.copyValue;
    if (!value) return;

    try {
        await navigator.clipboard.writeText(value);
        randomMeta.textContent = `${randomMeta.textContent} • Copiado!`;
    } catch {
        // Fallback simples: seleciona o texto para o usuário copiar manualmente.
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(randomText);
        selection.removeAllRanges();
        selection.addRange(range);
        randomMeta.textContent = `${randomMeta.textContent} • Selecionei o texto (copie manualmente)`;
    }
}

generateBtn.addEventListener('click', generate);
copyBtn.addEventListener('click', copyToClipboard);

// Primeiro desafio já na carga (boa UX)
generate();
