/* ═══════════════════════════════════
   BriskLearn — IndexedDB (Offline DB)
   ═══════════════════════════════════ */

window.DB = (() => {
  const DB_NAME = 'brisklearn_db';
  const DB_VERSION = 2;
  let db;

  const STORES = {
    users: 'users',
    sessions: 'sessions',
    materials: 'materials',
    quizSubmissions: 'quizSubmissions',
    pendingSync: 'pendingSync',
    standards: 'standards',
    classes: 'classes',
    coPoMappings: 'coPoMappings',
  };

  function open() {
    return new Promise((resolve, reject) => {
      if (db) { resolve(db); return; }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = e => {
        const d = e.target.result;
        // Users
        if (!d.objectStoreNames.contains(STORES.users)) {
          const us = d.createObjectStore(STORES.users, { keyPath: 'id' });
          us.createIndex('email', 'email', { unique: true });
          us.createIndex('role', 'role', { unique: false });
        }
        // Sessions
        if (!d.objectStoreNames.contains(STORES.sessions))
          d.createObjectStore(STORES.sessions, { keyPath: 'token' });
        // Materials
        if (!d.objectStoreNames.contains(STORES.materials)) {
          const ms = d.createObjectStore(STORES.materials, { keyPath: 'id' });
          ms.createIndex('createdBy', 'createdBy', { unique: false });
          ms.createIndex('type', 'type', { unique: false });
        }
        // Quiz submissions
        if (!d.objectStoreNames.contains(STORES.quizSubmissions)) {
          const qs = d.createObjectStore(STORES.quizSubmissions, { keyPath: 'id', autoIncrement: true });
          qs.createIndex('studentId', 'studentId', { unique: false });
          qs.createIndex('quizId', 'quizId', { unique: false });
        }
        // Pending sync
        if (!d.objectStoreNames.contains(STORES.pendingSync))
          d.createObjectStore(STORES.pendingSync, { keyPath: 'id', autoIncrement: true });
        // Standards
        if (!d.objectStoreNames.contains(STORES.standards))
          d.createObjectStore(STORES.standards, { keyPath: 'code' });
        // Classes
        if (!d.objectStoreNames.contains(STORES.classes)) {
          const cs = d.createObjectStore(STORES.classes, { keyPath: 'id' });
          cs.createIndex('facultyId', 'facultyId', { unique: false });
        }
        // CO-PO Mappings
        if (!d.objectStoreNames.contains(STORES.coPoMappings))
          d.createObjectStore(STORES.coPoMappings, { keyPath: 'id' });
      };
      req.onsuccess = e => { db = e.target.result; resolve(db); };
      req.onerror = e => reject(e.target.error);
    });
  }

  function tx(storeName, mode = 'readonly') {
    return db.transaction(storeName, mode).objectStore(storeName);
  }

  async function get(store, key) {
    await open();
    return new Promise((res, rej) => {
      const req = tx(store).get(key);
      req.onsuccess = e => res(e.target.result);
      req.onerror = e => rej(e.target.error);
    });
  }

  async function getByIndex(store, index, value) {
    await open();
    return new Promise((res, rej) => {
      const req = tx(store).index(index).get(value);
      req.onsuccess = e => res(e.target.result);
      req.onerror = e => rej(e.target.error);
    });
  }

  async function getAll(store) {
    await open();
    return new Promise((res, rej) => {
      const req = tx(store).getAll();
      req.onsuccess = e => res(e.target.result);
      req.onerror = e => rej(e.target.error);
    });
  }

  async function getAllByIndex(store, index, value) {
    await open();
    return new Promise((res, rej) => {
      const req = tx(store).index(index).getAll(value);
      req.onsuccess = e => res(e.target.result);
      req.onerror = e => rej(e.target.error);
    });
  }

  async function put(store, record) {
    await open();
    return new Promise((res, rej) => {
      const req = tx(store, 'readwrite').put(record);
      req.onsuccess = e => res(e.target.result);
      req.onerror = e => rej(e.target.error);
    });
  }

  async function del(store, key) {
    await open();
    return new Promise((res, rej) => {
      const req = tx(store, 'readwrite').delete(key);
      req.onsuccess = () => res(true);
      req.onerror = e => rej(e.target.error);
    });
  }

  async function clear(store) {
    await open();
    return new Promise((res, rej) => {
      const req = tx(store, 'readwrite').clear();
      req.onsuccess = () => res(true);
      req.onerror = e => rej(e.target.error);
    });
  }

  // Queue item for background sync
  async function queueSync(action, payload) {
    await put(STORES.pendingSync, { action, payload, ts: Date.now() });
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const reg = await navigator.serviceWorker.ready;
      await reg.sync.register('sync-submissions');
    }
  }

  // Seed demo data on first run
  async function seedDemoData() {
    await open();
    const existing = await getAll(STORES.users);
    if (existing.length > 0) return;

    const demoUsers = [
      {
        id: 'admin-001', name: 'Dr. Priya Patel', email: 'admin@brisklearn.edu',
        password: 'Admin@123', role: 'admin', status: 'active',
        institution: 'BriskLearn Academy', createdAt: new Date().toISOString(),
        avatar: 'PP'
      },
      {
        id: 'fac-001', name: 'Prof. Ramesh Kumar', email: 'ramesh@brisklearn.edu',
        password: 'Faculty@123', role: 'faculty', status: 'active',
        department: 'Science', subjects: ['Physics','Chemistry'],
        classes: ['class-001'], createdAt: new Date().toISOString(), avatar: 'RK'
      },
      {
        id: 'fac-002', name: 'Ms. Ananya Singh', email: 'ananya@brisklearn.edu',
        password: 'Faculty@123', role: 'faculty', status: 'pending',
        department: 'English', subjects: ['English Literature'],
        classes: [], createdAt: new Date().toISOString(), avatar: 'AS'
      },
      {
        id: 'stu-001', name: 'Arjun Sharma', email: 'arjun@student.brisklearn.edu',
        password: 'Student@123', role: 'student', status: 'active',
        rollNo: 'S2024001', class: 'class-001', createdAt: new Date().toISOString(), avatar: 'AS'
      },
      {
        id: 'stu-002', name: 'Meera Nair', email: 'meera@student.brisklearn.edu',
        password: 'Student@123', role: 'student', status: 'active',
        rollNo: 'S2024002', class: 'class-001', createdAt: new Date().toISOString(), avatar: 'MN'
      },
    ];

    for (const u of demoUsers) await put(STORES.users, u);

    // Demo class
    await put(STORES.classes, {
      id: 'class-001', name: 'Grade 8 Science',
      facultyId: 'fac-001', subject: 'Science',
      students: ['stu-001','stu-002'], year: '2024-25'
    });

    // Seed standards (NCERT + NBA style)
    const standards = [
      { code: 'NCERT-SCI-8.1', board: 'NCERT', subject: 'Science', grade: 8, description: 'Crop Production and Management', outcomes: ['CO1','CO2'] },
      { code: 'NCERT-SCI-8.2', board: 'NCERT', subject: 'Science', grade: 8, description: 'Microorganisms: Friend and Foe', outcomes: ['CO2','CO3'] },
      { code: 'NCERT-MATH-8.1', board: 'NCERT', subject: 'Mathematics', grade: 8, description: 'Rational Numbers', outcomes: ['CO1'] },
      { code: 'NCERT-ENG-8.1', board: 'NCERT', subject: 'English', grade: 8, description: 'The Best Christmas Present in the World', outcomes: ['CO4'] },
      { code: 'NBA-PO1', board: 'NBA', subject: 'Engineering Basics', grade: 11, description: 'Engineering Knowledge', outcomes: ['PO1'] },
      { code: 'NBA-PO2', board: 'NBA', subject: 'Problem Analysis', grade: 11, description: 'Problem Analysis', outcomes: ['PO2'] },
      { code: 'CBSE-SCI-8.3', board: 'CBSE', subject: 'Science', grade: 8, description: 'Synthetic Fibres and Plastics', outcomes: ['CO1','CO3'] },
    ];
    for (const s of standards) await put(STORES.standards, s);
  }

  return {
    open, get, getByIndex, getAll, getAllByIndex, put, del, clear, queueSync, seedDemoData,
    STORES
  };
})();
