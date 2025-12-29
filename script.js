
const debouncedLoadPage = debounce(loadPage, 300);

// Замени navButtons.forEach на:
navButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const url = btn.getAttribute('data-page');
        if (url) debouncedLoadPage(url);
    });
// После navButtons.forEach добавь:
let quizData = {}; // Хранилище вопросов
let currentQuiz = null;
let currentQuestion = 0;
let userAnswers = [];

// Инициализация тестов
function initTests() {
    const testBtns = document.querySelectorAll('.test-btn');
    testBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const testType = btn.dataset.test;
            startQuiz(testType);
        });
    });
}

// Загрузка вопросов (ты закинешь JSON файлы)
async function loadQuizData(testType) {
    try {
        const response = await fetch(`questions/${testType}.json`);
        return await response.json();
    } catch {
        return generateDummyQuestions(10); // заглушки пока нет файла
    }
}

function startQuiz(testType) {
    currentQuiz = testType;
    loadQuizData(testType).then(questions => {
        quizData = questions;
        currentQuestion = 0;
        userAnswers = [];
        showQuestion();
    });
}

function showQuestion() {
    const container = document.querySelector('.content-area');
    container.innerHTML = `
        <div class="quiz-container">
            <div class="progress-bar">
                <div class="progress-fill" style="width: 0%"></div>
            </div>
            <div class="quiz-question">Вопрос ${currentQuestion + 1}/${quizData.length}</div>
            <div id="options-container"></div>
            <button class="next-btn" style="display:none; margin-top:2rem;">Далее</button>
        </div>
    `;
    
    const progressFill = container.querySelector('.progress-fill');
    progressFill.style.width = `${((currentQuestion + 1) / quizData.length) * 100}%`;
    
    const optionsContainer = container.querySelector('#options-container');
    quizData[currentQuestion].options.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = option;
        btn.onclick = () => selectOption(index, btn);
        optionsContainer.appendChild(btn);
    });
    
    const nextBtn = container.querySelector('.next-btn');
    nextBtn.onclick = nextQuestion;
}

function selectOption(index, btn) {
    document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    userAnswers[currentQuestion] = index;
    btn.parentNode.querySelector('.next-btn').style.display = 'block';
}

function nextQuestion() {
    if (currentQuestion < quizData.length - 1) {
        currentQuestion++;
        showQuestion();
    } else {
        showResults();
    }
}

// Вызови после загрузки любой страницы
document.addEventListener('DOMContentLoaded', initTests);

// Переключение темы
const themeToggle = document.getElementById('theme-toggle');
const rootHtml = document.documentElement;

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const current = rootHtml.getAttribute('data-theme');
        rootHtml.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
        themeToggle.textContent = current === 'dark' ? '☀️' : '🌙';
    });
}

// Подгрузка разделов во вкладку content-area
const contentArea = document.getElementById('content-area');
const navButtons = document.querySelectorAll('.main-nav button');

// будем хранить, какая страница сейчас открыта
let currentPage = null;
contentArea.scrollIntoView({behavior: 'smooth'});
async function loadPage(url) {
    if (!contentArea) return;

    // если кликаем по уже открытой странице — сворачиваем
    if (currentPage === url) {
        contentArea.innerHTML = '<p>Выберите раздел в меню выше, чтобы открыть закон или материал.</p>';
        currentPage = null;
        return;
    }

    try {
        contentArea.innerHTML = '<p>Загрузка...</p>';
        const resp = await fetch(url);
        const html = await resp.text();
        contentArea.innerHTML = html;
        currentPage = url;

        // после подгрузки навешиваем аккордеон на новые элементы
        initAccordions();
    } catch (e) {
        contentArea.innerHTML = '<p>Ошибка загрузки раздела.</p>';
        currentPage = null;
    }
}

navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const url = btn.getAttribute('data-page');
        if (url) loadPage(url);
    });
});

// Аккордеон: одна статья открыта, клик по заголовку или тексту
function initAccordions() {
    const accordions = document.querySelectorAll('.accordion');

    accordions.forEach(accordion => {
        const header = accordion.querySelector('.accordion-header');
        const content = accordion.querySelector('.accordion-content');
        if (!header || !content) return;

        function toggleAccordion() {
            const isActive = accordion.classList.contains('active');

            // закрываем все
            accordions.forEach(a => a.classList.remove('active'));

            // если текущая была закрыта — открываем
            if (!isActive) {
                accordion.classList.add('active');
            }
        }

        header.onclick = toggleAccordion;
        content.onclick = toggleAccordion;
    });
}

// если на стартовой когда‑нибудь будут аккордеоны
initAccordions();


// если на стартовой когда‑нибудь будут аккордеоны
initAccordions();
