/* ============================================================
   Project detail page — reads ?id=, bilingual, shared fx
   ============================================================ */
(function () {
  var LANG = "en";
  try { var s = localStorage.getItem("lang"); if (s === "en" || s === "zh") LANG = s; } catch (e) {}
  function t(k) { return (window.I18N[LANG] && window.I18N[LANG][k]) || window.I18N.en[k] || k; }

  /* find project by ?id= */
  function param(n) { var m = new RegExp("[?&]" + n + "=([^&]+)").exec(location.search); return m ? decodeURIComponent(m[1]) : null; }
  var id = param("id");
  var list = window.PROJECTS;
  var i = 0;
  for (var j = 0; j < list.length; j++) { if (list[j].id === id) { i = j; break; } }
  var p = list[i];
  var next = list[(i + 1) % list.length];

  /* cover hero */
  document.getElementById("dCover").src = p.folder + "/" + (p.cover || "cover.png");

  /* unified media: ordered list of images + videos, each shown at its own ratio (width-adaptive).
     item = { t:"img"|"vid"|"embed", src:"01.webp" | "02.mp4" | "https://youtu.be/..." } */
  (function () {
    var wrap = document.getElementById("dMedia"), h = document.getElementById("dMediaH");
    var media = p.media || [];
    if (!media.length && ((p.shots && p.shots.length) || (p.videos && p.videos.length))) { // backward compat
      media = [];
      (p.shots || []).forEach(function (s) { media.push({ t: "img", src: s }); });
      (p.videos || []).forEach(function (v) { media.push({ t: /^https?:/.test(v) ? "embed" : "vid", src: v }); });
    }
    if (!media.length) { wrap.style.display = "none"; if (h) h.style.display = "none"; return; }
    wrap.innerHTML = media.map(function (it) {
      if (it.t === "link" || it.t === "file") {
        var isFile = it.t === "file";
        var title = it.title || (isFile ? (LANG === "zh" ? "下载附件" : "Download") : (LANG === "zh" ? "查看" : "View"));
        var subEn = isFile ? "Download attachment" : "Open preview";
        var subZh = isFile ? "下载附件" : "点开浮窗预览";
        var icon = isFile
          ? "<svg viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'><path d='M12 3v12'/><path d='m7 11 5 5 5-5'/><path d='M5 21h14'/></svg>"
          : "<svg viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='currentColor' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='4' width='18' height='16' rx='2'/><path d='M3 9h18'/><circle cx='6' cy='6.5' r='.6' fill='currentColor'/><circle cx='8.4' cy='6.5' r='.6' fill='currentColor'/></svg>";
        if (isFile) {
          return "<a class='d-card file reveal' href='" + it.src + "' download target='_blank' rel='noopener' data-cursor>" +
            "<span class='ic'>" + icon + "</span>" +
            "<span class='ct'><span class='cn'>" + title + "</span><span class='cs' data-en='" + subEn + "' data-zh='" + subZh + "'>" + (LANG === "zh" ? subZh : subEn) + "</span></span>" +
            "<span class='go'>↓</span></a>";
        }
        return "<div class='d-card link reveal'>" +
          "<a class='cardmain' href='" + it.src + "' data-modal='1' data-title='" + (it.title ? it.title.replace(/'/g, "&#39;") : "") + "' data-cursor>" +
          "<span class='ic'>" + icon + "</span>" +
          "<span class='ct'><span class='cn'>" + title + "</span><span class='cs' data-en='" + subEn + "' data-zh='" + subZh + "'>" + (LANG === "zh" ? subZh : subEn) + "</span></span></a>" +
          "<a class='cardgo' href='" + it.src + "' target='_blank' rel='noopener' data-en='Open in new window' data-zh='新窗口打开' title='" + (LANG === "zh" ? "新窗口打开" : "Open in new window") + "'>↗</a></div>";
      }
      if (it.t === "embed") {
        var m, e = it.src;
        if ((m = it.src.match(/(?:youtube\.com\/.*[?&]v=|youtu\.be\/)([\w-]+)/))) e = "https://www.youtube.com/embed/" + m[1];
        else if ((m = it.src.match(/vimeo\.com\/(\d+)/))) e = "https://player.vimeo.com/video/" + m[1];
        else if ((m = it.src.match(/bilibili\.com\/video\/(BV[\w]+)/i))) e = "https://player.bilibili.com/player.html?bvid=" + m[1] + "&autoplay=0";
        return "<div class='d-m embed reveal'><iframe src='" + e + "' allow='autoplay; fullscreen; picture-in-picture' allowfullscreen loading='lazy'></iframe></div>";
      }
      var src = (it.src.indexOf("http") === 0 || it.src.indexOf("works/") === 0) ? it.src : p.folder + "/" + it.src;
      if (it.t === "vid") return "<div class='d-m vid reveal'><video src='" + src + "' controls autoplay muted loop playsinline preload='metadata'></video></div>";
      return "<div class='d-m img reveal'><img src='" + src + "' loading='lazy' alt=''></div>";
    }).join("");
  })();

  /* ---------- link-card modal (iframe lightbox) ---------- */
  (function modal() {
    var m = document.createElement("div");
    m.className = "pmodal";
    m.innerHTML =
      "<div class='pmodal-inner'>" +
        "<div class='pmodal-bar'>" +
          "<span class='pmodal-title'></span>" +
          "<div class='pmodal-acts'>" +
            "<a class='pmodal-new' target='_blank' rel='noopener' title='' aria-label='open in new window'>↗</a>" +
            "<button class='pmodal-close' aria-label='close'>✕</button>" +
          "</div>" +
        "</div>" +
        "<div class='pmodal-body'><div class='pmodal-load'>Loading…</div><iframe title='preview' loading='lazy'></iframe></div>" +
      "</div>";
    document.body.appendChild(m);
    var frame = m.querySelector("iframe"), tEl = m.querySelector(".pmodal-title"), newA = m.querySelector(".pmodal-new"), load = m.querySelector(".pmodal-load");

    function open(url, title) {
      tEl.textContent = title || "";
      newA.href = url;
      load.style.display = "";
      frame.style.opacity = "0";
      frame.src = url;
      m.classList.add("open");
      document.documentElement.classList.add("modal-lock");
    }
    function close() {
      m.classList.remove("open");
      document.documentElement.classList.remove("modal-lock");
      setTimeout(function () { frame.src = "about:blank"; }, 250);
    }
    frame.addEventListener("load", function () { load.style.display = "none"; frame.style.opacity = "1"; });
    m.addEventListener("click", function (e) { if (e.target === m) close(); });
    m.querySelector(".pmodal-close").addEventListener("click", close);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && m.classList.contains("open")) close(); });

    document.querySelectorAll(".d-card.link .cardmain").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        open(a.getAttribute("href"), a.getAttribute("data-title") || "");
      });
    });
  })();

  function applyLang(lang) {
    LANG = lang;
    try { localStorage.setItem("lang", lang); } catch (e) {}
    document.documentElement.setAttribute("lang", lang === "zh" ? "zh-CN" : "en");
    document.querySelectorAll("[data-i18n]").forEach(function (el) { el.textContent = t(el.getAttribute("data-i18n")); });
    document.querySelectorAll(".d-card [data-en][data-zh]").forEach(function (el) {
      var txt = el.getAttribute("data-" + lang);
      if (el.classList.contains("cardgo")) el.setAttribute("title", txt); else el.textContent = txt;
    });

    document.title = p.title[lang] + " — Morimoto Zhang";
    document.getElementById("dCat").textContent = t("cat_" + p.cat);
    document.getElementById("dTitle").textContent = p.title[lang];
    document.getElementById("dMetaCat").textContent = t("cat_" + p.cat);
    document.getElementById("dMetaYear").textContent = p.year;
    document.getElementById("dMetaRole").textContent = p.role[lang];
    document.getElementById("dBody").innerHTML = p.about[lang].map(function (para) { return "<p>" + para + "</p>"; }).join("");

    var nx = document.getElementById("dNext");
    nx.href = "project.html?id=" + next.id;
    nx.innerHTML = "<span class='nm'>" + next.title[lang] + "</span> <span class='ar'>↗</span>";

    document.querySelectorAll("#lang button").forEach(function (b) { b.classList.toggle("on", b.dataset.lang === lang); });
  }

  applyLang(LANG);
  document.getElementById("lang").addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) applyLang(b.dataset.lang); });

  /* fade images in on load */
  document.querySelectorAll(".d-cover img, .d-m.img img").forEach(function (img) {
    if (img.complete && img.naturalWidth) { img.classList.add("loaded"); return; }
    img.addEventListener("load", function () { img.classList.add("loaded"); });
    img.addEventListener("error", function () { img.classList.add("loaded"); });
  });

  /* ---------- shared fx ---------- */
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { threshold: .12, rootMargin: "0px 0px -6% 0px" });
  document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

  (function nav() {
    var nav = document.getElementById("nav"), prog = document.getElementById("progress");
    function onScroll() {
      var y = window.scrollY; nav.classList.toggle("solid", y > 30);
      var h = document.documentElement.scrollHeight - window.innerHeight;
      prog.style.transform = "scaleX(" + Math.min(1, y / (h || 1)) + ")";
    }
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
    var mm = document.getElementById("mobmenu");
    document.getElementById("burger").onclick = function () { mm.classList.add("open"); };
    document.getElementById("mmClose").onclick = function () { mm.classList.remove("open"); };
    mm.querySelectorAll("a").forEach(function (a) { a.onclick = function () { mm.classList.remove("open"); }; });
    document.getElementById("totop").onclick = function () { window.scrollTo({ top: 0, behavior: "smooth" }); };
  })();

  (function cursor() {
    if (window.matchMedia("(pointer:coarse)").matches) return;
    var c = document.getElementById("cursor"), d = document.getElementById("cursorDot");
    var mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my;
    addEventListener("mousemove", function (e) { mx = e.clientX; my = e.clientY; d.style.transform = "translate(" + mx + "px," + my + "px) translate(-50%,-50%)"; });
    (function loop() { cx += (mx - cx) * .16; cy += (my - cy) * .16; c.style.transform = "translate(" + cx + "px," + cy + "px) translate(-50%,-50%)"; requestAnimationFrame(loop); })();
    document.querySelectorAll("[data-cursor], a, button").forEach(function (el) {
      el.addEventListener("mouseenter", function () { c.classList.add("grow"); if (el.dataset.cursorLabel) { c.classList.add("grow-text"); c.setAttribute("data-label", el.dataset.cursorLabel); } });
      el.addEventListener("mouseleave", function () { c.classList.remove("grow", "grow-text"); });
    });
    document.querySelectorAll(".mark,.totop,.lang,.backlink").forEach(function (el) {
      el.addEventListener("mousemove", function (e) { var r = el.getBoundingClientRect(), x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2; el.style.transform = "translate(" + x * .22 + "px," + y * .28 + "px)"; });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; el.style.transition = "transform .5s cubic-bezier(.22,1,.36,1)"; setTimeout(function () { el.style.transition = ""; }, 500); });
    });
  })();

  (function bg() {
    var cv = document.getElementById("bg");
    if (window.matchMedia("(prefers-reduced-motion:reduce)").matches) { cv.style.display = "none"; return; }
    var ctx = cv.getContext("2d"), DPR = Math.min(2, window.devicePixelRatio || 1), W, H, tk = 0;
    var blobs = [{ x: .25, y: .3, r: .5, c: [125, 118, 255], vx: .00006, vy: .00009 }, { x: .8, y: .3, r: .45, c: [80, 160, 180], vx: -.00008, vy: .00006 }, { x: .55, y: .8, r: .5, c: [200, 120, 150], vx: .00005, vy: -.00007 }];
    function resize() { W = cv.width = innerWidth * DPR; H = cv.height = innerHeight * DPR; cv.style.width = innerWidth + "px"; cv.style.height = innerHeight + "px"; }
    resize(); addEventListener("resize", resize);
    (function draw() {
      tk++; ctx.clearRect(0, 0, W, H); ctx.globalCompositeOperation = "lighter";
      blobs.forEach(function (b, k) {
        b.x += Math.sin(tk * b.vx * 60 + k) * .0008 + b.vx * 40; b.y += Math.cos(tk * b.vy * 60 + k) * .0008 + b.vy * 40;
        if (b.x < -.2) b.x = 1.2; if (b.x > 1.2) b.x = -.2; if (b.y < -.2) b.y = 1.2; if (b.y > 1.2) b.y = -.2;
        var cx = b.x * W, cy = b.y * H, rr = b.r * Math.max(W, H), g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr);
        g.addColorStop(0, "rgba(" + b.c[0] + "," + b.c[1] + "," + b.c[2] + ",.16)"); g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalCompositeOperation = "source-over"; requestAnimationFrame(draw);
    })();
  })();
})();
