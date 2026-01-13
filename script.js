// 🔥 ТЕСТЫ ВОХР Pro — Сохранение + Работа над ошибками + История
// Автор: Perplexity AI для coelilumen18-source

// Утилиты
function debounce(fn, ms) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), ms);
    };
}

// 🔥 localStorage API
const STORAGE = {
    getResults() { return JSON.parse(localStorage.getItem('vohr_results') || '[]'); },
    saveResult(quiz, score, total, date) {
        const results = this.getResults();
        results.unshift({quiz, score, total, percent: Math.round(score/total*100), date});
        localStorage.setItem('vohr_results', JSON.stringify(results.slice(0, 50)));
    },
    getMistakes(quiz) { 
        return JSON.parse(localStorage.getItem(`vohr_mistakes_${quiz}`) || '[]'); 
    },
    addMistake(quiz, questionIndex) {
        const mistakes = this.getMistakes(quiz);
        if (!mistakes.includes(questionIndex)) {
            mistakes.push(questionIndex);
            localStorage.setItem(`vohr_mistakes_${quiz}`, JSON.stringify(mistakes));
        }
    },
    clearResults() { localStorage.removeItem('vohr_results'); },
    clearMistakes(quiz) { localStorage.removeItem(`vohr_mistakes_${quiz}`); },
    clearAll() {
        this.clearResults();
        ['exam','marathon','legal','tactical','firstaid','special','fire'].forEach(q => this.clearMistakes(q));
    },
    updateMistakesButtons() {
        document.querySelectorAll('.mistakes-btn').forEach(btn => {
            const quiz = btn.dataset.quiz;
            const count = STORAGE.getMistakes(quiz).length;
            btn.innerHTML = `${btn.dataset.name || quiz.toUpperCase()} (Ошибок: ${count})`;
            btn.style.display = count > 0 ? 'inline-block' : 'none';
        });
    }
};

// Темная тема
const themeToggle = document.getElementById('theme-toggle');
const rootHtml = document.documentElement;
if (themeToggle) {
    const savedTheme = localStorage.getItem('theme') || 'light';
    rootHtml.setAttribute('data-theme', savedTheme);
    themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    
    themeToggle.addEventListener('click', () => {
        const current = rootHtml.getAttribute('data-theme');
        const newTheme = current === 'dark' ? 'light' : 'dark';
        rootHtml.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    });
}

// Подгрузка контента
const contentArea = document.getElementById('content-area');
const navButtons = document.querySelectorAll('.main-nav button');
let currentPage = null;

const debouncedLoadPage = debounce(async (url) => {
    if (!contentArea) return;
    if (currentPage === url) {
        showResultsHistory();
        return;
    }
    try {
        contentArea.innerHTML = '<div style="text-align:center;padding:3rem;"><div class="loading">⏳ Загрузка...</div></div>';
        const resp = await fetch(url);
        if (!resp.ok) throw new Error('404');
        contentArea.innerHTML = await resp.text();
        currentPage = url;
        initAccordions();
        initTests();
        STORAGE.updateMistakesButtons();
        contentArea.scrollIntoView({behavior: 'smooth'});
    } catch (e) {
        contentArea.innerHTML = '<div style="text-align:center;padding:3rem;color:#ef4444;">Ошибка загрузки. F12 → Console</div>';
    }
}, 300);

navButtons.forEach(btn => btn.addEventListener('click', (e) => {
    e.preventDefault();
    const url = btn.getAttribute('data-page');
    if (url) debouncedLoadPage(url);
}));

// Аккордеон
function initAccordions() {
    document.querySelectorAll('.accordion').forEach(accordion => {
        const header = accordion.querySelector('.accordion-header');
        const content = accordion.querySelector('.accordion-content');
        if (!header || !content) return;
        const toggle = () => {
            const isActive = accordion.classList.contains('active');
            document.querySelectorAll('.accordion').forEach(a => a.classList.remove('active'));
            if (!isActive) accordion.classList.add('active');
        };
        header.onclick = content.onclick = toggle;
    });
}

// 🔥 ОСНОВНАЯ ЛОГИКА ТЕСТОВ
let quizData = [], currentQuiz = null, currentQuestion = 0, userAnswers = [], correctCount = 0, isMistakesMode = false;

