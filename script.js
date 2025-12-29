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
        initTests(); // ✅ ИНИЦИАЛИЗАЦИЯ ТЕСТОВ ПОСЛЕ ЗАГРУЗКИ
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

// Система тестов ВОХР
let quizData = [], currentQuiz = null, currentQuestion = 0, userAnswers = [];

function initTests() {
    const testBtns = document.querySelectorAll('.test-btn');
    testBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            currentQuiz = btn.dataset.test;
            startQuiz();
        });
    });
}

async function startQuiz() {
    const counts = {
        exam: 10, marathon: 50, legal: 80, tactical: 10,
        firstaid: 41, special: 20, fire: 84
    };
    const count = counts[currentQuiz] || 10;
    
    // ✅ ЧИТАЕМ РЕАЛЬНЫЕ JSON ФАЙЛЫ
    try {
        contentArea.innerHTML = '<p>Загрузка вопросов...</p>';
        const response = await fetch(`questions/${currentQuiz}.json`);
        if (response.ok) {
            quizData = await response.json();
            
            // Случайный выбор для экзамена/марафона
            if (currentQuiz === 'exam' || currentQuiz === 'marathon') {
                const shuffled = [...quizData].sort(() => Math.random() - 0.5);
                quizData = shuffled.slice(0, count);
            }
        } else {
            throw new Error('JSON не найден');
        }
    } catch(e) {
        console.error(`Ошибка: questions/${currentQuiz}.json`, e);
        contentArea.innerHTML = `
            <div style="text-align:center;padding:2rem;">
                <h3>❌ Файл questions/${currentQuiz}.json не найден</h3>
                <p>Создайте файл с вопросами для теста "${currentQuiz}"</p>
                <button onclick="location.reload()" style="padding:1rem 2rem;background:var(--accent);color:white;border:none;border-radius:8px;">← Назад к тестам</button>
            </div>
        `;
        return;
    }
    
    currentQuestion = 0;
    userAnswers = new Array(quizData.length).fill(null);
    showQuizQuestion();
}

function showQuizQuestion() {
    const progress = ((currentQuestion + 1) / quizData.length) * 100;
    contentArea.innerHTML = `
        <div class="quiz-container">
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <div class="quiz-question">${quizData[currentQuestion].question}</div>
            <div id="quiz-options" class="quiz-options"></div>
            <button id="next-btn" class="next-btn" style="display:none;width:100%;margin-top:1rem;">Далее</button>
        </div>
    `;
    
    const optionsContainer = document.getElementById('quiz-options');
    quizData[currentQuestion].options.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = option;
        btn.onclick = () => selectOption(index, btn);
        optionsContainer.appendChild(btn);
    });
    
    document.getElementById('next-btn').onclick = nextQuestion;
}

function selectOption(index, btn) {
    document.querySelectorAll('.option-btn').forEach(b => {
        b.classList.remove('selected', 'correct', 'wrong');
        b.style.transform = 'none';
    });
    btn.classList.add('selected');
    userAnswers[currentQuestion] = index;
    document.getElementById('next-btn').style.display = 'block';
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
    const correctCount = userAnswers.reduce((acc, ans, i) => 
        ans === quizData[i].correct ? acc + 1 : acc, 0
    );
    const percent = Math.round((correctCount / quizData.length) * 100);
    
    contentArea.innerHTML = `
        <div class="quiz-results" style="text-align:center;max-width:500px;margin:0 auto;">
            <h2>✅ Результаты: ${currentQuiz.toUpperCase()}</h2>
            <div style="font-size:3.5rem;font-weight:700;margin:2rem 0;color:${percent>=80?'#10b981':'#ef4444'};">
                ${percent}%
            </div>
            <p style="font-size:1.2rem;margin:1rem 0;">
                ${correctCount} из ${quizData.length} правильных
            </p>
            <div style="margin:2rem 0;">
                <button onclick="startQuiz()" style="padding:1rem 2rem;background:var(--accent);color:white;border:none;border-radius:12px;font-size:1.1rem;cursor:pointer;margin:0.5rem;">
                    🔄 Повторить тест
                </button>
                <br>
                <button onclick="location.reload()" style="padding:1rem 2rem;background:#6b7280;color:white;border:none;border-radius:12px;font-size:1.1rem;cursor:pointer;margin-top:1rem;">
                    ← Новый тест
                </button>
            </div>
        </div>
    `;
}

// Инициализация
initAccordions();
document.addEventListener('DOMContentLoaded', initTests);
