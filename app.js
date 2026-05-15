// ===== JD vs BPROFORMA Dashboard v3 - Bahasa Melayu + APA Tables =====
let DATA = null;
let currentFilter = 'all';

async function loadData() {
    try {
        let resp;
        try {
            resp = await fetch('../jd_comparison_data.json');
            if (!resp.ok) throw new Error('Not found');
        } catch (e) {
            // Fallback for GitHub Pages if JSON is in the same folder
            resp = await fetch('./jd_comparison_data.json');
        }
        DATA = await resp.json();
        initDashboard();
    } catch (e) {
        document.body.innerHTML = '<div style="padding:40px;color:#f87171;">Ralat memuatkan data.</div>';
    }
}

function getShortName(k) {
    return k.replace(/\s*\(N=\d+\)\s*$/, '').replace(/\s*\(Gred.*$/, '').trim();
}

function initDashboard() {
    populateFilter();
    renderAll();
    
    // Jawatan Filter
    document.getElementById('jawatanFilter').addEventListener('change', (e) => {
        currentFilter = e.target.value;
        renderAll();
    });

    // Theme Toggle
    document.getElementById('themeToggle').addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const i = document.querySelector('#themeToggle i');
        if(document.body.classList.contains('light-theme')) {
            i.className = 'fas fa-sun';
        } else {
            i.className = 'fas fa-moon';
        }
    });

    // Print Button
    document.getElementById('printBtn').addEventListener('click', () => {
        window.print();
    });

    // Live Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        renderAPAPerJawatan(getFiltered(), query);
    });
}

function populateFilter() {
    const select = document.getElementById('jawatanFilter');
    DATA.comparison.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.kumpulan;
        opt.textContent = c.kumpulan;
        select.appendChild(opt);
    });
}

function getFiltered() {
    if (currentFilter === 'all') return DATA.comparison;
    return DATA.comparison.filter(c => c.kumpulan === currentFilter);
}

function renderAll() {
    const filtered = getFiltered();
    renderKPIs(filtered);
    renderOverviewChart(filtered);
    renderAPAOverviewTable(filtered);
    renderAPAPerJawatan(filtered);
}

function updateKPIs(group) {
    let selari = 0, rayapan = 0, tiada = 0, dorman = 0;
    
    if (group === 'Keseluruhan') {
        DATA.comparison.forEach(r => {
            selari += r.summary.selari;
            rayapan += r.summary.rayapan_tugas;
            tiada += r.summary.tiada_padanan;
            dorman += r.summary.dormant;
        });
    } else {
        const item = DATA.comparison.find(r => r.kumpulan === group);
        if (item) {
            selari = item.summary.selari;
            rayapan = item.summary.rayapan_tugas;
            tiada = item.summary.tiada_padanan;
            dorman = item.summary.dormant;
        }
    }

    document.getElementById('kpiSelari').textContent = selari;
    document.getElementById('kpiRayapan').textContent = rayapan;
    document.getElementById('kpiDorman').textContent = dorman;

    updateChart(selari, rayapan, dorman);
}

function renderKPIs(data) {
    let totalBPR = 0, totalSelari = 0, totalRayapan = 0, totalDorman = 0;
    data.forEach(d => {
        totalBPR += d.total_bproforma_tasks;
        totalSelari += d.summary.selari;
        totalRayapan += d.summary.rayapan_tugas;
        totalDorman += d.summary.dormant;
    });
    document.getElementById('kpiTotalGroups').textContent = data.length;
    document.getElementById('kpiTotalTasks').textContent = totalBPR;
    document.getElementById('kpiAligned').textContent = totalSelari;
    document.getElementById('kpiCreep').textContent = totalRayapan;
    document.getElementById('kpiDormant').textContent = totalDorman;
}

// ===== Overview Chart =====
let overviewChartInstance = null;
function updateChart(selari, rayapan, dorman) {
    const ctx = document.getElementById('overviewChart').getContext('2d');
    if (overviewChartInstance) overviewChartInstance.destroy();

    overviewChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Selari (Dalam JD)', 'Tiada dalam JD (Rayapan)', 'Ada dalam JD Tidak Dibuat'],
            datasets: [{
                data: [selari, rayapan, dorman],
                backgroundColor: ['#10B981', '#EF4444', '#F59E0B'],
                borderWidth: 0
            }]
        }
    });
}

function renderOverviewChart(data) {
    let totalSelari = 0, totalRayapan = 0, totalDorman = 0;
    data.forEach(d => {
        totalSelari += d.summary.selari;
        totalRayapan += d.summary.rayapan_tugas;
        totalDorman += d.summary.dormant;
    });
    updateChart(totalSelari, totalRayapan, totalDorman);
}

