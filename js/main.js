// Главный файл инициализации
export default {
    async init() {
        console.log('🎯 Главная инициализация приложения...');
        
        // Загружаем интеграцию с Tilda
        try {
            const tildaModule = await import('./tilda-integration.js?v=' + Date.now());
            await tildaModule.default.init();
        } catch (error) {
            console.log('ℹ️ Модуль Tilda integration не загружен');
        }
        
        // Скрываем лоадер и показываем контент
        const loader = document.getElementById('vacancy-app-loader');
        const container = document.getElementById('vacancy-app-container');
        
        if (loader) loader.style.display = 'none';
        if (container) container.style.display = 'block';
        
        console.log('✅ Приложение полностью загружено!');
        
        return {
            config: window.VACANCY_CONFIG,
            utils: window.vacancyUtils,
            supabase: window.supabaseClient,
            filters: window.filterSystem
        };
    }
};
