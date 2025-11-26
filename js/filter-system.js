// Система фильтров
export default {
    async init() {
        console.log('🎛️ Инициализация системы фильтров...');

       handleVacancyClick(vacancy) {
    if (window.tildaIntegration && window.tildaIntegration.isTildaEnvironment) {
        // Используем модальное окно в Tilda
        window.showVacancyDetail(vacancy);
    } else {
        // GitHub Pages - обычное поведение
        window.open(`vacancy-detail.html?id=${vacancy.id}`, '_blank');
    }
}
        // Добавляем метод для обновления данных
updateVacancyData(data) {
    this.vacancyData = { ...this.vacancyData, ...data };
    if (window.updateVacancyData) {
        window.updateVacancyData(data);
    }
}
    
    if (vacancy) {
        // Используем функцию из Tilda интеграции
        if (window.showVacancyDetail) {
            window.showVacancyDetail(vacancy);
        } else {
            // Fallback
            alert(`Вакансия: ${vacancy.title}\nПроект: ${vacancy.project}\nОтдел: ${vacancy.department}`);
        }
    }
}
        
        const container = document.getElementById('vacancy-app-container');
        if (container) {
            container.innerHTML = `
                <div class="vacancy-container">
                    <h2 style="color: #048868;">✅ Модули успешно загружены!</h2>
                    <p>GitHub Pages работает корректно. Все модули загружены.</p>
                    
                    <div class="search-wrapper">
                        <input type="text" id="vacancy-search" placeholder="Поиск вакансий...">
                    </div>
                    
                    <div class="filters-row">
                        <div class="custom-select">
                            <div class="select-header">
                                <span>Все проекты</span>
                            </div>
                        </div>
                        <div class="custom-select">
                            <div class="select-header">
                                <span>Все подразделения</span>
                            </div>
                        </div>
                    </div>
                    
                    <div id="vacancy-results">
                        <p>Система готова к работе с вакансиями!</p>
                    </div>
                </div>
            `;
        }
        
        console.log('✅ Система фильтров инициализирована');
    }
};
