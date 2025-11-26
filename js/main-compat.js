// Main Compatible Loader
class MainCompatLoader {
    constructor() {
        this.modules = [
            'config.js',
            'utils.js',
            'supabase-client.js',
            'ui-components.js',
            'filter-system.js',
            'tilda-integration-compat.js'
        ];
        this.baseUrl = 'https://marokone.github.io/welcomecity-vacancies/js/';
        this.init();
    }

    async init() {
        console.log('🚀 Загрузка модульной системы...');
        
        try {
            await this.loadModules();
            await this.initializeSystem();
            this.setupFallback();
            
            console.log('✅ Модульная система успешно загружена');
            this.showSuccessNotification();
            
        } catch (error) {
            console.error('❌ Ошибка загрузки модулей:', error);
            this.activateFallback();
        }
    }

    async loadModules() {
        for (const module of this.modules) {
            try {
                await import(`${this.baseUrl}${module}`);
                console.log(`✅ Модуль загружен: ${module}`);
            } catch (error) {
                console.warn(`⚠️ Модуль не загружен: ${module}`, error);
                // Продолжаем загрузку других модулей
            }
        }
    }

    async initializeSystem() {
        // Ждем инициализации всех компонентов
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
            if (window.supabaseClient && window.filterSystem) {
                await window.filterSystem.initialize();
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (attempts === maxAttempts) {
            throw new Error('Таймаут инициализации системы');
        }
    }

    setupFallback() {
        // Глобальный обработчик ошибок
        window.addEventListener('error', (event) => {
            console.error('Глобальная ошибка:', event.error);
            this.activateFallback();
        });
    }

    activateFallback() {
        console.log('🔄 Активация резервной системы...');
        // Здесь можно добавить логику возврата к старой системе
        if (window.migrationBridge) {
            window.migrationBridge.revertToOldSystem();
        }
    }

    showSuccessNotification() {
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: #27ae60;
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                font-family: 'ALSHaussNext', sans-serif;
                font-size: 14px;
                z-index: 10002;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                animation: slideInRight 0.3s ease;
            ">
                ✅ Система вакансий обновлена
            </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Автоматическая инициализация
document.addEventListener('DOMContentLoaded', () => {
    // Даем время на загрузку оригинальной системы
    setTimeout(() => {
        window.mainCompatLoader = new MainCompatLoader();
    }, 1000);
});
