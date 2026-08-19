// js/dashboard.js

async function loadPatientsFromFirebase() {
    const grid = document.getElementById('patient-grid');
    if (!grid) return;

    try {
        if (!window.firebaseService) return;
        const patients = await window.firebaseService.getPatients();

        if (patients.length === 0) {
            grid.innerHTML = `<p class="col-span-full text-center text-slate-400">No patients found in Firestore.</p>`;
            return;
        }

        grid.innerHTML = patients.map(p => {
            // Dynamic route using the patient's own ID
            const detailUrl = `pages/patient-detail.html?id=${encodeURIComponent(p._id || p.id || '')}`;

            // Calculate Gestosis Risk Score dynamically to assign RED/AMBER/GREEN risk levels
            let score = 0;
            if (window.firebaseService && window.firebaseService.calculateGestosisScore) {
                score = window.firebaseService.calculateGestosisScore(p);
            }
            
            // Derive Status based on Gestosis Score or explicitly set status
            let status = p.status || 'Stable';
            let statusClass = 'bg-emerald-100 text-emerald-700'; // GREEN by default

            if (score >= 13 || /critical|high|red/i.test(p.status)) {
                status = 'Critical';
                statusClass = 'bg-red-100 text-red-700 font-bold shadow-sm'; // RED
            } else if (score >= 6 || /warning|moderate|amber/i.test(p.status)) {
                status = 'Warning';
                statusClass = 'bg-amber-100 text-amber-700 font-bold shadow-sm'; // AMBER
            } else {
                status = p.status || 'Stable';
                statusClass = 'bg-emerald-100 text-emerald-700 font-bold shadow-sm'; // GREEN
            }

            const photo = p.photo || p.image ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=e2e8f0&color=475569`;

            return `
            <a href="${detailUrl}" class="patient-card p-8 rounded-[2rem] flex flex-col group hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                <div class="flex justify-between items-start mb-8">
                    <div class="flex gap-4">
                        <img src="${photo}" class="w-14 h-14 rounded-2xl object-cover">
                        <div>
                            <h3 class="font-headline font-bold text-xl text-slate-900">${p.name}</h3>
                            <p class="text-xs text-slate-500 font-medium mt-1">${p.weeks || '--'} Weeks Gestation</p>
                        </div>
                    </div>
                    <span class="px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest ${statusClass}">
                        ${status}
                    </span>
                </div>
                <div class="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center">
                    <div class="text-sm font-bold text-slate-700">${(p.vitals && p.vitals.maternalHR) || '--'} <span class="text-[10px] text-slate-400">BPM</span></div>
                    <span class="material-symbols-outlined text-[18px] text-primary group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </div>
            </a>`;
        }).join('');

    } catch (error) {
        grid.innerHTML = `<p class="col-span-full text-center text-error font-bold">Failed to connect to Firebase backend.</p>`;
    }
}

document.addEventListener('DOMContentLoaded', loadPatientsFromFirebase);

// Listen for real-time telemetry updates and parse HL7 FHIR Observation payloads
window.addEventListener('telemetryUpdate', (e) => {
    const data = e.detail;
    if (!data) return;

    // Parse HL7 FHIR Observation
    if (data.resourceType === 'Observation') {
        const code = data.code?.coding?.[0]?.code;
        
        // Heart Rate (LOINC: 8867-4)
        if (code === '8867-4') {
            const hrValue = data.valueQuantity?.value;
            if (hrValue) {
                document.querySelectorAll('.mhr-val, #panel-mhr').forEach(el => {
                    el.innerText = hrValue;
                });
                
                // Update live chart if it exists
                const ctx = document.getElementById('liveSmartwatchChart');
                if (ctx && window.Chart) {
                    const chart = Chart.getChart(ctx);
                    if (chart) {
                        chart.data.datasets[0].data.push(hrValue);
                        chart.data.datasets[0].data.shift();
                        chart.update();
                        const bigNum = document.querySelector('.text-7xl');
                        if (bigNum) bigNum.innerText = hrValue;
                    }
                }
            }
        } 
        // Blood Pressure (LOINC: 85354-9)
        else if (code === '85354-9') {
            let sys = '--', dia = '--';
            if (data.component) {
                data.component.forEach(comp => {
                    const cCode = comp.code?.coding?.[0]?.code;
                    if (cCode === '8480-6') sys = comp.valueQuantity?.value;
                    if (cCode === '8462-4') dia = comp.valueQuantity?.value;
                });
            }
            
            document.querySelectorAll('#panel-bp').forEach(el => {
                el.innerText = `${sys}/${dia}`;
            });
            const detailBp = document.getElementById('detail-bp');
            if (detailBp) {
                detailBp.innerHTML = `${sys} <span class="text-2xl text-slate-400 font-medium">/ ${dia}</span>`;
            }
        }
    } 
    // Fallback for old flat JSON format
    else {
        if (data.maternalHR) {
            document.querySelectorAll('.mhr-val, #panel-mhr').forEach(el => {
                el.innerText = data.maternalHR;
            });
        }
        if (data.bpSys && data.bpDia) {
            document.querySelectorAll('#panel-bp').forEach(el => {
                el.innerText = `${data.bpSys}/${data.bpDia}`;
            });
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const connectId = params.get('connectId');
    if (connectId && window.firebaseService) {
        console.log('Connecting to patient:', connectId);
        window.firebaseService.bindPatient(connectId);
        // Open side panel with basic info so charts are visible
        document.getElementById('side-panel').classList.remove('translate-x-full');
        document.getElementById('panel-name').innerText = 'Patient: ' + connectId;
    }
});
