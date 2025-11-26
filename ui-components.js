// UI компоненты и стили
export default {
    async init() {
        console.log('🎨 Инициализация UI компонентов...');
        
        const styles = `
            <style>
            /* Основные стили из вашего оригинального кода */
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
                border-bottom: 1px solid #e0e0e0;
                transition: border-color 0.3s ease;
            }
            
            .search-input-container:focus-within {
                border-bottom-color: #048868;
            }
            
            .search-icon {
                position: absolute;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
                width: 32px;
                height: 32px;
                opacity: 0.7;
            }
            
            #vacancy-search {
                width: 100%;
                padding: 20px 20px 20px 48px;
                font-size: 28px;
                border: none;
                outline: none;
                background: transparent;
            }
            
            #vacancy-search::placeholder {
                color: #ccc;
            }
            
            .search-hint {
                margin-top: 12px;
                font-size: 14px;
                color: #666;
                font-style: italic;
            }
            
            .filters-row {
                display: flex;
                gap: 16px;
                margin: 32px 0 24px;
            }
            
            .custom-select {
                position: relative;
                flex: 1;
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
                font-size: 14px;
            }
            
            .select-controls {
                display: flex;
                gap: 8px;
            }
            
            .clear-btn, .arrow-btn {
                color: #999;
                cursor: pointer;
                transition: color 0.3s ease;
            }
            
            .clear-btn:hover {
                color: #e74c3c;
            }
            
            .clear-btn {
                display: none;
            }
            
            .select-dropdown {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: white;
                border: 2px solid #048868;
                border-top: none;
                border-radius: 0 0 8px 8px;
                max-height: 200px;
                overflow-y: auto;
                z-index: 1000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                display: none;
            }
            
            .dropdown-item {
                display: flex;
                align-items: center;
                padding: 12px 16px;
                cursor: pointer;
                border-bottom: 1px solid #f0f0f0;
                transition: background-color 0.2s ease;
            }
            
            .dropdown-item:hover {
                background-color: #f8f9fa;
            }
            
            .dropdown-item input {
                margin-right: 12px;
            }
            
            .dropdown-item label {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: space-between;
                cursor: pointer;
            }
            
            .option-count {
                color: #999;
                font-size: 12px;
            }
            
            .mobile-filters-container {
                display: none;
                margin-bottom: 20px;
            }
            
            .mobile-filters-btn {
                width: 100%;
                padding: 12px 16px;
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                background: white;
                cursor: pointer;
                text-align: center;
            }
            
            .reset-btn {
                width: 100%;
                padding: 12px 20px;
                border: 1px solid #e0e0e0;
                border-radius: 6px;
                background: white;
                cursor: pointer;
                margin-bottom: 20px;
            }
            
            .reset-btn:hover {
                border-color: #048868;
                color: #048868;
            }
            
            .department-header {
                font-size: 28px;
                font-weight: 600;
                color: #111;
                margin: 32px 0 16px;
                padding-bottom: 8px;
                border-bottom: 1px solid #f0f0f0;
            }
            
            .dept-count {
                color: #999;
                font-size: 16px;
                font-weight: normal;
            }
            
            .vacancy-card-wrapper {
                margin-bottom: 8px;
            }
            
            .vacancy-card {
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: white;
                padding: 20px;
                border: none;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
                border-bottom: 1px solid #f0f0f0;
            }
            
            .vacancy-card::before {
                content: '';
                position: absolute;
                left: -8px;
                top: 0;
                height: 100%;
                width: 4px;
                background: #048868;
                transform: scaleX(0);
                transition: transform 0.3s ease;
            }
            
            .vacancy-card:hover {
                transform: translateX(8px);
                border-bottom-color: #048868;
            }
            
            .vacancy-card:hover::before {
                transform: scaleX(1);
            }
            
            .vacancy-content h3 {
                margin: 0 0 8px 0;
                color: #111;
            }
            
            .vacancy-meta {
                margin: 0;
                color: #666;
            }
            
            .arrow-icon {
                font-size: 18px;
                color: #999;
                margin-left: 16px;
                transition: all 0.3s ease;
                opacity: 0;
            }
            
            .vacancy-card:hover .arrow-icon {
                opacity: 1;
                color: #048868;
            }
            
            @media (max-width: 768px) {
                .filters-row {
                    display: none;
                }
                
                .mobile-filters-container {
                    display: block;
                }
                
                #vacancy-search {
                    font-size: 24px;
                    padding: 16px 16px 16px 44px;
                }
                
                .vacancy-card {
                    padding: 16px;
                    flex-direction: column;
                    align-items: flex-start;
                }
                
                .arrow-icon {
                    align-self: flex-end;
                    margin-top: 12px;
                    margin-left: 0;
                }
            }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
        console.log('✅ Стили загружены');
    }
};
