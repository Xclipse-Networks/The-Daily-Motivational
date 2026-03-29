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
        AOS.init({ duration: 1000, once: true });
        this.loadSavedPreferences();
        this.fetchFeed();
        this.setupEventListeners();
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
        this.volumeSlider.oninput = (e) => this.audio.volume = e.target.value;
        window.onscroll = () => {
            const nav = document.getElementById('navbar');
            window.scrollY > 50 ? nav.classList.add('bg-[#020202]/90', 'backdrop-blur-xl', 'py-4') : nav.classList.remove('bg-[#020202]/90', 'backdrop-blur-xl', 'py-4');
        };
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
    },

    async fetchFeed() {
        try {
            const res = await fetch(this.API_BASE + encodeURIComponent(this.RSS_URL));
            const data = await res.json();
            if (data.status === 'ok') this.renderGrid(data.items.slice(0, 6));
        } catch (e) { console.error("Archive connection lost."); }
    },

    renderGrid(items) {
        const container = document.getElementById('rss-container');
        if (!container) return;
        container.innerHTML = items.map((item, index) => `
            <div class="group glass-card relative rounded-[3rem] p-8 flex flex-col h-full" data-aos="fade-up" data-aos-delay="${index * 100}">
                <div class="cursor-pointer" onclick="PortalEngine.loadTrack('${item.enclosure.link}', '${item.title.replace(/'/g, "\\'")}', '${item.thumbnail}')">
                    <div class="overflow-hidden rounded-[2.2rem] aspect-square mb-8 relative">
                        <img src="${item.thumbnail}" class="w-full h-full object-cover podcast-art transition duration-700 group-hover:scale-105">
                        <div class="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div class="w-14 h-14 rounded-full bg-white text-dark flex items-center justify-center shadow-2xl"><i class="fas fa-play ml-1"></i></div>
                        </div>
                    </div>
                    <h3 class="font-black italic uppercase leading-snug mb-8 group-hover:text-primary transition-colors line-clamp-2" style="font-size: 0.85rem;">${item.title}</h3>
                </div>
                <a href="${item.link}" target="_blank" class="mt-auto block w-full text-center py-4 bg-white/5 border border-white/10 text-white font-bold text-[8px] uppercase tracking-widest rounded-2xl hover:bg-primary hover:text-dark transition-all">Direct Link</a>
            </div>
        `).join('');
    },

    loadTrack(url, title, art) {
        this.audio.src = url;
        this.playerTitle.innerText = title;
        this.playerArt.src = art;
        if(this.heroArt) this.heroArt.src = art;
        this.audio.play();
        this.playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    },

    togglePlay() {
        if (this.audio.paused) { this.audio.play(); this.playBtn.innerHTML = '<i class="fas fa-pause"></i>'; }
        else { this.audio.pause(); this.playBtn.innerHTML = '<i class="fas fa-play ml-1"></i>'; }
    },

    formatTime(secs) {
        const m = Math.floor(secs / 60), s = Math.floor(secs % 60);
        return `${m}:${s < 10 ? '0' + s : s}`;
    }
};

document.addEventListener('DOMContentLoaded', () => PortalEngine.init());