// Main Application - весь ваш JavaScript код переносим сюда
class VacancyApp {
    constructor() {
        this.config = {
            supabaseUrl: 'https://vhbiezamhpyejdqvvwuj.supabase.co',
            supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoYmllemFtaHB5ZWpkcXZ2d3VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2Njc0MDgsImV4cCI6MjA3NzI0MzQwOH0.13h_XJ7kQFtuCjavkOXN9TzXNF2X4jX5-rcNCFiFqO0',
            cacheKeys: {
                data: 'wc-vacancies-data',
                timestamp: 'wc-vacancies-timestamp'
            }
        };
        
        this.state = {
            allVacancies: [],
            currentProject: [],
            currentDepartment: [],
            currentQuery: '',
            currentVacancy: null
        };
        
        this.init();
    }

    async init() {
        console.log('🚀 Инициализация системы вакансий...');
        
        this.fixTildaStyles();
        this.setupEventListeners();
        await this.loadVacanciesData();
        this.initializeFormAnimation();
        
        console.log('✅ Система готова');
    }

   // === ФУНКЦИИ ДЛЯ ОБНОВЛЕНИЯ АККОРДЕОНА TILDA ===
function updateTildaAccordion() {
  const accordionBlock = document.getElementById('rec1513289611');
  if (!accordionBlock) {
    console.log('❌ Аккордеон rec1513289611 не найден');
    return;
  }
  
  console.log('✅ Найден аккордеон Tilda:', accordionBlock);
  
  // Находим все контентные блоки аккордеона по ID
  const accordionContents = [
    document.getElementById('accordion1_1513289611'),
    document.getElementById('accordion2_1513289611'), 
    document.getElementById('accordion3_1513289611')
  ];
  
  console.log('Найдено контентных блоков:', accordionContents.filter(Boolean).length);
  
  if (accordionContents.filter(Boolean).length >= 3 && currentVacancy) {
    // Обновляем первый элемент - "Что важно для нас" (requirements)
    updateAccordionContent(accordionContents[0], currentVacancy.requirements, 'requirements');
    // Обновляем второй элемент - "Что предстоит делать" (responsibilities)  
    updateAccordionContent(accordionContents[1], currentVacancy.responsibilities, 'responsibilities');
    // Обновляем третий элемент - "Что мы предлагаем" (conditions)
    updateAccordionContent(accordionContents[2], currentVacancy.conditions, 'conditions');
    
    console.log('✅ Аккордеон Tilda обновлен динамическими данными');
  } else {
    console.log('❌ Не удалось обновить аккордеон: недостаточно элементов или нет данных вакансии');
  }
}

function updateAccordionContent(accordionContent, content, dataType) {
  if (!accordionContent) {
    console.log(`❌ Контентный блок для ${dataType} не найден`);
    return;
  }
  
  // Находим текстовый элемент внутри контентного блока
  const textElement = accordionContent.querySelector('.t668__text');
  
  if (textElement && currentVacancy) {
    const formattedContent = formatAccordionContent(content, dataType);
    textElement.innerHTML = formattedContent;
    console.log(`✅ Обновлен ${dataType}`);
  } else {
    console.log(`❌ Не найден текстовый элемент для ${dataType}`);
  }
}

function formatAccordionContent(content, dataType) {
  if (!content || content === 'Не указано') {
    return '<p>Информация не указана</p>';
  }
  
  // Если контент уже содержит HTML, используем как есть
  if (content.includes('<') && content.includes('>')) {
    return ensureListStyling(content);
  }
  
  // Разбиваем на параграфы
  const paragraphs = content.split('\n').filter(p => p.trim());
  if (paragraphs.length === 0) return '<p>Информация не указана</p>';
  
  // Если один параграф - просто возвращаем
  if (paragraphs.length === 1) {
    return `<p>${paragraphs[0].trim()}</p>`;
  }
  
  // Если несколько параграфов - создаем список с иконками
  const listItems = paragraphs.map(p => `<li>${p.trim()}</li>`).join('');
  
  return `<ul>${listItems}</ul>`;
}

function ensureListStyling(html) {
  // Добавляем классы для списков если их нет
  return html
    .replace(/<ul>/g, '<ul>')
    .replace(/<li>/g, '<li>');
}

function fixTildaScroll() {
  const allRecords = document.getElementById('allrecords');
  if (allRecords) {
    allRecords.style.overflow = 'visible';
    allRecords.style.height = 'auto';
    allRecords.style.minHeight = '100vh';
  }
  
  document.body.style.overflow = 'auto';
  document.body.style.height = 'auto';
  
  document.querySelectorAll('.t396, .t396__artboard').forEach(el => {
    el.style.height = 'auto';
    el.style.minHeight = 'auto';
    el.style.overflow = 'visible';
  });
  
  const vacancyContainer = document.querySelector('.vacancy-container');
  if (vacancyContainer) {
    vacancyContainer.style.height = 'auto';
    vacancyContainer.style.minHeight = 'auto';
    vacancyContainer.style.overflow = 'visible';
  }
}

function updateResetButtonVisibility() {
  const hasFilters = currentProject.length > 0 || currentDepartment.length > 0 || currentQuery.trim();
  const resetBtn = document.getElementById('reset-all-filters');
  if (resetBtn) resetBtn.style.display = hasFilters ? 'block' : 'none';
}

function updateMobileApplyButton() {
  const applyBtn = document.getElementById('apply-mobile-filters');
  if (!applyBtn) return;
  
  const hasFilters = currentProject.length > 0 || currentDepartment.length > 0;
  
  if (hasFilters) {
    applyBtn.textContent = 'Показать';
    applyBtn.style.background = '#048868';
  } else {
    applyBtn.textContent = 'Отменить';
    applyBtn.style.background = '#666';
  }
}

function getAvailableProjects(selectedDepts = []) {
  const projects = {};
  allVacancies.forEach(v => {
    const d = v.department;
    const p = v.project || 'Без проекта';
    if (selectedDepts.length === 0 || selectedDepts.includes(d)) {
      projects[p] = (projects[p] || 0) + 1;
    }
  });
  return projects;
}

function getAvailableDepartments(selectedProjects = []) {
  const depts = {};
  allVacancies.forEach(v => {
    const p = v.project || 'Без проекта';
    const d = v.department;
    if (selectedProjects.length === 0 || selectedProjects.includes(p)) {
      depts[d] = (depts[d] || 0) + 1;
    }
  });
  return depts;
}

function renderFilters() {
  console.log('???? Rendering filters...');
  
  const projects = getAvailableProjects(currentDepartment);
  const depts = getAvailableDepartments(currentProject);
  
  // Десктопные фильтры
  const projDropdown = document.querySelector('#project-filter .select-dropdown');
  const deptDropdown = document.querySelector('#department-filter .select-dropdown');
  
  if (projDropdown) {
    projDropdown.innerHTML = Object.entries(projects)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([p, c]) => {
        const checked = currentProject.includes(p) ? 'checked' : '';
        return `<label class="dropdown-item"><input type="checkbox" value="${p}" ${checked}> ${p} (${c})</label>`;
      }).join('');
    const projValues = document.querySelector('#project-filter .selected-values');
    if (projValues) {
      projValues.textContent = currentProject.length ? currentProject.join(', ') : 'Все проекты';
    }
  }

