const root = document.documentElement;
const toggle = document.querySelector('.theme-toggle');
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav-links');

const savedTheme = localStorage.getItem('bms-theme') || 'light';
root.dataset.theme = savedTheme;
if (toggle) toggle.textContent = savedTheme === 'dark' ? 'Light' : 'Dark';

toggle?.addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  localStorage.setItem('bms-theme', next);
  toggle.textContent = next === 'dark' ? 'Light' : 'Dark';
});

menuButton?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
});

window.addEventListener(
  'pointermove',
  (event) => {
    root.style.setProperty('--cursor-x', `${event.clientX}px`);
    root.style.setProperty('--cursor-y', `${event.clientY}px`);
  },
  { passive: true }
);
