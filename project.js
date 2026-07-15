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

  /* cover + gallery from the project's own folder */
  document.getElementById("dCover").src = p.folder + "/cover.png";
  (function () {
    var gal = document.getElementById("dGallery"), galH = document.querySelector(".d-gallery-h");
    var n = p.shots || 0;
    if (n > 0) {
      var html = "";
      for (var k = 1; k <= n; k++) html += "<div class='blk reveal'><img src='" + p.folder + "/" + String(k).padStart(2, "0") + ".png' alt=''></div>";
      gal.innerHTML = html;
    } else { gal.style.display = "none"; if (galH) galH.style.display = "none"; }
  })();

  /* optional video: local file path OR YouTube / Vimeo / Bilibili link */
  (function () {
    var wrap = document.getElementById("dVideo");
    if (!p.video) { wrap.style.display = "none"; return; }
    var url = p.video, embed = null, m;
    if ((m = url.match(/(?:youtube\.com\/.*[?&]v=|youtu\.be\/)([\w-]+)/))) embed = "https://www.youtube.com/embed/" + m[1];
    else if ((m = url.match(/vimeo\.com\/(\d+)/))) embed = "https://player.vimeo.com/video/" + m[1];
    else if ((m = url.match(/bilibili\.com\/video\/(BV[\w]+)/i))) embed = "https://player.bilibili.com/player.html?bvid=" + m[1] + "&autoplay=0";
    if (embed) wrap.innerHTML = "<div class='d-video'><iframe src='" + embed + "' allow='autoplay; fullscreen; picture-in-picture' allowfullscreen loading='lazy'></iframe></div>";
    else wrap.innerHTML = "<div class='d-video'><video src='" + url + "' controls autoplay muted loop playsinline preload='metadata'></video></div>";
  })();

  function applyLang(lang) {
    LANG = lang;
    try { localStorage.setItem("lang", lang); } catch (e) {}
    document.documentElement.setAttribute("lang", lang === "zh" ? "zh-CN" : "en");
    document.querySelectorAll("[data-i18n]").forEach(function (el) { el.textContent = t(el.getAttribute("data-i18n")); });

    document.title = p.title[lang] + " — YOUR NAME";
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
  document.querySelectorAll(".d-cover img, .d-gallery .blk img").forEach(function (img) {
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