function initTests() {
    // Обычные тесты
    document.querySelectorAll('.test-btn:not(.mistakes-btn)').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation();
            currentQuiz = btn.dataset.test;
            isMistakesMode = false;
            startQuiz();
        });
    });
    
    // Работа над ошибками
    document.querySelectorAll('.mistakes-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault(); e.stopPropagation();
            currentQuiz = btn.dataset.quiz;
            isMistakesMode = true;
            startQuiz();
        });
    });
}

async function startQuiz() {
    const counts = {exam: 10, marathon: 50, legal: 80, tactical: 10, firstaid: 41, special: 20, fire: 84};
    const count = counts[currentQuiz] || 10;
    
    try {
        contentArea.innerHTML = '<div style="text-align:center;padding:4rem;"><div style="font-size:3rem;">⏳ Загрузка вопросов</div></div>';
        
        const response = await fetch(`questions/${currentQuiz}.json`);
        if (!response.ok) throw new Error(`404: questions/${currentQuiz}.json`);
        
        let data = await response.json();
        
        if (isMistakesMode) {
            const mistakes = STORAGE.getMistakes(currentQuiz);
            if (mistakes.length === 0) {
                contentArea.innerHTML = `
                    <div style="text-align:center;padding:4rem;background:linear-gradient(135deg,#10b981,#059669);color:white;border-radius:24px;">
                        <div style="font-size:4rem;margin-bottom:1rem;">🎉</div>
                        <h2 style="font-size:2.5rem;margin-bottom:1rem;">Ошибок нет!</h2>
                        <p style="font-size:1.3rem;">Все вопросы решены правильно!</p>
                        <button onclick="location.reload()" style="padding:1.2rem 3rem;background:rgba(255,255,255,0.2);color:white;border:2px solid white;border-radius:12px;font-size:1.1rem;margin-top:2rem;">← Главное меню</button>
                    </div>
                `;
                return;
            }
            quizData = mistakes.map(i => data[i]);
            contentArea.innerHTML += `<div style="text-align:center;color:#ef4444;font-size:1.2rem;margin:1rem 0;">🚨 Работа над ошибками: ${quizData.length} вопросов</div>`;
        } else if (currentQuiz === 'exam' || currentQuiz === 'marathon') {
            const shuffled = [...data].sort(() => Math.random() - 0.5);
            quizData = shuffled.slice(0, count);
        } else {
            quizData = data;
        }
        
    } catch(e) {
        contentArea.innerHTML = `
            <div style="text-align:center;padding:4rem;color:#ef4444;">
                <h3>❌ questions/${currentQuiz}.json не найден</h3>
                <p>Проверьте структуру папок:</p>
                <code style="background:#f3f4f6;padding:1rem;display:block;margin:1rem 0;border-radius:8px;">
📁 index.html<br/>
└── 📁 questions/<br/>
    └── 📄 ${currentQuiz}.json
                </code>
                <button onclick="location.reload()" style="padding:1rem 2rem;background:#3b82f6;color:white;border:none;border-radius:8px;">← Назад</button>
            </div>
        `;
        return;
    }
    
    currentQuestion = 0; userAnswers = new Array(quizData.length).fill(null); correctCount = 0;
    showQuizQuestion();
}

