class TabSwitcher {
    constructor(containerSelector) {
        this.containerSelector = containerSelector;
        this.container = null;
        this.tabTriggers = null;
        this.tabContents = null;
        this.eventListeners = [];
        
        this.init();
    }
    
    init() {
        this.findElements();
        if (!this.container) {
            console.warn(`TabSwitcher: Container "${this.containerSelector}" not found`);
            return;
        }
        
        this.attachEventListeners();
        this.setActiveTab(this.getActiveTab());
    }
    
    findElements() {
        this.container = document.querySelector(this.containerSelector);
        if (this.container) {
            this.tabTriggers = this.container.querySelectorAll('.tab-trigger');
            this.tabContents = this.container.querySelectorAll('.tab-content');
        }
    }
    
    attachEventListeners() {
        // Clean up existing listeners first
        this.cleanup();
        
        this.tabTriggers.forEach(trigger => {
            const clickHandler = (e) => {
                e.preventDefault();
                this.switchTab(trigger.dataset.tab);
            };
            
            trigger.addEventListener('click', clickHandler);
            
            // Store reference for cleanup
            this.eventListeners.push({
                element: trigger,
                event: 'click',
                handler: clickHandler
            });
        });
    }
    
    cleanup() {
        // Remove all event listeners
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventListeners = [];
    }
    
    reinitialize() {
        console.log('TabSwitcher: Reinitializing...');
        this.cleanup();
        this.init();
        console.log('TabSwitcher: Reinitialized successfully');
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