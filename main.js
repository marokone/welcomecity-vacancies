// Главный файл инициализации
export default {
    async init() {
        console.log('🎯 Главная инициализация приложения...');
        
        // Проверяем что все зависимости загружены
        if (!window.VACANCY_CONFIG) {
            throw new Error('Конфигурация не загружена');
        }
        
        if (!window.vacancyUtils) {
            throw new Error('Утилиты не загружены');
        }
        
        if (!window.supabaseClient) {
            throw new Error('Supabase клиент не загружен');
        }
        
        console.log('✅ Все зависимости загружены, приложение готово');
        
        // Можно добавить дополнительную логику инициализации здесь
        return {
            config: window.VACANCY_CONFIG,
            utils: window.vacancyUtils,
            supabase: window.supabaseClient,
            filters: window.filterSystem
        };
    }
};