function showQuizQuestion() {
    const progress = ((currentQuestion + 1) / quizData.length) * 100;
    contentArea.innerHTML = `
        <style>
            .quiz-container {max-width:750px;margin:0 auto;padding:2rem;}
            .score-panel {display:flex;align-items:center;gap:1.5rem;margin-bottom:2rem;padding:1.5rem;background:linear-gradient(135deg,#f8fafc,#e2e8f0);border-radius:16px;border:2px solid #e2e8f0;box-shadow:0 4px 20px rgba(0,0,0,0.08);}
            .progress-bar {height:8px;background:#e5e7eb;border-radius:6px;overflow:hidden;margin-bottom:2rem;}
            .quiz-question {font-size:1.3rem;line-height:1.7;margin-bottom:2rem;padding:2rem;background:#f9fafb;border-radius:16px;border-left:6px solid #3b82f6;box-shadow:0 6px 20px rgba(0,0,0,0.08);}
            .option-btn {width:100%;padding:1.5rem;margin-bottom:1rem;text-align:left;background:#fff;border:2px solid #e5e7eb;border-radius:12px;cursor:pointer;font-size:1.1rem;transition:all 0.4s;box-shadow:0 3px 12px rgba(0,0,0,0.08);}
            .option-btn:hover {transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,0.12);}
        </style>
        <div class="quiz-container">
            <!-- ШКАЛА ПРАВИЛЬНЫХ -->
            <div class="score-panel">
                <div style="font-size:2.5rem;font-weight:800;color:#10b981;">${correctCount}/${currentQuestion + 1}</div>
                <div style="flex:1;height:12px;background:#e2e8f0;border-radius:8px;overflow:hidden;">
                    <div style="height:100%;background:linear-gradient(90deg,#10b981,#059669);border-radius:8px;width:${(correctCount/(currentQuestion+1))*100}%"></div>
                </div>
                <span style="font-size:1.2rem;font-weight:600;color:#374151;">${isMistakesMode ? '🚨 Ошибки' : '📝 Тест'}</span>
            </div>
            
            <!-- ПРОГРЕСС -->
            <div class="progress-bar">
                <div style="height:100%;background:linear-gradient(90deg,#3b82f6,#1d4ed8);border-radius:6px;width:${progress}%"></div>
            </div>
            
            <div class="quiz-question">
                <strong style="color:#1f2937;">Вопрос ${currentQuestion + 1}/${quizData.length}:</strong><br><br>
                ${quizData[currentQuestion].question}
            </div>
            
            <div id="quiz-options"></div>
        </div>
    `;
    
    const container = document.getElementById('quiz-options');
    quizData[currentQuestion].options.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = option;
        btn.dataset.index = index;
        btn.onclick = () => selectOption(index, btn);
        container.appendChild(btn);
    });
}

function selectOption(selectedIndex, clickedBtn) {
    const correctIndex = quizData[currentQuestion].correct;
    
    document.querySelectorAll('.option-btn').forEach((btn, index) => {
        btn.disabled = true;
        if (index === correctIndex) {
            btn.style.background = 'linear-gradient(135deg,#10b981,#059669)';
            btn.style.color = 'white';
            btn.style.border = '3px solid #10b981';
            btn.innerHTML += ' <span style="font-size:1rem;">✅ ПРАВИЛЬНО</span>';
        } else if (index === selectedIndex) {
            btn.style.background = 'linear-gradient(135deg,#ef4444,#dc2626)';
            btn.style.color = 'white';
            btn.style.border = '3px solid #ef4444';
            btn.innerHTML += ' <span style="font-size:1rem;">❌ НЕПРАВИЛЬНО</span>';
            STORAGE.addMistake(currentQuiz, currentQuestion); // 🔥 СОХРАНИМ ОШИБУ
        } else {
            btn.style.opacity = '0.5';
        }
    });
    
    if (selectedIndex === correctIndex) correctCount++;
    userAnswers[currentQuestion] = selectedIndex;
    
    setTimeout(() => {
        const nextBtn = document.createElement('button');
        nextBtn.innerHTML = `➡️ Продолжить (${currentQuestion + 2}/${quizData.length})`;
        nextBtn.style.cssText = `
            width:100%;padding:1.4rem;margin-top:2rem;font-size:1.2rem;
            background:linear-gradient(135deg,#10b981,#059669);color:white;
            border:none;border-radius:16px;cursor:pointer;font-weight:600;
            box-shadow:0 8px 25px rgba(16,185,129,0.3);
        `;
        nextBtn.onclick = nextQuestion;
        contentArea.appendChild(nextBtn);
    }, 2200);
}

function nextQuestion() {
    if (currentQuestion < quizData.length - 1) {
        currentQuestion++;
        showQuizQuestion();
    } else {
        STORAGE.saveResult(currentQuiz, correctCount, quizData.length, new Date().toLocaleString('ru-RU'));
        showResults();
    }
}

