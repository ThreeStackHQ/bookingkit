// BookingKit Widget v1.0 — IIFE build via Rollup
// State: SELECT_DATE → SELECT_TIME → FILL_FORM → CONFIRMED

type State = 'SELECT_DATE' | 'SELECT_TIME' | 'FILL_FORM' | 'CONFIRMED' | 'LOADING';

interface SlotData {
  start: string;
  end: string;
  available: boolean;
}

interface Config {
  calendarId: string;
  baseUrl: string;
}

const CSS = `
  .bk-widget{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:420px;background:#0f172a;border-radius:12px;overflow:hidden;box-shadow:0 25px 50px rgba(0,0,0,.4);color:#e2e8f0}
  .bk-header{background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:20px;text-align:center}
  .bk-header h3{margin:0;font-size:1.2rem;font-weight:600;color:#fff}
  .bk-body{padding:20px}
  .bk-cal-nav{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
  .bk-cal-nav button{background:#1e293b;border:1px solid #334155;color:#94a3b8;border-radius:6px;width:32px;height:32px;cursor:pointer;font-size:1rem}
  .bk-cal-nav button:hover{background:#334155}
  .bk-cal-title{font-weight:600;color:#e2e8f0}
  .bk-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px}
  .bk-cal-day-name{text-align:center;font-size:.75rem;color:#64748b;padding:4px;font-weight:600}
  .bk-cal-day{text-align:center;border-radius:6px;padding:6px 2px;cursor:pointer;font-size:.875rem;color:#94a3b8}
  .bk-cal-day:hover:not(.bk-empty):not(.bk-past){background:#4f46e5;color:#fff}
  .bk-cal-day.bk-today{border:1px solid #4f46e5;color:#818cf8}
  .bk-cal-day.bk-selected{background:#4f46e5;color:#fff;font-weight:600}
  .bk-cal-day.bk-past{color:#1e293b;cursor:default}
  .bk-cal-day.bk-empty{cursor:default}
  .bk-slots{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px}
  .bk-slot{padding:8px;text-align:center;border-radius:6px;border:1px solid #334155;background:#1e293b;color:#94a3b8;cursor:pointer;font-size:.8rem}
  .bk-slot:hover{border-color:#4f46e5;color:#818cf8}
  .bk-slot.bk-unavail{opacity:.3;cursor:default}
  .bk-form label{display:block;font-size:.8rem;color:#94a3b8;margin-bottom:4px;margin-top:12px}
  .bk-form input,.bk-form textarea{width:100%;background:#1e293b;border:1px solid #334155;border-radius:6px;padding:8px 10px;color:#e2e8f0;font-size:.875rem;box-sizing:border-box;outline:none}
  .bk-form input:focus,.bk-form textarea:focus{border-color:#4f46e5}
  .bk-btn{width:100%;margin-top:16px;padding:10px;background:#4f46e5;color:#fff;border:none;border-radius:6px;font-size:.875rem;font-weight:600;cursor:pointer}
  .bk-btn:hover{background:#4338ca}
  .bk-btn:disabled{opacity:.5;cursor:default}
  .bk-back{background:none;border:none;color:#64748b;cursor:pointer;font-size:.8rem;margin-bottom:8px;padding:0}
  .bk-back:hover{color:#94a3b8}
  .bk-success{text-align:center;padding:20px 0}
  .bk-checkmark{font-size:3rem;margin-bottom:12px}
  .bk-loading{text-align:center;padding:40px;color:#64748b}
  .bk-err{color:#f87171;font-size:.8rem;margin-top:4px}
  .bk-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;display:flex;align-items:center;justify-content:center}
  .bk-popup-close{position:absolute;top:12px;right:12px;background:none;border:none;color:#64748b;font-size:1.5rem;cursor:pointer}
`;