  if (deptDropdown) {
    deptDropdown.innerHTML = Object.entries(depts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([d, c]) => {
        const checked = currentDepartment.includes(d) ? 'checked' : '';
        return `<label class="dropdown-item"><input type="checkbox" value="${d}" ${checked}> ${d} (${c})</label>`;
      }).join('');
    const deptValues = document.querySelector('#department-filter .selected-values');
    if (deptValues) {
      deptValues.textContent = currentDepartment.length ? currentDepartment.join(', ') : 'Все подразделения';
    }
  }

  renderMobileFilters();
  updateResetButtonVisibility();
  updateMobileApplyButton();
}

function renderMobileFilters() {
  const projects = getAvailableProjects(currentDepartment);
  const depts = getAvailableDepartments(currentProject);

  const projContainer = document.getElementById('mobile-project-options');
  if (projContainer) {
    projContainer.innerHTML = Object.entries(projects)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([p, c]) => {
        const checked = currentProject.includes(p) ? 'checked' : '';
        return `<label class="mobile-filter-option"><input type="checkbox" value="${p}" ${checked}> ${p} (${c})</label>`;
      }).join('');
  }

  const deptContainer = document.getElementById('mobile-dept-options');
  if (deptContainer) {
    deptContainer.innerHTML = Object.entries(depts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([d, c]) => {
        const checked = currentDepartment.includes(d) ? 'checked' : '';
        return `<label class="mobile-filter-option"><input type="checkbox" value="${d}" ${checked}> ${d} (${c})</label>`;
      }).join('');
  }

  // Обновляем значения в мобильном интерфейсе
  const projectValue = document.querySelector('.filter-item[data-type="projects"] .filter-value');
  const deptValue = document.querySelector('.filter-item[data-type="departments"] .filter-value');
  
  if (projectValue) {
    projectValue.textContent = currentProject.length ? currentProject.join(', ') : 'Все проекты';
  }
  if (deptValue) {
    deptValue.textContent = currentDepartment.length ? currentDepartment.join(', ') : 'Все подразделения';
  }
}

