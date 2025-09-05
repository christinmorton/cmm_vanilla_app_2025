class TabSwitcher {
    constructor(containerSelector) {
        this.container = document.querySelector(containerSelector);
        if (!this.container) {
            console.warn(`TabSwitcher: Container "${containerSelector}" not found`);
            return;
        }
        
        this.tabTriggers = this.container.querySelectorAll('.tab-trigger');
        this.tabContents = this.container.querySelectorAll('.tab-content');
        
        this.init();
    }
    
    init() {
        this.tabTriggers.forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchTab(trigger.dataset.tab);
            });
        });
        
        this.setActiveTab(this.getActiveTab());
    }
    
    getActiveTab() {
        const activeTrigger = this.container.querySelector('.tab-trigger.active');
        return activeTrigger ? activeTrigger.dataset.tab : this.tabTriggers[0]?.dataset.tab;
    }
    
    switchTab(tabId) {
        this.removeAllActive();
        this.setActiveTab(tabId);
    }
    
    removeAllActive() {
        this.tabTriggers.forEach(trigger => trigger.classList.remove('active'));
        this.tabContents.forEach(content => content.classList.remove('active'));
    }
    
    setActiveTab(tabId) {
        const targetTrigger = this.container.querySelector(`[data-tab="${tabId}"]`);
        const targetContent = this.container.querySelector(`#${tabId}`);
        
        if (targetTrigger && targetContent) {
            targetTrigger.classList.add('active');
            targetContent.classList.add('active');
        }
    }
}

export default TabSwitcher;