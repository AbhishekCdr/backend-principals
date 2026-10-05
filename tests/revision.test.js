// Run with: node tests/revision.test.js (Node built-ins only).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
// Expose the private functions only inside this test's isolated context.
const script = fs.readFileSync(path.join(root, 'assets/js/app.js'), 'utf8').replace(
  /\}\)\(\);\s*$/,
  'globalThis.app = { LESSONS, lessonHref, renderNav, buildToc, initRevision, initTheme, initMobileNav, initPalette }; })();'
);

// Only the DOM operations used by navigation and revision; no browser dependency.
function element(tag, text = '', classes = []) {
  const names = new Set(classes);
  return {
    tagName: tag.toUpperCase(), textContent: text, children: [], attributes: {},
    innerHTML: '', hidden: false, events: {},
    classList: { add: name => names.add(name), contains: name => names.has(name) },
    appendChild(child) { this.children.push(child); },
    setAttribute(name, value) { this.attributes[name] = value; },
    getAttribute(name) { return this.attributes[name] || null; },
    addEventListener(name, handler) { (this.events[name] ||= []).push(handler); },
    fire(name, event = {}) { (this.events[name] || []).forEach(handler => handler(event)); },
    focus() { this.focused = true; },
    showModal() { this.open = true; },
    close() { this.open = false; },
    querySelector(selector) { return this.children.find(child => child.tagName === selector.toUpperCase()); },
    querySelectorAll(selectors) {
      const tags = selectors.toUpperCase().split(',').map(tag => tag.trim());
      return this.children.filter(child => tags.includes(child.tagName));
    }
  };
}

function load(slug, search, options = {}) {
  const heading = element('h2', 'A topic');
  heading.id = 'a-topic';
  const summary = element('div', '', ['keytakeaways']);
  summary.appendChild(element('ul', 'Remember this.'));
  const prose = element('div');
  prose.children = [heading, element('p', 'Full explanation'), element('h3', 'Detail'), summary];
  const nodes = Object.fromEntries([
    '.lesson-head', '#nav-list', '#lesson-grid', '#pager', '#crumb', '#lesson-count', '#toc-list',
    '#sidebar', '.toc', '#theme-toggle', '#palette', '#palette-input', '#palette-results', '#palette-close'
  ].map(selector => [selector, element('div')]));
  nodes['.prose'] = prose;
  for (const selector of ['#sidebar', '.toc']) nodes[selector].appendChild(element('summary'));
  const document = Object.assign(element('document'), {
    readyState: 'loading', title: 'Lesson', body: element('body'), activeElement: element('body'),
    documentElement: element('html'),
    querySelector: selector => nodes[selector] || null,
    getElementById: id => prose.children.find(child => child.id === id) || null,
    createElement: element
  });
  document.documentElement.setAttribute('data-root', '../');
  document.documentElement.setAttribute('data-theme', options.saved || (options.dark ? 'dark' : 'light'));
  const media = {};
  const window = { matchMedia(query) {
    if (!media[query]) {
      media[query] = element('media');
      const minimum = query.match(/min-width: (\d+)px/);
      media[query].matches = minimum ? (options.width ?? 1440) >= +minimum[1] : Boolean(options.dark);
    }
    return media[query];
  } };
  let saved = options.saved || null;
  const localStorage = {
    getItem() { if (options.storageBlocked) throw new Error('Storage unavailable'); return saved; },
    setItem(key, value) { if (options.storageBlocked) throw new Error('Storage unavailable'); saved = value; }
  };
  const context = { document, window, localStorage, location: { pathname: '/sections/' + slug + '.html', search }, URLSearchParams };
  vm.runInNewContext(script, context);
  return { app: context.app, document, nodes, heading, summary, prose, media, context };
}

const lessons = load('01-http', '').app.LESSONS;
assert.deepEqual(Array.from(lessons, lesson => lesson.slug + '.html').sort(),
  fs.readdirSync(path.join(root, 'sections')).filter(file => file.endsWith('.html')).sort(),
  'Every lesson page is registered exactly once');
