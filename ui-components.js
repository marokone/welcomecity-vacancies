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
                font-family: 'ALSHaussNext', Arial, sans-serif;
            }
            
            .search-wrapper {
                margin: 40px 0 20px;
            }
            
            .search-input-container {
                position: relative;
            }
            
            #vacancy-search {
                width: 100%;
                padding: 20px 20px 20px 50px;
                font-size: 28px;
                border: none;
                border-bottom: 1px solid #e0e0e0;
                outline: none;
                background: transparent;
            }
            
            #vacancy-search::placeholder {
                color: #ccc;
            }
            
            .filters-row {
                display: flex;
                gap: 16px;
                margin: 32px 0 24px;
            }
            
            .custom-select {
                flex: 1;
                position: relative;
                min-width: 200px;
            }
            
            .select-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 16px;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                cursor: pointer;
                transition: border-color 0.3s ease;
            }
            
            .select-header:hover {
                border-color: #048868;
            }
            
            .selected-values {
                flex: 1;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            
            .select-controls {
                display: flex;
                gap: 8px;
            }
            
            .clear-btn, .arrow-btn {
                color: #999;
                cursor: pointer;
            }
            
            .clear-btn:hover {
                color: #e74c3c;
            }
            
            .vacancy-card {
                padding: 20px;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                margin-bottom: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .vacancy-card:hover {
                border-color: #048868;
                transform: translateX(4px);
            }
            
            .vacancy-card h3 {
                margin: 0 0 8px 0;
                color: #111;
            }
            
            .vacancy-card p {
                margin: 0;
                color: #666;
            }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
        console.log('✅ Стили загружены');
    }
};
