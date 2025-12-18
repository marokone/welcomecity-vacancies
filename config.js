// Конфигурация приложения
export default {
    async init() {
        console.log('⚙️ Инициализация конфигурации...');
        
        window.VACANCY_CONFIG = {
            supabase: {
                url: 'https://vhbiezamhpyejdqvvwuj.supabase.co',
                key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoYmllemFtaHB5ZWpkcXZ2d3VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2Njc0MDgsImV4cCI6MjA3NzI0MzQwOH0.13h_XJ7kQFtuCjavkOXN9TzXNF2X4jX5-rcNCFiFqO0'
            },
            cache: {
                ttl: 5 * 60 * 1000,
                key: 'wc-vacancies-data'
            },
            selectors: {
                container: '#vacancy-app-container',
                loader: '#vacancy-app-loader'
            }
        };
        
        console.log('✅ Конфигурация загружена');
    }
};
