/**
 * DetailViewController: Centralized State & DOM Manager for Clinical Sub-Views
 * Adheres to the Service Repository Pattern. No raw database queries are executed here.
 */
window.DetailViewController = (() => {

    const Utils = {
        formatTime: (dateObj) => new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(dateObj),
        formatDate: (dateObj) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(dateObj),
        calculateMAP: (sys, dia) => ((sys + (2 * dia)) / 3).toFixed(1)
    };

    const hydrateSyncTable = async (patientId, forceRefresh = false) => {
        try {
            const logs = await window.firebaseService.getSyncLogs(patientId, 3, forceRefresh);
            const tbody = document.querySelector('table tbody');
            if (!tbody) return;

            tbody.innerHTML = '';
            
            if (logs.length === 0) {
                tbody.innerHTML = '<tr><td colspan=""3"" class=""text-center py-8 text-outline text-sm"">No recent sync operations found.</td></tr>';
                return;
            }

            logs.forEach(log => {
                const dateObj = new Date(log.timestamp);
                const tr = document.createElement('tr');
                tr.className = 'hover:bg-surface-container-low/50 transition-colors';
                
                tr.innerHTML = 
                    <td class=""px-8 py-4"">
                        <div class=""flex flex-col"">
                            <span class=""text-sm font-bold text-on-surface""> + Utils.formatDate(dateObj) +  &bull;  + Utils.formatTime(dateObj) + </span>
                            <span class=""text-[10px] text-outline""> + log.triggerType + </span>
                        </div>
                    </td>
                    <td class=""px-8 py-4"">
                        <div class=""inline-flex items-center gap-1.5 px-3 py-1 rounded-full  + (log.status === 'Success' ? 'bg-tertiary/10 text-tertiary' : 'bg-amber-100 text-amber-700') +  text-xs font-bold"">
                            <span class=""w-1.5 h-1.5 rounded-full  + (log.status === 'Success' ? 'bg-tertiary' : 'bg-amber-500') + ""></span>
                             + log.status + 
                        </div>
                    </td>
                    <td class=""px-8 py-4 text-right"">
                        <span class=""text-sm font-black text-on-surface""> + log.dataPointsCaptured + </span>
                    </td>
                ;
                tbody.appendChild(tr);
            });
        } catch(e) {
            console.error(""Hydration Failure (SyncTable):"", e);
        }
    };

    const hydrateBPTrend = async (patientId, forceRefresh = false) => {
        try {
            const data = await window.firebaseService.getTelemetryHistory({
                patientId,
                loincCode: '85354-9',
                timeWindowHours: 24
            }, forceRefresh);

            const container = document.getElementById('bp-trend-container');
            if (!container) return;
            
            container.innerHTML = '';
            
            if (data.length === 0) {
                container.innerHTML = '<div class=""w-full h-full flex items-center justify-center text-outline text-sm font-medium"">No telemetry ingested in the last 24 hours.</div>';
                return;
            }

            const MAX_SYS = 200; 

            const step = Math.max(1, Math.floor(data.length / 8));
            const sampledData = data.filter((_, i) => i % step === 0).slice(-8);

            sampledData.forEach(point => {
                const sys = point.components?.sys || 120;
                const dia = point.components?.dia || 80;
                
                const sysPct = Math.min((sys / MAX_SYS) * 100, 100);
                const diaPct = Math.min((dia / sys) * 100, 100);

                const bar = document.createElement('div');
                bar.className = 'flex-1 bg-primary-container/20 rounded-t-full relative group transition-all hover:bg-primary-container/40 cursor-pointer';
                bar.style.height = sysPct + '%';
                
                bar.innerHTML = 
                    <div class=""absolute bottom-0 w-full bg-primary rounded-t-full transition-all"" style=""height:  + diaPct + %\""></div>
                    
                    <!-- Hover Tooltip -->
                    <div class=""absolute -top-14 left-1/2 -translate-x-1/2 bg-surface text-on-surface text-xs font-bold px-3 py-2 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10 border border-outline-variant/20"">
                         + sys + / + dia +  mmHg
                        <div class=""text-[9px] text-outline font-normal mt-0.5""> + Utils.formatTime(new Date(point.timestamp)) + </div>
                    </div>
                ;
                container.appendChild(bar);
            });

        } catch(e) {
            console.error(""Hydration Failure (BPTrend):"", e);
        }
    };

    const hydrateHRTrend = async (patientId, forceRefresh = false) => {
        try {
            const data = await window.firebaseService.getTelemetryHistory({
                patientId,
                timeWindowHours: 24
            }, forceRefresh);

            const container = document.getElementById('hr-trend-container');
            const latestValueNode = document.getElementById('hr-latest-value');
            const latestTimeNode = document.getElementById('hr-latest-timestamp');

            if (!container) return;
            
            container.innerHTML = '';

            const hrData = [];
            data.forEach(point => {
                let hrValue = null;
                if (point.code === '8867-4') {
                    hrValue = point.valueQuantity;
                } else if (point.code === '85354-9' && point.components && point.components['8867-4']) {
                    hrValue = point.components['8867-4'];
                }
                
                if (hrValue) {
                    hrData.push({ timestamp: point.timestamp, valueQuantity: hrValue });
                }
            });

            hrData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            
            if (hrData.length === 0) {
                container.innerHTML = '<div class="w-full h-full flex items-center justify-center text-outline text-sm font-medium">No heart rate telemetry ingested in the last 24 hours.</div>';
                return;
            }

            if (latestValueNode && latestTimeNode) {
                const latestHR = hrData[hrData.length - 1];
                latestValueNode.textContent = latestHR.valueQuantity;
                latestTimeNode.textContent = Utils.formatTime(new Date(latestHR.timestamp));
            }

            const MAX_PHYSIOLOGICAL_HR = 180; 

            const step = Math.max(1, Math.floor(hrData.length / 15));
            const sampledData = hrData.filter((_, i) => i % step === 0).slice(-15);

            sampledData.forEach(reading => {
                const heightPct = Math.min((reading.valueQuantity / MAX_PHYSIOLOGICAL_HR) * 100, 100);
                
                let barColor = 'bg-emerald-400/80';
                if (reading.valueQuantity > 100) barColor = 'bg-rose-500/80';
                else if (reading.valueQuantity < 60) barColor = 'bg-blue-400/80';

                const bar = document.createElement('div');
                bar.className = `flex-1 rounded-t-md relative group transition-all cursor-pointer ${barColor} hover:opacity-100 opacity-80`;
                bar.style.height = `${heightPct}%`;
                
                bar.innerHTML = `
                    <!-- Hover Tooltip -->
                    <div class="absolute -top-14 left-1/2 -translate-x-1/2 bg-surface text-on-surface text-xs font-bold px-3 py-2 rounded shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10 border border-outline-variant/20">
                        ${reading.valueQuantity} BPM
                        <div class="text-[9px] text-outline font-normal mt-0.5">${Utils.formatTime(new Date(reading.timestamp))}</div>
                    </div>
                `;
                container.appendChild(bar);
            });

        } catch(e) {
            console.error("Hydration Failure (HRTrend):", e);
        }
    };

    return {
        initBPDetailView: async () => {
            const params = new URLSearchParams(window.location.search);
            const patientId = params.get('id');
            if (!patientId) return;

            const patient = await window.firebaseService.getPatientById(patientId);
            const breadcrumb = document.getElementById('breadcrumb-patient');
            if (breadcrumb) breadcrumb.innerText = patient.name;

            await Promise.all([
                hydrateBPTrend(patientId, false),
                hydrateSyncTable(patientId, false)
            ]);

            const fetchBtn = document.getElementById('btn-fetch-latest');
            if (fetchBtn) {
                fetchBtn.addEventListener('click', async () => {
                    const originalText = fetchBtn.innerHTML;
                    fetchBtn.innerHTML = '<span class=""material-symbols-outlined animate-spin text-xl"">progress_activity</span> Fetching...';
                    fetchBtn.disabled = true;

                    await Promise.all([
                        hydrateBPTrend(patientId, true),
                        hydrateSyncTable(patientId, true)
                    ]);
                    
                    setTimeout(() => {
                        fetchBtn.innerHTML = originalText;
                        fetchBtn.disabled = false;
                    }, 500);
                });
            }
        },
        
        initHRDetailView: async () => {
            const params = new URLSearchParams(window.location.search);
            const patientId = params.get('id');
            if (!patientId) return;

            const patient = await window.firebaseService.getPatientById(patientId);
            const breadcrumb = document.getElementById('breadcrumb-patient');
            if (breadcrumb) breadcrumb.innerText = patient.name;

            await Promise.all([
                hydrateHRTrend(patientId, false),
                hydrateSyncTable(patientId, false)
            ]);

            const fetchBtn = document.getElementById('btn-fetch-latest');
            if (fetchBtn) {
                fetchBtn.addEventListener('click', async () => {
                    const originalText = fetchBtn.innerHTML;
                    fetchBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-xl">progress_activity</span> Fetching...';
                    fetchBtn.disabled = true;

                    await Promise.all([
                        hydrateHRTrend(patientId, true),
                        hydrateSyncTable(patientId, true)
                    ]);
                    
                    setTimeout(() => {
                        fetchBtn.innerHTML = originalText;
                        fetchBtn.disabled = false;
                    }, 500);
                });
            }
        },
        
        initHRDetailView: async () => {
            const params = new URLSearchParams(window.location.search);
            const patientId = params.get('id');
            if (!patientId) return;

            const patient = await window.firebaseService.getPatientById(patientId);
            const breadcrumb = document.getElementById('breadcrumb-patient');
            if (breadcrumb) breadcrumb.innerText = patient.name;

            await Promise.all([
                hydrateHRTrend(patientId, false),
                hydrateSyncTable(patientId, false)
            ]);

            const fetchBtn = document.getElementById('btn-fetch-latest');
            if (fetchBtn) {
                fetchBtn.addEventListener('click', async () => {
                    const originalText = fetchBtn.innerHTML;
                    fetchBtn.innerHTML = '<span class="material-symbols-outlined animate-spin text-xl">progress_activity</span> Fetching...';
                    fetchBtn.disabled = true;

                    await Promise.all([
                        hydrateHRTrend(patientId, true),
                        hydrateSyncTable(patientId, true)
                    ]);
                    
                    setTimeout(() => {
                        fetchBtn.innerHTML = originalText;
                        fetchBtn.disabled = false;
                    }, 500);
                });
            }
        }
    };
})();
