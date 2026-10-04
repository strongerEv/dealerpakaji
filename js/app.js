// Aplikasi publik Dealer Pak Aji: katalog, detail, kredit, bandingkan, favorit, kontak.
const App = (() => {
  const app = document.getElementById('app');
  const routes = {};

  // ---------- Utilitas ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function rupiah(n) {
    return 'Rp ' + Math.round(Number(n) || 0).toLocaleString('id-ID');
  }

  function rupiahShort(n) {
    n = Number(n) || 0;
    if (n >= 1e9) return 'Rp ' + (n / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 2 }) + ' M';
    if (n >= 1e6) return 'Rp ' + (n / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' jt';
    return rupiah(n);
  }

  function carName(c) {
    return `${c.brand} ${c.model}`;
  }

  function waLink(text) {
    const s = Store.settings();
    return `https://wa.me/${s.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
  }

  let toastTimer;
  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.hidden = false;
    requestAnimationFrame(() => t.classList.add('show'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      t.classList.remove('show');
      setTimeout(() => (t.hidden = true), 250);
    }, 2600);
  }

  // ---------- Modal ----------
  const modal = document.getElementById('modal');
  function openModal(html, onMount) {
    $('#modalBody').innerHTML = html;
    modal.hidden = false;
    document.body.classList.add('no-scroll');
    if (onMount) onMount($('#modalBody'));
    const first = $('#modalBody input, #modalBody select, #modalBody textarea, #modalBody button');
    if (first) first.focus();
  }
  function closeModal() {
    modal.hidden = true;
    document.body.classList.remove('no-scroll');
    $('#modalBody').innerHTML = '';
  }
  modal.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) closeModal();
  });

  // ---------- Kredit ----------
  const TENORS = [1, 2, 3, 4, 5];
  function rateFor(tenor, condition) {
    const base = { 1: 4.5, 2: 5, 3: 5.5, 4: 6, 5: 6.5 }[tenor] || 6;
    return condition === 'Bekas' ? base + 2 : base;
  }
  function calcCredit(price, dpPct, tenor, condition) {
    const dp = Math.round(price * dpPct / 100);
    const principal = price - dp;
    const rate = rateFor(tenor, condition);
    const interest = principal * (rate / 100) * tenor;
    const monthly = (principal + interest) / (tenor * 12);
    return { dp, principal, rate, interest, monthly, total: dp + principal + interest, firstPay: dp + monthly };
  }
  function startingInstallment(c) {
    return calcCredit(c.price, 20, 5, c.condition).monthly;
  }

  // ---------- Komponen ----------
  const ICON = {
    heart: '<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.5-9.2C1.2 8.6 3.2 5 6.7 5c2 0 3.4 1.1 4.3 2.4h2C13.9 6.1 15.3 5 17.3 5c3.5 0 5.5 3.6 4.2 6.8C19.5 16.4 12 21 12 21z"/></svg>',
    wa: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.3-.5 0-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.3.5-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.7-.1l1-1.2c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.5.3.1.2.1.7-.1 1.3z"/></svg>',
    compare: '<svg viewBox="0 0 24 24"><path d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5v2h2V1h-2zm0 15H5l5-6zm9-15h-5v2h5v13l-5-6v9h5a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M9 16.2l-3.5-3.5L4 14.2l5 5 11-11-1.4-1.4z"/></svg>',
    search: '<svg viewBox="0 0 24 24"><path d="M10 2a8 8 0 0 1 6.3 12.9l5.4 5.4-1.4 1.4-5.4-5.4A8 8 0 1 1 10 2zm0 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12z"/></svg>',
  };

  function statusClass(s) {
    return { Tersedia: 'ok', Inden: 'warn', Booking: 'info', Terjual: 'muted' }[s] || 'muted';
  }

  function carCard(c) {
    const fav = Store.favs().includes(c.id);
    const inCompare = Store.compare().includes(c.id);
    return `
      <article class="card car-card ${c.status === 'Terjual' ? 'is-sold' : ''}">
        <a href="#/mobil/${esc(c.id)}" class="car-media">
          <img src="${esc(c.image)}" alt="${esc(carName(c))}" loading="lazy">
          <span class="pill pill-${statusClass(c.status)}">${esc(c.status)}</span>
          <span class="pill pill-cond ${c.condition === 'Bekas' ? 'used' : ''}">${esc(c.condition)}</span>
        </a>
        <button class="fav-btn ${fav ? 'active' : ''}" data-fav="${esc(c.id)}" aria-label="Simpan ke favorit" aria-pressed="${fav}">${ICON.heart}</button>
        <div class="car-body">
          <p class="car-brand">${esc(c.brand)} · ${esc(c.year)}</p>
          <h3><a href="#/mobil/${esc(c.id)}">${esc(c.model)}</a></h3>
          <p class="car-variant">${esc(c.variant)}</p>
          <ul class="chips">
            <li>${esc(c.type)}</li><li>${esc(c.transmission)}</li><li>${esc(c.fuel)}</li><li>${esc(c.seats)} kursi</li>
            ${c.condition === 'Bekas' ? `<li>${Number(c.km).toLocaleString('id-ID')} km</li>` : ''}
          </ul>
          <div class="car-price">
            <strong>${rupiah(c.price)}</strong>
            <small>Angsuran mulai ${rupiahShort(startingInstallment(c))}/bln</small>
          </div>
          <div class="car-actions">
            <a class="btn btn-primary btn-sm" href="#/mobil/${esc(c.id)}">Lihat Detail</a>
            <button class="btn btn-ghost btn-sm ${inCompare ? 'active' : ''}" data-compare="${esc(c.id)}">${ICON.compare}${inCompare ? 'Dibandingkan' : 'Bandingkan'}</button>
          </div>
        </div>
      </article>`;
  }

  function emptyState(title, text, cta = '') {
    return `<div class="empty"><div class="empty-icon">🚗</div><h3>${title}</h3><p>${text}</p>${cta}</div>`;
  }

  // Event global untuk tombol favorit & bandingkan di kartu.
  app.addEventListener('click', (e) => {
    const favBtn = e.target.closest('[data-fav]');
    if (favBtn) {
      e.preventDefault();
      const on = Store.toggleFav(favBtn.dataset.fav);
      favBtn.classList.toggle('active', on);
      favBtn.setAttribute('aria-pressed', on);
      toast(on ? 'Disimpan ke favorit' : 'Dihapus dari favorit');
      updateCounters();
      if (!on && currentRoute() === 'favorit') render();
      return;
    }
    const cmpBtn = e.target.closest('[data-compare]');
    if (cmpBtn) {
      e.preventDefault();
      toggleCompare(cmpBtn.dataset.compare);
      render(false);
    }
  });

  function toggleCompare(id) {
    let ids = Store.compare();
    if (ids.includes(id)) {
      ids = ids.filter((x) => x !== id);
      toast('Dihapus dari perbandingan');
    } else {
      if (ids.length >= 3) {
        toast('Maksimal 3 mobil untuk dibandingkan');
        return;
      }
      ids.push(id);
      toast('Ditambahkan ke perbandingan');
    }
    Store.setCompare(ids);
    updateCounters();
  }

  function updateCounters() {
    const favs = Store.favs().filter((id) => Store.car(id));
    const cmp = Store.compare().filter((id) => Store.car(id));
    const fc = document.getElementById('favCount');
    fc.hidden = !favs.length;
    const cc = document.getElementById('compareCount');
    cc.hidden = !cmp.length;
    cc.textContent = cmp.length;
  }

  function applySettings() {
    const s = Store.settings();
    $$('[data-setting]').forEach((el) => (el.textContent = s[el.dataset.setting] || ''));
    document.getElementById('waFloat').href = waLink(`Halo ${s.dealerName}, saya ingin bertanya tentang mobil.`);
    document.getElementById('year').textContent = new Date().getFullYear();
  }

  // ---------- Form prospek (test drive, kredit, pertanyaan) ----------
  function leadForm(kind, car, extra = {}) {
    const cars = Store.cars().filter((c) => c.status !== 'Terjual');
    const title = { 'Test Drive': 'Booking Test Drive', Kredit: 'Ajukan Kredit', Pertanyaan: 'Tanya Mobil', 'Tukar Tambah': 'Tukar Tambah' }[kind] || kind;
    const today = new Date().toISOString().slice(0, 10);
    openModal(`
      <h2 id="modalTitle">${title}</h2>
      ${car ? `<div class="mini-car"><img src="${esc(car.image)}" alt=""><div><strong>${esc(carName(car))}</strong><span>${esc(car.variant)} · ${rupiah(car.price)}</span></div></div>` : ''}
      ${extra.summary ? `<div class="note">${extra.summary}</div>` : ''}
      <form id="leadForm" class="form" novalidate>
        <label>Nama lengkap<input name="name" required autocomplete="name" placeholder="cth. Budi Santoso"></label>
        <label>No. WhatsApp<input name="phone" required inputmode="tel" autocomplete="tel" placeholder="08xxxxxxxxxx"></label>
        ${car ? `<input type="hidden" name="carId" value="${esc(car.id)}">` : `
        <label>Mobil yang diminati
          <select name="carId"><option value="">— Pilih mobil —</option>${cars.map((c) => `<option value="${esc(c.id)}">${esc(carName(c))} ${esc(c.variant)}</option>`).join('')}</select>
        </label>`}
        ${kind === 'Test Drive' ? `
        <div class="form-row">
          <label>Tanggal<input type="date" name="date" min="${today}" required></label>
          <label>Jam<select name="time"><option>09.00</option><option>11.00</option><option>13.00</option><option>15.00</option></select></label>
        </div>
        <label>Lokasi test drive<select name="location"><option>Di showroom</option><option>Di rumah (home test drive)</option></select></label>` : ''}
        ${kind === 'Tukar Tambah' ? `
        <div class="form-row">
          <label>Mobil lama Anda<input name="tradeCar" placeholder="cth. Honda Brio 2018" required></label>
          <label>Kilometer<input name="tradeKm" inputmode="numeric" placeholder="cth. 60000"></label>
        </div>` : ''}
        <label>Catatan<textarea name="note" rows="3" placeholder="Pertanyaan atau permintaan khusus">${esc(extra.note || '')}</textarea></label>
        <p class="form-error" id="leadError" hidden></p>
        <button class="btn btn-primary btn-block" type="submit">Kirim ${kind === 'Kredit' ? 'Pengajuan' : 'Permintaan'}</button>
        <p class="muted small center">Data tersimpan di dealer dan Anda bisa melanjutkan chat via WhatsApp.</p>
      </form>`, (root) => {
      $('#leadForm', root).addEventListener('submit', (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        const err = $('#leadError', root);
        if (!data.name.trim()) return showErr(err, 'Nama wajib diisi.');
        if (!/^(\+?62|0)8\d{7,12}$/.test(data.phone.replace(/[\s-]/g, ''))) return showErr(err, 'Nomor WhatsApp tidak valid (cth. 081234567890).');
        if (kind === 'Test Drive' && !data.date) return showErr(err, 'Pilih tanggal test drive.');
        if (kind === 'Tukar Tambah' && !data.tradeCar.trim()) return showErr(err, 'Isi mobil lama Anda.');
        const c = data.carId ? Store.car(data.carId) : null;
        Store.addLead({ type: kind, ...data, carName: c ? `${carName(c)} ${c.variant}` : '', credit: extra.credit || null });
        const lines = [
          `Halo ${Store.settings().dealerName}, saya ${data.name}.`,
          `Saya ingin ${title.toLowerCase()}${c ? ` untuk ${carName(c)} ${c.variant} (${rupiah(c.price)})` : ''}.`,
          data.date ? `Jadwal: ${data.date} jam ${data.time}, ${data.location}.` : '',
          data.tradeCar ? `Mobil lama: ${data.tradeCar}${data.tradeKm ? `, ${data.tradeKm} km` : ''}.` : '',
          extra.credit ? `Simulasi: DP ${rupiah(extra.credit.dp)}, tenor ${extra.credit.tenor} th, angsuran ${rupiah(extra.credit.monthly)}/bln.` : '',
          data.note ? `Catatan: ${data.note}` : '',
        ].filter(Boolean);
        openModal(`
          <div class="success">
            <div class="success-icon">${ICON.check}</div>
            <h2 id="modalTitle">Terima kasih, ${esc(data.name.split(' ')[0])}!</h2>
            <p>Permintaan Anda sudah kami terima. Tim sales akan menghubungi Anda segera.</p>
            <a class="btn btn-wa btn-block" href="${waLink(lines.join('\n'))}" target="_blank" rel="noopener">${ICON.wa} Lanjutkan via WhatsApp</a>
            <button class="btn btn-ghost btn-block" data-close>Tutup</button>
          </div>`);
      });
    });
  }
  function showErr(el, msg) {
    el.textContent = msg;
    el.hidden = false;
  }

  // ---------- Halaman ----------
  routes.home = () => {
    const s = Store.settings();
    const cars = Store.cars();
    const available = cars.filter((c) => c.status !== 'Terjual');
    const featured = available.filter((c) => c.featured).slice(0, 6);
    const brands = [...new Set(cars.map((c) => c.brand))];
    const minPrice = Math.min(...available.map((c) => c.price));
    const heroCar = featured[0] || available[0];
    return `
      <section class="hero">
        <div class="hero-text">
          <span class="eyebrow">Dealer Mobil Terpercaya</span>
          <h1>Temukan mobil impian bersama <span>${esc(s.dealerName)}</span></h1>
          <p>${esc(s.tagline)}</p>
          <form class="hero-search" id="heroSearch" role="search">
            ${ICON.search}
            <input name="q" placeholder="Cari merek atau model, cth. Innova" aria-label="Cari mobil">
            <button class="btn btn-accent" type="submit">Cari</button>
          </form>
          <div class="hero-cta">
            <a class="btn btn-light" href="#/kredit">Hitung Kredit</a>
            <button class="btn btn-outline-light" data-lead="Test Drive">Booking Test Drive</button>
          </div>
        </div>
        ${heroCar ? `<a class="hero-media" href="#/mobil/${esc(heroCar.id)}"><img src="${esc(heroCar.image)}" alt="${esc(carName(heroCar))}"><span class="hero-tag">${esc(carName(heroCar))}<strong>${rupiahShort(heroCar.price)}</strong></span></a>` : ''}
      </section>

      <section class="stats">
        <div><strong>${available.length}</strong><span>Unit siap jual</span></div>
        <div><strong>${brands.length}</strong><span>Merek pilihan</span></div>
        <div><strong>${isFinite(minPrice) ? rupiahShort(minPrice) : '-'}</strong><span>Harga mulai</span></div>
        <div><strong>DP 20%</strong><span>Kredit mudah</span></div>
      </section>

      <section class="section">
        <div class="section-head"><h2>Cari berdasarkan kategori</h2></div>
        <div class="category-grid">
          ${[['SUV', 'Gagah & tangguh', 'type=SUV'], ['MPV', 'Keluarga 7 kursi', 'type=MPV'], ['Minibus', 'Usaha & niaga', 'type=Minibus'], ['Bekas', 'Mobil bekas pilihan', 'condition=Bekas']]
            .map(([t, d, q]) => `<a class="category" href="#/katalog?${q}"><strong>${t}</strong><span>${d}</span><em>${cars.filter((c) => c.type === t || c.condition === t).filter((c) => c.status !== 'Terjual').length} unit</em></a>`).join('')}
        </div>
      </section>

      <section class="section">
        <div class="section-head"><h2>Mobil unggulan</h2><a href="#/katalog">Lihat semua →</a></div>
        <div class="car-grid">${featured.map(carCard).join('') || emptyState('Belum ada mobil unggulan', 'Tandai mobil sebagai unggulan dari halaman admin.')}</div>
      </section>

      <section class="section">
        <div class="section-head"><h2>Merek tersedia</h2></div>
        <div class="brand-row">${brands.map((b) => `<a href="#/katalog?brand=${encodeURIComponent(b)}" class="brand-chip">${esc(b)}</a>`).join('')}</div>
      </section>

      <section class="section why">
        <h2>Kenapa beli di ${esc(s.dealerName)}?</h2>
        <div class="why-grid">
          <div><span>🛡️</span><h3>Unit terjamin</h3><p>Mobil bekas lolos inspeksi 150 titik, bebas banjir & tabrak.</p></div>
          <div><span>💳</span><h3>Kredit mudah</h3><p>Bekerja sama dengan leasing ternama, DP ringan, proses cepat.</p></div>
          <div><span>🔁</span><h3>Tukar tambah</h3><p>Mobil lama Anda kami taksir dengan harga terbaik.</p></div>
          <div><span>🚚</span><h3>Antar ke rumah</h3><p>Test drive dan pengiriman unit langsung ke rumah Anda.</p></div>
        </div>
        <button class="btn btn-accent" data-lead="Tukar Tambah">Ajukan Tukar Tambah</button>
      </section>

      <section class="section">
        <div class="section-head"><h2>Cara beli mobil</h2></div>
        <ol class="steps">
          <li><strong>Pilih mobil</strong><span>Jelajahi katalog & bandingkan spesifikasi.</span></li>
          <li><strong>Hitung kredit</strong><span>Sesuaikan DP dan tenor dengan budget.</span></li>
          <li><strong>Test drive</strong><span>Booking jadwal di showroom atau rumah.</span></li>
          <li><strong>Bawa pulang</strong><span>Proses dokumen cepat, unit siap antar.</span></li>
        </ol>
      </section>`;
  };
  routes.home.mount = () => {
    $('#heroSearch').addEventListener('submit', (e) => {
      e.preventDefault();
      const q = new FormData(e.target).get('q').trim();
      location.hash = '#/katalog' + (q ? '?q=' + encodeURIComponent(q) : '');
    });
  };

  // Katalog
  const SORTS = {
    terbaru: (a, b) => b.year - a.year,
    termurah: (a, b) => a.price - b.price,
    termahal: (a, b) => b.price - a.price,
    nama: (a, b) => carName(a).localeCompare(carName(b)),
  };
  function filterCars(f) {
    const q = (f.q || '').toLowerCase().trim();
    return Store.cars()
      .filter((c) => !q || `${c.brand} ${c.model} ${c.variant} ${c.type} ${c.color}`.toLowerCase().includes(q))
      .filter((c) => !f.brand || c.brand === f.brand)
      .filter((c) => !f.type || c.type === f.type)
      .filter((c) => !f.condition || c.condition === f.condition)
      .filter((c) => !f.transmission || (f.transmission === 'Manual' ? c.transmission === 'MT' : c.transmission !== 'MT'))
      .filter((c) => !f.max || c.price <= Number(f.max))
      .filter((c) => f.sold === '1' || c.status !== 'Terjual')
      .sort(SORTS[f.sort] || SORTS.terbaru);
  }
  function optionList(values, selected, label) {
    return `<option value="">${label}</option>` + values.map((v) => `<option ${v === selected ? 'selected' : ''}>${esc(v)}</option>`).join('');
  }
  routes.katalog = (params) => {
    const cars = Store.cars();
    const f = params;
    const list = filterCars(f);
    const brands = [...new Set(cars.map((c) => c.brand))].sort();
    const types = [...new Set(cars.map((c) => c.type))].sort();
    const priceSteps = [200e6, 300e6, 400e6, 500e6, 1e9];
    return `
      <div class="page-head">
        <h1>Katalog Mobil</h1>
        <p>${list.length} mobil ditemukan</p>
      </div>
      <form class="filters card" id="filters">
        <label class="filter-search">${ICON.search}<input name="q" value="${esc(f.q || '')}" placeholder="Cari mobil…" aria-label="Cari"></label>
        <select name="brand" aria-label="Merek">${optionList(brands, f.brand, 'Semua merek')}</select>
        <select name="type" aria-label="Tipe">${optionList(types, f.type, 'Semua tipe')}</select>
        <select name="condition" aria-label="Kondisi">${optionList(['Baru', 'Bekas'], f.condition, 'Baru & bekas')}</select>
        <select name="transmission" aria-label="Transmisi">${optionList(['Otomatis', 'Manual'], f.transmission, 'Semua transmisi')}</select>
        <select name="max" aria-label="Harga maksimal"><option value="">Semua harga</option>${priceSteps.map((p) => `<option value="${p}" ${String(p) === f.max ? 'selected' : ''}>≤ ${rupiahShort(p)}</option>`).join('')}</select>
        <select name="sort" aria-label="Urutkan">${Object.keys(SORTS).map((k) => `<option value="${k}" ${k === (f.sort || 'terbaru') ? 'selected' : ''}>Urut: ${k}</option>`).join('')}</select>
        <label class="check"><input type="checkbox" name="sold" value="1" ${f.sold === '1' ? 'checked' : ''}> Tampilkan terjual</label>
        <button type="button" class="btn btn-ghost btn-sm" id="resetFilter">Reset</button>
      </form>
      <div class="car-grid">${list.map(carCard).join('') || emptyState('Mobil tidak ditemukan', 'Coba ubah kata kunci atau filter pencarian.', '<button class="btn btn-primary" data-lead="Pertanyaan">Minta dicarikan unit</button>')}</div>`;
  };
  routes.katalog.mount = () => {
    const form = $('#filters');
    const update = () => {
      const data = Object.fromEntries([...new FormData(form)].filter(([, v]) => v));
      const qs = new URLSearchParams(data).toString();
      history.replaceState(null, '', '#/katalog' + (qs ? '?' + qs : ''));
      render(false);
      const input = $('#filters input[name=q]');
      if (data.q && input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    };
    let t;
    form.addEventListener('input', (e) => {
      clearTimeout(t);
      t = setTimeout(update, e.target.name === 'q' ? 250 : 0);
    });
    form.addEventListener('submit', (e) => e.preventDefault());
    $('#resetFilter').addEventListener('click', () => {
      history.replaceState(null, '', '#/katalog');
      render(false);
    });
  };

  // Detail mobil
  routes.mobil = (params, id) => {
    const c = Store.car(id);
    if (!c) return emptyState('Mobil tidak ditemukan', 'Unit mungkin sudah terjual atau dihapus.', '<a class="btn btn-primary" href="#/katalog">Kembali ke katalog</a>');
    const fav = Store.favs().includes(c.id);
    const inCompare = Store.compare().includes(c.id);
    const related = Store.cars().filter((x) => x.id !== c.id && x.status !== 'Terjual' && (x.type === c.type || x.brand === c.brand)).slice(0, 3);
    const specs = [
      ['Merek', c.brand], ['Model', c.model], ['Varian', c.variant], ['Tahun', c.year], ['Kondisi', c.condition],
      ['Tipe bodi', c.type], ['Mesin', c.engine], ['Transmisi', c.transmission], ['Bahan bakar', c.fuel],
      ['Kapasitas', `${c.seats} penumpang`], ['Warna', c.color], ...(c.condition === 'Bekas' ? [['Kilometer', `${Number(c.km).toLocaleString('id-ID')} km`]] : []),
    ];
    return `
      <nav class="crumbs"><a href="#/katalog">Katalog</a> / <span>${esc(carName(c))}</span></nav>
      <section class="detail">
        <div class="detail-media card">
          <img src="${esc(c.image)}" alt="${esc(carName(c))}">
          <span class="pill pill-${statusClass(c.status)}">${esc(c.status)}</span>
        </div>
        <div class="detail-info">
          <p class="car-brand">${esc(c.brand)} · ${esc(c.year)} · ${esc(c.condition)}</p>
          <h1>${esc(c.model)} <small>${esc(c.variant)}</small></h1>
          <p class="detail-price">${rupiah(c.price)}</p>
          <p class="muted">Angsuran mulai <strong>${rupiah(startingInstallment(c))}</strong>/bulan (DP 20%, 5 tahun)</p>
          <p>${esc(c.description)}</p>
          <ul class="chips">${(c.features || []).map((f) => `<li>${ICON.check}${esc(f)}</li>`).join('')}</ul>
          <div class="detail-actions">
            <a class="btn btn-wa" href="${waLink(`Halo ${Store.settings().dealerName}, saya tertarik dengan ${carName(c)} ${c.variant} ${c.year} (${rupiah(c.price)}). Apakah masih tersedia?`)}" target="_blank" rel="noopener">${ICON.wa} Chat WhatsApp</a>
            <button class="btn btn-primary" data-lead="Test Drive" data-car="${esc(c.id)}" ${c.status === 'Terjual' ? 'disabled' : ''}>Booking Test Drive</button>
            <button class="btn btn-ghost fav-inline ${fav ? 'active' : ''}" data-fav="${esc(c.id)}" aria-pressed="${fav}">${ICON.heart} Favorit</button>
            <button class="btn btn-ghost ${inCompare ? 'active' : ''}" data-compare="${esc(c.id)}">${ICON.compare} ${inCompare ? 'Dibandingkan' : 'Bandingkan'}</button>
          </div>
        </div>
      </section>

      <section class="detail-grid">
        <div class="card pad">
          <h2>Spesifikasi</h2>
          <dl class="spec">${specs.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
        </div>
        <div class="card pad" id="detailCredit">${creditWidget(c)}</div>
      </section>

      ${related.length ? `<section class="section"><div class="section-head"><h2>Mobil serupa</h2></div><div class="car-grid">${related.map(carCard).join('')}</div></section>` : ''}`;
  };
  routes.mobil.mount = (params, id) => {
    const c = Store.car(id);
    if (c) mountCreditWidget($('#detailCredit'), c);
  };

  // Widget simulasi kredit (dipakai di detail & halaman kredit)
  function creditWidget(c, state = { dp: 25, tenor: 4 }) {
    return `
      <h2>Simulasi Kredit</h2>
      <div class="credit">
        <label>Uang muka (DP): <strong data-out="dpPct">${state.dp}%</strong>
          <input type="range" name="dp" min="10" max="70" step="5" value="${state.dp}">
        </label>
        <div class="seg" role="radiogroup" aria-label="Tenor">
          ${TENORS.map((t) => `<label><input type="radio" name="tenor" value="${t}" ${t === state.tenor ? 'checked' : ''}><span>${t} th</span></label>`).join('')}
        </div>
        <div class="credit-result" data-out="result"></div>
        <button class="btn btn-accent btn-block" data-apply ${c.status === 'Terjual' ? 'disabled' : ''}>Ajukan Kredit Ini</button>
        <p class="muted small">Estimasi bunga flat ${c.condition === 'Bekas' ? '(mobil bekas)' : ''}; angka final mengikuti persetujuan leasing.</p>
      </div>`;
  }
  function mountCreditWidget(root, c) {
    const calc = () => {
      const dp = Number($('[name=dp]', root).value);
      const tenor = Number($('[name=tenor]:checked', root).value);
      const r = calcCredit(c.price, dp, tenor, c.condition);
      $('[data-out=dpPct]', root).textContent = dp + '%';
      $('[data-out=result]', root).innerHTML = `
        <div class="big"><span>Angsuran / bulan</span><strong>${rupiah(r.monthly)}</strong></div>
        <dl class="spec compact">
          <div><dt>Harga OTR</dt><dd>${rupiah(c.price)}</dd></div>
          <div><dt>Uang muka</dt><dd>${rupiah(r.dp)}</dd></div>
          <div><dt>Pokok hutang</dt><dd>${rupiah(r.principal)}</dd></div>
          <div><dt>Bunga flat</dt><dd>${r.rate.toLocaleString('id-ID')}% / tahun</dd></div>
          <div><dt>Pembayaran pertama*</dt><dd>${rupiah(r.firstPay)}</dd></div>
          <div><dt>Total bayar</dt><dd>${rupiah(r.total)}</dd></div>
        </dl>
        <p class="muted small">*DP + angsuran pertama (ADDM).</p>`;
      return { ...r, tenor, dpPct: dp };
    };
    root.addEventListener('input', calc);
    calc();
    $('[data-apply]', root).addEventListener('click', () => {
      const r = calc();
      leadForm('Kredit', c, {
        credit: { dp: r.dp, dpPct: r.dpPct, tenor: r.tenor, monthly: Math.round(r.monthly) },
        summary: `DP ${r.dpPct}% (${rupiah(r.dp)}) · ${r.tenor} tahun · <strong>${rupiah(r.monthly)}/bln</strong>`,
      });
    });
  }

  // Halaman simulasi kredit
  routes.kredit = (params) => {
    const cars = Store.cars().filter((c) => c.status !== 'Terjual').sort(SORTS.termurah);
    const sel = Store.car(params.car) || cars[0];
    if (!sel) return emptyState('Belum ada stok', 'Silakan kembali lagi nanti.');
    const rows = TENORS.map((t) => {
      const r = calcCredit(sel.price, 20, t, sel.condition);
      const r30 = calcCredit(sel.price, 30, t, sel.condition);
      return `<tr><td>${t} tahun</td><td>${rupiah(r.monthly)}</td><td>${rupiah(r30.monthly)}</td></tr>`;
    }).join('');
    return `
      <div class="page-head"><h1>Simulasi Kredit</h1><p>Hitung angsuran sesuai budget Anda.</p></div>
      <section class="detail-grid">
        <div class="card pad">
          <label class="field">Pilih mobil
            <select id="creditCar">${cars.map((c) => `<option value="${esc(c.id)}" ${c.id === sel.id ? 'selected' : ''}>${esc(carName(c))} ${esc(c.variant)} — ${rupiahShort(c.price)}</option>`).join('')}</select>
          </label>
          <div class="mini-car big-mini"><img src="${esc(sel.image)}" alt=""><div><strong>${esc(carName(sel))}</strong><span>${esc(sel.variant)} · ${esc(sel.year)} · ${esc(sel.condition)}</span><span class="price">${rupiah(sel.price)}</span></div></div>
          <h3>Tabel angsuran per bulan</h3>
          <div class="table-wrap"><table class="table"><thead><tr><th>Tenor</th><th>DP 20%</th><th>DP 30%</th></tr></thead><tbody>${rows}</tbody></table></div>
        </div>
        <div class="card pad" id="pageCredit">${creditWidget(sel)}</div>
      </section>`;
  };
  routes.kredit.mount = (params) => {
    const sel = Store.car(params.car) || Store.cars().filter((c) => c.status !== 'Terjual').sort(SORTS.termurah)[0];
    if (!sel) return;
    mountCreditWidget($('#pageCredit'), sel);
    $('#creditCar').addEventListener('change', (e) => {
      history.replaceState(null, '', '#/kredit?car=' + encodeURIComponent(e.target.value));
      render(false);
    });
  };

  // Bandingkan
  routes.bandingkan = () => {
    const ids = Store.compare().filter((id) => Store.car(id));
    const cars = ids.map(Store.car);
    const others = Store.cars().filter((c) => !ids.includes(c.id) && c.status !== 'Terjual');
    const add = ids.length < 3 && others.length ? `
      <div class="compare-add card pad">
        <label class="field">Tambah mobil untuk dibandingkan
          <select id="compareAdd"><option value="">— Pilih mobil —</option>${others.map((c) => `<option value="${esc(c.id)}">${esc(carName(c))} ${esc(c.variant)}</option>`).join('')}</select>
        </label>
      </div>` : '';
    if (!cars.length) return `<div class="page-head"><h1>Bandingkan Mobil</h1></div>${emptyState('Belum ada mobil dipilih', 'Pilih hingga 3 mobil untuk dibandingkan spesifikasinya.', '')}${add}`;
    const minPrice = Math.min(...cars.map((c) => c.price));
    const rows = [
      ['Harga', (c) => `<strong class="${c.price === minPrice && cars.length > 1 ? 'best' : ''}">${rupiah(c.price)}</strong>`],
      ['Angsuran mulai', (c) => rupiah(startingInstallment(c)) + '/bln'],
      ['Tahun', (c) => esc(c.year)], ['Kondisi', (c) => esc(c.condition)], ['Tipe', (c) => esc(c.type)],
      ['Mesin', (c) => esc(c.engine)], ['Transmisi', (c) => esc(c.transmission)], ['Bahan bakar', (c) => esc(c.fuel)],
      ['Kursi', (c) => esc(c.seats)], ['Kilometer', (c) => (c.condition === 'Bekas' ? Number(c.km).toLocaleString('id-ID') + ' km' : '—')],
      ['Fitur', (c) => `<ul class="feat">${(c.features || []).map((f) => `<li>${esc(f)}</li>`).join('')}</ul>`],
    ];
    return `
      <div class="page-head"><h1>Bandingkan Mobil</h1><p>${cars.length} dari 3 mobil</p></div>
      <div class="table-wrap card">
        <table class="table compare">
          <thead><tr><th></th>${cars.map((c) => `
            <th><div class="compare-head">
              <img src="${esc(c.image)}" alt="">
              <a href="#/mobil/${esc(c.id)}">${esc(carName(c))}</a><small>${esc(c.variant)}</small>
              <button class="link-btn" data-compare="${esc(c.id)}">Hapus</button>
            </div></th>`).join('')}</tr></thead>
          <tbody>${rows.map(([label, fn]) => `<tr><th>${label}</th>${cars.map((c) => `<td>${fn(c)}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
      </div>
      ${add}`;
  };
  routes.bandingkan.mount = () => {
    const sel = $('#compareAdd');
    if (sel) sel.addEventListener('change', (e) => {
      if (!e.target.value) return;
      toggleCompare(e.target.value);
      render(false);
    });
  };

  // Favorit
  routes.favorit = () => {
    const cars = Store.favs().map(Store.car).filter(Boolean);
    return `
      <div class="page-head"><h1>Mobil Favorit</h1><p>${cars.length} mobil disimpan</p></div>
      <div class="car-grid">${cars.map(carCard).join('') || emptyState('Belum ada favorit', 'Ketuk ikon hati pada mobil untuk menyimpannya di sini.', '<a class="btn btn-primary" href="#/katalog">Jelajahi katalog</a>')}</div>`;
  };

  // Kontak
  routes.kontak = () => {
    const s = Store.settings();
    return `
      <div class="page-head"><h1>Hubungi Kami</h1><p>Kami siap membantu Anda memilih mobil terbaik.</p></div>
      <section class="detail-grid">
        <div class="card pad contact">
          <h2>${esc(s.dealerName)}</h2>
          <dl class="spec">
            <div><dt>Alamat</dt><dd>${esc(s.address)}</dd></div>
            <div><dt>Telepon</dt><dd><a href="tel:${esc(s.phone.replace(/[^\d+]/g, ''))}">${esc(s.phone)}</a></dd></div>
            <div><dt>WhatsApp</dt><dd><a href="${waLink('Halo, saya ingin bertanya.')}" target="_blank" rel="noopener">+${esc(s.whatsapp)}</a></dd></div>
            <div><dt>Email</dt><dd><a href="mailto:${esc(s.email)}">${esc(s.email)}</a></dd></div>
            <div><dt>Jam buka</dt><dd>${esc(s.hours)}</dd></div>
          </dl>
          <div class="detail-actions">
            <a class="btn btn-wa" href="${waLink(`Halo ${s.dealerName}, saya ingin bertanya.`)}" target="_blank" rel="noopener">${ICON.wa} Chat WhatsApp</a>
            <a class="btn btn-ghost" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address)}" target="_blank" rel="noopener">Buka di Maps</a>
          </div>
        </div>
        <div class="card pad">
          <h2>Ada yang bisa kami bantu?</h2>
          <div class="action-list">
            <button class="action" data-lead="Pertanyaan"><strong>Tanya stok & harga</strong><span>Kami bantu carikan unit yang sesuai.</span></button>
            <button class="action" data-lead="Test Drive"><strong>Booking test drive</strong><span>Di showroom atau di rumah Anda.</span></button>
            <button class="action" data-lead="Kredit"><strong>Konsultasi kredit</strong><span>Cari skema DP & tenor terbaik.</span></button>
            <button class="action" data-lead="Tukar Tambah"><strong>Tukar tambah</strong><span>Taksir mobil lama Anda.</span></button>
          </div>
        </div>
      </section>`;
  };

  // Tombol pembuka form prospek di mana saja.
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-lead]');
    if (!b) return;
    e.preventDefault();
    leadForm(b.dataset.lead, b.dataset.car ? Store.car(b.dataset.car) : null);
  });

  // ---------- Router ----------
  function parseHash() {
    const raw = location.hash.replace(/^#\/?/, '');
    const [path, qs] = raw.split('?');
    const parts = path.split('/').filter(Boolean);
    return { name: parts[0] || 'home', arg: parts[1] ? decodeURIComponent(parts[1]) : undefined, params: Object.fromEntries(new URLSearchParams(qs || '')) };
  }
  function currentRoute() {
    return parseHash().name;
  }

  function render(scrollTop = true) {
    const { name, arg, params } = parseHash();
    const view = routes[name] || routes.home;
    app.innerHTML = view(params, arg);
    if (view.mount) view.mount(params, arg);
    $$('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === (routes[name] ? name : 'home') || (name === 'mobil' && a.dataset.nav === 'katalog')));
    document.body.classList.toggle('is-admin', name === 'admin');
    updateCounters();
    if (scrollTop) {
      window.scrollTo(0, 0);
      app.focus({ preventScroll: true });
    }
  }

  function start() {
    Store.init();
    applySettings();
    window.addEventListener('hashchange', () => render());
    render();
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  return {
    routes, render, start, toast, openModal, closeModal, esc, rupiah, rupiahShort, carName, statusClass, applySettings, $, $$,
  };
})();

document.addEventListener('DOMContentLoaded', App.start);
