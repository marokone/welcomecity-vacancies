// Работа с Supabase
export default {
    async init() {
        console.log('🔌 Инициализация Supabase...');
        
        if (!window.VACANCY_CONFIG) {
            throw new Error('Конфигурация не загружена');
        }
        
        const { supabase } = window.VACANCY_CONFIG;
        
        if (!window.supabase) {
            throw new Error('Supabase JS library not loaded');
        }
        
        window.supabaseClient = window.supabase.createClient(supabase.url, supabase.key);
        console.log('✅ Supabase клиент создан');
        return window.supabaseClient;
    }
};
