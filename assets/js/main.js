(function () {
  "use strict";

  var page = document.body.dataset.page;
  var P = window.PROJECTS || [];

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  /* ───── Nav ───── */
  var navMount = document.querySelector("[data-nav]");
  if (navMount) {
    var cur = navMount.dataset.nav;
    var links = [["HOME", "index.html", "home"], ["ABOUT", "about.html", "about"], ["WORKS", "works.html", "works"]];
    navMount.innerHTML =
      '<div class="nav__inner"><a href="index.html">KIM YERI</a><nav class="nav__links" aria-label="주요 메뉴">' +
      links.map(function (l) {
        return '<a href="' + l[1] + '"' + (l[2] === cur ? ' aria-current="page"' : "") + ">" + l[0] + "</a>";
      }).join("") +
      "</nav></div>";
  }

  /* ───── Pill button ───── */
  function pill(label, href) {
    return '<a class="pill" href="' + href + '"><span class="pill__label">' + esc(label) +
      '</span><span class="pill__arrow" aria-hidden="true">↗</span></a>';
  }

  /* ───── Cover: 1920×1080 포스터를 화면에 맞춰 축소 ───── */
  var cover = document.querySelector(".cover");
  if (cover) {
    var fit = function () {
      var s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
      cover.style.transform = "scale(" + s + ")";
      cover.parentElement.style.height = Math.max(window.innerHeight, 1080 * s) + "px";
      cover.style.margin = (-(1080 - 1080 * s) / 2) + "px " + (-(1920 - 1920 * s) / 2) + "px";
    };
    fit();
    window.addEventListener("resize", fit);
  }

  /* ───── Works list ───── */
  var list = document.querySelector("[data-works]");
  if (list) {
    P.forEach(function (p) {
      var a = el("a", "works__row reveal");
      a.href = "work.html?p=" + p.slug;
      a.innerHTML =
        '<span class="works__title">' + esc(p.row.title) + "</span>" +
        '<span class="works__cat">' + esc(p.row.cat) + "</span>" +
        '<span class="works__client">' + esc(p.row.client) + "</span>" +
        '<span class="works__period">' + esc(p.row.period) + "</span>" +
        '<span class="works__go" aria-hidden="true">↗</span>';
      list.appendChild(a);
    });
  }

  /* ───── Project detail ───── */
  var pj = document.querySelector("[data-project]");
  if (pj) {
    var slug = new URLSearchParams(location.search).get("p") || P[0].slug;
    var idx = Math.max(0, P.findIndex(function (p) { return p.slug === slug; }));
    var p = P[idx];
    var next = P[idx + 1];
    var nextBtn = next ? pill("Next project", "work.html?p=" + next.slug) : pill("Back to works", "works.html");
    document.title = p.row.title + " — Kim Yeri";

    var side =
      '<h1 class="pj__title">' + esc(p.title) + "</h1>" +
      '<p class="pj__kor">' + esc(p.kor) + "</p>" +
      '<div class="info">' + p.info.map(function (r) {
        return '<div class="info__row"><span class="label">' + esc(r[0]) + '</span><span class="info__value">' + esc(r[1]) + "</span></div>";
      }).join("") + "</div>" +
      '<div class="pj__block"><span class="label">Summary</span><p class="pj__text">' + esc(p.summary).replace(/\n/g, " <br class=\"d-br\">") + "</p></div>" +
      (p.result ? '<div class="pj__block"><span class="label">Result</span><p class="pj__text">' + esc(p.result).replace(/\n/g, " <br class=\"d-br\">") + "</p></div>" : "") +
      nextBtn;
    pj.querySelector(".split__side").innerHTML = side;
    var mNext = document.querySelector(".mobile-next");
    if (mNext) mNext.innerHTML = nextBtn;

    var main = pj.querySelector(".split__main");
    var IMG = "assets/img/";
    // 피그마 줄바꿈은 데스크톱에서만 살리고, 모바일에선 자연스럽게 흐르게
    var br = function (t) { return esc(t).replace(/\n/g, ' <br class="d-br">'); };
    var pic = function (src, w, h, alt, eager) {
      return '<img src="' + IMG + src + '.webp"' + (w ? ' width="' + w + '" height="' + h + '"' : "") +
        ' alt="' + esc(alt || "") + '"' + (eager ? "" : ' loading="lazy"') + ' decoding="async">';
    };
    var alt = p.kor;
    var firstImg = true;
    var item = function (it) {
      var ratio = it.r.replace("/", " / ");
      if (it.slides) {
        var h = '<div class="carousel" data-carousel style="aspect-ratio:' + ratio + '"><div class="carousel__track">';
        it.slides.forEach(function (src) { h += '<div class="carousel__slide">' + pic(src, null, null, alt) + "</div>"; });
        return h + "</div></div>";
      }
      if (it.scroll) {
        return '<div class="scrollbox" tabindex="0" style="aspect-ratio:' + ratio + '">' + pic(it.scroll, null, null, alt) + "</div>";
      }
      return '<div class="media' + (it.video ? " media--video" : "") + '" style="aspect-ratio:' + ratio + '">' + pic(it.src, null, null, alt) + "</div>";
    };
    var block = function (bl) {
      if (bl.img) {
        var e = firstImg; firstImg = false;
        return '<figure class="full reveal">' + pic(bl.img, bl.w, bl.h, alt, e) + "</figure>";
      }
      if (bl.sub) return '<h3 class="section-h section-h--sub reveal">' + esc(bl.sub) + "</h3>";
      if (bl.display) return '<p class="display reveal">' + esc(bl.display) + "</p>";
      if (bl.items) {
        var cols = typeof bl.cols === "number" ? "repeat(" + bl.cols + ", 1fr)" : bl.cols;
        return '<div class="grid grid--media grid--n' + bl.items.length + ' reveal" style="--cols:' + cols + '">' + bl.items.map(item).join("") + "</div>";
      }
      if (bl.cols) {
        return '<div class="tcols tcols--' + bl.cols.length + (bl.label ? " tcols--label" : "") + ' reveal">' + bl.cols.map(function (c) {
          return '<div class="tcol"><p class="tcol__h">' + esc(c[0]) + '</p><p class="tcol__b">' + br(c[1]) + "</p></div>";
        }).join("") + "</div>";
      }
      if (bl.brand) {
        var d = bl.brand;
        var cell = function (label, body) { return '<div class="brand__cell"><span class="label">' + label + "</span>" + body + "</div>"; };
        return '<div class="brand reveal">' +
          '<div class="brand__logos">' + pic(d.logos.img, d.logos.w, d.logos.h, alt) + "</div>" +
          '<div class="brand__grid">' +
          cell("OVERVIEW", '<p class="brand__p">' + br(d.overview) + "</p>") +
          cell("PROBLEM", '<p class="brand__p">' + br(d.problem) + "</p>") +
          cell("LOGO CONCEPT", '<div class="brand__logo">' + d.logo.map(function (t) { return '<p class="brand__c">' + br(t) + "</p>"; }).join("") + "</div>") +
          cell("CORE VALUE", '<div class="brand__core">' + d.core.map(function (c) {
            return '<div class="brand__v"><span class="brand__ring">' + esc(c[0]) + '</span><p class="brand__c">' + esc(c[1]) + "</p></div>";
          }).join("") + "</div>") +
          '<div class="brand__cell brand__cell--wide"><span class="label">BRAND STORY</span><div class="brand__two">' +
          d.story.map(function (t) { return '<p class="brand__p">' + br(t) + "</p>"; }).join("") + "</div></div>" +
          "</div></div>";
      }
      return "";
    };

    // p.feature(3D 패키지, 박스 언박싱)는 작업 페이지 단계에서 붙인다
    p.sections.forEach(function (s, k) {
      var sec = el("section", "pj-sec");
      var html = "";
      if (s.h) html += '<h2 class="section-h reveal">' + esc(s.h) + "</h2>";
      if (s.desc) html += '<p class="pj-sec__desc reveal">' + br(s.desc) + "</p>";
      var blocks = (s.rows || []).map(function (r) { return { cols: r.cols, items: r.items }; }).concat(s.blocks || []);
      html += '<div class="pj-sec__media' + (s.h ? "" : " pj-sec__media--flush") + '">' + blocks.map(block).join("") + "</div>";
      sec.innerHTML = html;
      main.appendChild(sec);
    });
  }

  /* ───── Carousel: 첫 장은 다음만, 마지막은 이전만, 중간은 둘 다 ───── */
  var chev = function (dir) {
    return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="' +
      (dir === "prev" ? "M10 3 L5 8 L10 13" : "M6 3 L11 8 L6 13") + '"/></svg>';
  };
  document.querySelectorAll("[data-carousel]").forEach(function (c) {
    var track = c.querySelector(".carousel__track");
    var n = track.children.length;
    var i = 0;
    var prev = el("button", "carousel__btn carousel__btn--prev", chev("prev"));
    var nxt = el("button", "carousel__btn carousel__btn--next", chev("next"));
    prev.type = nxt.type = "button";
    prev.setAttribute("aria-label", "이전");
    nxt.setAttribute("aria-label", "다음");
    c.appendChild(prev);
    c.appendChild(nxt);
    function go(k) {
      i = Math.max(0, Math.min(n - 1, k));
      track.style.transform = "translateX(" + (-100 * i) + "%)";
      prev.hidden = i === 0;
      nxt.hidden = i === n - 1;
    }
    prev.addEventListener("click", function () { go(i - 1); });
    nxt.addEventListener("click", function () { go(i + 1); });
    var x0 = null;
    c.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    c.addEventListener("touchend", function (e) {
      if (x0 == null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
      x0 = null;
    });
    go(0);
  });

  /* ───── Reveal on scroll ───── */
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (n, k) {
      n.style.transitionDelay = Math.min(k % 8, 6) * 40 + "ms";
      io.observe(n);
    });
  } else {
    items.forEach(function (n) { n.classList.add("is-in"); });
  }

  void page;
})();
