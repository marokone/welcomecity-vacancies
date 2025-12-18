// ==========================
// Vacancy Page App - Страница отдельной вакансии
// ==========================

class VacancyPageApp {
    constructor() {
        this.state = {
            vacancy: null,
            isLoading: true,
            supabase: null
        };
        
        this.init();
    }

    async init() {
        console.log('🚀 Инициализация страницы вакансии...');
        
        // Получаем ID вакансии из URL
        const urlParams = new URLSearchParams(window.location.search);
        const vacancyId = urlParams.get('id');
        
        if (!vacancyId) {
            this.showError('Вакансия не найдена');
            return;
        }
        
        // Показываем заглушки
        this.showSkeletons();
        
        // Инициализируем Supabase
        if (!this.initializeSupabase()) {
            this.showError('Ошибка подключения к базе данных');
            return;
        }
        
        // Загружаем вакансию
        await this.loadVacancy(vacancyId);
        
        if (this.state.vacancy) {
            this.updatePageContent();
            this.updateMetaTags();
            this.setupFormAnimation();
            this.setupBackButton();
        } else {
            this.showError('Вакансия не найдена или была удалена');
        }
        
        console.log('✅ Страница вакансии готова');
    }

    initializeSupabase() {
        if (window.supabase) {
            this.state.supabase = window.supabase;
            return true;
        }
        return false;
    }

    async loadVacancy(id) {
        try {
            console.log('📡 Загрузка вакансии ID:', id);
            
            const { data, error } = await this.state.supabase
                .from('vacancies')
                .select('*')
                .eq('id', id)
                .eq('status', 'active')
                .single();
            
            if (error) {
                console.error('❌ Ошибка загрузки вакансии:', error);
                return null;
            }
            
            if (data) {
                this.state.vacancy = this.formatVacancyData(data);
                console.log('✅ Вакансия загружена:', this.state.vacancy.title);
                return this.state.vacancy;
            }
            
            return null;
            
        } catch (error) {
            console.error('❌ Ошибка при загрузке вакансии:', error);
            return null;
        }
    }

    formatVacancyData(data) {
        const description = data.description || '';
        const cleanDescription = description.replace(/<[^>]*>/g, '');
        
        return {
            id: data.id,
            title: data.title || 'Без названия',
            project: data.project || data.project_name || 'Без проекта',
            department: data.department || 'Без отдела',
            description: data.description || '',
            requirements: data.requirements || '',
            responsibilities: data.responsibilities || '',
            conditions: data.conditions || '',
            format: data.format || 'Не указан',
            created_at: data.created_at,
            // SEO данные
            seo_title: data.seo_title || `${data.title} - Вакансия в Welcome City`,
            seo_description: data.seo_description || 
                (cleanDescription ? cleanDescription.substring(0, 160) + '...' : 
                 'Присоединяйтесь к нашей команде!')
        };
    }

    showSkeletons() {
        // Добавляем CSS для скелетонов
        const style = document.createElement('style');
        style.textContent = `
            .skeleton {
                background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                background-size: 200% 100%;
                animation: loading 1.5s infinite;
                border-radius: 4px;
            }
            .skeleton-title {
                height: 48px;
                width: 70%;
                margin-bottom: 20px;
            }
            .skeleton-text {
                height: 20px;
                margin-bottom: 10px;
            }
            .skeleton-text.short { width: 60%; }
            .skeleton-text.medium { width: 80%; }
            .skeleton-text.long { width: 90%; }
            @keyframes loading {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
        `;
        document.head.appendChild(style);
        
        // Заменяем контент на скелетоны
        const titleEl = document.querySelector('.vacancy-title');
        if (titleEl) {
            titleEl.innerHTML = '<div class="skeleton skeleton-title"></div>';
        }
        
        const contentElements = [
            '.vacancy-description',
            '.vacancy-requirements', 
            '.vacancy-responsibilities',
            '.vacancy-conditions'
        ];
        
        contentElements.forEach(selector => {
            const el = document.querySelector(selector);
            if (el) {
                el.innerHTML = `
                    <div class="skeleton skeleton-text long"></div>
                    <div class="skeleton skeleton-text medium"></div>
                    <div class="skeleton skeleton-text short"></div>
                `;
            }
        });
    }

