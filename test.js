/** * SOVEREIGN PORTAL: COMMAND CENTER EDITION
 * Logic: Sharp UI, Terminal Settings, RSS Pipeline
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
    canvas: document.getElementById('visualizer'),
    
    audioCtx: null,
    analyser: null,
    dataArray: null,

    init() {
        AOS.init({ duration: 800, once: true });
        this.loadSavedPreferences();
        this.fetchFeed();
        this.setupEventListeners();
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    },

    resizeCanvas() {
        if(this.canvas) {
            this.canvas.width = this.canvas.offsetWidth;
            this.canvas.height = this.canvas.offsetHeight;
        }
    },

    setupEventListeners() {
        this.playBtn.onclick = () => this.togglePlay();
        
        this.audio.ontimeupdate = () => {
            const pct = (this.audio.currentTime / this.audio.duration) * 100 || 0;
            this.progressSlider.value = pct;
            document.getElementById('current-time').innerText = this.formatTime(this.audio.currentTime);
        };

        this.progressSlider.oninput = () => {
            this.audio.currentTime = (this.progressSlider.value / 100) * this.audio.duration;
        };

        this.volumeSlider.oninput = (e) => this.audio.volume = e.target.value;
    },

    async fetchFeed() {
        try {
            const res = await fetch(this.API_BASE + encodeURIComponent(this.RSS_URL));
            const data = await res.json();
            if (data.status === 'ok') {
                this.renderGrid(data.items.slice(0, 6));
                document.getElementById('loader').style.display = 'none';
            }
        } catch (e) {
            document.getElementById('loader').style.display = 'none';
        }
    },

    initVisualizer() {
        if (this.audioCtx) return;
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.audioCtx.createAnalyser();
        const source = this.audioCtx.createMediaElementSource(this.audio);
        source.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);
        this.analyser.fftSize = 64;
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.animateVisualizer();
    },

    animateVisualizer() {
        const ctx = this.canvas.getContext('2d');
        const draw = () => {
            requestAnimationFrame(draw);
            this.analyser.getByteFrequencyData(this.dataArray);
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            const barWidth = (this.canvas.width / this.dataArray.length);
            let x = 0;
            this.dataArray.forEach(val => {
                const barHeight = (val / 255) * this.canvas.height;
                ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent-color');
                ctx.fillRect(x, this.canvas.height - barHeight, barWidth - 2, barHeight);
                x += barWidth;
            });
        };
        draw();
    },

    renderGrid(items) {
        const container = document.getElementById('rss-container');
        container.innerHTML = items.map((item, index) => `
            <div class="border-2 border-white/10 p-6 hover:border-primary transition-colors group cursor-pointer" 
                 onclick="PortalEngine.loadTrack('${item.enclosure.link}', '${item.title.replace(/'/g, "\\'")}', '${item.thumbnail}')">
                <div class="aspect-square mb-6 overflow-hidden">
                    <img src="${item.thumbnail}" class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500">
                </div>
                <h3 class="text-[10px] font-bold uppercase tracking-tighter mb-4 h-12 line-clamp-2">${item.title}</h3>
                <div class="text-[8px] font-black uppercase tracking-[0.3em] text-primary">Initialize Sync -></div>
            </div>
        `).join('');
    },

    loadTrack(url, title, art) {
        this.initVisualizer();
        this.audio.src = url;
        this.playerTitle.innerText = title;
        this.playerArt.src = art;
        this.audio.play();
        this.playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    },

    togglePlay() {
        this.initVisualizer();
        if (this.audio.paused) { this.audio.play(); this.playBtn.innerHTML = '<i class="fas fa-pause"></i>'; }
        else { this.audio.pause(); this.playBtn.innerHTML = '<i class="fas fa-play"></i>'; }
    },

    formatTime(secs) {
        const m = Math.floor(secs / 60), s = Math.floor(secs % 60);
        return `${m}:${s < 10 ? '0' + s : s}`;
    },

    toggleSettings() {
        const panel = document.getElementById('command-center');
        panel.classList.toggle('hidden');
        panel.classList.toggle('flex');
    },

    updateSetting(type, value) {
        document.documentElement.style.setProperty(`--${type}-color`, value);
        localStorage.setItem(`pref-${type}`, value);
    },

    loadSavedPreferences() {
        const accent = localStorage.getItem('pref-accent');
        if (accent) this.updateSetting('accent', accent);
    }
};

document.addEventListener('DOMContentLoaded', () => PortalEngine.init());