function esc(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function injectCss(): void {
  if (document.getElementById('bk-styles')) return;
  const el = document.createElement('style');
  el.id = 'bk-styles';
  el.textContent = CSS;
  document.head.appendChild(el);
}

function fmtMonth(y: number, m: number): string {
  return new Date(y, m).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function userTz(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return 'UTC'; }
}

class BookingWidget {
  private el: HTMLElement;
  private cfg: Config;
  private state: State = 'SELECT_DATE';
  private selDate: string | null = null;
  private selSlot: SlotData | null = null;
  private viewY: number;
  private viewM: number;
  private title = 'Book a Meeting';

  constructor(el: HTMLElement, cfg: Config) {
    this.el = el;
    this.cfg = cfg;
    const now = new Date();
    this.viewY = now.getFullYear();
    this.viewM = now.getMonth();
    this.render();
  }

  private async fetchSlots(date: string): Promise<SlotData[]> {
    const tz = userTz();
    const r = await fetch(`${this.cfg.baseUrl}/api/slots?calendarId=${encodeURIComponent(this.cfg.calendarId)}&date=${date}&timezone=${encodeURIComponent(tz)}`);
    const d = await r.json();
    return d.slots ?? [];
  }

  private renderCal(): string {
    const y = this.viewY, m = this.viewM;
    const first = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();
    const today = new Date(); today.setHours(0,0,0,0);
    const dn = ['Su','Mo','Tu','We','Th','Fr','Sa'];
    let h = `<div class="bk-cal-nav"><button data-a="pm">\u2039</button><span class="bk-cal-title">${esc(fmtMonth(y,m))}</span><button data-a="nm">\u203A</button></div><div class="bk-cal-grid">`;
    h += dn.map(d => `<div class="bk-cal-day-name">${d}</div>`).join('');
    for (let i=0;i<first;i++) h+=`<div class="bk-cal-day bk-empty"></div>`;
    for (let d=1;d<=days;d++) {
      const dt = new Date(y,m,d);
      const ds = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const past = dt < today;
      const tod = dt.getTime()===today.getTime();
      const sel = ds===this.selDate;
      let cls = 'bk-cal-day' + (past?' bk-past':'') + (tod?' bk-today':'') + (sel?' bk-selected':'');
      h += `<div class="${cls}"${!past?` data-d="${ds}"`:''}>${d}</div>`;
    }
    h += '</div>';
    return h;
  }

  private render(): void {
    let h = `<div class="bk-widget"><div class="bk-header"><h3>${esc(this.title)}</h3></div><div class="bk-body">`;
    if (this.state==='LOADING') {
      h += '<div class="bk-loading">Loading...</div>';
    } else if (this.state==='SELECT_DATE') {
      h += this.renderCal();
    } else if (this.state==='SELECT_TIME') {
      h += `<button class="bk-back" data-a="bd">\u2190 Back</button><div style="margin-bottom:12px;font-size:.875rem;color:#94a3b8">Select time for ${esc(this.selDate!)}</div><div class="bk-slots" id="bk-sc"><div class="bk-loading">Loading...</div></div>`;
    } else if (this.state==='FILL_FORM') {
      const t = this.selSlot ? fmtTime(this.selSlot.start) : '';
      h += `<button class="bk-back" data-a="bt">\u2190 Back</button><div style="margin-bottom:12px;font-size:.875rem;color:#94a3b8">${esc(this.selDate!)} at ${esc(t)}</div><div class="bk-form"><label>Name *</label><input id="bk-nm" type="text" placeholder="Your name"><label>Email *</label><input id="bk-em" type="email" placeholder="your@email.com"><label>Notes</label><textarea id="bk-nt" rows="3" placeholder="Anything to share?"></textarea><div class="bk-err" id="bk-er"></div><button class="bk-btn" id="bk-sb">Confirm Booking</button></div>`;
    } else if (this.state==='CONFIRMED') {
      h += `<div class="bk-success"><div class="bk-checkmark">&#x2705;</div><h4 style="margin:0 0 8px;color:#e2e8f0">Booking Confirmed!</h4><p style="color:#64748b;font-size:.875rem;margin:0">Check your email for details.</p></div>`;
    }
    h += '</div></div>';
    this.el.innerHTML = h;
    this.bind();
    if (this.state==='SELECT_TIME') this.loadSlots();
  }

  private async loadSlots(): Promise<void> {
    if (!this.selDate) return;
    const c = this.el.querySelector('#bk-sc');
    if (!c) return;
    try {
      const slots = await this.fetchSlots(this.selDate);
      const avail = slots.filter(s=>s.available);
      if (!avail.length) { c.innerHTML='<div style="color:#64748b;font-size:.875rem">No slots available.</div>'; return; }
      c.innerHTML = avail.map(s=>`<div class="bk-slot" data-s="${esc(s.start)}" data-e="${esc(s.end)}">${esc(fmtTime(s.start))}</div>`).join('');
      c.querySelectorAll('.bk-slot').forEach(el => {
        el.addEventListener('click', () => {
          this.selSlot = { start: (el as HTMLElement).dataset.s!, end: (el as HTMLElement).dataset.e!, available: true };
          this.state = 'FILL_FORM';
          this.render();
        });
      });
    } catch { c.innerHTML='<div style="color:#f87171">Failed to load slots.</div>'; }
  }

  private async submit(): Promise<void> {
    const nm = (this.el.querySelector('#bk-nm') as HTMLInputElement)?.value.trim();
    const em = (this.el.querySelector('#bk-em') as HTMLInputElement)?.value.trim();
    const nt = (this.el.querySelector('#bk-nt') as HTMLTextAreaElement)?.value.trim();
    const er = this.el.querySelector('#bk-er') as HTMLElement;
    const sb = this.el.querySelector('#bk-sb') as HTMLButtonElement;
    if (!nm||!em) { er.textContent='Name and email are required.'; return; }
    sb.disabled=true; sb.textContent='Booking...'; er.textContent='';
    try {
      const r = await fetch(`${this.cfg.baseUrl}/api/bookings`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({calendarId:this.cfg.calendarId,inviteeName:nm,inviteeEmail:em,inviteeTz:userTz(),startsAt:this.selSlot!.start,notes:nt||undefined})});
      if (r.ok) { this.state='CONFIRMED'; this.render(); }
      else { const d=await r.json(); er.textContent=d.error??'Booking failed.'; sb.disabled=false; sb.textContent='Confirm Booking'; }
    } catch { er.textContent='Network error.'; sb.disabled=false; sb.textContent='Confirm Booking'; }
  }

  private bind(): void {
    this.el.querySelector('[data-a="pm"]')?.addEventListener('click',()=>{ this.viewM--; if(this.viewM<0){this.viewM=11;this.viewY--;} this.render(); });
    this.el.querySelector('[data-a="nm"]')?.addEventListener('click',()=>{ this.viewM++; if(this.viewM>11){this.viewM=0;this.viewY++;} this.render(); });
    this.el.querySelectorAll('.bk-cal-day[data-d]').forEach(el=>{
      el.addEventListener('click',()=>{ this.selDate=(el as HTMLElement).dataset.d!; this.state='SELECT_TIME'; this.render(); });
    });
    this.el.querySelector('[data-a="bd"]')?.addEventListener('click',()=>{ this.state='SELECT_DATE'; this.render(); });
    this.el.querySelector('[data-a="bt"]')?.addEventListener('click',()=>{ this.state='SELECT_TIME'; this.render(); });
    this.el.querySelector('#bk-sb')?.addEventListener('click',()=>this.submit());
  }
}

// Popup
let _overlay: HTMLElement|null = null;

function openPopup(calendarId: string, opts?: { baseUrl?: string }): void {
  closePopup();
  injectCss();
  const overlay = document.createElement('div');
  overlay.className = 'bk-overlay';
  const close = document.createElement('button');
  close.className = 'bk-popup-close';
  close.textContent = '\u00D7';
  close.onclick = closePopup;
  const wrap = document.createElement('div');
  wrap.style.position = 'relative';
  overlay.appendChild(close);
  overlay.appendChild(wrap);
  overlay.addEventListener('click', e => { if (e.target===overlay) closePopup(); });
  document.body.appendChild(overlay);
  _overlay = overlay;
  new BookingWidget(wrap, { calendarId, baseUrl: opts?.baseUrl ?? '' });
}

function closePopup(): void {
  _overlay?.remove();
  _overlay = null;
}

function bootstrap(): void {
  injectCss();
  document.querySelectorAll<HTMLElement>('[data-booking-kit]').forEach(el => {
    const calId = el.dataset.bookingKit ?? '';
    const baseUrl = el.dataset.bookingKitUrl ?? '';
    new BookingWidget(el, { calendarId: calId, baseUrl });
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
}

export default { open: openPopup, close: closePopup };
