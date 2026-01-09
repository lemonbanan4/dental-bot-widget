// ------------------------------------------------------------------
// CANONICAL SOURCE: dental-bot-widget (Vercel)
// ------------------------------------------------------------------
console.log("DentalBot Widget LIVE — v1.0.1", new Date().toISOString());

(() => {
  // Prevent duplicate widget instances
  if (document.getElementById('dbot-root')) {
    console.warn('DentalBotWidget: widget already initialized');
    return;
  }
  let _root = null;
  const script = document.currentScript;
  const apiUrl = (script?.dataset?.api || "").replace(/\/$/, "");
  const clinicId = (script?.dataset?.clinic || "").trim();
  const analyticsUrl = (script?.dataset?.analytics || "").trim();
  const enableStream = (script?.dataset?.stream === '1' || script?.dataset?.stream === 'true');
  // brand customization hooks
  const themeColor = (script?.dataset?.theme || "").trim();
  const titleOverride = (script?.dataset?.title || "").trim();

  console.log("Dental bot widget loaded");
  console.log("API:", apiUrl);
  console.log("Clinic:", clinicId);

  if (!apiUrl || !clinicId) {
    console.warn("DentalBotWidget: missing data-api or data-clinic on script tag", { apiUrl, clinicId });
    return;
  }

  const styles = `
    .dbot-launcher{position:fixed;right:20px;bottom:20px;background:#111;color:#fff;border:none;border-radius:999px;padding:12px 16px;
      font:600 14px/1.2 system-ui,-apple-system,sans-serif;cursor:pointer;box-shadow:0 10px 30px rgba(0,0,0,0.15);z-index:999999}
    .dbot-panel{position:fixed;right:20px;bottom:70px;width:340px;height:480px;max-width:calc(100vw - 40px);max-height:calc(100vh - 120px);
      background:#fff;border-radius:14px;box-shadow:0 24px 80px rgba(2,6,23,0.35);display:none;flex-direction:column;overflow:hidden;border:1px solid #eef2f7;z-index:999999;
      font:14px/1.4 system-ui,-apple-system,sans-serif;transform-origin:bottom right;transition:transform .18s ease,opacity .18s ease}
    .dbot-panel.open{display:flex}
    .dbot-panel.open{transform:translateY(0);opacity:1}
    .dbot-panel{transform:translateY(6px);opacity:0}
    .dbot-header{padding:10px 12px;background:#111;color:#fff;display:flex;align-items:center;justify-content:space-between;gap:10px}
    .dbot-header-inner{display:flex;align-items:center;gap:10px}
    .dbot-avatar{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#16a34a,#06b6d4);display:inline-block;flex:0 0 32px;box-shadow:0 6px 18px rgba(2,6,23,0.18)}
    .dbot-title{font-weight:700;font-size:13px}
    .dbot-actions{display:flex;gap:8px;align-items:center}
    .dbot-hbtn{background:#fff;color:#111;border:1px solid rgba(255,255,255,0.35);border-radius:10px;padding:6px 10px;cursor:pointer;font-weight:600;font-size:12px}
    .dbot-hbtn:disabled{opacity:.5;cursor:not-allowed}
    .dbot-clear{padding:4px 8px;font-size:12px;background-color:#16a34a;}
    .dbot-close{background:transparent;color:#fff;border:none;font-size:18px;cursor:pointer;line-height:1}
    .dbot-messages{flex:1;padding:12px;overflow-y:auto;gap:8px;display:flex;flex-direction:column;background:#fafafa}
    .dbot-msg{padding:10px 12px;border-radius:12px;max-width:90%;white-space:pre-wrap;word-break:break-word}
    .dbot-msg.user{background:#111;color:#fff;align-self:flex-end;border-bottom-right-radius:6px}
    .dbot-msg.bot{background:#fff;color:#111;align-self:flex-start;border:1px solid #e6e6e6;border-bottom-left-radius:6px}
    .dbot-msg.typing{opacity:.9;font-style:italic;color:#666}
    .dbot-msg.typing::after{content:"";display:inline-block;margin-left:8px;width:18px;height:8px;vertical-align:middle}
    .dbot-msg.typing span{display:inline-block}
    .dbot-msg.typing .dots::after{content:".";animation:dots .9s steps(3,end) infinite}
    @keyframes dots{0%{content:"."}33%{content:".."}66%{content:"..."}100%{content:"."}}
    .dbot-msg a{color:inherit;text-decoration:underline}
    .dbot-input{display:flex;padding:10px;gap:8px;border-top:1px solid #e5e7eb;background:#fff}
    .dbot-input textarea{flex:1;resize:none;border:1px solid #d1d5db;border-radius:10px;padding:10px;min-height:44px;font:inherit;outline:none}
    .dbot-input button{background:#111;color:#fff;border:none;padding:10px 12px;border-radius:10px;cursor:pointer;font-weight:700}
    .dbot-launcher{transition:transform .12s ease,box-shadow .12s ease}
    .dbot-launcher:hover{transform:translateY(-2px);box-shadow:0 18px 40px rgba(2,6,23,0.16)}
    .dbot-note{font-size:11px;color:#666;padding:0 12px 10px;background:#fff}
    .dbot-msg-actions{display:flex;gap:8px;margin-top:8px}
    .dbot-msg-action{background:#fff;border:1px solid #e6e6e6;padding:6px 8px;border-radius:8px;font-weight:700;cursor:pointer}
    .dbot-msg-action.primary{background:#16a34a;color:#fff;border-color:transparent}
    .dbot-msg-action:disabled{opacity:.6;cursor:not-allowed}
    /* Lead slide-in panel: non-blocking, anchored near the widget */
    .dbot-modal-backdrop{position:fixed;right:20px;bottom:80px;width:360px;display:none;z-index:1000000;pointer-events:auto;display:none;align-items:flex-end;justify-content:flex-end}
    .dbot-modal{width:100%;background:#fff;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,0.3);overflow:hidden;border:1px solid #e5e7eb;transform:translateY(12px);transition:transform .18s ease,opacity .18s ease}
    .dbot-modal.open{transform:translateY(0)}
    .dbot-modal-h{padding:12px 12px;background:#111;color:#fff;font-weight:800;display:flex;justify-content:space-between;align-items:center}
    .dbot-modal-c{padding:12px;display:flex;flex-direction:column;gap:10px}
    .dbot-field{display:flex;flex-direction:column;gap:6px}
    .dbot-field label{font-size:12px;color:#444;font-weight:700}
    .dbot-field input,.dbot-field textarea{border:1px solid #d1d5db;border-radius:10px;padding:10px;font:inherit;outline:none}
    .dbot-modal-actions{display:flex;gap:8px;justify-content:flex-end}
    .dbot-btn{border-radius:10px;padding:10px 12px;font-weight:800;cursor:pointer;border:1px solid #ddd;background:#fff}
    .dbot-btn.primary{background:#111;color:#fff;border-color:#111}
    :host{ --dbot-accent: #16a34a; }
    .dbot-cta{display:block;padding:10px;border-radius:8px;text-align:center;background:var(--dbot-accent);color:#fff;font-weight:700;box-shadow:0 8px 24px rgba(16,185,129,0.12)}
    .dbot-btn.primary{background:var(--dbot-accent);color:#fff;border-color:var(--dbot-accent)}
    .spinner{display:inline-block;width:14px;height:14px;border-radius:50%;border:2px solid rgba(255,255,255,0.25);border-top-color:#fff;vertical-align:middle;margin-right:8px;animation:spin .8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
  `;

  function ensureStyleTag() {
    // Left as a no-op for Shadow DOM usage; styles are injected into the widget's shadow root.
    return;
  }

  // Simple analytics event collector (hook for host pages)
  function trackEvent(name, payload = {}) {
    try {
      window.__dentalBotEvents = window.__dentalBotEvents || [];
      window.__dentalBotEvents.push({ event: name, ts: Date.now(), ...payload });
      // fire-and-forget POST to analytics endpoint if provided
      if (analyticsUrl) {
        try {
          navigator.sendBeacon
            ? navigator.sendBeacon(analyticsUrl, JSON.stringify({ event: name, ts: Date.now(), ...payload }))
            : fetch(analyticsUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event: name, ts: Date.now(), ...payload }) }).catch(()=>{});
        } catch (e) {}
      }
    } catch (e) {
      /* ignore */
    }
  }

  function linkifyToFragment(text) {
    // Use a global regex for splitting but a non-global (or anchored) check
    // for detecting URL parts to avoid lastIndex issues with `.test()`.
    const splitRegex = /(https?:\/\/[^\s)]+)\b/;
    const isUrl = /^(https?:\/\/[^\s)]+)\b$/;
    const parts = String(text).split(splitRegex);
    const frag = document.createDocumentFragment();
    for (const part of parts) {
      if (!part) continue;
      if (isUrl.test(part)) {
        const a = document.createElement("a");
        a.href = part;
        a.textContent = part;
        a.target = "_blank";
        a.rel = "noopener noreferrer nofollow";
        frag.appendChild(a);
      } else {
        frag.appendChild(document.createTextNode(part));
      }
    }
    return frag;
  }

  function createElements() {
    // Create a host element for the widget and attach a shadow root to isolate styles
    const host = document.createElement('div');
    host.setAttribute('id', 'dbot-host');
    const shadow = host.attachShadow({ mode: 'open' });

    // inject styles into the shadow root
    const shadowStyle = document.createElement('style');
    shadowStyle.textContent = styles;
    shadow.appendChild(shadowStyle);

    const launcher = document.createElement("button");
    launcher.type = "button";
    launcher.className = "dbot-launcher";
    launcher.textContent = "Chat";

    const panel = document.createElement("div");
    panel.className = "dbot-panel";

    const header = document.createElement("div");
    header.className = "dbot-header";

    const title = document.createElement("div");
    title.className = "dbot-title";
    title.textContent = titleOverride || "Clinic Assistant";

    const headerInner = document.createElement("div");
    headerInner.className = "dbot-header-inner";
    const avatar = document.createElement("div");
    avatar.className = "dbot-avatar";

    const actions = document.createElement("div");
    actions.className = "dbot-actions";

    const bookBtn = document.createElement("button");
    bookBtn.type = "button";
    bookBtn.className = "dbot-hbtn";
    bookBtn.textContent = "Book appointment";
    bookBtn.disabled = true;
    // storage for booking url
    bookBtn.dataset.bookingUrl = "";

    const leadBtn = document.createElement("button");
    leadBtn.type = "button";
    leadBtn.className = "dbot-hbtn";
    leadBtn.textContent = "Request callback";

    const clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "dbot-hbtn dbot-clear";
    clearBtn.textContent = "Clear";
    clearBtn.title = "Reset conversation";

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "dbot-close";
    closeBtn.textContent = "×";
    closeBtn.setAttribute("aria-label", "Close");

    actions.appendChild(bookBtn);
    actions.appendChild(leadBtn);
    actions.appendChild(clearBtn);
    headerInner.appendChild(avatar);
    headerInner.appendChild(title);
    header.appendChild(headerInner);
    header.appendChild(actions);
    header.appendChild(closeBtn);

    const messages = document.createElement("div");
    messages.className = "dbot-messages";

    const inputWrap = document.createElement("div");
    inputWrap.className = "dbot-input";

    const textarea = document.createElement("textarea");
    textarea.setAttribute("aria-label", "Chat input");
    textarea.placeholder = "Type your question…";

    const sendBtn = document.createElement("button");
    sendBtn.type = "button";
    sendBtn.textContent = "Send";
    sendBtn.className = "dbot-send-btn";

    inputWrap.appendChild(textarea);
    inputWrap.appendChild(sendBtn);

    const note = document.createElement("div");
    note.className = "dbot-note";
    note.textContent = "General information only. Not medical advice.";

    panel.appendChild(header);
    panel.appendChild(messages);
    panel.appendChild(inputWrap);
    panel.appendChild(note);

    // Lead modal
    const backdrop = document.createElement("div");
    backdrop.className = "dbot-modal-backdrop";
    backdrop.innerHTML = `
      <div class="dbot-modal" role="dialog" aria-modal="true">
        <div class="dbot-modal-h">
          <div>Request a callback</div>
          <button class="dbot-close" aria-label="Close">×</button>
        </div>
        <div class="dbot-modal-c">
          <div class="dbot-field">
            <label>Name (optional)</label>
            <input type="text" class="dbot-name" placeholder="Your name" />
          </div>
          <div class="dbot-field">
            <label>Phone (recommended)</label>
            <input type="text" class="dbot-phone" placeholder="+46 ..." />
          </div>
          <div class="dbot-field">
            <label>Email (optional)</label>
            <input type="text" class="dbot-email" placeholder="you@email.com" />
          </div>
          <div class="dbot-field">
            <label>Message (optional)</label>
            <textarea class="dbot-lead-msg" rows="3" placeholder="What is this about?"></textarea>
          </div>
          <div class="dbot-modal-actions">
            <button class="dbot-btn cancel">Cancel</button>
            <button class="dbot-btn primary submit">Send</button>
          </div>
          <div class="dbot-lead-status" style="font-size:12px;color:#444;"></div>
        </div>
      </div>
    `;

    // (Removed demo innerHTML and placeholder style block to avoid duplicate IDs)


    // append host to the scoped root and UI into the shadow root
    _root.appendChild(host);
    // apply theme color if provided
    if (themeColor) {
      try { host.style.setProperty('--dbot-accent', themeColor); } catch (e) {}
    }
    shadow.appendChild(launcher);
    shadow.appendChild(panel);
    shadow.appendChild(backdrop);

    // accessibility: announcements
    messages.setAttribute('role', 'log');
    messages.setAttribute('aria-live', 'polite');

    return { launcher, panel, messages, textarea, sendBtn, closeBtn, bookBtn, leadBtn, clearBtn, backdrop, title, avatar };
  }


  function addMessage(container, text, who) {
    // Special-case typing indicator to allow CSS animation
    if (String(text).trim() === "Typing…") {
      const tdiv = document.createElement("div");
      tdiv.className = `dbot-msg bot typing`;
      const span = document.createElement('span');
      span.textContent = 'Typing';
      const dots = document.createElement('span');
      dots.className = 'dots';
      tdiv.appendChild(span);
      tdiv.appendChild(dots);
      container.appendChild(tdiv);
      container.scrollTop = container.scrollHeight;
      return tdiv;
    }
    const div = document.createElement("div");
    div.className = `dbot-msg ${who}`;
    // Render message text with clickable links.
    // NOTE: this uses innerHTML to convert plain URLs into anchors.
    // The input originates from the clinic assistant / LLM; if you expect
    // untrusted HTML in messages, prefer a safer approach.
      try {
        // Use DOM-safe linkification to avoid injecting arbitrary HTML
        const frag = linkifyToFragment(String(text));
        div.appendChild(frag);
      } catch (e) {
        div.appendChild(document.createTextNode(String(text)));
      }
    container.appendChild(div);
    // render primary CTAs after assistant messages (high-conversion placement)
    if (who === 'bot') {
      const acts = document.createElement('div');
      acts.className = 'dbot-msg-actions';
      // Book appointment (uses available booking URL if present)
      const b = document.createElement('button');
      b.className = 'dbot-msg-action primary';
      b.type = 'button';
      b.textContent = '📅 Book appointment';
      const bookingUrl = (ui && ui.bookBtn && ui.bookBtn.dataset.bookingUrl) ? ui.bookBtn.dataset.bookingUrl : '';
      if (!bookingUrl) b.disabled = true;
      b.onclick = () => {
        try { trackEvent('cta_book', { clinic: clinicId, source: 'message' }); } catch (e) {}
        const url = (bookingUrl) || (ui && ui.bookBtn && ui.bookBtn.dataset.bookingUrl) || '';
        if (url) window.open(url, '_blank', 'noopener,noreferrer');
      };
      acts.appendChild(b);

      // Request callback (opens the slide-in lead modal)
      const cb = document.createElement('button');
      cb.className = 'dbot-msg-action';
      cb.type = 'button';
      cb.textContent = '📞 Request callback';
      cb.onclick = () => {
        try { trackEvent('cta_callback', { clinic: clinicId, source: 'message' }); } catch (e) {}
        try { openLeadModal(ui); } catch (e) { window.dispatchEvent(new CustomEvent('dbot_open_lead')); }
      };
      acts.appendChild(cb);
      container.appendChild(acts);
    }
    container.scrollTop = container.scrollHeight;
    return div;
  }


  function getSessionKey() {
    const key = `dbot_session_${clinicId}`;
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const created = `sess-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(key, created);
    return created;
  }

  async function fetchClinicPublic() {
    try {
      const res = await fetch(`${apiUrl}/public/clinic/${encodeURIComponent(clinicId)}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      try { console.warn('DentalBotWidget: fetchClinicPublic failed', e); } catch (err) {}
      return null;
    }
  }

  async function sendChat(ui, state) {
    const text = ui.textarea.value.trim();
    if (!text || state.sending) return;
    // enforce a reasonable length to avoid accidental huge messages
    if (text.length > 2000) {
      addMessage(ui.messages, 'Message too long. Please shorten to 2000 characters.', 'bot');
      return;
    }

    state.sending = true;
    ui.sendBtn.disabled = true;
    // send-button spinner
    ui.sendBtn.dataset._orig = ui.sendBtn.textContent;
    ui.sendBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Sending';
    ui.sendBtn.setAttribute('aria-busy','true');
    trackEvent('send', { clinic: clinicId });
    addMessage(ui.messages, text, "user");
    ui.textarea.value = "";

    // typing indicator (more explanatory for users)
    addMessage(ui.messages, "Typing…", "bot");

    try {
      const payload = {
        clinic_id: clinicId,
        message: text,
        session_id: state.sessionId,
        metadata: { page_url: location.href }
      };

      if (enableStream) {
        const res = await fetch(`${apiUrl}/chat?stream=1`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const typingErr = ui.messages.querySelector('.dbot-msg.bot.typing');
          if (typingErr) typingErr.remove();
          addMessage(ui.messages, `Server error ${res.status}`, "bot");
          trackEvent('error', { clinic: clinicId, status: res.status });
        } else {
          const reader = res.body.getReader();
          const dec = new TextDecoder();
          let buf = "";
          let acc = "";
          const typingEl = ui.messages.querySelector('.dbot-msg.bot.typing');
          try {
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              buf += dec.decode(value, { stream: true });
              const lines = buf.split('\n');
              buf = lines.pop();
              for (const line of lines) {
                // Handle standard JSON lines or SSE "data: {...}" lines
                const clean = line.replace(/^data: /, '').trim();
                if (!clean || clean === '[DONE]') continue;
                let obj;
                try { obj = JSON.parse(clean); } catch (e) { continue; }
                if (obj.text) {
                  acc += obj.text;
                  if (typingEl) typingEl.textContent = acc;
                } else if (obj.done) {
                    if (obj.booking_url) {
                    if (ui.bookBtn) {
                      ui.bookBtn.disabled = false;
                      ui.bookBtn.dataset.bookingUrl = obj.booking_url;
                      ui.bookBtn.onclick = function() { try { trackEvent('cta_book', { clinic: clinicId, source: 'header_stream' }); } catch (e) {} ; const url = this.dataset.bookingUrl; if (url) window.open(url, '_blank', 'noopener,noreferrer'); };
                    }
                  }
                } else if (obj.error) {
                  if (typingEl) typingEl.remove();
                  addMessage(ui.messages, "Error: " + obj.error, "bot");
                  trackEvent('error', { clinic: clinicId, message: obj.error });
                }
              }
            }
            // handle any remaining buffer
            if (buf.trim()) {
              try {
                const obj = JSON.parse(buf);
                if (obj.text) {
                  acc += obj.text;
                }
                if (obj.done && obj.booking_url) {
                  if (ui.bookBtn) {
                    ui.bookBtn.disabled = false;
                    ui.bookBtn.dataset.bookingUrl = obj.booking_url;
                    ui.bookBtn.onclick = function() { try { trackEvent('cta_book', { clinic: clinicId, source: 'header_stream' }); } catch (e) {} ; const url = this.dataset.bookingUrl; if (url) window.open(url, '_blank', 'noopener,noreferrer'); };
                  }
                }
              } catch (e) {}
            }

            const typingBubble = ui.messages.querySelector('.dbot-msg.bot.typing');
            if (typingBubble) typingBubble.remove();
            addMessage(ui.messages, acc || `Error: empty reply`, "bot");
            trackEvent('reply', { clinic: clinicId });
          } catch (err) {
            const typing = ui.messages.querySelector('.dbot-msg.bot.typing');
            if (typing) typing.remove();
            addMessage(ui.messages, "Network error. Please try again.", "bot");
            trackEvent('error', { clinic: clinicId, message: String(err) });
          }
        }
      } else {
        const res = await fetch(`${apiUrl}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        // remove typing bubble if present
        const typing = ui.messages.querySelector('.dbot-msg.bot.typing');
        if (typing) typing.remove();

        // Hard-wire booking URL from response (if provided)
        if (data && data.booking_url) {
          // enable header book button
          if (ui.bookBtn) {
            ui.bookBtn.disabled = false;
            ui.bookBtn.dataset.bookingUrl = data.booking_url;
            ui.bookBtn.onclick = function() { try { trackEvent('cta_book', { clinic: clinicId, source: 'header_reply' }); } catch (e) {} ; const url = this.dataset.bookingUrl; if (url) window.open(url, '_blank', 'noopener,noreferrer'); };
          }
        }

        trackEvent('reply', { clinic: clinicId });
        // Append the assistant reply
        addMessage(ui.messages, data.reply || `Error ${res.status}`, "bot");
      }
    } catch (err) {
      const typing = ui.messages.querySelector('.dbot-msg.bot.typing');
      if (typing) typing.remove();
      addMessage(ui.messages, "Network error. Please try again.", "bot");
      trackEvent('error', { clinic: clinicId, message: String(err) });
    } finally {
      state.sending = false;
      ui.sendBtn.disabled = false;
      // restore send button
      if (ui.sendBtn.dataset._orig) {
        ui.sendBtn.innerHTML = ui.sendBtn.dataset._orig;
        delete ui.sendBtn.dataset._orig;
        ui.sendBtn.removeAttribute('aria-busy');
      }
      ui.textarea.focus();
    }
  }

  function openLeadModal(ui) {
    ui.backdrop.style.display = "flex";
    const modal = ui.backdrop.querySelector(".dbot-modal");
    // slide-in
    modal.classList.add('open');
    const nameEl = modal.querySelector(".dbot-name");
    try { if (nameEl) nameEl.focus({ preventScroll: true }); } catch (e) { if (nameEl) nameEl.focus(); }
  }

  function closeLeadModal(ui) {
    const modal = ui.backdrop.querySelector(".dbot-modal");
    if (modal) modal.classList.remove('open');
    ui.backdrop.style.display = "none";
    ui.backdrop.querySelector(".dbot-lead-status").textContent = "";
  }

  async function submitLead(ui, state) {
    const name = ui.backdrop.querySelector(".dbot-name").value.trim() || null;
    const phone = ui.backdrop.querySelector(".dbot-phone").value.trim() || null;
    const email = ui.backdrop.querySelector(".dbot-email").value.trim() || null;
    const message = ui.backdrop.querySelector(".dbot-lead-msg").value.trim() || null;

    const status = ui.backdrop.querySelector(".dbot-lead-status");
    status.textContent = "Sending…";

    try {
      const res = await fetch(`${apiUrl}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinic_id: clinicId,
          session_id: state.sessionId,
          name,
          phone,
          email,
          message
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        status.textContent = `Error ${res.status}: ${data.detail || "Could not send"}`;
        return;
      }

      status.textContent = "Sent! The clinic will contact you.";
      // Non-blocking chat update
      try { addMessage(ui.messages, "We'll call you shortly — thank you!", 'bot'); } catch (e) {}
      try { trackEvent('lead_submitted', { clinic: clinicId, session: state.sessionId }); } catch (e) {}
      setTimeout(() => closeLeadModal(ui), 900);
    } catch (e) {
      status.textContent = "Network error. Please try again.";
    }
  }

  // INIT
  ensureStyleTag();
  // create a root container to avoid duplicates and to scope widget elements
  _root = document.getElementById('dbot-root') || document.createElement('div');
  _root.id = 'dbot-root';
  if (!_root.parentElement) document.body.appendChild(_root);
  const ui = createElements();
  // set modal aria-labelledby for accessibility
  try {
    const modal = ui.backdrop.querySelector('.dbot-modal');
    const modalTitle = modal && modal.querySelector('.dbot-modal-h > div');
    if (modal && modalTitle) {
      modalTitle.id = 'dbot-modal-title';
      modal.setAttribute('aria-labelledby', 'dbot-modal-title');
    }
  } catch (e) {}
  // Note: removed separate panel CTA to avoid duplicate booking CTAs.
  // The header `bookBtn` is the single prominent booking control.

  const state = { sessionId: getSessionKey(), sending: false, clinic: null };

  // open/close helpers
  function openPanel() {
    if (!ui.panel.classList.contains('open')) {
      ui.panel.classList.add('open');
      trackEvent('open', { clinic: clinicId });
      if (ui.messages.childElementCount === 0) {
        addMessage(ui.messages, "Welcome! I can help you find opening hours, services, prices or book an appointment. Ask me anything!", "bot");
      }
      try {
        // smoothly bring the panel into view and focus the textarea without scrolling the page caret
        const host = document.getElementById('dbot-host');
        if (host) host.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch (e) {}
      try { ui.textarea.focus({ preventScroll: true }); } catch (e) { ui.textarea.focus(); }
    }
  }

  function closePanel() {
    if (ui.panel.classList.contains('open')) {
      ui.panel.classList.remove('open');
      trackEvent('close', { clinic: clinicId });
    }
  }

  function togglePanel() {
    if (ui.panel.classList.contains('open')) closePanel(); else openPanel();
  }

  ui.launcher.onclick = togglePanel;
  ui.closeBtn.onclick = closePanel;

  // expose a tiny global API for host pages to open/close the widget programmatically
  try {
    window.DentalBot = window.DentalBot || {};
    window.DentalBot.open = openPanel;
    window.DentalBot.close = closePanel;
    window.DentalBot.toggle = togglePanel;
  } catch (e) {}

  // send
  ui.sendBtn.onclick = () => sendChat(ui, state);
  ui.textarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChat(ui, state);
    }
  });

  // lead modal controls
  ui.leadBtn.onclick = () => { try { trackEvent('cta_callback', { clinic: clinicId, source: 'header' }); } catch (e) {} ; openLeadModal(ui); };
  ui.clearBtn.onclick = () => {
    if (ui.messages.childElementCount > 0 && confirm("Start a new conversation?")) {
      ui.messages.innerHTML = "";
      state.sessionId = `sess-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      localStorage.setItem(`dbot_session_${clinicId}`, state.sessionId);
      addMessage(ui.messages, "Conversation cleared. How can I help you?", "bot");
      trackEvent('clear_chat', { clinic: clinicId });
    }
  };
  ui.backdrop.addEventListener("click", (e) => {
    if (e.target === ui.backdrop) closeLeadModal(ui);
  });
  ui.backdrop.querySelector(".cancel").onclick = () => closeLeadModal(ui);
  ui.backdrop.querySelector(".dbot-modal-h .dbot-close").onclick = () => closeLeadModal(ui);
  ui.backdrop.querySelector(".submit").onclick = () => submitLead(ui, state);

  // Global key handler: Esc closes modal or panel
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      try {
        const modal = ui.backdrop && ui.backdrop.querySelector && ui.backdrop.querySelector('.dbot-modal');
        if (modal && modal.classList.contains('open')) {
          closeLeadModal(ui);
          return;
        }
      } catch (err) {}
      if (ui.panel.classList.contains('open')) {
        ui.panel.classList.remove('open');
        ui.launcher.focus();
      }
    }
  });

  // fetch clinic info for book button + title
  fetchClinicPublic().then((c) => {
    if (!c) return;
    state.clinic = c;
    ui.title.textContent = c.clinic_name || "Clinic Assistant";
    if (c.booking_url) {
      ui.bookBtn.disabled = false;
      ui.bookBtn.dataset.bookingUrl = c.booking_url;
      ui.bookBtn.onclick = function() {
        try { trackEvent('cta_book', { clinic: clinicId, source: 'header' }); } catch (e) {}
        const url = this.dataset.bookingUrl; if (url) window.open(url, '_blank', 'noopener,noreferrer');
      };
    }
    // set avatar to clinic logo when available
    if (c.logo_url && ui.avatar) {
      ui.avatar.style.backgroundImage = `url(${c.logo_url})`;
      ui.avatar.style.backgroundSize = 'cover';
      ui.avatar.style.backgroundPosition = 'center';
    }
  });
})();
