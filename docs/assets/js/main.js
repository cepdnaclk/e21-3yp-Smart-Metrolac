/* ==========================================================================
   Smart-Metrolac — main.js
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ── AOS (scroll animations) ── */
  if (window.AOS) {
    AOS.init({ duration: 700, easing: 'ease-out-cubic', once: true, offset: 60 });
  }

  /* ── Mobile menu ── */
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
      mobileMenu.classList.toggle('flex');
    });
  }

  /* ── Hero video graceful fallback ──
     If assets/img/rubber-farm-hero.mp4 doesn't exist yet, the <video> stays
     blank/transparent and the Ken-Burns-animated still image behind it shows instead. */
  const heroVideo = document.querySelector('.hero-bg');
  if (heroVideo) {
    heroVideo.addEventListener('error', () => { heroVideo.style.display = 'none'; }, true);
  }

  /* ── Animated counters (stats strip) ── */
  const counters = document.querySelectorAll('.counter[data-target]');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.dataset.target);
      const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0;
      const suffix = el.dataset.suffix || '';
      const prefix = el.dataset.prefix || '';
      const duration = 1400;
      const start = performance.now();
      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = target * eased;
        el.textContent = prefix + value.toFixed(decimals) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      counterObserver.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach(c => counterObserver.observe(c));

  /* ── Dashboard tabs (Software Design section) ── */
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => { b.classList.remove('active'); b.classList.add('text-primary'); });
      btn.classList.add('active'); btn.classList.remove('text-primary');
      document.querySelectorAll('.dash-panel').forEach(p => { p.classList.add('hidden'); p.style.opacity = 0; });
      const target = document.getElementById(btn.dataset.target);
      target.classList.remove('hidden');
      requestAnimationFrame(() => { target.style.opacity = 1; });
    });
  });

  /* ── Lalan Rubber validation: table + chart ──
     Fetches real data from data/lalan-validation.json when present,
     falls back to clearly-labelled placeholder data otherwise. Compares
     three methods: Lab oven (ISO 126 reference), Smart-Metrolac, and the
     traditional Glass Metrolac hydrometer. */
  const placeholderData = {
    samples: [
      { id: 'S1', lab: 33.2, smartMetrolac: 32.9, glassMetrolac: 34 },
      { id: 'S2', lab: 29.8, smartMetrolac: 30.1, glassMetrolac: 29 },
      { id: 'S3', lab: 35.6, smartMetrolac: 35.4, glassMetrolac: 36 },
      { id: 'S4', lab: 31.0, smartMetrolac: 31.2, glassMetrolac: 31 },
      { id: 'S5', lab: 28.4, smartMetrolac: 28.6, glassMetrolac: 29 },
      { id: 'S6', lab: 34.1, smartMetrolac: 33.8, glassMetrolac: 35 },
      { id: 'S7', lab: 30.5, smartMetrolac: 30.7, glassMetrolac: 30 },
      { id: 'S8', lab: 32.7, smartMetrolac: 32.5, glassMetrolac: 34 },
    ],
    smartMetrolac: { meanError: 0.74, maxError: 2.10 },
    glassMetrolac: { meanError: 1.53, maxError: 7.75 }
  };

  function fmtDev(dev) {
    const cls = Math.abs(dev) <= 1 ? 'text-on-tertiary-container' : 'text-error';
    return `<span class="${cls}">${dev > 0 ? '+' : ''}${dev.toFixed(2)}</span>`;
  }

  async function loadValidationData() {
    let data = placeholderData;
    let usingPlaceholder = true;
    try {
      const res = await fetch('data/lalan-validation.json');
      if (res.ok) {
        const json = await res.json();
        if (json.samples && json.samples.length) { data = json; usingPlaceholder = false; }
      }
    } catch (e) { /* fall back to placeholder silently */ }

    const samples = data.samples;

    const tbody = document.getElementById('validation-table-body');
    if (tbody) {
      tbody.innerHTML = samples.map((s, i) => {
        const smDev = s.smartMetrolac - s.lab;
        const glDev = s.glassMetrolac - s.lab;
        return `<tr class="border-b border-outline-variant/50" data-aos="fade-up" data-aos-delay="${i * 60}">
          <td class="py-2 pr-2 font-body-sm">${s.id}</td>
          <td class="py-2 pr-2">${s.lab.toFixed(2)}</td>
          <td class="py-2 pr-2">${s.smartMetrolac.toFixed(2)}</td>
          <td class="py-2 pr-2">${fmtDev(smDev)}</td>
          <td class="py-2 pr-2">${s.glassMetrolac.toFixed(2)}</td>
          <td class="py-2">${fmtDev(glDev)}</td>
        </tr>`;
      }).join('') + (usingPlaceholder ? `<tr><td colspan="6" class="pt-3 font-body-sm text-body-sm text-on-surface-variant italic">Showing placeholder data — add data/lalan-validation.json for real results</td></tr>` : '');
    }

    const smMean = document.getElementById('sm-mean-error');
    const smMax = document.getElementById('sm-max-error');
    const glMean = document.getElementById('gl-mean-error');
    const glMax = document.getElementById('gl-max-error');
    if (smMean) smMean.textContent = '±' + data.smartMetrolac.meanError.toFixed(2) + '%';
    if (smMax) smMax.textContent = '±' + data.smartMetrolac.maxError.toFixed(2) + '%';
    if (glMean) glMean.textContent = '±' + data.glassMetrolac.meanError.toFixed(2) + '%';
    if (glMax) glMax.textContent = '±' + data.glassMetrolac.maxError.toFixed(2) + '%';

    const canvas = document.getElementById('validation-chart');
    if (canvas && window.Chart) {
      new Chart(canvas, {
        type: 'bar',
        data: {
          labels: samples.map(s => s.id),
          datasets: [
            { label: 'Lab Oven — ISO 126 (%)', data: samples.map(s => s.lab), backgroundColor: '#1b3022', borderRadius: 4 },
            { label: 'Smart-Metrolac (%)', data: samples.map(s => s.smartMetrolac), backgroundColor: '#3ca1a0', borderRadius: 4 },
            { label: 'Glass Metrolac (%)', data: samples.map(s => s.glassMetrolac), backgroundColor: '#c3c8c1', borderRadius: 4 },
          ]
        },
        options: {
          responsive: true,
          animation: { duration: 900, easing: 'easeOutCubic' },
          plugins: { legend: { position: 'bottom', labels: { font: { family: 'Inter' } } } },
          scales: { y: { beginAtZero: false } }
        }
      });
    }
  }
  loadValidationData();

  /* ── Team & Supervisor: loaded live from data/index.json ──
     This is the same file the university's GitHub Pages system uses to list
     the project, so team info here always stays in sync with that one source. */
  const placeholderTeam = {
    team: [
      { name: 'Member Name', email: '', eNumber: 'E/21/XXX' },
      { name: 'Member Name', email: '', eNumber: 'E/21/XXX' },
      { name: 'Member Name', email: '', eNumber: 'E/21/XXX' },
      { name: 'Member Name', email: '', eNumber: 'E/21/XXX' },
    ],
    supervisors: [{ name: 'Supervisor Name', email: '' }]
  };

  function titleCaseName(name) {
    return name.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }

  async function loadTeamData() {
    let data = placeholderTeam;
    try {
      const res = await fetch('data/index.json');
      if (res.ok) {
        const json = await res.json();
        if (json.team && json.team.length) data = json;
      }
    } catch (e) { /* fall back to placeholder silently */ }

    const grid = document.getElementById('team-grid');
    if (grid) {
      grid.innerHTML = data.team.map((m, i) => `
        <div class="lift-card flex flex-col items-center gap-sm bg-surface-container-lowest border border-outline-variant rounded-lg p-md text-center" data-aos="fade-up" data-aos-delay="${i * 100}">
          <div class="w-20 h-20 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden">
            <img src="images/team-${i + 1}.jpg" alt="${m.name}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
            <span class="material-symbols-outlined text-outline" style="display:none">person</span>
          </div>
          <span class="font-label-caps text-label-caps text-primary">${titleCaseName(m.name)}</span>
          <span class="font-body-sm text-body-sm text-on-surface-variant">${m.eNumber}</span>
          ${m.email ? `<a href="mailto:${m.email}" class="material-symbols-outlined text-on-surface-variant text-[16px] hover:text-primary transition-colors">mail</a>` : ''}
        </div>`).join('');
    }

    const supCard = document.getElementById('supervisor-card');
    if (supCard && data.supervisors && data.supervisors.length) {
      supCard.innerHTML = data.supervisors.map(s => `
        <div class="w-14 h-14 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden">
          <img src="images/supervisor.jpg" alt="${s.name}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
          <span class="material-symbols-outlined text-outline" style="display:none">school</span>
        </div>
        <div>
          <span class="font-label-caps text-label-caps text-tertiary-fixed block">Project Supervisor</span>
          <span class="font-body-md text-body-md text-on-primary-container">${s.name}</span>
        </div>`).join('');
    }
  }
  loadTeamData();
});