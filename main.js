/* ============================================================
   Homepage logic — i18n, sections, jump-tabs, scroll-spy, fx
   ============================================================ */
(function () {
  var LANG = "en";
  try { var s = localStorage.getItem("lang"); if (s === "en" || s === "zh") LANG = s; } catch (e) {}

  function t(k) { return (window.I18N[LANG] && window.I18N[LANG][k]) || (window.I18N.en[k]) || k; }

  var cardRefs = [];   // {title, desc, tagline, project}
  var tabRefs = [];    // {btn, key}
  var headRefs = [];   // {nameEl, cntEl, cat, count}

  /* ---------- build sections + tabs once ---------- */
  function build() {
    var wrap = document.getElementById("worksWrap");
    var filter = document.getElementById("filter");
    var byCat = {};
    window.CATEGORIES.forEach(function (c) { byCat[c] = []; });
    window.PROJECTS.forEach(function (p) { if (byCat[p.cat]) byCat[p.cat].push(p); });

    /* tabs: All + categories */
    function makeTab(key, target, count) {
      var b = document.createElement("button");
      b.dataset.target = target;
      b.innerHTML = "<span class='lab'></span>" + (count != null ? " <span class='n'>" + String(count).padStart(2, "0") + "</span>" : "");
      b.dataset.cursor = "";
      b.addEventListener("click", function () {
        var el = document.querySelector(target);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      filter.appendChild(b);
      tabRefs.push({ btn: b, key: key });
    }
    makeTab("all", "#works", null);
    var idx = 0;
    window.CATEGORIES.forEach(function (cat, ci) {
      var list = byCat[cat];
      var sec = document.createElement("section");
      sec.className = "work-section";
      sec.id = "sec-" + cat;
      sec.dataset.cat = cat;

      var head = document.createElement("div");
      head.className = "section-head";
      var h2 = document.createElement("h2");
      h2.innerHTML = "<span class='nm'></span>";
      var cnt = document.createElement("span");
      cnt.className = "cnt";
      head.appendChild(h2); head.appendChild(cnt);
      sec.appendChild(head);
      headRefs.push({ nameEl: h2.querySelector(".nm"), cntEl: cnt, cat: cat, count: list.length });

      var grid = document.createElement("div");
      grid.className = "grid";
      list.forEach(function (p) {
        idx++;
        var a = document.createElement("a");
        a.className = "card reveal";
        a.href = "project.html?id=" + encodeURIComponent(p.id);
        a.dataset.cursor = "";
        a.dataset.cursorLabel = t("view");
        var lockBadge = p.locked
          ? "<span class='lockbadge' title='Protected'><svg viewBox='0 0 24 24' width='13' height='13' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='4.5' y='10.5' width='15' height='10' rx='2'/><path d='M8 10.5V7a4 4 0 0 1 8 0v3.5'/></svg></span>"
          : "";
        a.innerHTML =
          "<div class='thumb' data-tilt>" +
          "<span class='tagline'></span>" + lockBadge +
          "<img src='" + p.folder + "/" + (p.thumb || p.cover || "cover.png") + "' alt='' loading='lazy'>" +
          "<div class='view'><span class='ic'>↗</span> <span class='vt'></span></div>" +
          "</div>" +
          "<div class='meta'><div><div class='t'></div><div class='d'></div></div><div class='no'>" + String(idx).padStart(2, "0") + "</div></div>";
        grid.appendChild(a);
        cardRefs.push({
          title: a.querySelector(".t"), desc: a.querySelector(".d"),
          tagline: a.querySelector(".tagline"), vt: a.querySelector(".vt"),
          aEl: a, project: p
        });
      });
      sec.appendChild(grid);
      wrap.appendChild(sec);

      makeTab(cat, "#sec-" + cat, list.length);
    });
  }

  /* ---------- apply language (text only; no DOM rebuild) ---------- */
  function applyLang(lang) {
    LANG = lang;
    try { localStorage.setItem("lang", lang); } catch (e) {}
    document.documentElement.setAttribute("lang", lang === "zh" ? "zh-CN" : "en");

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"));
    });

    /* hero title (structured) */
    var ht = document.getElementById("heroTitle");
    if (lang === "zh")
      ht.innerHTML = t("hero_title_a") + "<span class='em'>" + t("hero_title_em") + "</span>" + t("hero_title_b");
    else
      ht.innerHTML = t("hero_title_a") + " <span class='em'>" + t("hero_title_em") + "</span> " + t("hero_title_b");
    document.getElementById("heroSub").textContent = t("hero_sub");

    /* contact */
    document.getElementById("contactTitle").innerHTML =
      t("contact_title_a") + " <span class='em'>" + t("contact_em") + "</span>" + (lang === "zh" ? "的东西。" : ".");
    document.getElementById("contactLead").textContent = t("contact_lead");

    /* tabs */
    tabRefs.forEach(function (r) {
      r.btn.querySelector(".lab").textContent = (r.key === "all") ? t("filter_all") : t("cat_" + r.key);
    });
    /* section heads */
    headRefs.forEach(function (r) {
      r.nameEl.textContent = t("cat_" + r.cat);
      r.cntEl.textContent = String(r.count).padStart(2, "0") + " " + t("works_count_suffix");
    });
    /* cards */
    cardRefs.forEach(function (r) {
      r.title.textContent = r.project.title[lang];
      r.desc.textContent = r.project.desc[lang];
      r.tagline.textContent = t("cat_" + r.project.cat);
      r.vt.textContent = t("view");
      r.aEl.dataset.cursorLabel = t("view");
    });

    document.querySelectorAll("#lang button").forEach(function (b) {
      b.classList.toggle("on", b.dataset.lang === lang);
    });
  }

  /* ---------- effects ---------- */
  function initImgFade() {
    document.querySelectorAll(".card .thumb img").forEach(function (img) {
      if (img.complete && img.naturalWidth) { img.classList.add("loaded"); return; }
      img.addEventListener("load", function () { img.classList.add("loaded"); });
      img.addEventListener("error", function () { img.classList.add("loaded"); });
    });
  }

  function initReveal() {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: .12, rootMargin: "0px 0px -6% 0px" });
    document.querySelectorAll(".reveal").forEach(function (el, i) {
      if (el.classList.contains("card")) el.style.transitionDelay = ((i % 3) * 60) + "ms";
      io.observe(el);
    });
  }

  function initSpy() {
    var sections = Array.prototype.slice.call(document.querySelectorAll(".work-section"));
    function setActive(key) {
      tabRefs.forEach(function (r) { r.btn.classList.toggle("active", r.key === key); });
    }
    setActive("all");
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) setActive(e.target.dataset.cat);
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    sections.forEach(function (s) { io.observe(s); });
    /* back to "all" when near top */
    window.addEventListener("scroll", function () {
      var works = document.getElementById("works");
      if (works.getBoundingClientRect().top > 120) setActive("all");
    }, { passive: true });
  }

  function initCounter() {
    var el = document.getElementById("totalCount");
    var to = window.PROJECTS.length;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          var v = 0; var iv = setInterval(function () {
            v++; el.textContent = String(v).padStart(2, "0"); if (v >= to) clearInterval(iv);
          }, 60);
          io.unobserve(el);
        }
      });
    }, { threshold: .6 });
    io.observe(el);
  }

  function initNav() {
    var nav = document.getElementById("nav"), prog = document.getElementById("progress"),
        fb = document.getElementById("filterbar");
    function onScroll() {
      var y = window.scrollY;
      nav.classList.toggle("solid", y > 30);
      var h = document.documentElement.scrollHeight - window.innerHeight;
      prog.style.transform = "scaleX(" + Math.min(1, y / (h || 1)) + ")";
      fb.classList.toggle("stuck", fb.getBoundingClientRect().top <= 68);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    var mm = document.getElementById("mobmenu");
    document.getElementById("burger").onclick = function () { mm.classList.add("open"); };
    document.getElementById("mmClose").onclick = function () { mm.classList.remove("open"); };
    mm.querySelectorAll("a").forEach(function (a) { a.onclick = function () { mm.classList.remove("open"); }; });
    document.getElementById("totop").onclick = function () { window.scrollTo({ top: 0, behavior: "smooth" }); };

    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (id.length > 1) { var el = document.querySelector(id); if (el) { e.preventDefault(); el.scrollIntoView({ behavior: "smooth", block: "start" }); } }
      });
    });
  }

  function initCursor() {
    if (window.matchMedia("(pointer:coarse)").matches) return;
    var c = document.getElementById("cursor"), d = document.getElementById("cursorDot");
    var mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my;
    addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      d.style.transform = "translate(" + mx + "px," + my + "px) translate(-50%,-50%)";
    });
    (function loop() { cx += (mx - cx) * .16; cy += (my - cy) * .16; c.style.transform = "translate(" + cx + "px," + cy + "px) translate(-50%,-50%)"; requestAnimationFrame(loop); })();
    document.querySelectorAll("[data-cursor], a, button").forEach(function (el) {
      el.addEventListener("mouseenter", function () {
        c.classList.add("grow");
        if (el.dataset.cursorLabel) { c.classList.add("grow-text"); c.setAttribute("data-label", el.dataset.cursorLabel); }
      });
      el.addEventListener("mouseleave", function () { c.classList.remove("grow", "grow-text"); });
    });
    document.querySelectorAll(".btn,.mark,.totop,.lang").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect(), x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        el.style.transform = "translate(" + x * .25 + "px," + y * .3 + "px)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; el.style.transition = "transform .5s cubic-bezier(.22,1,.36,1)"; setTimeout(function () { el.style.transition = ""; }, 500); });
    });
    document.querySelectorAll("[data-tilt]").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        el.style.transform = "perspective(800px) rotateX(" + (-py * 6) + "deg) rotateY(" + (px * 8) + "deg) translateZ(6px)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; el.style.transition = "transform .6s cubic-bezier(.22,1,.36,1)"; setTimeout(function () { el.style.transition = ""; }, 600); });
    });
  }

  function initBg() {
    var cv = document.getElementById("bg");
    if (window.matchMedia("(prefers-reduced-motion:reduce)").matches) { cv.style.display = "none"; return; }
    var ctx = cv.getContext("2d"), DPR = Math.min(2, window.devicePixelRatio || 1), W, H, tk = 0;
    var blobs = [
      { x: .2, y: .3, r: .5, c: [125, 118, 255], vx: .00006, vy: .00009 },
      { x: .8, y: .25, r: .42, c: [80, 160, 180], vx: -.00008, vy: .00006 },
      { x: .6, y: .8, r: .55, c: [200, 120, 150], vx: .00005, vy: -.00007 },
      { x: .35, y: .7, r: .4, c: [90, 80, 200], vx: -.00006, vy: -.00005 }
    ];
    function resize() { W = cv.width = innerWidth * DPR; H = cv.height = innerHeight * DPR; cv.style.width = innerWidth + "px"; cv.style.height = innerHeight + "px"; }
    resize(); addEventListener("resize", resize);
    (function draw() {
      tk++; ctx.clearRect(0, 0, W, H); ctx.globalCompositeOperation = "lighter";
      blobs.forEach(function (b, i) {
        b.x += Math.sin(tk * b.vx * 60 + i) * .0008 + b.vx * 40;
        b.y += Math.cos(tk * b.vy * 60 + i) * .0008 + b.vy * 40;
        if (b.x < -.2) b.x = 1.2; if (b.x > 1.2) b.x = -.2; if (b.y < -.2) b.y = 1.2; if (b.y > 1.2) b.y = -.2;
        var cx = b.x * W, cy = b.y * H, rr = b.r * Math.max(W, H);
        var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr);
        g.addColorStop(0, "rgba(" + b.c[0] + "," + b.c[1] + "," + b.c[2] + ",.18)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalCompositeOperation = "source-over"; requestAnimationFrame(draw);
    })();
  }

  /* ---------- boot ---------- */
  build();
  applyLang(LANG);
  document.getElementById("lang").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return; applyLang(b.dataset.lang);
  });
  initImgFade(); initReveal(); initSpy(); initCounter(); initNav(); initCursor(); initBg();
})();
