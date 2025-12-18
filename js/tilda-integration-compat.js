// Tilda Integration with Compatibility
class TildaIntegrationCompat {
    constructor() {
        this.isTildaEnvironment = window.location.hostname.includes('welcomecity.ru');
        this.currentVacancy = null;
        this.init();
    }

    init() {
        if (this.isTildaEnvironment) {
            this.setupEnhancedStyles();
            this.setupGlobalMethods();
            this.integrateWithExistingSystem();
        }
    }

    integrateWithExistingSystem() {
        // Интеграция с вашей существующей системой
        if (window.allVacancies) {
            console.log('✅ Интеграция с существующей системой вакансий');
        }
    }

    setupEnhancedStyles() {
        const styles = `
            /* Улучшенные стили модального окна */
            .vacancy-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                padding: 20px;
                backdrop-filter: blur(10px);
                animation: fadeIn 0.3s ease;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            .vacancy-modal {
                background: white;
                border-radius: 16px;
                max-width: 900px;
                width: 100%;
                max-height: 85vh;
                overflow-y: auto;
                position: relative;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                animation: slideUp 0.3s ease;
            }

            @keyframes slideUp {
                from { 
                    opacity: 0;
                    transform: translateY(30px) scale(0.95);
                }
                to { 
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            .vacancy-modal-close {
                position: absolute;
                top: 20px;
                right: 20px;
                background: rgba(0,0,0,0.1);
                border: none;
                font-size: 24px;
                cursor: pointer;
                z-index: 10001;
                width: 44px;
                height: 44px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                color: #666;
            }

            .vacancy-modal-close:hover {
                background: rgba(0,0,0,0.2);
                color: #333;
                transform: rotate(90deg);
            }

            .vacancy-modal-content {
                padding: 50px;
            }

            /* Совместимость с вашими стилями */
            .vacancy-modal .vacancy-title {
                font-family: 'ALSHaussNext', sans-serif !important;
                font-size: 42px !important;
                font-weight: 700 !important;
                color: #111 !important;
                margin-bottom: 24px !important;
                line-height: 1.2 !important;
            }

            .vacancy-modal .vacancy-meta {
                display: flex;
                gap: 16px;
                margin-bottom: 32px;
                flex-wrap: wrap;
            }

            .vacancy-modal .vacancy-meta span {
                background: #f8f9fa;
                padding: 8px 16px;
                border-radius: 8px;
                font-size: 14px;
                color: #666;
                border: 1px solid #f0f0f0;
            }

            .vacancy-modal .vacancy-section {
                margin-bottom: 32px;
            }

            .vacancy-modal .vacancy-section h3 {
                font-family: 'ALSHaussNext', sans-serif;
                font-size: 20px;
                font-weight: 600;
                margin-bottom: 16px;
                color: #111;
                padding-bottom: 8px;
                border-bottom: 2px solid #048868;
            }

            .vacancy-modal .vacancy-section div {
                font-family: 'ALSHaussNext', sans-serif;
                line-height: 1.6;
                color: #333;
                font-size: 16px;
            }

            .vacancy-modal .apply-button {
                background: #048868;
                color: white;
                border: none;
                padding: 18px 32px;
                border-radius: 12px;
                font-family: 'ALSHaussNext', sans-serif;
                font-size: 18px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                width: 100%;
                margin-top: 24px;
            }

            .vacancy-modal .apply-button:hover {
                background: #036b50;
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(4, 136, 104, 0.3);
            }

            @media (max-width: 768px) {
                .vacancy-modal-content {
                    padding: 30px 24px;
                }

                .vacancy-modal .vacancy-title {
                    font-size: 32px !important;
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

    setupGlobalMethods() {
        window.showVacancyDetail = (vacancy) => {
            this.openVacancyModal(vacancy);
        };

        window.closeVacancyModal = () => {
            this.closeVacancyModal();
        };

        // Совместимость с вашей системой
        window.tildaIntegration = this;
    }

    openVacancyModal(vacancy) {
        this.closeVacancyModal();
        this.currentVacancy = vacancy;

        const modalHTML = `
            <div class="vacancy-modal-overlay" onclick="if(event.target===this) window.closeVacancyModal()">
                <div class="vacancy-modal">
                    <button class="vacancy-modal-close" onclick="window.closeVacancyModal()">×</button>
                    <div class="vacancy-modal-content">
                        <h1 class="vacancy-title">${this.escapeHtml(vacancy.title)}</h1>
                        
                        <div class="vacancy-meta">
                            <span>${this.escapeHtml(vacancy.company || 'Welcome City')}</span>
                            <span>${this.escapeHtml(vacancy.department)}</span>
                            <span style="background: #e8f5e8; color: #048868; border-color: #048868;">
                                ${this.escapeHtml(vacancy.format || 'Формат не указан')}
                            </span>
                        </div>
                        
                        ${vacancy.description ? `
                            <div class="vacancy-section">
                                <h3>О вакансии</h3>
                                <div>${this.formatDescription(vacancy.description)}</div>
                            </div>
                        ` : ''}
                        
                        ${vacancy.requirements ? `
                            <div class="vacancy-section">
                                <h3>Требования</h3>
                                <div>${this.formatDescription(vacancy.requirements)}</div>
                            </div>
                        ` : ''}
                        
                        ${vacancy.responsibilities ? `
                            <div class="vacancy-section">
                                <h3>Обязанности</h3>
                                <div>${this.formatDescription(vacancy.responsibilities)}</div>
                            </div>
                        ` : ''}
                        
                        ${vacancy.conditions ? `
                            <div class="vacancy-section">
                                <h3>Условия</h3>
                                <div>${this.formatDescription(vacancy.conditions)}</div>
                            </div>
                        ` : ''}
                        
                        <button class="apply-button" onclick="window.handleVacancyApply(${vacancy.id})">
                            Откликнуться на вакансию
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.body.style.overflow = 'hidden';

        // Обновление URL
        const newUrl = `${window.location.pathname}?vacancy_id=${vacancy.id}`;
        window.history.pushState({ vacancy }, '', newUrl);
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

    formatDescription(text) {
        if (!text) return '<p>Информация не указана</p>';
        
        // Сохраняем ваше форматирование
        const paragraphs = text.split('\n').filter(p => p.trim());
        if (paragraphs.length === 0) return '<p>Информация не указана</p>';
        
        if (paragraphs.length === 1) {
            return `<p>${this.escapeHtml(paragraphs[0])}</p>`;
        }
        
        // Если текст содержит маркировку списка
        if (text.includes('•') || text.includes('-')) {
            const listItems = paragraphs.map(p => {
                const cleanText = p.replace(/^[•\-]\s*/, '').trim();
                return `<li>${this.escapeHtml(cleanText)}</li>`;
            }).join('');
            return `<ul style="padding-left: 20px; margin: 16px 0;">${listItems}</ul>`;
        }
        
        // Обычные параграфы
        return paragraphs.map(p => `<p>${this.escapeHtml(p)}</p>`).join('');
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
}

// Глобальный обработчик отклика
window.handleVacancyApply = (vacancyId) => {
    console.log('Отклик на вакансию:', vacancyId);
    
    // Интеграция с вашей формой Tilda
    const formBlock = document.getElementById('rec1479156901');
    if (formBlock) {
        // Активируем форму (ваша логика)
        formBlock.classList.add('form-active');
        const buttonBlock = document.getElementById('rec1480130341');
        if (buttonBlock) {
            buttonBlock.classList.add('button-hidden');
        }
        
        formBlock.scrollIntoView({ behavior: 'smooth' });
    }
    
    window.closeVacancyModal();
};

// Автоматическая инициализация
document.addEventListener('DOMContentLoaded', () => {
    new TildaIntegrationCompat();
});
