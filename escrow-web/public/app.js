/* Middleman — mobile-first escrow web app. All rules are enforced by the server; this is the UI. */
(() => {
  'use strict';

  // ---------- icons ----------
  const I = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    scale: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18M7 21h10M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5z"/><path d="m8.5 12 2.5 2.5 4.5-5" stroke-linecap="round"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/></svg>',
    truck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>',
    box: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/></svg>',
    wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M16 15h2"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>',
    checkc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 6-6 6 6 6"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    gavel: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14 4 6 6M11 7l6 6M9.5 8.5l6 6M4 20l7-7M3 21h8"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 20s-8-4.8-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6.2-8 11-8 11z"/></svg>',
    tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/></svg>',
    brief: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M3 13h18"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
    chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>',
    id: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="12" r="2.5"/><path d="M13 10h5M13 14h4"/></svg>',
    bank: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10 12 4l9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/></svg>',
    camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
    logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h11"/></svg>',
    inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 13h5l1.5 3h5L16 13h5"/><path d="M5 5h14l2 8v6H3v-6z"/></svg>',
  };

  // ---------- constants ----------
  // Service fee is deducted from the contract price: 3%, or 5% once a dispute is opened.
  const FEE_RATE = 0.03, DISPUTE_FEE_RATE = 0.05;
  const KYC = { verified: ['ยืนยันตัวตนแล้ว', 'teal'], pending: ['รอตรวจสอบตัวตน', 'amber'], rejected: ['ไม่ผ่านการตรวจสอบ', 'red'] };
  const STATUS = {
    pending:          { label: 'รอยืนยันข้อตกลง', tone: 'gray' },
    awaiting_payment: { label: 'รอชำระเงิน', tone: 'amber' },
    funded:           { label: 'พักเงินแล้ว · รอจัดส่ง', tone: 'blue' },
    shipped:          { label: 'จัดส่งแล้ว · รอตรวจรับ', tone: 'blue' },
    disputed:         { label: 'อยู่ระหว่างข้อพิพาท', tone: 'red' },
    completed:        { label: 'สำเร็จ', tone: 'teal' },
    resolved:         { label: 'ตัดสินแล้ว', tone: 'teal' },
    cancelled:        { label: 'ยกเลิก', tone: 'gray' },
  };
  const DISPUTE_REASONS = {
    not_received: 'ไม่ได้รับสินค้า / งาน',
    not_as_described: 'ไม่ตรงตามที่ตกลง (ไม่ตรงปก)',
    damaged: 'สินค้าชำรุด / ใช้งานไม่ได้',
    buyer_silent: 'ผู้ซื้อได้รับแล้วแต่ไม่ยืนยัน',
    other: 'อื่น ๆ',
  };
  const CARRIERS = ['ไปรษณีย์ไทย (EMS)', 'Kerry Express', 'Flash Express', 'J&T Express', 'นัดรับ / ส่งมอบด้วยตนเอง', 'ส่งไฟล์ / งานดิจิทัล'];
  const DAY = 86400000;

  // ---------- API client ----------
  // All data lives on the server; the client only keeps a cache of the user's deals.
  const state = { me: null, demo: false, deals: [], banks: {}, loaded: false };
  let current = null; // deal being viewed (role() follows the user's side in it)

  async function api(method, url, body) {
    const res = await fetch(url, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    let data = {};
    try { data = await res.json(); } catch (e) {}
    if (!res.ok) throw Object.assign(new Error(data.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่'), { status: res.status });
    return data;
  }
  function upsert(d) {
    const i = state.deals.findIndex((x) => x.id === d.id);
    if (i >= 0) state.deals[i] = d; else if (d.myRole && !d.prospective) state.deals.unshift(d);
    if (current && current.id === d.id) current = d;
    return d;
  }
  async function refreshDeals() { state.deals = (await api('GET', '/api/deals')).deals; }
  async function ensureSession() {
    const r = await api('GET', '/api/me');
    state.demo = r.demo;
    state.me = r.user;
    state.banks = r.banks || {};
    state.loaded = true;
  }
  function signedIn(user, okText) {
    state.me = user;
    state.deals = [];
    draft = null;
    go(user.kycStatus === 'verified' && !user.isAdmin && !user.bank ? '/me' : '/');
    if (okText) toast(okText);
  }
  // Run an API action, then update the cache and re-render. Errors become a toast.
  let busy = false;
  async function act(fn, okText, after) {
    if (busy) return;
    busy = true;
    document.body.classList.add('busy');
    try {
      const d = await fn();
      if (d && d.id) upsert(d);
      closeSheet();
      if (after) after(d); else route();
      if (okText) toast(okText);
    } catch (e) {
      toast(e.message);
    } finally {
      busy = false;
      document.body.classList.remove('busy');
    }
  }

  // ---------- helpers ----------
  const $ = (s, el = document) => el.querySelector(s);
  const app = $('#app');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const baht = (n) => '฿' + Number(n).toLocaleString('th-TH', Number.isInteger(Math.round(n * 100) / 100) ? {} : { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = (ts) => new Date(ts).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const fmtDay = (ts) => new Date(ts).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
  const findDeal = (id) => (current && current.id === id ? current : state.deals.find((d) => d.id === id));
  const isAdmin = () => !!state.me?.isAdmin;
  const role = () => (current ? current.myRole : isAdmin() ? 'admin' : null);
  const roleName = (d, r) => (r === 'buyer' ? d.buyerName : r === 'seller' ? d.sellerName : r === 'admin' ? 'ผู้ไกล่เกลี่ย' : 'ระบบ');

  // Mirrors the server's fee rules (satang-exact) for previews; the server is authoritative.
  function money(d) {
    const p = Math.round(d.price * 100);
    const f = Math.round(p * FEE_RATE), df = Math.round(p * DISPUTE_FEE_RATE);
    return { buyerPays: p / 100, fee: f / 100, sellerGets: (p - f) / 100, disputeFee: df / 100, disputePool: (p - df) / 100 };
  }
  const contractHash = (d) => d.contractHash.toUpperCase();
  function daysLeft(ts) { return Math.ceil((ts - Date.now()) / DAY); }

  let toastT;
  function toast(text) {
    const t = $('#toast'); t.textContent = text; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600);
  }
  function pill(status) { const s = STATUS[status]; return `<span class="pill ${s.tone}">${s.label}</span>`; }

  // What should this side of the deal do next?
  function nextAction(d, r) {
    if (r === 'admin') return d.status === 'disputed' ? (d.dispute.response ? 'พร้อมพิจารณาตัดสิน' : 'รอคำชี้แจงจากอีกฝ่าย') : null;
    if (!r) return null;
    switch (d.status) {
      case 'pending': return d.signatures[r] ? `รอ${r === 'buyer' ? 'ผู้ขาย' : 'ผู้ซื้อ'}ยืนยันข้อตกลง` : 'ตรวจสอบและลงนามข้อตกลง';
      case 'awaiting_payment':
        if (r !== 'buyer') return 'รอผู้ซื้อชำระเงิน';
        return d.paymentReview?.status === 'review' ? 'รอทีมงานตรวจสอบสลิป' : 'โอนเงินเข้าบัญชีพักเงินแล้วส่งสลิป';
      case 'funded': return r === 'seller' ? 'จัดส่งสินค้าและแจ้งเลขพัสดุ' : 'รอผู้ขายจัดส่ง';
      case 'shipped': return r === 'buyer' ? 'ตรวจสอบสินค้าและยืนยันรับ' : 'รอผู้ซื้อตรวจรับ';
      case 'disputed': {
        const ds = d.dispute;
        if (ds.by !== r && !ds.response) return 'ส่งคำชี้แจงข้อพิพาท';
        return 'รอผู้ไกล่เกลี่ยพิจารณา';
      }
      default: return null;
    }
  }
  const isMyTurn = (d, r = d.myRole) => {
    const a = nextAction(d, r);
    return !!a && !a.startsWith('รอ');
  };

  // ---------- router ----------
  let routeSeq = 0;
  async function route() {
    const seq = ++routeSeq;
    const h = location.hash.replace(/^#/, '').split('?')[0] || '/';
    const parts = h.split('/').filter(Boolean);
    closeSheet();
    current = null;
    const PUBLIC = ['login', 'thaid', 'idcard', 'pin', 'how'];
    try {
      if (!state.loaded) await ensureSession();
      if (!state.me) {
        if (seq !== routeSeq) return;
        renderChrome(null);
        if (parts[0] === 'thaid') return viewThaid();
        if (parts[0] === 'idcard') return viewIdCard();
        if (parts[0] === 'pin') return viewPin();
        if (parts[0] === 'how') return viewHow();
        if (!PUBLIC.includes(parts[0]) && h !== '/') afterLogin = h;
        return viewLogin();
      }
      if (PUBLIC.includes(parts[0]) && parts[0] !== 'how') { go('/'); return; }
      if (parts[0] === 'deal' && parts[1]) {
        const [d] = await Promise.all([api('GET', '/api/deals/' + encodeURIComponent(parts[1])), refreshDeals()]);
        if (seq !== routeSeq) return;
        current = d;
      } else {
        await refreshDeals();
        if (seq !== routeSeq) return;
      }
    } catch (e) {
      if (seq !== routeSeq) return;
      if (e.status === 401) { state.me = null; state.loaded = false; return route(); }
      renderChrome(parts[0] || 'home');
      return render(`<div class="card empty">${I.alert}<p>${esc(e.status === 404 || e.status === 403 ? 'ไม่พบดีลนี้ หรือคุณไม่มีสิทธิ์เข้าถึง' : e.message)}</p><a class="btn btn-ghost" style="margin-top:12px" href="#/">กลับหน้าหลัก</a></div>`);
    }
    renderChrome(parts[0] || 'home');
    if (!parts.length) return viewHome();
    if (parts[0] === 'deals') return viewDeals();
    if (parts[0] === 'new') return viewCreate();
    if (parts[0] === 'disputes') return viewDisputes();
    if (parts[0] === 'me') return viewMe();
    if (parts[0] === 'how') return viewHow();
    if (parts[0] === 'deal' && current) {
      if (parts[2] === 'contract') return viewContract(current);
      if (parts[2] === 'dispute') return viewOpenDispute(current);
      return viewDeal(current);
    }
    viewNotFound();
  }
  let afterLogin = null;
  function go(path) {
    if (path === '/' && afterLogin && state.me) { path = afterLogin; afterLogin = null; }
    if (location.hash === '#' + path) route(); else location.hash = path;
  }
  function render(html) { app.innerHTML = html; window.scrollTo(0, 0); }

  function renderChrome(active) {
    const me = state.me;
    const chip = $('#personaChip');
    chip.hidden = !me;
    $('#tabbar').hidden = !me;
    document.body.classList.toggle('signed-out', !me);
    if (!me) return;
    chip.innerHTML = `<span class="dot ${me.kycStatus === 'verified' ? '' : 'warn'}"></span>${esc(me.isAdmin ? 'ผู้ไกล่เกลี่ย' : me.name.split(' ')[0])}`;
    const todo = state.deals.filter((d) => isMyTurn(d)).length;
    const disputes = state.deals.filter((d) => d.status === 'disputed').length;
    const tab = (key, href, icon, label, badge) =>
      `<a class="tab ${active === key ? 'active' : ''}" href="${href}"><span class="tab-wrap">${icon}${badge ? `<span class="badge">${badge}</span>` : ''}</span>${label}</a>`;
    $('#tabbar').innerHTML =
      tab('home', '#/', I.home, 'หน้าหลัก') +
      tab('deals', '#/deals', I.list, 'ดีลของฉัน', todo) +
      `<a class="tab fab" href="#/new"><span class="fab-btn">${I.plus}</span>สร้างดีล</a>` +
      tab('disputes', '#/disputes', I.scale, 'ข้อพิพาท', isAdmin() ? disputes : 0) +
      tab('me', '#/me', I.user, 'บัญชี');
  }

  // ---------- views ----------
  const CAT = { goods: ['สินค้า', 'tag'], service: ['บริการ / จ้างงาน', 'brief'], digital: ['ดิจิทัล', 'spark'] };
  function initial(name) {
    const s = Array.from(String(name || '').replace(/^คุณ\s*/, '').trim());
    if (!s.length) return '?';
    return /[เแโใไ]/.test(s[0]) ? s.slice(0, 2).join('') : s[0];
  }
  function avatar(name, r, size = '') {
    return `<span class="avatar ${r} ${size}" aria-hidden="true">${esc(initial(name))}</span>`;
  }
  // 0 = agreement … 4 = paid out; -1 = cancelled
  function stage(d) {
    return { pending: 0, awaiting_payment: 1, funded: 2, shipped: 3, disputed: 3, completed: 5, resolved: 5, cancelled: -1 }[d.status];
  }
  function miniProgress(d) {
    const s = stage(d);
    return `<div class="mini-progress ${d.status === 'disputed' ? 'alert' : ''}" aria-hidden="true">${[0, 1, 2, 3, 4].map((i) =>
      `<span class="${i < s ? 'on' : i === s ? 'now' : ''}"></span>`).join('')}</div>`;
  }

  function dealCard(d) {
    const a = nextAction(d, d.myRole);
    const mine = isMyTurn(d);
    const cp = d.myRole === 'seller' ? ['buyer', d.buyerName] : ['seller', d.sellerName];
    return `<a class="card deal-item ${mine ? 'my-turn' : ''}" href="#/deal/${d.id}">
      <div class="top">
        <span class="cat-tile">${I[CAT[d.category || 'goods'][1]]}</span>
        <div class="grow">
          <div class="title">${esc(d.title)}</div>
          <div class="tiny row" style="gap:6px;margin-top:2px">${avatar(cp[1], cp[0], 'xs')}${cp[0] === 'buyer' ? 'ผู้ซื้อ' : 'ผู้ขาย'} ${esc(cp[1])} · ${d.code}</div>
        </div>
      </div>
      <div class="meta"><span class="amount num">${baht(d.price)}</span>${pill(d.status)}</div>
      ${stage(d) >= 0 ? miniProgress(d) : ''}
      ${a ? `<div class="next-line ${mine ? 'mine' : ''}">${mine ? I.alert : I.clock}<span>${mine ? '<b>ถึงตาคุณ</b> · ' : ''}${a}</span><span class="chev">${I.chev}</span></div>` : ''}
    </a>`;
  }

  function viewHome() {
    const r = role();
    const me = state.me;
    const todo = state.deals.filter((d) => isMyTurn(d));
    const held = state.deals.filter((d) => ['funded', 'shipped', 'disputed'].includes(d.status)).reduce((s, d) => s + d.price, 0);
    const active = state.deals.filter((d) => stage(d) >= 0 && stage(d) < 5).length;
    const hour = new Date().getHours();
    const greet = hour < 12 ? 'อรุณสวัสดิ์' : hour < 18 ? 'สวัสดีตอนบ่าย' : 'สวัสดีตอนเย็น';
    render(`<div class="stack-lg">
      <section class="greet">
        <div><div class="tiny">${greet}</div><h1 class="h-greet">${esc(r === 'admin' ? 'ทีมระงับข้อพิพาท' : 'คุณ' + me.name.split(' ')[0])}</h1></div>
        ${avatar(me.name, r === 'admin' ? 'admin' : 'buyer', 'lg')}
      </section>
      ${r !== 'admin' ? readinessHtml() : ''}

      ${r !== 'admin' ? `<section class="card stats">
        <div><div class="tiny">เงินพักอยู่ในระบบ</div><div class="stat num">${baht(held)}</div><div class="tiny">${I.lock}ปลอดภัยในบัญชีแยก</div></div>
        <div class="vr"></div>
        <div><div class="tiny">ดีลที่กำลังดำเนินการ</div><div class="stat num">${active}</div><div class="tiny" style="color:${todo.length ? 'var(--orange)' : 'var(--gold)'}">${todo.length ? `รอคุณ ${todo.length} ดีล` : 'ไม่มีงานค้าง'}</div></div>
      </section>` : ''}

      <section class="stack">
        <div class="section-title"><h2>${r === 'admin' ? 'ข้อพิพาทที่รอพิจารณา' : 'ต้องทำต่อ'}</h2><a href="${r === 'admin' ? '#/disputes' : '#/deals'}">ดูทั้งหมด</a></div>
        ${todo.length ? todo.slice(0, 3).map(dealCard).join('') : `<div class="card empty">${I.checkc}<p>ไม่มีอะไรค้าง เยี่ยมมาก</p></div>`}
      </section>

      <section class="hero">
        <img class="hero-logo" src="logo.svg" alt="" />
        <div class="hero-badge">${I.shield}ตัวกลางพักเงิน · Escrow</div>
        <h1>ซื้อขายกับคนแปลกหน้า<br/>อย่างสบายใจ</h1>
        <p>เงินพักไว้กับเรา ผู้ขายได้เงินเมื่อผู้ซื้อได้ของตามที่ตกลง ไม่ต้องมีร้าน ไม่ต้องสร้างเครดิต</p>
        <div class="actions">
          <a class="btn btn-primary" href="#/new">${I.plus}สร้างดีลใหม่</a>
          <button class="btn btn-ghost-light" data-action="join">มีรหัสดีล</button>
        </div>
      </section>

      <section class="trust-grid">
        <div>${I.id}<b>ทุกคนยืนยันตัวตน</b><span>บัตรประชาชน 1 คน 1 บัญชี</span></div>
        <div>${I.lock}<b>บัญชีพักเงินแยก</b><span>ไม่ปนกับรายได้บริษัท</span></div>
        <div>${I.scale}<b>คนกลางตัดสิน</b><span>ยึดกฎหมายและเจตนา</span></div>
      </section>

      <section class="card stack">
        <h2>ทำงานอย่างไร</h2>
        ${stepsHtml()}
        <a class="link-row" href="#/how">หลักการคุ้มครองและการตัดสินข้อพิพาท<span class="chev">${I.chev}</span></a>
      </section>
    </div>`);
  }

  function stepsHtml() {
    const s = [
      [I.doc, 'ตกลงเงื่อนไขร่วมกัน', 'ฝ่ายใดก็สร้างดีลได้ ระบุสินค้า ราคา เงื่อนไขรับของ แล้วส่งรหัสให้อีกฝ่ายลงนาม'],
      [I.lock, 'ผู้ซื้อโอนเข้าบัญชีพักเงิน', 'สแกน PromptPay แล้วส่งสลิป ระบบตรวจกับธนาคาร ผู้ขายเห็นว่าเงินพร้อมจริง'],
      [I.truck, 'ผู้ขายส่งของพร้อมหลักฐาน', 'แจ้งเลขพัสดุหรือหลักฐานการส่งมอบ ภายในเวลาที่ตกลง'],
      [I.box, 'ผู้ซื้อตรวจรับ แล้วเราปล่อยเงิน', 'ตรงตามเงื่อนไข → โอนให้ผู้ขาย (หักค่าบริการ 3%) · ไม่ตรง → เปิดข้อพิพาท'],
    ];
    return `<div class="steps">${s.map(([ic, t, d]) => `<div class="step"><div class="n">${ic}</div><div><h3>${t}</h3><p class="small muted">${d}</p></div></div>`).join('')}</div>`;
  }

  // Where is the money right now? buyer → Middleman → seller
  function moneyFlowHtml(d) {
    const s = d.status;
    const at = ['pending', 'awaiting_payment', 'cancelled'].includes(s) ? 'buyer' : ['funded', 'shipped', 'disputed'].includes(s) ? 'vault' : s === 'completed' ? 'seller' : 'split';
    const amt = d.payment ? d.payment.amount : money(d).buyerPays;
    const node = (key, inner, label, sub) => {
      const on = at === key || (at === 'split' && key !== 'vault' && ((key === 'buyer' && d.payout?.buyer) || (key === 'seller' && d.payout?.seller)));
      return `<div class="fnode ${key} ${on ? 'on' : ''} ${key === 'vault' && s === 'disputed' ? 'frozen' : ''}">
        <div class="fcircle">${inner}</div><div class="flabel">${label}</div>${on && sub ? `<div class="fchip num">${sub}</div>` : ''}</div>`;
    };
    const l1 = ['funded', 'shipped', 'disputed', 'completed', 'resolved'].includes(s) ? 'done' : s === 'awaiting_payment' ? 'next' : '';
    const l2 = s === 'completed' || (s === 'resolved' && d.payout?.seller) ? 'done' : s === 'shipped' ? 'next' : '';
    const buyerSub = at === 'split' ? baht(d.payout.buyer) : baht(amt);
    const sellerSub = at === 'split' ? baht(d.payout.seller) : baht(d.payout?.seller ?? money(d).sellerGets);
    return `<div class="flow" role="img" aria-label="สถานะเงิน">
      ${node('buyer', esc(initial(d.buyerName)), 'ผู้ซื้อ', buyerSub)}
      <div class="flink ${l1}"><i></i></div>
      ${node('vault', s === 'disputed' ? I.scale : I.lock, 'Middleman', baht(amt))}
      <div class="flink ${l2}"><i></i></div>
      ${node('seller', esc(initial(d.sellerName)), 'ผู้ขาย', sellerSub)}
    </div>`;
  }

  let dealFilter = 'active';
  function viewDeals() {
    const groups = {
      active: (d) => ['pending', 'awaiting_payment', 'funded', 'shipped'].includes(d.status),
      dispute: (d) => d.status === 'disputed',
      done: (d) => ['completed', 'resolved', 'cancelled'].includes(d.status),
    };
    const list = state.deals.filter(groups[dealFilter]).sort((a, b) => isMyTurn(b) - isMyTurn(a));
    render(`<div class="stack">
      <h1>ดีลของฉัน</h1>
      <div class="segmented" role="tablist">
        ${[['active', 'กำลังดำเนินการ'], ['dispute', 'ข้อพิพาท'], ['done', 'เสร็จสิ้น']].map(([k, l]) =>
          `<button class="${dealFilter === k ? 'on' : ''}" data-action="filter" data-v="${k}">${l} (${state.deals.filter(groups[k]).length})</button>`).join('')}
      </div>
      ${list.length ? list.map(dealCard).join('') : `<div class="card empty">${I.inbox}<p>ยังไม่มีดีลในหมวดนี้</p></div>`}
      <button class="btn btn-ghost btn-block" data-action="join">เข้าร่วมดีลด้วยรหัส</button>
    </div>`);
  }

  // ----- deal detail -----
  function timelineHtml(d) {
    const st = d.status;
    const order = ['pending', 'awaiting_payment', 'funded', 'shipped', 'completed'];
    let idx = order.indexOf(st);
    if (st === 'disputed' || st === 'resolved') idx = 3;
    const steps = [
      ['ทำข้อตกลงและลงนามทั้งสองฝ่าย', d.signatures.buyer && d.signatures.seller ? fmtDate(Math.max(d.signatures.buyer, d.signatures.seller)) : 'ผู้ซื้อ ' + (d.signatures.buyer ? '✓' : '…') + ' · ผู้ขาย ' + (d.signatures.seller ? '✓' : '…')],
      ['ผู้ซื้อชำระเงินเข้าระบบพัก', d.payment ? `${d.payment.method} · ${fmtDate(d.payment.ts)}` : ''],
      ['ผู้ขายจัดส่ง / ส่งมอบงาน', d.shipment ? `${d.shipment.carrier} · ${fmtDate(d.shipment.ts)}` : d.payment ? `ภายใน ${fmtDay(d.payment.ts + d.deliveryDays * DAY)}` : `ภายใน ${d.deliveryDays} วันหลังชำระ`],
      ['ผู้ซื้อตรวจรับสินค้า', d.shipment && st === 'shipped' ? `เหลือ ${Math.max(0, daysLeft(d.shipment.ts + d.inspectionDays * DAY))} วัน (ไม่ตอบ = ยืนยันอัตโนมัติ)` : `ตรวจได้ ${d.inspectionDays} วัน`],
      [st === 'resolved' ? 'ปิดดีลตามคำตัดสิน' : 'ปล่อยเงินให้ผู้ขาย', d.payout ? fmtDate(d.payout.ts) : ''],
    ];
    if (st === 'cancelled') return `<div class="vault gray">${I.alert}<div>ดีลนี้ถูกยกเลิกก่อนชำระเงิน ไม่มีเงินค้างในระบบ</div></div>`;
    return `<ol class="timeline">${steps.map(([t, sub], i) => {
      let cls = i < idx || st === 'completed' || st === 'resolved' ? 'done' : i === idx ? 'current' : '';
      if (st === 'disputed' && i === 3) cls = 'alert';
      if (st === 'pending' && i === 0) cls = 'current';
      const dot = cls === 'done' ? I.check : cls === 'alert' ? '!' : i + 1;
      return `<li class="${cls}"><span class="dot">${dot}</span><div><div class="t">${st === 'disputed' && i === 3 ? 'เปิดข้อพิพาท · เงินถูกระงับ' : t}</div>${sub ? `<div class="tiny">${esc(sub)}</div>` : ''}</div></li>`;
    }).join('')}</ol>`;
  }

  function vaultHtml(d) {
    const m = money(d);
    switch (d.status) {
      case 'pending': return `<div class="vault gray">${I.doc}<div>ยังไม่มีการเก็บเงิน รอทั้งสองฝ่ายลงนามข้อตกลงก่อน</div></div>`;
      case 'awaiting_payment':
        if (d.paymentReview?.status === 'review') return `<div class="vault amber">${I.clock}<div>ได้รับสลิปแล้ว ทีมงานกำลังตรวจกับรายการเดินบัญชี${d.paymentReview.note ? ` · ${esc(d.paymentReview.note)}` : ''}</div></div>`;
        if (d.paymentReview?.status === 'rejected') return `<div class="vault red">${I.alert}<div>สลิปไม่ผ่านการตรวจสอบ: ${esc(d.paymentReview.note || '')} กรุณาชำระใหม่</div></div>`;
        return `<div class="vault amber">${I.wallet}<div>ข้อตกลงสมบูรณ์ รอผู้ซื้อโอน <b>${baht(m.buyerPays)}</b> เข้าบัญชีพักเงิน</div></div>`;
      case 'funded': case 'shipped': return `<div class="vault">${I.lock}<div><b>${baht(d.payment.amount)}</b> ถูกพักไว้อย่างปลอดภัย ผู้ขายจะได้รับ ${baht(m.sellerGets)} (หักค่าบริการ 3%) เมื่อผู้ซื้อยืนยันรับ</div></div>`;
      case 'disputed': return `<div class="vault red">${I.scale}<div>เงิน <b>${baht(d.payment.amount)}</b> ถูกระงับไว้จนกว่าจะได้ข้อยุติ ไม่มีฝ่ายใดถอนได้ · ค่าบริการกรณีพิพาท 5% (${baht(m.disputeFee)})</div></div>`;
      case 'completed': return `<div class="vault">${I.checkc}<div>ปล่อยเงิน <b>${baht(d.payout?.seller ?? m.sellerGets)}</b> ให้ผู้ขายแล้ว ดีลเสร็จสมบูรณ์</div></div>`;
      case 'resolved': return `<div class="vault">${I.gavel}<div>ตัดสินแล้ว: ผู้ซื้อได้คืน <b>${baht(d.payout.buyer)}</b> · ผู้ขายได้รับ <b>${baht(d.payout.seller)}</b></div></div>`;
      default: return '';
    }
  }

  function partiesHtml(d) {
    const p = (r) => `<div class="party">${avatar(roleName(d, r), r)}<div class="grow">
      <div class="role">${r === 'buyer' ? 'ผู้ซื้อ' : 'ผู้ขาย'}${role() === r ? ' · คุณ' : ''}</div>
      <div class="name">${esc(roleName(d, r))}${d.signatures[r] ? `<span class="verified" title="ยืนยันตัวตนด้วยบัตรประชาชนแล้ว">${I.id}</span>` : ''}</div>
      <div class="sig ${d.signatures[r] ? 'ok' : 'wait'}">${d.signatures[r] ? I.checkc + 'ลงนามแล้ว' : I.clock + 'รอลงนาม'}</div></div></div>`;
    return `<div class="parties">${p('buyer')}${p('seller')}</div>`;
  }

  function evidenceHtml(list) {
    if (!list || !list.length) return '';
    return `<div class="evidence">${list.map((e) => e.src
      ? `<div class="ev" style="background-image:url('${e.src}')" title="${esc(e.name)}"></div>`
      : `<div class="ev">${esc(e.name)}</div>`).join('')}</div>`;
  }

  function disputeHtml(d) {
    const ds = d.dispute; if (!ds) return '';
    const want = ds.want === 'refund_full' ? 'คืนเงินเต็มจำนวน' : ds.want === 'refund_partial' ? `คืนเงินบางส่วน ${baht(ds.amount)}` : ds.want === 'return' ? 'คืนสินค้าแล้วคืนเงิน' : 'ปล่อยเงินให้ผู้ขาย';
    const r = role();
    return `<section class="card stack" style="border:1.5px solid var(--red-soft)">
      <div class="row between"><h2>ข้อพิพาท</h2>${ds.decision ? '<span class="pill teal">ตัดสินแล้ว</span>' : '<span class="pill red">กำลังพิจารณา</span>'}</div>
      <div>
        <div class="tiny">เปิดโดย${ds.by === 'buyer' ? 'ผู้ซื้อ' : 'ผู้ขาย'} · ${fmtDate(ds.ts)}</div>
        <h3>${DISPUTE_REASONS[ds.reason]}</h3>
        <p class="small" style="margin-top:4px">${esc(ds.detail)}</p>
        <p class="small muted" style="margin-top:6px">ข้อเรียกร้อง: <b>${want}</b></p>
        ${evidenceHtml(ds.evidence) ? `<div style="margin-top:8px">${evidenceHtml(ds.evidence)}</div>` : ''}
      </div>
      <div class="divider" style="margin:0"></div>
      ${ds.response ? `<div>
          <div class="tiny">คำชี้แจงจาก${ds.by === 'buyer' ? 'ผู้ขาย' : 'ผู้ซื้อ'} · ${fmtDate(ds.response.ts)}</div>
          <p class="small" style="margin-top:4px">${esc(ds.response.text)}</p>
          ${evidenceHtml(ds.response.evidence) ? `<div style="margin-top:8px">${evidenceHtml(ds.response.evidence)}</div>` : ''}
        </div>` : `<div class="vault amber">${I.clock}<div>รอคำชี้แจงจาก${ds.by === 'buyer' ? 'ผู้ขาย' : 'ผู้ซื้อ'} ภายใน ${Math.max(0, daysLeft(ds.ts + 3 * DAY))} วัน หากไม่ชี้แจง ผู้ไกล่เกลี่ยจะพิจารณาจากหลักฐานที่มี</div></div>`}
      ${ds.decision ? `<div class="divider" style="margin:0"></div><div>
          <div class="tiny">คำตัดสินผู้ไกล่เกลี่ย · ${fmtDate(ds.decision.ts)}</div>
          <p class="small" style="margin-top:4px">${esc(ds.decision.reason)}</p>
          <div class="kv" style="margin-top:8px"><dt>คืนผู้ซื้อ</dt><dd class="num">${baht(ds.decision.buyer)}</dd><dt>โอนผู้ขาย</dt><dd class="num">${baht(ds.decision.seller)}</dd></div>
        </div>` : ''}
      ${!ds.decision && r !== 'admin' && ds.by !== r && !ds.response ? `<button class="btn btn-navy btn-block" data-action="respond" data-id="${d.id}">ส่งคำชี้แจงและหลักฐาน</button>` : ''}
      ${!ds.decision && r !== 'admin' && ds.by !== r ? `<button class="btn btn-ghost btn-block" data-action="accept-claim" data-id="${d.id}">ยอมรับข้อเรียกร้อง (ยุติโดยตกลงกันเอง)</button>` : ''}
      ${!ds.decision && r === 'admin' ? `<button class="btn btn-primary btn-block" data-action="decide" data-id="${d.id}">${I.gavel}พิจารณาและตัดสิน</button>` : ''}
    </section>`;
  }

  function chatHtml(d) {
    const r = role();
    return `<section class="card">
      <h2 style="margin-bottom:8px">ข้อความในดีล</h2>
      <p class="tiny" style="margin-bottom:8px">ทุกข้อความถูกบันทึกเป็นหลักฐาน ใช้ประกอบการพิจารณาหากมีข้อพิพาท</p>
      <div class="chat" id="chat">${d.messages.length ? d.messages.map((m) => {
        const cls = m.who === 'admin' ? 'admin' : m.who === r ? 'me' : 'them';
        return `<div class="bubble ${cls}"><div class="who">${esc(roleName(d, m.who))} · ${fmtDate(m.ts)}</div>${esc(m.text)}</div>`;
      }).join('') : '<p class="tiny" style="text-align:center">ยังไม่มีข้อความ</p>'}</div>
      ${['completed', 'cancelled', 'resolved'].includes(d.status) ? '' : `<form class="chat-input" data-form="chat" data-id="${d.id}">
        <input class="input" name="text" placeholder="พิมพ์ข้อความ…" autocomplete="off" />
        <button class="icon-btn" style="background:var(--black);color:#fff;border:0" aria-label="ส่ง">${I.send}</button>
      </form>`}
    </section>`;
  }

  function actionsHtml(d) {
    const r = role();
    const b = [];
    if (r === 'admin') {
      if (d.status === 'disputed') b.push(`<button class="btn btn-primary btn-block" data-action="decide" data-id="${d.id}">${I.gavel}พิจารณาและตัดสิน</button>`);
      return b;
    }
    switch (d.status) {
      case 'pending':
        if (!d.signatures[r]) b.push(`<a class="btn btn-primary btn-block" href="#/deal/${d.id}/contract">${I.doc}อ่านและลงนามข้อตกลง</a>`);
        else b.push(`<button class="btn btn-navy btn-block" data-action="share" data-id="${d.id}">${I.share}ส่งรหัสดีลให้${r === 'buyer' ? 'ผู้ขาย' : 'ผู้ซื้อ'}</button>`);
        if (!d.prospective) b.push(`<button class="btn-link" data-action="cancel" data-id="${d.id}">ยกเลิกดีล</button>`);
        break;
      case 'awaiting_payment':
        if (r === 'buyer' && d.paymentReview?.status !== 'review') b.push(`<button class="btn btn-primary btn-block" data-action="pay" data-id="${d.id}">${I.lock}ชำระ ${baht(money(d).buyerPays)} ผ่าน PromptPay</button>`);
        b.push(`<button class="btn-link" data-action="cancel" data-id="${d.id}">ยกเลิกดีล</button>`);
        break;
      case 'funded':
        if (r === 'seller') b.push(`<button class="btn btn-primary btn-block" data-action="ship" data-id="${d.id}">${I.truck}แจ้งจัดส่ง / ส่งมอบงาน</button>`);
        else b.push(`<a class="btn-link" href="#/deal/${d.id}/dispute">ไม่ได้รับสินค้าตามกำหนด? เปิดข้อพิพาท</a>`);
        break;
      case 'shipped':
        if (r === 'buyer') {
          b.push(`<button class="btn btn-primary btn-block" data-action="confirm" data-id="${d.id}">${I.checkc}ได้รับสินค้าครบ ยืนยันปล่อยเงิน</button>`);
          b.push(`<a class="btn-link danger" href="#/deal/${d.id}/dispute">${I.alert}สินค้ามีปัญหา? เปิดข้อพิพาท</a>`);
        } else {
          b.push(`<a class="btn-link" href="#/deal/${d.id}/dispute">ผู้ซื้อได้รับแล้วแต่ไม่ยืนยัน? เปิดข้อพิพาท</a>`);
        }
        break;
    }
    return b;
  }

  // Independent check the user can see: escrow balance from the ledger + audit hash chain.
  async function loadLedger(d) {
    try {
      const l = await api('GET', `/api/deals/${encodeURIComponent(d.id)}/ledger`);
      const box = $('#ledgerBox'); if (!box || !current || current.id !== d.id) return;
      const label = { deposit: 'รับเงินเข้าบัญชีพัก', release: 'โอนให้ผู้ขาย', refund: 'คืนผู้ซื้อ', fee: 'ค่าบริการ' };
      box.innerHTML = `
        <div class="audit-ok ${l.audit.ok ? '' : 'bad'}">${l.audit.ok ? I.shield : I.alert}<span>${l.audit.ok
          ? `บันทึกครบ ${l.audit.count} รายการ ไม่ถูกแก้ไข (ตรวจ hash chain แล้ว)` : 'ตรวจพบบันทึกถูกแก้ไข โปรดติดต่อทีมงาน'}</span></div>
        ${l.entries.length ? `<dl class="kv small">${l.entries.map((e) => `<dt>${label[e.type]}</dt><dd class="num">${e.type === 'deposit' ? '+' : '−'}${baht(e.amount)}</dd>`).join('')}
          <dt><b>คงเหลือในบัญชีพัก</b></dt><dd class="num"><b>${baht(l.balance)}</b></dd></dl>` : ''}
        ${l.payouts.length ? `<div class="payouts">${l.payouts.map((p) => `<div class="payout">${I.bank}<div class="grow">
          <div class="small"><b>${p.kind === 'release' ? 'โอนให้ผู้ขาย' : 'คืนผู้ซื้อ'} ${baht(p.amount)}</b> · ${p.status === 'sent' ? 'โอนแล้ว' : 'อยู่ในคิวโอน'}</div>
          <div class="tiny">${esc(state.banks[p.bankCode] || p.bankCode)} ${esc(p.accountNo)} · ${esc(p.accountName)} (ชื่อตรงกับบัตรประชาชน)</div></div></div>`).join('')}</div>` : ''}`;
    } catch (e) { /* non-critical */ }
  }

  function viewDeal(d) {
    const m = money(d);
    const acts = actionsHtml(d);
    const na = nextAction(d, role());
    render(`<div class="stack">
      <a class="back" href="#/deals">${I.back}ดีลทั้งหมด</a>
      <section class="card deal-head">
        <div class="row between"><span class="code-chip">${I[CAT[d.category || 'goods'][1]]}${d.code}</span>${pill(d.status)}</div>
        <h1 class="deal-title">${esc(d.title)}</h1>
        <div class="big num">${baht(d.price)}</div>
        ${moneyFlowHtml(d)}
        <div class="flow-caption">${vaultHtml(d)}</div>
        ${na ? `<div class="next-line ${isMyTurn(d, role()) ? 'mine' : ''}">${isMyTurn(d, role()) ? I.alert : I.clock}<span>${isMyTurn(d, role()) ? '<b>ถึงตาคุณ</b> · ' : ''}${na}</span></div>` : ''}
      </section>

      <section class="card stack">${partiesHtml(d)}</section>

      <section class="card"><h2 style="margin-bottom:12px">ความคืบหน้า</h2>${timelineHtml(d)}</section>

      ${disputeHtml(d)}

      ${d.shipment ? `<section class="card stack"><h2>ข้อมูลการจัดส่ง</h2>
        <dl class="kv"><dt>ขนส่ง</dt><dd>${esc(d.shipment.carrier)}</dd><dt>เลขพัสดุ</dt><dd class="num">${esc(d.shipment.tracking || '-')}</dd>${d.shipment.note ? `<dt>หมายเหตุ</dt><dd>${esc(d.shipment.note)}</dd>` : ''}</dl>
        ${evidenceHtml(d.shipment.evidence)}</section>` : ''}

      <section class="card stack">
        <div class="row between"><h2>เงื่อนไขการรับสินค้า</h2><a class="small" href="#/deal/${d.id}/contract">ดูสัญญาเต็ม</a></div>
        <p class="small muted">${esc(d.description)}</p>
        <ul class="checklist">${d.conditions.map((c) => `<li>${I.checkc}<span>${esc(c)}</span></li>`).join('')}</ul>
        <div class="fee-box">
          ${feeLines(m, d.status === 'disputed' || (d.status === 'resolved' && d.dispute))}
        </div>
      </section>

      ${chatHtml(d)}

      <details class="card fold"><summary><h2>บันทึกเหตุการณ์</h2><span class="tiny">${d.events.length} รายการ · แก้ไขไม่ได้</span><span class="chev">${I.chev}</span></summary>
        <div id="ledgerBox" class="ledger-box"></div>
        <ul class="log" style="margin-top:12px">${[...d.events].reverse().map((e) => `<li class="${e.who}"><div><div>${esc(e.text)}</div><div class="tiny">${esc(roleName(d, e.who))} · ${fmtDate(e.ts)}</div></div></li>`).join('')}</ul>
      </details>
    </div>
    ${acts.length ? `<div class="sticky-cta"><div class="inner">${acts.join('')}</div></div>` : ''}`);
    const c = $('#chat'); if (c) c.scrollTop = c.scrollHeight;
    if (d.myRole && !d.prospective) loadLedger(d);
  }

  // ----- contract -----
  function viewContract(d) {
    const r = role();
    const m = money(d);
    const canSign = r !== 'admin' && d.status === 'pending' && !d.signatures[r];
    const ready = !!state.me?.canTransact;
    render(`<div class="stack">
      <a class="back" href="#/deal/${d.id}">${I.back}กลับไปที่ดีล</a>
      <section class="card contract stack">
        <div class="row between"><span class="tiny">${d.code}</span><span class="tiny">ฉบับดิจิทัล</span></div>
        <h1 style="font-size:1.2rem">ข้อตกลงซื้อขายผ่านตัวกลาง</h1>
        <p class="muted small">ระหว่าง <b>${esc(d.buyerName)}</b> (“ผู้ซื้อ”) และ <b>${esc(d.sellerName)}</b> (“ผู้ขาย”) โดยมี Middleman เป็นผู้ถือเงินและผู้ไกล่เกลี่ยกลาง</p>
        <ol>
          <li><b>สิ่งที่ซื้อขาย:</b> ${esc(d.title)} — ${esc(d.description)}</li>
          <li><b>ราคาและค่าบริการ:</b> ผู้ซื้อชำระ ${baht(m.buyerPays)} เต็มจำนวน ค่าบริการ 3% (${baht(m.fee)}) หักจากราคาก่อนโอนให้ผู้ขาย ผู้ขายได้รับสุทธิ ${baht(m.sellerGets)} หากมีการเปิดข้อพิพาท ค่าบริการเป็น 5% ของราคา (${baht(m.disputeFee)}) หักก่อนจัดสรรเงินส่วนที่เหลือตามข้อยุติ ยกเลิกก่อนชำระเงินไม่มีค่าใช้จ่าย</li>
          <li><b>ตัวตนของคู่สัญญา:</b> คู่สัญญาทั้งสองฝ่ายยืนยันตัวตนด้วยบัตรประจำตัวประชาชน และลงนามในชื่อตามบัตร เงินที่โอนออกจากระบบจะเข้าบัญชีธนาคารที่ชื่อบัญชีตรงกับชื่อบนบัตรของผู้รับเท่านั้น</li>
          <li><b>การพักเงิน:</b> ผู้ซื้อโอนเงินจากบัญชีของตนเองเข้าบัญชีพักเงินลูกค้าของแพลตฟอร์มซึ่งแยกจากบัญชีของบริษัท เงินนี้ไม่ถือเป็นรายได้ของแพลตฟอร์ม และจะไม่ถูกปล่อยให้ฝ่ายใดจนกว่าเงื่อนไขในข้อตกลงนี้จะครบถ้วน</li>
          <li><b>การส่งมอบ:</b> ผู้ขายต้องจัดส่งหรือส่งมอบภายใน ${d.deliveryDays} วันนับแต่วันที่ระบบยืนยันการชำระเงิน พร้อมหลักฐานการจัดส่ง</li>
          <li><b>เงื่อนไขการรับสินค้า:</b><ul style="margin:6px 0 0;padding-left:18px">${d.conditions.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></li>
          <li><b>การตรวจรับ:</b> ผู้ซื้อมีเวลา ${d.inspectionDays} วันนับแต่วันที่ผู้ขายแจ้งจัดส่ง เพื่อยืนยันรับหรือเปิดข้อพิพาท หากพ้นกำหนดโดยไม่ดำเนินการ ถือว่ายอมรับสินค้าและระบบจะปล่อยเงินให้ผู้ขาย</li>
          <li><b>ข้อพิพาท:</b> คู่สัญญาตกลงให้ Middleman เป็นผู้ไกล่เกลี่ยและชี้ขาดเกี่ยวกับการจัดสรรเงินที่พักไว้ โดยพิจารณาจากข้อตกลงนี้ เจตนาที่แท้จริงของคู่สัญญา หลักสุจริต และหลักฐานที่ปรากฏ ทั้งนี้ไม่ตัดสิทธิ์คู่สัญญาในการใช้สิทธิทางศาล</li>
          <li><b>หลักฐานอิเล็กทรอนิกส์:</b> การลงนาม ข้อความ และบันทึกเหตุการณ์ในระบบ ถือเป็นหลักฐานตาม พ.ร.บ.ว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544</li>
        </ol>
        <div class="seal">${I.shield}<div>รหัสยืนยันสัญญา<br/><b class="num">${contractHash(d)}</b><br/>หากข้อความในสัญญาถูกแก้ไข รหัสนี้จะเปลี่ยน</div></div>
        ${partiesHtml(d)}
      </section>
      ${canSign && !ready ? readinessHtml(true) : ''}
      ${canSign && ready ? `<section class="card stack">
        <label class="check"><input type="checkbox" id="agree1" />ฉันอ่านและเข้าใจเงื่อนไขทั้งหมดแล้ว</label>
        <label class="check"><input type="checkbox" id="agree2" />ฉันยอมรับให้ Middleman เป็นผู้ไกล่เกลี่ยและชี้ขาดหากเกิดข้อพิพาท</label>
        <div class="sign-as">${I.id}<div><div class="tiny">ลงนามในชื่อตามบัตรประชาชน</div><b>${esc(state.me.name)}</b></div></div>
      </section>` : ''}
    </div>
    ${canSign && ready ? `<div class="sticky-cta"><div class="inner"><button class="btn btn-primary btn-block" data-action="sign" data-id="${d.id}" id="signBtn" disabled>${I.doc}ลงนามข้อตกลง</button></div></div>` : ''}`);
    if (canSign && ready) {
      const upd = () => { $('#signBtn').disabled = !($('#agree1').checked && $('#agree2').checked); };
      ['#agree1', '#agree2'].forEach((s) => $(s).addEventListener('input', upd));
    }
  }

  // ----- create deal (3-step wizard) -----
  let draft = null;
  function freshDraft() {
    return { step: 1, myRole: 'buyer', category: 'goods', title: '', description: '', price: '',
      deliveryDays: 3, inspectionDays: 3, conditions: [''], counterName: '' };
  }
  function viewCreate() {
    if (role() === 'admin') {
      return render(`<div class="card empty">${I.user}<p>บัญชีผู้ไกล่เกลี่ยสร้างดีลไม่ได้</p></div>`);
    }
    if (!state.me.canTransact) return render(`<div class="stack-lg"><h1>สร้างดีลใหม่</h1>${readinessHtml(true)}</div>`);
    if (!draft) draft = freshDraft();
    const s = draft.step;
    const priceN = Number(draft.price) || 0;
    const m = money({ price: priceN });
    let body = '';
    if (s === 1) {
      body = `
        <div class="field"><label>คุณเป็นฝ่ายไหนในดีลนี้</label>
          <div class="choice-grid">
            <button type="button" class="choice ${draft.myRole === 'buyer' ? 'on' : ''}" data-action="d-set" data-k="myRole" data-v="buyer"><span class="cat-tile sm">${I.wallet}</span><strong>ฉันเป็นผู้ซื้อ</strong><span>ชำระเงิน แล้วรอรับของ</span></button>
            <button type="button" class="choice ${draft.myRole === 'seller' ? 'on' : ''}" data-action="d-set" data-k="myRole" data-v="seller"><span class="cat-tile sm">${I.box}</span><strong>ฉันเป็นผู้ขาย</strong><span>ส่งของ แล้วรับเงิน</span></button>
          </div></div>
        <div class="field"><label>ประเภท</label>
          <div class="choice-grid three">
            ${[['goods', 'สินค้า'], ['service', 'จ้างงาน'], ['digital', 'ดิจิทัล']].map(([k, l]) =>
              `<button type="button" class="choice center ${draft.category === k ? 'on' : ''}" data-action="d-set" data-k="category" data-v="${k}"><span class="cat-tile sm">${I[CAT[k][1]]}</span><strong>${l}</strong></button>`).join('')}
          </div></div>
        <div class="field"><label for="f-title">ชื่อสินค้า / งาน</label>
          <input class="input" id="f-title" data-d="title" value="${esc(draft.title)}" placeholder="เช่น iPhone 15 Pro 256GB มือสอง" /></div>
        <div class="field"><label for="f-desc">รายละเอียด</label>
          <textarea class="input" id="f-desc" data-d="description" placeholder="สภาพ รุ่น อุปกรณ์ที่ได้ ฯลฯ ยิ่งละเอียด ยิ่งลดข้อพิพาท">${esc(draft.description)}</textarea></div>`;
    } else if (s === 2) {
      body = `
        <div class="field"><label for="f-price">ราคาที่ตกลง</label>
          <div class="input-money"><span>฿</span><input class="input num" id="f-price" data-d="price" inputmode="decimal" value="${esc(draft.price)}" placeholder="0" /></div></div>
        <div class="field"><label>ค่าบริการ</label>
          <span class="hint">หักจากราคา ผู้ซื้อจ่ายเท่าราคาที่ตกลง ไม่มีค่าธรรมเนียมชำระเงินเพิ่ม</span>
          <div class="fee-box" id="feeBox">${feeLines(m)}</div></div>
        <div class="choice-grid">
          <div class="field"><label for="f-dd">ส่งภายใน (วัน)</label><input class="input" type="number" min="1" max="60" id="f-dd" data-d="deliveryDays" value="${draft.deliveryDays}" /></div>
          <div class="field"><label for="f-id">ตรวจรับได้ (วัน)</label><input class="input" type="number" min="1" max="30" id="f-id" data-d="inspectionDays" value="${draft.inspectionDays}" /></div>
        </div>
        <div class="field"><label>เงื่อนไขการรับสินค้า</label>
          <span class="hint">สิ่งที่ผู้ซื้อจะตรวจสอบ และผู้ไกล่เกลี่ยจะใช้ตัดสินหากมีข้อพิพาท</span>
          <div class="stack" style="gap:8px">${draft.conditions.map((c, i) => `<div class="cond-row">
            <input class="input" data-cond="${i}" value="${esc(c)}" placeholder="${['เช่น ใช้งานได้ปกติทุกฟังก์ชัน', 'เช่น ไม่มีรอยแตก', 'เช่น ได้อุปกรณ์ครบตามรูป'][i % 3]}" />
            ${draft.conditions.length > 1 ? `<button type="button" class="icon-btn" data-action="d-delcond" data-i="${i}" aria-label="ลบ">${I.trash}</button>` : ''}
          </div>`).join('')}</div>
          <button type="button" class="btn btn-ghost btn-sm" data-action="d-addcond">${I.plus}เพิ่มเงื่อนไข</button></div>`;
    } else {
      const cond = draft.conditions.filter((c) => c.trim());
      body = `
        <div class="field"><label for="f-cn">ชื่อ${draft.myRole === 'buyer' ? 'ผู้ขาย' : 'ผู้ซื้อ'}</label>
          <input class="input" id="f-cn" data-d="counterName" value="${esc(draft.counterName)}" placeholder="ชื่อที่ใช้ติดต่อกัน" />
          <span class="hint">อีกฝ่ายจะได้รับรหัสดีลเพื่อตรวจสอบและลงนาม ไม่ต้องมีร้านค้าหรือประวัติขายมาก่อน</span></div>
        <div class="card flat stack">
          <div class="row between"><h3>${esc(draft.title || '-')}</h3><span class="num" style="font-weight:700;color:var(--black)">${baht(priceN)}</span></div>
          <p class="small muted">${esc(draft.description || '')}</p>
          <dl class="kv"><dt>ส่งภายใน</dt><dd>${draft.deliveryDays} วันหลังชำระ</dd><dt>ระยะตรวจรับ</dt><dd>${draft.inspectionDays} วัน</dd><dt>ค่าบริการ 3%</dt><dd>${baht(m.fee)} (หักจากราคา)</dd><dt>ผู้ขายได้รับ</dt><dd class="num">${baht(m.sellerGets)}</dd></dl>
          <ul class="checklist">${cond.map((c) => `<li>${I.checkc}<span>${esc(c)}</span></li>`).join('')}</ul>
        </div>
        <label class="check"><input type="checkbox" id="f-agree" ${draft.agree ? 'checked' : ''}/>ฉันยืนยันว่าข้อมูลถูกต้องและลงนามข้อตกลงนี้ในฐานะ${draft.myRole === 'buyer' ? 'ผู้ซื้อ' : 'ผู้ขาย'}</label>`;
    }
    const titles = ['', 'สินค้าและบทบาท', 'ราคาและเงื่อนไข', 'ตรวจทานและลงนาม'];
    render(`<div class="stack-lg">
      <div class="stack" style="gap:8px">
        <div class="progress">${[1, 2, 3].map((i) => `<span class="${i <= s ? 'on' : ''}"></span>`).join('')}</div>
        <div class="tiny">ขั้นตอน ${s} จาก 3</div>
        <h1>${titles[s]}</h1>
      </div>
      <form class="stack-lg" data-form="create">${body}</form>
    </div>
    <div class="sticky-cta"><div class="inner" style="flex-direction:row">
      ${s > 1 ? `<button class="btn btn-ghost" data-action="d-prev" style="flex:0 0 auto">${I.back}</button>` : ''}
      <button class="btn btn-primary" style="flex:1" data-action="${s < 3 ? 'd-next' : 'd-create'}">${s < 3 ? 'ถัดไป' : 'สร้างดีลและรับรหัส'}</button>
    </div></div>`);
  }
  function feeLines(m, disputed) {
    return `<div class="line"><span>ผู้ซื้อชำระ (เท่าราคา)</span><span class="num">${baht(m.buyerPays)}</span></div>
      <div class="line ${disputed ? 'struck' : ''}"><span>ค่าบริการ 3% หักจากราคา</span><span class="num">−${baht(m.fee)}</span></div>
      ${disputed ? `<div class="line"><span>ค่าบริการกรณีพิพาท 5%</span><span class="num">−${baht(m.disputeFee)}</span></div>
      <div class="line total"><span>คงเหลือจัดสรรตามข้อยุติ</span><span class="num">${baht(m.disputePool)}</span></div>`
      : `<div class="line total"><span>ผู้ขายได้รับ</span><span class="num">${baht(m.sellerGets)}</span></div>
      <div class="tiny" style="margin-top:6px">หากมีข้อพิพาท ค่าบริการเป็น 5% (${baht(m.disputeFee)})</div>`}`;
  }
  function validateStep() {
    if (draft.step === 1 && !draft.title.trim()) return 'กรุณาระบุชื่อสินค้า / งาน';
    if (draft.step === 2) {
      if (!(Number(draft.price) > 0)) return 'กรุณาระบุราคา';
      if (!draft.conditions.some((c) => c.trim())) return 'ระบุเงื่อนไขการรับสินค้าอย่างน้อย 1 ข้อ';
    }
    if (draft.step === 3) {
      if (!draft.counterName.trim()) return 'กรุณาระบุชื่ออีกฝ่าย';
      if (!draft.agree) return 'กรุณายืนยันและลงนามข้อตกลง';
    }
    return null;
  }

  // ----- open dispute -----
  let disputeDraft = null;
  function viewOpenDispute(d) {
    const r = role();
    if (r === 'admin' || !['funded', 'shipped'].includes(d.status)) { go('/deal/' + d.id); return; }
    if (!disputeDraft || disputeDraft.id !== d.id) {
      disputeDraft = { id: d.id, reason: r === 'seller' ? 'buyer_silent' : d.status === 'funded' ? 'not_received' : 'not_as_described', detail: '', want: r === 'seller' ? 'release' : 'refund_full', amount: '', evidence: [], agree: false };
    }
    const dd = disputeDraft;
    const reasons = r === 'seller' ? ['buyer_silent', 'other'] : ['not_received', 'not_as_described', 'damaged', 'other'];
    const wants = r === 'seller' ? [['release', 'ปล่อยเงินให้ผู้ขาย']] : [['refund_full', 'คืนเงินเต็มจำนวน'], ['refund_partial', 'คืนเงินบางส่วน'], ['return', 'คืนสินค้าแล้วรับเงินคืน']];
    render(`<div class="stack-lg">
      <a class="back" href="#/deal/${d.id}">${I.back}กลับไปที่ดีล</a>
      <div class="stack" style="gap:6px"><h1>เปิดข้อพิพาท</h1><p class="muted small">${esc(d.code)} · ${esc(d.title)}</p></div>
      <div class="vault amber">${I.lock}<div>เมื่อเปิดข้อพิพาท เงิน ${baht(d.payment.amount)} จะถูกระงับทันที อีกฝ่ายมีเวลา 3 วันชี้แจง จากนั้นผู้ไกล่เกลี่ยจะตัดสินภายใน 5 วันทำการ</div></div>
      <div class="fee-box"><div class="line"><span>ค่าบริการกรณีพิพาท 5% ของราคา</span><span class="num">−${baht(money(d).disputeFee)}</span></div>
        <div class="line total"><span>เงินที่จัดสรรตามข้อยุติได้สูงสุด</span><span class="num">${baht(money(d).disputePool)}</span></div>
        <div class="tiny" style="margin-top:6px">ค่าบริการจะเพิ่มจาก 3% เป็น 5% ทันทีที่เปิดข้อพิพาท แม้ตกลงกันได้ภายหลัง</div></div>
      <div class="field"><label>สาเหตุ</label><div class="stack" style="gap:8px">
        ${reasons.map((k) => `<button type="button" class="choice ${dd.reason === k ? 'on' : ''}" data-action="ds-set" data-k="reason" data-v="${k}"><strong>${DISPUTE_REASONS[k]}</strong></button>`).join('')}
      </div></div>
      <div class="field"><label>สิ่งที่ไม่เป็นไปตามข้อตกลง</label>
        <span class="hint">อ้างอิงเงื่อนไขในสัญญา: ${d.conditions.map(esc).join(' · ')}</span>
        <textarea class="input" data-ds="detail" placeholder="อธิบายตามจริง เช่น ได้รับวันไหน พบปัญหาอะไร ต่างจากที่ตกลงอย่างไร">${esc(dd.detail)}</textarea></div>
      <div class="field"><label>สิ่งที่ต้องการ</label><div class="choice-grid ${wants.length === 3 ? 'three' : ''}">
        ${wants.map(([k, l]) => `<button type="button" class="choice ${dd.want === k ? 'on' : ''}" data-action="ds-set" data-k="want" data-v="${k}"><strong>${l}</strong></button>`).join('')}
      </div>
      ${dd.want === 'refund_partial' ? `<div class="input-money"><span>฿</span><input class="input num" inputmode="decimal" data-ds="amount" value="${esc(dd.amount)}" placeholder="จำนวนที่ขอคืน (ไม่เกิน ${baht(money(d).disputePool)})" /></div>` : ''}</div>
      <div class="field"><label>หลักฐาน</label>
        <span class="hint">รูปถ่าย คลิปแกะกล่อง แชท ใบเสร็จ — หลักฐานยิ่งชัด ยิ่งตัดสินได้เร็ว</span>
        <label class="upload"><input type="file" multiple accept="image/*,video/*,.pdf" data-upload="dispute" />แตะเพื่อแนบไฟล์</label>
        <div id="evList">${evidenceHtml(dd.evidence)}</div></div>
      <label class="check"><input type="checkbox" data-ds-check="agree" ${dd.agree ? 'checked' : ''}/>ข้อมูลและหลักฐานทั้งหมดเป็นความจริง และฉันยอมรับคำตัดสินของผู้ไกล่เกลี่ยตามข้อตกลง</label>
    </div>
    <div class="sticky-cta"><div class="inner"><button class="btn btn-danger btn-block" style="background:var(--red);color:#fff" data-action="ds-submit" data-id="${d.id}">${I.scale}ส่งเรื่องข้อพิพาท</button></div></div>`);
  }

  // ----- disputes tab -----
  function viewDisputes() {
    const r = role();
    const open = state.deals.filter((d) => d.status === 'disputed');
    const closed = state.deals.filter((d) => d.dispute && d.status === 'resolved');
    render(`<div class="stack-lg">
      <div class="stack" style="gap:6px"><h1>${r === 'admin' ? 'คิวพิจารณาข้อพิพาท' : 'ศูนย์ข้อพิพาท'}</h1>
        <p class="muted small">${r === 'admin' ? 'พิจารณาตามข้อตกลง เจตนาของคู่สัญญา หลักสุจริต และหลักฐาน' : 'เมื่อมีปัญหา เราเป็นคนกลางที่ตัดสินอย่างเป็นธรรม เงินจะถูกระงับไว้จนกว่าจะได้ข้อยุติ'}</p></div>
      <section class="stack"><h2>กำลังดำเนินการ (${open.length})</h2>
        ${open.length ? open.map((d) => disputeRow(d)).join('') : `<div class="card empty">${I.heart}<p>ไม่มีข้อพิพาทค้างอยู่</p></div>`}</section>
      ${closed.length ? `<section class="stack"><h2>ตัดสินแล้ว</h2>${closed.map((d) => disputeRow(d)).join('')}</section>` : ''}
      <section class="card stack"><h2>ขั้นตอนการระงับข้อพิพาท</h2>${disputeSteps()}</section>
    </div>`);
  }
  function disputeRow(d) {
    const ds = d.dispute;
    return `<a class="card deal-item" href="#/deal/${d.id}">
      <div class="tiny">${d.code} · เปิดโดย${ds.by === 'buyer' ? 'ผู้ซื้อ' : 'ผู้ขาย'} · ${fmtDate(ds.ts)}</div>
      <div class="title">${esc(d.title)}</div>
      <div class="small muted">${DISPUTE_REASONS[ds.reason]}</div>
      <div class="meta"><span class="amount num">${baht(d.payment.amount)}</span>
      ${ds.decision ? '<span class="pill teal">ตัดสินแล้ว</span>' : ds.response ? '<span class="pill amber">พร้อมพิจารณา</span>' : '<span class="pill gray">รอคำชี้แจง</span>'}</div>
    </a>`;
  }
  function disputeSteps() {
    const s = [
      ['1', 'เปิดเรื่องพร้อมหลักฐาน', 'ภายในระยะตรวจรับ เงินถูกระงับทันที'],
      ['2', 'อีกฝ่ายชี้แจงภายใน 3 วัน', 'ทั้งสองฝ่ายยังคุยกันได้ และยุติเองได้ทุกเมื่อ'],
      ['3', 'ผู้ไกล่เกลี่ยพิจารณา', 'ยึดสัญญา เจตนาที่แท้จริง หลักสุจริต และหลักฐาน'],
      ['4', 'ตัดสินและโอนเงินตามคำตัดสิน', 'หักค่าบริการ 5% แล้วคืนผู้ซื้อ ปล่อยให้ผู้ขาย หรือแบ่งตามสัดส่วน'],
    ];
    return `<div class="steps">${s.map(([n, t, d]) => `<div class="step"><div class="n">${n}</div><div><h3>${t}</h3><p class="small muted">${d}</p></div></div>`).join('')}</div>`;
  }

  function viewHow() {
    const pr = [
      [I.doc, 'ยึดข้อตกลงเป็นหลัก', 'เงื่อนไขที่ทั้งสองฝ่ายลงนามคือสิ่งแรกที่ใช้ตัดสิน จึงควรระบุให้ชัดตั้งแต่ต้น'],
      [I.eye, 'ตีความตามเจตนาที่แท้จริง', 'หากข้อความกำกวม พิจารณาว่าคู่สัญญาตั้งใจอะไร ตามหลักการตีความสัญญาในประมวลกฎหมายแพ่งและพาณิชย์'],
      [I.heart, 'หลักสุจริต', 'ทุกฝ่ายต้องใช้สิทธิโดยสุจริต ผู้ที่ให้ข้อมูลเท็จหรือจงใจปกปิดจะเสียประโยชน์ในการพิจารณา'],
      [I.inbox, 'ตัดสินจากหลักฐาน', 'แชทในระบบ รูปถ่าย คลิปแกะกล่อง เลขพัสดุ และบันทึกเหตุการณ์ที่แก้ไขไม่ได้'],
      [I.scale, 'เป็นกลาง ไม่มีส่วนได้เสีย', 'ค่าบริการกรณีพิพาท 5% เท่ากันไม่ว่าผลจะออกทางใด ผู้ไกล่เกลี่ยไม่มีส่วนได้เสียกับคู่กรณี'],
    ];
    render(`<div class="stack-lg">
      <a class="back" href="#/">${I.back}${state.me ? 'หน้าหลัก' : 'กลับ'}</a>
      <h1>หลักการคุ้มครองของเรา</h1>
      <section class="card stack"><h2>ผู้ซื้อได้อะไร</h2><ul class="checklist">
        <li>${I.checkc}<span>เงินไม่ถึงมือผู้ขายจนกว่าคุณจะได้ของตามที่ตกลง</span></li>
        <li>${I.checkc}<span>มีเวลาตรวจสอบสินค้าก่อนยืนยัน</span></li>
        <li>${I.checkc}<span>ของไม่ตรงปก เปิดข้อพิพาทได้ เงินถูกระงับทันที</span></li></ul></section>
      <section class="card stack"><h2>ผู้ขายได้อะไร</h2><ul class="checklist">
        <li>${I.checkc}<span>ไม่ต้องมีร้านหรือรีวิว ผู้ซื้อก็กล้าซื้อ เพราะเงินอยู่กับคนกลาง</span></li>
        <li>${I.checkc}<span>เห็นว่าเงินเข้าบัญชีพักจริงก่อนส่งของ สลิปตรวจกับธนาคาร ใช้ซ้ำไม่ได้</span></li>
        <li>${I.checkc}<span>ผู้ซื้อทุกคนยืนยันตัวตนด้วยบัตรประชาชน รู้ว่ากำลังค้าขายกับใคร</span></li>
        <li>${I.checkc}<span>ผู้ซื้อเงียบ ระบบปล่อยเงินอัตโนมัติเมื่อพ้นระยะตรวจรับ</span></li></ul></section>
      <section class="card stack"><h2>หลักการตัดสินข้อพิพาท</h2><div class="principles">
        ${pr.map(([ic, t, d]) => `<div class="p"><div class="i">${ic}</div><div><h3>${t}</h3><p class="small muted">${d}</p></div></div>`).join('')}
      </div></section>
      <section class="card stack"><h2>ขั้นตอน</h2>${disputeSteps()}</section>
      <p class="tiny">คำตัดสินของผู้ไกล่เกลี่ยใช้เพื่อจัดสรรเงินที่พักไว้ในระบบ ไม่ตัดสิทธิ์คู่สัญญาในการดำเนินการทางศาล</p>
    </div>`);
  }

  // ----- identity & payout account readiness -----
  function readinessHtml(blocking) {
    const me = state.me;
    if (!me || me.isAdmin || me.canTransact) return '';
    const step = (done, icon, title, sub, href) => `<a class="ready-step ${done ? 'done' : ''}" ${href && !done ? `href="${href}"` : ''}>
      <span class="ri">${done ? I.check : icon}</span><span class="grow"><b>${title}</b><span class="tiny">${sub}</span></span>${href && !done ? `<span class="chev">${I.chev}</span>` : ''}</a>`;
    const kyc = me.kycStatus;
    return `<section class="card stack ready ${blocking ? 'blocking' : ''}">
      <div><h2>${blocking ? 'ก่อนทำรายการ' : 'เตรียมบัญชีให้พร้อม'}</h2>
      <p class="small muted">ทุกคนบน Middleman ยืนยันตัวตนจริง และรับเงินเข้าบัญชีชื่อตัวเองเท่านั้น</p></div>
      ${step(kyc === 'verified', I.id, 'ยืนยันตัวตนด้วยบัตรประชาชน', kyc === 'pending' ? 'ทีมงานกำลังตรวจรูปบัตร ปกติไม่เกิน 1 วันทำการ' : kyc === 'verified' ? 'เรียบร้อย' : 'ผ่าน ThaID หรือรูปบัตร', kyc === 'pending' ? null : '#/me')}
      ${step(!!me.bank, I.bank, 'เพิ่มบัญชีรับเงิน', 'ชื่อบัญชีต้องตรงกับชื่อบนบัตรประชาชน', kyc === 'verified' ? '#/me' : null)}
    </section>`;
  }

  function viewMe() {
    const me = state.me;
    if (me.isAdmin) return viewStaff();
    const k = KYC[me.kycStatus];
    render(`<div class="stack-lg">
      <h1>บัญชี</h1>
      <section class="card stack">
        <div class="row between"><h2>ตัวตน</h2><span class="pill ${k[1]}">${k[0]}</span></div>
        <div class="id-card">
          <div class="id-ico">${I.id}</div>
          <div class="grow"><div class="name">${esc(me.name)}</div>
            <div class="tiny num">เลขบัตร x-xxxx-xxxx${esc(me.idLast4[0])}-${esc(me.idLast4.slice(1, 3))}-${esc(me.idLast4[3])} · ${me.kycMethod === 'thaid' ? 'ยืนยันผ่าน ThaID' : 'ยืนยันด้วยรูปบัตร'}</div></div>
        </div>
        ${me.kycStatus === 'pending' ? `<div class="vault amber">${I.clock}<div>ทีมงานกำลังเทียบรูปบัตรกับรูปถ่ายของคุณ ระหว่างนี้ดูดีลได้แต่ยังทำรายการไม่ได้ หากมีแอป ThaID เข้าสู่ระบบด้วย ThaID เพื่อยืนยันทันที</div></div>` : ''}
        <p class="tiny">1 คนมีได้ 1 บัญชี เราเก็บเฉพาะรหัสตรวจสอบของเลขบัตร ไม่เก็บเลขบัตรเต็ม</p>
      </section>
      <section class="card stack">
        <div class="row between"><h2>บัญชีรับเงิน</h2>${me.bank ? '<span class="pill teal">ชื่อตรงกับบัตร</span>' : ''}</div>
        ${me.bank ? `<div class="id-card"><div class="id-ico">${I.bank}</div><div class="grow">
            <div class="name">${esc(me.bank.bankName)} ${esc(me.bank.accountNo)}</div><div class="tiny">${esc(me.bank.accountName)}</div></div></div>
          <button class="btn btn-ghost btn-block btn-sm" data-action="bank">เปลี่ยนบัญชีรับเงิน</button>`
        : `<p class="small muted">เงินที่ได้รับจากการขาย หรือเงินคืนจากข้อพิพาท จะโอนเข้าบัญชีนี้เท่านั้น ชื่อบัญชีต้องเป็น <b>${esc(me.name)}</b></p>
          <button class="btn btn-primary btn-block" data-action="bank" ${me.kycStatus !== 'verified' ? 'disabled' : ''}>${I.bank}เพิ่มบัญชีรับเงิน</button>`}
      </section>
      ${state.demo ? demoSwitchHtml() : ''}
      <a class="btn btn-ghost btn-block" href="#/how">หลักการคุ้มครองและการตัดสินข้อพิพาท</a>
      <button class="btn-link" data-action="logout">${I.logout}ออกจากระบบ</button>
    </div>`);
    if (state.demo) loadDemoUsers();
  }

  function demoSwitchHtml() {
    return `<section class="card stack demo-box"><h2>สลับบัญชี (โหมดสาธิต)</h2>
      <p class="small muted">บัญชีตัวอย่างที่ยืนยันตัวตนแล้ว ใช้ดูการทำงานจากฝั่งผู้ซื้อ ผู้ขาย และผู้ไกล่เกลี่ย</p>
      <div class="stack" style="gap:8px" id="demoUsers"></div></section>`;
  }
  async function loadDemoUsers() {
    try {
      const { users } = await api('GET', '/api/demo/users');
      const box = $('#demoUsers'); if (!box) return;
      box.innerHTML = users.map((u) => `<button class="choice ${state.me?.id === u.id ? 'on' : ''}" data-action="demo-login" data-v="${esc(u.id)}">
        <strong>${esc(u.name)}</strong><span>${u.isAdmin ? 'ผู้ไกล่เกลี่ย · ตรวจตัวตน สลิป และตัดสินข้อพิพาท' : u.id === 'u_nat' ? 'ส่วนใหญ่เป็นผู้ซื้อ' : u.id === 'u_mali' ? 'ส่วนใหญ่เป็นผู้ขาย' : 'สมาชิก'}</span></button>`).join('');
    } catch (e) { /* demo only */ }
  }

  // ----- staff: KYC and slip review queues -----
  async function viewStaff() {
    render(`<div class="stack-lg"><h1>งานของทีม</h1><div id="staffQ" class="stack-lg"><div class="card empty"><p>กำลังโหลด…</p></div></div>
      ${state.demo ? demoSwitchHtml() : ''}
      <button class="btn-link" data-action="logout">${I.logout}ออกจากระบบ</button></div>`);
    if (state.demo) loadDemoUsers();
    try {
      const [kyc, pay] = await Promise.all([api('GET', '/api/admin/kyc'), api('GET', '/api/admin/payments')]);
      const box = $('#staffQ'); if (!box) return;
      box.innerHTML = `
        <section class="stack"><h2>ตรวจสอบตัวตนจากรูปบัตร (${kyc.queue.length})</h2>
          ${kyc.queue.length ? kyc.queue.map((k) => `<div class="card stack">
            <div class="row between"><b>${esc(k.name)}</b><span class="tiny">${fmtDate(k.submittedAt)}</span></div>
            <div class="tiny num">เลขบัตรลงท้าย ${esc(k.idLast4)}</div>
            <div class="kyc-photos"><figure><img src="${k.cardImage}" alt="รูปบัตรประชาชน" /><figcaption>บัตรประชาชน</figcaption></figure>
              <figure><img src="${k.selfieImage}" alt="รูปถ่ายคู่บัตร" /><figcaption>รูปถ่ายคู่บัตร</figcaption></figure></div>
            <label class="check small"><input type="checkbox" data-kyc-check="${esc(k.userId)}" />ชื่อ-นามสกุลและเลขบัตรตรงกับรูปบัตร ใบหน้าตรงกับรูปบนบัตร บัตรไม่มีร่องรอยปลอมแปลง</label>
            <div class="row" style="gap:8px"><button class="btn btn-primary" style="flex:1" data-action="kyc-approve" data-v="${esc(k.userId)}">อนุมัติ</button>
              <button class="btn btn-ghost" style="flex:1" data-action="kyc-reject" data-v="${esc(k.userId)}">ไม่อนุมัติ</button></div>
          </div>`).join('') : `<div class="card empty">${I.checkc}<p>ไม่มีคำขอค้าง</p></div>`}</section>
        <section class="stack"><h2>สลิปที่ระบบจับคู่อัตโนมัติไม่ได้ (${pay.queue.length})</h2>
          ${pay.queue.length ? pay.queue.map((p) => `<div class="card stack">
            <div class="row between"><b>${esc(p.code)} · ${baht(p.amount)}</b><span class="tiny">${fmtDate(p.ts)}</span></div>
            <div class="small">${esc(p.title)} · ผู้ซื้อ ${esc(p.buyerName)}</div>
            <dl class="kv small"><dt>อ้างอิงสลิป</dt><dd class="num">${esc(p.transRef)}</dd>
              <dt>ธนาคารยืนยัน</dt><dd>${p.bank ? `${baht(p.bank.amount / 100)} จาก ${esc(p.bank.senderName)}` : 'ไม่พบรายการ'}</dd></dl>
            ${p.note ? `<div class="vault amber">${I.alert}<div>${esc(p.note)}</div></div>` : ''}
            ${p.slipImage ? `<img class="slip-img" src="${p.slipImage}" alt="สลิป" />` : ''}
            <label class="check small"><input type="checkbox" data-pay-check="${esc(p.id)}" />พบยอดเงินเข้าในรายการเดินบัญชีพักเงิน และยืนยันได้ว่าผู้ซื้อเป็นผู้โอน</label>
            <div class="row" style="gap:8px"><button class="btn btn-primary" style="flex:1" data-action="pay-approve" data-v="${esc(p.id)}">รับยอด</button>
              <button class="btn btn-ghost" style="flex:1" data-action="pay-reject" data-v="${esc(p.id)}">ไม่รับ</button></div>
          </div>`).join('') : `<div class="card empty">${I.checkc}<p>ไม่มีสลิปค้างตรวจ</p></div>`}</section>`;
    } catch (e) { toast(e.message); }
  }

  // ----- sign in: national ID card only (ThaID, or card photo + PIN) -----
  // Public demo: nobody should type a real ID number or upload a real card here.
  const demoWarn = () => state.demo ? `<p class="demo-warn">${I.shield}<span><b>เว็บสาธิต</b> ข้อมูลทั้งหมดเป็นตัวอย่าง ห้ามกรอกเลขบัตรหรืออัปโหลดรูปบัตรประชาชนจริง และไม่มีการรับ-จ่ายเงินจริง</span></p>` : '';

  function viewLogin() {
    render(`<div class="stack-lg login">
      <section class="login-hero">
        <img src="logo.svg" alt="" width="72" height="72" />
        <h1>ซื้อขายกับคนแปลกหน้า<br/>อย่างสบายใจ</h1>
        <p class="small muted">ทุกบัญชีบน Middleman ยืนยันตัวตนด้วยบัตรประชาชน 1 คนมีได้ 1 บัญชี</p>
      </section>
      ${demoWarn()}
      <section class="stack">
        <button class="btn btn-primary btn-block btn-lg" data-action="thaid-start">${I.shield}เข้าสู่ระบบด้วย ThaID</button>
        <p class="tiny" style="text-align:center">ยืนยันตัวตนทันทีผ่านแอป ThaID ของกรมการปกครอง</p>
      </section>
      <div class="or"><span>หรือ</span></div>
      <section class="stack">
        <a class="btn btn-ghost btn-block" href="#/idcard">${I.camera}สมัครด้วยรูปบัตรประชาชน</a>
        <a class="btn btn-ghost btn-block" href="#/pin">เข้าสู่ระบบด้วยเลขบัตร + PIN</a>
        <p class="tiny" style="text-align:center">สำหรับผู้ที่ไม่มีแอป ThaID · ทีมงานตรวจรูปบัตรภายใน 1 วันทำการ</p>
      </section>
      <a class="link-row" href="#/how">หลักการคุ้มครองผู้ซื้อและผู้ขาย<span class="chev">${I.chev}</span></a>
      ${state.demo ? `<section class="card stack demo-box"><h2>โหมดสาธิต</h2><p class="small muted">ข้ามขั้นตอนยืนยันตัวตนด้วยบัญชีตัวอย่าง</p><div class="stack" style="gap:8px" id="demoUsers"></div></section>` : ''}
    </div>`);
    if (state.demo) loadDemoUsers();
  }

  // Stand-in for the ThaID consent screen. In production this is DOPA's own page/app.
  function viewThaid() {
    const st = new URLSearchParams(location.hash.split('?')[1] || '').get('state');
    if (!st) return go('/login');
    render(`<div class="stack-lg">
      <a class="back" href="#/login">${I.back}ยกเลิก</a>
      <div class="vault gray">${I.alert}<div><b>หน้าจำลอง (โหมดสาธิต)</b> ของจริงจะเปิดแอป ThaID เพื่อสแกนใบหน้าและยินยอมส่งข้อมูล ระบบนี้ได้รับเพียงเลขบัตร ชื่อ และนามสกุล</div></div>
      <form class="card stack" data-form="thaid" data-state="${esc(st)}">
        <h2>ข้อมูลที่ ThaID จะส่งให้ Middleman</h2>
        <div class="field"><label for="t-pid">เลขประจำตัวประชาชน</label><input class="input num" id="t-pid" name="pid" inputmode="numeric" maxlength="17" placeholder="x-xxxx-xxxxx-xx-x" required /></div>
        <div class="choice-grid"><div class="field"><label for="t-fn">ชื่อ</label><input class="input" id="t-fn" name="firstName" required /></div>
          <div class="field"><label for="t-ln">นามสกุล</label><input class="input" id="t-ln" name="lastName" required /></div></div>
        <button class="btn btn-ghost btn-sm" type="button" data-action="thaid-fill">สุ่มข้อมูลทดสอบ</button>
        <button class="btn btn-primary btn-block" type="submit">ยินยอมและยืนยันตัวตน</button>
      </form>
    </div>`);
  }

  let idDraft = { cardImage: null, selfieImage: null };
  function viewIdCard() {
    render(`<div class="stack-lg">
      <a class="back" href="#/login">${I.back}กลับ</a>
      <div class="stack" style="gap:6px"><h1>สมัครด้วยรูปบัตรประชาชน</h1>
        <p class="small muted">ทีมงานจะเทียบรูปบัตรกับรูปถ่ายของคุณ ระหว่างรอตรวจสอบจะยังทำรายการไม่ได้</p></div>
      ${demoWarn()}
      <form class="stack-lg" data-form="idcard">
        <div class="field"><label for="i-pid">เลขประจำตัวประชาชน 13 หลัก</label>
          <input class="input num" id="i-pid" name="nationalId" inputmode="numeric" maxlength="17" autocomplete="off" required />
          <span class="hint" id="pidHint">1 เลขบัตรสมัครได้ 1 บัญชี</span></div>
        <div class="choice-grid"><div class="field"><label for="i-fn">ชื่อ (ตามบัตร)</label><input class="input" id="i-fn" name="firstName" required /></div>
          <div class="field"><label for="i-ln">นามสกุล</label><input class="input" id="i-ln" name="lastName" required /></div></div>
        <div class="field"><label>รูปบัตรประชาชน (ด้านหน้า)</label><span class="hint">ถ่ายให้เห็นตัวอักษรชัด ไม่มีแสงสะท้อน</span>
          <label class="upload photo" id="cardBox"><input type="file" accept="image/*" capture="environment" data-photo="cardImage" />${idDraft.cardImage ? `<img src="${idDraft.cardImage}" alt="" />` : `${I.camera}<span>ถ่ายรูปบัตร</span>`}</label></div>
        <div class="field"><label>รูปถ่ายตัวเองคู่กับบัตร</label><span class="hint">ถือบัตรไว้ใต้คาง เห็นใบหน้าและบัตรชัดเจน</span>
          <label class="upload photo" id="selfieBox"><input type="file" accept="image/*" capture="user" data-photo="selfieImage" />${idDraft.selfieImage ? `<img src="${idDraft.selfieImage}" alt="" />` : `${I.camera}<span>ถ่ายรูปคู่บัตร</span>`}</label></div>
        <div class="choice-grid"><div class="field"><label for="i-pin">ตั้ง PIN 6 หลัก</label><input class="input num" id="i-pin" name="pin" type="password" inputmode="numeric" maxlength="6" autocomplete="new-password" required /></div>
          <div class="field"><label for="i-pin2">ยืนยัน PIN</label><input class="input num" id="i-pin2" name="pin2" type="password" inputmode="numeric" maxlength="6" autocomplete="new-password" required /></div></div>
        <span class="hint" style="margin-top:-12px">ใช้เข้าสู่ระบบครั้งต่อไปคู่กับเลขบัตร</span>
        <label class="check"><input type="checkbox" name="consent" />ยินยอมให้ Middleman เก็บและใช้ข้อมูลบัตรประชาชนและรูปถ่าย เพื่อยืนยันตัวตนและป้องกันการฉ้อโกงตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล</label>
        <button class="btn btn-primary btn-block" type="submit">ส่งข้อมูลยืนยันตัวตน</button>
      </form>
    </div>`);
  }

  function viewPin() {
    render(`<div class="stack-lg">
      <a class="back" href="#/login">${I.back}กลับ</a>
      <h1>เข้าสู่ระบบด้วยเลขบัตร</h1>
      <form class="card stack" data-form="pin">
        <div class="field"><label for="p-pid">เลขประจำตัวประชาชน</label><input class="input num" id="p-pid" name="nationalId" inputmode="numeric" maxlength="17" autocomplete="username" required /></div>
        <div class="field"><label for="p-pin">PIN 6 หลัก</label><input class="input num" id="p-pin" name="pin" type="password" inputmode="numeric" maxlength="6" autocomplete="current-password" required /></div>
        <button class="btn btn-primary btn-block" type="submit">เข้าสู่ระบบ</button>
      </form>
      <p class="tiny" style="text-align:center">ลืม PIN? เข้าสู่ระบบด้วย ThaID ได้ทันทีด้วยบัญชีเดิม</p>
    </div>`);
  }

  // Thai national ID: 13 digits with a mod-11 check digit (mirrors the server).
  function validPid(v) {
    const s = String(v || '').replace(/\D/g, '');
    if (!/^[1-8]\d{12}$/.test(s)) return false;
    let sum = 0; for (let i = 0; i < 12; i++) sum += Number(s[i]) * (13 - i);
    return (11 - (sum % 11)) % 10 === Number(s[12]);
  }
  function randomPid() {
    let d = String(1 + Math.floor(Math.random() * 8)); while (d.length < 12) d += Math.floor(Math.random() * 10);
    let sum = 0; for (let i = 0; i < 12; i++) sum += Number(d[i]) * (13 - i);
    return d + ((11 - (sum % 11)) % 10);
  }
  const fmtPid = (v) => { const s = String(v).replace(/\D/g, '').slice(0, 13); return [s.slice(0, 1), s.slice(1, 5), s.slice(5, 10), s.slice(10, 12), s.slice(12)].filter(Boolean).join('-'); };

  function sheetBank() {
    const me = state.me;
    openSheet(`<form class="stack" data-form="bank">
      <h2>บัญชีรับเงิน</h2>
      <div class="vault">${I.id}<div>ชื่อบัญชีต้องเป็น <b>${esc(me.name)}</b> ตามบัตรประชาชน ระบบตรวจชื่อกับธนาคารก่อนบันทึก</div></div>
      <div class="field"><label for="b-bank">ธนาคาร</label><select class="input" id="b-bank" name="bankCode" required>
        <option value="">เลือกธนาคาร</option>${Object.entries(state.banks).map(([k, v]) => `<option value="${k}" ${me.bank?.bankCode === k ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select></div>
      <div class="field"><label for="b-no">เลขบัญชี</label><input class="input num" id="b-no" name="accountNo" inputmode="numeric" required /></div>
      ${state.demo ? `<div class="field"><label for="b-name">ชื่อบัญชี (จำลองผลตรวจจากธนาคาร)</label><input class="input" id="b-name" name="accountName" value="${esc(me.name)}" /><span class="hint">ลองเปลี่ยนเป็นชื่ออื่นเพื่อดูว่าระบบปฏิเสธ</span></div>` : ''}
      <button class="btn btn-primary btn-block" type="submit">ตรวจสอบและบันทึก</button>
    </form>`);
  }

  function viewNotFound() {
    render(`<div class="card empty">${I.alert}<p>ไม่พบหน้านี้</p><a class="btn btn-ghost" style="margin-top:12px" href="#/">กลับหน้าหลัก</a></div>`);
  }

  // ---------- bottom sheet ----------
  function openSheet(html) {
    const s = $('#sheet');
    s.innerHTML = `<div class="grab"></div><div class="inner">${html}</div>`;
    s.hidden = false; $('#sheetBackdrop').hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeSheet() {
    $('#sheet').hidden = true; $('#sheetBackdrop').hidden = true; document.body.style.overflow = '';
  }
  $('#sheetBackdrop').addEventListener('click', closeSheet);

  // Payment without a gateway: PromptPay transfer straight into the escrow account,
  // then the buyer submits the slip and the server verifies it with the bank.
  let payIntent = null;
  let slipImage = null;
  function sheetPay(d) {
    const it = payIntent && payIntent.dealId === d.id ? payIntent : null;
    if (!it) {
      openSheet(`<div class="stack">
        <h2>ชำระเงินเข้าบัญชีพักเงิน</h2>
        <p class="small muted">โอนผ่าน PromptPay เข้าบัญชีพักเงินลูกค้าของ Middleman เงินจะยังไม่ถึงผู้ขายจนกว่าคุณจะยืนยันรับสินค้า</p>
        <div class="fee-box"><div class="line total" style="border:0;margin:0;padding:0"><span>ยอดโอน (เท่าราคาที่ตกลง)</span><span class="num">${baht(money(d).buyerPays)}</span></div>
          <div class="tiny" style="margin-top:4px">ไม่มีค่าธรรมเนียมชำระเงิน ค่าบริการหักจากฝั่งผู้ขาย</div></div>
        <div class="vault amber">${I.alert}<div>โอนจากบัญชีธนาคารที่เป็นชื่อ <b>${esc(state.me.name)}</b> เท่านั้น ถ้าโอนจากบัญชีคนอื่น ต้องรอทีมงานตรวจสอบ</div></div>
        <button class="btn btn-primary btn-block" data-action="pay-start" data-id="${d.id}">แสดง QR PromptPay</button>
      </div>`);
      return;
    }
    openSheet(`<form class="stack" data-form="slip" data-id="${d.id}">
      <h2>สแกนจ่ายด้วยแอปธนาคาร</h2>
      <div class="qr-wrap"><div class="qr-head">Thai QR · PromptPay</div><div class="qr">${window.QR.svg(it.qrPayload)}</div>
        <div class="qr-amt num">${baht(it.amount)}</div><div class="tiny">${esc(it.escrow.accountName)}</div><div class="tiny">${esc(it.escrow.bankName)} · อ้างอิงดีล ${esc(it.reference)}</div></div>
      <div class="field"><label>แนบสลิป</label>
        <label class="upload photo slip" id="slipBox"><input type="file" accept="image/*" data-photo="slip" />${slipImage ? `<img src="${slipImage}" alt="" />` : `${I.doc}<span>แตะเพื่อเลือกรูปสลิป</span>`}</label></div>
      <div class="field"><label for="s-ref">เลขที่อ้างอิงรายการ (บนสลิป)</label>
        <input class="input num" id="s-ref" name="transRef" autocapitalize="characters" autocomplete="off" placeholder="เช่น 016123456789ABCD1234" required />
        <span class="hint">ระบบตรวจยอด บัญชีผู้รับ และชื่อผู้โอนกับธนาคาร สลิปหนึ่งใบใช้ได้ครั้งเดียว</span></div>
      ${state.demo ? `<div class="demo-row"><button type="button" class="btn btn-ghost btn-sm" data-action="pay-demo" data-id="${d.id}">จำลอง: โอนจากบัญชีตัวเอง</button>
        <button type="button" class="btn btn-ghost btn-sm" data-action="pay-demo" data-other="1" data-id="${d.id}">จำลอง: โอนจากบัญชีคนอื่น</button></div>` : ''}
      <button class="btn btn-primary btn-block" type="submit">${I.lock}ส่งสลิปเพื่อยืนยันยอด</button>
    </form>`);
  }

  let shipEvidence = [];
  function sheetShip(d) {
    shipEvidence = [];
    openSheet(`<form class="stack" data-form="ship" data-id="${d.id}">
      <h2>แจ้งจัดส่ง / ส่งมอบงาน</h2>
      <div class="field"><label>วิธีจัดส่ง</label><select class="input" name="carrier">${CARRIERS.map((c) => `<option>${c}</option>`).join('')}</select></div>
      <div class="field"><label>เลขพัสดุ / ลิงก์ส่งงาน</label><input class="input" name="tracking" placeholder="เช่น KEX1234567890" /></div>
      <div class="field"><label>หมายเหตุ</label><input class="input" name="note" placeholder="ไม่บังคับ" /></div>
      <div class="field"><label>หลักฐานการส่ง</label><span class="hint">รูปพัสดุก่อนปิดกล่อง ใบเสร็จขนส่ง — ช่วยคุ้มครองคุณหากมีข้อพิพาท</span>
        <label class="upload"><input type="file" multiple accept="image/*,video/*" data-upload="ship" />แตะเพื่อแนบไฟล์</label><div id="shipEv"></div></div>
      <button class="btn btn-primary btn-block" type="submit">${I.truck}ยืนยันการจัดส่ง</button>
    </form>`);
  }

  function sheetConfirm(d) {
    openSheet(`<div class="stack">
      <h2>ตรวจสอบก่อนปล่อยเงิน</h2>
      <p class="small muted">ติ๊กทุกข้อเพื่อยืนยันว่าสินค้าตรงตามข้อตกลง เมื่อยืนยันแล้วจะปล่อยเงินให้ผู้ขายทันทีและยกเลิกไม่ได้</p>
      <div class="stack" style="gap:10px">${d.conditions.map((c, i) => `<label class="check"><input type="checkbox" data-cc="${i}" />${esc(c)}</label>`).join('')}</div>
      <button class="btn btn-primary btn-block" id="ccBtn" data-action="confirm-done" data-id="${d.id}" disabled>${I.checkc}ยืนยันรับและปล่อย ${baht(money(d).sellerGets)}</button>
      <a class="btn btn-ghost btn-block btn-sm" href="#/deal/${d.id}/dispute">ไม่ตรงตามข้อตกลง → เปิดข้อพิพาท</a>
    </div>`);
    const boxes = [...document.querySelectorAll('[data-cc]')];
    boxes.forEach((b) => b.addEventListener('change', () => { $('#ccBtn').disabled = !boxes.every((x) => x.checked); }));
  }

  let respEvidence = [];
  function sheetRespond(d) {
    respEvidence = [];
    openSheet(`<form class="stack" data-form="respond" data-id="${d.id}">
      <h2>ส่งคำชี้แจง</h2>
      <p class="small muted">อธิบายข้อเท็จจริงจากฝั่งคุณ ผู้ไกล่เกลี่ยจะพิจารณาเทียบกับข้อตกลงและหลักฐานของทั้งสองฝ่าย</p>
      <textarea class="input" name="text" required placeholder="เช่น ก่อนส่งได้ตรวจสอบแล้ว มีคลิปตอนแพ็ค…"></textarea>
      <label class="upload"><input type="file" multiple accept="image/*,video/*,.pdf" data-upload="respond" />แนบหลักฐาน</label><div id="respEv"></div>
      <button class="btn btn-navy btn-block" type="submit">${I.send}ส่งคำชี้แจง</button>
    </form>`);
  }

  function sheetDecide(d) {
    const total = d.payment.amount;
    openSheet(`<form class="stack" data-form="decide" data-id="${d.id}">
      <h2>คำตัดสินผู้ไกล่เกลี่ย</h2>
      <div class="fee-box"><div class="line"><span>เงินในบัญชีพัก</span><span class="num">${baht(total)}</span></div>
        <div class="line"><span>ค่าบริการกรณีพิพาท 5%</span><span class="num">−${baht(money(d).disputeFee)}</span></div>
        <div class="line total"><span>จัดสรรตามคำตัดสิน</span><span class="num">${baht(money(d).disputePool)}</span></div></div>
      <div class="card flat stack small">
        <b>ข้อพิจารณา</b>
        <label class="check"><input type="checkbox" required />ตรวจสอบเงื่อนไขในข้อตกลงที่เกี่ยวข้องแล้ว</label>
        <label class="check"><input type="checkbox" required />พิจารณาเจตนาที่แท้จริงของคู่สัญญาแล้ว</label>
        <label class="check"><input type="checkbox" required />ตรวจสอบหลักฐานและบันทึกในระบบของทั้งสองฝ่ายแล้ว</label>
      </div>
      <div class="field"><label>สัดส่วนการคืนเงินผู้ซื้อ</label>
        <input type="range" name="pct" min="0" max="100" step="5" value="50" id="pct" />
        <div class="split-bar"><div class="b" id="barB" style="width:50%"></div><div class="s" id="barS" style="width:50%"></div></div>
        <div class="row between small"><span>ผู้ซื้อได้คืน <b class="num" id="vB"></b></span><span>ผู้ขายได้รับ <b class="num" id="vS"></b></span></div>
        <div class="row" style="gap:6px;flex-wrap:wrap">
          <button type="button" class="btn btn-ghost btn-sm" data-pct="100">คืนผู้ซื้อทั้งหมด</button>
          <button type="button" class="btn btn-ghost btn-sm" data-pct="50">แบ่งครึ่ง</button>
          <button type="button" class="btn btn-ghost btn-sm" data-pct="0">ปล่อยผู้ขายทั้งหมด</button>
        </div></div>
      <div class="field"><label>เหตุผลประกอบคำตัดสิน</label>
        <textarea class="input" name="reason" required placeholder="อ้างอิงข้อตกลง เจตนา และหลักฐานที่ใช้"></textarea></div>
      <button class="btn btn-primary btn-block" type="submit">${I.gavel}ยืนยันคำตัดสิน</button>
    </form>`);
    const pct = $('#pct');
    const upd = () => {
      const p = Number(pct.value) / 100;
      const sp = pctSplit(total, Number(pct.value));
      $('#vB').textContent = baht(sp.buyer); $('#vS').textContent = baht(sp.seller);
      $('#barB').style.width = p * 100 + '%'; $('#barS').style.width = (1 - p) * 100 + '%';
    };
    pct.addEventListener('input', upd); upd();
    document.querySelectorAll('[data-pct]').forEach((b) => b.addEventListener('click', () => { pct.value = b.dataset.pct; upd(); }));
  }

  function sheetShare(d) {
    const link = location.href.split('#')[0] + '#/deal/' + d.id;
    openSheet(`<div class="stack" style="text-align:center">
      <div style="width:56px;height:56px;margin:0 auto;border-radius:16px;background:var(--gold-soft);color:var(--gold);display:grid;place-items:center">${I.checkc}</div>
      <h2>ส่งรหัสนี้ให้${d.myRole === 'buyer' ? 'ผู้ขาย' : 'ผู้ซื้อ'}</h2>
      <div style="font-size:2rem;font-weight:700;letter-spacing:.08em;color:var(--black)" class="num">${d.code}</div>
      <p class="small muted">อีกฝ่ายเปิดลิงก์หรือกรอกรหัสบน Middleman เพื่ออ่านและลงนามข้อตกลง</p>
      <button class="btn btn-primary btn-block" data-action="copy" data-v="${esc(link)}">${I.share}คัดลอกลิงก์</button>
      <button class="btn btn-ghost btn-block" data-action="close">เสร็จ</button>
    </div>`);
  }

  function sheetJoin() {
    openSheet(`<form class="stack" data-form="join">
      <h2>เข้าร่วมดีลด้วยรหัส</h2>
      <p class="small muted">กรอกรหัสที่ได้รับจากอีกฝ่าย เช่น MM-5550</p>
      <input class="input num" name="code" placeholder="MM-0000" autocapitalize="characters" style="text-align:center;font-size:1.3rem;letter-spacing:.1em" required />
      <button class="btn btn-primary btn-block" type="submit">ค้นหาดีล</button>
    </form>`);
  }

  // ---------- file evidence (images downscaled before upload) ----------
  function readEvidence(files) {
    return Promise.all([...files].slice(0, 8).map((f) => new Promise((res) => {
      if (!f.type.startsWith('image/')) return res({ name: f.name });
      const fr = new FileReader();
      fr.onload = () => {
        const img = new Image();
        img.onload = () => {
          const s = Math.min(1, 240 / Math.max(img.width, img.height));
          const c = document.createElement('canvas'); c.width = img.width * s; c.height = img.height * s;
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          res({ name: f.name, src: c.toDataURL('image/jpeg', 0.7) });
        };
        img.onerror = () => res({ name: f.name });
        img.src = fr.result;
      };
      fr.onerror = () => res({ name: f.name });
      fr.readAsDataURL(f);
    })));
  }

  // ---------- events ----------
  // Mirrors the server: 5% fee off the top, the rest split by the ruling.
  const pctSplit = (deposit, pct) => {
    const dep = Math.round(deposit * 100), pool = dep - Math.round(dep * DISPUTE_FEE_RATE);
    const b = Math.round(pool * (pct / 100));
    return { buyer: b / 100, seller: (pool - b) / 100 };
  };
  // Photos for KYC / slips: downscale on the device before upload.
  function readPhoto(file, maxDim = 1400) {
    return new Promise((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => {
        const img = new Image();
        img.onload = () => {
          const s = Math.min(1, maxDim / Math.max(img.width, img.height));
          const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          res(c.toDataURL('image/jpeg', 0.82));
        };
        img.onerror = () => rej(new Error('อ่านรูปไม่ได้ กรุณาเลือกไฟล์รูปภาพ'));
        img.src = fr.result;
      };
      fr.onerror = () => rej(new Error('อ่านไฟล์ไม่ได้'));
      fr.readAsDataURL(file);
    });
  }

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-action]'); if (!t) return;
    const a = t.dataset.action;
    const d = t.dataset.id ? findDeal(t.dataset.id) : null;
    const path = (p) => `/api/deals/${encodeURIComponent(d.id)}${p}`;
    switch (a) {
      case 'filter': dealFilter = t.dataset.v; viewDeals(); break;
      case 'join': sheetJoin(); break;
      case 'close': closeSheet(); break;
      case 'demo-login':
        act(async () => { state.pendingUser = (await api('POST', '/api/auth/demo', { userId: t.dataset.v })).user; }, null,
          () => signedIn(state.pendingUser, 'เข้าสู่ระบบเป็น ' + state.pendingUser.name));
        break;
      case 'thaid-start':
        act(async () => { location.hash = (await api('POST', '/api/auth/thaid/start', {})).url.replace(/^#/, ''); }, null, () => {});
        break;
      case 'thaid-fill': {
        const f = t.closest('form');
        const fn = ['สมชาย', 'สุนิสา', 'ธนพล', 'กมลชนก', 'ปิยะ'], ln = ['รักไทย', 'มีสุข', 'ทองดี', 'แสงจันทร์', 'บุญมา'];
        f.pid.value = fmtPid(randomPid()); f.firstName.value = fn[Math.floor(Math.random() * 5)]; f.lastName.value = ln[Math.floor(Math.random() * 5)];
        break;
      }
      case 'logout':
        act(() => api('POST', '/api/auth/logout', {}), 'ออกจากระบบแล้ว', () => { state.me = null; state.deals = []; go('/login'); });
        break;
      case 'bank': sheetBank(); break;
      case 'kyc-approve':
      case 'kyc-reject': {
        const approve = a === 'kyc-approve';
        const checked = !!$(`[data-kyc-check="${t.dataset.v}"]`)?.checked;
        if (approve && !checked) return toast('กรุณาติ๊กยืนยันว่าตรวจสอบครบแล้ว');
        const note = approve ? '' : prompt('เหตุผลที่ไม่อนุมัติ (ผู้สมัครจะเห็นข้อความนี้)', 'รูปบัตรไม่ชัด กรุณาส่งใหม่หรือใช้ ThaID');
        if (!approve && !note) return;
        act(() => api('POST', '/api/admin/kyc/' + encodeURIComponent(t.dataset.v), { approve, checked, note }), approve ? 'อนุมัติตัวตนแล้ว' : 'บันทึกผลแล้ว', () => viewStaff());
        break;
      }
      case 'pay-approve':
      case 'pay-reject': {
        const approve = a === 'pay-approve';
        const checked = !!$(`[data-pay-check="${t.dataset.v}"]`)?.checked;
        if (approve && !checked) return toast('กรุณาติ๊กยืนยันว่าพบยอดในรายการเดินบัญชี');
        const note = approve ? '' : prompt('เหตุผลที่ไม่รับยอด', 'ไม่พบยอดเงินเข้าในรายการเดินบัญชี');
        if (!approve && !note) return;
        act(() => api('POST', '/api/admin/payments/' + encodeURIComponent(t.dataset.v), { approve, checked, note }), approve ? 'รับยอดแล้ว ดีลเปลี่ยนเป็นพักเงินแล้ว' : 'บันทึกผลแล้ว', () => viewStaff());
        break;
      }
      case 'share': sheetShare(d); break;
      case 'copy': navigator.clipboard?.writeText(t.dataset.v).then(() => toast('คัดลอกลิงก์แล้ว'), () => toast(t.dataset.v)); break;
      case 'sign':
        act(() => api('POST', path('/sign'), { agree: true, contractHash: d.contractHash }),
          'ลงนามเรียบร้อย', (nd) => go('/deal/' + nd.id));
        break;
      case 'cancel':
        if (confirm('ยกเลิกดีลนี้? (ยังไม่มีการชำระเงิน)')) act(() => api('POST', path('/cancel'), {}), 'ยกเลิกดีลแล้ว');
        break;
      case 'pay': payIntent = null; slipImage = null; sheetPay(d); break;
      case 'pay-start':
        act(async () => { payIntent = { ...(await api('POST', path('/payments'), {})), dealId: d.id }; }, null, () => sheetPay(d));
        break;
      case 'pay-demo': {
        // Demo: stands in for the buyer's banking app making the transfer.
        const input = $('#s-ref');
        api('POST', '/api/demo/bank/transfer', { paymentId: payIntent.paymentId, fromOtherPerson: !!t.dataset.other })
          .then((r) => { input.value = r.transRef; toast('โอนแล้ว ใส่เลขอ้างอิงสลิปให้แล้ว'); }, (e) => toast(e.message));
        break;
      }
      case 'ship': sheetShip(d); break;
      case 'confirm': sheetConfirm(d); break;
      case 'confirm-done':
        act(() => api('POST', path('/confirm'), { checked: document.querySelectorAll('[data-cc]:checked').length }),
          'ปล่อยเงินให้ผู้ขายแล้ว ขอบคุณที่ใช้ Middleman');
        break;
      case 'respond': sheetRespond(d); break;
      case 'accept-claim':
        if (confirm('ยอมรับข้อเรียกร้องของอีกฝ่ายและปิดข้อพิพาท?')) act(() => api('POST', path('/dispute/accept'), {}), 'ปิดข้อพิพาทแล้ว');
        break;
      case 'decide': sheetDecide(d); break;
      // create wizard
      case 'd-set': draft[t.dataset.k] = t.dataset.v; viewCreate(); break;
      case 'd-addcond': draft.conditions.push(''); viewCreate(); setTimeout(() => $(`[data-cond="${draft.conditions.length - 1}"]`)?.focus(), 0); break;
      case 'd-delcond': draft.conditions.splice(Number(t.dataset.i), 1); viewCreate(); break;
      case 'd-prev': draft.step--; viewCreate(); break;
      case 'd-next': { const err = validateStep(); if (err) return toast(err); draft.step++; viewCreate(); break; }
      case 'd-create': {
        const err = validateStep(); if (err) return toast(err);
        act(() => api('POST', '/api/deals', {
          myRole: draft.myRole, title: draft.title, description: draft.description, category: draft.category,
          price: Number(draft.price),
          deliveryDays: Number(draft.deliveryDays), inspectionDays: Number(draft.inspectionDays),
          conditions: draft.conditions, counterName: draft.counterName, agree: !!draft.agree,
        }), null, (nd) => { draft = null; go('/deal/' + nd.id); setTimeout(() => sheetShare(nd), 150); });
        break;
      }
      // dispute form
      case 'ds-set': disputeDraft[t.dataset.k] = t.dataset.v; viewOpenDispute(findDeal(disputeDraft.id)); break;
      case 'ds-submit': {
        const dd = disputeDraft;
        if (!dd.detail.trim()) return toast('กรุณาอธิบายปัญหา');
        if (dd.want === 'refund_partial' && !(Number(dd.amount) > 0)) return toast('กรุณาระบุจำนวนเงินที่ขอคืน');
        if (!dd.agree) return toast('กรุณายืนยันความถูกต้องของข้อมูล');
        act(() => api('POST', path('/dispute'), { reason: dd.reason, detail: dd.detail, want: dd.want, amount: Number(dd.amount) || 0, evidence: dd.evidence, agree: true }),
          'ส่งเรื่องแล้ว เงินถูกระงับไว้', (nd) => { disputeDraft = null; go('/deal/' + nd.id); });
        break;
      }
    }
  });

  document.addEventListener('input', (e) => {
    const t = e.target;
    if (t.dataset.d && draft) {
      draft[t.dataset.d] = t.value;
      if (t.dataset.d === 'price') {
        const p = Number(t.value) || 0; const fb = $('#feeBox');
        if (fb) fb.innerHTML = feeLines(money({ price: p }));
      }
    }
    if (t.dataset.cond !== undefined && draft) draft.conditions[Number(t.dataset.cond)] = t.value;
    if (t.id === 'f-agree' && draft) draft.agree = t.checked;
    if (t.dataset.ds && disputeDraft) disputeDraft[t.dataset.ds] = t.value;
    if (t.dataset.dsCheck && disputeDraft) disputeDraft[t.dataset.dsCheck] = t.checked;
    if (t.name === 'nationalId' || t.name === 'pid') {
      const digits = t.value.replace(/\D/g, '');
      t.value = fmtPid(digits);
      const hint = $('#pidHint');
      if (hint) hint.textContent = digits.length < 13 ? '1 เลขบัตรสมัครได้ 1 บัญชี' : validPid(digits) ? 'เลขบัตรถูกต้อง' : 'เลขบัตรไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง';
    }
  });

  document.addEventListener('change', async (e) => {
    const t = e.target;
    if (t.dataset.photo && t.files.length) {
      try {
        const src = await readPhoto(t.files[0], t.dataset.photo === 'slip' ? 1000 : 1400);
        if (t.dataset.photo === 'slip') slipImage = src; else idDraft[t.dataset.photo] = src;
        const box = t.closest('.upload');
        box.querySelectorAll('img, svg, span').forEach((n) => n.remove());
        box.insertAdjacentHTML('beforeend', `<img src="${src}" alt="" />`);
      } catch (err) { toast(err.message); }
      t.value = '';
      return;
    }
    if (t.id === 'f-agree' && draft) draft.agree = t.checked;
    if (t.dataset.dsCheck && disputeDraft) disputeDraft[t.dataset.dsCheck] = t.checked;
    if (!t.dataset.upload || !t.files.length) return;
    const ev = await readEvidence(t.files);
    if (t.dataset.upload === 'dispute' && disputeDraft) { disputeDraft.evidence.push(...ev); $('#evList').innerHTML = evidenceHtml(disputeDraft.evidence); }
    if (t.dataset.upload === 'ship') { shipEvidence.push(...ev); $('#shipEv').innerHTML = evidenceHtml(shipEvidence); }
    if (t.dataset.upload === 'respond') { respEvidence.push(...ev); $('#respEv').innerHTML = evidenceHtml(respEvidence); }
    t.value = '';
  });

  document.addEventListener('submit', (e) => {
    const f = e.target.closest('[data-form]'); if (!f) return;
    e.preventDefault();
    const kind = f.dataset.form;
    const d = f.dataset.id ? findDeal(f.dataset.id) : null;
    const fd = new FormData(f);
    const path = (p) => `/api/deals/${encodeURIComponent(d.id)}${p}`;
    if (kind === 'thaid') {
      act(async () => {
        const { code } = await api('POST', '/api/demo/thaid/authorize', { state: f.dataset.state, pid: fd.get('pid'), firstName: fd.get('firstName'), lastName: fd.get('lastName') });
        state.pendingUser = (await api('POST', '/api/auth/thaid/callback', { code, state: f.dataset.state })).user;
      }, null, () => signedIn(state.pendingUser, 'ยืนยันตัวตนผ่าน ThaID สำเร็จ'));
      return;
    }
    if (kind === 'idcard') {
      if (!validPid(fd.get('nationalId'))) return toast('เลขประจำตัวประชาชนไม่ถูกต้อง');
      if (!idDraft.cardImage || !idDraft.selfieImage) return toast('กรุณาถ่ายรูปบัตรและรูปคู่บัตร');
      if (!/^\d{6}$/.test(fd.get('pin'))) return toast('PIN ต้องเป็นตัวเลข 6 หลัก');
      if (fd.get('pin') !== fd.get('pin2')) return toast('PIN ทั้งสองช่องไม่ตรงกัน');
      if (!fd.get('consent')) return toast('กรุณายินยอมการใช้ข้อมูลเพื่อยืนยันตัวตน');
      act(async () => {
        state.pendingUser = (await api('POST', '/api/auth/idcard', { nationalId: fd.get('nationalId'), firstName: fd.get('firstName'), lastName: fd.get('lastName'),
          pin: fd.get('pin'), consent: true, cardImage: idDraft.cardImage, selfieImage: idDraft.selfieImage })).user;
      }, null, () => { idDraft = { cardImage: null, selfieImage: null }; signedIn(state.pendingUser, 'ส่งข้อมูลแล้ว ทีมงานจะตรวจสอบภายใน 1 วันทำการ'); });
      return;
    }
    if (kind === 'pin') {
      act(async () => { state.pendingUser = (await api('POST', '/api/auth/pin', { nationalId: fd.get('nationalId'), pin: fd.get('pin') })).user; },
        null, () => signedIn(state.pendingUser, 'เข้าสู่ระบบแล้ว'));
      return;
    }
    if (kind === 'bank') {
      act(async () => { state.me = (await api('PUT', '/api/me/bank', { bankCode: fd.get('bankCode'), accountNo: fd.get('accountNo'), accountName: fd.get('accountName') })).user; },
        'บันทึกบัญชีรับเงินแล้ว ชื่อตรงกับบัตรประชาชน', () => (location.hash === '#/me' ? route() : go('/me')));
      return;
    }
    if (kind === 'chat') {
      const text = String(fd.get('text') || '').trim(); if (!text) return;
      act(() => api('POST', path('/messages'), { text }), null, (nd) => {
        viewDeal(nd);
        setTimeout(() => $('#chat')?.scrollIntoView({ block: 'center' }), 0);
      });
    } else if (kind === 'ship') {
      act(() => api('POST', path('/ship'), { carrier: fd.get('carrier'), tracking: fd.get('tracking'), note: fd.get('note'), evidence: shipEvidence }),
        'แจ้งจัดส่งแล้ว ผู้ซื้อจะได้รับการแจ้งเตือน');
    } else if (kind === 'respond') {
      act(() => api('POST', path('/dispute/respond'), { text: fd.get('text'), evidence: respEvidence }), 'ส่งคำชี้แจงแล้ว');
    } else if (kind === 'decide') {
      act(() => api('POST', path('/dispute/decide'), { buyerPercent: Number(fd.get('pct')), reason: fd.get('reason'), considered: true }),
        'บันทึกคำตัดสินแล้ว');
    } else if (kind === 'slip') {
      act(() => api('POST', path(`/payments/${encodeURIComponent(payIntent.paymentId)}/slip`), { transRef: fd.get('transRef'), slipImage }), null, (nd) => {
        payIntent = null; slipImage = null; route();
        toast(nd.status === 'funded' ? 'ธนาคารยืนยันยอดแล้ว เงินถูกพักไว้อย่างปลอดภัย' : 'ได้รับสลิปแล้ว รอทีมงานตรวจสอบ');
      });
    } else if (kind === 'join') {
      const code = String(fd.get('code') || '').trim().toUpperCase().replace(/^(MM)?-?/, 'MM-');
      act(() => api('GET', '/api/deals/code/' + encodeURIComponent(code)), null, (nd) => go('/deal/' + nd.id));
    }
  });

  $('#personaChip').addEventListener('click', () => go('/me'));
  window.addEventListener('hashchange', route);
  route();
})();
