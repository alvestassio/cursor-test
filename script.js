// Referências aos elementos do DOM
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const todoList = document.getElementById('todoList');
const emptyState = document.getElementById('emptyState');
const totalTasksSpan = document.getElementById('totalTasks');
const completedTasksSpan = document.getElementById('completedTasks');

// Chave para o localStorage
const STORAGE_KEY = 'todoTasks';

// Array para armazenar as tarefas
let tasks = [];

// Formatador de data/hora
const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
});

// Normalizar estrutura das tarefas existentes
function normalizeTask(task) {
    const fallbackDate = new Date(task.id).toISOString();
    return {
        ...task,
        createdAt: task.createdAt || fallbackDate,
        completedAt: task.completed ? (task.completedAt || fallbackDate) : null
    };
}

// Formatar data/hora para exibição
function formatDateTime(dateString) {
    if (!dateString) {
        return 'pendente';
    }

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
        return 'pendente';
    }

    return dateTimeFormatter.format(date);
}

// Carregar tarefas do localStorage ao iniciar
function loadTasks() {
    const storedTasks = localStorage.getItem(STORAGE_KEY);
    if (storedTasks) {
        tasks = JSON.parse(storedTasks).map(normalizeTask);
        renderTasks();
    } else {
        showEmptyState();
    }
}

// Salvar tarefas no localStorage
function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    updateStats();
}

// Adicionar nova tarefa
function addTask() {
    const taskText = taskInput.value.trim();
    
    if (taskText === '') {
        taskInput.focus();
        return;
    }

    const timestamp = new Date().toISOString();
    const newTask = {
        id: Date.now(),
        text: taskText,
        completed: false,
        createdAt: timestamp,
        completedAt: null
    };

    tasks.push(newTask);
    saveTasks();
    renderTasks();
    
    // Limpar input e focar novamente
    taskInput.value = '';
    taskInput.focus();
}

// Alternar status de conclusão da tarefa
function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        const isCompleted = !task.completed;
        task.completed = isCompleted;
        task.completedAt = isCompleted ? new Date().toISOString() : null;
        saveTasks();
        renderTasks();
    }
}

// Excluir tarefa
function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
}

// Renderizar lista de tarefas
function renderTasks() {
    todoList.innerHTML = '';
    
    if (tasks.length === 0) {
        showEmptyState();
        return;
    }

    hideEmptyState();

    tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `todo-item ${task.completed ? 'completed' : ''}`;
        
        // Checkbox
        const checkbox = document.createElement('div');
        checkbox.className = `todo-checkbox ${task.completed ? 'checked' : ''}`;
        checkbox.addEventListener('click', () => toggleTask(task.id));
        
        // Conteúdo da tarefa
        const content = document.createElement('div');
        content.className = 'todo-content';

        const text = document.createElement('span');
        text.className = 'todo-text';
        text.textContent = task.text;

        const times = document.createElement('div');
        times.className = 'todo-times';

        const startTime = document.createElement('span');
        startTime.className = 'todo-time';
        startTime.textContent = `Início: ${formatDateTime(task.createdAt)}`;

        const endTime = document.createElement('span');
        endTime.className = 'todo-time';
        endTime.textContent = `Fim: ${task.completedAt ? formatDateTime(task.completedAt) : 'pendente'}`;

        times.appendChild(startTime);
        times.appendChild(endTime);

        content.appendChild(text);
        content.appendChild(times);
        
        // Botão de excluir
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.setAttribute('aria-label', 'Excluir tarefa');
        deleteBtn.addEventListener('click', () => deleteTask(task.id));
        
        li.appendChild(checkbox);
        li.appendChild(content);
        li.appendChild(deleteBtn);
        
        todoList.appendChild(li);
    });
}

// Mostrar estado vazio
function showEmptyState() {
    emptyState.classList.add('show');
    todoList.style.display = 'none';
}

// Ocultar estado vazio
function hideEmptyState() {
    emptyState.classList.remove('show');
    todoList.style.display = 'flex';
}

// Atualizar estatísticas
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    
    totalTasksSpan.textContent = `${total} ${total === 1 ? 'tarefa' : 'tarefas'}`;
    completedTasksSpan.textContent = `${completed} ${completed === 1 ? 'concluída' : 'concluídas'}`;
}

// Event listeners
addTaskBtn.addEventListener('click', addTask);

taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

// Inicializar aplicação
loadTasks();
updateStats();