for (const lesson of lessons) {
  const html = fs.readFileSync(path.join(root, 'sections', lesson.slug + '.html'), 'utf8');
  assert.equal(lesson.outcomes.length, 3, 'Each lesson has focused learning goals');
  assert.match(html, /<details class="toc" open>/);
  assert.match(html, /<dialog class="palette-backdrop"/);
  assert.match(html, /class="skip-link" href="#main-content"/);
  const sections = html.split(/<h2\b[^>]*>/).slice(1);
  assert.ok(sections.length, lesson.slug + ': topics exist');
  for (const section of sections) {
    assert.match(section, /class="keytakeaways"/, lesson.slug + ': missing topic summary');
  }

  for (const search of ['', '?view=revision', '?view=other']) {
    const { app, document, nodes, heading, summary, prose } = load(lesson.slug, search);
    const revision = search === '?view=revision';
    app.renderNav();
    app.buildToc();
    app.initRevision();
    assert.equal(nodes['#lesson-count'].textContent, lessons.length);
    assert.equal(document.body.classList.contains('revision-mode'), revision);
    assert.equal(prose.children[1].hidden, revision, 'Only full explanations are hidden');
    assert.equal(prose.children[2].hidden, revision, 'Subheadings are hidden in revision');
    assert.equal(heading.hidden, false);
    assert.equal(summary.hidden, false);
    assert.equal(summary.children[0].textContent, 'Remember this.');
    assert.equal((nodes['#toc-list'].innerHTML.match(/<li/g) || []).length, revision ? 1 : 2);
    assert.match(nodes['.lesson-head'].children[0].innerHTML,
      revision ? /aria-current="page">Quick revision/ : /aria-current="page">Full notes/);
    if (revision) {
      assert.equal(summary.children[1].href, app.lessonHref(lesson.slug, false) + '#a-topic');
      assert.ok(document.title.startsWith('Quick revision'));
    } else {
      assert.equal(summary.children.length, 1, 'Full notes keep the original summary');
      assert.match(nodes['.lesson-head'].children[1].innerHTML, /You’ll learn/);
      assert.ok(nodes['.lesson-head'].children[1].innerHTML.includes(lesson.outcomes[0]));
    }

    for (const selector of ['#nav-list', '#pager']) {
      for (const [, href] of nodes[selector].innerHTML.matchAll(/href="([^"]+)"/g)) {
        if (href.includes('/sections/')) assert.equal(href.includes('?view=revision'), revision);
        assert.ok(fs.existsSync(path.resolve(root, 'sections', href.split(/[?#]/)[0])), href);
      }
    }
    assert.equal((nodes['#lesson-grid'].innerHTML.match(/class="revision-link"/g) || []).length, lessons.length);
    assert.ok(app.lessonHref(lesson.slug, true).endsWith('?view=revision'));
    assert.ok(!app.lessonHref(lesson.slug, false).includes('?'));
  }
}

for (const width of [320, 860, 861, 1180, 1181, 1440]) {
  const { app, nodes, heading, media } = load('02-routing', '', { width });
  app.initMobileNav();
  assert.equal(nodes['#sidebar'].open, width >= 861);
  assert.equal(nodes['.toc'].open, width >= 1181);
  if (width <= 860) assert.equal(nodes['#sidebar'].name, nodes['.toc'].name, 'Compact menus share a native disclosure group');
  if (width < 1181) {
    nodes['.toc'].open = true;
    nodes['.toc'].fire('click', { target: { closest: () => ({ getAttribute: () => '#a-topic' }) } });
    assert.equal(nodes['.toc'].open, false);
    assert.equal(heading.focused, true, 'A topic link moves focus to its heading');
    nodes['.toc'].open = true;
    nodes['.toc'].fire('keydown', { key: 'Escape' });
    assert.equal(nodes['.toc'].open, false);
    assert.equal(nodes['.toc'].children[0].focused, true);
    media['(min-width: 1181px)'].matches = true;
    media['(min-width: 1181px)'].fire('change');
    assert.equal(nodes['.toc'].open, true, 'Topic outline reopens on desktop');
  }
}

const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.equal(Number(home.match(/id="lesson-count">(\d+)</)[1]), lessons.length);
const themeScript = home.match(/<script>([\s\S]*?)<\/script>/)[1];
for (const options of [{}, { dark: true }, { saved: 'dark' }, { dark: true, saved: 'light' }, { storageBlocked: true, dark: true }]) {
  const { app, document, nodes, media, context } = load('01-http', '', options);
  vm.runInNewContext(themeScript, context);
  const expected = options.saved || (options.dark ? 'dark' : 'light');
  const theme = () => document.documentElement.getAttribute('data-theme');
  assert.equal(theme(), expected, 'First paint respects preferences even when storage fails');
  app.initTheme();
  const preference = media['(prefers-color-scheme: dark)'];
  preference.fire('change', { matches: expected !== 'dark' });
  assert.equal(theme(), options.saved ? expected : (expected === 'dark' ? 'light' : 'dark'));
  const beforeClick = theme();
  nodes['#theme-toggle'].fire('click');
  assert.notEqual(theme(), beforeClick);
  const chosen = theme();
  preference.fire('change', { matches: chosen !== 'dark' });
  assert.equal(theme(), chosen, 'An explicit theme choice takes priority over system changes');
}

const search = load('05-validation', '?view=revision');
search.app.initPalette();
const key = value => search.document.fire('keydown', { key: value, preventDefault() {} });
key('/');
assert.equal(search.nodes['#palette'].open, true);
assert.equal(search.nodes['#palette-input'].focused, true);
search.nodes['#palette-input'].value = 'revision validation';
search.nodes['#palette-input'].fire('input');
assert.match(search.nodes['#palette-results'].innerHTML, /05-validation.html\?view=revision/);
search.nodes['#palette-input'].value = 'request context';
search.nodes['#palette-input'].fire('input');
assert.match(search.nodes['#palette-results'].innerHTML, /06-request-lifecycle.html\?view=revision/);
search.nodes['#palette-input'].value = 'no-such-topic';
search.nodes['#palette-input'].fire('input');
assert.match(search.nodes['#palette-results'].innerHTML, /Nothing matches/);
search.nodes['#palette-input'].value = 'revision';
search.nodes['#palette-input'].fire('input');
assert.match(search.nodes['#palette-results'].innerHTML, /05-validation.html\?view=revision/);
search.nodes['#palette-close'].fire('click');
assert.equal(search.nodes['#palette'].open, false);
key('/'); key('Escape');
assert.equal(search.nodes['#palette'].open, false);

// Check the actual theme colors on each reading/example surface.
const css = fs.readFileSync(path.join(root, 'assets/css/main.css'), 'utf8');
function luminance(hex) {
  return hex.match(/[a-f\d]{2}/gi).map(value => parseInt(value, 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
    .reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
}
for (const selector of [':root', '[data-theme="dark"]']) {
  const block = css.slice(css.indexOf(selector)).split('}')[0];
  const colors = Object.fromEntries([...block.matchAll(/--([\w-]+): (#[a-f\d]{6});/gi)].map(match => [match[1], match[2]]));
  for (const fg of ['text', 'text-dim', 'accent', 'warn', 'danger', 'info']) {
    for (const bg of ['bg', 'surface', 'surface-2', 'surface-3', 'accent-soft']) {
      const [low, high] = [luminance(colors[fg]), luminance(colors[bg])].sort((a, b) => a - b);
      assert.ok((high + 0.05) / (low + 0.05) >= 4.5, selector + ': insufficient contrast for ' + fg + '/' + bg);
    }
  }
}
console.log(`PASS: ${lessons.length} lessons; summaries, goals, reading modes, navigation at 6 widths, theme preferences, search and contrast.`);
