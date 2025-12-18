// ==========================
// Main.js для страницы search-vacancy
// БЕЗ SPA-костылей, с переходом на отдельные страницы
// ==========================

class VacancyListApp {
    constructor() {
        this.config = {
            supabaseUrl: 'https://vhbiezamhpyejdqvvwuj.supabase.co',
            supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoYmllemFtaHB5ZWpkcXZ2d3VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2Njc0MDgsImV4cCI6MjA3NzI0MzQwOH0.13h_XJ7kQFtuCjavkOXN9TzXNF2X4jX5-rcNCFiFqO0',
            cacheKeys: {
                data: 'wc-vacancies-data',
                timestamp: 'wc-vacancies-timestamp'
            },
            cacheTTL: 5 * 60 * 1000 // 5 минут
        };
        
        this.state = {
            allVacancies: [],
            currentProject: [],
            currentDepartment: [],
            currentQuery: '',
            placeholderInterval: null,
            supabase: null,
            projectCounts: {},
            deptCounts: {}
        };
        
        this.init();
    }

    async init() {
        console.log('🚀 Инициализация списка вакансий...');
        
        this.setupEventListeners();
        this.initializeSupabase();
        await this.loadVacanciesData();
        
        console.log('✅ Список вакансий готов');
    }

    // ==========================
    // СЛУШАТЕЛИ СОБЫТИЙ (упрощенная версия)
    // ==========================
    setupEventListeners() {
        // Поиск
        const searchInput = document.getElementById('vacancy-search');
        if (searchInput) {
            searchInput.addEventListener('input', e => {
                this.state.currentQuery = e.target.value.toLowerCase();
                this.renderResults();
            });
        }

        // Сброс фильтров
        const resetBtn = document.getElementById('reset-all-filters');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.state.currentProject = [];
                this.state.currentDepartment = [];
                this.state.currentQuery = '';
                if (searchInput) searchInput.value = '';
                this.renderFilters();
                this.renderResults();
            });
        }

        // Делегирование событий для фильтров
        this.setupFilterHandlers();
        this.setupMobileFilters();
    }

    setupFilterHandlers() {
        ['project-filter', 'department-filter'].forEach(id => {
            const filter = document.getElementById(id);
            if (!filter) return;
            
            const header = filter.querySelector('.select-header');
            const dropdown = filter.querySelector('.select-dropdown');
            const clearBtn = filter.querySelector('.clear-btn');

            if (header) {
                header.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const isActive = filter.classList.contains('active');
                    
                    document.querySelectorAll('.custom-select').forEach(s => {
                        if (s !== filter) {
                            s.classList.remove('active');
                            const otherDropdown = s.querySelector('.select-dropdown');
                            if (otherDropdown) otherDropdown.style.display = 'none';
                        }
                    });
                    
                    filter.classList.toggle('active');
                    if (dropdown) {
                        dropdown.style.display = isActive ? 'none' : 'block';
                    }
                });
            }

            if (clearBtn) {
                clearBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (id === 'project-filter') {
                        this.state.currentProject = [];
                        filter.classList.remove('has-selection');
                    } else {
                        this.state.currentDepartment = [];
                        filter.classList.remove('has-selection');
                    }
                    this.renderFilters();
                    this.renderResults();
                    this.updateClearButtonVisibility();
                });
            }

            if (dropdown) {
                dropdown.addEventListener('change', (e) => {
                    if (e.target.type === 'checkbox') {
                        const value = e.target.value;
                        const isChecked = e.target.checked;
                        
                        if (id === 'project-filter') {
                            if (isChecked) {
                                if (!this.state.currentProject.includes(value)) {
                                    this.state.currentProject.push(value);
                                }
                            } else {
                                this.state.currentProject = this.state.currentProject.filter(v => v !== value);
                            }
                            if (this.state.currentProject.length > 0) {
                                filter.classList.add('has-selection');
                            } else {
                                filter.classList.remove('has-selection');
                            }
                        } else {
                            if (isChecked) {
                                if (!this.state.currentDepartment.includes(value)) {
                                    this.state.currentDepartment.push(value);
                                }
                            } else {
                                this.state.currentDepartment = this.state.currentDepartment.filter(v => v !== value);
                            }
                            if (this.state.currentDepartment.length > 0) {
                                filter.classList.add('has-selection');
                            } else {
                                filter.classList.remove('has-selection');
                            }
                        }
                        this.renderFilters();
                        this.renderResults();
                        this.updateClearButtonVisibility();
                    }
                });
            }
        });

        // Закрытие выпадающих меню при клике вне
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.custom-select')) {
                document.querySelectorAll('.custom-select').forEach(select => {
                    select.classList.remove('active');
                    const dropdown = select.querySelector('.select-dropdown');
                    if (dropdown) dropdown.style.display = 'none';
                });
            }
        });
    }

    setupMobileFilters() {
        const mobileModal = document.getElementById('mobile-filters-modal');
        const mobileFiltersBtn = document.getElementById('mobile-filters-btn');
        
        if (mobileFiltersBtn && mobileModal) {
            mobileFiltersBtn.addEventListener('click', () => {
                this.renderMobileFilters();
                this.updateMobileApplyButton();
                mobileModal.style.display = 'block';
                setTimeout(() => {
                    mobileModal.classList.add('active');
                }, 10);
            });
        }

        document.addEventListener('click', (e) => {
            if (mobileModal && mobileModal.style.display === 'block' && e.target === mobileModal) {
                this.closeMobileFilters();
            }
        });

        const clearMobileFilters = document.getElementById('clear-mobile-filters');
        if (clearMobileFilters) {
            clearMobileFilters.addEventListener('click', () => {
                this.state.currentProject = [];
                this.state.currentDepartment = [];
                
                const projectFilter = document.getElementById('project-filter');
                const deptFilter = document.getElementById('department-filter');
                if (projectFilter) projectFilter.classList.remove('has-selection');
                if (deptFilter) deptFilter.classList.remove('has-selection');
                
                this.renderFilters();
                this.renderResults();
                this.updateMobileApplyButton();
                this.updateClearButtonVisibility();
            });
        }

        const applyMobileFilters = document.getElementById('apply-mobile-filters');
        if (applyMobileFilters) {
            applyMobileFilters.addEventListener('click', () => {
                const hasFilters = this.state.currentProject.length > 0 || this.state.currentDepartment.length > 0;
                
                if (hasFilters) {
                    this.renderFilters();
                    this.renderResults();
                }
                this.closeMobileFilters();
            });
        }

        // Обработчики для мобильных чекбоксов
        document.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox' && 
                (e.target.closest('#mobile-project-options') || e.target.closest('#mobile-dept-options'))) {
                
                const value = e.target.value;
                const isProject = e.target.closest('#mobile-project-options');
                
                if (isProject) {
                    if (e.target.checked) {
                        if (!this.state.currentProject.includes(value)) this.state.currentProject.push(value);
                    } else {
                        this.state.currentProject = this.state.currentProject.filter(v => v !== value);
                    }
                } else {
                    if (e.target.checked) {
                        if (!this.state.currentDepartment.includes(value)) this.state.currentDepartment.push(value);
                    } else {
                        this.state.currentDepartment = this.state.currentDepartment.filter(v => v !== value);
                    }
                }
                
                this.renderMobileFilters();
                this.updateMobileApplyButton();
                this.updateClearButtonVisibility();
            }
        });
    }

    // ==========================
    // SUPABASE И ДАННЫЕ
    // ==========================
    initializeSupabase() {
        if (window.supabase) {
            this.state.supabase = window.supabase;
            console.log('✅ Supabase инициализирован');
            return true;
        } else {
            console.error('❌ Supabase JS не загружен');
            return false;
        }
    }

    getCachedData() {
        try {
            const storedData = localStorage.getItem(this.config.cacheKeys.data);
            const timestamp = localStorage.getItem(this.config.cacheKeys.timestamp);
            
            if (!storedData || !timestamp) return null;
            
            const now = Date.now();
            const cacheAge = now - parseInt(timestamp);
            
            if (cacheAge > this.config.cacheTTL) {
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

    saveToCache(vacancies) {
        try {
            const data = {
                vacancies: vacancies,
                timestamp: Date.now()
            };
            
            localStorage.setItem(this.config.cacheKeys.data, JSON.stringify(data));
            localStorage.setItem(this.config.cacheKeys.timestamp, Date.now().toString());
            
            console.log('💾 Данные сохранены в кэш:', vacancies.length, 'вакансий');
        } catch (error) {
            console.error('❌ Ошибка сохранения в кэш:', error);
        }
    }

    formatVacancyData(data) {
        return {
            id: data.id,
            title: data.title || 'Без названия',
            project_name: data.project_name || 'Без проекта',
            project: data.project || data.project_name || 'Без проекта',
            department: data.department || 'Без отдела',
            description: data.description || '',
            requirements: data.requirements || '',
            responsibilities: data.responsibilities || '',
            conditions: data.conditions || '',
            format: data.format || 'Не указан',
            status: data.status,
            created_at: data.created_at,
            // SEO данные
            seo_title: data.seo_title || data.title,
            seo_description: data.seo_description || data.description?.substring(0, 160)
        };
    }

    async loadFromSupabase() {
        if (!this.state.supabase) {
            if (!this.initializeSupabase()) {
                throw new Error('Supabase не доступен');
            }
        }
        
        console.log('📡 Загрузка данных из Supabase...');
        
        const { data, error } = await this.state.supabase
            .from('vacancies')
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('❌ Ошибка Supabase:', error);
            throw error;
        }
        
        if (data && data.length > 0) {
            const formattedVacancies = data.map(vacancy => this.formatVacancyData(vacancy));
            this.state.allVacancies = formattedVacancies;
            this.saveToCache(this.state.allVacancies);
            this.calculateCounts();
            
            console.log('✅ Загружено из Supabase:', this.state.allVacancies.length, 'вакансий');
        } else {
            console.log('ℹ️ В Supabase нет вакансий');
            this.state.allVacancies = [];
            this.saveToCache([]);
        }
    }

    calculateCounts() {
        this.state.projectCounts = {};
        this.state.allVacancies.forEach(vacancy => {
            const project = vacancy.project || 'Без проекта';
            this.state.projectCounts[project] = (this.state.projectCounts[project] || 0) + 1;
        });
        
        this.state.deptCounts = {};
        this.state.allVacancies.forEach(vacancy => {
            const dept = vacancy.department || 'Без отдела';
            this.state.deptCounts[dept] = (this.state.deptCounts[dept] || 0) + 1;
        });
    }

    async loadVacanciesData() {
        try {
            const cachedVacancies = this.getCachedData();
            if (cachedVacancies && cachedVacancies.length > 0) {
                this.state.allVacancies = cachedVacancies;
                this.calculateCounts();
                this.updateInterface();
            }
            
            await this.loadFromSupabase();
            this.updateInterface();
            
        } catch (error) {
            console.error('❌ Ошибка загрузки данных:', error);
            
            if (this.state.allVacancies.length === 0) {
                const cached = this.getCachedData();
                if (cached && cached.length > 0) {
                    this.state.allVacancies = cached;
                    this.calculateCounts();
                    this.updateInterface();
                    this.showNotification('Используем кэшированные данные', 'info');
                } else {
                    this.showError('Не удалось загрузить вакансии');
                }
            }
        }
    }

    // ==========================
    // ОТОБРАЖЕНИЕ ИНТЕРФЕЙСА
    // ==========================
    updateInterface() {
        if (this.state.allVacancies.length === 0) {
            this.showEmptyState();
            return;
        }

        // Анимация placeholder для поиска
        const input = document.getElementById('vacancy-search');
        if (input && this.state.allVacancies.length > 0) {
            const titles = this.state.allVacancies.map(v => v.title).filter(t => t && t.trim());
            if (titles.length > 0) {
                let i = 0;
                const update = () => {
                    input.placeholder = titles[i] || 'Название вакансии';
                    i = (i + 1) % titles.length;
                };
                update();
                if (this.state.placeholderInterval) clearInterval(this.state.placeholderInterval);
                this.state.placeholderInterval = setInterval(update, 1000);
            }
        }

        this.renderFilters();
        this.renderResults();
    }

    showEmptyState() {
        const results = document.getElementById('vacancy-results');
        if (results) {
            results.innerHTML = `
                <div style="text-align:center; padding: 60px 20px; color: #666;">
                    <div style="font-size: 48px; margin-bottom: 16px;">😔</div>
                    <h3 style="margin: 0 0 8px 0; color: #333;">Нет активных вакансий</h3>
                    <p style="margin: 0; opacity: 0.7;">Свяжитесь с HR-отделом для уточнения</p>
                </div>
            `;
        }
    }

    showError(message) {
        const results = document.getElementById('vacancy-results');
        if (results) {
            results.innerHTML = `
                <div style="text-align:center; padding: 40px 20px; color: #666;">
                    <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                    <h3 style="margin: 0 0 8px 0; color: #333;">${message}</h3>
                    <button onclick="location.reload()" style="
                        margin-top: 20px;
                        padding: 12px 24px;
                        background: #048868;
                        color: white;
                        border: none;
                        border-radius: 6px;
                        cursor: pointer;
                    ">Обновить страницу</button>
                </div>
            `;
        }
    }

    showNotification(message, type = 'info') {
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
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // ==========================
    // ФИЛЬТРЫ И ПОИСК
    // ==========================
    getAvailableProjects() {
        const projects = {};
        this.state.allVacancies.forEach(v => {
            const p = v.project || 'Без проекта';
            projects[p] = (projects[p] || 0) + 1;
        });
        return projects;
    }

    getAvailableDepartments() {
        const depts = {};
        this.state.allVacancies.forEach(v => {
            const d = v.department;
            depts[d] = (depts[d] || 0) + 1;
        });
        return depts;
    }

    renderFilters() {
        const projects = this.getAvailableProjects();
        const depts = this.getAvailableDepartments();
        
        // Десктопные фильтры
        const projectFilter = document.getElementById('project-filter');
        const deptFilter = document.getElementById('department-filter');
        
        if (projectFilter) {
            const dropdown = projectFilter.querySelector('.select-dropdown');
            const values = projectFilter.querySelector('.selected-values');
            
            if (dropdown) {
                dropdown.innerHTML = Object.entries(projects)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([project, count]) => {
                        const checked = this.state.currentProject.includes(project) ? 'checked' : '';
                        const id = `proj-${project.replace(/\s+/g, '-')}`;
                        return `
                            <div class="select-option">
                                <input type="checkbox" value="${project}" ${checked} id="${id}">
                                <label for="${id}">
                                    ${project} <span class="option-count">(${count})</span>
                                </label>
                            </div>
                        `;
                    }).join('');
            }
            
            if (values) {
                values.textContent = this.state.currentProject.length > 0 ? 
                    this.state.currentProject.join(', ') : 'Все проекты';
                projectFilter.classList.toggle('has-selection', this.state.currentProject.length > 0);
            }
        }
        
        if (deptFilter) {
            const dropdown = deptFilter.querySelector('.select-dropdown');
            const values = deptFilter.querySelector('.selected-values');
            
            if (dropdown) {
                dropdown.innerHTML = Object.entries(depts)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([dept, count]) => {
                        const checked = this.state.currentDepartment.includes(dept) ? 'checked' : '';
                        const id = `dept-${dept.replace(/\s+/g, '-')}`;
                        return `
                            <div class="select-option">
                                <input type="checkbox" value="${dept}" ${checked} id="${id}">
                                <label for="${id}">
                                    ${dept} <span class="option-count">(${count})</span>
                                </label>
                            </div>
                        `;
                    }).join('');
            }
            
            if (values) {
                values.textContent = this.state.currentDepartment.length > 0 ? 
                    this.state.currentDepartment.join(', ') : 'Все подразделения';
                deptFilter.classList.toggle('has-selection', this.state.currentDepartment.length > 0);
            }
        }
        
        // Мобильные фильтры
        this.renderMobileFilters();
        this.updateResetButtonVisibility();
        this.updateMobileApplyButton();
        this.updateClearButtonVisibility();
    }

    renderMobileFilters() {
        const projects = this.getAvailableProjects();
        const depts = this.getAvailableDepartments();
        
        const projContainer = document.getElementById('mobile-project-options');
        if (projContainer) {
            projContainer.innerHTML = Object.entries(projects)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([project, count]) => {
                    const checked = this.state.currentProject.includes(project) ? 'checked' : '';
                    const id = `mob-proj-${project.replace(/\s+/g, '-')}`;
                    return `
                        <label class="mobile-filter-option">
                            <input type="checkbox" value="${project}" ${checked} id="${id}">
                            <span>
                                ${project} <span class="option-count">(${count})</span>
                            </span>
                        </label>
                    `;
                }).join('');
        }
        
        const deptContainer = document.getElementById('mobile-dept-options');
        if (deptContainer) {
            deptContainer.innerHTML = Object.entries(depts)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([dept, count]) => {
                    const checked = this.state.currentDepartment.includes(dept) ? 'checked' : '';
                    const id = `mob-dept-${dept.replace(/\s+/g, '-')}`;
                    return `
                        <label class="mobile-filter-option">
                            <input type="checkbox" value="${dept}" ${checked} id="${id}">
                            <span>
                                ${dept} <span class="option-count">(${count})</span>
                            </span>
                        </label>
                    `;
                }).join('');
        }
        
        // Обновляем значения в мобильном интерфейсе
        const projectValue = document.querySelector('.filter-item[data-type="projects"] .filter-value');
        const deptValue = document.querySelector('.filter-item[data-type="departments"] .filter-value');
        
        if (projectValue) {
            projectValue.textContent = this.state.currentProject.length ? 
                this.state.currentProject.join(', ') : 'Все проекты';
        }
        if (deptValue) {
            deptValue.textContent = this.state.currentDepartment.length ? 
                this.state.currentDepartment.join(', ') : 'Все подразделения';
        }
    }

    renderResults() {
        const results = document.getElementById('vacancy-results');
        if (!results) return;
        
        const filtered = this.state.allVacancies.filter(vac => {
            const byProject = this.state.currentProject.length === 0 || 
                this.state.currentProject.includes(vac.project || 'Без проекта');
            const byDept = this.state.currentDepartment.length === 0 || 
                this.state.currentDepartment.includes(vac.department);
            const bySearch = this.state.currentQuery === '' || 
                (vac.title && vac.title.toLowerCase().includes(this.state.currentQuery)) || 
                (vac.description && vac.description.toLowerCase().includes(this.state.currentQuery));
            
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
                        
                        // 🔥 ВАЖНО: используем ID вакансии для ссылки
                        // Это лучше чем передавать title/project/department
                        const vacancyUrl = `/vacancy?id=${vac.id}`;
                        
                        return `
                            <div class="vacancy-card-wrapper">
                                <a href="${vacancyUrl}" class="vacancy-card">
                                    <div class="vacancy-content">
                                        <h3>${vac.title}</h3>
                                        <p class="vacancy-meta">${project} — ${vac.department}</p>
                                    </div>
                                    <span class="arrow-icon">→</span>
                                </a>
                            </div>
                        `;
                    }).join('')}
                `;
            })
            .join('');
        
        results.innerHTML = html;
    }

    // ==========================
    // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
    // ==========================
    updateResetButtonVisibility() {
        const hasFilters = this.state.currentProject.length > 0 || 
                          this.state.currentDepartment.length > 0 || 
                          this.state.currentQuery.trim();
        const resetBtn = document.getElementById('reset-all-filters');
        if (resetBtn) resetBtn.style.display = hasFilters ? 'block' : 'none';
    }

    updateMobileApplyButton() {
        const applyBtn = document.getElementById('apply-mobile-filters');
        if (!applyBtn) return;
        
        const hasFilters = this.state.currentProject.length > 0 || this.state.currentDepartment.length > 0;
        
        if (hasFilters) {
            applyBtn.textContent = 'Показать';
            applyBtn.style.background = '#048868';
        } else {
            applyBtn.textContent = 'Отменить';
            applyBtn.style.background = '#666';
        }
    }

    updateClearButtonVisibility() {
        const clearBtn = document.querySelector('.filter-clear-btn');
        if (clearBtn) {
            const hasSelection = this.state.currentProject.length > 0 || 
                                 this.state.currentDepartment.length > 0;
            clearBtn.classList.toggle('visible', hasSelection);
        }
    }

    closeMobileFilters() {
        const mobileModal = document.getElementById('mobile-filters-modal');
        if (mobileModal) {
            mobileModal.classList.remove('active');
            setTimeout(() => {
                mobileModal.style.display = 'none';
            }, 300);
        }
    }
}

// ==========================
// ИНИЦИАЛИЗАЦИЯ
// ==========================

// Инициализируем только на странице списка вакансий
if (window.location.pathname.includes('search-vacancy')) {
    window.vacancyListApp = new VacancyListApp();
}
