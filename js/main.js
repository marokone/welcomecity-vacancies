// Main Vacancy Application - AVITO STYLE WITHOUT HIGHLIGHTS
class VacancyApp {
    constructor() {
        this.config = {
            supabaseUrl: 'SUPABASE_URL_PLACEHOLDER',
            supabaseKey: 'SUPABASE_KEY_PLACEHOLDER',
            cacheKeys: {
                data: 'wc-vacancies-data',
                timestamp: 'wc-vacancies-timestamp'
            },
            cacheTTL: 5 * 60 * 1000
        };
        
        this.state = {
            allVacancies: [],
            currentProject: [],
            currentDepartment: [],
            currentQuery: '',
            currentVacancy: null,
            placeholderInterval: null,
            supabase: null,
            realtimeSubscription: null,
            projectCounts: {},
            deptCounts: {}
        };
        
        this.init();
    }

    async init() {
        console.log('🚀 Инициализация системы вакансий...');
        
        this.fixTildaStyles();
        this.setupEventListeners();
        this.initializeSupabase();
        this.initializeTildaIntegration();
        await this.loadVacanciesData();
        this.initializeFormAnimation();
        
        console.log('✅ Система готова');
    }

    // ========== НОВЫЙ МЕТОД: Исправление высоты .t396 для планшетов ==========
    fixTabletT396Heights() {
        // Блоки с деталями вакансий
        const detailBlocks = [
            'rec1480130241',
            'rec1480130251', 
            'rec1480130271',
            'rec1480130281',
            'rec1480348491',
            'rec1480130341',
            'rec1513289611'
        ];
        
        let fixedCount = 0;
        
        detailBlocks.forEach(id => {
            const block = document.getElementById(id);
            if (block) {
                const t396 = block.querySelector('.t396, .t396__artboard');
                if (t396 && t396.offsetHeight === 0) {
                    // Минимальный фикс: только то, что нужно
                    t396.style.height = 'auto';
                    t396.style.minHeight = '100px';
                    fixedCount++;
                }
            }
        });
        
        if (fixedCount > 0) {
            console.log(`Исправлено ${fixedCount} .t396 блоков для планшета`);
        }
    }
    // ========== КОНЕЦ НОВОГО МЕТОДА ==========

    // ========== ВАШ СУЩЕСТВУЮЩИЙ КОД ==========
    fixTildaStyles() {
        const fixes = `
            .t-records_overflow-hidden,
            .t-records,
            .t-body {
                overflow: visible !important;
                height: auto !important;
                min-height: 100vh !important;
            }

            .t396, .t396__artboard,
            #rec1480064551 .t396,
            #rec1475773601 .t396 {
                height: auto !important;
                min-height: auto !important;
                overflow: visible !important;
            }

            #rec1480064551 {
                position: relative !important;
                z-index: 1 !important;
            }

            .vacancy-container {
                max-width: 1200px !important;
                margin: 0 auto !important;
                padding: 40px 20px !important;
            }
        `;

        const style = document.createElement('style');
        style.textContent = fixes;
        document.head.appendChild(style);
    }

