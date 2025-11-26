// Интеграция с Tilda
export default {
    async init() {
        console.log('🔗 Инициализация интеграции с Tilda...');
        
        // Глобальные функции для работы с Tilda
        window.showVacancyDetail = (vacancy) => {
            console.log('📄 Открываем детальную страницу вакансии:', vacancy.title);
            
            // Сохраняем данные вакансии для детальной страницы
            sessionStorage.setItem('currentVacancy', JSON.stringify(vacancy));
            sessionStorage.setItem('vacancyListScroll', window.scrollY);
            sessionStorage.setItem('vacancyListHTML', document.getElementById('vacancy-results').innerHTML);
            sessionStorage.setItem('vacancyListFilters', JSON.stringify({
                project: window.filterSystem?.currentProject || [],
                department: window.filterSystem?.currentDepartment || [],
                query: window.filterSystem?.currentQuery || ''
            }));
            
            // Перенаправляем на детальную страницу Tilda
            const detailUrl = `https://welcomecity.ru/search-vacancy?vacancy=${encodeURIComponent(vacancy.title)}&project=${encodeURIComponent(vacancy.project || '')}&dept=${encodeURIComponent(vacancy.department)}`;
            window.location.href = detailUrl;
        };
        
        // Обработка URL параметров (если открыта детальная страница)
        this.handleUrlParams();
        
        console.log('✅ Интеграция с Tilda настроена');
    },
    
    handleUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const vacancyTitle = urlParams.get('vacancy');
        
        if (vacancyTitle) {
            // Если открыта детальная страница, показываем соответствующую вакансию
            const savedVacancy = sessionStorage.getItem('currentVacancy');
            if (savedVacancy) {
                try {
                    const vacancy = JSON.parse(savedVacancy);
                    this.showVacancyModal(vacancy);
                } catch (error) {
                    console.error('Ошибка парсинга вакансии:', error);
                }
            }
        }
    },
    
    showVacancyModal(vacancy) {
        // Создаем модальное окно с деталями вакансии
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
        `;
        
        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 12px; max-width: 600px; width: 100%; max-height: 80vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="margin: 0; color: #048868;">${vacancy.title}</h2>
                    <button onclick="this.closest('[style]').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">×</button>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <p><strong>Проект:</strong> ${vacancy.project || 'Не указан'}</p>
                    <p><strong>Подразделение:</strong> ${vacancy.department}</p>
                </div>
                
                ${vacancy.description ? `<div style="margin-bottom: 20px;"><strong>Описание:</strong><p>${vacancy.description}</p></div>` : ''}
                ${vacancy.requirements ? `<div style="margin-bottom: 20px;"><strong>Требования:</strong><p>${vacancy.requirements}</p></div>` : ''}
                ${vacancy.responsibilities ? `<div style="margin-bottom: 20px;"><strong>Обязанности:</strong><p>${vacancy.responsibilities}</p></div>` : ''}
                ${vacancy.conditions ? `<div style="margin-bottom: 20px;"><strong>Условия:</strong><p>${vacancy.conditions}</p></div>` : ''}
                
                <button onclick="this.closest('[style]').remove(); window.history.back();" 
                        style="width: 100%; padding: 12px; background: #048868; color: white; border: none; border-radius: 6px; cursor: pointer; margin-top: 20px;">
                    ← Назад к списку
                </button>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
};
