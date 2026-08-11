const fs = require('fs');

const filePath = 'pages/patient-detail.html';
let content = fs.readFileSync(filePath, 'utf8');

const targetGrid = `            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div onclick="routeToDeepDive('ecg-detail.html')" class="grid-card lg:col-span-2 hover:border-primary/50 hover:shadow-lg group relative">
                    <span class="material-symbols-outlined absolute top-4 right-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">open_in_new</span>
                    <div class="flex justify-between items-center mb-6"><h3 class="font-bold text-slate-400 uppercase tracking-widest text-xs flex items-center gap-2">Maternal ECG</h3><span class="text-2xl font-black text-slate-900"><span id="detail-mhr">--</span> <span class="text-sm text-slate-400">BPM</span></span></div>
                </div>
                <div id="bp-card" onclick="routeToDeepDive('blood-pressure-detail.html')" class="grid-card text-slate-900 border border-slate-200 relative overflow-hidden hover:shadow-lg group">
                    <span class="material-symbols-outlined absolute top-4 right-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity z-20">open_in_new</span>
                    <h3 class="font-bold text-slate-400 uppercase tracking-widest text-xs mb-6 relative z-10">Blood Pressure</h3>
                    <div class="mt-auto relative z-10"><p class="text-5xl font-black mb-1" id="detail-bp">-- <span class="text-2xl text-slate-400 font-medium">/ --</span></p><p id="bp-warning" class="text-slate-500 font-bold text-sm mt-2 flex items-center gap-1"></p></div>
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div id="fhr-card" onclick="routeToDeepDive('hrv-detail.html')" class="grid-card border border-slate-200 hover:shadow-lg hover:border-red-300 group relative">
                    <span class="material-symbols-outlined absolute top-4 right-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">open_in_new</span>
                    <h3 class="font-bold text-slate-400 uppercase tracking-widest text-xs flex items-center gap-2 mb-6">Fetal HR Baseline</h3>
                    <p class="text-5xl font-black mb-2" id="detail-fhr-text"><span id="detail-fhr">--</span> <span class="text-lg text-slate-400 font-medium">BPM</span></p>
                </div>
                <div onclick="routeToDeepDive('blood-oxygen-detail.html')" class="grid-card border border-slate-200 hover:shadow-lg hover:border-sky-300 group relative">
                    <span class="material-symbols-outlined absolute top-4 right-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">open_in_new</span>
                    <h3 class="font-bold text-slate-400 uppercase tracking-widest text-xs flex items-center gap-2 mb-6">Oxygen Saturation</h3>
                    <p class="text-5xl font-black text-slate-900 mb-2"><span id="detail-spo2">--</span><span class="text-2xl">%</span></p>
                </div>
                <div onclick="routeToDeepDive('respiratory-rate-detail.html')" class="grid-card border border-slate-200 hover:shadow-lg hover:border-amber-300 group relative">
                    <span class="material-symbols-outlined absolute top-4 right-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">open_in_new</span>
                    <h3 class="font-bold text-slate-400 uppercase tracking-widest text-xs flex items-center gap-2 mb-6">Uterine Activity</h3>
                    <p class="text-4xl font-black text-slate-900 mb-2"><span id="detail-contractions">--</span> <span class="text-lg text-slate-400 font-medium">/ 10 min</span></p>
                    <p id="contraction-warning" class="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"></p>
                </div>
            </div>`;

const newGrid = `            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <!-- Blood Pressure Card -->
                <div id="bp-card" onclick="routeToDeepDive('blood-pressure-detail.html')" class="grid-card text-slate-900 border border-slate-200 relative overflow-hidden hover:shadow-lg group">
                    <span class="material-symbols-outlined absolute top-4 right-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity z-20">open_in_new</span>
                    <h3 class="font-bold text-slate-400 uppercase tracking-widest text-xs mb-6 relative z-10">Blood Pressure</h3>
                    <div class="mt-auto relative z-10"><p class="text-5xl font-black mb-1" id="detail-bp">-- <span class="text-2xl text-slate-400 font-medium">/ --</span></p><p id="bp-warning" class="text-slate-500 font-bold text-sm mt-2 flex items-center gap-1"></p></div>
                </div>
                
                <!-- Fetal HR Baseline Card -->
                <div id="fhr-card" class="grid-card border border-slate-200 group relative cursor-default">
                    <h3 class="font-bold text-slate-400 uppercase tracking-widest text-xs flex items-center gap-2 mb-6">Fetal HR Baseline</h3>
                    <p class="text-5xl font-black mb-2" id="detail-fhr-text"><span id="detail-fhr">--</span> <span class="text-lg text-slate-400 font-medium">BPM</span></p>
                </div>

                <!-- Uterine Activity Card -->
                <div class="grid-card border border-slate-200 group relative cursor-default">
                    <h3 class="font-bold text-slate-400 uppercase tracking-widest text-xs flex items-center gap-2 mb-6">Uterine Activity</h3>
                    <p class="text-4xl font-black text-slate-900 mb-2"><span id="detail-contractions">--</span> <span class="text-lg text-slate-400 font-medium">/ 10 min</span></p>
                    <p id="contraction-warning" class="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"></p>
                </div>
            </div>`;

if(content.includes(targetGrid)) {
    content = content.replace(targetGrid, newGrid);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Successfully ran precision replacement.");
} else {
    console.log("Could not find the target grid block. The file might not have reset correctly.");
}
