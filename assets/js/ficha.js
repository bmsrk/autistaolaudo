/* ============================================================
   ficha.js — Lógica do criador de ficha interativo
   ============================================================ */

(function () {
  "use strict";

  /* ---- Configurações de atributos ---- */
  const ATTRS = [
    { id: "foco",        name: "Foco",        desc: "Concentração e atenção" },
    { id: "empatia",     name: "Empatia",      desc: "Conexão emocional" },
    { id: "comunicacao", name: "Comunicação",  desc: "Expressão e compreensão" },
    { id: "regulacao",   name: "Regulação",    desc: "Controle sensorial e emocional" },
    { id: "criatividade",name: "Criatividade", desc: "Pensamento fora do padrão" },
    { id: "persistencia",name: "Persistência", desc: "Determinação e constância" },
  ];

  const TOTAL_POINTS = 12;
  const MAX_ATTR = 4;
  const MIN_ATTR = 1;
  const OVERLOAD_MAX = 10;

  let state = {
    nome: "",
    idade: "",
    suporte: "",
    laudo: "",
    atributos: Object.fromEntries(ATTRS.map((a) => [a.id, 1])),
    interesses: [""],
    forcas: "",
    fraquezas: "",
    habilidades: "",
    sobrecarga: 0,
    inventario: "",
    historia: "",
  };
  let autoSaveTimer = null;

  /* ---- Inicializar pontos ---- */
  // Começa com cada atributo em 1 (total 6), restam 6 para distribuir
  function pontosUsados() {
    return Object.values(state.atributos).reduce((s, v) => s + v, 0);
  }
  function pontosRestantes() {
    return TOTAL_POINTS - pontosUsados() + ATTRS.length; // base is ATTRS.length × 1
    // Actually: total - used where used starts at ATTRS.length
  }

  // Simplified: total pool is TOTAL_POINTS, each starts at 1
  // So freely assignable = TOTAL_POINTS - ATTRS.length = 12 - 6 = 6
  // We'll track total used points including base
  function freePointsRemaining() {
    const used = pontosUsados(); // sum of all attr values
    return TOTAL_POINTS - used; // free points still to assign (attrs start at 1 = 6 base)
  }

  /* ---- DOM References ---- */
  let formEl, previewEl, pointsEl;

  function $(id) { return document.getElementById(id); }

  /* ---- Build form UI ---- */
  function buildAttrCards() {
    const container = $("attrs-container");
    if (!container) return;
    container.innerHTML = "";

    ATTRS.forEach((attr) => {
      const val = state.atributos[attr.id];

      const card = document.createElement("div");
      card.className = "attr-card";

      // Header (uses textContent so attr.name / attr.desc are never parsed as HTML)
      const header = document.createElement("div");
      header.className = "attr-header";
      const headerInner = document.createElement("div");
      const nameEl = document.createElement("div");
      nameEl.className = "attr-name";
      nameEl.textContent = attr.name;
      const descEl = document.createElement("div");
      descEl.style.cssText = "font-size:0.75rem;color:var(--text-muted)";
      descEl.textContent = attr.desc;
      headerInner.appendChild(nameEl);
      headerInner.appendChild(descEl);
      header.appendChild(headerInner);

      // Controls
      const controls = document.createElement("div");
      controls.className = "attr-controls";

      const minusBtn = document.createElement("button");
      minusBtn.className = "attr-btn";
      minusBtn.dataset.attr = attr.id;
      minusBtn.dataset.delta = "-1";
      minusBtn.setAttribute("aria-label", "Diminuir " + attr.name);
      minusBtn.textContent = "−";
      minusBtn.disabled = val <= MIN_ATTR;

      const valSpan = document.createElement("span");
      valSpan.className = "attr-value";
      valSpan.id = "attr-val-" + attr.id;
      valSpan.textContent = String(val);

      const plusBtn = document.createElement("button");
      plusBtn.className = "attr-btn";
      plusBtn.dataset.attr = attr.id;
      plusBtn.dataset.delta = "1";
      plusBtn.setAttribute("aria-label", "Aumentar " + attr.name);
      plusBtn.textContent = "+";
      plusBtn.disabled = val >= MAX_ATTR || freePointsRemaining() <= 0;

      controls.appendChild(minusBtn);
      controls.appendChild(valSpan);
      controls.appendChild(plusBtn);

      card.appendChild(header);
      card.appendChild(controls);
      container.appendChild(card);
    });
  }

  function updatePointsDisplay() {
    const el = $("points-remaining");
    if (!el) return;
    const rem = freePointsRemaining();
    el.textContent = rem;
    el.style.color = rem === 0 ? "var(--accent-yellow)" : rem < 0 ? "#ef4444" : "var(--accent-green)";

    // Update button states
    ATTRS.forEach((attr) => {
      const val = state.atributos[attr.id];
      const minusBtn = document.querySelector(`.attr-btn[data-attr="${attr.id}"][data-delta="-1"]`);
      const plusBtn  = document.querySelector(`.attr-btn[data-attr="${attr.id}"][data-delta="1"]`);
      if (minusBtn) minusBtn.disabled = val <= MIN_ATTR;
      if (plusBtn)  plusBtn.disabled  = val >= MAX_ATTR || rem <= 0;
    });
  }

  function buildInterestFields() {
    const container = $("interests-container");
    if (!container) return;
    container.innerHTML = "";

    state.interesses.forEach((val, idx) => {
      const row = document.createElement("div");
      row.className = "interest-item";

      const input = document.createElement("input");
      input.type = "text";
      input.className = "form-control interest-input";
      input.placeholder = "Ex: Astronomia, Trens, Minecraft…";
      input.value = val; // Safe: input.value sets the value property, not HTML
      input.dataset.idx = String(idx);
      input.setAttribute("aria-label", "Interesse especial " + (idx + 1));

      row.appendChild(input);

      if (state.interesses.length > 1) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "remove-btn remove-interest";
        btn.dataset.idx = String(idx);
        btn.setAttribute("aria-label", "Remover interesse");
        btn.textContent = "✕";
        row.appendChild(btn);
      }

      container.appendChild(row);
    });
  }

  /* ---- Event delegation for attribute buttons ---- */
  function initAttrButtons() {
    const container = $("attrs-container");
    if (!container) return;
    container.addEventListener("click", (e) => {
      const btn = e.target.closest(".attr-btn");
      if (!btn) return;
      const attrId = btn.dataset.attr;
      const delta  = parseInt(btn.dataset.delta, 10);
      const curr   = state.atributos[attrId];
      const next   = curr + delta;

      if (next < MIN_ATTR || next > MAX_ATTR) return;
      if (delta > 0 && freePointsRemaining() <= 0) return;

      state.atributos[attrId] = next;

      const valEl = $(`attr-val-${attrId}`);
      if (valEl) valEl.textContent = next;
      updatePointsDisplay();
      updatePreview();
      scheduleAutoSave();
    });
  }

  /* ---- Overload checkboxes ---- */
  function buildOverloadBar() {
    const container = $("overload-container");
    if (!container) return;
    container.innerHTML = "";

    const bar = document.createElement("div");
    bar.className = "overload-bar";
    bar.setAttribute("role", "group");
    bar.setAttribute("aria-label", "Nível de sobrecarga");

    for (let i = 1; i <= OVERLOAD_MAX; i++) {
      const id = `ol-${i}`;
      const input = document.createElement("input");
      input.type = "checkbox";
      input.className = "overload-box";
      input.id = id;
      input.value = i;
      input.checked = state.sobrecarga >= i;
      input.setAttribute("aria-label", `Sobrecarga ${i}`);

      const label = document.createElement("label");
      label.className = "overload-label";
      label.htmlFor = id;
      label.title = `Nível ${i}`;

      bar.appendChild(input);
      bar.appendChild(label);
    }

    container.appendChild(bar);

    container.addEventListener("change", (e) => {
      if (e.target.matches(".overload-box")) {
        const val = parseInt(e.target.value, 10);
        state.sobrecarga = e.target.checked ? val : val - 1;
        // sync all checkboxes
        container.querySelectorAll(".overload-box").forEach((cb) => {
          cb.checked = state.sobrecarga >= parseInt(cb.value, 10);
        });
        updatePreview();
        scheduleAutoSave();
      }
    });
  }

  /* ---- Bind form inputs ---- */
  function bindFormInputs() {
    const bindings = [
      { id: "nome",       key: "nome" },
      { id: "idade",      key: "idade" },
      { id: "laudo",      key: "laudo" },
      { id: "forcas",     key: "forcas" },
      { id: "fraquezas",  key: "fraquezas" },
      { id: "habilidades",key: "habilidades" },
      { id: "inventario", key: "inventario" },
      { id: "historia",   key: "historia" },
    ];

    bindings.forEach(({ id, key }) => {
      const el = $(id);
      if (!el) return;
      el.addEventListener("input", () => {
        state[key] = el.value;
        updatePreview();
        scheduleAutoSave();
      });
    });

    // Suporte radio buttons
    document.querySelectorAll('input[name="suporte"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        state.suporte = radio.value;
        updatePreview();
        scheduleAutoSave();
      });
    });

    // Interests (delegated)
    const interestsContainer = $("interests-container");
    if (interestsContainer) {
      interestsContainer.addEventListener("input", (e) => {
        if (e.target.matches(".interest-input")) {
          const idx = parseInt(e.target.dataset.idx, 10);
          state.interesses[idx] = e.target.value;
          updatePreview();
          scheduleAutoSave();
        }
      });

      interestsContainer.addEventListener("click", (e) => {
        const btn = e.target.closest(".remove-interest");
        if (!btn) return;
        const idx = parseInt(btn.dataset.idx, 10);
        state.interesses.splice(idx, 1);
        buildInterestFields();
        updatePreview();
        scheduleAutoSave();
      });
    }

    // Add interest button
    const addInterestBtn = $("add-interest");
    if (addInterestBtn) {
      addInterestBtn.addEventListener("click", () => {
        if (state.interesses.length >= 8) {
          showToast("Máximo de 8 interesses especiais!");
          return;
        }
        state.interesses.push("");
        buildInterestFields();
        scheduleAutoSave();
      });
    }
  }

  function suporteLabel(s) {
    const map = { "1": "Nível 1 — Precisa de algum apoio", "2": "Nível 2 — Precisa de apoio substancial", "3": "Nível 3 — Precisa de apoio muito substancial" };
    return map[s] || "—";
  }

  /* Create element with optional class and optional text content */
  function el(tag, cls, textContent) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (textContent !== undefined) e.textContent = textContent;
    return e;
  }

  /* Create a labelled field block for the preview */
  function previewField(label, value, extraStyle) {
    const wrap = el("div", "sheet-field");
    if (extraStyle) wrap.setAttribute("style", extraStyle);
    const lbl = el("div", "sheet-field-label", label);
    const val = el("div", "sheet-field-value", value || "—");
    if (extraStyle && extraStyle.includes("pre-line")) val.style.whiteSpace = "pre-line";
    if (extraStyle && extraStyle.includes("0.78rem")) val.style.fontSize = "0.78rem";
    wrap.appendChild(lbl);
    wrap.appendChild(val);
    return wrap;
  }

  function updatePreview() {
    const preview = $("sheet-preview");
    if (!preview) return;

    // Clear and rebuild using DOM methods — no user data flows through innerHTML
    preview.innerHTML = "";

    // Header (all static text)
    const header = el("div", "sheet-header");
    header.appendChild(el("div", "sheet-title", "⬡ AUTISTA: O LAUDO"));
    header.appendChild(el("div", "sheet-subtitle", "Ficha de Personagem"));
    preview.appendChild(header);

    // Nome + Idade row
    const row1 = el("div", "sheet-row");
    row1.appendChild(previewField("Nome", state.nome || "Sem nome"));
    const idadeWrap = previewField("Idade", state.idade || "—", "max-width:80px");
    row1.appendChild(idadeWrap);
    preview.appendChild(row1);

    // Suporte
    const row2 = el("div", "sheet-row");
    const suporteWrap = previewField("Nível de Suporte", suporteLabel(state.suporte), "font-size:0.78rem");
    row2.appendChild(suporteWrap);
    preview.appendChild(row2);

    // Laudo
    const row3 = el("div", "sheet-row");
    row3.appendChild(previewField("Laudo", state.laudo || "—", "font-size:0.78rem"));
    preview.appendChild(row3);

    // Atributos grid
    const attrsGrid = el("div", "sheet-attrs");
    ATTRS.forEach((a) => {
      const box = el("div", "sheet-attr-box");
      box.appendChild(el("div", "sheet-attr-val", String(state.atributos[a.id])));
      box.appendChild(el("div", "sheet-attr-lbl", a.name));
      attrsGrid.appendChild(box);
    });
    preview.appendChild(attrsGrid);

    // Divider
    const hr = document.createElement("hr");
    hr.style.cssText = "border-color:var(--border-color);margin:0.75rem 0";
    preview.appendChild(hr);

    // Interests
    const interesses = state.interesses.filter(Boolean).join(", ") || "—";
    preview.appendChild(previewField("Interesses Especiais", interesses, "margin-bottom:0.4rem;font-size:0.78rem"));

    // Forças
    const forcasField = previewField("Forças", state.forcas || "—", "margin-bottom:0.4rem;font-size:0.78rem");
    forcasField.querySelector(".sheet-field-value").style.whiteSpace = "pre-line";
    preview.appendChild(forcasField);

    // Fraquezas
    const fraqField = previewField("Fraquezas", state.fraquezas || "—", "margin-bottom:0.4rem;font-size:0.78rem");
    fraqField.querySelector(".sheet-field-value").style.whiteSpace = "pre-line";
    preview.appendChild(fraqField);

    // Habilidades
    const habField = previewField("Habilidades Especiais", state.habilidades || "—", "margin-bottom:0.4rem;font-size:0.78rem");
    habField.querySelector(".sheet-field-value").style.whiteSpace = "pre-line";
    preview.appendChild(habField);

    // Overload bar
    const olWrap = el("div", "sheet-field");
    const olLabel = el("div", "sheet-field-label", "Sobrecarga Sensorial (" + state.sobrecarga + "/" + OVERLOAD_MAX + ")");
    const olBar = el("div", "sheet-overload-preview");
    for (let i = 1; i <= OVERLOAD_MAX; i++) {
      const box = el("div", state.sobrecarga >= i ? "ol-box filled" : "ol-box");
      box.setAttribute("title", "Nível " + i);
      olBar.appendChild(box);
    }
    olWrap.appendChild(olLabel);
    olWrap.appendChild(olBar);
    preview.appendChild(olWrap);
  }

  /* ---- PDF Generation ---- */
  function generatePDF() {
    // jsPDF is loaded from CDN
    if (typeof window.jspdf === "undefined") {
      showToast("⚠️ Aguarde o carregamento do jsPDF...");
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const margin = 18;
    const pageW = 210;
    const contentW = pageW - margin * 2;
    let y = margin;

    // Helper: safe string
    function s(v) { return v ? String(v) : "—"; }

    // Background subtle gradient simulation
    doc.setFillColor(15, 23, 42); // dark bg
    doc.rect(0, 0, 210, 297, "F");

    // Title area
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(margin, y, contentW, 28, 4, 4, "F");

    doc.setTextColor(56, 189, 248); // accent-blue
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("⬡ AUTISTA: O LAUDO", pageW / 2, y + 10, { align: "center" });

    doc.setTextColor(148, 163, 184); // text-secondary
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Ficha de Personagem — RPG de Storytelling Neurodivergente Brasileiro", pageW / 2, y + 18, { align: "center" });

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text(`Gerada em ${new Date().toLocaleDateString("pt-BR")}`, pageW / 2, y + 24, { align: "center" });

    y += 34;

    // ---- Identity section ----
    function sectionHeader(title) {
      doc.setFillColor(56, 189, 248);
      doc.rect(margin, y, contentW, 0.5, "F");
      y += 3;
      doc.setTextColor(74, 222, 128); // accent-green
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(title.toUpperCase(), margin, y + 4);
      y += 10;
    }

    function fieldLine(label, value, x, w, indent) {
      const fx = x || margin;
      const fw = w || contentW;
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text(label.toUpperCase(), fx, y);

      doc.setTextColor(241, 245, 249);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.text(s(value), fx, y + 5);

      // underline
      doc.setDrawColor(51, 65, 85);
      doc.line(fx, y + 6, fx + fw - 2, y + 6);
    }

    sectionHeader("Identidade");

    // Row 1: Nome + Idade
    fieldLine("Nome do Personagem", state.nome, margin, contentW * 0.7);
    fieldLine("Idade", state.idade, margin + contentW * 0.74, contentW * 0.26);
    y += 14;

    // Row 2: Suporte + Laudo
    fieldLine("Nível de Suporte (DSM-5)", suporteLabel(state.suporte), margin, contentW * 0.5);
    fieldLine("Status do Laudo", state.laudo, margin + contentW * 0.52, contentW * 0.48);
    y += 14;

    // ---- Attributes ----
    sectionHeader("Atributos");

    const attrCols = 3;
    const attrW = contentW / attrCols;
    const attrStartY = y;

    ATTRS.forEach((attr, idx) => {
      const col = idx % attrCols;
      const row = Math.floor(idx / attrCols);
      const ax = margin + col * attrW;
      const ay = attrStartY + row * 22;

      // Box
      doc.setFillColor(30, 41, 59);
      doc.roundedRect(ax, ay, attrW - 2, 20, 3, 3, "F");
      doc.setDrawColor(51, 65, 85);
      doc.roundedRect(ax, ay, attrW - 2, 20, 3, 3, "S");

      // Value
      doc.setTextColor(56, 189, 248);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(String(state.atributos[attr.id]), ax + attrW / 2 - 1, ay + 11, { align: "center" });

      // Label
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text(attr.name.toUpperCase(), ax + attrW / 2 - 1, ay + 17, { align: "center" });
    });

    y = attrStartY + Math.ceil(ATTRS.length / attrCols) * 22 + 6;

    // Points note
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.text(`Total de pontos: ${pontosUsados()} / ${TOTAL_POINTS}`, margin, y);
    y += 10;

    // ---- Interests ----
    sectionHeader("Interesses Especiais");
    const interesses = state.interesses.filter(Boolean);
    if (interesses.length) {
      interesses.forEach((interesse, idx) => {
        doc.setFillColor(30, 41, 59);
        doc.roundedRect(margin + (idx % 2 === 1 ? contentW / 2 + 2 : 0), y, contentW / 2 - 2, 8, 2, 2, "F");
        doc.setTextColor(241, 245, 249);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.text(`${idx + 1}. ${s(interesse)}`, margin + (idx % 2 === 1 ? contentW / 2 + 4 : 2), y + 5.5);
        if (idx % 2 === 1 || idx === interesses.length - 1) y += 11;
      });
      if (interesses.length % 2 !== 0) y += 0;
    } else {
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.text("Nenhum interesse registrado", margin, y + 4);
      y += 10;
    }
    y += 4;

    // ---- Forças & Fraquezas ----
    sectionHeader("Forças & Fraquezas");

    const halfW = contentW / 2 - 3;

    // Forças box
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(margin, y, halfW, 28, 3, 3, "F");
    doc.setTextColor(74, 222, 128);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("FORÇAS", margin + 3, y + 6);
    doc.setTextColor(241, 245, 249);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const forcasLines = doc.splitTextToSize(s(state.forcas), halfW - 6);
    doc.text(forcasLines.slice(0, 3), margin + 3, y + 12);

    // Fraquezas box
    const fx2 = margin + halfW + 6;
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(fx2, y, halfW, 28, 3, 3, "F");
    doc.setTextColor(251, 191, 36);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("FRAQUEZAS", fx2 + 3, y + 6);
    doc.setTextColor(241, 245, 249);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const fraqLines = doc.splitTextToSize(s(state.fraquezas), halfW - 6);
    doc.text(fraqLines.slice(0, 3), fx2 + 3, y + 12);

    y += 34;

    // ---- Habilidades Especiais ----
    sectionHeader("Habilidades Especiais");
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(margin, y, contentW, 22, 3, 3, "F");
    doc.setTextColor(241, 245, 249);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    const habLines = doc.splitTextToSize(s(state.habilidades), contentW - 6);
    doc.text(habLines.slice(0, 3), margin + 3, y + 6);
    y += 28;

    // ---- Sobrecarga Sensorial ----
    sectionHeader("Barra de Sobrecarga Sensorial");

    const boxSize = 9;
    const boxGap = 2;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);

    for (let i = 1; i <= OVERLOAD_MAX; i++) {
      const bx = margin + (i - 1) * (boxSize + boxGap);
      const by = y;
      const filled = state.sobrecarga >= i;

      doc.setFillColor(filled ? 239 : 30, filled ? 68 : 41, filled ? 68 : 59);
      doc.setDrawColor(filled ? 239 : 51, filled ? 68 : 65, filled ? 68 : 85);
      doc.roundedRect(bx, by, boxSize, boxSize, 1.5, 1.5, "FD");

      doc.setTextColor(filled ? 255 : 100, filled ? 255 : 116, filled ? 255 : 139);
      doc.text(String(i), bx + boxSize / 2, by + 6.5, { align: "center" });
    }

    y += 14;
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.text(`Nível atual: ${state.sobrecarga} / ${OVERLOAD_MAX}  |  ${getSobrecargeLabel(state.sobrecarga)}`, margin, y);
    y += 10;

    // ---- Inventário ----
    if (state.inventario) {
      sectionHeader("Inventário");
      doc.setFillColor(30, 41, 59);
      doc.roundedRect(margin, y, contentW, 24, 3, 3, "F");
      doc.setTextColor(241, 245, 249);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      const invLines = doc.splitTextToSize(s(state.inventario), contentW - 6);
      doc.text(invLines.slice(0, 3), margin + 3, y + 6);
      y += 30;
    }

    // ---- História ----
    if (state.historia) {
      sectionHeader("História");
      doc.setFillColor(30, 41, 59);
      doc.roundedRect(margin, y, contentW, 28, 3, 3, "F");
      doc.setTextColor(241, 245, 249);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      const histLines = doc.splitTextToSize(s(state.historia), contentW - 6);
      doc.text(histLines.slice(0, 4), margin + 3, y + 6);
      y += 34;
    }

    // Footer
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 287, 210, 10, "F");
    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text("AUTISTA: O LAUDO — RPG de Storytelling Neurodivergente Brasileiro | github.com/bmsrk/autistaolaudo", pageW / 2, 293, { align: "center" });

    // Save
    const filename = state.nome
      ? `ficha-${state.nome.toLowerCase().replace(/\s+/g, "-")}.pdf`
      : "ficha-personagem.pdf";
    doc.save(filename);
    showToast(`✅ PDF "${filename}" gerado com sucesso!`);
  }

  function getSobrecargeLabel(n) {
    if (n === 0) return "Sem sobrecarga";
    if (n <= 3) return "Sobrecarga leve";
    if (n <= 6) return "Sobrecarga moderada";
    if (n <= 8) return "Sobrecarga alta";
    return "🔴 Meltdown iminente";
  }

  /* ---- Save / Load from localStorage ---- */
  const SAVE_KEY = "autista-ficha-v1";

  function scheduleAutoSave() {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    }, 450);
  }

  function saveState() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    showToast("💾 Ficha salva!");
  }

  function loadState() {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    try {
      const saved = JSON.parse(raw);
      Object.assign(state, saved);
      return true;
    } catch {
      return false;
    }
  }

  function clearState() {
    if (!confirm("Tem certeza que quer limpar todos os campos da ficha?")) return;
    localStorage.removeItem(SAVE_KEY);
    state = {
      nome: "", idade: "", suporte: "", laudo: "",
      atributos: Object.fromEntries(ATTRS.map((a) => [a.id, 1])),
      interesses: [""], forcas: "", fraquezas: "", habilidades: "",
      sobrecarga: 0, inventario: "", historia: "",
    };
    syncFormFromState();
    showToast("🗑️ Ficha limpa!");
  }

  /* ---- Sync form from state (when loading) ---- */
  function syncFormFromState() {
    const simpleFields = ["nome","idade","laudo","forcas","fraquezas","habilidades","inventario","historia"];
    simpleFields.forEach((k) => {
      const el = $(k);
      if (el) el.value = state[k] || "";
    });

    // Suporte
    document.querySelectorAll('input[name="suporte"]').forEach((r) => {
      r.checked = r.value === state.suporte;
    });

    // Rebuild dynamic UI
    buildAttrCards();
    updatePointsDisplay();
    buildInterestFields();
    buildOverloadBar();
    updatePreview();
  }

  /* ---- Init ---- */
  function init() {
    buildAttrCards();
    updatePointsDisplay();
    buildInterestFields();
    buildOverloadBar();
    initAttrButtons();
    bindFormInputs();

    // Load saved state if available
    if (loadState()) {
      syncFormFromState();
      showToast("📂 Ficha anterior carregada!");
    } else {
      updatePreview();
    }

    // Buttons
    const pdfBtn = $("btn-pdf");
    if (pdfBtn) pdfBtn.addEventListener("click", generatePDF);

    const saveBtn = $("btn-save");
    if (saveBtn) saveBtn.addEventListener("click", saveState);

    const clearBtn = $("btn-clear");
    if (clearBtn) clearBtn.addEventListener("click", clearState);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
