// Migration Bridge - обеспечивает плавный переход
class MigrationBridge {
    constructor() {
        this.isMigrationActive = false;
        this.originalFunctions = {};
        this.init();
    }

    init() {
        console.log('🚀 Migration Bridge activated');
        this.backupOriginalFunctions();
        this.setupCompatibilityLayer();
    }

    // Сохраняем оригинальные функции
    backupOriginalFunctions() {
        this.originalFunctions = {
            showVacancyDetail: window.showVacancyDetail,
            showVacancyList: window.showVacancyList,
            loadVacanciesData: window.loadVacanciesData,
            updateInterface: window.updateInterface
        };
    }

    // Слой совместимости
    setupCompatibilityLayer() {
        // Перехватываем вызовы и направляем в новую систему
        window.showVacancyDetail = (vacancy) => {
            if (this.isMigrationActive && window.tildaIntegration) {
                window.tildaIntegration.openVacancyModal(vacancy);
            } else {
                // Используем оригинальную логику
                this.originalFunctions.showVacancyDetail(vacancy);
            }
        };

        window.showVacancyList = () => {
            if (this.isMigrationActive && window.tildaIntegration) {
                window.tildaIntegration.closeVacancyModal();
            } else {
                this.originalFunctions.showVacancyList();
            }
        };
    }

    // Активация новой системы
    activateNewSystem() {
        this.isMigrationActive = true;
        console.log('✅ Новая модульная система активирована');
    }

    // Возврат к старой системе
    revertToOldSystem() {
        this.isMigrationActive = false;
        console.log('🔄 Возврат к оригинальной системе');
    }
}

// Автоматическая инициализация
window.migrationBridge = new MigrationBridge();
