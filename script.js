// Утилиты
function debounce(fn, ms) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), ms);
    };
}

// Переключение темы
const themeToggle = document.getElementById('theme-toggle');
const rootHtml = document.documentElement;

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const current = rootHtml.getAttribute('data-theme');
        const newTheme = current === 'dark' ? 'light' : 'dark';
        rootHtml.setAttribute('data-theme', newTheme);
        themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    });
}

// Подгрузка разделов
const contentArea = document.getElementById('content-area');
const navButtons = document.querySelectorAll('.main-nav button');
let currentPage = null;

const debouncedLoadPage = debounce(async (url) => {
    if (!contentArea) return;

    if (currentPage === url) {
        contentArea.innerHTML = '<p>Выберите раздел в меню выше, чтобы открыть закон или материал.</p>';
        currentPage = null;
        contentArea.scrollIntoView({behavior: 'smooth'});
        return;
    }

    try {
        contentArea.innerHTML = '<p>Загрузка...</p>';
        const resp = await fetch(url);
        if (!resp.ok) throw new Error('404');
        const html = await resp.text();
        contentArea.innerHTML = html;
        currentPage = url;
        initAccordions();
        contentArea.scrollIntoView({behavior: 'smooth'});
    } catch (e) {
        contentArea.innerHTML = '<p>Ошибка загрузки раздела. Проверьте Console (F12).</p>';
        currentPage = null;
    }
}, 300);

navButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const url = btn.getAttribute('data-page');
        if (url) debouncedLoadPage(url);
    });
});

// Аккордеон
function initAccordions() {
    const accordions = document.querySelectorAll('.accordion');
    accordions.forEach(accordion => {
        const header = accordion.querySelector('.accordion-header');
        const content = accordion.querySelector('.accordion-content');
        if (!header || !content) return;

        function toggleAccordion() {
            const isActive = accordion.classList.contains('active');
            accordions.forEach(a => a.classList.remove('active'));
            if (!isActive) accordion.classList.add('active');
        }

        header.onclick = toggleAccordion;
        content.onclick = toggleAccordion;
    });
}

// Инициализация стартовых аккордеонов
initAccordions();

// Система тестов ВОХР
let quizData = {}, currentQuiz = null, currentQuestion = 0, userAnswers = [];

function initTests() {
    const testBtns = document.querySelectorAll('.test-btn');
    testBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            currentQuiz = btn.dataset.test;
            startQuizDemo();
        });
    });
}

function startQuizDemo() {
    const counts = {
        exam: 10, marathon: 50, legal: 80, tactical: 10,
        firstaid: 41, special: 20, fire: 84
    };
    const count = counts[currentQuiz] || 20;
    
    quizData = Array.from({length: count}, (_, i) => ({
        question: `Вопрос ${i+1}/${count} (${currentQuiz.toUpperCase()})`,
        options: ['Вариант А', 'Вариант Б', 'Вариант В', 'Вариант Г'],
        correct: Math.floor(Math.random() * 4)
    }));
    
    currentQuestion = 0;
    userAnswers = [];
    showQuizQuestion();
}

function showQuizQuestion() {
    const container = document.getElementById('content-area');
    container.innerHTML = `
        <div class="quiz-container">
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${((currentQuestion + 1) / quizData.length) * 100}%"></div>
            </div>
            <div class="quiz-question">Вопрос ${currentQuestion + 1} из ${quizData.length}</div>
            <div id="quiz-options"></div>
            <button class="next-btn" style="display: none; width: 100%;">Далее</button>
        </div>
    `;
    
    const optionsContainer = document.getElementById('quiz-options');
    quizData[currentQuestion].options.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = option;
        btn.onclick = () => selectOption(index, btn);
        optionsContainer.appendChild(btn);
    });
    
    document.querySelector('.next-btn').onclick = nextQuestion;
}

function selectOption(index, btn) {
    document.querySelectorAll('.option-btn').forEach(b => {
        b.classList.remove('selected');
        b.style.transform = 'none';
    });
    btn.classList.add('selected');
    userAnswers[currentQuestion] = index;
    document.querySelector('.next-btn').style.display = 'block';
}

function nextQuestion() {
    if (currentQuestion < quizData.length - 1) {
        currentQuestion++;
        showQuizQuestion();
    } else {
        showResults();
    }
}

function showResults() {
    const correct = userAnswers.reduce((acc, ans, i) => acc + (ans === quizData[i].correct ? 1 : 0), 0);
    const percent = Math.round((correct / quizData.length) * 100);
    
    document.getElementById('content-area').innerHTML = `
        <div class="quiz-container" style="text-align: center;">
            <h2>Результаты теста ${currentQuiz.toUpperCase()}</h2>
            <div style="font-size: 3rem; margin: 2rem 0; color: ${percent >= 80 ? 'var(--accent)' : '#ef4444'};">
                ${percent}%
            </div>
            <p>${correct} из ${quizData.length} правильных</p>
            <button onclick="location.reload()" style="padding: 1rem 2rem; background: var(--accent); color: white; border: none; border-radius: 12px; font-size: 1.1rem; cursor: pointer; margin-top: 2rem;">
                Новый тест
            </button>
        </div>
    `;
}

// Инициализация тестов при загрузке tests.html
if (document.querySelector('.test-buttons')) {
    initTests();
}

// Глобальная инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.test-buttons')) initTests();
});