// ===== APA OVERVIEW TABLE =====
function renderAPAOverviewTable(data) {
    const container = document.getElementById('apaOverviewTable');
    const tableNum = 1;

    let html = `<div class="apa-table-block">
        <p class="apa-table-number">Jadual ${tableNum}</p>
        <p class="apa-table-title">Ringkasan Perbandingan Tugasan Sebenar di Lapangan dengan Tugas dalam JD Rasmi Mengikut Kumpulan Jawatan</p>
        <table class="apa-table">
            <thead>
                <tr>
                    <th class="apa-th-left">Kumpulan Jawatan</th>
                    <th>N</th>
                    <th>Dalam JD (Selari)</th>
                    <th>Tiada dalam JD</th>
                    <th>Ada dalam JD Tidak Dibuat</th>
                </tr>
            </thead>
            <tbody>`;

    data.forEach(r => {
        html += `<tr>
            <td class="apa-td-left">${getShortName(r.kumpulan)}</td>
            <td>${r.group_n}</td>
            <td>${r.summary.selari}</td>
            <td>${r.summary.rayapan_tugas}</td>
            <td>${r.summary.dormant}</td>
        </tr>`;
    });

    html += `</tbody></table>
        <p class="apa-table-note"><em>Nota.</em> Selari = tugasan sebenar yang mempunyai padanan dalam JD rasmi. Tiada dalam JD = tugas dilaporkan petugas tetapi tiada dalam JD. Ada dalam JD tidak dibuat = tugas dalam JD tetapi tiada dilaporkan. <em>N</em> = bilangan responden.</p>
    </div>`;

    container.innerHTML = html;
}

// ===== APA PER-JAWATAN TABLES =====
function renderAPAPerJawatan(data, searchQuery = '') {
    const container = document.getElementById('apaPerJawatan');
    let html = '';

    data.forEach((d, idx) => {
        const tableNum = idx + 2;
        const s = d.summary;

        const sorted = [...d.task_comparisons].sort((a, b) => {
            const order = { 'Selari': 0, 'Rayapan Tugas': 1, 'Tiada Padanan JD': 2 };
            return (order[a.match_status] || 3) - (order[b.match_status] || 3);
        });

        // Search Filter Logic
        let filteredTasks = sorted;
        let dormantTasks = d.dormant_tasks || [];
        
        if (searchQuery) {
            filteredTasks = sorted.filter(t => 
                (t.tugas_bproforma && t.tugas_bproforma.toLowerCase().includes(searchQuery)) ||
                (t.matched_jd_task && t.matched_jd_task.toLowerCase().includes(searchQuery))
            );
            dormantTasks = dormantTasks.filter(t => t.task.toLowerCase().includes(searchQuery));
            // If no match in this jawatan, skip rendering it
            if (filteredTasks.length === 0 && dormantTasks.length === 0) return;
        }

        // Open accordion if searching or if only 1 jawatan selected
        const isOpen = (searchQuery.length > 0 || currentFilter !== 'all') ? 'open' : '';

        html += `<details class="apa-accordion" ${isOpen}>
            <summary>
                ${d.kumpulan}
                <div>
                    <span class="apa-stat apa-stat-green">Selari: ${s.selari}</span>
                    <span class="apa-stat apa-stat-red">Tiada dalam JD: ${s.rayapan_tugas}</span>
                    <span class="apa-stat apa-stat-yellow">Dorman: ${s.dormant}</span>
                </div>
            </summary>
            <div class="apa-accordion-content">
            <table class="apa-table apa-detail">
                <thead>
                    <tr>
                        <th class="apa-th-left" style="width:30%;">Tugasan Sebenar di Lapangan (FGD)</th>
                        <th style="width:10%;">Hakiki</th>
                        <th style="width:10%;">Sampingan</th>
                        <th style="width:10%;">Lain-lain</th>
                        <th style="width:8%;">Kategori</th>
                        <th style="width:8%;">Status</th>
                        <th class="apa-th-left" style="width:24%;">Tugas dalam JD Rasmi</th>
                    </tr>
                </thead>
                <tbody>`;

        // 1. Render BPROFORMA / Selari Tasks
        filteredTasks.forEach(t => {
            let rowClass = t.match_status === 'Selari' ? 'row-selari' : 'row-rayapan';
            let statusClass = t.match_status === 'Selari' ? 'apa-status-selari' : 'apa-status-rayapan';
            let displayStatus = t.match_status === 'Rayapan Tugas' ? 'Tiada dalam JD' : t.match_status;

            let jdTaskHtml = t.matched_jd_task || '<em>Tiada padanan</em>';
            
            // Evidence Tooltip for Selari
            if (t.match_status === 'Selari' && t.matched_raw_evidence) {
                jdTaskHtml = `<div class="tooltip-container">
                    ${t.matched_jd_task}
                    <span class="tooltip-text"><b>Bukti Teks Lapangan:</b><br/>"${t.matched_raw_evidence}"</span>
                </div>`;
            }

            html += `<tr class="${rowClass}">
                <td class="apa-td-left">${t.tugas_bproforma}</td>
                <td>${t.hakiki.raw}</td>
                <td>${t.sampingan.raw}</td>
                <td>${t.lain_lain.raw}</td>
                <td>${t.kategori}</td>
                <td class="${statusClass}">${displayStatus}</td>
                <td class="apa-td-left">${jdTaskHtml}</td>
            </tr>`;
        });

        // 2. Render Dormant Tasks at the bottom of the table
        dormantTasks.forEach(t => {
            html += `<tr class="row-dorman">
                <td class="apa-td-left"><em style="color:var(--text-muted);">Tiada Rekod Lapangan</em></td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td class="apa-status-dorman">Dorman</td>
                <td class="apa-td-left">${t.task}</td>
            </tr>`;
        });

        html += `</tbody></table>
            </div>
        </details>`;
    });

    if (html === '') {
        html = '<div style="padding:40px;text-align:center;color:var(--text-muted);">Tiada padanan carian ditemui.</div>';
    }
    container.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', loadData);