    setupEventListeners() {
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.vacancy-card');
            if (card) {
                const key = decodeURIComponent(card.dataset.key);
                const [title, project, department] = key.split('|');
                const vac = this.state.allVacancies.find(v => 
                    v.title === title && 
                    (v.project || '') === (project || '') && 
                    v.department === department
                );
                if (vac) this.showVacancyDetail(vac);
            }
        });

        const searchInput = document.getElementById('vacancy-search');
        if (searchInput) {
            searchInput.addEventListener('input', e => {
                this.state.currentQuery = e.target.value.toLowerCase();
                this.renderResults();
            });
        }

        const resetBtn = document.getElementById('reset-all-filters');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.state.currentProject = [];
                this.state.currentDepartment = [];
                this.state.currentQuery = '';
                const searchInput = document.getElementById('vacancy-search');
                if (searchInput) searchInput.value = '';
                this.renderFilters();
                this.renderResults();
            });
        }

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
                    }
                    if (id === 'department-filter') {
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

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.custom-select')) {
                document.querySelectorAll('.custom-select').forEach(select => {
                    select.classList.remove('active');
                    const dropdown = select.querySelector('.select-dropdown');
                    if (dropdown) dropdown.style.display = 'none';
                });
            }
        });

        this.setupMobileFilters();

        document.addEventListener('click', (e) => {
            if (e.target.closest('.back-to-list-btn')) {
                this.showVacancyList();
            }
        });

        window.addEventListener('popstate', (e) => {
            const urlParams = new URLSearchParams(window.location.search);
            const title = urlParams.get('vacancy');
            const project = urlParams.get('project') || '';
            const dept = urlParams.get('dept');

            if (title && this.state.allVacancies.length > 0) {
                const vac = this.state.allVacancies.find(v => 
                    v.title === title && 
                    (v.project || '') === project && 
                    v.department === dept
                );
                if (vac) {
                    this.showVacancyDetail(vac);
                    return;
                }
            }
            this.showVacancyList();
        });
    }

    setupMobileFilters() {
        const mobileModal = document.getElementById('mobile-filters-modal');
        const projectDropdown = document.getElementById('mobile-project-dropdown');
        const deptDropdown = document.getElementById('mobile-dept-dropdown');

        const mobileFiltersBtn = document.getElementById('mobile-filters-btn');
        if (mobileFiltersBtn) {
            mobileFiltersBtn.addEventListener('click', () => {
                this.renderMobileFilters();
                this.updateMobileApplyButton();
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
                    this.closeMobileFilters();
                } else {
                    this.closeMobileFilters();
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
                
                const projectFilter = document.getElementById('project-filter');
                const deptFilter = document.getElementById('department-filter');
                
                if (projectFilter) {
                    if (this.state.currentProject.length > 0) {
                        projectFilter.classList.add('has-selection');
                    } else {
                        projectFilter.classList.remove('has-selection');
                    }
                }
                
                if (deptFilter) {
                    if (this.state.currentDepartment.length > 0) {
                        deptFilter.classList.add('has-selection');
                    } else {
                        deptFilter.classList.remove('has-selection');
                    }
                }
                
                this.renderMobileFilters();
                this.updateMobileApplyButton();
                this.updateClearButtonVisibility();
                
                // НЕ закрываем dropdown после выбора - оставляем для множественного выбора
            }
        });
    }

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
            created_at: data.created_at
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
            
            const currentCount = this.state.allVacancies.length;
            const newCount = formattedVacancies.length;
            
            if (currentCount !== newCount || JSON.stringify(this.state.allVacancies) !== JSON.stringify(formattedVacancies)) {
                this.state.allVacancies = formattedVacancies;
                this.saveToCache(this.state.allVacancies);
                this.calculateCounts();
                
                if (currentCount > 0) {
                    console.log('🔄 Данные обновлены, перерисовываем интерфейс');
                    this.updateInterface();
                    this.showNotification('Данные обновлены', 'success');
                } else {
                    this.updateInterface();
                }
            } else {
                console.log('✅ Данные актуальны, обновление не требуется');
            }
            
            console.log('✅ Загружено из Supabase:', this.state.allVacancies.length, 'вакансий');
            
            if (!this.state.realtimeSubscription) {
                this.startRealtimeSubscription();
            }
            
        } else {
            console.log('ℹ️ В Supabase нет вакансий');
            this.state.allVacancies = [];
            this.saveToCache([]);
            this.updateInterface();
        }
        
        this.hideLoader();
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

    startRealtimeSubscription() {
        if (!this.state.supabase || this.state.realtimeSubscription) return;
        
        try {
            this.state.realtimeSubscription = this.state.supabase
                .channel('vacancies-changes')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'vacancies'
                    },
                    (payload) => {
                        console.log('🔔 Realtime обновление:', payload.eventType, payload.new);
                        this.handleRealtimeUpdate(payload);
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

    handleRealtimeUpdate(payload) {
        const { eventType, new: newData, old: oldData } = payload;
        
        switch (eventType) {
            case 'INSERT':
                if (newData.status === 'active') {
                    const newVacancy = this.formatVacancyData(newData);
                    this.state.allVacancies.unshift(newVacancy);
                    this.saveToCache(this.state.allVacancies);
                    this.calculateCounts();
                    this.updateInterface();
                    this.showNotification('Добавлена новая вакансия', 'success');
                }
                break;
                
            case 'UPDATE':
                const index = this.state.allVacancies.findIndex(v => v.id === newData.id);
                if (index !== -1) {
                    if (newData.status === 'active') {
                        this.state.allVacancies[index] = this.formatVacancyData(newData);
                    } else {
                        this.state.allVacancies.splice(index, 1);
                    }
                    this.saveToCache(this.state.allVacancies);
                    this.calculateCounts();
                    this.updateInterface();
                    this.showNotification('Вакансия обновлена', 'info');
                }
                break;
                
            case 'DELETE':
                const deleteIndex = this.state.allVacancies.findIndex(v => v.id === oldData.id);
                if (deleteIndex !== -1) {
                    this.state.allVacancies.splice(deleteIndex, 1);
                    this.saveToCache(this.state.allVacancies);
                    this.calculateCounts();
                    this.updateInterface();
                    this.showNotification('Вакансия удалена', 'info');
                }
                break;
        }
    }

    async loadVacanciesData() {
        this.showLoader();
        
        try {
            const cachedVacancies = this.getCachedData();
            if (cachedVacancies && cachedVacancies.length > 0) {
                this.state.allVacancies = cachedVacancies;
                this.calculateCounts();
                this.updateInterface();
                this.hideLoader();
            }
            
            await this.loadFromSupabase();
            
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
            
            this.hideLoader();
        }
    }

    showLoader() {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) spinner.style.display = 'flex';
        const results = document.getElementById('vacancy-results');
        if (results) results.style.display = 'none';
    }

    hideLoader() {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) spinner.style.display = 'none';
        const results = document.getElementById('vacancy-results');
        if (results) results.style.display = 'block';
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
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    showError(message) {
        const results = document.getElementById('vacancy-results');
        if (results) {
            results.innerHTML = `
                <div style="text-align:center; padding: 40px 20px; color: #666;">
                    <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
                    <h3 style="margin: 0 0 8px 0; color: #333;">${message}</h3>
                    <p style="margin: 0; opacity: 0.7;">Попробуйте обновить страницу</p>
                    <button onclick="window.vacancyApp.loadVacanciesData()" style="
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

    updateInterface() {
        if (this.state.allVacancies.length === 0) {
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
            return;
        }

        const input = document.getElementById('vacancy-search');
        if (input && this.state.allVacancies.length > 0) {
            const titles = this.state.allVacancies.map(v => v.title).filter(t => t && t.trim());
            let i = 0;
            const update = () => {
                input.placeholder = titles[i] || 'Название вакансии';
                i = (i + 1) % (titles.length || 1);
            };
            if (titles.length > 0) {
                update();
                if (this.state.placeholderInterval) clearInterval(this.state.placeholderInterval);
                this.state.placeholderInterval = setInterval(update, 1000);
            }
        }

        const urlParams = new URLSearchParams(window.location.search);
        const title = urlParams.get('vacancy');
        const project = urlParams.get('project') || '';
        const dept = urlParams.get('dept');

        if (title && this.state.allVacancies.length > 0) {
            const vac = this.state.allVacancies.find(v => 
                v.title === title && 
                (v.project || '') === project && 
                v.department === dept
            );
            if (vac) {
                setTimeout(() => {
                    this.showVacancyDetail(vac);
                }, 100);
                return;
            }
        }

        const vacancyContainer = document.querySelector('.vacancy-container');
        if (vacancyContainer) vacancyContainer.style.display = 'block';
        
        this.renderFilters();
        this.renderResults();
        this.updateClearButtonVisibility();
    }

    getAvailableProjects(selectedDepts = []) {
        const projects = {};
        this.state.allVacancies.forEach(v => {
            const d = v.department;
            const p = v.project || 'Без проекта';
            if (selectedDepts.length === 0 || selectedDepts.includes(d)) {
                projects[p] = (projects[p] || 0) + 1;
            }
        });
        return projects;
    }

    getAvailableDepartments(selectedProjects = []) {
        const depts = {};
        this.state.allVacancies.forEach(v => {
            const p = v.project || 'Без проекта';
            const d = v.department;
            if (selectedProjects.length === 0 || selectedProjects.includes(p)) {
                depts[d] = (depts[d] || 0) + 1;
            }
        });
        return depts;
    }

    renderFilters() {
        console.log('🎛️ Rendering filters...');
        
        const projects = this.getAvailableProjects(this.state.currentDepartment);
        const depts = this.getAvailableDepartments(this.state.currentProject);
        
        const projectFilter = document.getElementById('project-filter');
        const deptFilter = document.getElementById('department-filter');
        
        if (projectFilter) {
            const projDropdown = projectFilter.querySelector('.select-dropdown');
            const projValues = projectFilter.querySelector('.selected-values');
            
            if (projDropdown) {
                projDropdown.innerHTML = Object.entries(projects)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([project, count]) => {
                        const checked = this.state.currentProject.includes(project) ? 'checked' : '';
                        return `
                            <div class="select-option">
                                <input type="checkbox" value="${project}" ${checked} id="proj-${project.replace(/\s+/g, '-')}">
                                <label for="proj-${project.replace(/\s+/g, '-')}">
                                    ${project} <span class="option-count">(${count})</span>
                                </label>
                            </div>
                        `;
                    }).join('');
            }
            
            if (projValues) {
                if (this.state.currentProject.length > 0) {
                    projValues.textContent = this.state.currentProject.join(', ');
                    projectFilter.classList.add('has-selection');
                } else {
                    projValues.textContent = 'Все проекты';
                    projectFilter.classList.remove('has-selection');
                }
            }
        }
        
        if (deptFilter) {
            const deptDropdown = deptFilter.querySelector('.select-dropdown');
            const deptValues = deptFilter.querySelector('.selected-values');
            
            if (deptDropdown) {
                deptDropdown.innerHTML = Object.entries(depts)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([dept, count]) => {
                        const checked = this.state.currentDepartment.includes(dept) ? 'checked' : '';
                        return `
                            <div class="select-option">
                                <input type="checkbox" value="${dept}" ${checked} id="dept-${dept.replace(/\s+/g, '-')}">
                                <label for="dept-${dept.replace(/\s+/g, '-')}">
                                    ${dept} <span class="option-count">(${count})</span>
                                </label>
                            </div>
                        `;
                    }).join('');
            }
            
            if (deptValues) {
                if (this.state.currentDepartment.length > 0) {
                    deptValues.textContent = this.state.currentDepartment.join(', ');
                    deptFilter.classList.add('has-selection');
                } else {
                    deptValues.textContent = 'Все подразделения';
                    deptFilter.classList.remove('has-selection');
                }
            }
        }
        
        this.renderMobileFilters();
        this.updateResetButtonVisibility();
        this.updateMobileApplyButton();
        this.updateClearButtonVisibility();
    }

    renderMobileFilters() {
        const projects = this.getAvailableProjects(this.state.currentDepartment);
        const depts = this.getAvailableDepartments(this.state.currentProject);
        
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
        if (!results) {
            console.error('❌ Element #vacancy-results not found!');
            return;
        }
        
        console.log('📄 Rendering results...');
        
        if (this.state.allVacancies.length === 0) {
            results.innerHTML = '<p style="text-align:center;color:#999;padding:40px 0;">Нет доступных вакансий</p>';
            return;
        }
        
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
        
        console.log(`Filtered vacancies: ${filtered.length} out of ${this.state.allVacancies.length}`);
        
        if (filtered.length === 0) {
            results.innerHTML = `
                <div style="text-align:center;color:#999;padding:40px 0;">
                    <p>Вакансий не найдено</p>
                    <p style="font-size:14px;margin-top:8px;">Попробуйте изменить параметры поиска</p>
                </div>
            `;
            this.updateResetButtonVisibility();
            this.updateMobileApplyButton();
            this.updateClearButtonVisibility();
            return;
        }
        
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
        
        this.updateResetButtonVisibility();
        this.updateMobileApplyButton();
        this.updateClearButtonVisibility();
    }

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
        
        const hasSelection = this.state.currentProject.length > 0 || 
                             this.state.currentDepartment.length > 0;
        
        if (clearBtn) {
            if (hasSelection) {
                clearBtn.classList.add('visible');
            } else {
                clearBtn.classList.remove('visible');
            }
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
// ========== ОБНОВЛЕННЫЙ МЕТОД showVacancyDetail ==========
showVacancyDetail(vacancy) {
    sessionStorage.setItem('vacancyListScroll', window.scrollY);
    sessionStorage.setItem('vacancyListHTML', document.getElementById('vacancy-results').innerHTML);
    sessionStorage.setItem('vacancyListFilters', JSON.stringify({
        project: this.state.currentProject,
        department: this.state.currentDepartment,
        query: this.state.currentQuery
    }));
    
    this.state.currentVacancy = vacancy;
    window.scrollTo(0, 0);
    
    // Скрываем основные блоки
    const vacancyContainer = document.querySelector('.vacancy-container');
    if (vacancyContainer) vacancyContainer.style.display = 'none';
    
    const headerBlock = document.getElementById('rec1480064551');
    if (headerBlock) headerBlock.style.display = 'none';
    
    const secondBlock = document.getElementById('rec1475773601');
    if (secondBlock) secondBlock.style.display = 'none';
    
    // Показываем детальные блоки
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
            
            // СРАЗУ активируем .t396 внутри каждого блока
            const t396Elements = block.querySelectorAll('.t396, .t396__artboard');
            t396Elements.forEach(el => {
                if (el.offsetHeight === 0) {
                    el.style.height = 'auto';
                    el.style.minHeight = '100px';
                }
            });
        }
    });
    
    if (!foundAny) {
        console.log('Ни один детальный блок не найден!');
        return;
    } // ← ЭТОЙ ЗАКРЫВАЮЩЕЙ СКОБКИ НЕ ХВАТАЛО
    
    // Заполняем контент
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
    
    // Дополнительный фикс для планшетов (на всякий случай)
    setTimeout(() => {
        // Ваш метод updateTildaAccordion если есть
        if (this.updateTildaAccordion) {
            this.updateTildaAccordion();
        }
        
        // Дополнительный вызов фикса для планшетов
        const isTablet = window.innerWidth >= 700 && window.innerWidth <= 1000;
        if (isTablet && this.fixTabletT396Heights) {
            setTimeout(() => {
                this.fixTabletT396Heights();
            }, 100);
        }
    }, 300);
    
    // Обновляем URL
    const newUrl = `${window.location.pathname}?vacancy=${encodeURIComponent(vacancy.title)}&project=${encodeURIComponent(vacancy.project || '')}&dept=${encodeURIComponent(vacancy.department)}`;
    history.pushState({ vacancy }, '', newUrl);
},
// ========== КОНЕЦ МЕТОДА showVacancyDetail ==========

window.vacancyApp = new VacancyApp();
