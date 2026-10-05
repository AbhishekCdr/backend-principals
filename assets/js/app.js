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
      blurb: 'Understand how a client and server exchange requests, responses and data.',
      outcomes: ['Read HTTP messages, headers and status codes.', 'Explain methods, statelessness and CORS.', 'Trace caching, compression and secure connections.'],
      tags: ['statelessness', 'headers', 'methods', 'CORS', 'status codes', 'caching', 'TLS']
    },
    {
      num: '02',
      slug: '02-routing',
      title: 'Routing',
      blurb: 'Follow a request from its method and URL to the right handler.',
      outcomes: ['Distinguish static routes, path parameters and query parameters.', 'Design nested routes and pagination inputs.', 'Explain versioning, deprecation and fallback routes.'],
      tags: ['static routes', 'path params', 'query params', 'nesting', 'versioning', 'catch-all']
    },
    {
      num: '03',
      slug: '03-serialization',
      title: 'Serialization & Deserialization',
      blurb: 'See how different languages exchange data through a shared format.',
      outcomes: ['Trace serialization and deserialization in both directions.', 'Compare text and binary formats.', 'Recognize valid JSON and its supported value types.'],
      tags: ['wire format', 'JSON', 'text vs binary', 'Protobuf', 'OSI model']
    },
    {
      num: '04',
      slug: '04-auth',
      title: 'Authentication & Authorization',
      blurb: 'Separate identity from permissions and understand the common authentication approaches.',
      outcomes: ['Distinguish identity checks from permission checks.', 'Compare sessions, JWTs, API keys and OAuth/OIDC.', 'Explain roles and avoid leaking account information.'],
      tags: ['sessions', 'JWT', 'cookies', 'OAuth 2.0', 'OIDC', 'RBAC', 'timing attacks']
    },
    {
      num: '05',
      slug: '05-validation',
      title: 'Validations & Transformations',
      blurb: 'Check and transform incoming data before it reaches business operations.',
      outcomes: ['Define an API input contract with type, format and meaning checks.', 'Handle cross-field rules and useful validation errors.', 'Convert and normalize input without changing its meaning.'],
      tags: ['validation', 'transformation', 'schemas', 'syntactic', 'semantic', 'coercion', 'data integrity']
    },
    {
      num: '06',
      slug: '06-request-lifecycle',
      title: 'Layers, Middleware & Request Context',
      blurb: 'Trace a request through handlers, services, repositories and shared middleware.',
      outcomes: ['Separate HTTP handling, business logic and persistence.', 'Explain middleware ordering, early responses and error handling.', 'Carry verified identity, tracing and cancellation through request context.'],
      tags: ['request lifecycle', 'handlers', 'controllers', 'services', 'repositories', 'repository pattern', 'middleware', 'request context', 'request ID', 'cancellation', 'error handling']
    },
    {
      num: '07',
      slug: '07-api-design',
      title: 'API Design',
      blurb: 'Design predictable REST-style APIs with clear resources, methods, payloads and responses.',
      outcomes: ['Model resources and choose routes, HTTP methods and status codes.', 'Design pagination, sorting, filtering and custom actions.', 'Document consistent contracts, defaults, errors and retry behavior.'],
      tags: ['REST', 'RESTful', 'API design', 'resources', 'representations', 'HTTP methods', 'CRUD', 'PUT', 'PATCH', 'idempotency', 'pagination', 'sorting', 'filtering', 'custom actions', 'OpenAPI', 'Swagger', 'versioning']
    },
    {
      num: '08',
      slug: '08-databases',
      title: 'Databases & PostgreSQL',
      blurb: 'Model persistent data and connect API operations to safe, efficient PostgreSQL queries.',
      outcomes: ['Choose data types, constraints and relationships for a project-management schema.', 'Use migrations, seed data and parameterized queries to support API operations.', 'Explain concurrency, indexes and automatic timestamp updates with triggers.'],
      tags: ['databases', 'PostgreSQL', 'SQL', 'DBMS', 'persistence', 'relational', 'NoSQL', 'data types', 'constraints', 'foreign keys', 'relationships', 'migrations', 'dbmate', 'seeding', 'joins', 'parameterized queries', 'SQL injection', 'indexes', 'triggers', 'transactions']
    }
  ];

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* base path prefix: pages inside sections/ need "../" to reach the root */
  var ROOT = document.documentElement.getAttribute('data-root') || '';
  var REVISION = new URLSearchParams(location.search).get('view') === 'revision';

  function lessonHref(slug, revision) {
    return ROOT + 'sections/' + slug + '.html' +
      ((revision === undefined ? REVISION : revision) ? '?view=revision' : '');
  }

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
        return '<li><a class="nav-item' + active + '"' + (active ? ' aria-current="page"' : '') + ' href="' + lessonHref(l.slug) + '">' +
               '<span class="nav-num">' + l.num + '</span>' +
               '<span>' + l.title + '</span></a></li>';
      }).join('');
    }

    var grid = $('#lesson-grid');
    if (grid) {
      grid.innerHTML = LESSONS.map(function (l) {
        return '<li class="lesson-entry">' +
          '<span class="lesson-number" aria-hidden="true">' + l.num + '</span>' +
          '<div class="lesson-info"><h3><a href="' + lessonHref(l.slug, false) + '">' + l.title + '</a></h3>' +
          '<p>' + l.blurb + '</p>' +
          '<div class="lesson-actions"><a class="read-link" href="' + lessonHref(l.slug, false) +
          '" aria-label="Read notes: ' + l.title + '">Read notes <span aria-hidden="true">&rarr;</span></a>' +
          '<a class="revision-link" href="' + lessonHref(l.slug, true) +
          '" aria-label="Quick revision: ' + l.title + '">Quick revision</a></div></div></li>';
      }).join('');
    }

    var count = $('#lesson-count');
    if (count) count.textContent = LESSONS.length;

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

    if (REVISION) headings = headings.filter(function (h) { return h.tagName === 'H2'; });
    if (!toc) return;
    toc.innerHTML = headings.map(function (h) {
      var cls = h.tagName === 'H3' ? ' class="toc-h3"' : '';
      var label = h.textContent.replace(/#$/, '');
      return '<li' + cls + '><a href="#' + h.id + '">' + label + '</a></li>';
    }).join('');

    var scrollRegions = $$('.table-wrap, .msg pre, .codeblock', prose);
    scrollRegions.forEach(function (el) {
      el.tabIndex = 0;
      el.setAttribute('role', 'region');
      el.setAttribute('aria-label', el.classList.contains('table-wrap') ? 'Reference table' : 'Example');
    });
  }

  /* --- revision: reuse the lesson's summaries, with links back to context -- */
  function initRevision() {
    var head = $('.lesson-head'), prose = $('.prose'), here = currentSlug();
    if (!head || !prose || !here) return;

    var nav = document.createElement('nav');
    nav.className = 'lesson-view';
    nav.setAttribute('aria-label', 'Reading mode');
    nav.innerHTML = '<a href="' + lessonHref(here, false) + '"' +
      (!REVISION ? ' aria-current="page"' : '') + '>Full notes</a>' +
      '<a href="' + lessonHref(here, true) + '"' +
      (REVISION ? ' aria-current="page"' : '') + '>Quick revision</a>';
    head.appendChild(nav);
    if (!REVISION) {
      var lesson = LESSONS.find(function (l) { return l.slug === here; });
      var goals = document.createElement('section');
      goals.className = 'lesson-goals';
      goals.setAttribute('aria-label', 'Learning goals');
      goals.innerHTML = '<h2>You’ll learn</h2><ul>' + lesson.outcomes.map(function (goal) {
        return '<li>' + goal + '</li>';
      }).join('') + '</ul>';
      head.appendChild(goals);
      return;
    }

    document.body.classList.add('revision-mode');
    document.title = 'Quick revision · ' + document.title;
    var intro = document.createElement('p');
    intro.className = 'revision-intro';
    intro.textContent = 'The essentials for every topic. Use “Read full section” to revisit an explanation.';
    head.appendChild(intro);

    var section;
    Array.prototype.forEach.call(prose.children, function (el) {
      if (el.tagName === 'H2') section = el;
      else if (el.classList.contains('keytakeaways')) {
        var link = document.createElement('a');
        link.className = 'revision-context';
        link.href = lessonHref(here, false) + '#' + section.id;
        link.textContent = 'Read full section →';
        link.setAttribute('aria-label', 'Read full section: ' + section.textContent.replace(/#$/, ''));
        el.appendChild(link);
      } else el.hidden = true;
    });
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
    }, { rootMargin: '-128px 0px -60% 0px', threshold: 0 });

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
    window.addEventListener('resize', paint);
    paint();
  }

  /* --- 5. theme ---------------------------------------------------------- */
  function initTheme() {
    var btn = $('#theme-toggle');
    if (!btn) return;
    var preference = window.matchMedia('(prefers-color-scheme: dark)');
    var custom = false;
    try { custom = /^(light|dark)$/.test(localStorage.getItem('bp-theme')); } catch (e) {}
    function label() {
      var dark = document.documentElement.getAttribute('data-theme') === 'dark';
      btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
      btn.innerHTML = dark
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>';
    }
    btn.addEventListener('click', function () {
      var dark = document.documentElement.getAttribute('data-theme') === 'dark';
      var next = dark ? 'light' : 'dark';
      custom = true;
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('bp-theme', next); } catch (e) {}
      label();
    });
    preference.addEventListener('change', function (e) {
      if (custom) return;
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
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
      index.push({
        kind: 'Revision', title: l.title, ctx: l.num,
        href: lessonHref(l.slug, true),
        hay: ('quick revision summary takeaways ' + l.title + ' ' + l.tags.join(' ')).toLowerCase()
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
        ? index.filter(function (it) {
          return q.split(/\s+/).every(function (word) { return it.hay.indexOf(word) > -1; });
        })
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
      backdrop.showModal();
      input.value = '';
      render('');
      input.focus();
    }
    function close() { backdrop.close(); }

    $$('.js-open-palette').forEach(function (b) { b.addEventListener('click', open); });
    input.addEventListener('input', function () { render(input.value); });

    $('#palette-close').addEventListener('click', close);
    backdrop.addEventListener('click', function (e) {
      var link = e.target.closest('.p-item');
      if (e.target === backdrop || link) close();
      if (link && link.getAttribute('href').charAt(0) === '#') {
        var target = document.getElementById(link.getAttribute('href').slice(1));
        if (target) { target.tabIndex = -1; target.focus(); }
      }
    });

    document.addEventListener('keydown', function (e) {
      var isOpen = backdrop.open;
      var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);

      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        isOpen ? close() : open();
        return;
      }
      if (e.key === '/' && !isOpen && !typing) { e.preventDefault(); open(); return; }
      if (!isOpen) return;

      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowDown' && document.activeElement === input) { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp' && document.activeElement === input) { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter' && document.activeElement === input && items[sel]) {
        e.preventDefault();
        items[sel].click();
      }
    });
  }

  /* --- 7. native navigation disclosures --------------------------------- */
  function initMobileNav() {
    [['#sidebar', '(min-width: 861px)'], ['.toc', '(min-width: 1181px)']].forEach(function (entry) {
      var menu = $(entry[0]);
      if (!menu) return;
      var wide = window.matchMedia(entry[1]);
      function adapt() {
        menu.name = wide.matches ? '' : 'course-navigation';
        menu.open = wide.matches;
      }
      adapt();
      wide.addEventListener('change', adapt);
      menu.addEventListener('click', function (e) {
        var link = e.target.closest('a');
        if (!link || wide.matches) return;
        menu.open = false;
        if (link.getAttribute('href').charAt(0) === '#') {
          var target = document.getElementById(link.getAttribute('href').slice(1));
          if (target) { target.tabIndex = -1; target.focus(); }
        }
      });
      menu.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !wide.matches) {
          menu.open = false;
          $('summary', menu).focus();
        }
      });
    });
  }

  /* --- boot -------------------------------------------------------------- */
  function boot() {
    renderNav();
    buildToc();
    initRevision();
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
