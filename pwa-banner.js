/**
 * PWA Install Banner System (Vanilla JS)
 * Adapted from the user's React reference
 */

class PWAInstallBanner {
    constructor() {
        this.deferredPrompt = null;
        this.showBanner = false;
        this.isIOS = false;
        this.init();
    }

    init() {
        // 1. Check if already dismissed in this session
        if (sessionStorage.getItem("pwa_banner_dismissed")) return;

        // 2. Detect iOS (Safari) specifically
        const ua = navigator.userAgent;
        this.isIOS = /iPhone|iPad|iPod/i.test(ua) && !window.navigator.standalone;

        // 3. Check if already installed
        const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
        if (isStandalone) return;

        if (this.isIOS) {
            // Show iOS-specific instructions after a delay
            setTimeout(() => this.renderBanner(), 4000);
        }

        // 4. Capture Install Prompt for Android/Desktop
        window.addEventListener("beforeinstallprompt", (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.renderBanner();
        });
    }

    async handleInstall() {
        if (!this.deferredPrompt) return;
        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        if (outcome === "accepted") {
            this.hide();
            this.deferredPrompt = null;
        }
    }

    hide() {
        const container = document.getElementById('pwa-install-container');
        if (container) {
            container.classList.add('fade-out');
            setTimeout(() => container.innerHTML = '', 400);
        }
    }

    handleDismiss() {
        this.hide();
        sessionStorage.setItem("pwa_banner_dismissed", "1");
    }

    renderBanner() {
        const container = document.getElementById('pwa-install-container');
        if (!container) return;

        const iconPath = "clinic_logo_pwa_maskable_1774094912849.png";
        
        container.innerHTML = `
            <div class="pwa-banner animate-slide-up">
                <div class="pwa-content">
                    <!-- App Icon -->
                    <div class="pwa-app-icon">
                        <img src="${iconPath}" alt="Clinic Logo">
                    </div>

                    <div class="pwa-text">
                        <p class="pwa-title">Install Clinic App</p>
                        ${this.isIOS ? 
                            `<p class="pwa-subtitle">Tap <strong style="color: #006b5d;">Share</strong> then <strong style="color: #006b5d;">"Add to Home Screen"</strong>.</p>` : 
                            `<p class="pwa-subtitle">Add to your home screen for instant access to your dashboard.</p>`
                        }
                    </div>

                    <div class="pwa-actions">
                        ${!this.isIOS && this.deferredPrompt ? 
                            `<button id="pwa-install-btn" class="pwa-btn-primary">
                                <i data-lucide="download" style="width: 14px; height: 14px;"></i> Install
                             </button>` : 
                            `<div class="pwa-ios-badge"><i data-lucide="smartphone"></i></div>`
                        }
                        
                        <button id="pwa-dismiss-btn" class="pwa-btn-close">
                            <i data-lucide="x" style="width: 16px; height: 16px;"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Initialize Lucide Icons
        if (window.lucide) {
            window.lucide.createIcons();
        }

        // Bind Events
        const installBtn = document.getElementById('pwa-install-btn');
        if (installBtn) installBtn.onclick = () => this.handleInstall();
        
        const dismissBtn = document.getElementById('pwa-dismiss-btn');
        if (dismissBtn) dismissBtn.onclick = () => this.handleDismiss();
    }
}

// Auto-initialize when script loads
window.pwaBanner = new PWAInstallBanner();
