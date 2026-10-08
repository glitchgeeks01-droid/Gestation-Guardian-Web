/**
 * Spiderweb Mechanics: Global Reactive State & Component Injector
 * 
 * 1. The Radial Threads: Weaves shared HTML components (Sidebar, TopNav) into DOM anchors.
 * 2. The Vibrational Network: Uses BroadcastChannel to instantly sync state across open tabs.
 */
class SpiderwebEngine {
    constructor() {
        this.components = {};
        this.channel = new BroadcastChannel('gestation_guardian_spiderweb');
        this.listeners = {};

        // Listen for vibrations from other tabs
        this.channel.onmessage = (event) => {
            const { action, payload } = event.data;
            console.log(`🕸️ Spiderweb Vibration Detected: [${action}]`, payload);
            if (this.listeners[action]) {
                this.listeners[action].forEach(callback => callback(payload));
            }
        };
    }

    /**
     * Radial Threads: Inject reusable HTML components automatically
     */
    async weaveUI() {
        const anchors = document.querySelectorAll('[data-spiderweb]');
        for (const anchor of anchors) {
            const componentName = anchor.getAttribute('data-spiderweb');
            if (componentName) {
                try {
                    const response = await fetch(`../components/${componentName}.html`);
                    if (response.ok) {
                        const html = await response.text();
                        anchor.innerHTML = html;
                        anchor.removeAttribute('data-spiderweb'); // Prevent re-weaving
                    }
                } catch (e) {
                    console.error(`Spiderweb failed to weave component: ${componentName}`, e);
                }
            }
        }
    }

    /**
     * The Vibrational Network: Pluck a thread to notify all other tabs
     */
    pluck(action, payload) {
        console.log(`🕸️ Plucking Spiderweb Thread: [${action}]`, payload);
        this.channel.postMessage({ action, payload });
        
        // Also trigger locally for the current tab
        if (this.listeners[action]) {
            this.listeners[action].forEach(callback => callback(payload));
        }
    }

    /**
     * The Vibrational Network: Listen to a specific thread
     */
    listen(action, callback) {
        if (!this.listeners[action]) {
            this.listeners[action] = [];
        }
        this.listeners[action].push(callback);
    }
}

window.Spiderweb = new SpiderwebEngine();
document.addEventListener('DOMContentLoaded', () => window.Spiderweb.weaveUI());
