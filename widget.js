(() => {
  const script = document.currentScript;
  const apiUrl = (script?.dataset?.api || "").replace(/\/$/, "");
  const clinicId = (script?.dataset?.clinic || "").trim();

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
      background:#fff;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,0.25);display:none;flex-direction:column;overflow:hidden;border:1px solid #e5e7eb;z-index:999999;
      font:14px/1.4 system-ui,-apple-system,sans-serif}
    .dbot-panel.open{display:flex}
    .dbot-header{padding:10px 12px;background:#111;color:#fff;display:flex;align-items:center;justify-content:space-between;gap:10px}
    .dbot-title{font-weight:700;font-size:13px}
    .dbot-actions{display:flex;gap:8px;align-items:center}
    .dbot-hbtn{background:#fff;color:#111;border:1px solid rgba(255,255,255,0.35);border-radius:10px;padding:6px 10px;cursor:pointer;font-weight:600;font-size:12px}
    .dbot-hbtn:disabled{opacity:.5;cursor:not-allowed}
    .dbot-close{background:transparent;color:#fff;border:none;font-size:18px;cursor:pointer;line-height:1}
    .dbot-messages{flex:1;padding:12px;overflow-y:auto;gap:8px;display:flex;flex-direction:column;background:#fafafa}
    .dbot-msg{padding:10px 12px;border-radius:12px;max-width:90%;white-space:pre-wrap;word-break:break-word}
    .dbot-msg.user{background:#111;color:#fff;align-self:flex-end;border-bottom-right-radius:6px}
    .dbot-msg.bot{background:#fff;color:#111;align-self:flex-start;border:1px solid #e6e6e6;border-bottom-left-radius:6px}
    .dbot-msg a{color:inherit;text-decoration:underline}
    .dbot-input{display:flex;padding:10px;gap:8px;border-top:1px solid #e5e7eb;background:#fff}
    .dbot-input textarea{flex:1;resize:none;border:1px solid #d1d5db;border-radius:10px;padding:10px;min-height:44px;font:inherit;outline:none}
    .dbot-input button{background:#111;color:#fff;border:none;padding:10px 12px;border-radius:10px;cursor:pointer;font-weight:700}
    .dbot-note{font-size:11px;color:#666;padding:0 12px 10px;background:#fff}
    .dbot-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.45);display:none;align-items:center;justify-content:center;z-index:999999}
    .dbot-modal{width:360px;max-width:calc(100vw - 40px);background:#fff;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,0.3);overflow:hidden;border:1px solid #e5e7eb}
    .dbot-modal-h{padding:12px 12px;background:#111;color:#fff;font-weight:800;display:flex;justify-content:space-between;align-items:center}
    .dbot-modal-c{padding:12px;display:flex;flex-direction:column;gap:10px}
    .dbot-field{display:flex;flex-direction:column;gap:6px}
    .dbot-field label{font-size:12px;color:#444;font-weight:700}
    .dbot-field input,.dbot-field textarea{border:1px solid #d1d5db;border-radius:10px;padding:10px;font:inherit;outline:none}
    .dbot-modal-actions{display:flex;gap:8px;justify-content:flex-end}
    .dbot-btn{border-radius:10px;padding:10px 12px;font-weight:800;cursor:pointer;border:1px solid #ddd;background:#fff}
    .dbot-btn.primary{background:#111;color:#fff;border-color:#111}
  `;

  function ensureStyleTag() {
    if (document.getElementById("dbot-styles")) return;
    const tag = document.createElement("style");
    tag.id = "dbot-styles";
    tag.textContent = styles;
    document.head.appendChild(tag);
  }

  function linkifyToFragment(text) {
    const urlRegex = /(https?:\/\/[^\s)]+)\b/g;
    const parts = text.split(urlRegex);
    const frag = document.createDocumentFragment();
    for (const part of parts) {
      if (urlRegex.test(part)) {
        const a = document.createElement("a");
        a.href = part;
        a.textContent = part;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        frag.appendChild(a);
      } else {
        frag.appendChild(document.createTextNode(part));
      }
    }
    return frag;
  }

  function createElements() {
    const launcher = document.createElement("button");
    launcher.className = "dbot-launcher";
    launcher.textContent = "Chat";

    const panel = document.createElement("div");
    panel.className = "dbot-panel";

    const header = document.createElement("div");
    header.className = "dbot-header";

    const title = document.createElement("div");
    title.className = "dbot-title";
    title.textContent = "Clinic Assistant";

    const actions = document.createElement("div");
    actions.className = "dbot-actions";

    const bookBtn = document.createElement("button");
    bookBtn.className = "dbot-hbtn";
    bookBtn.textContent = "Book";
    bookBtn.disabled = true;

    const leadBtn = document.createElement("button");
    leadBtn.className = "dbot-hbtn";
    leadBtn.textContent = "Call me back";

    const closeBtn = document.createElement("button");
    closeBtn.className = "dbot-close";
    closeBtn.textContent = "×";
    closeBtn.setAttribute("aria-label", "Close");

    actions.appendChild(bookBtn);
    actions.appendChild(leadBtn);
    header.appendChild(title);
    header.appendChild(actions);
    header.appendChild(closeBtn);

    const messages = document.createElement("div");
    messages.className = "dbot-messages";

    const inputWrap = document.createElement("div");
    inputWrap.className = "dbot-input";

    const textarea = document.createElement("textarea");
    textarea.placeholder = "Type your question…";

    const sendBtn = document.createElement("button");
    sendBtn.textContent = "Send";

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

    document.body.appendChild(launcher);
    document.body.appendChild(panel);
    document.body.appendChild(backdrop);

    return { launcher, panel, messages, textarea, sendBtn, closeBtn, bookBtn, leadBtn, backdrop, title };
  }

  function addMessage(container, text, who) {
    const div = document.createElement("div");
    div.className = `dbot-msg ${who}`;
    div.appendChild(linkifyToFragment(text));
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
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
    const res = await fetch(`${apiUrl}/public/clinic/${encodeURIComponent(clinicId)}`);
    if (!res.ok) return null;
    return await res.json();
  }

  async function sendChat(ui, state) {
    const text = ui.textarea.value.trim();
    if (!text || state.sending) return;

    state.sending = true;
    ui.sendBtn.disabled = true;
    addMessage(ui.messages, text, "user");
    ui.textarea.value = "";

    // typing indicator
    addMessage(ui.messages, "…", "bot");

    try {
      const payload = {
        clinic_id: clinicId,
        message: text,
        session_id: state.sessionId,
        metadata: { page_url: location.href }
      };

      const res = await fetch(`${apiUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      // replace last "…" bubble
      const bots = ui.messages.querySelectorAll(".dbot-msg.bot");
      const last = bots[bots.length - 1];
      if (last && last.textContent === "…") {
        last.textContent = "";
        last.appendChild(linkifyToFragment(data.reply || `Error ${res.status}`));
      } else {
        addMessage(ui.messages, data.reply || `Error ${res.status}`, "bot");
      }
    } catch (err) {
      const bots = ui.messages.querySelectorAll(".dbot-msg.bot");
      const last = bots[bots.length - 1];
      if (last && last.textContent === "…") {
        last.textContent = "Network error. Please try again.";
      } else {
        addMessage(ui.messages, "Network error. Please try again.", "bot");
      }
    } finally {
      state.sending = false;
      ui.sendBtn.disabled = false;
      ui.textarea.focus();
    }
  }

  function openLeadModal(ui) {
    ui.backdrop.style.display = "flex";
    const modal = ui.backdrop.querySelector(".dbot-modal");
    modal.querySelector(".dbot-name").focus();
  }

  function closeLeadModal(ui) {
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
      const res = await fetch(`${apiUrl}/lead`, {
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
      setTimeout(() => closeLeadModal(ui), 900);
    } catch (e) {
      status.textContent = "Network error. Please try again.";
    }
  }

  // INIT
  ensureStyleTag();
  const ui = createElements();
  const state = { sessionId: getSessionKey(), sending: false, clinic: null };

  // open/close
  ui.launcher.onclick = () => {
    ui.panel.classList.toggle("open");
    if (ui.panel.classList.contains("open") && ui.messages.childElementCount === 0) {
      addMessage(ui.messages, "Hi! I can help with opening hours, services, insurance, prices (ranges), and bookings.", "bot");
    }
    ui.textarea.focus();
  };
  ui.closeBtn.onclick = () => ui.panel.classList.remove("open");

  // send
  ui.sendBtn.onclick = () => sendChat(ui, state);
  ui.textarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChat(ui, state);
    }
  });

  // lead modal controls
  ui.leadBtn.onclick = () => openLeadModal(ui);
  ui.backdrop.addEventListener("click", (e) => {
    if (e.target === ui.backdrop) closeLeadModal(ui);
  });
  ui.backdrop.querySelector(".cancel").onclick = () => closeLeadModal(ui);
  ui.backdrop.querySelector(".dbot-modal-h .dbot-close").onclick = () => closeLeadModal(ui);
  ui.backdrop.querySelector(".submit").onclick = () => submitLead(ui, state);

  // fetch clinic info for book button + title
  fetchClinicPublic().then((c) => {
    if (!c) return;
    state.clinic = c;
    ui.title.textContent = c.clinic_name || "Clinic Assistant";
    if (c.booking_url) {
      ui.bookBtn.disabled = false;
      ui.bookBtn.onclick = () => window.open(c.booking_url, "_blank", "noopener,noreferrer");
    }
  });
})();
