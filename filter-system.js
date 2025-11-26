// Полная система фильтров
export default {
    async init() {
        console.log('🎛️ Инициализация полной системы фильтров...');
        
        this.vacancies = [];
        this.currentProject = [];
        this.currentDepartment = [];
        this.currentQuery = '';
        
        await this.renderFullUI();
        await this.loadVacancies();
        this.bindFilterEvents();
    },
    
    async renderFullUI() {
        const container = document.getElementById('vacancy-app-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="vacancy-container">
                <!-- Поиск -->
                <div class="search-wrapper">
                    <div class="search-input-container">
                        <img src="https://static.tildacdn.com/tild6539-3930-4163-a162-316338356335/search_icon.svg" class="search-icon" alt="Поиск">
                        <input type="text" id="vacancy-search" placeholder="Начните вводить название вакансии...">
                    </div>
                    <p class="search-hint">Напишите направление, специализацию или название вакансии</p>
                </div>
                
                <!-- Фильтры -->
                <div class="filters-row">
                    <div class="custom-select" id="project-filter">
                        <div class="select-header">
                            <span class="selected-values">Все проекты</span>
                            <div class="select-controls">
                                <span class="clear-btn">×</span>
                                <span class="arrow-btn">▼</span>
                            </div>
                        </div>
                        <div class="select-dropdown"></div>
                    </div>
                    
                    <div class="custom-select" id="department-filter">
                        <div class="select-header">
                            <span class="selected-values">Все подразделения</span>
                            <div class="select-controls">
                                <span class="clear-btn">×</span>
                                <span class="arrow-btn">▼</span>
                            </div>
                        </div>
                        <div class="select-dropdown"></div>
                    </div>
                </div>
                
                <!-- Мобильные фильтры -->
                <div class="mobile-filters-container">
                    <button id="mobile-filters-btn" class="mobile-filters-btn">Фильтры</button>
                </div>
                
                <button id="reset-all-filters" class="reset-btn" style="display: none;">× Сбросить всё</button>
                
                <!-- Результаты -->
                <div id="vacancy-results">
                    <div style="text-align: center; padding: 40px; color: #666;">
                        Загружаем вакансии...
                    </div>
                </div>
            </div>
        `;
    },
    
    async loadVacancies() {
        try {
            if (!window.supabaseClient) {
                throw new Error('Supabase client not available');
            }
            
            const { data, error } = await window.supabaseClient
                .from('vacancies')
                .select('*')
                .eq('status', 'active')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            this.vacancies = data || [];
            this.renderResults();
            
        } catch (error) {
            console.error('Ошибка загрузки вакансий:', error);
            if (window.vacancyUtils) {
                window.vacancyUtils.showNotification('Ошибка загрузки вакансий', 'error');
            }
        }
    },
    
    bindFilterEvents() {
        // Поиск
        const searchInput = document.getElementById('vacancy-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentQuery = e.target.value.toLowerCase();
                this.renderResults();
            });
        }
        
        // Десктопные фильтры
        this.setupDesktopFilters();
        
        // Сброс фильтров
        const resetBtn = document.getElementById('reset-all-filters');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.currentProject = [];
                this.currentDepartment = [];
                this.currentQuery = '';
                if (searchInput) searchInput.value = '';
                this.renderFilters();
                this.renderResults();
            });
        }
        
        console.log('✅ Все события фильтров привязаны');
    },
    
    setupDesktopFilters() {
        // Проекты
        const projectFilter = document.getElementById('project-filter');
        if (projectFilter) {
            const header = projectFilter.querySelector('.select-header');
            const dropdown = projectFilter.querySelector('.select-dropdown');
            const clearBtn = projectFilter.querySelector('.clear-btn');
            
            header.addEventListener('click', () => this.toggleFilterDropdown('project'));
            clearBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.currentProject = [];
                this.renderFilters();
                this.renderResults();
            });
        }
        
        // Подразделения
        const deptFilter = document.getElementById('department-filter');
        if (deptFilter) {
            const header = deptFilter.querySelector('.select-header');
            const dropdown = deptFilter.querySelector('.select-dropdown');
            const clearBtn = deptFilter.querySelector('.clear-btn');
            
            header.addEventListener('click', () => this.toggleFilterDropdown('department'));
            clearBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.currentDepartment = [];
                this.renderFilters();
                this.renderResults();
            });
        }
        
        // Закрытие фильтров при клике вне
        document.addEventListener('click', () => {
            document.querySelectorAll('.select-dropdown').forEach(dd => {
                dd.style.display = 'none';
            });
        });
    },
    
    toggleFilterDropdown(type) {
        const filter = document.getElementById(`${type}-filter`);
        const dropdown = filter.querySelector('.select-dropdown');
        const isOpen = dropdown.style.display === 'block';
        
        // Закрываем все другие
        document.querySelectorAll('.select-dropdown').forEach(dd => {
            if (dd !== dropdown) dd.style.display = 'none';
        });
        
        // Переключаем текущий
        dropdown.style.display = isOpen ? 'none' : 'block';
        
        if (!isOpen) {
            this.renderFilterOptions(type);
        }
    },
    
    renderFilterOptions(type) {
        const filter = document.getElementById(`${type}-filter`);
        const dropdown = filter.querySelector('.select-dropdown');
        
        const options = type === 'project' 
            ? this.getAvailableProjects() 
            : this.getAvailableDepartments();
        
        const currentValues = type === 'project' ? this.currentProject : this.currentDepartment;
        
        let html = '';
        Object.entries(options).forEach(([value, count]) => {
            const checked = currentValues.includes(value) ? 'checked' : '';
            html += `
                <div class="dropdown-item">
                    <label>
                        <input type="checkbox" value="${value}" ${checked}>
                        ${value}
                        <span class="option-count">(${count})</span>
                    </label>
                </div>
            `;
        });
        
        dropdown.innerHTML = html;
        
        // Обработка выбора
        dropdown.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                const value = e.target.value;
                if (type === 'project') {
                    if (e.target.checked) {
                        if (!this.currentProject.includes(value)) this.currentProject.push(value);
                    } else {
                        this.currentProject = this.currentProject.filter(v => v !== value);
                    }
                } else {
                    if (e.target.checked) {
                        if (!this.currentDepartment.includes(value)) this.currentDepartment.push(value);
                    } else {
                        this.currentDepartment = this.currentDepartment.filter(v => v !== value);
                    }
                }
                this.renderFilters();
                this.renderResults();
            }
        });
    },
    
    renderFilters() {
        // Проекты
        const projectValues = document.querySelector('#project-filter .selected-values');
        const projectClear = document.querySelector('#project-filter .clear-btn');
        if (projectValues) {
            projectValues.textContent = this.currentProject.length 
                ? this.currentProject.join(', ') 
                : 'Все проекты';
        }
        if (projectClear) {
            projectClear.style.display = this.currentProject.length > 0 ? 'block' : 'none';
        }
        
        // Подразделения
        const deptValues = document.querySelector('#department-filter .selected-values');
        const deptClear = document.querySelector('#department-filter .clear-btn');
        if (deptValues) {
            deptValues.textContent = this.currentDepartment.length 
                ? this.currentDepartment.join(', ') 
                : 'Все подразделения';
        }
        if (deptClear) {
            deptClear.style.display = this.currentDepartment.length > 0 ? 'block' : 'none';
        }
        
        // Кнопка сброса
        const resetBtn = document.getElementById('reset-all-filters');
        if (resetBtn) {
            resetBtn.style.display = 
                this.currentProject.length > 0 || 
                this.currentDepartment.length > 0 || 
                this.currentQuery.trim() 
                ? 'block' : 'none';
        }
    },
    
    renderResults() {
        const results = document.getElementById('vacancy-results');
        if (!results) return;
        
        const filtered = this.vacancies.filter(vac => {
            const byProject = this.currentProject.length === 0 || 
                this.currentProject.includes(vac.project || 'Без проекта');
            const byDept = this.currentDepartment.length === 0 || 
                this.currentDepartment.includes(vac.department);
            const bySearch = this.currentQuery === '' || 
                (vac.title && vac.title.toLowerCase().includes(this.currentQuery)) || 
                (vac.description && vac.description.toLowerCase().includes(this.currentQuery));
            
            return byProject && byDept && bySearch;
        });
        
        if (filtered.length === 0) {
            results.innerHTML = `
                <div style="text-align:center;color:#999;padding:40px 0;">
                    <p>Вакансий не найдено</p>
                    <p style="font-size:14px;margin-top:8px;">Попробуйте изменить параметры поиска</p>
                </div>
            `;
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
        
        // Привязываем события к карточкам
        this.bindVacancyCardEvents();
        
        this.renderFilters();
    },
    
    bindVacancyCardEvents() {
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.vacancy-card');
            if (card) {
                this.handleVacancyClick(card);
            }
        });
    },
    
    handleVacancyClick(card) {
        const key = decodeURIComponent(card.dataset.key);
        const [title, project, department] = key.split('|');
        const vacancy = this.vacancies.find(v => 
            v.title === title && 
            (v.project || '') === (project || '') && 
            v.department === department
        );
        
        if (vacancy) {
            this.showVacancyDetail(vacancy);
        }
    },
    
    showVacancyDetail(vacancy) {
        // Сохраняем состояние для возврата
        sessionStorage.setItem('vacancyListScroll', window.scrollY);
        sessionStorage.setItem('vacancyListHTML', document.getElementById('vacancy-results').innerHTML);
        sessionStorage.setItem('vacancyListFilters', JSON.stringify({
            project: this.currentProject,
            department: this.currentDepartment,
            query: this.currentQuery
        }));
        
        // Показываем детальную страницу в Tilda
        if (window.showVacancyDetail) {
            window.showVacancyDetail(vacancy);
        } else {
            // Fallback - открываем в новом окне или показываем информацию
            console.log('Детальная страница:', vacancy);
            alert(`Вакансия: ${vacancy.title}\nПроект: ${vacancy.project}\nОтдел: ${vacancy.department}`);
        }
    },
    
    getAvailableProjects() {
        const projects = {};
        this.vacancies.forEach(v => {
            const p = v.project || 'Без проекта';
            const d = v.department;
            if (this.currentDepartment.length === 0 || this.currentDepartment.includes(d)) {
                projects[p] = (projects[p] || 0) + 1;
            }
        });
        return projects;
    },
    
    getAvailableDepartments() {
        const depts = {};
        this.vacancies.forEach(v => {
            const p = v.project || 'Без проекта';
            const d = v.department;
            if (this.currentProject.length === 0 || this.currentProject.includes(p)) {
                depts[d] = (depts[d] || 0) + 1;
            }
        });
        return depts;
    }
};
