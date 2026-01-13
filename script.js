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
        initTests();
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

// 🔥 НОВАЯ СИСТЕМА ТЕСТОВ С ПРОВЕРОЙ + ШКАЛОЙ!
let quizData = [], currentQuiz = null, currentQuestion = 0, userAnswers = [], correctCount = 0;

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
        
        if (!response.ok) throw new Error(`Файл questions/${currentQuiz}.json не найден (код: ${response.status})`);
        
        quizData = await response.json();
        
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
                    <li>📁 Папка <code>questions/</code> рядом с <code>index.html</code></li>
                    <li>📄 Файл <code>${currentQuiz}.json</code> существует</li>
                </ul>
                <button onclick="location.reload()" style="padding:1rem 2rem;background:#3b82f6;color:white;border:none;border-radius:8px;font-size:1.1rem;">← Назад</button>
            </div>
        `;
        return;
    }
    
    currentQuestion = 0;
    userAnswers = new Array(quizData.length).fill(null);
    correctCount = 0;
    showQuizQuestion();
}

function showQuizQuestion() {
    const progress = ((currentQuestion + 1) / quizData.length) * 100;
    const currentCorrect = correctCount;
    
    contentArea.innerHTML = `
        <div class="quiz-container" style="max-width:700px;margin:0 auto;padding:2rem;">
            <!-- 🔥 ШКАЛА ПРАВИЛЬНЫХ ОТВЕТОВ -->
            <div class="score-panel" style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem;padding:1rem;background:#f8fafc;border-radius:12px;border:2px solid #e2e8f0;">
                <div style="font-size:2rem;font-weight:700;color:#10b981;">${currentCorrect}/${currentQuestion + 1}</div>
                <div style="flex:1;height:8px;background:#e2e8f0;border-radius:4px;overflow:hidden;">
                    <div style="height:100%;background:#10b981;border-radius:4px;width:${(currentCorrect/(currentQuestion+1))*100}%;transition:width 0.4s ease;"></div>
                </div>
            </div>
            
            <!-- ПРОГРЕСС ВСЕГО ТЕСТА -->
            <div class="progress-bar" style="height:6px;background:#e5e7eb;border-radius:4px;overflow:hidden;margin-bottom:2rem;">
                <div class="progress-fill" style="height:100%;background:linear-gradient(90deg,#3b82f6,#1d4ed8);border-radius:4px;width:${progress}%"></div>
            </div>
            
            <div class="quiz-question" style="font-size:1.3rem;line-height:1.6;margin-bottom:2rem;padding:1.5rem;background:#f9fafb;border-radius:12px;border-left:5px solid #3b82f6;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
                <strong>Вопрос ${currentQuestion + 1}/${quizData.length}:</strong><br>
                ${quizData[currentQuestion].question}
            </div>
            
            <div id="quiz-options" class="quiz-options"></div>
        </div>
    `;
    
    const optionsContainer = document.getElementById('quiz-options');
    quizData[currentQuestion].options.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = option;
        btn.dataset.index = index;
        btn.onclick = () => selectOption(index, btn);
        optionsContainer.appendChild(btn);
    });
}

function selectOption(selectedIndex, clickedBtn) {
    // Показываем правильный ответ
    const correctIndex = quizData[currentQuestion].correct;
    
    document.querySelectorAll('.option-btn').forEach((btn, index) => {
        btn.disabled = true;
        btn.style.cursor = 'not-allowed';
        
        if (index === correctIndex) {
            // ✅ ПРАВИЛЬНЫЙ ЗЕЛЁНЫЙ
            btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            btn.style.color = 'white';
            btn.style.border = '3px solid #10b981';
            btn.style.boxShadow = '0 6px 20px rgba(16,185,129,0.4)';
            btn.innerHTML += ' <span style="font-size:0.9em;">✅ ПРАВИЛЬНО</span>';
        } else if (index === selectedIndex && index !== correctIndex) {
            // ❌ НЕПРАВИЛЬНЫЙ КРАСНЫЙ
            btn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
            btn.style.color = 'white';
            btn.style.border = '3px solid #ef4444';
            btn.style.boxShadow = '0 6px 20px rgba(239,68,68,0.4)';
            btn.innerHTML += ' <span style="font-size:0.9em;">❌ НЕПРАВИЛЬНО</span>';
        } else {
            btn.style.opacity = '0.5';
        }
    });
    
    // Обновляем счёт
    if (selectedIndex === correctIndex) {
        correctCount++;
    }
    userAnswers[currentQuestion] = selectedIndex;
    
    // Показываем кнопку "Далее" через 1.5 сек
    setTimeout(() => {
        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = `Далее → (Вопрос ${currentQuestion + 2}/${quizData.length})`;
        nextBtn.style.cssText = `
            width:100%; padding:1.2rem; margin-top:1.5rem; font-size:1.1rem;
            background:linear-gradient(135deg, #3b82f6, #1d4ed8); color:white;
            border:none; border-radius:12px; cursor:pointer; font-weight:500;
            box-shadow:0 6px 20px rgba(59,130,246,0.3); transition:all 0.2s;
        `;
        nextBtn.onmouseover = () => nextBtn.style.transform = 'translateY(-2px)';
        nextBtn.onmouseout = () => nextBtn.style.transform = 'none';
        nextBtn.onclick = nextQuestion;
        contentArea.appendChild(nextBtn);
    }, 1500);
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
    const percent = Math.round((correctCount / quizData.length) * 100);
    const color = percent >= 80 ? '#10b981' : percent >= 60 ? '#f59e0b' : '#ef4444';
    
    contentArea.innerHTML = `
        <div class="quiz-results" style="text-align:center;max-width:500px;margin:0 auto;padding:3rem;background:linear-gradient(135deg, #f8fafc, #e2e8f0);border-radius:20px;box-shadow:0 20px 40px rgba(0,0,0,0.1);">
            <h2 style="font-size:2.2rem;margin-bottom:1.5rem;background:linear-gradient(135deg, ${color}, ${color});-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:800;">
                Результаты: ${currentQuiz.toUpperCase()}
            </h2>
            <div style="font-size:6rem;font-weight:900;margin:2rem 0;color:${color};text-shadow:0 8px 24px rgba(0,0,0,0.2);">
                ${percent}%
            </div>
            <div style="font-size:1.6rem;margin:1.5rem 0;color:#374151;font-weight:600;">
                ${correctCount} из ${quizData.length} правильных
            </div>
            <div style="margin:2.5rem 0;">
                <button onclick="startQuiz()" style="padding:1.3rem 3rem;background:linear-gradient(135deg, ${color}, ${color});color:white;border:none;border-radius:16px;font-size:1.3rem;cursor:pointer;margin:0.5rem;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,0.2);transition:all 0.3s;">
                    🔄 Повторить тест
                </button>
                <br><br>
                <button onclick="location.reload()" style="padding:1.3rem 3rem;background:linear-gradient(135deg, #6b7280, #4b5563);color:white;border:none;border-radius:16px;font-size:1.3rem;cursor:pointer;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,0.2);">
                    🎯 Новый тест
                </button>
            </div>
            <div style="font-size:1rem;color:#6b7280;padding:1.5rem;background:#f1f5f9;border-radius:12px;">
                📊 Проходной балл: <strong>80%</strong> | Твой результат: <strong style="color:${color}">${percent}%</strong>
            </div>
        </div>
    `;
}

// Инициализация
initAccordions();
document.addEventListener('DOMContentLoaded', () => {
    initTests();
    console.log('✅ Тесты ВОХР с проверкой ответов готовы!');
});