function renderResults() {
  const results = document.getElementById('vacancy-results');
  if (!results) {
    console.error('❌ Element #vacancy-results not found!');
    return;
  }

  console.log('???? Rendering results...');
  
  if (allVacancies.length === 0) {
    results.innerHTML = '<p style="text-align:center;color:#999;padding:40px 0;">Нет доступных вакансий</p>';
    return;
  }

  const filtered = allVacancies.filter(vac => {
    const byProject = currentProject.length === 0 || currentProject.includes(vac.project || 'Без проекта');
    const byDept = currentDepartment.length === 0 || currentDepartment.includes(vac.department);
    const bySearch = currentQuery === '' || 
      (vac.title && vac.title.toLowerCase().includes(currentQuery)) || 
      (vac.description && vac.description.toLowerCase().includes(currentQuery));
    
    return byProject && byDept && bySearch;
  });

  console.log(`Filtered vacancies: ${filtered.length} out of ${allVacancies.length}`);

  if (filtered.length === 0) {
    results.innerHTML = `
      <div style="text-align:center;color:#999;padding:40px 0;">
        <p>Вакансий не найдено</p>
        <p style="font-size:14px;margin-top:8px;">Попробуйте изменить параметры поиска</p>
      </div>
    `;
    updateResetButtonVisibility();
    updateMobileApplyButton();
    setTimeout(fixTildaScroll, 50);
    return;
  }

  // Группируем по отделам
  const groupedByDept = {};
  filtered.forEach(vac => {
    const dept = vac.department || 'Без отдела';
    if (!groupedByDept[dept]) groupedByDept[dept] = [];
    groupedByDept[dept].push(vac);
  });

  const html = Object.keys(groupedByDept)
    .sort()
    .map(dept => {
      const deptVacancies = groupedByDept[dept];
      const count = deptVacancies.length;
      const deptTitle = dept.charAt(0).toUpperCase() + dept.slice(1);
      
      return `
        <h2 class="department-header">${deptTitle} <span class="dept-count">${count}</span></h2>
        ${deptVacancies.map(vac => {
          const project = vac.project || 'Без проекта';
          const key = `${vac.title}|${vac.project || ''}|${vac.department}`;
          
          return `
            <div class="vacancy-card-wrapper">
              <div class="vacancy-card" data-key="${encodeURIComponent(key)}">
                <div class="vacancy-content">
                  <h3>${vac.title}</h3>
                  <p class="vacancy-meta">${project} — ${vac.department}</p>
                </div>
                <span class="arrow-icon">→</span>
              </div>
            </div>
          `;
        }).join('')}
      `;
    })
    .join('');

  results.innerHTML = html;
  
  updateResetButtonVisibility();
  updateMobileApplyButton();
  
  setTimeout(fixTildaScroll, 50);
}

function setText(selector, value) {
  const el = document.querySelector(selector);
  if (el && el.textContent !== undefined) {
    el.textContent = value || 'Не указано';
    el.style.fontFamily = 'ALSHaussNext, sans-serif';
  }
}

function showVacancyDetail(vacancy) {
  sessionStorage.setItem('vacancyListScroll', window.scrollY);
  sessionStorage.setItem('vacancyListHTML', document.getElementById('vacancy-results').innerHTML);
  sessionStorage.setItem('vacancyListFilters', JSON.stringify({
    project: currentProject,
    department: currentDepartment,
    query: currentQuery
  }));
  
  currentVacancy = vacancy;
  window.scrollTo(0, 0);

  // Скрыть список
  const vacancyContainer = document.querySelector('.vacancy-container');
  if (vacancyContainer) vacancyContainer.style.display = 'none';

  // Скрыть верхние блоки
  const headerBlock = document.getElementById('rec1480064551');
  if (headerBlock) headerBlock.style.display = 'none';

  const secondBlock = document.getElementById('rec1475773601');
  if (secondBlock) secondBlock.style.display = 'none';

  // Показать детальные блоки
  const detailBlocks = [
    'rec1480130241',
    'rec1480130251',
    'rec1480130271',
    'rec1480130281',
    'rec1480348491',
    'rec1480130341',
    'rec1513289611'
  ];
  
  let foundAny = false;
  detailBlocks.forEach(id => {
    const block = document.getElementById(id);
    if (block) {
      block.style.display = 'block';
      foundAny = true;
    }
  });

  if (!foundAny) {
    console.log('Ни один детальный блок не найден!');
    return;
  }

  // Заполнить данные
  const titleEl = document.querySelector('.vacancy-title');
  if (titleEl) {
    titleEl.textContent = vacancy.title || 'Не указано';
    titleEl.style.fontFamily = 'ALSHaussNext, sans-serif';
    titleEl.style.fontSize = '48px';
    titleEl.style.fontWeight = '700';
    titleEl.style.color = '#ffffff';
  }

  const descEl = document.querySelector('.vacancy-description');
  if (descEl) descEl.innerHTML = vacancy.description || 'Не указано';
  
  const reqEl = document.querySelector('.vacancy-requirements');
  if (reqEl) reqEl.innerHTML = vacancy.requirements || 'Не указано';
  
  const respEl = document.querySelector('.vacancy-responsibilities');
  if (respEl) respEl.innerHTML = vacancy.responsibilities || 'Не указано';
  
  const condEl = document.querySelector('.vacancy-conditions');
  if (condEl) condEl.innerHTML = vacancy.conditions || 'Не указано';

  // Обновляем аккордеон Tilda
  setTimeout(() => {
    updateTildaAccordion();
  }, 300);

  // Обновить URL
  const newUrl = `${window.location.pathname}?vacancy=${encodeURIComponent(vacancy.title)}&project=${encodeURIComponent(vacancy.project || '')}&dept=${encodeURIComponent(vacancy.department)}`;
  history.pushState({ vacancy }, '', newUrl);
}

