/** * SOVEREIGN PORTAL ENGINE - FULL PRO EDITION
 * Integrates Reactive Animations, Neural Loader, and Core RSS Logic.
 */

const PortalEngine = {
    RSS_URL: 'https://anchor.fm/s/10b063cfc/podcast/rss',
    API_BASE: 'https://api.rss2json.com/v1/api.json?rss_url=',
    audio: document.getElementById('main-audio'),
    playBtn: document.getElementById('play-btn'),
    progressSlider: document.getElementById('progress-slider'),
    volumeSlider: document.getElementById('volume-slider'),
    playerTitle: document.getElementById('player-title'),
    playerArt: document.getElementById('player-art'),
    heroArt: document.getElementById('hero-art'),
    settingsPanel: document.getElementById('settings-panel'),

    init() {
        // Initialize AOS for scroll reveals
        AOS.init({ duration: 1000, once: true });
        
        this.loadSavedPreferences();
        this.fetchFeed(); // Handles loader dismissal
        this.setupEventListeners();
        this.setupAnimations();
    },

    setupEventListeners() {
        this.playBtn.onclick = () => this.togglePlay();
        
        this.audio.ontimeupdate = () => {
            const pct = (this.audio.currentTime / this.audio.duration) * 100 || 0;
            this.progressSlider.value = pct;
            document.getElementById('current-time').innerText = this.formatTime(this.audio.currentTime);
        };

        this.audio.onloadedmetadata = () => {
            document.getElementById('duration-time').innerText = this.formatTime(this.audio.duration);
        };

        this.progressSlider.oninput = () => {
            this.audio.currentTime = (this.progressSlider.value / 100) * this.audio.duration;
        };

        this.volumeSlider.oninput = (e) => {
            this.audio.volume = e.target.value;
        };

        window.onscroll = () => {
            const nav = document.getElementById('navbar');
            window.scrollY > 50 
                ? nav.classList.add('bg-[#020202]/90', 'backdrop-blur-xl', 'py-4') 
                : nav.classList.remove('bg-[#020202]/90', 'backdrop-blur-xl', 'py-4');
        };
    },

    setupAnimations() {
        // Magnetic Button Logic
        document.querySelectorAll('.magnetic').forEach(el => {
            el.addEventListener('mousemove', (e) => {
                const rect = el.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                gsap.to(el, { x: x * 0.3, y: y * 0.3, duration: 0.4, ease: "power2.out" });
            });
            el.addEventListener('mouseleave', () => {
                gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.3)" });
            });
        });

        // Background Mesh Drift
        window.addEventListener('mousemove', (e) => {
            gsap.to("#orb-1", { x: e.clientX * 0.05, y: e.clientY * 0.05, duration: 2 });
            gsap.to("#orb-2", { x: -e.clientX * 0.02, y: -e.clientY * 0.02, duration: 2 });
        });
    },

    async fetchFeed() {
        const statusText = document.getElementById('loader-status');
        try {
            if(statusText) statusText.innerText = "Connecting to Pipeline...";
            const res = await fetch(this.API_BASE + encodeURIComponent(this.RSS_URL));
            const data = await res.json();
            
            if (data.status === 'ok') {
                if(statusText) statusText.innerText = "Archive Decrypted.";
                this.renderGrid(data.items.slice(0, 6));
                
                // Hide Loader
                setTimeout(() => {
                    const loader = document.getElementById('loader');
                    loader.style.opacity = '0';
                    setTimeout(() => loader.style.display = 'none', 1000);
                }, 800);
            }
        } catch (e) { 
            console.error("Archive connection lost.");
            if(statusText) statusText.innerText = "Offline Mode Active.";
            setTimeout(() => document.getElementById('loader').style.display = 'none', 1500);
        }
    },

    renderGrid(items) {
        const container = document.getElementById('rss-container');
        if (!container) return;
        container.innerHTML = items.map((item, index) => `
            <div class="group glass-card tilt-card relative rounded-[3rem] p-8 flex flex-col h-full" data-aos="fade-up" data-aos-delay="${index * 100}">
                <div class="cursor-pointer" onclick="PortalEngine.loadTrack('${item.enclosure.link}', '${item.title.replace(/'/g, "\\'")}', '${item.thumbnail}')">
                    <div class="overflow-hidden rounded-[2.2rem] aspect-square mb-8 relative">
                        <img src="${item.thumbnail}" class="w-full h-full object-cover podcast-art transition duration-700 group-hover:scale-105">
                        <div class="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div class="w-16 h-16 rounded-full bg-white text-dark flex items-center justify-center shadow-2xl scale-0 group-hover:scale-100 transition-transform duration-500"><i class="fas fa-play ml-1"></i></div>
                        </div>
                    </div>
                    <h3 class="font-black italic uppercase leading-snug mb-8 group-hover:text-primary transition-colors line-clamp-2" style="font-size: 0.85rem;">${item.title}</h3>
                </div>
                <a href="${item.link}" target="_blank" class="mt-auto block w-full text-center py-4 bg-white/5 border border-white/10 text-white font-bold text-[8px] uppercase tracking-widest rounded-2xl hover:bg-primary hover:text-dark transition-all">Direct Link</a>
            </div>
        `).join('');
        this.applyTilt();
    },

    applyTilt() {
        document.querySelectorAll('.tilt-card').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;
                gsap.to(card, { rotationY: x * 10, rotationX: -y * 10, duration: 0.5 });
            });
            card.addEventListener('mouseleave', () => {
                gsap.to(card, { rotationY: 0, rotationX: 0, duration: 1, ease: "power2.out" });
            });
        });
    },

    loadTrack(url, title, art) {
        this.audio.src = url;
        this.playerTitle.innerText = title;
        this.playerArt.src = art;
        if(this.heroArt) this.heroArt.src = art;
        this.audio.play();
        this.playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        gsap.from("#player-art", { scale: 0.8, opacity: 0, duration: 0.5 });
    },

    togglePlay() {
        if (this.audio.paused) { this.audio.play(); this.playBtn.innerHTML = '<i class="fas fa-pause"></i>'; }
        else { this.audio.pause(); this.playBtn.innerHTML = '<i class="fas fa-play ml-1"></i>'; }
    },

    formatTime(secs) {
        const m = Math.floor(secs / 60), s = Math.floor(secs % 60);
        return `${m}:${s < 10 ? '0' + s : s}`;
    },

    toggleSettings() { this.settingsPanel.classList.toggle('active'); },

    updateSetting(type, value) {
        const root = document.documentElement;
        const body = document.body;
        let prefs = JSON.parse(localStorage.getItem('userPrefs')) || {};

        switch(type) {
            case 'accent':
                root.style.setProperty('--accent-color', value);
                root.style.setProperty('--glow-color', value + '1A');
                prefs.accent = value;
                break;
            case 'text':
                root.style.setProperty('--text-scale', value);
                prefs.text = value;
                break;
            case 'mode':
                body.classList.remove('high-contrast');
                root.style.setProperty('--image-filter', 'grayscale(0%)');
                if (value === 'noir') root.style.setProperty('--image-filter', 'grayscale(100%)');
                else if (value === 'high-contrast') body.classList.add('high-contrast');
                prefs.mode = value;
                break;
        }
        localStorage.setItem('userPrefs', JSON.stringify(prefs));
    },

    loadSavedPreferences() {
        const prefs = JSON.parse(localStorage.getItem('userPrefs'));
        if (prefs) {
            if (prefs.accent) this.updateSetting('accent', prefs.accent);
            if (prefs.text) this.updateSetting('text', prefs.text);
            if (prefs.mode) this.updateSetting('mode', prefs.mode);
        }
    },

    resetSettings() {
        localStorage.removeItem('userPrefs');
        location.reload();
    }
};

document.addEventListener('DOMContentLoaded', () => PortalEngine.init());