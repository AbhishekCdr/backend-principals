/* ==========================================================================
   Backend Principles — app.js
   Vanilla, no dependencies. Renders nav, TOC, scrollspy, palette, theme.

   To add a lesson: drop a new file in sections/ and add one entry to LESSONS.
   ========================================================================== */
(function () {
  'use strict';

  /* --- the single source of truth for course structure -------------------- */
  var LESSONS = [
    {
      num: '01',
      slug: '01-http',
      title: 'Understanding HTTP',
      blurb: 'The protocol every backend conversation starts with — statelessness, headers, methods, CORS, status codes, caching and compression.',
      tags: ['statelessness', 'headers', 'methods', 'CORS', 'status codes', 'caching', 'TLS']
    },
    {
      num: '02',
      slug: '02-routing',
      title: 'Routing',
      blurb: 'How a request finds its handler. Method is the what, the route is the where — static routes, path params, query params, nesting and versioning.',
      tags: ['static routes', 'path params', 'query params', 'nesting', 'versioning', 'catch-all']
    },
    {
      num: '03',
      slug: '03-serialization',
      title: 'Serialization & Deserialization',
      blurb: 'How a JavaScript object becomes something a Rust server understands: agreeing on a common wire format, and why that format is usually JSON.',
      tags: ['wire format', 'JSON', 'text vs binary', 'Protobuf', 'OSI model']
    },
    {
      num: '04',
      slug: '04-auth',
      title: 'Authentication & Authorization',
      blurb: 'Who are you, and what may you do? Sessions, JWTs and cookies; stateful vs stateless; API keys; OAuth 2.0 and OIDC; RBAC; timing attacks.',
      tags: ['sessions', 'JWT', 'cookies', 'OAuth 2.0', 'OIDC', 'RBAC', 'timing attacks']
    }
  ];

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* base path prefix: pages inside sections/ need "../" to reach the root */
  var ROOT = document.documentElement.getAttribute('data-root') || '';

  function lessonHref(slug) { return ROOT + 'sections/' + slug + '.html'; }

  function currentSlug() {
    var m = location.pathname.match(/sections\/([^/]+)\.html/);
    return m ? m[1] : null;
  }

  function slugify(s) {
    return s.toLowerCase().trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  /* --- 1. sidebar + pager ------------------------------------------------- */
  function renderNav() {
    var here = currentSlug();
    var list = $('#nav-list');
    if (list) {
      list.innerHTML = LESSONS.map(function (l) {
        var active = l.slug === here ? ' is-active' : '';
        return '<li><a class="nav-item' + active + '" href="' + lessonHref(l.slug) + '">' +
               '<span class="nav-num">' + l.num + '</span>' +
               '<span>' + l.title + '</span></a></li>';
      }).join('');
    }

    var grid = $('#lesson-grid');
    if (grid) {
      grid.innerHTML = LESSONS.map(function (l) {
        return '<a class="card card-link" href="' + lessonHref(l.slug) + '">' +
          '<div class="card-num">LESSON ' + l.num + '</div>' +
          '<h3>' + l.title + '</h3>' +
          '<p>' + l.blurb + '</p>' +
          '<div class="card-tags">' + l.tags.map(function (t) {
            return '<span>' + t + '</span>';
          }).join('') + '</div>' +
          '<div class="card-cta"><span>Read notes</span><span>&rarr;</span></div>' +
        '</a>';
      }).join('');
    }

    var pager = $('#pager');
    if (pager && here) {
      var i = LESSONS.findIndex(function (l) { return l.slug === here; });
      var out = '';
      if (i > 0) {
        out += '<a href="' + lessonHref(LESSONS[i - 1].slug) + '">' +
          '<div class="pager-dir">&larr; Previous &middot; Lesson ' + LESSONS[i - 1].num + '</div>' +
          '<div class="pager-title">' + LESSONS[i - 1].title + '</div></a>';
      } else {
        out += '<a href="' + ROOT + 'index.html">' +
          '<div class="pager-dir">&larr; Back</div>' +
          '<div class="pager-title">Course home</div></a>';
      }
      if (i > -1 && i < LESSONS.length - 1) {
        out += '<a class="pager-next" href="' + lessonHref(LESSONS[i + 1].slug) + '">' +
          '<div class="pager-dir">Next &middot; Lesson ' + LESSONS[i + 1].num + ' &rarr;</div>' +
          '<div class="pager-title">' + LESSONS[i + 1].title + '</div></a>';
      }
      pager.innerHTML = out;
    }

    var crumb = $('#crumb');
    if (crumb && here) {
      var cur = LESSONS.find(function (l) { return l.slug === here; });
      if (cur) crumb.textContent = 'Lesson ' + cur.num + ' / ' + cur.title;
    }
  }

  /* --- 2. table of contents ---------------------------------------------- */
  var headings = [];

  function buildToc() {
    var prose = $('.prose');
    var toc = $('#toc-list');
    if (!prose) return;

    headings = $$('h2, h3', prose);
    var used = {};
    headings.forEach(function (h) {
      if (!h.id) {
        var base = slugify(h.textContent) || 'section';
        var id = base, n = 2;
        while (used[id] || document.getElementById(id)) { id = base + '-' + n++; }
        h.id = id;
      }
      used[h.id] = true;

      var a = document.createElement('a');
      a.className = 'anchor';
      a.href = '#' + h.id;
      a.setAttribute('aria-label', 'Link to this section');
      a.textContent = '#';
      h.appendChild(a);
    });

    if (!toc) return;
    toc.innerHTML = headings.map(function (h) {
      var cls = h.tagName === 'H3' ? ' class="toc-h3"' : '';
      var label = h.textContent.replace(/#$/, '');
      return '<li' + cls + '><a href="#' + h.id + '">' + label + '</a></li>';
    }).join('');
  }

  /* --- 3. scrollspy ------------------------------------------------------- */
  function initScrollSpy() {
    var links = $$('#toc-list a');
    if (!links.length || !('IntersectionObserver' in window)) return;

    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var visible = new Set();

    function paint() {
      var best = null;
      headings.forEach(function (h) {
        if (visible.has(h.id) && !best) best = h.id;
      });
      if (!best) return;
      links.forEach(function (a) { a.classList.remove('is-active'); });
      if (byId[best]) byId[best].classList.add('is-active');
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) visible.add(e.target.id);
        else visible.delete(e.target.id);
      });
      paint();
    }, { rootMargin: '-' + (56 + 20) + 'px 0px -70% 0px', threshold: 0 });

    headings.forEach(function (h) { io.observe(h); });
  }

  /* --- 4. reading progress ----------------------------------------------- */
  function initProgress() {
    var bar = $('#progress');
    if (!bar) return;
    var queued = false;
    function paint() {
      queued = false;
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
      bar.style.width = Math.min(100, Math.max(0, pct)) + '%';
    }
    window.addEventListener('scroll', function () {
      if (!queued) { queued = true; requestAnimationFrame(paint); }
    }, { passive: true });
    paint();
  }

  /* --- 5. theme ---------------------------------------------------------- */
  function initTheme() {
    var btn = $('#theme-toggle');
    if (!btn) return;
    function label() {
      var dark = document.documentElement.getAttribute('data-theme') !== 'light';
      btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
      btn.innerHTML = dark
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>';
    }
    btn.addEventListener('click', function () {
      var dark = document.documentElement.getAttribute('data-theme') !== 'light';
      var next = dark ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('bp-theme', next); } catch (e) {}
      label();
    });
    label();
  }

  /* --- 6. command palette ------------------------------------------------ */
  function initPalette() {
    var backdrop = $('#palette');
    if (!backdrop) return;
    var input   = $('#palette-input');
    var results = $('#palette-results');
    var sel = 0, items = [];

    var index = [];
    LESSONS.forEach(function (l) {
      index.push({
        kind: 'Lesson', title: l.title, ctx: l.num,
        href: lessonHref(l.slug),
        hay: (l.title + ' ' + l.blurb + ' ' + l.tags.join(' ') + ' lesson ' + l.num).toLowerCase()
      });
      l.tags.forEach(function (t) {
        index.push({
          kind: 'Topic', title: t, ctx: 'L' + l.num,
          href: lessonHref(l.slug),
          hay: (t + ' ' + l.title).toLowerCase()
        });
      });
    });
    headings.forEach(function (h) {
      var label = h.textContent.replace(/#$/, '');
      index.push({
        kind: h.tagName === 'H2' ? 'Section' : 'Heading',
        title: label, ctx: 'this page',
        href: '#' + h.id,
        hay: label.toLowerCase()
      });
    });

    function render(q) {
      q = q.trim().toLowerCase();
      var hits = q
        ? index.filter(function (it) { return it.hay.indexOf(q) > -1; })
        : index.filter(function (it) { return it.kind === 'Lesson' || it.kind === 'Section'; });

      hits = hits.slice(0, 40);
      sel = 0;

      if (!hits.length) {
        results.innerHTML = '<div class="p-empty">Nothing matches &ldquo;' +
          q.replace(/[<>&]/g, '') + '&rdquo;</div>';
        items = [];
        return;
      }

      var html = '', group = null;
      hits.forEach(function (it, i) {
        if (it.kind !== group) {
          group = it.kind;
          html += '<div class="p-group">' + group + '</div>';
        }
        html += '<a class="p-item' + (i === 0 ? ' is-sel' : '') + '" href="' + it.href + '" data-i="' + i + '">' +
          '<span class="p-kind">' + it.kind + '</span>' +
          '<span class="p-title">' + it.title + '</span>' +
          '<span class="p-ctx">' + it.ctx + '</span></a>';
      });
      results.innerHTML = html;
      items = $$('.p-item', results);
      items.forEach(function (el) {
        el.addEventListener('mouseenter', function () { move(+el.dataset.i - sel); });
      });
    }

    function move(d) {
      if (!items.length) return;
      items[sel].classList.remove('is-sel');
      sel = (sel + d + items.length) % items.length;
      items[sel].classList.add('is-sel');
      items[sel].scrollIntoView({ block: 'nearest' });
    }

    function open() {
      backdrop.classList.add('is-open');
      input.value = '';
      render('');
      input.focus();
    }
    function close() { backdrop.classList.remove('is-open'); }

    $$('.js-open-palette').forEach(function (b) { b.addEventListener('click', open); });
    input.addEventListener('input', function () { render(input.value); });

    backdrop.addEventListener('click', function (e) { if (e.target === backdrop) close(); });

    document.addEventListener('keydown', function (e) {
      var isOpen = backdrop.classList.contains('is-open');
      var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);

      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        isOpen ? close() : open();
        return;
      }
      if (e.key === '/' && !isOpen && !typing) { e.preventDefault(); open(); return; }
      if (!isOpen) return;

      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter' && items[sel]) {
        e.preventDefault();
        var href = items[sel].getAttribute('href');
        close();
        if (href.charAt(0) === '#') {
          var t = document.getElementById(href.slice(1));
          if (t) { history.replaceState(null, '', href); t.scrollIntoView(); }
        } else {
          location.href = href;
        }
      }
    });
  }

  /* --- 7. mobile drawer -------------------------------------------------- */
  function initMobileNav() {
    var btn = $('#hamburger'), sb = $('#sidebar'), scrim = $('#nav-scrim');
    if (!btn || !sb) return;
    function set(open) {
      sb.classList.toggle('is-open', open);
      if (scrim) scrim.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    }
    btn.addEventListener('click', function () { set(!sb.classList.contains('is-open')); });
    if (scrim) scrim.addEventListener('click', function () { set(false); });
    $$('#nav-list a').forEach(function (a) { a.addEventListener('click', function () { set(false); }); });
  }

  /* --- boot -------------------------------------------------------------- */
  function boot() {
    renderNav();
    buildToc();
    initScrollSpy();
    initProgress();
    initTheme();
    initPalette();
    initMobileNav();
    var y = $('#year');
    if (y) y.textContent = new Date().getFullYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
