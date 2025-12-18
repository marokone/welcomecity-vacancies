// Вспомогательные функции
export default {
    async init() {
        console.log('🛠️ Инициализация утилит...');
        
        window.vacancyUtils = {
            // Функция для создания элемента
            createElement: (tag, classes, content) => {
                const element = document.createElement(tag);
                if (classes) element.className = classes;
                if (content) element.innerHTML = content;
                return element;
            },
            
            // Показать уведомление
            showNotification: (message, type = 'info') => {
                const notification = document.createElement('div');
                notification.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 12px 20px;
                    border-radius: 8px;
                    background: ${type === 'error' ? '#e74c3c' : '#048868'};
                    color: white;
                    z-index: 10000;
                    font-family: Arial, sans-serif;
                `;
                notification.textContent = message;
                document.body.appendChild(notification);
                
                setTimeout(() => {
                    notification.remove();
                }, 3000);
            },
            
            // Загрузка данных
            loadJSON: async (url) => {
                const response = await fetch(url);
                return await response.json();
            }
        };
        
        console.log('✅ Утилиты загружены');
    }
};
