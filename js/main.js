// ==========================
// Главный скрипт для search-vacancy
// ==========================

// конфиг Supabase (подставь свои)
const SUPABASE_URL = 'https://vhbiezamhpyejdqvvwuj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5...'; // твой ключ

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// состояние
let allVacancies = [];
let currentFilters = {
  projects: [],
  departments: []
};
let currentQuery = '';

// элементы DOM
const inputSearch = document.getElementById('vacancy-search');
const resultsContainer = document.getElementById('vacancy-results');
const projectFilterEl = document.getElementById('project-filter');
const deptFilterEl = document.getElementById('department-filter');
const resetAllBtn = document.getElementById('reset-all-filters');

// ==========================
// Загрузка данных
// ==========================
async function loadVacancies() {
  try {
    const { data, error } = await supabase
      .from('vacancies')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Ошибка Supabase:', error);
      resultsContainer.innerHTML = '<p>Не удалось загрузить вакансии</p>';
      return;
    }
    allVacancies = data;
    renderFilters();
    renderResults();
  } catch (e) {
    console.error('Ошибка загрузки:', e);
    resultsContainer.innerHTML = '<p>Ошибка при загрузке вакансий</p>';
  }
}

// ==========================
// Фильтры
// ==========================
function getAvailableProjects() {
  const counts = {};
  allVacancies.forEach(v => {
    const p = v.project || 'Без проекта';
    if (!counts[p]) counts[p] = 0;
    counts[p]++;
  });
  return counts;
}

function getAvailableDepartments() {
  const counts = {};
  allVacancies.forEach(v => {
    const d = v.department || 'Без отдела';
    if (!counts[d]) counts[d] = 0;
    counts[d]++;
  });
  return counts;
}

function renderFilters() {
  if (projectFilterEl) {
    const projects = getAvailableProjects();
    const dropdown = projectFilterEl.querySelector('.select-dropdown');
    dropdown.innerHTML = Object.entries(projects).map(([p, c]) => {
      return `<label><input type="checkbox" value="${p}"> ${p} (${c})</label>`;
    }).join('');
  }

  if (deptFilterEl) {
    const depts = getAvailableDepartments();
    const dropdown = deptFilterEl.querySelector('.select-dropdown');
    dropdown.innerHTML = Object.entries(depts).map(([d, c]) => {
      return `<label><input type="checkbox" value="${d}"> ${d} (${c})</label>`;
    }).join('');
  }
}

// ==========================
// Поиск и отрисовка
// ==========================
function renderResults() {
  const query = currentQuery.toLowerCase();

  const filtered = allVacancies.filter(v => {
    const matchesSearch =
      !query ||
      (v.title && v.title.toLowerCase().includes(query)) ||
      (v.description && v.description.toLowerCase().includes(query));
    const matchesProject =
      !currentFilters.projects.length ||
      currentFilters.projects.includes(v.project || 'Без проекта');
    const matchesDept =
      !currentFilters.departments.length ||
      currentFilters.departments.includes(v.department || 'Без отдела');

    return matchesSearch && matchesProject && matchesDept;
  });

  if (filtered.length === 0) {
    resultsContainer.innerHTML = '<p>Вакансий не найдено</p>';
    return;
  }

  resultsContainer.innerHTML = filtered.map(vac => {
    const title = vac.title || 'Без названия';
    const project = vac.project || 'Без проекта';
    const dept = vac.department || 'Без отдела';

    // карточка вакансии с обычной ссылкой
    return `
      <div class="vacancy-card">
        <a href="/vacancy?vacancy_id=${vac.id}" class="vacancy-card-link">
          <div class="vacancy-title">${title}</div>
          <div class="vacancy-meta">
            ${project} — ${dept}
          </div>
        </a>
      </div>
    `;
  }).join('');
}

// ==========================
// Слушатели событий
// ==========================
if (inputSearch) {
  inputSearch.addEventListener('input', (e) => {
    currentQuery = e.target.value;
    renderResults();
  });
}

if (projectFilterEl) {
  projectFilterEl.addEventListener('change', (e) => {
    const val = e.target.value;
    if (e.target.checked) {
      currentFilters.projects.push(val);
    } else {
      currentFilters.projects = currentFilters.projects.filter(x => x !== val);
    }
    renderResults();
  });
}

if (deptFilterEl) {
  deptFilterEl.addEventListener('change', (e) => {
    const val = e.target.value;
    if (e.target.checked) {
      currentFilters.departments.push(val);
    } else {
      currentFilters.departments = currentFilters.departments.filter(x => x !== val);
    }
    renderResults();
  });
}

if (resetAllBtn) {
  resetAllBtn.addEventListener('click', () => {
    currentFilters.projects = [];
    currentFilters.departments = [];
    currentQuery = '';
    if (inputSearch) inputSearch.value = '';
    renderFilters();
    renderResults();
  });
}

// ==========================
// Инициализация
// ==========================
document.addEventListener('DOMContentLoaded', () => {
  loadVacancies();
});