function showVacancyList() {
  const savedHTML = sessionStorage.getItem('vacancyListHTML');
  if (savedHTML) {
    const savedFilters = JSON.parse(sessionStorage.getItem('vacancyListFilters'));
    
    currentProject = savedFilters.project;
    currentDepartment = savedFilters.department;
    currentQuery = savedFilters.query;
    
    document.getElementById('vacancy-results').innerHTML = savedHTML;
    
    const searchInput = document.getElementById('vacancy-search');
    if (searchInput) searchInput.value = currentQuery;

    renderFilters();
    
    const savedScroll = sessionStorage.getItem('vacancyListScroll');
    if (savedScroll) {
      window.scrollTo(0, parseInt(savedScroll));
    }
    
    sessionStorage.removeItem('vacancyListHTML');
    sessionStorage.removeItem('vacancyListScroll');
    sessionStorage.removeItem('vacancyListFilters');
    
  } else {
    renderResults();
  }

  // Показать верхние блоки
  const headerBlock = document.getElementById('rec1480064551');
  if (headerBlock) headerBlock.style.display = 'block';

  const secondBlock = document.getElementById('rec1475773601');
  if (secondBlock) secondBlock.style.display = 'block';

  // Скрыть детали
  const detailBlocks = [
    'rec1480130241',
    'rec1480130251',
    'rec1480130271',
    'rec1480130281',
    'rec1480130341',
    'rec1513289611'
  ];
  detailBlocks.forEach(id => {
    const block = document.getElementById(id);
    if (block) block.style.display = 'none';
  });

  // Показать список
  const vacancyContainer = document.querySelector('.vacancy-container');
  if (vacancyContainer) vacancyContainer.style.display = 'block';

  history.pushState(null, '', window.location.pathname);
}

// === ИНИЦИАЛИЗАЦИЯ МОДУЛЬНОЙ СИСТЕМЫ ===
function initializeModuleSystem() {
    // Загружаем основной загрузчик
    const script = document.createElement('script');
    script.src = 'https://marokone.github.io/welcomecity-vacancies/js/main-compat.js';
    script.onload = () => {
        console.log('✅ Основной загрузчик модулей загружен');
    };
    script.onerror = () => {
        console.warn('⚠️ Не удалось загрузить модульную систему, используем оригинальную');
        initializeOriginalSystem();
    };
    document.head.appendChild(script);
}

// === РЕЗЕРВНАЯ ИНИЦИАЛИЗАЦИЯ ===
function initializeOriginalSystem() {
    console.log('???? Запуск оригинальной системы...');
    
    // Ваша оригинальная инициализация
    fixTildaScroll();
    setupEventListeners();
    initializeSupabase();
    loadVacanciesData();
    
    // Инициализация анимации формы
    setTimeout(() => {
        initializeFormAnimation();
    }, 1000);
}

// === ГЛАВНАЯ ИНИЦИАЛИЗАЦИЯ ===
document.addEventListener('DOMContentLoaded', function() {
    console.log('???? Инициализация системы вакансий...');
    
    // Сначала пробуем загрузить модульную систему
    initializeModuleSystem();
    
    // Резервная инициализация через 3 секунды, если модули не загрузились
    setTimeout(() => {
        if (!window.mainCompatLoader) {
            console.log('⏰ Таймаут загрузки модулей, активируем резервную систему');
            initializeOriginalSystem();
        }
    }, 3000);
    
    // Периодическая проверка обновлений (оставляем для совместимости)
    setInterval(() => {
        console.log('???? Фоновая проверка обновлений...');
        if (window.loadFromSupabase) {
            loadFromSupabase().catch(console.error);
        }
    }, 2 * 60 * 1000);
});


// === SUPABASE ФУНКЦИИ ===

function initializeSupabase() {
  if (window.supabase) {
    supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
    console.log('✅ Supabase инициализирован');
    return true;
  } else {
    console.error('❌ Supabase JS не загружен');
    return false;
  }
}

function getCachedData() {
  try {
    const storedData = localStorage.getItem(VACANCIES_STORAGE_KEY);
    const timestamp = localStorage.getItem(VACANCIES_TIMESTAMP_KEY);
    
    if (!storedData || !timestamp) return null;
    
    const now = Date.now();
    const cacheAge = now - parseInt(timestamp);
    
    if (cacheAge > CACHE_TTL) {
      console.log('ℹ️ Кэш устарел, требуется обновление');
      return null;
    }
    
    const data = JSON.parse(storedData);
    console.log('✅ Данные загружены из кэша:', data.vacancies?.length, 'вакансий');
    return data.vacancies || [];
    
  } catch (error) {
    console.error('❌ Ошибка чтения кэша:', error);
    return null;
  }
}

