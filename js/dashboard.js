// js/dashboard.js

// loadPatientsFromFirebase removed to prevent conflict with index.html's renderDashboard

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
