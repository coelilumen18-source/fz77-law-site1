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

// ✅ СИСТЕМА ТЕСТОВ ВОХР — ПОЛНОСТЬЮ ИСПРАВЛЕНА!
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
    
    try {
        contentArea.innerHTML = '<p>Загрузка вопросов...</p>';
        const response = await fetch(`questions/${currentQuiz}.json`);
        
        if (!response.ok) {
            throw new Error(`Файл questions/${currentQuiz}.json не найден (код: ${response.status})`);
        }
        fetch('questions/legal.json').then(r=>r.text()).then(t=>console.log('✅ JSON OK:', t.substring(0,200)))

        quizData = await response.json();
        
        // Случайный выбор для экзамена/марафона
        if (currentQuiz === 'exam' || currentQuiz === 'marathon') {
            const shuffled = [...quizData].sort(() => Math.random() - 0.5);
            quizData = shuffled.slice(0, count);
        }
        
        console.log(`✅ Загружено ${quizData.length} вопросов для ${currentQuiz}`);
        
    } catch(e) {
        console.error(`❌ Ошибка загрузки questions/${currentQuiz}.json:`, e);
        contentArea.innerHTML = `
            <div style="text-align:center;padding:2rem;background:#fee;color:#dc2626;border-radius:12px;">
                <h3>❌ Файл questions/${currentQuiz}.json не найден</h3>
                <p><strong>Проверьте:</strong></p>
                <ul style="text-align:left;max-width:400px;margin:1rem auto;">
                    <li>📁 Папка <code>questions/</code> в той же папке что <code>index.html</code></li>
                    <li>📄 Файл <code>${currentQuiz}.json</code> существует</li>
                    <li>✅ JSON валидный (проверьте в <a href="https://jsonlint.com/" target="_blank">jsonlint.com</a>)</li>
                </ul>
                <button onclick="location.reload()" style="padding:1rem 2rem;background:#3b82f6;color:white;border:none;border-radius:8px;font-size:1.1rem;cursor:pointer;">
                    ← Назад к тестам
                </button>
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
        <div class="quiz-container" style="max-width:700px;margin:0 auto;padding:2rem;">
            <div class="progress-bar" style="height:8px;background:#e5e7eb;border-radius:4px;overflow:hidden;margin-bottom:2rem;">
                <div class="progress-fill" style="height:100%;background:linear-gradient(90deg,#10b981,#059669);border-radius:4px;transition:width 0.3s ease;width:${progress}%"></div>
            </div>
            <div class="quiz-question" style="font-size:1.3rem;line-height:1.6;margin-bottom:2rem;padding:1.5rem;background:#f9fafb;border-radius:12px;border-left:4px solid #3b82f6;">
                ${quizData[currentQuestion].question}
            </div>
            <div id="quiz-options" class="quiz-options" style="margin-bottom:1.5rem;"></div>
            <button id="next-btn" class="next-btn" style="display:none;width:100%;padding:1rem;font-size:1.1rem;background:#3b82f6;color:white;border:none;border-radius:12px;cursor:pointer;font-weight:500;transition:background 0.2s;">
                Далее →
            </button>
        </div>
    `;
    
    const optionsContainer = document.getElementById('quiz-options');
    quizData[currentQuestion].options.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = option;
        btn.style.cssText = `
            width:100%; padding:1.2rem; margin-bottom:1rem; text-align:left;
            background:#fff; border:2px solid #e5e7eb; border-radius:12px;
            cursor:pointer; font-size:1rem; transition:all 0.2s;
            box-shadow:0 2px 4px rgba(0,0,0,0.05);
        `;
        btn.onclick = () => selectOption(index, btn);
        optionsContainer.appendChild(btn);
    });
    
    document.getElementById('next-btn').onclick = nextQuestion;
}

function selectOption(index, btn) {
    document.querySelectorAll('.option-btn').forEach(b => {
        b.classList.remove('selected', 'correct', 'wrong');
        b.style.transform = 'none';
        b.style.borderColor = '#e5e7eb';
        b.style.background = '#fff';
    });
    
    btn.classList.add('selected');
    btn.style.transform = 'translateY(-2px)';
    btn.style.borderColor = '#3b82f6';
    btn.style.background = '#eff6ff';
    btn.style.boxShadow = '0 4px 12px rgba(59,130,246,0.15)';
    
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
    const color = percent >= 80 ? '#10b981' : percent >= 60 ? '#f59e0b' : '#ef4444';
    
    contentArea.innerHTML = `
        <div class="quiz-results" style="text-align:center;max-width:500px;margin:0 auto;padding:3rem;">
            <h2 style="font-size:2rem;margin-bottom:1rem;">✅ Результаты: ${currentQuiz.toUpperCase()}</h2>
            <div style="font-size:5rem;font-weight:700;margin:2rem 0;color:${color};text-shadow:0 4px 8px rgba(0,0,0,0.1);">
                ${percent}%
            </div>
            <p style="font-size:1.4rem;margin:1rem 0;color:#6b7280;">
                ${correctCount} из ${quizData.length} правильных
            </p>
            <div style="margin:2rem 0;">
                <button onclick="startQuiz()" style="padding:1.2rem 2.5rem;background:${color};color:white;border:none;border-radius:12px;font-size:1.2rem;cursor:pointer;margin:0.5rem;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,0.15);transition:all 0.2s;">
                    🔄 Повторить тест
                </button>
                <br><br>
                <button onclick="location.reload()" style="padding:1.2rem 2.5rem;background:#6b7280;color:white;border:none;border-radius:12px;font-size:1.2rem;cursor:pointer;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,0.15);">
                    ← Выбрать другой тест
                </button>
            </div>
            <p style="font-size:0.9rem;color:#9ca3af;margin-top:2rem;">
                Проходной балл: 80%
            </p>
        </div>
    `;
}

// Инициализация
initAccordions();
document.addEventListener('DOMContentLoaded', () => {
    initTests();
    console.log('✅ Тесты ВОХР инициализированы!');
});