    updatePageContent() {
        const vacancy = this.state.vacancy;
        if (!vacancy) return;
        
        // 1. Заголовок
        const titleEl = document.querySelector('.vacancy-title');
        if (titleEl) {
            titleEl.textContent = vacancy.title;
        }
        
        // 2. Описание
        const descEl = document.querySelector('.vacancy-description');
        if (descEl) {
            descEl.innerHTML = vacancy.description || '<p>Описание не указано</p>';
        }
        
        // 3. Требования
        const reqEl = document.querySelector('.vacancy-requirements');
        if (reqEl) {
            reqEl.innerHTML = vacancy.requirements || '<p>Требования не указаны</p>';
        }
        
        // 4. Обязанности
        const respEl = document.querySelector('.vacancy-responsibilities');
        if (respEl) {
            respEl.innerHTML = vacancy.responsibilities || '<p>Обязанности не указаны</p>';
        }
        
        // 5. Условия
        const condEl = document.querySelector('.vacancy-conditions');
        if (condEl) {
            condEl.innerHTML = vacancy.conditions || '<p>Условия не указаны</p>';
        }
        
        // 6. Обновляем аккордеон Tilda если есть
        this.updateTildaAccordion();
    }

    updateTildaAccordion() {
        const accordionBlock = document.getElementById('rec1513289611');
        if (!accordionBlock || !this.state.vacancy) return;
        
        const accordionContents = [
            document.getElementById('accordion1_1513289611'),
            document.getElementById('accordion2_1513289611'), 
            document.getElementById('accordion3_1513289611')
        ];
        
        if (accordionContents.filter(Boolean).length >= 3) {
            const vacancy = this.state.vacancy;
            
            // Требования
            if (accordionContents[0]) {
                const textEl = accordionContents[0].querySelector('.t668__text');
                if (textEl) {
                    textEl.innerHTML = vacancy.requirements || '<p>Не указано</p>';
                }
            }
            
            // Обязанности
            if (accordionContents[1]) {
                const textEl = accordionContents[1].querySelector('.t668__text');
                if (textEl) {
                    textEl.innerHTML = vacancy.responsibilities || '<p>Не указано</p>';
                }
            }
            
            // Условия
            if (accordionContents[2]) {
                const textEl = accordionContents[2].querySelector('.t668__text');
                if (textEl) {
                    textEl.innerHTML = vacancy.conditions || '<p>Не указано</p>';
                }
            }
        }
    }

    updateMetaTags() {
        const vacancy = this.state.vacancy;
        if (!vacancy) return;
        
        console.log('🔍 Обновление метатегов для:', vacancy.title);
        
        // 1. Title
        document.title = vacancy.seo_title;
        
        // 2. Meta description
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.name = 'description';
            document.head.appendChild(metaDesc);
        }
        metaDesc.content = vacancy.seo_description;
        
        // 3. Open Graph
        this.updateOrCreateMeta('og:title', vacancy.seo_title);
        this.updateOrCreateMeta('og:description', vacancy.seo_description);
        this.updateOrCreateMeta('og:url', window.location.href);
        this.updateOrCreateMeta('og:type', 'article');
        
        // 4. Twitter
        this.updateOrCreateMeta('twitter:title', vacancy.seo_title);
        this.updateOrCreateMeta('twitter:description', vacancy.seo_description);
        this.updateOrCreateMeta('twitter:card', 'summary_large_image');
        
