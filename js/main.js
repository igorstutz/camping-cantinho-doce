/* Cantinho Doce — interações (compartilhado por index.html e guia.html) */
(function () {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const icon = (name, cls) => '<svg class="' + (cls || "") + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>';
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const DATA = window.CD_DATA;

  /* ---------- Header / menu ---------- */
  const header = $("#header");
  const toTop = $("#toTop");
  const navToggle = $("#navToggle");

  function onScroll() {
    const y = window.scrollY;
    if (header) header.classList.toggle("is-scrolled", y > 40);
    if (toTop) toTop.classList.toggle("is-visible", y > 700);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (navToggle) {
    navToggle.addEventListener("click", () => {
      const open = document.body.classList.toggle("menu-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    $$("#nav a").forEach((a) => a.addEventListener("click", () => {
      document.body.classList.remove("menu-open");
      navToggle.setAttribute("aria-expanded", "false");
    }));
  }
  if (toTop) toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  /* ---------- Hero slideshow ---------- */
  const slides = $$(".hero__slide");
  const dotsWrap = $("#heroDots");
  const caption = $("#heroCaption");
  const INTERVAL = 5500;
  let current = 0, timer = null, dots = [];
  // em telas pequenas usa a versão de 900 px das fotos do carrossel
  const SMALL = window.matchMedia("(max-width: 720px)").matches;
  slides.forEach((s) => { if (SMALL && s.dataset.srcSm) s.dataset.src = s.dataset.srcSm; });

  /* fundos carregados sob demanda (data-bg) */
  const bgs = $$("[data-bg]");
  if (bgs.length) {
    const bgio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.style.backgroundImage = "url('" + e.target.dataset.bg + "')";
        bgio.unobserve(e.target);
      });
    }, { rootMargin: "600px 0px" });
    bgs.forEach((el) => bgio.observe(el));
  }

  function go(i) {
    slides[current].classList.remove("is-active");
    if (dots[current]) dots[current].classList.remove("is-active");
    current = (i + slides.length) % slides.length;
    slides[current].classList.add("is-active");
    if (dots[current]) dots[current].classList.add("is-active");
    if (caption) {
      caption.classList.add("is-fading");
      setTimeout(() => { caption.textContent = slides[current].dataset.caption || ""; caption.classList.remove("is-fading"); }, 600);
    }
    const next = slides[(current + 1) % slides.length];
    if (next && !next.dataset.loaded) {
      const im = new Image();
      im.src = next.dataset.src;
      next.style.backgroundImage = "url('" + next.dataset.src + "')";
      next.dataset.loaded = "1";
    }
  }
  function restart() {
    clearInterval(timer);
    if (slides.length > 1) timer = setInterval(() => go(current + 1), INTERVAL);
  }
  if (slides.length) {
    if (dotsWrap) {
      slides.forEach((s, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.setAttribute("aria-label", "Foto " + (i + 1));
        b.addEventListener("click", () => { go(i); restart(); });
        dotsWrap.appendChild(b);
      });
      dots = $$("button", dotsWrap);
    }
    slides[0].style.backgroundImage = "url('" + slides[0].dataset.src + "')";
    slides[0].dataset.loaded = "1";
    if (caption) caption.textContent = slides[0].dataset.caption || "";
    go(0);
    restart();
    document.addEventListener("visibilitychange", () => { if (document.hidden) clearInterval(timer); else restart(); });
  }

  /* ---------- Revelação ao rolar ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  $$(".reveal").forEach((el) => io.observe(el));

  /* ---------- Cards de acomodações ---------- */
  const grid = $("#roomsGrid");
  const fmt = (n) => "R$ " + n.toLocaleString("pt-BR");

  function roomCard(r, i) {
    const cover = r.images[0];
    return (
      '<article class="room reveal" data-delay="' + ((i % 3) + 1) + '">' +
        '<button type="button" class="room__media" data-room="' + r.slug + '" aria-label="Ver fotos: ' + esc(r.name) + '">' +
          '<img src="' + cover.sm + '" alt="' + esc(cover.alt) + '" loading="lazy" width="900" height="600">' +
          '<span class="room__badge' + (r.badgeHot ? " room__badge--hot" : "") + '">' + esc(r.badge) + "</span>" +
          '<span class="room__count">' + icon("camera") + r.images.length + " fotos</span>" +
        "</button>" +
        '<div class="room__body">' +
          '<ul class="room__tags">' + r.tags.map((t) => "<li>" + esc(t) + "</li>").join("") + "</ul>" +
          "<h3>" + esc(r.name) + "</h3>" +
          '<div class="room__cap">' + icon("users") + esc(r.capText) + "</div>" +
          '<p class="room__desc">' + esc(r.desc) + "</p>" +
          '<div class="room__price"><small>a partir de</small><strong>' + fmt(r.from) + "</strong><span>/ diária · " + esc(r.fromLabel || "casal") + "</span></div>" +
          '<div class="room__actions">' +
            '<button type="button" class="btn btn--outline" data-room="' + r.slug + '">Ver detalhes</button>' +
            '<a class="btn btn--forest" href="' + r.reserve + '" target="_blank" rel="noopener">Reservar</a>' +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }
  if (grid && DATA) {
    grid.innerHTML = DATA.rooms.map(roomCard).join("");
    $$(".reveal", grid).forEach((el) => io.observe(el));
  }

  /* ---------- Lightbox ---------- */
  const lb = $("#lightbox");
  const lbImg = $("#lightboxImg");
  const lbCap = $("#lightboxCap");
  let lbItems = [], lbIndex = 0, lbReturnFocus = null;

  function openLightbox(items, index, returnFocus) {
    if (!lb) return;
    lbItems = items; lbIndex = index; lbReturnFocus = returnFocus || document.activeElement;
    renderLb();
    lb.classList.add("is-open");
    lb.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    $(".lightbox__btn--close", lb).focus();
  }
  function closeLightbox() {
    lb.classList.remove("is-open");
    lb.setAttribute("aria-hidden", "true");
    const rm = $("#roomModal");
    if (!(rm && rm.classList.contains("is-open"))) document.body.classList.remove("no-scroll");
    if (lbReturnFocus && lbReturnFocus.focus) lbReturnFocus.focus();
  }
  function renderLb() {
    const it = lbItems[lbIndex];
    lbImg.src = it.src; lbImg.alt = it.caption || "";
    lbCap.innerHTML = esc(it.caption || "") + "<span>" + (lbIndex + 1) + " / " + lbItems.length + "</span>";
    [lbIndex + 1, lbIndex - 1].forEach((i) => { const n = lbItems[(i + lbItems.length) % lbItems.length]; if (n) { const im = new Image(); im.src = n.src; } });
  }
  function lbStep(d) { lbIndex = (lbIndex + d + lbItems.length) % lbItems.length; renderLb(); }
  if (lb) {
    $(".lightbox__btn--close", lb).addEventListener("click", closeLightbox);
    $(".lightbox__btn--prev", lb).addEventListener("click", () => lbStep(-1));
    $(".lightbox__btn--next", lb).addEventListener("click", () => lbStep(1));
    lb.addEventListener("click", (e) => { if (e.target === lb) closeLightbox(); });
    let tx = 0;
    lb.addEventListener("touchstart", (e) => { tx = e.changedTouches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", (e) => { const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) lbStep(dx < 0 ? 1 : -1); }, { passive: true });
    $$("a[data-lightbox]").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const group = $$('a[data-lightbox="' + a.dataset.lightbox + '"]');
        const items = group.map((g) => ({ src: g.getAttribute("href"), caption: g.dataset.caption || ($("img", g) || {}).alt || "" }));
        openLightbox(items, group.indexOf(a), a);
      });
    });
  }

  /* ---------- Modal de acomodação ---------- */
  const modal = $("#roomModal");
  const panel = modal ? $(".modal__panel", modal) : null;
  let room = null, idx = 0, modalReturnFocus = null;

  function priceRows(r) {
    return r.prices.map((p) =>
      "<tr" + (p[2] ? ' class="best"' : "") + "><td>" + esc(p[0]) + (p[2] ? '<span class="pill">melhor valor</span>' : "") + "</td><td>" + esc(p[1]) + (p[2] ? "<small style=\"font-family:var(--font-body);font-size:12px;font-weight:600;color:var(--ink-3)\"> / diária</small>" : "") + "</td></tr>"
    ).join("");
  }
  function renderModal() {
    const r = room;
    panel.innerHTML =
      '<div class="modal__hero">' +
        '<img id="modalImg" src="' + r.images[idx].lg + '" alt="' + esc(r.images[idx].alt) + '" title="Ampliar foto">' +
        '<button type="button" class="modal__nav modal__nav--prev" aria-label="Foto anterior">' + icon("chevL") + "</button>" +
        '<button type="button" class="modal__nav modal__nav--next" aria-label="Próxima foto">' + icon("chevR") + "</button>" +
        '<span class="modal__counter" id="modalCounter">' + (idx + 1) + " / " + r.images.length + "</span>" +
      "</div>" +
      '<div class="modal__thumbs" id="modalThumbs">' +
        r.images.map((im, i) => '<button type="button"' + (i === idx ? ' class="is-active"' : "") + ' data-i="' + i + '" aria-label="' + esc(im.alt) + '"><img src="' + im.sm + '" alt="" loading="lazy"></button>').join("") +
      "</div>" +
      '<div class="modal__body">' +
        "<div>" +
          '<ul class="room__tags">' + r.tags.map((t) => "<li>" + esc(t) + "</li>").join("") + "</ul>" +
          "<h2>" + esc(r.name) + "</h2>" +
          '<div class="room__cap">' + icon("users") + esc(r.capText) + "</div>" +
          '<p class="lead">' + esc(r.long) + "</p>" +
          "<h4>Comodidades</h4>" +
          '<ul class="amenities">' + r.amenities.map((a) => "<li>" + icon(a[0]) + esc(a[1]) + "</li>").join("") + "</ul>" +
        "</div>" +
        '<aside class="modal__aside"><div class="price-box">' +
          "<h4>Valores</h4>" +
          "<table>" + priceRows(r) + "</table>" +
          '<a class="btn btn--gold" href="' + r.reserve + '" target="_blank" rel="noopener">' + icon("calendar") + "Reservar online</a>" +
          '<a class="btn btn--wa" href="' + r.wa + '" target="_blank" rel="noopener">' + icon("whatsapp") + "Tirar dúvidas no WhatsApp</a>" +
          '<small class="note">' + esc(r.note) + "</small>" +
        "</div></aside>" +
      "</div>";

    $(".modal__nav--prev", panel).addEventListener("click", () => setIdx(idx - 1));
    $(".modal__nav--next", panel).addEventListener("click", () => setIdx(idx + 1));
    $("#modalImg", panel).addEventListener("click", () => {
      openLightbox(r.images.map((im) => ({ src: im.lg, caption: im.alt })), idx, $("#modalImg", panel));
    });
    $$("#modalThumbs button", panel).forEach((b) => b.addEventListener("click", () => setIdx(+b.dataset.i)));
  }
  function setIdx(i) {
    idx = (i + room.images.length) % room.images.length;
    const im = $("#modalImg", panel);
    im.src = room.images[idx].lg; im.alt = room.images[idx].alt;
    $("#modalCounter", panel).textContent = (idx + 1) + " / " + room.images.length;
    $$("#modalThumbs button", panel).forEach((b, j) => {
      b.classList.toggle("is-active", j === idx);
      if (j === idx) b.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    });
  }
  function openRoom(slug, returnFocus) {
    room = DATA.rooms.find((r) => r.slug === slug);
    if (!room) return;
    idx = 0; modalReturnFocus = returnFocus;
    renderModal();
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    panel.scrollTop = 0;
    $("#modalClose").focus();
    history.replaceState(null, "", "#acomodacoes");
  }
  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
    if (modalReturnFocus && modalReturnFocus.focus) modalReturnFocus.focus();
  }
  if (modal && DATA) {
    $(".modal__backdrop", modal).addEventListener("click", closeModal);
    $("#modalClose").addEventListener("click", closeModal);
    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-room]");
      if (t) { e.preventDefault(); openRoom(t.dataset.room, t); }
    });
  }

  /* ---------- Modal de rota (Google Maps) ---------- */
  const mapModal = $("#mapModal");
  const ORIGIN = "Cantinho Doce Pousada e Camping Clube, Lumiar, Nova Friburgo - RJ";
  const PLACES = {
    lumiar:   { name: "Centro de Lumiar",   dest: "Lumiar, Nova Friburgo - RJ" },
    saopedro: { name: "São Pedro da Serra", dest: "São Pedro da Serra, Nova Friburgo - RJ" },
    mury:     { name: "Mury",               dest: "Mury, Nova Friburgo - RJ" },
    ponte:    { name: "Ponte da Saudade",   dest: "Ponte da Saudade, Nova Friburgo - RJ" },
  };
  let mapReturnFocus = null;
  function openMap(name, dest, returnFocus, origin) {
    if (!mapModal) return;
    mapReturnFocus = returnFocus;
    const from = origin || ORIGIN;
    const fromLabel = origin ? name.split(" → ")[0] : "Cantinho Doce";
    $("#mapTitle").textContent = origin ? name : "Cantinho Doce → " + name;
    $("#mapSub").textContent = origin ? "Rota de carro até o Cantinho Doce" : "Rota de carro saindo do Cantinho Doce até " + name;
    $("#mapFrame").src = "https://www.google.com/maps?saddr=" + encodeURIComponent(from) + "&daddr=" + encodeURIComponent(dest) + "&hl=pt-BR&output=embed";
    $("#mapOpen").href = "https://www.google.com/maps/dir/?api=1&origin=" + encodeURIComponent(from) + "&destination=" + encodeURIComponent(dest) + "&travelmode=driving";
    mapModal.classList.add("is-open");
    mapModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    $("#mapClose").focus();
    void fromLabel;
  }
  function closeMap() {
    mapModal.classList.remove("is-open");
    mapModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
    setTimeout(() => { $("#mapFrame").src = "about:blank"; }, 400);
    if (mapReturnFocus && mapReturnFocus.focus) mapReturnFocus.focus();
  }
  if (mapModal) {
    $(".modal__backdrop", mapModal).addEventListener("click", closeMap);
    $("#mapClose").addEventListener("click", closeMap);
    $("#mapCloseBtn").addEventListener("click", closeMap);
    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-map],[data-dest]");
      if (!t) return;
      e.preventDefault();
      if (t.dataset.map && PLACES[t.dataset.map]) {
        openMap(PLACES[t.dataset.map].name, PLACES[t.dataset.map].dest, t);
      } else if (t.dataset.dest) {
        // data-from: rota ATÉ o Cantinho Doce partindo de outra cidade
        if (t.dataset.from) openMap((t.dataset.name || t.dataset.from) + " → Cantinho Doce", ORIGIN, t, t.dataset.from);
        else openMap(t.dataset.name || t.dataset.dest, t.dataset.dest, t);
      }
    });
  }

  /* ---------- Navegação de capítulos (guia.html) ---------- */
  const chapNav = $("#chapterNav");
  if (chapNav) {
    const links = $$("a[href^='#']", chapNav);
    const secs = links.map((a) => $(a.getAttribute("href"))).filter(Boolean);
    const inner = $(".chapnav__inner", chapNav) || chapNav;
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const id = "#" + en.target.id;
        links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === id));
        const act = links.find((a) => a.getAttribute("href") === id);
        if (act) inner.scrollTo({ left: act.offsetLeft - 24, behavior: "smooth" });
      });
    }, { rootMargin: "-35% 0px -55% 0px", threshold: 0 });
    secs.forEach((s) => spy.observe(s));
    // acima do primeiro capítulo, nenhum fica marcado
    window.addEventListener("scroll", () => {
      if (secs.length && window.scrollY < secs[0].offsetTop - window.innerHeight * 0.4) links.forEach((a) => a.classList.remove("is-active"));
    }, { passive: true });
  }

  /* ---------- Faixa de depoimentos (duplica para loop contínuo) ---------- */
  ["#rvTrack1", "#rvTrack2"].forEach((id) => {
    const track = $(id);
    if (!track) return;
    const items = Array.from(track.children);
    items.forEach((it) => { const c = it.cloneNode(true); c.setAttribute("aria-hidden", "true"); track.appendChild(c); });
  });

  /* ---------- Teclado ---------- */
  document.addEventListener("keydown", (e) => {
    if (lb && lb.classList.contains("is-open")) {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowRight") lbStep(1);
      else if (e.key === "ArrowLeft") lbStep(-1);
      return;
    }
    if (mapModal && mapModal.classList.contains("is-open")) {
      if (e.key === "Escape") closeMap();
      return;
    }
    if (modal && modal.classList.contains("is-open")) {
      if (e.key === "Escape") closeModal();
      else if (e.key === "ArrowRight") setIdx(idx + 1);
      else if (e.key === "ArrowLeft") setIdx(idx - 1);
      return;
    }
    if (e.key === "Escape" && document.body.classList.contains("menu-open")) {
      document.body.classList.remove("menu-open");
    }
  });

  /* ---------- Rodapé ---------- */
  const y = $("#year");
  if (y) y.textContent = new Date().getFullYear();
})();
