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
