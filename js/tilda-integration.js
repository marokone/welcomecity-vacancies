// Интеграция с Tilda
export default {
    async init() {
        console.log('🔗 Инициализация интеграции с Tilda...');
        
        // Глобальные функции для Tilda
        window.showVacancyDetail = (vacancy) => {
            // Сохраняем данные вакансии
            sessionStorage.setItem('currentVacancy', JSON.stringify(vacancy));
            
            // Перенаправляем на детальную страницу Tilda
            const detailUrl = `https://welcomecity.ru/search-vacancy?vacancy=${encodeURIComponent(vacancy.title)}&project=${encodeURIComponent(vacancy.project || '')}&dept=${encodeURIComponent(vacancy.department)}`;
            window.location.href = detailUrl;
        };
        
        window.showVacancyList = () => {
            // Возврат к списку вакансий
            const savedHTML = sessionStorage.getItem('vacancyListHTML');
            if (savedHTML) {
                document.getElementById('vacancy-results').innerHTML = savedHTML;
                const savedScroll = sessionStorage.getItem('vacancyListScroll');
                if (savedScroll) window.scrollTo(0, parseInt(savedScroll));
            }
        };
        
        // Обработка URL параметров
        this.handleUrlParams();
        
        console.log('✅ Интеграция с Tilda настроена');
    },
    
    handleUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const vacancyTitle = urlParams.get('vacancy');
        
        if (vacancyTitle && window.filterSystem) {
            // Если открыта детальная страница, показываем соответствующую вакансию
            const savedVacancy = sessionStorage.getItem('currentVacancy');
            if (savedVacancy) {
                const vacancy = JSON.parse(savedVacancy);
                // Здесь можно показать модальное окно с деталями вакансии
                console.log('Детальная страница вакансии:', vacancy);
            }
        }
    }
};
