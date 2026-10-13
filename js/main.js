/* Cantinho Doce — interações da página */
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
    header.classList.toggle("is-scrolled", y > 40);
    toTop.classList.toggle("is-visible", y > 700);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  navToggle.addEventListener("click", () => {
    const open = document.body.classList.toggle("menu-open");
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  $$("#nav a").forEach((a) => a.addEventListener("click", () => {
    document.body.classList.remove("menu-open");
    navToggle.setAttribute("aria-expanded", "false");
  }));

  toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  /* ---------- Hero slideshow ---------- */
  const slides = $$(".hero__slide");
  const dotsWrap = $("#heroDots");
  const caption = $("#heroCaption");
  const INTERVAL = 5500;
  let current = 0, timer = null;

  slides.forEach((s, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", "Foto " + (i + 1));
    b.addEventListener("click", () => { go(i); restart(); });
    dotsWrap.appendChild(b);
  });
  const dots = $$("button", dotsWrap);

  function go(i) {
    slides[current].classList.remove("is-active");
    dots[current].classList.remove("is-active");
    current = (i + slides.length) % slides.length;
    slides[current].classList.add("is-active");
    dots[current].classList.add("is-active");
    if (caption) {
      caption.classList.add("is-fading");
      setTimeout(() => { caption.textContent = slides[current].dataset.caption || ""; caption.classList.remove("is-fading"); }, 600);
    }
    // pré-carrega a próxima
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
  slides.forEach((s, i) => { if (i === 0) { s.style.backgroundImage = "url('" + s.dataset.src + "')"; s.dataset.loaded = "1"; } });
  if (caption && slides[0]) caption.textContent = slides[0].dataset.caption || "";
  go(0);
  restart();
  document.addEventListener("visibilitychange", () => { if (document.hidden) clearInterval(timer); else restart(); });

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
    if (!$("#roomModal").classList.contains("is-open")) document.body.classList.remove("no-scroll");
    if (lbReturnFocus && lbReturnFocus.focus) lbReturnFocus.focus();
  }
  function renderLb() {
    const it = lbItems[lbIndex];
    lbImg.src = it.src; lbImg.alt = it.caption || "";
    lbCap.innerHTML = esc(it.caption || "") + "<span>" + (lbIndex + 1) + " / " + lbItems.length + "</span>";
    // pré-carrega vizinhas
    [lbIndex + 1, lbIndex - 1].forEach((i) => { const n = lbItems[(i + lbItems.length) % lbItems.length]; if (n) { const im = new Image(); im.src = n.src; } });
  }
  function lbStep(d) { lbIndex = (lbIndex + d + lbItems.length) % lbItems.length; renderLb(); }
  $(".lightbox__btn--close", lb).addEventListener("click", closeLightbox);
  $(".lightbox__btn--prev", lb).addEventListener("click", () => lbStep(-1));
  $(".lightbox__btn--next", lb).addEventListener("click", () => lbStep(1));
  lb.addEventListener("click", (e) => { if (e.target === lb) closeLightbox(); });

  // toque: deslizar
  let tx = 0;
  lb.addEventListener("touchstart", (e) => { tx = e.changedTouches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", (e) => { const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) lbStep(dx < 0 ? 1 : -1); }, { passive: true });

  // links de galeria agrupados por data-lightbox
  $$("a[data-lightbox]").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const group = $$('a[data-lightbox="' + a.dataset.lightbox + '"]');
      const items = group.map((g) => ({ src: g.getAttribute("href"), caption: g.dataset.caption || ($("img", g) || {}).alt || "" }));
      openLightbox(items, group.indexOf(a), a);
    });
  });

  /* ---------- Modal de acomodação ---------- */
  const modal = $("#roomModal");
  const panel = $(".modal__panel", modal);
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
  $(".modal__backdrop", modal).addEventListener("click", closeModal);
  $("#modalClose").addEventListener("click", closeModal);

  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-room]");
    if (t) { e.preventDefault(); openRoom(t.dataset.room, t); }
  });

  /* ---------- Modal de rota (Descubra Lumiar) ---------- */
  const mapModal = $("#mapModal");
  const ORIGIN = "Cantinho Doce Pousada e Camping Clube, Lumiar, Nova Friburgo - RJ";
  const PLACES = {
    lumiar:   { name: "Centro de Lumiar",   dest: "Lumiar, Nova Friburgo - RJ" },
    saopedro: { name: "São Pedro da Serra", dest: "São Pedro da Serra, Nova Friburgo - RJ" },
    mury:     { name: "Mury",               dest: "Mury, Nova Friburgo - RJ" },
    ponte:    { name: "Ponte da Saudade",   dest: "Ponte da Saudade, Nova Friburgo - RJ" },
  };
  let mapReturnFocus = null;
  function openMap(slug, returnFocus) {
    const pl = PLACES[slug];
    if (!pl || !mapModal) return;
    mapReturnFocus = returnFocus;
    $("#mapTitle").textContent = "Cantinho Doce → " + pl.name;
    $("#mapSub").textContent = "Rota de carro saindo do Cantinho Doce até " + pl.name;
    $("#mapFrame").src = "https://www.google.com/maps?saddr=" + encodeURIComponent(ORIGIN) + "&daddr=" + encodeURIComponent(pl.dest) + "&hl=pt-BR&output=embed";
    $("#mapOpen").href = "https://www.google.com/maps/dir/?api=1&origin=" + encodeURIComponent(ORIGIN) + "&destination=" + encodeURIComponent(pl.dest) + "&travelmode=driving";
    mapModal.classList.add("is-open");
    mapModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    $("#mapClose").focus();
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
      const t = e.target.closest("[data-map]");
      if (t) { e.preventDefault(); openMap(t.dataset.map, t); }
    });
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
    if (lb.classList.contains("is-open")) {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowRight") lbStep(1);
      else if (e.key === "ArrowLeft") lbStep(-1);
      return;
    }
    if (mapModal && mapModal.classList.contains("is-open")) {
      if (e.key === "Escape") closeMap();
      return;
    }
    if (modal.classList.contains("is-open")) {
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
