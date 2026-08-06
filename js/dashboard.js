// js/dashboard.js

async function loadPatientsFromFirebase() {
    const grid = document.getElementById('patient-grid');

    try {
        const patients = await window.firebaseService.getPatients();

        if (patients.length === 0) {
            grid.innerHTML = `<p class="col-span-full text-center text-slate-400">No patients found in Firestore.</p>`;
            return;
        }

        grid.innerHTML = patients.map(p => {
            // Dynamic route using the patient's own ID
            const detailUrl = `pages/patient-detail.html?id=${encodeURIComponent(p._id || p.id || '')}`;

            // Normalise status colours (supports 'Critical'/'Red', 'Warning'/'Amber', 'Stable'/'Green')
            const status = p.status || 'Stable';
            let statusClass = 'bg-emerald-100 text-emerald-700';
            if (/critical|red/i.test(status))   statusClass = 'bg-red-100 text-red-700';
            else if (/warning|amber/i.test(status)) statusClass = 'bg-amber-100 text-amber-700';

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
                    <div class="text-sm font-bold text-slate-700">${p.hr || (p.vitals && p.vitals.fetalHR) || '--'} <span class="text-[10px] text-slate-400">BPM</span></div>
                    <span class="material-symbols-outlined text-[18px] text-primary group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </div>
            </a>`;
        }).join('');

    } catch (error) {
        grid.innerHTML = `<p class="col-span-full text-center text-error font-bold">Failed to connect to Firebase backend.</p>`;
    }
}

document.addEventListener('DOMContentLoaded', loadPatientsFromFirebase);