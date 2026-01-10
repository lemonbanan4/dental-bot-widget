// ------------------------------------------------------------------
// CANONICAL SOURCE: dental-bot-widget (Vercel)
// ------------------------------------------------------------------
console.log("DentalBot Widget LIVE — v1.2.2", new Date().toISOString());

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
  const autoOpenMobile = (script?.dataset?.autoOpenMobile === '1' || script?.dataset?.autoOpenMobile === 'true');
  const enableSound = (script?.dataset?.sound === '1' || script?.dataset?.sound === 'true');
  const autoOpenScroll = (script?.dataset?.autoOpenScroll === '1' || script?.dataset?.autoOpenScroll === 'true');
  const welcomeMessageOverride = (script?.dataset?.welcome || "").trim();
  const avatarOverride = (script?.dataset?.avatar || "").trim();

  console.log("Dental bot widget loaded");
  console.log("API:", apiUrl);
  console.log("Clinic:", clinicId);

  if (!apiUrl || !clinicId) {
    console.warn("DentalBotWidget: missing data-api or data-clinic on script tag", { apiUrl, clinicId });
    return;
  }

  const styles = `
    :host {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      gap: 16px;
      pointer-events: none;
    }
    .dbot-launcher{pointer-events:auto;background:#111;color:#fff;border:none;border-radius:999px;padding:12px 16px;
      font:600 14px/1.2 system-ui,-apple-system,sans-serif;cursor:pointer;box-shadow:0 10px 30px rgba(0,0,0,0.15);
      display:flex;align-items:center;justify-content:center;transition:transform .12s ease,box-shadow .12s ease}
    .dbot-launcher:hover{transform:translateY(-2px);box-shadow:0 18px 40px rgba(2,6,23,0.16)}
    .dbot-launcher.typing::after{content:".";animation:dots 1s steps(3,end) infinite;margin-left:2px}
    .dbot-tooltip{position:absolute;bottom:100%;right:0;margin-bottom:12px;background:#111;color:#fff;padding:8px 12px;border-radius:8px;font-size:13px;font-weight:600;white-space:nowrap;box-shadow:0 4px 15px rgba(0,0,0,0.15);display:none;opacity:0;transform:translateY(4px);transition:opacity .2s,transform .2s;pointer-events:none}
    .dbot-tooltip.visible{display:block;opacity:1;transform:translateY(0)}
    .dbot-tooltip::after{content:"";position:absolute;top:100%;right:20px;border:6px solid transparent;border-top-color:#111}
    
    /* --- WIDGET CARD --- */
    .widget-card{width:380px;height:600px;max-height:calc(100vh - 100px);max-width:calc(100vw - 40px);background:#fff;border-radius:16px;box-shadow:0 12px 40px rgba(0,0,0,0.15);display:flex;flex-direction:column;overflow:hidden;transition:all 0.3s cubic-bezier(0.16,1,0.3,1);opacity:0;transform:translateY(20px) scale(0.95);pointer-events:none;transform-origin:bottom right;margin-bottom:0}
    .widget-card.open{opacity:1;transform:translateY(0) scale(1);pointer-events:all}
    
    /* --- HEADER --- */
    .header{background:#0d9488;padding:16px;display:flex;align-items:center;justify-content:space-between;color:white;flex-shrink:0}
    .header-left{display:flex;align-items:center;gap:12px}
    .avatar{width:40px;height:40px;background:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;color:#0d9488;background-size:cover;background-position:center}
    .bot-info h3{margin:0;font-size:16px;font-weight:700}
    .bot-info span{font-size:12px;opacity:0.9}
    .header-actions{display:flex;gap:8px}
    .icon-btn{background:none;border:none;cursor:pointer;color:white;padding:6px;border-radius:50%;transition:background 0.2s;display:flex;align-items:center;justify-content:center}
    .icon-btn:hover{background:rgba(255,255,255,0.2)}

    /* --- CONTENT AREA --- */
    .content-area{position:relative;flex:1;overflow:hidden;background:#f8fafc;display:flex}
    .content-area.show-settings .view-chat{transform:translateX(-20%);filter:blur(2px)}
    .content-area.show-settings .view-settings{transform:translateX(0)}

    /* --- VIEW: CHAT --- */
    .view-chat{position:absolute;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;transition:transform 0.3s ease,filter 0.3s ease;background:#f8fafc}
    .chat-messages{flex:1;padding:20px;overflow-y:auto;display:flex;flex-direction:column;gap:16px}
    .ai-disclaimer{font-size:11px;color:#64748b;background:#f1f5f9;padding:10px;border-radius:8px;margin-bottom:10px;line-height:1.4;border:1px solid #e2e8f0}
    .message{max-width:85%;padding:12px 16px;border-radius:12px;font-size:14px;line-height:1.5;word-break:break-word}
    .message.bot{background:white;color:#1e293b;border-bottom-left-radius:4px;box-shadow:0 2px 4px rgba(0,0,0,0.05)}
    .message.user{background:#0d9488;color:white;align-self:flex-end;border-bottom-right-radius:4px}
    .message.typing{font-style:italic;color:#666;opacity:0.8}
    .message.typing::after{content:".";animation:dots 1s steps(3,end) infinite}
    @keyframes dots{0%{content:"."}33%{content:".."}66%{content:"..."}100%{content:"."}}
    .message a{color:inherit;text-decoration:underline}
    
    .chat-input-area{padding:16px;background:white;border-top:1px solid #e2e8f0;display:flex;gap:10px;align-items:flex-end}
    .chat-input{flex:1;border:1px solid #cbd5e1;border-radius:20px;padding:10px 16px;outline:none;font-size:14px;font-family:inherit;resize:none;min-height:44px;max-height:120px}
    .chat-input:focus{border-color:#0d9488}
    .send-btn{background:#0d9488;color:white;border:none;width:40px;height:40px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background 0.2s}
    .send-btn:hover{background:#0f766e}
    .send-btn:disabled{opacity:0.7;cursor:not-allowed}

    /* --- VIEW: SETTINGS --- */
    .view-settings{position:absolute;top:0;left:0;width:100%;height:100%;background:#f8fafc;z-index:10;transform:translateX(100%);transition:transform 0.3s ease;padding:30px;display:flex;flex-direction:column;box-sizing:border-box}
    .settings-btn{display:flex;align-items:center;width:100%;background:white;border:1px solid #e2e8f0;padding:16px;margin-bottom:12px;border-radius:12px;font-weight:600;color:#334155;cursor:pointer;transition:all 0.2s;box-shadow:0 2px 4px rgba(0,0,0,0.02);font-size:14px}
    .settings-btn:hover{border-color:#0d9488;color:#0d9488;transform:translateY(-2px);box-shadow:0 4px 6px rgba(13, 148, 136, 0.1)}
    .settings-btn.primary{background:#0d9488;color:white;border:none;justify-content:center;margin-top:auto}
    .settings-btn.primary:hover{background:#0f766e;color:white}
    .powered-by{text-align:center;font-size:10px;color:#94a3b8;margin-top:10px}

    /* --- ACTIONS & MODAL --- */
    .dbot-msg-actions{display:flex;gap:8px;margin-top:8px}
    .dbot-msg-action{background:#fff;border:1px solid #e2e8f0;padding:8px 12px;border-radius:8px;font-size:13px;font-weight:600;color:#0d9488;cursor:pointer;transition:all 0.2s}
    .dbot-msg-action:hover{background:#f0fdfa;border-color:#0d9488}
    .dbot-msg-action.primary{background:#0d9488;color:white;border-color:#0d9488}
    .dbot-msg-action.primary:hover{background:#0f766e}
    .dbot-msg-action:disabled{opacity:.6;cursor:not-allowed}
    .dbot-feedback{display:flex;gap:6px;margin-top:6px;justify-content:flex-end;border-top:1px solid rgba(0,0,0,0.05);padding-top:4px}
    .dbot-feedback-btn{background:transparent;border:none;cursor:pointer;font-size:12px;padding:2px 4px;opacity:0.4;transition:all .2s;border-radius:4px}
    .dbot-feedback-btn:hover{opacity:1;background:rgba(0,0,0,0.05)}
    .dbot-feedback-btn.selected{opacity:1;background:rgba(0,0,0,0.1)}
    /* Lead slide-in panel: non-blocking, anchored near the widget */
    .dbot-modal-backdrop{position:fixed;right:20px;bottom:80px;width:360px;display:none;z-index:1000000;pointer-events:auto;display:none;align-items:flex-end;justify-content:flex-end}
    .dbot-modal{width:100%;background:#fff;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,0.3);overflow:hidden;border:1px solid #e5e7eb;transform:translateY(12px);transition:transform .18s ease,opacity .18s ease}
    .dbot-modal.open{transform:translateY(0)}
    .dbot-modal-h{padding:12px;background:#0d9488;color:#fff;font-weight:700;display:flex;justify-content:space-between;align-items:center}
    .dbot-modal-c{padding:12px;display:flex;flex-direction:column;gap:10px}
    .dbot-field{display:flex;flex-direction:column;gap:6px}
    .dbot-field label{font-size:12px;color:#444;font-weight:700}
    .dbot-field input,.dbot-field textarea{border:1px solid #d1d5db;border-radius:8px;padding:10px;font:inherit;outline:none}
    .dbot-modal-actions{display:flex;gap:8px;justify-content:flex-end}
    .dbot-btn{border-radius:8px;padding:8px 12px;font-weight:700;cursor:pointer;border:1px solid #ddd;background:#fff}
    .dbot-btn.primary{background:#0d9488;color:#fff;border-color:#0d9488}
    .dbot-close{background:transparent;border:none;color:white;font-size:20px;cursor:pointer}
    
    .spinner{display:inline-block;width:14px;height:14px;border-radius:50%;border:2px solid rgba(255,255,255,0.25);border-top-color:#fff;vertical-align:middle;margin-right:8px;animation:spin .8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    @media (max-width: 600px) {
      .widget-card { right:0; bottom:0; top:0; left:0; width:100%; height:100%; max-width:none; max-height:none; border-radius:0; }
    }
    @media (prefers-color-scheme: dark) {
      .widget-card, .view-chat, .view-settings, .content-area { background: #1f1f1f; color: #e5e5e5; }
      .header { background: #111; border-bottom: 1px solid #333; }
      .message.bot { background: #2d2d2d; color: #e5e5e5; }
      .chat-input-area { background: #1f1f1f; border-color: #333; }
      .chat-input { background: #2d2d2d; color: #fff; border-color: #404040; }
      .settings-btn { background: #2d2d2d; border-color: #404040; color: #e5e5e5; }
      .ai-disclaimer { background: #2d2d2d; border-color: #333; color: #999; }
      .dbot-modal { background: #1f1f1f; border-color: #333; }
      .dbot-modal-h { background: #111; }
      .dbot-field input, .dbot-field textarea { background: #2d2d2d; color: #fff; border-color: #404040; }
      .dbot-btn { background: #2d2d2d; color: #fff; border-color: #404040; }
      .dbot-tooltip { background: #333; }
      .dbot-tooltip::after { border-top-color: #333; }
      .dbot-feedback-btn:hover { background: rgba(255,255,255,0.1); }
      .dbot-feedback-btn.selected { background: rgba(255,255,255,0.2); }
    }
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

  function playSound() {
    if (!enableSound) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {}
  }

  function saveHistory() {
    if (!clinicId) return;
    const history = [];
    const msgs = ui.messages.querySelectorAll('.message');
    msgs.forEach(msg => {
      if (msg.classList.contains('typing')) return;
      const who = msg.classList.contains('user') ? 'user' : 'bot';
      const clone = msg.cloneNode(true);
      const fb = clone.querySelector('.dbot-feedback');
      if (fb) fb.remove();
      const text = clone.innerText.trim();
      if (text) history.push({ text, who });
    });
    try { localStorage.setItem(`dbot_history_${clinicId}`, JSON.stringify(history)); } catch (e) {}
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem(`dbot_history_${clinicId}`);
      if (raw) {
        const history = JSON.parse(raw);
        if (Array.isArray(history)) {
          history.forEach(h => addMessage(ui.messages, h.text, h.who, false));
        }
      }
    } catch (e) {}
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

    const tooltip = document.createElement("div");
    tooltip.className = "dbot-tooltip";
    tooltip.textContent = "New Message";
    launcher.appendChild(tooltip);

    // --- WIDGET CARD ---
    const panel = document.createElement("div"); // "panel" var name kept for compatibility
    panel.className = "widget-card";

    // --- HEADER ---
    const header = document.createElement("div");
    header.className = "header";

    const headerLeft = document.createElement("div");
    headerLeft.className = "header-left";

    const avatar = document.createElement("div");
    avatar.className = "avatar";
    avatar.textContent = "🤖";
    if (avatarOverride) {
      avatar.style.backgroundImage = `url(${avatarOverride})`;
      avatar.textContent = "";
    }

    const botInfo = document.createElement("div");
    botInfo.className = "bot-info";
    const title = document.createElement("h3");
    title.textContent = titleOverride || "DentalBot";
    const status = document.createElement("span");
    status.textContent = "Online";
    botInfo.appendChild(title);
    botInfo.appendChild(status);

    headerLeft.appendChild(avatar);
    headerLeft.appendChild(botInfo);

    const headerActions = document.createElement("div");
    headerActions.className = "header-actions";

    const settingsBtn = document.createElement("button");
    settingsBtn.className = "icon-btn";
    settingsBtn.title = "Settings";
    settingsBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`;

    const closeBtn = document.createElement("button");
    closeBtn.className = "icon-btn";
    closeBtn.title = "Minimize";
    closeBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>`;

    headerActions.appendChild(settingsBtn);
    headerActions.appendChild(closeBtn);
    header.appendChild(headerLeft);
    header.appendChild(headerActions);

    // --- CONTENT AREA ---
    const contentArea = document.createElement("div");
    contentArea.className = "content-area";

    // VIEW 1: CHAT
    const viewChat = document.createElement("div");
    viewChat.className = "view-chat";

    const messages = document.createElement("div");
    messages.className = "chat-messages";
    
    const disclaimer = document.createElement("div");
    disclaimer.className = "ai-disclaimer";
    disclaimer.innerHTML = "<strong>Note:</strong> Please do not share sensitive personal data.";
    messages.appendChild(disclaimer);

    const inputWrap = document.createElement("div");
    inputWrap.className = "chat-input-area";

    const textarea = document.createElement("textarea");
    textarea.className = "chat-input";
    textarea.placeholder = "Ask a question...";
    textarea.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = this.scrollHeight + 'px';
    });

    const sendBtn = document.createElement("button");
    sendBtn.type = "button";
    sendBtn.innerHTML = "➤";
    sendBtn.className = "send-btn";

    inputWrap.appendChild(textarea);
    inputWrap.appendChild(sendBtn);

    viewChat.appendChild(messages);
    viewChat.appendChild(inputWrap);

    // VIEW 2: SETTINGS
    const viewSettings = document.createElement("div");
    viewSettings.className = "view-settings";
    viewSettings.innerHTML = `<h2 style="margin:0 0 20px 0;color:#1e293b;font-size:1.25rem;">Settings</h2>`;

    const restartBtn = document.createElement("button");
    restartBtn.className = "settings-btn";
    restartBtn.textContent = "🔄 Restart Conversation";

    const clearBtn = document.createElement("button");
    clearBtn.className = "settings-btn";
    clearBtn.textContent = "🗑️ Clear Chat History";

    const backBtn = document.createElement("button");
    backBtn.className = "settings-btn primary";
    backBtn.textContent = "Back to Chat";

    const poweredBy = document.createElement("div");
    poweredBy.className = "powered-by";
    poweredBy.innerHTML = "Powered by <strong>Lemon Techno</strong>";

    viewSettings.appendChild(restartBtn);
    viewSettings.appendChild(clearBtn);
    viewSettings.appendChild(backBtn);
    viewSettings.appendChild(poweredBy);

    contentArea.appendChild(viewChat);
    contentArea.appendChild(viewSettings);

    panel.appendChild(header);
    panel.appendChild(contentArea);

    // --- LOGIC WIRING ---
    settingsBtn.onclick = () => contentArea.classList.add('show-settings');
    backBtn.onclick = () => contentArea.classList.remove('show-settings');

    // Hidden "Book" button logic storage (since UI changed)
    const bookBtn = document.createElement("button"); // Virtual button for logic
    bookBtn.dataset.bookingUrl = "";
    
    // Lead button logic (virtual)
    const leadBtn = document.createElement("button");

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

    return { launcher, panel, messages, textarea, sendBtn, closeBtn, bookBtn, leadBtn, clearBtn, restartBtn, backdrop, title, avatar, tooltip };
  }


  function addMessage(container, text, who, save = true) {
    // Special-case typing indicator to allow CSS animation
    if (String(text).trim() === "Typing…") {
      const tdiv = document.createElement("div");
      tdiv.className = `message typing`;
      tdiv.textContent = "Typing";
      container.appendChild(tdiv);
      container.scrollTop = container.scrollHeight;
      return tdiv;
    }
    const div = document.createElement("div");
    div.className = `message ${who}`;
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

    // Add feedback buttons for bot messages
    if (who === 'bot') {
      const fb = document.createElement('div');
      fb.className = 'dbot-feedback';
      
      const btnCopy = document.createElement('button');
      btnCopy.className = 'dbot-feedback-btn';
      btnCopy.textContent = 'Copy';
      btnCopy.title = 'Copy text';
      btnCopy.onclick = async function() {
        try {
          await navigator.clipboard.writeText(text);
          const original = this.textContent;
          this.textContent = '✅';
          setTimeout(() => { this.textContent = original; }, 2000);
          try { trackEvent('copy', { clinic: clinicId }); } catch (e) {}
        } catch (e) {}
      };

      const btnUp = document.createElement('button');
      btnUp.className = 'dbot-feedback-btn';
      btnUp.textContent = '👍';
      btnUp.title = 'Helpful';
      btnUp.onclick = function() {
        if (this.classList.contains('selected') || btnDown.classList.contains('selected')) return;
        this.classList.add('selected');
        try { trackEvent('feedback', { clinic: clinicId, type: 'up', message: text.substring(0, 50) }); } catch (e) {}
      };

      const btnDown = document.createElement('button');
      btnDown.className = 'dbot-feedback-btn';
      btnDown.textContent = '👎';
      btnDown.title = 'Not helpful';
      btnDown.onclick = function() {
        if (this.classList.contains('selected') || btnUp.classList.contains('selected')) return;
        this.classList.add('selected');
        try { trackEvent('feedback', { clinic: clinicId, type: 'down', message: text.substring(0, 50) }); } catch (e) {}
      };

      fb.appendChild(btnCopy);
      fb.appendChild(btnUp);
      fb.appendChild(btnDown);
      div.appendChild(fb);
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
      if (enableSound) playSound();
      if (ui && ui.panel && !ui.panel.classList.contains('open') && ui.tooltip) {
        ui.tooltip.classList.add('visible');
      }
    }
    container.scrollTop = container.scrollHeight;
    if (save) saveHistory();
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
    ui.launcher.classList.add('typing');
    // send-button spinner
    ui.sendBtn.dataset._orig = ui.sendBtn.textContent;
    ui.sendBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span>';
    ui.sendBtn.setAttribute('aria-busy','true');
    trackEvent('send', { clinic: clinicId });
    addMessage(ui.messages, text, "user");
    ui.textarea.value = "";
    ui.textarea.style.height = "auto";

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
          const typingErr = ui.messages.querySelector('.message.typing');
          if (typingErr) typingErr.remove();
          addMessage(ui.messages, `Server error ${res.status}`, "bot");
          trackEvent('error', { clinic: clinicId, status: res.status });
        } else {
          const reader = res.body.getReader();
          const dec = new TextDecoder();
          let buf = "";
          let acc = "";
          const typingEl = ui.messages.querySelector('.message.typing');
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

            const typingBubble = ui.messages.querySelector('.message.typing');
            if (typingBubble) typingBubble.remove();
            addMessage(ui.messages, acc || `Error: empty reply`, "bot");
            trackEvent('reply', { clinic: clinicId });
          } catch (err) {
            const typing = ui.messages.querySelector('.message.typing');
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
        const typing = ui.messages.querySelector('.message.typing');
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
      const typing = ui.messages.querySelector('.message.typing');
      if (typing) typing.remove();
      addMessage(ui.messages, "Network error. Please try again.", "bot");
      trackEvent('error', { clinic: clinicId, message: String(err) });
    } finally {
      state.sending = false;
      ui.sendBtn.disabled = false;
      ui.launcher.classList.remove('typing');
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
    // Pre-fill name if previously saved
    try {
      const savedName = localStorage.getItem(`dbot_lead_name_${clinicId}`);
      if (nameEl && !nameEl.value && savedName) {
        nameEl.value = savedName;
      }
    } catch (e) {}
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

      // Save name for next time
      if (name) {
        try { localStorage.setItem(`dbot_lead_name_${clinicId}`, name); } catch (e) {}
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

  // Load history before initializing state or opening panel
  loadHistory();

  const state = { sessionId: getSessionKey(), sending: false, clinic: null, unreadCount: 0 };

  // open/close helpers
  function openPanel() {
    if (!ui.panel.classList.contains('open')) {
      ui.panel.classList.add('open');
      if (ui.tooltip) {
        ui.tooltip.classList.remove('visible');
      }
      trackEvent('open', { clinic: clinicId });
      // Check if only disclaimer exists (child count 1)
      if (ui.messages.querySelectorAll('.message').length === 0) {
        if (welcomeMessageOverride) {
          addMessage(ui.messages, welcomeMessageOverride, "bot");
        } else {
          const hour = new Date().getHours();
          let greeting = "Welcome";
          if (hour < 12) greeting = "Good morning";
          else if (hour < 18) greeting = "Good afternoon";
          else greeting = "Good evening";
          addMessage(ui.messages, `${greeting}! I can help you find opening hours, services, prices or book an appointment. Ask me anything!`, "bot");
        }
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
  
  const resetHandler = () => {
    if (confirm("Start a new conversation?")) {
      // Keep disclaimer
      const disclaimer = ui.messages.querySelector('.ai-disclaimer');
      ui.messages.innerHTML = "";
      if (disclaimer) ui.messages.appendChild(disclaimer);
      state.sessionId = `sess-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      localStorage.setItem(`dbot_session_${clinicId}`, state.sessionId);
      localStorage.removeItem(`dbot_history_${clinicId}`);
      addMessage(ui.messages, "Conversation cleared. How can I help you?", "bot");
      trackEvent('clear_chat', { clinic: clinicId });
    }
  };
  ui.clearBtn.onclick = resetHandler;
  ui.restartBtn.onclick = resetHandler;

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
    ui.title.textContent = c.clinic_name || "DentalBot";
    if (c.booking_url) {
      ui.bookBtn.disabled = false;
      ui.bookBtn.dataset.bookingUrl = c.booking_url;
      ui.bookBtn.onclick = function() {
        try { trackEvent('cta_book', { clinic: clinicId, source: 'header' }); } catch (e) {}
        const url = this.dataset.bookingUrl; if (url) window.open(url, '_blank', 'noopener,noreferrer');
      };
      // Re-enable any booking buttons in the restored history
      const historyBtns = ui.messages.querySelectorAll('.dbot-msg-action.primary:disabled');
      historyBtns.forEach(btn => btn.disabled = false);
    }
    // set avatar to clinic logo when available
    if (c.logo_url && ui.avatar && !avatarOverride) {
      ui.avatar.style.backgroundImage = `url(${c.logo_url})`;
      ui.avatar.textContent = "";
    }
  });

  // Auto-open on mobile if configured
  if (autoOpenMobile && window.innerWidth <= 768) {
    setTimeout(openPanel, 1000);
  }

  // Auto-open on scroll to bottom
  if (autoOpenScroll) {
    const onScroll = () => {
      // Check if near bottom (within 50px)
      if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 50) {
        openPanel();
        window.removeEventListener('scroll', onScroll);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }
})();
