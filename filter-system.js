// Система фильтров
export default {
    async init() {
        console.log('🎛️ Инициализация системы фильтров...');
        
        class FilterSystem {
            constructor() {
                this.filters = new Map();
                this.activeFilters = {};
                this.vacancies = [];
            }
            
            async init() {
                await this.renderUI();
                this.bindEvents();
                await this.loadVacancies();
            }
            
            async renderUI() {
                const container = document.querySelector('#vacancy-app-container');
                if (!container) return;
                
                container.innerHTML = `
                    <div class="vacancy-container">
                        <div class="search-wrapper">
                            <div class="search-input-container">
                                <input type="text" id="vacancy-search" placeholder="Начните вводить название вакансии...">
                            </div>
                        </div>
                        
                        <div class="filters-row">
                            <div class="custom-select" id="project-filter">
                                <div class="select-header">
                                    <span class="selected-values">Все проекты</span>
                                    <div class="select-controls">
                                        <span class="clear-btn">×</span>
                                        <span class="arrow-btn">▼</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="custom-select" id="department-filter">
                                <div class="select-header">
                                    <span class="selected-values">Все подразделения</span>
                                    <div class="select-controls">
                                        <span class="clear-btn">×</span>
                                        <span class="arrow-btn">▼</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div id="vacancy-results">
                            <div style="text-align: center; padding: 40px; color: #666;">
                                Загружаем вакансии...
                            </div>
                        </div>
                    </div>
                `;
            }
            
            bindEvents() {
                // Поиск
                const searchInput = document.getElementById('vacancy-search');
                if (searchInput) {
                    searchInput.addEventListener('input', (e) => {
                        this.handleSearch(e.target.value);
                    });
                }
                
                console.log('✅ События привязаны');
            }
            
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
            }
            
            handleSearch(query) {
                console.log('Поиск:', query);
                // Здесь будет логика поиска
            }
            
            renderResults() {
                const resultsContainer = document.getElementById('vacancy-results');
                if (!resultsContainer) return;
                
                if (this.vacancies.length === 0) {
                    resultsContainer.innerHTML = `
                        <div style="text-align: center; padding: 40px; color: #666;">
                            Нет доступных вакансий
                        </div>
                    `;
                    return;
                }
                
                resultsContainer.innerHTML = this.vacancies.map(vacancy => `
                    <div class="vacancy-card">
                        <h3>${vacancy.title}</h3>
                        <p>${vacancy.project} — ${vacancy.department}</p>
                    </div>
                `).join('');
            }
        }
        
        // Инициализируем систему фильтров
        window.filterSystem = new FilterSystem();
        await window.filterSystem.init();
        
        console.log('✅ Система фильтров инициализирована');
    }
};
