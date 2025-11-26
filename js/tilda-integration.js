// Tilda Integration Module - Адаптирован под вашу систему
class TildaIntegration {
    constructor() {
        this.isTildaEnvironment = window.location.hostname.includes('welcomecity.ru');
        this.currentVacancy = null;
        this.vacancyData = {
            allVacancies: [],
            currentProject: [],
            currentDepartment: [], 
            currentQuery: ''
        };
        this.init();
    }

    init() {
        if (this.isTildaEnvironment) {
            this.setupTildaStyles();
            this.setupGlobalMethods();
            this.handleUrlParameters();
            this.setupEventListeners();
        }
    }

    // Стили из вашего кода с адаптацией
    setupTildaStyles() {
        const styles = `
            /* Ваши CSS переменные */
            :root {
                --primary-color: #048868;
                --primary-hover: #036b50;
                --text-dark: #111;
                --text-gray: #666;
                --border-color: #e0e0e0;
                --background-white: #fff;
            }

            /* ФИКСЫ ДЛЯ TILDA - из вашего кода */
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

            /* Стили модального окна */
            .vacancy-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                padding: 20px;
                backdrop-filter: blur(4px);
            }

            .vacancy-modal {
                background: white;
                border-radius: 12px;
                max-width: 800px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                position: relative;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            }

            .vacancy-modal-close {
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                z-index: 10001;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(0,0,0,0.1);
                transition: all 0.3s ease;
            }

            .vacancy-modal-close:hover {
                background: rgba(0,0,0,0.2);
            }

            .vacancy-modal-content {
                padding: 40px;
            }

            /* Стили карточек из вашего кода */
            .vacancy-card-wrapper {
                margin-bottom: 12px;
            }

            .vacancy-card {
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: var(--background-white);
                padding: 20px;
                border: none;
                border-radius: 0;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
                border-bottom: 1px solid var(--border-light);
            }

            .vacancy-card::before {
                content: '';
                position: absolute;
                left: -8px;
                top: 0;
                height: 100%;
                width: 4px;
                background: var(--primary-color);
                transform: scaleX(0);
                transition: transform 0.3s ease;
            }

            .vacancy-card:hover {
                transform: translateX(8px);
                border-bottom-color: var(--primary-color);
            }

            .vacancy-card:hover::before {
                transform: scaleX(1);
            }

            .arrow-icon {
                font-size: 18px;
                color: var(--text-light);
                margin-left: 12px;
                flex-shrink: 0;
                transition: all 0.3s ease;
                opacity: 0;
            }

            .vacancy-card:hover .arrow-icon {
                opacity: 1;
                color: var(--primary-color);
            }

            /* Адаптивность */
            @media (max-width: 768px) {
                .vacancy-modal-content {
                    padding: 20px;
                }
                
                .vacancy-modal-overlay {
                    padding: 10px;
                }
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    // Глобальные методы
    setupGlobalMethods() {
        // Основной метод для показа деталей вакансии
        window.showVacancyDetail = (vacancy) => {
            if (this.isTildaEnvironment) {
                this.openVacancyModal(vacancy);
            } else {
                // Режим GitHub Pages
                window.open(`vacancy-detail.html?id=${vacancy.id}`, '_blank');
            }
        };

        window.closeVacancyModal = () => {
            this.closeVacancyModal();
        };

        // Методы для работы с данными
        window.updateVacancyData = (data) => {
            this.vacancyData = { ...this.vacancyData, ...data };
        };

        window.getVacancyData = () => {
            return this.vacancyData;
        };
    }

    // Обработка URL параметров (из вашего кода)
    handleUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const vacancyId = urlParams.get('vacancy_id');
        
        if (vacancyId) {
            this.loadAndShowVacancy(vacancyId);
        }
    }

    // Загрузка вакансии по ID
    async loadAndShowVacancy(vacancyId) {
        try {
            const { data: vacancy, error } = await window.supabaseClient
                .from('vacancies')
                .select('*')
                .eq('id', vacancyId)
                .single();

            if (error) throw error;
            if (vacancy) {
                this.openVacancyModal(vacancy);
            }
        } catch (error) {
            console.error('Error loading vacancy:', error);
        }
    }

    // Открытие модального окна (адаптировано под вашу логику)
    openVacancyModal(vacancy) {
        this.closeVacancyModal();
        this.currentVacancy = vacancy;

        const modalHTML = `
            <div class="vacancy-modal-overlay">
                <div class="vacancy-modal">
                    <button class="vacancy-modal-close" onclick="window.closeVacancyModal()">×</button>
                    <div class="vacancy-modal-content">
                        <h2 style="
                            font-family: 'ALSHaussNext', sans-serif;
                            font-size: 36px;
                            font-weight: 700;
                            color: var(--text-dark);
                            margin-bottom: 20px;
                            line-height: 1.2;
                        ">${this.escapeHtml(vacancy.title)}</h2>
                        
                        <div class="vacancy-meta" style="
                            display: flex;
                            gap: 20px;
                            margin-bottom: 30px;
                            flex-wrap: wrap;
                        ">
                            <span style="
                                background: #f0f0f0;
                                padding: 6px 12px;
                                border-radius: 6px;
                                font-size: 14px;
                                color: var(--text-dark);
                            ">${this.escapeHtml(vacancy.company || 'Welcome City')}</span>
                            
                            <span style="
                                background: #f0f0f0;
                                padding: 6px 12px;
                                border-radius: 6px;
                                font-size: 14px;
                                color: var(--text-dark);
                            ">${this.escapeHtml(vacancy.department)}</span>
                            
                            <span style="
                                background: #e8f5e8;
                                padding: 6px 12px;
                                border-radius: 6px;
                                font-size: 14px;
                                color: var(--primary-color);
                                font-weight: 500;
                            ">${this.escapeHtml(vacancy.salary || 'Зарплата не указана')}</span>
                        </div>
                        
                        ${vacancy.description ? `
                            <div class="vacancy-section" style="margin-bottom: 25px;">
                                <h3 style="
                                    font-family: 'ALSHaussNext', sans-serif;
                                    font-size: 20px;
                                    font-weight: 600;
                                    margin-bottom: 12px;
                                    color: var(--text-dark);
                                ">Описание вакансии</h3>
                                <div class="vacancy-description" style="
                                    font-family: 'ALSHaussNext', sans-serif;
                                    line-height: 1.6;
                                    color: var(--text-dark);
                                ">${this.formatDescription(vacancy.description)}</div>
                            </div>
                        ` : ''}
                        
                        ${vacancy.requirements ? `
                            <div class="vacancy-section" style="margin-bottom: 25px;">
                                <h3 style="
                                    font-family: 'ALSHaussNext', sans-serif;
                                    font-size: 20px;
                                    font-weight: 600;
                                    margin-bottom: 12px;
                                    color: var(--text-dark);
                                ">Требования</h3>
                                <div class="vacancy-requirements" style="
                                    font-family: 'ALSHaussNext', sans-serif;
                                    line-height: 1.6;
                                    color: var(--text-dark);
                                ">${this.formatDescription(vacancy.requirements)}</div>
                            </div>
                        ` : ''}
                        
                        ${vacancy.responsibilities ? `
                            <div class="vacancy-section" style="margin-bottom: 25px;">
                                <h3 style="
                                    font-family: 'ALSHaussNext', sans-serif;
                                    font-size: 20px;
                                    font-weight: 600;
                                    margin-bottom: 12px;
                                    color: var(--text-dark);
                                ">Обязанности</h3>
                                <div class="vacancy-responsibilities" style="
                                    font-family: 'ALSHaussNext', sans-serif;
                                    line-height: 1.6;
                                    color: var(--text-dark);
                                ">${this.formatDescription(vacancy.responsibilities)}</div>
                            </div>
                        ` : ''}
                        
                        ${vacancy.conditions ? `
                            <div class="vacancy-section" style="margin-bottom: 25px;">
                                <h3 style="
                                    font-family: 'ALSHaussNext', sans-serif;
                                    font-size: 20px;
                                    font-weight: 600;
                                    margin-bottom: 12px;
                                    color: var(--text-dark);
                                ">Условия</h3>
                                <div class="vacancy-conditions" style="
                                    font-family: 'ALSHaussNext', sans-serif;
                                    line-height: 1.6;
                                    color: var(--text-dark);
                                ">${this.formatDescription(vacancy.conditions)}</div>
                            </div>
                        ` : ''}
                        
                        <div class="vacancy-actions" style="
                            margin-top: 30px;
                            padding-top: 20px;
                            border-top: 1px solid var(--border-color);
                        ">
                            <button class="apply-button" onclick="window.handleVacancyApply(${vacancy.id})" style="
                                background: var(--primary-color);
                                color: white;
                                border: none;
                                padding: 15px 30px;
                                border-radius: 8px;
                                font-family: 'ALSHaussNext', sans-serif;
                                font-size: 16px;
                                font-weight: 600;
                                cursor: pointer;
                                transition: background 0.3s ease;
                                width: 100%;
                            " onmouseover="this.style.background='var(--primary-hover)'" 
                               onmouseout="this.style.background='var(--primary-color)'">
                                Откликнуться на вакансию
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.body.style.overflow = 'hidden';
        
        // Обновление URL
        const newUrl = `${window.location.pathname}?vacancy_id=${vacancy.id}`;
        window.history.pushState({}, '', newUrl);
    }

    closeVacancyModal() {
        const existingModal = document.querySelector('.vacancy-modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.style.overflow = '';
        this.currentVacancy = null;
        
        // Очистка параметров URL
        if (window.location.search.includes('vacancy_id')) {
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }
    }

    // Вспомогательные методы из вашего кода
    formatDescription(text) {
        if (!text) return '';
        return this.escapeHtml(text).replace(/\n/g, '<br>');
    }

    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    setupEventListeners() {
        // Обработчик кнопки "Назад" в браузере
        window.addEventListener('popstate', () => {
            this.closeVacancyModal();
        });

        // Глобальный обработчик Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeVacancyModal();
            }
        });
    }
}

// Глобальные методы для интеграции с вашей системой
window.handleVacancyApply = (vacancyId) => {
    // Логика отклика на вакансию
    console.log('Отклик на вакансию:', vacancyId);
    
    // Можно интегрировать с вашей формой Tilda
    const formBlock = document.getElementById('rec1479156901');
    if (formBlock) {
        formBlock.scrollIntoView({ behavior: 'smooth' });
    }
    
    window.closeVacancyModal();
};

// Инициализация
window.tildaIntegration = new TildaIntegration();
