// Penyimpanan data di localStorage browser (tanpa server).
const Store = (() => {
  const KEYS = {
    version: 'dpa_version',
    cars: 'dpa_cars',
    leads: 'dpa_leads',
    settings: 'dpa_settings',
    favs: 'dpa_favs',
    compare: 'dpa_compare',
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('Gagal menyimpan data', e);
      return false;
    }
  }

  function init() {
    if (read(KEYS.version, 0) !== SEED_VERSION) {
      write(KEYS.cars, SEED_CARS);
      write(KEYS.version, SEED_VERSION);
    }
  }

  function uid(prefix) {
    return prefix + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  return {
    init,
    uid,
    // Mobil
    cars: () => read(KEYS.cars, SEED_CARS),
    car: (id) => read(KEYS.cars, SEED_CARS).find((c) => c.id === id),
    saveCar(car) {
      const cars = read(KEYS.cars, SEED_CARS);
      const i = cars.findIndex((c) => c.id === car.id);
      if (i >= 0) cars[i] = car; else cars.unshift(car);
      return write(KEYS.cars, cars);
    },
    deleteCar(id) {
      write(KEYS.cars, read(KEYS.cars, SEED_CARS).filter((c) => c.id !== id));
    },
    resetCars() {
      write(KEYS.cars, SEED_CARS);
    },
    // Prospek / booking
    leads: () => read(KEYS.leads, []),
    addLead(lead) {
      const leads = read(KEYS.leads, []);
      leads.unshift({ id: uid('lead'), createdAt: new Date().toISOString(), status: 'Baru', ...lead });
      write(KEYS.leads, leads);
    },
    updateLead(id, patch) {
      write(KEYS.leads, read(KEYS.leads, []).map((l) => (l.id === id ? { ...l, ...patch } : l)));
    },
    deleteLead(id) {
      write(KEYS.leads, read(KEYS.leads, []).filter((l) => l.id !== id));
    },
    // Pengaturan
    settings: () => ({ ...DEFAULT_SETTINGS, ...read(KEYS.settings, {}) }),
    saveSettings: (s) => write(KEYS.settings, s),
    // Favorit & bandingkan
    favs: () => read(KEYS.favs, []),
    toggleFav(id) {
      const f = read(KEYS.favs, []);
      const next = f.includes(id) ? f.filter((x) => x !== id) : [...f, id];
      write(KEYS.favs, next);
      return next.includes(id);
    },
    compare: () => read(KEYS.compare, []),
    setCompare: (ids) => write(KEYS.compare, ids),
  };
})();
