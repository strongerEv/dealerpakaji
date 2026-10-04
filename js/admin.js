// Panel admin Dealer Pak Aji: dashboard, kelola stok, prospek, pengaturan.
(() => {
  const { routes, render, toast, openModal, closeModal, esc, rupiah, rupiahShort, carName, statusClass, $, $$ } = App;
  const AUTH_KEY = 'dpa_admin';
  const STATUSES = ['Tersedia', 'Inden', 'Booking', 'Terjual'];
  const LEAD_STATUSES = ['Baru', 'Dihubungi', 'Deal', 'Batal'];
  const LEAD_TYPES = ['Test Drive', 'Kredit', 'Pertanyaan', 'Jual Mobil', 'Tukar Tambah'];
  const TABS = [['dashboard', 'Dashboard'], ['stok', 'Stok Mobil'], ['prospek', 'Prospek'], ['pengaturan', 'Pengaturan']];

  const isAuthed = () => sessionStorage.getItem(AUTH_KEY) === '1';

  function fmtDate(iso) {
    return new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function waTo(phone, text) {
    let p = String(phone).replace(/\D/g, '');
    if (p.startsWith('0')) p = '62' + p.slice(1);
    return `https://wa.me/${p}?text=${encodeURIComponent(text)}`;
  }

  // ---------- Login ----------
  function loginView() {
    return `
      <div class="login card pad">
        <img src="assets/logo.png" alt="Dealer Pak Aji" width="200" height="138">
        <h1>Masuk Admin</h1>
        <p class="muted">Masukkan PIN untuk mengelola stok dan prospek.</p>
        <form id="loginForm" class="form">
          <label>PIN<input type="password" name="pin" inputmode="numeric" autocomplete="current-password" required autofocus></label>
          <p class="form-error" id="loginError" hidden>PIN salah.</p>
          <button class="btn btn-primary btn-block">Masuk</button>
        </form>
        <p class="muted small">PIN bawaan: <code>1234</code> — segera ganti di menu Pengaturan.</p>
      </div>`;
  }

  // ---------- Tab: Dashboard ----------
  function dashboard() {
    const cars = Store.cars();
    const leads = Store.leads();
    const avail = cars.filter((c) => c.status !== 'Terjual');
    const sold = cars.filter((c) => c.status === 'Terjual');
    const newLeads = leads.filter((l) => l.status === 'Baru');
    const deals = leads.filter((l) => l.status === 'Deal');
    const byType = LEAD_TYPES.map((t) => [t, leads.filter((l) => l.type === t).length]);
    const maxType = Math.max(1, ...byType.map(([, n]) => n));
    const byBrand = [...new Set(avail.map((c) => c.brand))].map((b) => [b, avail.filter((c) => c.brand === b).length]).sort((a, b) => b[1] - a[1]);
    const maxBrand = Math.max(1, ...byBrand.map(([, n]) => n));
    const popular = Object.entries(leads.reduce((acc, l) => (l.carName ? ((acc[l.carName] = (acc[l.carName] || 0) + 1), acc) : acc), {}))
      .sort((a, b) => b[1] - a[1]).slice(0, 5);
    const bars = (rows, max) => rows.map(([k, n]) => `<div class="bar"><span>${esc(k)}</span><div><i style="width:${(n / max) * 100}%"></i></div><b>${n}</b></div>`).join('');
    return `
      <div class="kpis">
        <div class="kpi"><span>Unit tersedia</span><strong>${avail.length}</strong><small>${cars.length} total unit</small></div>
        <div class="kpi"><span>Nilai stok</span><strong>${rupiahShort(avail.reduce((s, c) => s + c.price, 0))}</strong><small>harga OTR</small></div>
        <div class="kpi"><span>Unit terjual</span><strong>${sold.length}</strong><small>${rupiahShort(sold.reduce((s, c) => s + c.price, 0))}</small></div>
        <div class="kpi accent"><span>Prospek baru</span><strong>${newLeads.length}</strong><small>${leads.length} total · ${deals.length} deal</small></div>
      </div>
      <div class="admin-grid">
        <div class="card pad"><h3>Prospek per jenis</h3>${leads.length ? bars(byType, maxType) : '<p class="muted">Belum ada prospek.</p>'}</div>
        <div class="card pad"><h3>Stok per merek</h3>${bars(byBrand, maxBrand) || '<p class="muted">Stok kosong.</p>'}</div>
        <div class="card pad"><h3>Mobil paling diminati</h3>${popular.length ? `<ol class="rank">${popular.map(([n, c]) => `<li><span>${esc(n)}</span><b>${c} prospek</b></li>`).join('')}</ol>` : '<p class="muted">Belum ada data.</p>'}</div>
        <div class="card pad"><h3>Prospek terbaru</h3>${leads.slice(0, 5).map((l) => `
          <div class="lead-mini"><span class="pill pill-${leadClass(l.status)}">${esc(l.status)}</span><div><strong>${esc(l.name)}</strong><small>${esc(l.type)}${l.carName ? ' · ' + esc(l.carName) : ''}</small></div></div>`).join('') || '<p class="muted">Belum ada prospek.</p>'}
          ${leads.length ? '<a href="#/admin?tab=prospek" class="link">Lihat semua →</a>' : ''}
        </div>
      </div>`;
  }

  function leadClass(s) {
    return { Baru: 'warn', Dihubungi: 'info', Deal: 'ok', Batal: 'muted' }[s] || 'muted';
  }

  // ---------- Tab: Stok ----------
  function stock(params) {
    const q = (params.q || '').toLowerCase();
    const cars = Store.cars().filter((c) => !q || `${c.brand} ${c.model} ${c.variant}`.toLowerCase().includes(q));
    return `
      <div class="toolbar">
        <input class="input" id="stockSearch" placeholder="Cari stok…" value="${esc(params.q || '')}" aria-label="Cari stok">
        <button class="btn btn-primary" id="addCar">+ Tambah Mobil</button>
      </div>
      <div class="table-wrap card">
        <table class="table admin-table">
          <thead><tr><th>Mobil</th><th>Tahun</th><th>Kondisi</th><th>Harga</th><th>Status</th><th>Unggulan</th><th></th></tr></thead>
          <tbody>${cars.map((c) => `
            <tr>
              <td><div class="row-car"><img src="${esc(c.image)}" alt=""><div><strong>${esc(carName(c))}</strong><small>${esc(c.variant)}</small></div></div></td>
              <td>${esc(c.year)}</td>
              <td>${esc(c.condition)}</td>
              <td class="nowrap">${rupiah(c.price)}</td>
              <td><select class="input status-${statusClass(c.status)}" data-status="${esc(c.id)}" aria-label="Status">${STATUSES.map((s) => `<option ${s === c.status ? 'selected' : ''}>${s}</option>`).join('')}</select></td>
              <td><input type="checkbox" data-featured="${esc(c.id)}" ${c.featured ? 'checked' : ''} aria-label="Unggulan"></td>
              <td class="nowrap"><button class="btn btn-ghost btn-sm" data-edit="${esc(c.id)}">Edit</button> <button class="btn btn-danger btn-sm" data-del="${esc(c.id)}">Hapus</button></td>
            </tr>`).join('') || '<tr><td colspan="7" class="center muted">Tidak ada data.</td></tr>'}
          </tbody>
        </table>
      </div>`;
  }

  function carForm(c) {
    const isNew = !c;
    c = c || { brand: '', model: '', variant: '', year: new Date().getFullYear(), type: 'MPV', condition: 'Bekas', status: 'Tersedia', price: '', transmission: 'AT', fuel: 'Bensin', engine: '', seats: 7, km: 0, color: '', image: '', featured: false, features: [], description: '' };
    const sel = (name, opts) => `<select name="${name}">${opts.map((o) => `<option ${String(o) === String(c[name]) ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
    openModal(`
      <h2 id="modalTitle">${isNew ? 'Tambah Mobil' : 'Edit Mobil'}</h2>
      <form id="carForm" class="form">
        <div class="img-pick">
          <img id="imgPreview" src="${esc(c.image)}" alt="" ${c.image ? '' : 'hidden'}>
          <label class="btn btn-ghost btn-sm">Pilih foto<input type="file" accept="image/*" id="imgFile" hidden></label>
          <input type="hidden" name="image" value="${esc(c.image)}">
        </div>
        <div class="form-row">
          <label>Merek<input name="brand" required value="${esc(c.brand)}" list="brandList"></label>
          <label>Model<input name="model" required value="${esc(c.model)}"></label>
        </div>
        <datalist id="brandList">${[...new Set(Store.cars().map((x) => x.brand))].map((b) => `<option value="${esc(b)}">`).join('')}</datalist>
        <label>Varian<input name="variant" value="${esc(c.variant)}" placeholder="cth. 1.5 G CVT"></label>
        <div class="form-row three">
          <label>Tahun<input type="number" name="year" min="1980" max="2100" required value="${esc(c.year)}"></label>
          <label>Tipe${sel('type', ['SUV', 'MPV', 'Minibus', 'Hatchback', 'Sedan', 'Pick-up'])}</label>
          <label>Kondisi${sel('condition', ['Baru', 'Bekas'])}</label>
        </div>
        <div class="form-row">
          <label>Harga (Rp)<input type="number" name="price" min="0" step="500000" required value="${esc(c.price)}"></label>
          <label>Status${sel('status', STATUSES)}</label>
        </div>
        <div class="form-row three">
          <label>Transmisi${sel('transmission', ['MT', 'AT', 'CVT', 'DCT', 'e-CVT'])}</label>
          <label>Bahan bakar${sel('fuel', ['Bensin', 'Diesel', 'Hybrid', 'Listrik'])}</label>
          <label>Kursi<input type="number" name="seats" min="1" max="20" value="${esc(c.seats)}"></label>
        </div>
        <div class="form-row three">
          <label>Mesin<input name="engine" value="${esc(c.engine)}" placeholder="cth. 1.496 cc, 104 PS"></label>
          <label>Warna<input name="color" value="${esc(c.color)}"></label>
          <label>Kilometer<input type="number" name="km" min="0" value="${esc(c.km)}"></label>
        </div>
        <label>Fitur (satu per baris)<textarea name="features" rows="4">${esc((c.features || []).join('\n'))}</textarea></label>
        <label>Deskripsi<textarea name="description" rows="3">${esc(c.description)}</textarea></label>
        <label class="check"><input type="checkbox" name="featured" ${c.featured ? 'checked' : ''}> Tampilkan sebagai mobil unggulan</label>
        <p class="form-error" id="carError" hidden></p>
        <button class="btn btn-primary btn-block">Simpan</button>
      </form>`, (root) => {
      const form = $('#carForm', root);
      $('#imgFile', root).addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          const data = await resizeImage(file, 1000);
          form.image.value = data;
          const img = $('#imgPreview', root);
          img.src = data;
          img.hidden = false;
        } catch (err) {
          toast('Gagal membaca gambar');
        }
      });
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const d = Object.fromEntries(new FormData(form));
        const err = $('#carError', root);
        if (!d.brand.trim() || !d.model.trim() || !Number(d.price)) {
          err.textContent = 'Merek, model, dan harga wajib diisi.';
          err.hidden = false;
          return;
        }
        const car = {
          ...c,
          ...d,
          id: c.id || Store.uid(d.model.toLowerCase().replace(/[^a-z0-9]+/g, '-')),
          year: Number(d.year), price: Number(d.price), seats: Number(d.seats), km: Number(d.km) || 0,
          featured: !!d.featured,
          features: d.features.split('\n').map((s) => s.trim()).filter(Boolean),
          image: d.image || 'assets/icon.svg',
        };
        if (!Store.saveCar(car)) {
          err.textContent = 'Penyimpanan penuh. Gunakan foto yang lebih kecil.';
          err.hidden = false;
          return;
        }
        closeModal();
        toast(isNew ? 'Mobil ditambahkan' : 'Perubahan disimpan');
        render(false);
      });
    });
  }

  function resizeImage(file, max) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const scale = Math.min(1, max / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // ---------- Tab: Prospek ----------
  function prospects(params) {
    const all = Store.leads();
    const leads = all.filter((l) => !params.status || l.status === params.status).filter((l) => !params.type || l.type === params.type);
    const detail = (l) => [
      l.date ? `📅 ${esc(l.date)} ${esc(l.time || '')} · ${esc(l.location || '')}` : '',
      l.credit ? `💳 DP ${rupiah(l.credit.dp)} · ${esc(l.credit.tenor)} th · ${rupiah(l.credit.monthly)}/bln` : '',
      l.tradeCar ? `🔁 ${esc(l.tradeCar)}${l.tradeYear ? ' ' + esc(l.tradeYear) : ''}${l.tradeKm ? ' · ' + Number(l.tradeKm).toLocaleString('id-ID') + ' km' : ''}${l.tradeTrans ? ' · ' + esc(l.tradeTrans) : ''}${l.tradePrice ? ' · harapan ' + rupiah(l.tradePrice) : ''}` : '',
      l.note ? `📝 ${esc(l.note)}` : '',
    ].filter(Boolean).map((s) => `<p>${s}</p>`).join('');
    return `
      <div class="toolbar">
        <select class="input" id="leadStatus" aria-label="Filter status"><option value="">Semua status (${all.length})</option>${LEAD_STATUSES.map((s) => `<option ${s === params.status ? 'selected' : ''}>${s}</option>`).join('')}</select>
        <select class="input" id="leadType" aria-label="Filter jenis"><option value="">Semua jenis</option>${LEAD_TYPES.map((s) => `<option ${s === params.type ? 'selected' : ''}>${s}</option>`).join('')}</select>
        <button class="btn btn-ghost" id="exportCsv" ${all.length ? '' : 'disabled'}>Export CSV</button>
      </div>
      <div class="lead-list">${leads.map((l) => `
        <article class="card lead">
          <header>
            <div><span class="tag">${esc(l.type)}</span><h3>${esc(l.name)}</h3><small>${fmtDate(l.createdAt)}</small></div>
            <select class="input" data-lead-status="${esc(l.id)}" aria-label="Status prospek">${LEAD_STATUSES.map((s) => `<option ${s === l.status ? 'selected' : ''}>${s}</option>`).join('')}</select>
          </header>
          ${l.carName ? `<p class="lead-car">🚗 ${esc(l.carName)}</p>` : ''}
          <div class="lead-detail">${detail(l)}</div>
          <footer>
            <a class="btn btn-wa btn-sm" target="_blank" rel="noopener" href="${waTo(l.phone, `Halo ${l.name}, terima kasih telah menghubungi ${Store.settings().dealerName}${l.carName ? ` terkait ${l.carName}` : ''}.`)}">WhatsApp ${esc(l.phone)}</a>
            <a class="btn btn-ghost btn-sm" href="tel:${esc(l.phone)}">Telepon</a>
            <button class="btn btn-danger btn-sm" data-del-lead="${esc(l.id)}">Hapus</button>
          </footer>
        </article>`).join('') || '<div class="empty"><div class="empty-icon">📭</div><h3>Belum ada prospek</h3><p>Prospek dari form test drive, kredit, dan pertanyaan akan muncul di sini.</p></div>'}
      </div>`;
  }

  function exportCsv() {
    const cols = ['createdAt', 'type', 'status', 'name', 'phone', 'carName', 'date', 'time', 'location', 'tradeCar', 'tradeYear', 'tradeKm', 'tradeTrans', 'tradePrice', 'note'];
    const rows = Store.leads().map((l) => [...cols.map((k) => l[k] ?? ''), l.credit ? `DP ${l.credit.dp} / ${l.credit.tenor} th / ${l.credit.monthly}` : '']);
    const csv = [[...cols, 'credit'], ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    download(`prospek-dealer-pak-aji-${new Date().toISOString().slice(0, 10)}.csv`, '﻿' + csv, 'text/csv');
  }

  function download(name, content, type) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type }));
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // ---------- Tab: Pengaturan ----------
  function settingsView() {
    const s = Store.settings();
    const field = (k, label, attrs = '') => `<label>${label}<input name="${k}" value="${esc(s[k])}" ${attrs}></label>`;
    return `
      <div class="admin-grid">
        <form class="card pad form" id="settingsForm">
          <h3>Profil dealer</h3>
          ${field('dealerName', 'Nama dealer', 'required')}
          ${field('tagline', 'Tagline')}
          <div class="form-row">
            ${field('whatsapp', 'No. WhatsApp (format 62…)', 'inputmode="numeric" required')}
            ${field('phone', 'Telepon')}
          </div>
          ${field('email', 'Email', 'type="email"')}
          ${field('address', 'Alamat')}
          ${field('hours', 'Jam operasional (pisahkan dengan ;)')}
          <div class="form-row">
            ${field('instagram', 'Instagram (username)')}
            ${field('facebook', 'Facebook (username/URL)')}
          </div>
          <button class="btn btn-primary">Simpan profil</button>
        </form>
        <div class="stack">
          <form class="card pad form" id="pinForm">
            <h3>Ganti PIN admin</h3>
            <label>PIN baru<input type="password" name="pin" inputmode="numeric" minlength="4" required></label>
            <button class="btn btn-primary">Ganti PIN</button>
          </form>
          <div class="card pad form">
            <h3>Cadangan data</h3>
            <p class="muted small">Data tersimpan di browser ini. Unduh cadangan secara berkala.</p>
            <div class="btn-row">
              <button class="btn btn-ghost" id="backup">Unduh cadangan</button>
              <label class="btn btn-ghost">Pulihkan<input type="file" accept="application/json" id="restore" hidden></label>
            </div>
            <button class="btn btn-danger" id="resetData">Reset stok ke data awal</button>
          </div>
        </div>
      </div>`;
  }

  // ---------- Route ----------
  routes.admin = (params) => {
    if (!isAuthed()) return `<div class="container admin-wrap">${loginView()}</div>`;
    const tab = TABS.some(([k]) => k === params.tab) ? params.tab : 'dashboard';
    const content = { dashboard, stok: stock, prospek: prospects, pengaturan: settingsView }[tab](params);
    const newCount = Store.leads().filter((l) => l.status === 'Baru').length;
    return `<div class="container admin-wrap">
      <div class="admin-head">
        <div><h1>Panel Admin</h1><p class="muted">${esc(Store.settings().dealerName)}</p></div>
        <button class="btn btn-ghost btn-sm" id="logout">Keluar</button>
      </div>
      <nav class="tabs" aria-label="Menu admin">${TABS.map(([k, label]) => `<a href="#/admin?tab=${k}" class="${k === tab ? 'active' : ''}">${label}${k === 'prospek' && newCount ? ` <span class="badge">${newCount}</span>` : ''}</a>`).join('')}</nav>
      <div class="admin-body">${content}</div>
    </div>`;
  };

  routes.admin.mount = (params) => {
    const loginForm = $('#loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (loginForm.pin.value === Store.settings().adminPin) {
          sessionStorage.setItem(AUTH_KEY, '1');
          render();
        } else {
          $('#loginError').hidden = false;
          loginForm.pin.select();
        }
      });
      return;
    }
    $('#logout').addEventListener('click', () => {
      sessionStorage.removeItem(AUTH_KEY);
      render();
    });
    const setParam = (k, v) => {
      const p = new URLSearchParams({ ...params, [k]: v });
      if (!v) p.delete(k);
      history.replaceState(null, '', '#/admin?' + p.toString());
      render(false);
    };
    const root = document.querySelector('.admin-body');

    // Stok
    const search = $('#stockSearch');
    if (search) {
      let t;
      search.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => {
          setParam('q', search.value);
          const s = $('#stockSearch');
          s.focus();
          s.setSelectionRange(s.value.length, s.value.length);
        }, 250);
      });
      $('#addCar').addEventListener('click', () => carForm(null));
    }
    root.addEventListener('change', (e) => {
      const st = e.target.closest('[data-status]');
      if (st) {
        Store.saveCar({ ...Store.car(st.dataset.status), status: st.value });
        toast('Status diperbarui');
        render(false);
      }
      const ft = e.target.closest('[data-featured]');
      if (ft) {
        Store.saveCar({ ...Store.car(ft.dataset.featured), featured: ft.checked });
        toast(ft.checked ? 'Ditandai unggulan' : 'Bukan unggulan lagi');
      }
      const ls = e.target.closest('[data-lead-status]');
      if (ls) {
        Store.updateLead(ls.dataset.leadStatus, { status: ls.value });
        toast('Status prospek: ' + ls.value);
        render(false);
      }
    });
    root.addEventListener('click', (e) => {
      const ed = e.target.closest('[data-edit]');
      if (ed) carForm(Store.car(ed.dataset.edit));
      const del = e.target.closest('[data-del]');
      if (del) {
        const c = Store.car(del.dataset.del);
        if (confirm(`Hapus ${carName(c)} ${c.variant}?`)) {
          Store.deleteCar(c.id);
          Store.setCompare(Store.compare().filter((x) => x !== c.id));
          toast('Mobil dihapus');
          render(false);
        }
      }
      const dl = e.target.closest('[data-del-lead]');
      if (dl && confirm('Hapus prospek ini?')) {
        Store.deleteLead(dl.dataset.delLead);
        toast('Prospek dihapus');
        render(false);
      }
    });

    // Prospek
    const ls = $('#leadStatus');
    if (ls) {
      ls.addEventListener('change', () => setParam('status', ls.value));
      $('#leadType').addEventListener('change', (e) => setParam('type', e.target.value));
      $('#exportCsv').addEventListener('click', exportCsv);
    }

    // Pengaturan
    const sf = $('#settingsForm');
    if (sf) {
      sf.addEventListener('submit', (e) => {
        e.preventDefault();
        const d = Object.fromEntries(new FormData(sf));
        d.whatsapp = d.whatsapp.replace(/\D/g, '').replace(/^0/, '62');
        Store.saveSettings({ ...Store.settings(), ...d });
        App.applySettings();
        toast('Profil dealer disimpan');
        render(false);
      });
      $('#pinForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const pin = e.target.pin.value.trim();
        if (pin.length < 4) return toast('PIN minimal 4 digit');
        Store.saveSettings({ ...Store.settings(), adminPin: pin });
        e.target.reset();
        toast('PIN berhasil diganti');
      });
      $('#backup').addEventListener('click', () => {
        const data = { cars: Store.cars(), leads: Store.leads(), settings: Store.settings(), exportedAt: new Date().toISOString() };
        download(`backup-dealer-pak-aji-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2), 'application/json');
      });
      $('#restore').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
          const data = JSON.parse(await file.text());
          if (!Array.isArray(data.cars)) throw new Error('format');
          if (!confirm('Pulihkan data dari cadangan? Data saat ini akan ditimpa.')) return;
          localStorage.setItem('dpa_cars', JSON.stringify(data.cars));
          if (Array.isArray(data.leads)) localStorage.setItem('dpa_leads', JSON.stringify(data.leads));
          if (data.settings) Store.saveSettings(data.settings);
          App.applySettings();
          toast('Data berhasil dipulihkan');
          render(false);
        } catch (err) {
          toast('File cadangan tidak valid');
        }
      });
      $('#resetData').addEventListener('click', () => {
        if (confirm('Kembalikan semua stok ke data awal? Perubahan stok akan hilang.')) {
          Store.resetCars();
          toast('Stok dikembalikan ke data awal');
          render(false);
        }
      });
    }
  };
})();