        // 5. Canonical
        let canonical = document.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.rel = 'canonical';
            document.head.appendChild(canonical);
        }
        canonical.href = window.location.href;
        
        // 6. JSON-LD структурированные данные
        this.addStructuredData(vacancy);
    }

    updateOrCreateMeta(property, content) {
        let meta = document.querySelector(`meta[property="${property}"]`);
        if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('property', property);
            document.head.appendChild(meta);
        }
        meta.setAttribute('content', content);
    }

    addStructuredData(vacancy) {
        // Удаляем старые структурированные данные
        const oldScripts = document.querySelectorAll('script[type="application/ld+json"]');
        oldScripts.forEach(script => script.remove());
        
        const structuredData = {
            "@context": "https://schema.org",
            "@type": "JobPosting",
            "title": vacancy.title,
            "description": vacancy.description ? 
                vacancy.description.replace(/<[^>]*>/g, '').substring(0, 500) : '',
            "datePosted": vacancy.created_at || new Date().toISOString().split('T')[0],
            "validThrough": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            "employmentType": this.mapEmploymentType(vacancy.format),
            "hiringOrganization": {
                "@type": "Organization",
                "name": "Welcome City",
                "sameAs": window.location.origin,
                "logo": `${window.location.origin}/images/logo.png`
            },
            "jobLocation": {
                "@type": "Place",
                "address": {
                    "@type": "PostalAddress",
                    "addressLocality": "Москва",
                    "addressRegion": "Москва",
                    "addressCountry": "RU"
                }
            }
        };
        
        const script = document.createElement('script');
        script.type = 'application/ld+json";
        script.textContent = JSON.stringify(structuredData, null, 2);
        document.head.appendChild(script);
        
        console.log('✅ Добавлены структурированные данные JobPosting');
    }

    mapEmploymentType(format) {
        const mapping = {
            'Полный день': 'FULL_TIME',
            'Частичная занятость': 'PART_TIME',
            'Удаленная работа': 'REMOTE',
            'Проектная работа': 'CONTRACTOR',
            'Стажировка': 'INTERN'
        };
        return mapping[format] || 'OTHER';
    }

    setupFormAnimation() {
        const buttonBlock = document.getElementById('rec1480130341');
        const formBlock = document.getElementById('rec1479156901');
        
        if (!buttonBlock || !formBlock) return;
        
        // Ищем кнопку "Давай!"
        let openButton = this.findElementWithText(buttonBlock, 'Давай!');
        if (!openButton) openButton = buttonBlock;
        
        // Добавляем стили
        const style = document.createElement('style');
        style.textContent = `
            #rec1480130341 .vacancy-form-btn,
            #rec1480130341[data-is-button="true"] {
                cursor: pointer !important;
            }
            #rec1480130341 .vacancy-form-btn:hover,
            #rec1480130341[data-is-button="true"]:hover {
                opacity: 0.9;
            }
        `;
        document.head.appendChild(style);
        
        if (openButton === buttonBlock) {
            openButton.setAttribute('data-is-button', 'true');
        } else {
            openButton.classList.add('vacancy-form-btn');
        }
        
        formBlock.classList.remove('form-active');
        buttonBlock.classList.remove('button-hidden');
        
        openButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('📝 Открываем форму отклика');
            
            formBlock.classList.add('form-active');
            buttonBlock.classList.add('button-hidden');
            
            // Прокручиваем к форме
            setTimeout(() => {
                formBlock.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
            
            return false;
        });
    }

    findElementWithText(element, text) {
        if (element.textContent?.trim() === text || element.textContent?.includes(text)) {
            return element;
        }
        
        for (let child of element.children) {
            const found = this.findElementWithText(child, text);
            if (found) return found;
        }
        
        return null;
    }

    setupBackButton() {
        // Добавляем кнопку "Назад к списку" если её нет
        if (!document.querySelector('.back-to-vacancies')) {
            const backBtn = document.createElement('a');
            backBtn.href = '/search-vacancy';
            backBtn.className = 'back-to-vacancies';
            backBtn.innerHTML = '← Назад к списку вакансий';
            backBtn.style.cssText = `
                display: inline-block;
                margin: 20px 0;
                padding: 10px 20px;
                background: #f5f5f5;
                border-radius: 6px;
                text-decoration: none;
                color: #333;
                font-family: 'ALSHaussNext', sans-serif;
                transition: background 0.2s;
            `;
            
            const container = document.querySelector('.t-container') || document.body;
            container.prepend(backBtn);
        }
    }

    showError(message) {
        const mainContent = document.querySelector('.t-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div style="text-align:center; padding: 100px 20px; color: #666;">
                    <div style="font-size: 48px; margin-bottom: 16px;">😔</div>
                    <h2 style="margin: 0 0 16px 0; color: #333;">${message}</h2>
                    <p style="margin: 0 0 24px 0; opacity: 0.7;">Возможно, вакансия была удалена или закрыта</p>
                    <a href="/search-vacancy" style="
                        display: inline-block;
                        padding: 12px 24px;
                        background: #048868;
                        color: white;
                        text-decoration: none;
                        border-radius: 6px;
                        font-family: 'ALSHaussNext', sans-serif;
                    ">Вернуться к списку вакансий</a>
                </div>
            `;
        }
        
        // Обновляем метатеги для страницы ошибки
        document.title = 'Вакансия не найдена - Welcome City';
        let metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            metaDesc.content = 'Вакансия не найдена. Посмотрите другие вакансии в Welcome City.';
        }
    }
}

// ==========================
// ИНИЦИАЛИЗАЦИЯ
// ==========================

// Запускаем только на странице вакансии
if (window.location.pathname.includes('/vacancy')) {
    window.vacancyPageApp = new VacancyPageApp();
}
// ==========================
// АВТОМАТИЧЕСКИЙ ЗАПУСК
// ==========================

// Ждем полной загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM загружен, инициализируем VacancyPageApp...');
    
    // Проверяем, что мы на странице вакансии
    if (window.location.pathname.includes('/vacancy') || 
        window.location.pathname.includes('vacancy')) {
        
        // Проверяем, что Supabase загружен
        if (!window.supabase) {
            console.error('❌ Supabase не загружен!');
            // Можно попробовать загрузить вручную
            loadSupabaseManually();
            return;
        }
        
        // Запускаем приложение
        window.vacancyPageApp = new VacancyPageApp();
        console.log('✅ VacancyPageApp запущен');
    }
});

// Функция для ручной загрузки Supabase если он не загрузился
function loadSupabaseManually() {
    console.log('🔄 Пробуем загрузить Supabase вручную...');
    
    // Создаем скрипт Supabase
    const supabaseScript = document.createElement('script');
    supabaseScript.src = 'https://unpkg.com/@supabase/supabase-js@2';
    supabaseScript.onload = function() {
        console.log('✅ Supabase JS загружен');
        
        // Инициализируем клиент
        window.supabase = supabase.createClient(
            'https://vhbiezamhpyejdqvvwuj.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoYmllemFtaHB5ZWpkcXZ2d3VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2Njc0MDgsImV4cCI6MjA3NzI0MzQwOH0.13h_XJ7kQFtuCjavkOXN9TzXNF2X4jX5-rcNCFiFqO0'
        );
        
        // Запускаем приложение
        window.vacancyPageApp = new VacancyPageApp();
    };
    
    supabaseScript.onerror = function() {
        console.error('❌ Не удалось загрузить Supabase');
        // Показываем сообщение об ошибке
        document.body.innerHTML = `
            <div style="text-align:center; padding: 100px 20px;">
                <h2>Ошибка загрузки</h2>
                <p>Пожалуйста, обновите страницу</p>
                <button onclick="location.reload()">Обновить</button>
            </div>
        `;
    };
    
    document.head.appendChild(supabaseScript);
}

// ==========================
// АВТОМАТИЧЕСКИЙ ЗАПУСК ДЛЯ TILDA
// ==========================

// Ждем когда все загрузится
setTimeout(function() {
    console.log('🔧 Проверяем страницу вакансии...');
    
    // 1. Проверяем что мы на странице /vacancy
    const isVacancyPage = window.location.pathname.includes('/vacancy') || 
                          window.location.pathname === '/vacancy' ||
                          document.querySelector('.vacancy-title');
    
    if (isVacancyPage) {
        console.log('✅ Мы на странице вакансии');
        
        // 2. Проверяем Supabase
        if (!window.supabase) {
            console.log('⚠️ Supabase не найден, загружаем...');
            
            // Создаем скрипт Supabase
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/@supabase/supabase-js@2';
            
            script.onload = function() {
                console.log('✅ Supabase загружен');
                
                // Инициализируем Supabase с ТВОИМИ ключами
                window.supabase = supabase.createClient(
                    'https://vhbiezamhpyejdqvvwuj.supabase.co',
                    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoYmllemFtaHB5ZWpkcXZ2d3VqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2Njc0MDgsImV4cCI6MjA3NzI0MzQwOH0.13h_XJ7kQFtuCjavkOXN9TzXNF2X4jX5-rcNCFiFqO0'
                );
                
                // Запускаем наше приложение
                startVacancyApp();
            };
            
            script.onerror = function() {
                console.error('❌ Ошибка загрузки Supabase');
            };
            
            document.head.appendChild(script);
        } else {
            // Supabase уже есть, запускаем приложение
            console.log('✅ Supabase уже загружен');
            startVacancyApp();
        }
    }
}, 1000); // Даем Tilda время на загрузку

// Функция запуска приложения
function startVacancyApp() {
    console.log('🚀 Запускаем VacancyPageApp...');
    
    try {
        // Создаем экземпляр приложения
        window.vacancyPageApp = new VacancyPageApp();
        console.log('✅ VacancyPageApp запущен!');
    } catch (error) {
        console.error('❌ Ошибка при запуске:', error);
    }
}

// Простая проверка для отладки
console.log('📄 vacancy-page.js загружен');
console.log('Текущий путь:', window.location.pathname);
