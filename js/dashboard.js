// js/dashboard.js

// loadPatientsFromFirebase removed to prevent conflict with index.html's renderDashboard

document.addEventListener('DOMContentLoaded', () => {
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
});

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const connectId = params.get('connectId');
    if (connectId && window.firebaseService) {
        console.log('Connecting to patient:', connectId);
        try {
            // Wait for auth to be ready
            if (typeof firebase !== 'undefined' && !firebase.auth().currentUser) {
                await new Promise((resolve) => {
                    const unsub = firebase.auth().onAuthStateChanged((user) => {
                        if (user) { unsub(); resolve(user); }
                    });
                    setTimeout(() => resolve(null), 3000);
                });
            }
            const patient = await window.firebaseService.getPatientById(connectId);
            if (patient) {
                window.firebaseService.bindPatient(connectId);
                // Manually open the side panel and wire the button since we are bypassing the list click
                const sidePanel = document.getElementById('side-panel');
                const panelName = document.getElementById('panel-name');
                const viewBtn = document.getElementById('view-details-btn');
                
                if (sidePanel) sidePanel.classList.remove('translate-x-full');
                if (panelName) panelName.innerText = patient.name || 'Patient: ' + connectId;
                
                // CRITICAL FIX: The view-details button needs the internal document ID, not the PIN
                if (viewBtn) {
                    viewBtn.onclick = (e) => {
                        e.preventDefault();
                        if (patient && patient.id) {
                            window.location.href = `pages/patient-detail?id=${patient.id}`;
                        } else {
                            console.error('Patient ID is missing');
                        }
                    };
                }
                
                // If the global openIntervention exists and the list is loaded, use it to populate the rest of the UI
                if (typeof openIntervention === 'function') {
                    // Try immediately
                    openIntervention(patient.id);
                    // And try again in 1s just in case activePatients was still fetching
                    setTimeout(() => openIntervention(patient.id), 1000);
                }
            } else {
                console.warn('Patient not found for connectId:', connectId);
            }
        } catch(e) {
            console.error('Failed to connect patient:', e);
        }
    }
});
