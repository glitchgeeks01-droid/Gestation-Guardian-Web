document.addEventListener("DOMContentLoaded", () => {
    loadSidebar();
    initLiveChart();
    injectMetricNav();
});

// --- SIDEBAR INJECTION LOGIC ---
async function loadSidebar() {
    const sidebarContainer = document.getElementById('sidebar-target');
    if (!sidebarContainer) return;

    try {
        const response = await fetch('/components/sidebar.html');
        const html = await response.text();
        sidebarContainer.innerHTML = html;

        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link');

        navLinks.forEach(link => {
            if (currentPath.includes(link.getAttribute('href'))) {
                link.classList.remove('text-[#535f70]', 'hover:bg-[#dfe3e8]');
                link.classList.add('text-[#00497d]', 'border-l-[3px]', 'border-[#00497d]', 'bg-[#e5e8ed]/50');
                const icon = link.querySelector('.material-symbols-outlined');
                if (icon) icon.style.fontVariationSettings = "'FILL' 1";
            }
        });
    } catch (err) {
        console.error("Sidebar failed to load.", err);
    }
}

// --- INTER-METRIC NAVIGATION BAR ---
function injectMetricNav() {
    // Only run on deep-dive pages (they have ?id= in the URL or are patient-detail)
    const params   = new URLSearchParams(window.location.search);
    const patientId = params.get('id');
    const page     = window.location.pathname.split('/').pop() || '';

    // Only inject on recognised detail pages
    const detailPages = [
        'patient-detail.html',
        'blood-pressure-detail.html',
        'heart-rate-detail.html',
    ];
    const cleanPage = page.replace(/\?.*$/, '');
    if (!detailPages.some(p => cleanPage.includes(p.replace('.html', '')))) return;

    const id   = patientId || '';
    const qs   = id ? `?id=${encodeURIComponent(id)}` : '';

    const metrics = [
        { file: 'patient-detail',       icon: 'person',           label: 'Overview'      },
        { file: 'blood-pressure-detail',icon: 'sphygmomanometer', label: 'Blood Pressure'},
        { file: 'heart-rate-detail',    icon: 'watch',            label: 'Smartwatch HR' },
    ];

    const tabs = metrics.map(m => {
        const isActive = cleanPage.includes(m.file);
        const href = `${m.file}.html${qs}`;
        return `<a href="${href}"
            class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap
                   ${isActive
                     ? 'bg-primary text-white shadow-sm'
                     : 'text-slate-500 hover:bg-slate-100 hover:text-primary'}"
            ${isActive ? 'aria-current="page"' : ''}>
            <span class="material-symbols-outlined text-[15px]" style="font-variation-settings:'FILL' ${isActive ? 1 : 0}">
                ${m.icon}
            </span>
            ${m.label}
        </a>`;
    }).join('');

    // Patient label for breadcrumb
    const patientLabel = id || 'Patient';
    const overviewHref = `patient-detail.html${qs}`;

    const navHTML = `
    <nav id="metric-nav" style="position:sticky;top:0;z-index:39;"
         class="bg-white/90 backdrop-blur border-b border-slate-100 px-8 py-2.5 flex items-center gap-3 overflow-x-auto">
        <!-- Breadcrumb -->
        <div class="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mr-3 shrink-0">
            <a href="../index.html" class="hover:text-primary transition-colors">Dashboard</a>
            <span class="material-symbols-outlined text-[13px]">chevron_right</span>
            <a href="${overviewHref}" class="hover:text-primary transition-colors font-bold text-slate-600">${patientLabel}</a>
            <span class="material-symbols-outlined text-[13px]">chevron_right</span>
        </div>
        <!-- Metric tabs -->
        <div class="flex items-center gap-1.5">${tabs}</div>
    </nav>`;

    // Inject after the first <header> inside <main>
    const mainHeader = document.querySelector('main > header');
    if (mainHeader) {
        mainHeader.insertAdjacentHTML('afterend', navHTML);
    } else {
        // Fallback: prepend to main
        const main = document.querySelector('main');
        if (main) main.insertAdjacentHTML('afterbegin', navHTML);
    }
}

// --- LIVE SMARTWATCH TELEMETRY SIMULATOR ---
function initLiveChart() {
    const ctx = document.getElementById('liveSmartwatchChart');
    if (!ctx) return;

    const initialData = Array.from({length: 20}, () => Math.floor(Math.random() * (85 - 70 + 1) + 70));
    const labels = Array.from({length: 20}, (_, i) => i);

    if (typeof Chart !== 'undefined') {
        const liveChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Maternal HR (Smartwatch)',
                    data: initialData,
                    borderColor: '#e11d48',
                    backgroundColor: 'rgba(225, 29, 72, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 0,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 400, easing: 'linear' },
                scales: {
                    x: { display: false },
                    y: { display: true, min: 50, max: 120, grid: { color: 'rgba(0,0,0,0.05)' } }
                },
                plugins: { legend: { display: false } }
            }
        });

        setInterval(() => {
            const newReading = Math.floor(Math.random() * (82 - 72 + 1) + 72);
            liveChart.data.datasets[0].data.push(newReading);
            liveChart.data.datasets[0].data.shift();
            const bigNumberDisplay = document.querySelector('.text-7xl');
            if (bigNumberDisplay) bigNumberDisplay.innerText = newReading;
            liveChart.update();
        }, 1500);
    }
}