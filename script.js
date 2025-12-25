// Темная/светлая тема
const toggle = document.getElementById('theme-toggle');
const html = document.documentElement;
toggle.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    html.setAttribute('data-theme', current === 'dark' ? 'light' : 'dark');
    toggle.textContent = current === 'dark' ? '☀️' : '🌙';
});

// Аккордеон
document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
        const accordion = header.parentElement;
        accordion.classList.toggle('active');
    });
});

// Telegram Mini App интеграция (открытие по кнопке)
document.querySelector('.tg-mini-btn').addEventListener('click', (e) => {
    // Замените your_bot на вашего бота
    if (window.Telegram?.WebApp) {
        Telegram.WebApp.openTelegramLink('https://t.me/fz77law_bot/app?startapp=fz77');
    }
});
