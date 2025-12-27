// Темная/светлая тема
const toggle = document.getElementById('theme-toggle');
const html = document.documentElement;

toggle.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    html.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
    toggle.textContent = current === 'dark' ? '☀️' : '🌙';
});

// Аккордеон: одна статья открыта, клик по заголовку или тексту
const accordions = document.querySelectorAll('.accordion');

accordions.forEach(accordion => {
    const header = accordion.querySelector('.accordion-header');
    const content = accordion.querySelector('.accordion-content');

    function toggleAccordion() {
        const isActive = accordion.classList.contains('active');

        // сначала закрываем все остальные
        accordions.forEach(a => a.classList.remove('active'));

        // если текущая была закрыта — открываем её,
        // если была открыта — оставляем все закрытыми
        if (!isActive) {
            accordion.classList.add('active');
        }
    }

    // клик по заголовку
    header.addEventListener('click', toggleAccordion);

    // клик по тексту
    content.addEventListener('click', toggleAccordion);
});
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

async function loadPage(url) {
    if (!contentArea) return;
    try {
        contentArea.innerHTML = '<p>Загрузка...</p>';
        const resp = await fetch(url);
        const html = await resp.text();
        contentArea.innerHTML = html;

        // после подгрузки навешиваем аккордеон на новые элементы
        initAccordions();
    } catch (e) {
        contentArea.innerHTML = '<p>Ошибка загрузки раздела.</p>';
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
