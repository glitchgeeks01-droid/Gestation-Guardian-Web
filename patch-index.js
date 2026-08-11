const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Remove ECG Canvas block from slide panel
html = html.replace(`      <!-- ECG Canvas -->
      <div class="mb-5 bg-slate-900 rounded-2xl p-4 overflow-hidden">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block"></span>Live ECG Feed</p>
        <canvas id="ecg-canvas" height="56" class="w-full block"></canvas>
      </div>`, '');

// 2. Swap SpO2 to Contractions in the side panel grid
html = html.replace(
`<div class="bg-sky-50/50 p-4 rounded-2xl border border-sky-100">
          <p class="text-[10px] font-bold text-slate-500 uppercase mb-1">SpO₂</p>
          <p class="text-3xl font-black text-sky-700" id="panel-spo2">--%</p>
        </div>`,
`<div class="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
          <p class="text-[10px] font-bold text-slate-500 uppercase mb-1">Contractions</p>
          <p class="text-3xl font-black text-indigo-700"><span id="panel-contractions">--</span><span class="text-sm font-medium text-indigo-400">/10m</span></p>
        </div>`
);

// 3. Swap SpO2 to Contractions in the JS that generates the Patient Cards
html = html.replace(
`<div class="bg-sky-50/50 p-3 rounded-xl border border-sky-100"><p class="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-1">SpO₂</p><p class="text-lg font-black text-sky-700">\${vitals.spo2 || '--'}<span class="text-[9px] text-slate-400">%</span></p></div>`,
`<div class="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100"><p class="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Contractions</p><p class="text-lg font-black text-indigo-700">\${vitals.contractions || '--'}<span class="text-[9px] text-slate-400">/10m</span></p></div>`
);

// 4. Update the JS function openIntervention()
html = html.replace(
`document.getElementById('panel-spo2').innerText=(vitals.spo2 || '--')+'%';`,
`document.getElementById('panel-contractions').innerText=(vitals.contractions || '--');`
);
html = html.replace(`startECG(p.status);`, '');

// 5. Remove the startECG JS function completely
const ecgFuncStart = html.indexOf('function startECG(status){');
const ecgFuncEnd = html.indexOf('// IoT sim');
if(ecgFuncStart !== -1 && ecgFuncEnd !== -1) {
    html = html.substring(0, ecgFuncStart) + html.substring(ecgFuncEnd);
}

// 6. Remove ecgRaf references
html = html.replace(/if\\(ecgRaf\\)\\{cancelAnimationFrame\\(ecgRaf\\);ecgRaf=null;\\}/g, '');
html = html.replace(/, ecgRaf=null/g, '');


fs.writeFileSync('index.html', html);
console.log("Dashboard UI patched.");
