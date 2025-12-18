// UI компоненты и стили
export default {
    async init() {
        console.log('🎨 Инициализация UI компонентов...');
        
        const styles = `
            <style>
            .vacancy-container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 40px 20px;
                font-family: Arial, sans-serif;
            }
            .search-wrapper {
                margin: 40px 0 20px;
            }
            #vacancy-search {
                width: 100%;
                padding: 20px;
                font-size: 18px;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
            }
            .filters-row {
                display: flex;
                gap: 16px;
                margin: 30px 0;
            }
            .custom-select {
                flex: 1;
                position: relative;
            }
            .select-header {
                padding: 12px 16px;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                cursor: pointer;
            }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
        console.log('✅ Стили загружены');
    }
};
