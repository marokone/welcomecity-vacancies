// Главный файл инициализации
export default {
    async init() {
        console.log('🎯 Главная инициализация приложения...');
        
        // Скрываем лоадер и показываем контент
        const loader = document.getElementById('vacancy-app-loader');
        const container = document.getElementById('vacancy-app-container');
        
        if (loader) loader.style.display = 'none';
        if (container) container.style.display = 'block';
        
        console.log('✅ Приложение полностью загружено!');
        
        return {
            config: window.VACANCY_CONFIG,
            utils: window.vacancyUtils,
            supabase: window.supabaseClient
        };
    }
};
