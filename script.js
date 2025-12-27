// Темная/светлая тема
const toggle = document.getElementById('theme-toggle');
const html = document.documentElement;
toggle.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    html.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
    toggle.textContent = current === 'dark' ? '☀️' : '🌙';
});

// Аккордеон: открытие/закрытие по клику и на заголовок, и на текст
document.querySelectorAll('.accordion').forEach(accordion => {
    const header = accordion.querySelector('.accordion-header');
    const content = accordion.querySelector('.accordion-content');

    // клик по заголовку
    header.addEventListener('click', () => {
        accordion.classList.toggle('active');
    });

    // клик по тексту статьи
    content.addEventListener('click', () => {
        accordion.classList.toggle('active');
    });
});