function saveToCache(vacancies) {
  try {
    const data = {
      vacancies: vacancies,
      timestamp: Date.now()
    };
    
    localStorage.setItem(VACANCIES_STORAGE_KEY, JSON.stringify(data));
    localStorage.setItem(VACANCIES_TIMESTAMP_KEY, Date.now().toString());
    
    console.log('???? Данные сохранены в кэш:', vacancies.length, 'вакансий');
  } catch (error) {
    console.error('❌ Ошибка сохранения в кэш:', error);
  }
}

function formatVacancyData(data) {
  return {
    id: data.id,
    title: data.title || 'Без названия',
    project: data.project || 'Без проекта',
    department: data.department || 'Без отдела',
    description: data.description || '',
    requirements: data.requirements || '',
    responsibilities: data.responsibilities || '',
    conditions: data.conditions || '',
    format: data.format || 'Не указан',
    status: data.status,
    created_at: data.created_at
  };
}

function showLoader() {
  const spinner = document.getElementById('loading-spinner');
  if (spinner) spinner.style.display = 'flex';
  const results = document.getElementById('vacancy-results');
  if (results) results.style.display = 'none';
}

function hideLoader() {
  const spinner = document.getElementById('loading-spinner');
  if (spinner) spinner.style.display = 'none';
  const results = document.getElementById('vacancy-results');
  if (results) results.style.display = 'block';
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    z-index: 10000;
    font-family: 'ALSHaussNext', sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transition: all 0.3s ease;
    max-width: 300px;
  `;
  
  const colors = {
    success: '#27ae60',
    error: '#e74c3c',
    info: '#3498db',
    warning: '#f39c12'
  };
  
  notification.style.background = colors[type] || colors.info;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100px)';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
}

function showError(message) {
  const results = document.getElementById('vacancy-results');
  if (results) {
    results.innerHTML = `
      <div style="text-align:center; padding: 40px 20px; color: #666;">
        <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
        <h3 style="margin: 0 0 8px 0; color: #333;">${message}</h3>
        <p style="margin: 0; opacity: 0.7;">Попробуйте обновить страницу</p>
        <button onclick="loadVacanciesData()" style="
          margin-top: 20px;
          padding: 12px 24px;
          background: #048868;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-family: 'ALSHaussNext', sans-serif;
        ">Обновить</button>
      </div>
    `;
  }
}

async function loadFromSupabase() {
  if (!supabase) {
    if (!initializeSupabase()) {
      throw new Error('Supabase не доступен');
    }
  }
  
  console.log('???? Загрузка данных из Supabase...');
  
  const { data, error } = await supabase
    .from('vacancies')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('❌ Ошибка Supabase:', error);
    throw error;
  }
  
  if (data && data.length > 0) {
    const formattedVacancies = data.map(vacancy => formatVacancyData(vacancy));
    
    const currentCount = allVacancies.length;
    const newCount = formattedVacancies.length;
    
    if (currentCount !== newCount || JSON.stringify(allVacancies) !== JSON.stringify(formattedVacancies)) {
      allVacancies = formattedVacancies;
      saveToCache(allVacancies);
      
      if (currentCount > 0) {
        console.log('???? Данные обновлены, перерисовываем интерфейс');
        updateInterface();
        showNotification('Данные обновлены', 'success');
      } else {
        updateInterface();
      }
    } else {
      console.log('✅ Данные актуальны, обновление не требуется');
    }
    
    console.log('✅ Загружено из Supabase:', allVacancies.length, 'вакансий');
    
    if (!realtimeSubscription) {
      startRealtimeSubscription();
    }
    
  } else {
    console.log('ℹ️ В Supabase нет вакансий');
    allVacancies = [];
    saveToCache([]);
    updateInterface();
  }
  
  hideLoader();
}

function startRealtimeSubscription() {
  if (!supabase || realtimeSubscription) return;
  
  try {
    realtimeSubscription = supabase
      .channel('vacancies-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vacancies'
        },
        (payload) => {
          console.log('???? Realtime обновление:', payload.eventType, payload.new);
          handleRealtimeUpdate(payload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime подписка активна');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Ошибка realtime подписки');
        }
      });
      
  } catch (error) {
    console.error('❌ Ошибка инициализации realtime:', error);
  }
}

function handleRealtimeUpdate(payload) {
  const { eventType, new: newData, old: oldData } = payload;
  
  switch (eventType) {
    case 'INSERT':
      if (newData.status === 'active') {
        const newVacancy = formatVacancyData(newData);
        allVacancies.unshift(newVacancy);
        saveToCache(allVacancies);
        updateInterface();
        showNotification('Добавлена новая вакансия', 'success');
      }
      break;
      
    case 'UPDATE':
      const index = allVacancies.findIndex(v => v.id === newData.id);
      if (index !== -1) {
        if (newData.status === 'active') {
          allVacancies[index] = formatVacancyData(newData);
        } else {
          allVacancies.splice(index, 1);
        }
        saveToCache(allVacancies);
        updateInterface();
        showNotification('Вакансия обновлена', 'info');
      }
      break;
      
    case 'DELETE':
      const deleteIndex = allVacancies.findIndex(v => v.id === oldData.id);
      if (deleteIndex !== -1) {
        allVacancies.splice(deleteIndex, 1);
        saveToCache(allVacancies);
        updateInterface();
        showNotification('Вакансия удалена', 'info');
      }
      break;
  }
}

async function loadVacanciesData() {
  showLoader();
  
  try {
    const cachedVacancies = getCachedData();
    if (cachedVacancies && cachedVacancies.length > 0) {
      allVacancies = cachedVacancies;
      updateInterface();
      hideLoader();
    }
    
    await loadFromSupabase();
    
  } catch (error) {
    console.error('❌ Ошибка загрузки данных:', error);
    
    if (allVacancies.length === 0) {
      const cached = getCachedData();
      if (cached && cached.length > 0) {
        allVacancies = cached;
        updateInterface();
        showNotification('Используем кэшированные данные', 'info');
      } else {
        showError('Не удалось загрузить вакансии');
      }
    }
    
    hideLoader();
  }
}

function updateInterface() {
  if (allVacancies.length === 0) {
    const results = document.getElementById('vacancy-results');
    if (results) {
      results.innerHTML = `
        <div style="text-align:center; padding: 60px 20px; color: #666;">
          <div style="font-size: 48px; margin-bottom: 16px;">????</div>
          <h3 style="margin: 0 0 8px 0; color: #333;">Нет активных вакансий</h3>
          <p style="margin: 0; opacity: 0.7;">Свяжитесь с HR-отделом для уточнения</p>
        </div>
      `;
    }
    return;
  }

  const input = document.getElementById('vacancy-search');
  if (input && allVacancies.length > 0) {
    const titles = allVacancies.map(v => v.title).filter(t => t && t.trim());
    let i = 0;
    const update = () => {
      input.placeholder = titles[i] || 'Название вакансии';
      i = (i + 1) % (titles.length || 1);
    };
    if (titles.length > 0) {
      update();
      if (placeholderInterval) clearInterval(placeholderInterval);
      placeholderInterval = setInterval(update, 1000);
    }
  }

  const urlParams = new URLSearchParams(window.location.search);
  const title = urlParams.get('vacancy');
  const project = urlParams.get('project') || '';
  const dept = urlParams.get('dept');

  if (title && allVacancies.length > 0) {
    const vac = allVacancies.find(v => 
      v.title === title && 
      (v.project || '') === project && 
      v.department === dept
    );
    if (vac) {
      setTimeout(() => {
        showVacancyDetail(vac);
      }, 100);
      return;
    }
  }

  const vacancyContainer = document.querySelector('.vacancy-container');
  if (vacancyContainer) vacancyContainer.style.display = 'block';
  
  renderFilters();
  renderResults();
}

function closeMobileFilters() {
  const mobileModal = document.getElementById('mobile-filters-modal');
  if (mobileModal) {
    mobileModal.classList.remove('active');
    setTimeout(() => {
      mobileModal.style.display = 'none';
    }, 300);
  }
}

// === ОБРАБОТЧИКИ СОБЫТИЙ ===
function setupEventListeners() {
  // Клик по карточке вакансии
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.vacancy-card');
    if (card) {
      const key = decodeURIComponent(card.dataset.key);
      const [title, project, department] = key.split('|');
      const vac = allVacancies.find(v => 
        v.title === title && 
        (v.project || '') === (project || '') && 
        v.department === department
      );
      if (vac) showVacancyDetail(vac);
    }
  });

  // Поиск
  const searchInput = document.getElementById('vacancy-search');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      currentQuery = e.target.value.toLowerCase();
      renderResults();
    });
  }

  // Сброс всех фильтров
  const resetBtn = document.getElementById('reset-all-filters');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      currentProject = [];
      currentDepartment = [];
      currentQuery = '';
      const searchInput = document.getElementById('vacancy-search');
      if (searchInput) searchInput.value = '';
      renderFilters();
      renderResults();
    });
  }

  // Десктопные фильтры
  ['project-filter', 'department-filter'].forEach(id => {
    const filter = document.getElementById(id);
    if (!filter) return;
    const header = filter.querySelector('.select-header');
    const dropdown = filter.querySelector('.select-dropdown');
    const clearBtn = filter.querySelector('.clear-btn');

    if (header) {
      header.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.style.display === 'block';
        
        document.querySelectorAll('.select-dropdown').forEach(dd => {
          if (dd !== dropdown) {
            dd.style.display = 'none';
            dd.parentElement.classList.remove('active');
          }
        });
        
        dropdown.style.display = isOpen ? 'none' : 'block';
        filter.classList.toggle('active', !isOpen);
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (id === 'project-filter') currentProject = [];
        if (id === 'department-filter') currentDepartment = [];
        renderFilters();
        renderResults();
      });
    }

    if (dropdown) {
      dropdown.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
          const value = e.target.value;
          e.stopPropagation();
          if (id === 'project-filter') {
            if (e.target.checked) {
              if (!currentProject.includes(value)) currentProject.push(value);
            } else {
              currentProject = currentProject.filter(v => v !== value);
            }
          } else {
            if (e.target.checked) {
              if (!currentDepartment.includes(value)) currentDepartment.push(value);
            } else {
              currentDepartment = currentDepartment.filter(v => v !== value);
            }
          }
          renderFilters();
          renderResults();
        }
      });
    }
  });

  // Закрытие десктопных фильтров при клике вне
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-select')) {
      document.querySelectorAll('.select-dropdown').forEach(dropdown => {
        dropdown.style.display = 'none';
        dropdown.parentElement.classList.remove('active');
      });
    }
  });

  // Мобильные фильтры
  const mobileModal = document.getElementById('mobile-filters-modal');
  const projectDropdown = document.getElementById('mobile-project-dropdown');
  const deptDropdown = document.getElementById('mobile-dept-dropdown');

  const mobileFiltersBtn = document.getElementById('mobile-filters-btn');
  if (mobileFiltersBtn) {
    mobileFiltersBtn.addEventListener('click', () => {
      renderMobileFilters();
      updateMobileApplyButton();
      if (mobileModal) {
        mobileModal.style.display = 'block';
        setTimeout(() => {
          mobileModal.classList.add('active');
        }, 10);
      }
    });
  }

  document.addEventListener('click', (e) => {
    if (mobileModal && mobileModal.style.display === 'block' && e.target === mobileModal) {
      closeMobileFilters();
    }
  });

  const clearMobileFilters = document.getElementById('clear-mobile-filters');
  if (clearMobileFilters) {
    clearMobileFilters.addEventListener('click', () => {
      currentProject = [];
      currentDepartment = [];
      renderFilters();
      renderResults();
      updateMobileApplyButton();
    });
  }

  const applyMobileFilters = document.getElementById('apply-mobile-filters');
  if (applyMobileFilters) {
    applyMobileFilters.addEventListener('click', () => {
      const hasFilters = currentProject.length > 0 || currentDepartment.length > 0;
      
      if (hasFilters) {
        renderFilters();
        renderResults();
        closeMobileFilters();
      } else {
        closeMobileFilters();
      }
    });
  }

  document.querySelectorAll('.filter-item').forEach(item => {
    item.addEventListener('click', () => {
      const type = item.dataset.type;
      if (type === 'projects' && projectDropdown) {
        projectDropdown.style.display = 'flex';
      } else if (type === 'departments' && deptDropdown) {
        deptDropdown.style.display = 'flex';
      }
    });
  });

  document.querySelectorAll('.close-dropdown').forEach(btn => {
    btn.addEventListener('click', () => {
      if (projectDropdown) projectDropdown.style.display = 'none';
      if (deptDropdown) deptDropdown.style.display = 'none';
    });
  });

  document.addEventListener('change', (e) => {
    if (e.target.type === 'checkbox' && 
        (e.target.closest('#mobile-project-options') || e.target.closest('#mobile-dept-options'))) {
      
      const value = e.target.value;
      const isProject = e.target.closest('#mobile-project-options');
      
      if (isProject) {
        if (e.target.checked) {
          if (!currentProject.includes(value)) currentProject.push(value);
        } else {
          currentProject = currentProject.filter(v => v !== value);
        }
      } else {
        if (e.target.checked) {
          if (!currentDepartment.includes(value)) currentDepartment.push(value);
        } else {
          currentDepartment = currentDepartment.filter(v => v !== value);
        }
      }
      
      renderMobileFilters();
      updateMobileApplyButton();
      
      setTimeout(() => {
        if (projectDropdown) projectDropdown.style.display = 'none';
        if (deptDropdown) deptDropdown.style.display = 'none';
      }, 300);
    }
  });

  // Кнопка "Назад к списку"
  document.addEventListener('click', (e) => {
    if (e.target.closest('.back-to-list-btn')) {
      showVacancyList();
    }
  });

  // Поддержка кнопки "Назад" в браузере
  window.addEventListener('popstate', (e) => {
    const urlParams = new URLSearchParams(window.location.search);
    const title = urlParams.get('vacancy');
    const project = urlParams.get('project') || '';
    const dept = urlParams.get('dept');

    if (title && allVacancies.length > 0) {
      const vac = allVacancies.find(v => 
        v.title === title && 
        (v.project || '') === project && 
        v.department === dept
      );
      if (vac) {
        showVacancyDetail(vac);
        return;
      }
    }
    showVacancyList();
  });

  // Слушаем изменения в localStorage
  window.addEventListener('storage', function(e) {
    if (e.key === VACANCIES_STORAGE_KEY) {
      console.log('???? Обновление данных из другой вкладки');
      const cached = getCachedData();
      if (cached) {
        allVacancies = cached;
        updateInterface();
        showNotification('Данные синхронизированы', 'info');
      }
    }
  });
}

// === АНИМАЦИЯ ПЕРЕХОДА КНОПКА ↔ ФОРМА ===
function initializeFormAnimation() {
  const buttonBlock = document.getElementById('rec1480130341');
  const formBlock = document.getElementById('rec1479156901');
  
  if (!buttonBlock || !formBlock) {
    console.log('❌ Блоки для анимации не найдены');
    return;
  }
  
  console.log('✅ Блоки найдены');
  
  // Ищем конкретно элемент с текстом "Давай!"
  let openButton = null;
  
  // Функция для поиска элемента с текстом
  function findElementWithText(element, text) {
    if (element.textContent?.trim() === text || element.textContent?.includes(text)) {
      return element;
    }
    
    for (let child of element.children) {
      const found = findElementWithText(child, text);
      if (found) return found;
    }
    
    return null;
  }
  
  openButton = findElementWithText(buttonBlock, 'Давай!');
  
  if (!openButton) {
    console.log('❌ Элемент с текстом "Давай!" не найден, используем весь блок');
    openButton = buttonBlock;
  } else {
    console.log('✅ Найден элемент с текстом "Давай!":', openButton);
  }
  
  // Добавляем стили для курсора
  const style = document.createElement('style');
  style.textContent = `
    /* Курсор для найденного элемента или всего блока */
    #rec1480130341 .vacancy-form-btn,
    #rec1480130341[data-is-button="true"] {
      cursor: pointer !important;
    }
    #rec1480130341 .vacancy-form-btn:hover,
    #rec1480130341[data-is-button="true"]:hover {
      opacity: 0.9;
    }
  `;
  document.head.appendChild(style);
  
  // Помечаем элемент как кнопку
  if (openButton === buttonBlock) {
    openButton.setAttribute('data-is-button', 'true');
  } else {
    openButton.classList.add('vacancy-form-btn');
  }
  
  // Убедимся, что форма изначально скрыта
  formBlock.classList.remove('form-active');
  buttonBlock.classList.remove('button-hidden');
  
  // Обработчик клика
  openButton.addEventListener('click', function(e) {
    // Проверяем, что клик не по карточке вакансии
    if (e.target.closest('.vacancy-card')) {
      return; // Пропускаем клики по карточкам
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    console.log('???? Открываем форму');
    
    // Показываем форму
    formBlock.classList.add('form-active');
    
    // Скрываем кнопку
    buttonBlock.classList.add('button-hidden');
    
    // Прокручиваем к форме плавно
    setTimeout(() => {
      // Получаем позицию формы относительно документа
      const formRect = formBlock.getBoundingClientRect();
      const absoluteFormTop = formRect.top + window.pageYOffset;
      
      // Прокручиваем к форме с небольшим отступом от верха
      window.scrollTo({
        top: absoluteFormTop - 50, // 50px отступ от верха
        behavior: 'smooth'
      });
    }, 100);
    
    return false;
  });
}

// === ИНИЦИАЛИЗАЦИЯ ===
document.addEventListener('DOMContentLoaded', function() {
  console.log('???? Инициализация системы вакансий...');
  
  fixTildaScroll();
  setupEventListeners();
  
  // Инициализируем Supabase
  initializeSupabase();
  
  // Загружаем данные
  loadVacanciesData();
  
  // Инициализируем анимацию формы
  setTimeout(() => {
    initializeFormAnimation();
  }, 1000);
  
  // Периодическая проверка обновлений
  setInterval(() => {
    console.log('???? Фоновая проверка обновлений...');
    loadFromSupabase().catch(console.error);
  }, 2 * 60 * 1000);
});

// === ТЕСТОВОЕ ПОДКЛЮЧЕНИЕ МОДУЛЕЙ ===
function testModuleIntegration() {
    console.log('???? Тестирование интеграции модулей...');
    
    // Загружаем модули постепенно
    const modulesToLoad = [
        'https://marokone.github.io/welcomecity-vacancies/js/migration-bridge.js',
        'https://marokone.github.io/welcomecity-vacancies/js/tilda-integration-compat.js'
    ];
    
    let loadedCount = 0;
    
    modulesToLoad.forEach(moduleUrl => {
        const script = document.createElement('script');
        script.src = moduleUrl;
        script.onload = () => {
            loadedCount++;
            console.log(`✅ Модуль загружен: ${moduleUrl}`);
            
            if (loadedCount === modulesToLoad.length) {
                console.log('???? Все модули загружены!');
                activateNewSystem();
            }
        };
        script.onerror = () => {
            console.error(`❌ Ошибка загрузки модуля: ${moduleUrl}`);
        };
        document.head.appendChild(script);
    });
    
    function activateNewSystem() {
        // Активируем новую систему через 3 секунды
        setTimeout(() => {
            if (window.migrationBridge) {
                window.migrationBridge.activateNewSystem();
                console.log('???? Новая система активирована в тестовом режиме');
                
                // Показываем уведомление
                showNotification('Новая система вакансий активирована!', 'success');
            }
        }, 3000);
    }
}

// Запускаем тест через 10 секунд после загрузки
setTimeout(() => {
    // Раскомментируйте следующую строку для тестирования:
    testModuleIntegration();
}, 10000);

// Функция уведомления
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        border-radius: 12px;
        color: white;
        z-index: 10002;
        font-family: 'ALSHaussNext', sans-serif;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        transition: all 0.3s ease;
        max-width: 300px;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Автоматическая инициализация
window.vacancyApp = new VacancyApp();