function showResults() {
    const percent = Math.round((correctCount / quizData.length) * 100);
    const color = percent >= 80 ? '#10b981' : percent >= 60 ? '#f59e0b' : '#ef4444';
    
    contentArea.innerHTML = `
        <style>.results-container{max-width:700px;margin:0 auto;padding:3rem;background:linear-gradient(135deg,#f8fafc,#e2e8f0);border-radius:24px;box-shadow:0 25px 50px rgba(0,0,0,0.15);}</style>
        <div class="results-container">
            <h2 style="font-size:2.8rem;text-align:center;margin-bottom:2rem;background:linear-gradient(135deg,${color},${color});-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-weight:900;">
                ${currentQuiz.toUpperCase()}
            </h2>
            <div style="font-size:8rem;font-weight:900;text-align:center;margin:2.5rem 0;color:${color};text-shadow:0 12px 35px rgba(0,0,0,0.25);">
                ${percent}%
            </div>
            <div style="font-size:2rem;text-align:center;margin:2rem 0;color:#374151;font-weight:700;">
                ${correctCount} из ${quizData.length}
            </div>
            
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1.5rem;margin:3rem 0;">
                <button onclick="startMistakesMode()" style="padding:1.5rem;background:linear-gradient(135deg,#ef4444,#dc2626);color:white;border:none;border-radius:16px;font-size:1.2rem;font-weight:700;box-shadow:0 10px 30px rgba(239,68,68,0.4);">
                    🚨 Ошибки (${STORAGE.getMistakes(currentQuiz).length})
                </button>
                <button onclick="startQuiz()" style="padding:1.5rem;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:white;border:none;border-radius:16px;font-size:1.2rem;font-weight:700;box-shadow:0 10px 30px rgba(59,130,246,0.4);">
                    🔄 Повторить
                </button>
                <button onclick="showResultsHistory()" style="padding:1.5rem;background:linear-gradient(135deg,#10b981,#059669);color:white;border:none;border-radius:16px;font-size:1.2rem;font-weight:700;box-shadow:0 10px 30px rgba(16,185,129,0.4);">
                    📊
                </button>
            </div>
            
            <div style="text-align:center;margin-top:3rem;padding:2rem;background:#f1f5f9;border-radius:20px;">
                <p style="font-size:1.1rem;color:#6b7280;margin-bottom:1rem;">💾 Результат сохранён автоматически</p>
                <button onclick="STORAGE.clearAll();alert('✅ Статистика сброшена!');location.reload();" style="padding:1rem 2rem;background:#ef4444;color:white;border:none;border-radius:12px;font-weight:600;">
                    🗑️ Очистить статистику
                </button>
            </div>
        </div>
    `;
}

function startMistakesMode() {
    isMistakesMode = true;
    startQuiz();
}

function showResultsHistory() {
    const results = STORAGE.getResults();
    contentArea.innerHTML = `
        <style>.history-item{display:flex;justify-content:space-between;padding:1.5rem;background:white;border-radius:12px;margin-bottom:1rem;box-shadow:0 4px 15px rgba(0,0,0,0.08);}</style>
        <div style="max-width:900px;margin:0 auto;padding:2rem;">
            <h2 style="text-align:center;font-size:2.5rem;margin-bottom:2.5rem;">📊 История тестов</h2>
            ${results.length ? results.map((r,i) => `
                <div class="history-item">
                    <div>
                        <div style="font-size:1.4rem;font-weight:700;">${r.quiz.toUpperCase()}</div>
                        <div style="color:#6b7280;">${r.date}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:3rem;font-weight:900;color:${r.percent>=80?'#10b981':'#ef4444'}">${r.percent}%</div>
                        <small style="color:#6b7280;">${r.score}/${r.total}</small>
                    </div>
                </div>
            `).join('') : `
                <div style="text-align:center;padding:4rem;color:#6b7280;">
                    <div style="font-size:4rem;margin-bottom:1rem;">📭</div>
                    <h3>Нет результатов</h3>
                    <p>Пройдите любой тест!</p>
                </div>
            `}
            <div style="text-align:center;margin-top:3rem;">
                <button onclick="STORAGE.clearAll();showResultsHistory();" style="padding:1.2rem 3rem;background:#ef4444;color:white;border:none;border-radius:16px;font-size:1.2rem;font-weight:700;box-shadow:0 8px 25px rgba(239,68,68,0.3);">
                    🗑️ Очистить всё
                </button>
            </div>
        </div>
    `;
}

// 🎯 ИНИЦИАЛИЗАЦИЯ
document.addEventListener('DOMContentLoaded', () => {
    initAccordions();
    initTests();
    STORAGE.updateMistakesButtons();
    console.log('🚀 ВОХР Pro готов! Сохранение + Ошибки + История');
});
