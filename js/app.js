// Aplikasi publik Dealer Pak Aji: beranda, stok, detail, kredit, jual mobil, bandingkan, favorit, kontak.
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
  const km = (n) => Number(n || 0).toLocaleString('id-ID') + ' km';
  const carName = (c) => `${c.brand} ${c.model}`;
  const isAuto = (c) => c.transmission !== 'MT';

  function waLink(text) {
    return `https://wa.me/${Store.settings().whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
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

  // ---------- Ikon ----------
  const I = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
  const ICON = {
    heart: I('M12 21s-7.5-4.6-9.5-9.2C1.2 8.6 3.2 5 6.7 5c2 0 3.4 1.1 4.3 2.4h2C13.9 6.1 15.3 5 17.3 5c3.5 0 5.5 3.6 4.2 6.8C19.5 16.4 12 21 12 21z'),
    wa: I('M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.3-.5 0-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.3.5-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.7-.1l1-1.2c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.5.3.1.2.1.7-.1 1.3z'),
    compare: I('M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5v2h2V1h-2zm0 15H5l5-6zm9-15h-5v2h5v13l-5-6v9h5a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2z'),
    check: I('M9 16.2l-3.5-3.5L4 14.2l5 5 11-11-1.4-1.4z'),
    search: I('M10 2a8 8 0 0 1 6.3 12.9l5.4 5.4-1.4 1.4-5.4-5.4A8 8 0 1 1 10 2zm0 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12z'),
    chevron: I('M9 6l6 6-6 6-1.4-1.4 4.6-4.6-4.6-4.6z'),
    gauge: I('M12 4a10 10 0 0 0-8.7 15l1.7-1A8 8 0 1 1 20 12a8 8 0 0 1-1 3.9l1.7 1A10 10 0 0 0 12 4zm4.2 4.4l-5.3 4.2a1.5 1.5 0 1 0 2.2 1.9z'),
    gear: I('M4 4h2v7h5V4h2v7h5V4h2v9h-7v7h-2v-7H6v7H4z'),
    fuel: I('M4 3h9a1 1 0 0 1 1 1v7h1a2 2 0 0 1 2 2v4a1 1 0 0 0 2 0V9.4l-2-2L18.4 6l2.3 2.3a1 1 0 0 1 .3.7V17a3 3 0 0 1-6 0v-4h-1v8H3V4a1 1 0 0 1 1-1zm1 2v5h7V5z'),
    calendar: I('M7 2h2v2h6V2h2v2h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3zm12 8H5v9h14z'),
    seat: I('M7 3h6a2 2 0 0 1 2 2v7h3a2 2 0 0 1 2 2v3h-2v4h-2v-4H8v4H6v-4.2A3 3 0 0 1 4 14V9h2v5a1 1 0 0 0 1 1h0V3z'),
    shield: I('M12 2l8 3v6c0 5-3.4 9.7-8 11-4.6-1.3-8-6-8-11V5zm-1.2 13.6l5.7-5.7-1.4-1.4-4.3 4.3-2-2-1.4 1.4z'),
    tag: I('M3 3h8l10 10-8 8L3 11zm4.5 2.5a2 2 0 1 0 0 4 2 2 0 0 0 0-4z'),
    percent: I('M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm3.6 5L7 15.6 8.4 17 17 8.4zM9 7a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4z'),
    users: I('M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM9 13c-4 0-7 2-7 4.5V20h14v-2.5C16 15 13 13 9 13zm8 0c-.6 0-1.1 0-1.6.1 1.6 1.1 2.6 2.6 2.6 4.4V20h4v-2.5c0-2.5-2.2-4.5-5-4.5z'),
    swap: I('M7 7h11l-3-3 1.4-1.4L22 8l-5.6 5.4L15 12l3-3H7zm10 10H6l3 3-1.4 1.4L2 16l5.6-5.4L9 12l-3 3h11z'),
    phone: I('M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z'),
    pin: I('M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z'),
    mail: I('M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm9 7.2L4 7.3V17h16V7.3z'),
    clock: I('M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm1 5h-2v6l5 3 1-1.7-4-2.3z'),
    ig: I('M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3zm5 3.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM17.3 5.5a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z'),
    fb: I('M14 8h3V4h-3a4 4 0 0 0-4 4v2H7v4h3v8h4v-8h3l1-4h-4V8z'),
  };

  function statusClass(s) {
    return { Tersedia: 'ok', Inden: 'warn', Booking: 'info', Terjual: 'muted' }[s] || 'muted';
  }

  // ---------- Modal ----------
  const modal = document.getElementById('modal');
  function openModal(html, onMount) {
    $('#modalBody').innerHTML = html;
    modal.hidden = false;
    document.body.classList.add('no-scroll');
    if (onMount) onMount($('#modalBody'));
    const first = $('#modalBody input:not([type=hidden]), #modalBody select, #modalBody textarea, #modalBody .btn');
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
  const startingInstallment = (c) => calcCredit(c.price, 20, 5, c.condition).monthly;

  // ---------- Komponen ----------
  function carCard(c) {
    const fav = Store.favs().includes(c.id);
    const inCompare = Store.compare().includes(c.id);
    return `
      <article class="car-card ${c.status === 'Terjual' ? 'is-sold' : ''}">
        <a href="#/mobil/${esc(c.id)}" class="car-media" tabindex="-1" aria-hidden="true">
          <img src="${esc(c.image)}" alt="" loading="lazy">
          <span class="year-badge">${esc(c.year)}</span>
          ${c.status !== 'Tersedia' ? `<span class="status-ribbon s-${statusClass(c.status)}">${esc(c.status)}</span>` : ''}
        </a>
        <button class="fav-btn ${fav ? 'active' : ''}" data-fav="${esc(c.id)}" aria-label="Simpan ${esc(carName(c))} ke favorit" aria-pressed="${fav}">${ICON.heart}</button>
        <div class="car-body">
          <h3><a href="#/mobil/${esc(c.id)}">${esc(c.year)} ${esc(carName(c))}</a></h3>
          <p class="car-variant">${esc(c.variant)}</p>
          <ul class="car-meta">
            <li>${ICON.gauge}${km(c.km)}</li>
            <li>${ICON.gear}${isAuto(c) ? 'Otomatis' : 'Manual'}</li>
            <li>${ICON.fuel}${esc(c.fuel)}</li>
          </ul>
          <p class="car-price">${rupiah(c.price)}</p>
          <p class="car-install">Cicilan mulai <b>${rupiahShort(startingInstallment(c))}</b>/bln</p>
          <div class="car-foot">
            <a class="more-link" href="#/mobil/${esc(c.id)}">Lihat Detail ${ICON.chevron}</a>
            <button class="cmp-btn ${inCompare ? 'active' : ''}" data-compare="${esc(c.id)}" aria-pressed="${inCompare}" title="Bandingkan">${ICON.compare}<span>${inCompare ? 'Dibandingkan' : 'Bandingkan'}</span></button>
          </div>
        </div>
      </article>`;
  }

  function emptyState(title, text, cta = '') {
    return `<div class="empty"><div class="empty-icon">${ICON.search}</div><h3>${title}</h3><p>${text}</p>${cta}</div>`;
  }

  function sectionTitle(title, sub) {
    return `<div class="section-title"><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div>`;
  }

  function pageBanner(title, crumb, sub) {
    return `
      <section class="page-banner">
        <div class="container">
          <nav class="crumbs" aria-label="Breadcrumb"><a href="#/">Beranda</a>${ICON.chevron}${crumb ? `${crumb}${ICON.chevron}` : ''}<span>${esc(title)}</span></nav>
          <h1>${esc(title)}</h1>
          ${sub ? `<p>${sub}</p>` : ''}
        </div>
      </section>`;
  }

  // Tombol favorit & bandingkan di mana pun dalam halaman.
  app.addEventListener('click', (e) => {
    const favBtn = e.target.closest('[data-fav]');
    if (favBtn) {
      e.preventDefault();
      const on = Store.toggleFav(favBtn.dataset.fav);
      favBtn.classList.toggle('active', on);
      favBtn.setAttribute('aria-pressed', on);
      toast(on ? 'Disimpan ke favorit' : 'Dihapus dari favorit');
      updateCounters();
      if (!on && parseHash().name === 'favorit') render(false);
      return;
    }
    const cmpBtn = e.target.closest('[data-compare]');
    if (cmpBtn) {
      e.preventDefault();
      if (toggleCompare(cmpBtn.dataset.compare)) render(false);
    }
  });

  function toggleCompare(id) {
    let ids = Store.compare().filter((x) => Store.car(x));
    if (ids.includes(id)) {
      ids = ids.filter((x) => x !== id);
      toast('Dihapus dari perbandingan');
    } else {
      if (ids.length >= 3) {
        toast('Maksimal 3 mobil untuk dibandingkan');
        return false;
      }
      ids.push(id);
      toast('Ditambahkan ke perbandingan');
    }
    Store.setCompare(ids);
    updateCounters();
    return true;
  }

  function updateCounters() {
    const favs = Store.favs().filter((id) => Store.car(id));
    const cmp = Store.compare().filter((id) => Store.car(id));
    document.getElementById('favCount').hidden = !favs.length;
    const cc = document.getElementById('compareCount');
    cc.hidden = !cmp.length;
    cc.textContent = cmp.length;
  }

  function socialLinks(s) {
    const links = [
      [s.whatsapp && waLink(`Halo ${s.dealerName}`), ICON.wa, 'WhatsApp'],
      [s.instagram && `https://instagram.com/${s.instagram.replace(/^@/, '')}`, ICON.ig, 'Instagram'],
      [s.facebook && (/^https?:/.test(s.facebook) ? s.facebook : `https://facebook.com/${s.facebook}`), ICON.fb, 'Facebook'],
    ];
    return links.filter(([href]) => href).map(([href, icon, label]) => `<a href="${esc(href)}" target="_blank" rel="noopener" aria-label="${label}">${icon}</a>`).join('');
  }

  function hoursRows(hours) {
    return String(hours || '').split(';').map((s) => s.trim()).filter(Boolean).map((row) => {
      const i = row.indexOf(':');
      return i > 0 ? [row.slice(0, i).trim(), row.slice(i + 1).trim()] : ['', row];
    });
  }

  function applySettings() {
    const s = Store.settings();
    $$('[data-setting]').forEach((el) => (el.textContent = s[el.dataset.setting] || ''));
    $$('[data-href=tel]').forEach((a) => (a.href = 'tel:' + s.phone.replace(/[^\d+]/g, '')));
    $$('[data-href=mail]').forEach((a) => (a.href = 'mailto:' + s.email));
    $$('[data-href=maps]').forEach((a) => (a.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(s.address)));
    $('#topSocials').innerHTML = socialLinks(s);
    $('#footSocials').innerHTML = socialLinks(s);
    $('#footHours').innerHTML = hoursRows(s.hours).map(([d, h]) => `<div><dt>${esc(d)}</dt><dd>${esc(h)}</dd></div>`).join('');
    $('#waFloat').href = waLink(`Halo ${s.dealerName}, saya ingin bertanya tentang mobil.`);
    $('#year').textContent = new Date().getFullYear();
  }

  // ---------- Form prospek ----------
  const LEAD_TITLES = { 'Test Drive': 'Booking Test Drive', Kredit: 'Ajukan Kredit', Pertanyaan: 'Tanya Mobil', 'Jual Mobil': 'Jual Mobil', 'Tukar Tambah': 'Tukar Tambah' };

  function carOptions(selected) {
    return Store.cars().filter((c) => c.status !== 'Terjual')
      .map((c) => `<option value="${esc(c.id)}" ${c.id === selected ? 'selected' : ''}>${esc(c.year)} ${esc(carName(c))} ${esc(c.variant)}</option>`).join('');
  }

  function contactFields() {
    return `
      <div class="form-row">
        <label>Nama lengkap<input name="name" required autocomplete="name" placeholder="cth. Budi Santoso"></label>
        <label>No. WhatsApp<input name="phone" required inputmode="tel" autocomplete="tel" placeholder="08xxxxxxxxxx"></label>
      </div>`;
  }

  function validPhone(p) {
    return /^(\+?62|0)8\d{7,12}$/.test(String(p).replace(/[\s-]/g, ''));
  }

  // Simpan prospek dan tampilkan layar sukses + lanjut WhatsApp.
  function submitLead(kind, data, extra = {}) {
    const c = data.carId ? Store.car(data.carId) : null;
    const s = Store.settings();
    Store.addLead({ type: kind, ...data, carName: c ? `${c.year} ${carName(c)} ${c.variant}` : '', credit: extra.credit || null });
    const title = LEAD_TITLES[kind] || kind;
    const lines = [
      `Halo ${s.dealerName}, saya ${data.name}.`,
      kind === 'Jual Mobil' || kind === 'Tukar Tambah'
        ? `Saya ingin ${title.toLowerCase()}: ${data.tradeCar}${data.tradeYear ? ' tahun ' + data.tradeYear : ''}${data.tradeKm ? ', ' + km(data.tradeKm) : ''}${data.tradeTrans ? ', ' + data.tradeTrans : ''}${data.tradePrice ? ', harapan ' + rupiah(data.tradePrice) : ''}.`
        : `Saya ingin ${title.toLowerCase()}${c ? ` untuk ${c.year} ${carName(c)} ${c.variant} (${rupiah(c.price)})` : ''}.`,
      kind === 'Tukar Tambah' && c ? `Mobil incaran: ${c.year} ${carName(c)} ${c.variant}.` : '',
      data.date ? `Jadwal: ${data.date} jam ${data.time}, ${data.location}.` : '',
      extra.credit ? `Simulasi: DP ${rupiah(extra.credit.dp)}, tenor ${extra.credit.tenor} th, angsuran ${rupiah(extra.credit.monthly)}/bln.` : '',
      data.note ? `Catatan: ${data.note}` : '',
    ].filter(Boolean);
    openModal(`
      <div class="success">
        <div class="success-icon">${ICON.check}</div>
        <h2 id="modalTitle">Terima kasih, ${esc(data.name.split(' ')[0])}!</h2>
        <p>Permintaan Anda sudah kami terima. Tim kami akan segera menghubungi Anda.</p>
        <a class="btn btn-wa btn-block" href="${waLink(lines.join('\n'))}" target="_blank" rel="noopener">${ICON.wa} Lanjutkan via WhatsApp</a>
        <button class="btn btn-outline btn-block" data-close>Tutup</button>
      </div>`);
  }

  function leadForm(kind, car, extra = {}) {
    if (kind === 'Tukar Tambah' || kind === 'Jual Mobil') {
      location.hash = '#/jual' + (kind === 'Tukar Tambah' ? '?tipe=tukar' : '') + (car ? `${kind === 'Tukar Tambah' ? '&' : '?'}car=${encodeURIComponent(car.id)}` : '');
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    openModal(`
      <p class="modal-eyebrow">Dealer Pak Aji</p>
      <h2 id="modalTitle">${LEAD_TITLES[kind] || kind}</h2>
      ${car ? `<div class="mini-car"><img src="${esc(car.image)}" alt=""><div><strong>${esc(car.year)} ${esc(carName(car))}</strong><span>${esc(car.variant)} · ${rupiah(car.price)}</span></div></div>` : ''}
      ${extra.summary ? `<div class="note">${extra.summary}</div>` : ''}
      <form id="leadForm" class="form" novalidate>
        ${contactFields()}
        ${car ? `<input type="hidden" name="carId" value="${esc(car.id)}">` : `
        <label>Mobil yang diminati<select name="carId"><option value="">— Pilih mobil —</option>${carOptions()}</select></label>`}
        ${kind === 'Test Drive' ? `
        <div class="form-row">
          <label>Tanggal<input type="date" name="date" min="${today}" required></label>
          <label>Jam<select name="time"><option>09.00</option><option>11.00</option><option>13.00</option><option>15.00</option></select></label>
        </div>
        <label>Lokasi test drive<select name="location"><option>Di showroom</option><option>Di rumah (home test drive)</option></select></label>` : ''}
        ${kind === 'Kredit' && !extra.credit ? `
        <div class="form-row">
          <label>Rencana DP<select name="dpPlan"><option>20%</option><option>25%</option><option>30%</option><option>40%</option><option>50%</option></select></label>
          <label>Tenor<select name="tenorPlan"><option>1 tahun</option><option>2 tahun</option><option>3 tahun</option><option selected>4 tahun</option><option>5 tahun</option></select></label>
        </div>` : ''}
        <label>Catatan<textarea name="note" rows="3" placeholder="Pertanyaan atau permintaan khusus"></textarea></label>
        <p class="form-error" id="leadError" role="alert" hidden></p>
        <button class="btn btn-red btn-block" type="submit">Kirim ${kind === 'Kredit' ? 'Pengajuan' : 'Permintaan'}</button>
        <p class="muted small center">Data Anda aman dan hanya digunakan untuk menghubungi Anda.</p>
      </form>`, (root) => {
      $('#leadForm', root).addEventListener('submit', (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        const err = $('#leadError', root);
        if (!data.name.trim()) return showErr(err, 'Nama wajib diisi.');
        if (!validPhone(data.phone)) return showErr(err, 'Nomor WhatsApp tidak valid (cth. 081234567890).');
        if (kind === 'Test Drive' && !data.date) return showErr(err, 'Pilih tanggal test drive.');
        if (data.dpPlan) data.note = `Rencana DP ${data.dpPlan}, tenor ${data.tenorPlan}. ${data.note}`.trim();
        delete data.dpPlan;
        delete data.tenorPlan;
        submitLead(kind, data, extra);
      });
    });
  }
  function showErr(el, msg) {
    el.textContent = msg;
    el.hidden = false;
  }

  // Tombol pembuka form prospek.
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-lead]');
    if (!b) return;
    e.preventDefault();
    closeMenu();
    leadForm(b.dataset.lead, b.dataset.car ? Store.car(b.dataset.car) : null);
  });

  // ---------- Pencarian ----------
  const SORTS = {
    terbaru: ['Tahun terbaru', (a, b) => b.year - a.year || a.price - b.price],
    termurah: ['Harga termurah', (a, b) => a.price - b.price],
    termahal: ['Harga termahal', (a, b) => b.price - a.price],
    km: ['Kilometer terendah', (a, b) => a.km - b.km],
  };
  const PRICE_STEPS = [150e6, 200e6, 250e6, 300e6, 400e6, 500e6, 1e9];

  function filterCars(f) {
    const q = (f.q || '').toLowerCase().trim();
    return Store.cars()
      .filter((c) => !q || `${c.brand} ${c.model} ${c.variant} ${c.type} ${c.color} ${c.year}`.toLowerCase().includes(q))
      .filter((c) => !f.brand || c.brand === f.brand)
      .filter((c) => !f.model || c.model === f.model)
      .filter((c) => !f.type || c.type === f.type)
      .filter((c) => !f.transmission || (f.transmission === 'Manual' ? !isAuto(c) : isAuto(c)))
      .filter((c) => !f.max || c.price <= Number(f.max))
      .filter((c) => !f.year || c.year >= Number(f.year))
      .filter((c) => f.sold === '1' || c.status !== 'Terjual')
      .sort((SORTS[f.sort] || SORTS.terbaru)[1]);
  }
  const uniq = (arr) => [...new Set(arr)].sort();
  function options(values, selected, label, fmt = esc) {
    return `<option value="">${label}</option>` + values.map((v) => `<option value="${esc(v)}" ${String(v) === String(selected ?? '') ? 'selected' : ''}>${fmt(v)}</option>`).join('');
  }
  function modelsFor(brand) {
    return uniq(Store.cars().filter((c) => !brand || c.brand === brand).map((c) => c.model));
  }

  // ---------- Halaman: Beranda ----------
  routes.home = () => {
    const s = Store.settings();
    const cars = Store.cars();
    const avail = cars.filter((c) => c.status !== 'Terjual');
    const brands = uniq(cars.map((c) => c.brand));
    const types = uniq(cars.map((c) => c.type));
    return `
      <section class="hero">
        <picture>
          <source media="(max-width: 760px)" srcset="assets/hero-sm.webp">
          <img class="hero-bg" src="assets/hero.webp" alt="Deretan mobil bekas pilihan di showroom Dealer Pak Aji">
        </picture>
        <div class="container hero-content">
          <p class="hero-eyebrow">Mobil Berkualitas. Pelayanan Terbaik.</p>
          <h1>Wujudkan Mobil<br><span>Impian Anda</span></h1>
          <p class="hero-sub">${esc(s.tagline)}</p>
          <div class="hero-cta">
            <a class="btn btn-red btn-lg" href="#/katalog">Lihat Stok Mobil</a>
            <a class="btn btn-outline-light btn-lg" href="#/kredit">Simulasi Kredit</a>
          </div>
          <ul class="hero-points">
            <li>${ICON.check}${avail.length} unit siap jual</li>
            <li>${ICON.check}Inspeksi 150 titik</li>
            <li>${ICON.check}Surat lengkap & aman</li>
          </ul>
        </div>
      </section>

      <section class="container">
        <form class="finder" id="finder" role="search" aria-label="Cari mobil">
          <h2>Cari Mobil Anda</h2>
          <div class="finder-grid">
            <label>Merek<select name="brand">${options(brands, '', 'Semua merek')}</select></label>
            <label>Model<select name="model">${options(modelsFor(''), '', 'Semua model')}</select></label>
            <label>Tipe bodi<select name="type">${options(types, '', 'Semua tipe')}</select></label>
            <label>Harga maks.<select name="max">${options(PRICE_STEPS, '', 'Semua harga', (p) => '≤ ' + rupiahShort(p))}</select></label>
            <button class="btn btn-red" type="submit">${ICON.search} Cari</button>
          </div>
          <a class="finder-adv" href="#/katalog">Pencarian lanjutan ${ICON.chevron}</a>
        </form>
      </section>

      <section class="section container">
        ${sectionTitle('Stok Mobil Kami', 'Unit bekas pilihan, sudah lolos inspeksi dan siap pakai.')}
        <div class="tabs-pill" role="tablist" aria-label="Filter tipe">
          ${[['', 'Semua'], ...types.map((t) => [t, t]), ['murah', '< Rp 200 jt']].map(([v, l], i) => `<button role="tab" data-tab="${esc(v)}" aria-selected="${i === 0}">${esc(l)}</button>`).join('')}
        </div>
        <div class="car-grid" id="homeGrid"></div>
        <div class="center"><a class="btn btn-outline btn-lg" href="#/katalog">Lihat Semua Stok ${ICON.chevron}</a></div>
      </section>

      <section class="features">
        <div class="container features-grid">
          <div>${ICON.shield}<h3>Kualitas Terjamin</h3><p>Setiap unit diinspeksi menyeluruh: bebas banjir, bebas tabrak, kilometer asli.</p></div>
          <div>${ICON.tag}<h3>Harga Terbaik</h3><p>Harga kompetitif dan transparan, tanpa biaya tersembunyi.</p></div>
          <div>${ICON.percent}<h3>Kredit Fleksibel</h3><p>Bekerja sama dengan leasing terpercaya. DP ringan, proses cepat.</p></div>
          <div>${ICON.users}<h3>Tim Profesional</h3><p>Kami dampingi Anda dari pilih unit hingga balik nama.</p></div>
        </div>
      </section>

      <section class="promo">
        <div class="promo-card promo-dark">
          <div class="promo-text">
            <p class="promo-eyebrow">Kredit Mudah</p>
            <h2>Bawa Pulang Mobil Lebih Cepat dari yang Anda Kira</h2>
            <p>Hitung cicilan sesuai budget, ajukan secara online, dan dapatkan persetujuan cepat dari leasing rekanan kami.</p>
            <div class="btn-row">
              <button class="btn btn-red" data-lead="Kredit">Ajukan Kredit</button>
              <a class="btn btn-outline-light" href="#/kredit">Hitung Cicilan</a>
            </div>
          </div>
        </div>
        <div class="promo-card promo-light">
          <div class="promo-text">
            <p class="promo-eyebrow">Jual & Tukar Tambah</p>
            <h2>Dapatkan Penawaran Terbaik untuk Mobil Anda</h2>
            <p>Mau jual langsung atau tukar tambah? Kirim data mobil Anda, kami taksir dengan harga terbaik.</p>
            <a class="btn btn-outline" href="#/jual">Taksir Mobil Anda</a>
          </div>
          <img src="assets/cars/toyota-innova.jpg" alt="" loading="lazy">
        </div>
      </section>

      <section class="brands">
        <div class="container">
          <p class="brands-title">Merek yang Kami Jual</p>
          <div class="brand-row">${brands.map((b) => `<a href="#/katalog?brand=${encodeURIComponent(b)}">${esc(b)}</a>`).join('')}</div>
        </div>
      </section>

      <section class="section container">
        ${sectionTitle('Cara Beli di ' + esc(s.dealerName))}
        <ol class="steps">
          <li><strong>Pilih mobil</strong><span>Jelajahi stok & bandingkan spesifikasi.</span></li>
          <li><strong>Hitung kredit</strong><span>Sesuaikan DP dan tenor dengan budget.</span></li>
          <li><strong>Test drive</strong><span>Booking jadwal di showroom atau di rumah.</span></li>
          <li><strong>Bawa pulang</strong><span>Dokumen beres, unit siap diantar.</span></li>
        </ol>
      </section>`;
  };
  routes.home.mount = () => {
    const finder = $('#finder');
    finder.brand.addEventListener('change', () => {
      finder.model.innerHTML = options(modelsFor(finder.brand.value), '', 'Semua model');
    });
    finder.addEventListener('submit', (e) => {
      e.preventDefault();
      const qs = new URLSearchParams([...new FormData(finder)].filter(([, v]) => v)).toString();
      location.hash = '#/katalog' + (qs ? '?' + qs : '');
    });
    const grid = $('#homeGrid');
    const show = (tab) => {
      const list = Store.cars().filter((c) => c.status !== 'Terjual')
        .filter((c) => !tab || (tab === 'murah' ? c.price < 200e6 : c.type === tab))
        .sort((a, b) => (b.featured - a.featured) || b.year - a.year)
        .slice(0, 8);
      grid.innerHTML = list.map(carCard).join('') || emptyState('Belum ada unit', 'Stok untuk kategori ini sedang kosong.');
    };
    $$('[data-tab]').forEach((t) => t.addEventListener('click', () => {
      $$('[data-tab]').forEach((x) => x.setAttribute('aria-selected', x === t));
      show(t.dataset.tab);
    }));
    show('');
  };

  // ---------- Halaman: Katalog ----------
  routes.katalog = (f) => {
    const cars = Store.cars();
    const list = filterCars(f);
    const years = uniq(cars.map((c) => c.year)).reverse();
    return `
      ${pageBanner('Stok Mobil', '', `${list.length} unit ditemukan`)}
      <div class="container">
        <form class="filters" id="filters">
          <label class="filter-search">${ICON.search}<input name="q" value="${esc(f.q || '')}" placeholder="Cari merek, model, warna…" aria-label="Cari"></label>
          <select name="brand" aria-label="Merek">${options(uniq(cars.map((c) => c.brand)), f.brand, 'Semua merek')}</select>
          <select name="model" aria-label="Model">${options(modelsFor(f.brand), f.model, 'Semua model')}</select>
          <select name="type" aria-label="Tipe bodi">${options(uniq(cars.map((c) => c.type)), f.type, 'Semua tipe')}</select>
          <select name="transmission" aria-label="Transmisi">${options(['Otomatis', 'Manual'], f.transmission, 'Semua transmisi')}</select>
          <select name="year" aria-label="Tahun minimal">${options(years, f.year, 'Semua tahun', (y) => 'Tahun ' + y + '+')}</select>
          <select name="max" aria-label="Harga maksimal">${options(PRICE_STEPS, f.max, 'Semua harga', (p) => '≤ ' + rupiahShort(p))}</select>
          <select name="sort" aria-label="Urutkan">${Object.entries(SORTS).map(([k, [l]]) => `<option value="${k}" ${k === (f.sort || 'terbaru') ? 'selected' : ''}>${l}</option>`).join('')}</select>
          <div class="filters-end">
            <label class="check"><input type="checkbox" name="sold" value="1" ${f.sold === '1' ? 'checked' : ''}> Tampilkan yang terjual</label>
            <button type="button" class="link-btn" id="resetFilter">Reset filter</button>
          </div>
        </form>
        <div class="car-grid">${list.map(carCard).join('') || emptyState('Mobil tidak ditemukan', 'Coba ubah kata kunci atau filter. Atau biarkan kami carikan unitnya untuk Anda.', '<button class="btn btn-red" data-lead="Pertanyaan">Minta Dicarikan Unit</button>')}</div>
      </div>`;
  };
  routes.katalog.mount = (f) => {
    const form = $('#filters');
    const update = (changed) => {
      const data = Object.fromEntries([...new FormData(form)].filter(([, v]) => v));
      if (changed === 'brand') delete data.model;
      const qs = new URLSearchParams(data).toString();
      history.replaceState(null, '', '#/katalog' + (qs ? '?' + qs : ''));
      render(false);
      const el = $(`#filters [name="${changed}"]`);
      if (el) {
        el.focus();
        if (changed === 'q') el.setSelectionRange(el.value.length, el.value.length);
      }
    };
    let t;
    form.addEventListener('input', (e) => {
      clearTimeout(t);
      t = setTimeout(() => update(e.target.name), e.target.name === 'q' ? 300 : 0);
    });
    form.addEventListener('submit', (e) => e.preventDefault());
    $('#resetFilter').addEventListener('click', () => {
      history.replaceState(null, '', '#/katalog');
      render(false);
    });
  };

  // ---------- Halaman: Detail ----------
  routes.mobil = (params, id) => {
    const c = Store.car(id);
    if (!c) return `${pageBanner('Mobil tidak ditemukan', '<a href="#/katalog">Stok Mobil</a>')}<div class="container">${emptyState('Mobil tidak ditemukan', 'Unit mungkin sudah terjual atau dihapus.', '<a class="btn btn-red" href="#/katalog">Kembali ke stok</a>')}</div>`;
    const s = Store.settings();
    const fav = Store.favs().includes(c.id);
    const inCompare = Store.compare().includes(c.id);
    const related = Store.cars().filter((x) => x.id !== c.id && x.status !== 'Terjual' && (x.type === c.type || x.brand === c.brand)).slice(0, 4);
    const specs = [
      ['Merek', c.brand], ['Model', c.model], ['Varian', c.variant], ['Tahun', c.year], ['Kondisi', c.condition],
      ['Tipe bodi', c.type], ['Mesin', c.engine], ['Transmisi', c.transmission], ['Bahan bakar', c.fuel],
      ['Kapasitas', `${c.seats} penumpang`], ['Warna', c.color], ['Kilometer', km(c.km)],
    ];
    const sold = c.status === 'Terjual';
    return `
      ${pageBanner(`${c.year} ${carName(c)}`, '<a href="#/katalog">Stok Mobil</a>')}
      <div class="container">
        <section class="detail">
          <div class="detail-media">
            <img src="${esc(c.image)}" alt="${esc(c.year + ' ' + carName(c) + ' ' + c.variant)}">
            <span class="year-badge">${esc(c.year)}</span>
            <span class="status-pill s-${statusClass(c.status)}">${esc(c.status)}</span>
          </div>
          <aside class="detail-panel">
            <p class="detail-brand">${esc(c.brand)} · ${esc(c.type)}</p>
            <h2>${esc(carName(c))} <span>${esc(c.variant)}</span></h2>
            <p class="detail-price">${rupiah(c.price)}</p>
            <p class="detail-install">Cicilan mulai <b>${rupiah(startingInstallment(c))}</b>/bulan <small>(DP 20%, 5 tahun)</small></p>
            <ul class="quick-specs">
              <li>${ICON.calendar}<span>Tahun</span><b>${esc(c.year)}</b></li>
              <li>${ICON.gauge}<span>Kilometer</span><b>${km(c.km)}</b></li>
              <li>${ICON.gear}<span>Transmisi</span><b>${esc(c.transmission)}</b></li>
              <li>${ICON.fuel}<span>Bahan bakar</span><b>${esc(c.fuel)}</b></li>
            </ul>
            <div class="detail-actions">
              <button class="btn btn-red btn-block" data-lead="Test Drive" data-car="${esc(c.id)}" ${sold ? 'disabled' : ''}>Booking Test Drive</button>
              <a class="btn btn-wa btn-block" href="${waLink(`Halo ${s.dealerName}, saya tertarik dengan ${c.year} ${carName(c)} ${c.variant} (${rupiah(c.price)}). Apakah masih tersedia?`)}" target="_blank" rel="noopener">${ICON.wa} Tanya via WhatsApp</a>
              <div class="btn-row">
                <button class="btn btn-outline ${fav ? 'active' : ''}" data-fav="${esc(c.id)}" aria-pressed="${fav}">${ICON.heart} Favorit</button>
                <button class="btn btn-outline ${inCompare ? 'active' : ''}" data-compare="${esc(c.id)}">${ICON.compare} ${inCompare ? 'Dibandingkan' : 'Bandingkan'}</button>
                <button class="btn btn-outline" data-lead="Tukar Tambah" data-car="${esc(c.id)}">${ICON.swap} Tukar Tambah</button>
              </div>
            </div>
          </aside>
        </section>

        <section class="detail-grid">
          <div class="panel">
            <h3>Deskripsi</h3>
            <p>${esc(c.description)}</p>
            <h3>Kelebihan Unit</h3>
            <ul class="feature-list">${(c.features || []).map((f) => `<li>${ICON.check}${esc(f)}</li>`).join('')}</ul>
            <h3>Spesifikasi</h3>
            <dl class="spec">${specs.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
          </div>
          <div class="panel" id="detailCredit">${creditWidget(c)}</div>
        </section>

        ${related.length ? `<section class="section">${sectionTitle('Mobil Serupa')}<div class="car-grid">${related.map(carCard).join('')}</div></section>` : ''}
      </div>`;
  };
  routes.mobil.mount = (params, id) => {
    const c = Store.car(id);
    if (c) mountCreditWidget($('#detailCredit'), c);
  };

  // ---------- Widget kredit ----------
  function creditWidget(c, state = { dp: 25, tenor: 4 }) {
    return `
      <h3>Simulasi Kredit</h3>
      <div class="credit">
        <label class="range-label">Uang muka (DP) <strong data-out="dpPct">${state.dp}%</strong>
          <input type="range" name="dp" min="10" max="70" step="5" value="${state.dp}">
        </label>
        <p class="label">Tenor</p>
        <div class="seg" role="radiogroup" aria-label="Tenor">
          ${TENORS.map((t) => `<label><input type="radio" name="tenor" value="${t}" ${t === state.tenor ? 'checked' : ''}><span>${t} th</span></label>`).join('')}
        </div>
        <div class="credit-result" data-out="result" aria-live="polite"></div>
        <button class="btn btn-red btn-block" data-apply ${c.status === 'Terjual' ? 'disabled' : ''}>Ajukan Kredit Ini</button>
        <p class="muted small">Estimasi bunga flat untuk mobil bekas. Angka final mengikuti persetujuan leasing.</p>
      </div>`;
  }
  function mountCreditWidget(root, c) {
    const calc = () => {
      const dp = Number($('[name=dp]', root).value);
      const tenor = Number($('[name=tenor]:checked', root).value);
      const r = calcCredit(c.price, dp, tenor, c.condition);
      $('[data-out=dpPct]', root).textContent = dp + '%';
      $('[data-out=result]', root).innerHTML = `
        <div class="big"><span>Angsuran per bulan</span><strong>${rupiah(r.monthly)}</strong><small>${tenor * 12}× pembayaran</small></div>
        <dl class="spec compact">
          <div><dt>Harga mobil</dt><dd>${rupiah(c.price)}</dd></div>
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

  // ---------- Halaman: Kredit ----------
  const creditCars = () => Store.cars().filter((c) => c.status !== 'Terjual').sort(SORTS.termurah[1]);
  routes.kredit = (params) => {
    const cars = creditCars();
    const sel = Store.car(params.car) || cars[0];
    if (!sel) return pageBanner('Simulasi Kredit') + `<div class="container">${emptyState('Belum ada stok', 'Silakan kembali lagi nanti.')}</div>`;
    const rows = TENORS.map((t) => `<tr><td>${t} tahun</td>${[20, 30, 40].map((dp) => `<td>${rupiah(calcCredit(sel.price, dp, t, sel.condition).monthly)}</td>`).join('')}</tr>`).join('');
    return `
      ${pageBanner('Simulasi Kredit', '', 'Hitung cicilan mobil impian sesuai budget Anda.')}
      <div class="container">
        <section class="detail-grid">
          <div class="panel">
            <label class="field">Pilih mobil
              <select id="creditCar">${cars.map((c) => `<option value="${esc(c.id)}" ${c.id === sel.id ? 'selected' : ''}>${esc(c.year)} ${esc(carName(c))} ${esc(c.variant)} — ${rupiahShort(c.price)}</option>`).join('')}</select>
            </label>
            <a class="mini-car big-mini" href="#/mobil/${esc(sel.id)}"><img src="${esc(sel.image)}" alt=""><div><strong>${esc(sel.year)} ${esc(carName(sel))}</strong><span>${esc(sel.variant)} · ${km(sel.km)}</span><span class="price">${rupiah(sel.price)}</span></div></a>
            <h3>Tabel angsuran per bulan</h3>
            <div class="table-wrap"><table class="table"><thead><tr><th>Tenor</th><th>DP 20%</th><th>DP 30%</th><th>DP 40%</th></tr></thead><tbody>${rows}</tbody></table></div>
            <p class="muted small">Syarat umum: KTP, KK, NPWP, slip gaji / rekening koran 3 bulan terakhir.</p>
          </div>
          <div class="panel" id="pageCredit">${creditWidget(sel)}</div>
        </section>
      </div>`;
  };
  routes.kredit.mount = (params) => {
    const sel = Store.car(params.car) || creditCars()[0];
    if (!sel) return;
    mountCreditWidget($('#pageCredit'), sel);
    $('#creditCar').addEventListener('change', (e) => {
      history.replaceState(null, '', '#/kredit?car=' + encodeURIComponent(e.target.value));
      render(false);
    });
  };

  // ---------- Halaman: Jual / Tukar Tambah ----------
  routes.jual = (params) => {
    const tukar = params.tipe === 'tukar';
    const years = Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i);
    return `
      ${pageBanner('Jual & Tukar Tambah', '', 'Jual mobil Anda dengan cepat dan harga terbaik, atau tukar tambah dengan unit di showroom kami.')}
      <div class="container">
        <section class="detail-grid jual">
          <div class="panel">
            <h3>Data Mobil Anda</h3>
            <form id="jualForm" class="form" novalidate>
              <div class="seg seg-2" role="radiogroup" aria-label="Keperluan">
                <label><input type="radio" name="purpose" value="Jual Mobil" ${tukar ? '' : 'checked'}><span>Jual langsung</span></label>
                <label><input type="radio" name="purpose" value="Tukar Tambah" ${tukar ? 'checked' : ''}><span>Tukar tambah</span></label>
              </div>
              <div class="form-row">
                <label>Merek & model<input name="tradeCar" required placeholder="cth. Honda Brio Satya E"></label>
                <label>Tahun<select name="tradeYear">${years.map((y) => `<option>${y}</option>`).join('')}</select></label>
              </div>
              <div class="form-row three">
                <label>Kilometer<input name="tradeKm" inputmode="numeric" placeholder="cth. 60000"></label>
                <label>Transmisi<select name="tradeTrans"><option>Manual</option><option>Otomatis</option></select></label>
                <label>Harga harapan (Rp)<input name="tradePrice" inputmode="numeric" placeholder="opsional"></label>
              </div>
              <label class="trade-target" ${tukar ? '' : 'hidden'}>Mobil incaran di showroom<select name="carId"><option value="">— Pilih mobil —</option>${carOptions(params.car)}</select></label>
              ${contactFields()}
              <label>Catatan kondisi<textarea name="note" rows="3" placeholder="cth. servis rutin, pajak hidup, ada baret kecil di bumper"></textarea></label>
              <p class="form-error" id="jualError" role="alert" hidden></p>
              <button class="btn btn-red btn-lg btn-block" type="submit">Kirim & Minta Penawaran</button>
            </form>
          </div>
          <div class="stack">
            <div class="panel dark-panel">
              <h3>Kenapa jual ke kami?</h3>
              <ul class="feature-list light">
                <li>${ICON.check}Taksiran gratis & transparan</li>
                <li>${ICON.check}Inspeksi bisa di rumah Anda</li>
                <li>${ICON.check}Pembayaran tunai, cepat & aman</li>
                <li>${ICON.check}Kami bantu urus pelunasan leasing</li>
                <li>${ICON.check}Bebas ribet urusan dokumen</li>
              </ul>
            </div>
            <div class="panel">
              <h3>Alurnya</h3>
              <ol class="mini-steps">
                <li>Kirim data mobil lewat form ini</li>
                <li>Tim kami menghubungi & menjadwalkan inspeksi</li>
                <li>Terima penawaran harga</li>
                <li>Setuju? Dana langsung cair</li>
              </ol>
            </div>
          </div>
        </section>
      </div>`;
  };
  routes.jual.mount = () => {
    const form = $('#jualForm');
    const target = $('.trade-target', form);
    form.addEventListener('change', (e) => {
      if (e.target.name === 'purpose') target.hidden = e.target.value !== 'Tukar Tambah';
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      const err = $('#jualError');
      if (!data.tradeCar.trim()) return showErr(err, 'Isi merek & model mobil Anda.');
      if (!data.name.trim()) return showErr(err, 'Nama wajib diisi.');
      if (!validPhone(data.phone)) return showErr(err, 'Nomor WhatsApp tidak valid (cth. 081234567890).');
      const kind = data.purpose;
      delete data.purpose;
      if (kind !== 'Tukar Tambah') delete data.carId;
      data.tradeKm = data.tradeKm.replace(/\D/g, '');
      data.tradePrice = data.tradePrice.replace(/\D/g, '');
      err.hidden = true;
      submitLead(kind, data);
      form.reset();
      target.hidden = true;
    });
  };

  // ---------- Halaman: Bandingkan ----------
  routes.bandingkan = () => {
    const ids = Store.compare().filter((id) => Store.car(id));
    const cars = ids.map(Store.car);
    const others = Store.cars().filter((c) => !ids.includes(c.id) && c.status !== 'Terjual');
    const add = ids.length < 3 && others.length ? `
      <div class="compare-add panel">
        <label class="field">Tambah mobil untuk dibandingkan
          <select id="compareAdd"><option value="">— Pilih mobil —</option>${others.map((c) => `<option value="${esc(c.id)}">${esc(c.year)} ${esc(carName(c))} ${esc(c.variant)}</option>`).join('')}</select>
        </label>
      </div>` : '';
    const banner = pageBanner('Bandingkan Mobil', '', 'Bandingkan hingga 3 mobil secara berdampingan.');
    if (!cars.length) return `${banner}<div class="container">${emptyState('Belum ada mobil dipilih', 'Tekan tombol “Bandingkan” pada kartu mobil, atau pilih di bawah ini.')}${add}</div>`;
    const minPrice = Math.min(...cars.map((c) => c.price));
    const minKm = Math.min(...cars.map((c) => c.km));
    const best = (cond) => (cond && cars.length > 1 ? 'best' : '');
    const rows = [
      ['Harga', (c) => `<strong class="${best(c.price === minPrice)}">${rupiah(c.price)}</strong>`],
      ['Cicilan mulai', (c) => rupiah(startingInstallment(c)) + '/bln'],
      ['Tahun', (c) => esc(c.year)],
      ['Kilometer', (c) => `<span class="${best(c.km === minKm)}">${km(c.km)}</span>`],
      ['Tipe', (c) => esc(c.type)], ['Mesin', (c) => esc(c.engine)], ['Transmisi', (c) => esc(c.transmission)],
      ['Bahan bakar', (c) => esc(c.fuel)], ['Kursi', (c) => esc(c.seats)], ['Warna', (c) => esc(c.color)],
      ['Kelebihan', (c) => `<ul class="feat">${(c.features || []).map((f) => `<li>${esc(f)}</li>`).join('')}</ul>`],
    ];
    return `
      ${banner}
      <div class="container">
        <div class="table-wrap panel flush">
          <table class="table compare">
            <thead><tr><th scope="col"><span class="sr-only">Spesifikasi</span></th>${cars.map((c) => `
              <th scope="col"><div class="compare-head">
                <img src="${esc(c.image)}" alt="">
                <a href="#/mobil/${esc(c.id)}">${esc(c.year)} ${esc(carName(c))}</a><small>${esc(c.variant)}</small>
                <button class="link-btn" data-compare="${esc(c.id)}">Hapus</button>
              </div></th>`).join('')}</tr></thead>
            <tbody>${rows.map(([label, fn]) => `<tr><th scope="row">${label}</th>${cars.map((c) => `<td>${fn(c)}</td>`).join('')}</tr>`).join('')}</tbody>
          </table>
        </div>
        ${add}
      </div>`;
  };
  routes.bandingkan.mount = () => {
    const sel = $('#compareAdd');
    if (sel) sel.addEventListener('change', (e) => {
      if (e.target.value && toggleCompare(e.target.value)) render(false);
    });
  };

  // ---------- Halaman: Favorit ----------
  routes.favorit = () => {
    const cars = Store.favs().map(Store.car).filter(Boolean);
    return `
      ${pageBanner('Mobil Favorit', '', `${cars.length} mobil disimpan`)}
      <div class="container"><div class="car-grid">${cars.map(carCard).join('') || emptyState('Belum ada favorit', 'Ketuk ikon hati pada mobil untuk menyimpannya di sini.', '<a class="btn btn-red" href="#/katalog">Lihat Stok Mobil</a>')}</div></div>`;
  };

  // ---------- Halaman: Kontak ----------
  routes.kontak = () => {
    const s = Store.settings();
    return `
      ${pageBanner('Tentang & Kontak', '', 'Kami siap membantu Anda memilih mobil terbaik.')}
      <div class="container">
        <section class="detail-grid">
          <div class="panel">
            <img class="contact-logo" src="assets/logo.png" alt="${esc(s.dealerName)} — Jual Beli Mobil Bekas" width="220" height="152">
            <p>${esc(s.dealerName)} adalah showroom jual beli mobil bekas yang mengutamakan kejujuran dan kualitas. Setiap unit kami periksa secara menyeluruh agar Anda mendapatkan mobil yang aman, nyaman, dan sesuai harga.</p>
            <ul class="contact-list">
              <li>${ICON.pin}<div><span>Alamat</span><a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address)}" target="_blank" rel="noopener">${esc(s.address)}</a></div></li>
              <li>${ICON.phone}<div><span>Telepon</span><a href="tel:${esc(s.phone.replace(/[^\d+]/g, ''))}">${esc(s.phone)}</a></div></li>
              <li>${ICON.wa}<div><span>WhatsApp</span><a href="${waLink('Halo, saya ingin bertanya.')}" target="_blank" rel="noopener">+${esc(s.whatsapp)}</a></div></li>
              <li>${ICON.mail}<div><span>Email</span><a href="mailto:${esc(s.email)}">${esc(s.email)}</a></div></li>
              <li>${ICON.clock}<div><span>Jam operasional</span>${hoursRows(s.hours).map(([d, h]) => `<b>${esc(d)}${d ? ': ' : ''}${esc(h)}</b>`).join('')}</div></li>
            </ul>
          </div>
          <div class="panel">
            <h3>Ada yang bisa kami bantu?</h3>
            <div class="action-list">
              <button class="action" data-lead="Pertanyaan">${ICON.search}<div><strong>Tanya stok & harga</strong><span>Kami bantu carikan unit yang sesuai.</span></div>${ICON.chevron}</button>
              <button class="action" data-lead="Test Drive">${ICON.calendar}<div><strong>Booking test drive</strong><span>Di showroom atau di rumah Anda.</span></div>${ICON.chevron}</button>
              <button class="action" data-lead="Kredit">${ICON.percent}<div><strong>Konsultasi kredit</strong><span>Cari skema DP & tenor terbaik.</span></div>${ICON.chevron}</button>
              <a class="action" href="#/jual">${ICON.swap}<div><strong>Jual / tukar tambah</strong><span>Taksir mobil Anda dengan harga terbaik.</span></div>${ICON.chevron}</a>
            </div>
            <a class="btn btn-wa btn-block btn-lg" href="${waLink(`Halo ${s.dealerName}, saya ingin bertanya.`)}" target="_blank" rel="noopener">${ICON.wa} Chat WhatsApp Sekarang</a>
          </div>
        </section>
      </div>`;
  };

  // ---------- Menu mobile & dropdown ----------
  const menuBtn = document.getElementById('menuBtn');
  const nav = document.getElementById('mainNav');
  function closeMenu() {
    nav.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
    $$('.dropdown').forEach((d) => {
      d.classList.remove('open');
      $('.dropdown-toggle', d).setAttribute('aria-expanded', 'false');
    });
  }
  menuBtn.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
  });
  $$('.dropdown-toggle').forEach((b) => b.addEventListener('click', (e) => {
    e.stopPropagation();
    const d = b.closest('.dropdown');
    const open = d.classList.toggle('open');
    b.setAttribute('aria-expanded', open);
  }));
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown')) $$('.dropdown.open').forEach((d) => d.classList.remove('open'));
  });

  // ---------- Router ----------
  function parseHash() {
    const raw = location.hash.replace(/^#\/?/, '');
    const [path, qs] = raw.split('?');
    const parts = path.split('/').filter(Boolean);
    return { name: parts[0] || 'home', arg: parts[1] ? decodeURIComponent(parts[1]) : undefined, params: Object.fromEntries(new URLSearchParams(qs || '')) };
  }

  const TITLES = { katalog: 'Stok Mobil', kredit: 'Simulasi Kredit', jual: 'Jual & Tukar Tambah', bandingkan: 'Bandingkan', favorit: 'Favorit', kontak: 'Kontak', admin: 'Admin' };

  function render(scrollTop = true) {
    const { name, arg, params } = parseHash();
    const key = routes[name] ? name : 'home';
    const view = routes[key];
    app.innerHTML = view(params, arg);
    if (view.mount) view.mount(params, arg);
    const navKey = key === 'mobil' ? 'katalog' : key;
    $$('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === navKey));
    document.body.classList.toggle('is-admin', key === 'admin');
    document.body.classList.toggle('is-home', key === 'home');
    const car = key === 'mobil' && Store.car(arg);
    document.title = (car ? `${car.year} ${carName(car)} — ` : TITLES[key] ? TITLES[key] + ' — ' : '') + Store.settings().dealerName;
    updateCounters();
    closeMenu();
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
    routes, render, start, toast, openModal, closeModal, esc, rupiah, rupiahShort, carName, statusClass, applySettings, pageBanner, $, $$,
  };
})();

document.addEventListener('DOMContentLoaded', App.start);
