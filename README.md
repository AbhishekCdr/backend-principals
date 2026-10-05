# Backend Principles — course notes

A static notes site for a backend engineering course, written from the lecture transcripts.
Concept-first, with HTTP and PostgreSQL examples that connect the mechanisms to practical backend work.
The site itself has no framework, dependencies or build step.

## Lessons

| # | Lesson | Covers |
|---|--------|--------|
| 01 | [Understanding HTTP](sections/01-http.html) | Statelessness, client–server, TCP/OSI, versions, message anatomy, headers, methods & idempotency, CORS, status codes, caching, content negotiation, compression, keep-alive, multipart & streaming, TLS |
| 02 | [Routing](sections/02-routing.html) | Method + path as a compound key, static routes, path params, query params, nested routes, versioning & deprecation, catch-all |
| 03 | [Serialization & Deserialization](sections/03-serialization.html) | The cross-language problem, where your responsibility ends, text vs binary formats, the rules of JSON |
| 04 | [Authentication & Authorization](sections/04-auth.html) | History, sessions/JWT/cookies, stateful vs stateless, API keys, OAuth 2.0 & OIDC, RBAC, generic errors & timing attacks |
| 05 | [Validations & Transformations](sections/05-validation.html) | Controller/service/repository boundaries, schemas, type/syntax/semantics, cross-field checks, safe errors, parsing, normalization, frontend vs backend validation |
| 06 | [Layers, Middleware & Request Context](sections/06-request-lifecycle.html) | Internal request lifecycle, handlers/controllers, services, repository contracts, middleware ordering, error handling, verified identity, request IDs, deadlines & cancellation |
| 07 | [API Design](sections/07-api-design.html) | REST constraints, resources & representations, URL conventions, methods & idempotency, CRUD contracts, pagination, sorting, filtering, custom actions, consistent payloads, errors & OpenAPI documentation |
| 08 | [Databases & PostgreSQL](sections/08-databases.html) | Persistence, DBMS responsibilities, concurrency, relational vs document models, data types, constraints, relationships, migrations, seeding, safe queries, pagination, indexes & triggers |

## Running it

There is no build step and there are no dependencies. Any static server works:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` directly from the filesystem also works.

## Features

- Midnight Mint theme: near-black surfaces, off-white text and light mint accents in dark mode; white surfaces and deeper green accents in light mode
- Editorial serif headings, readable Inter body text and 18px lesson text
- Light and dark appearance follows the system until you choose a theme; your choice is remembered across visits
- Ordered learning path with a short outcome and read/revise links for each lesson
- Three learning goals at the start of each full lesson
- `⌘K` / `Ctrl+K` (or `/`) command palette — searches lessons, page sections and topics
- Auto-generated "On this page" table of contents with scroll-spy
- Reading progress bar, prev/next pager, and native Lessons / On this page disclosure menus on smaller screens
- Keyboard-friendly search dialog with a close button, multi-word search, skip link and focusable tables/examples
- **Quick revision for every lesson** — use the link below a home-page card or switch between
  **Full notes** and **Quick revision** at the top of a lesson. Revision shows every topic's key
  takeaways, with links back to the full section. The sidebar and pager keep you in revision mode.
- Revision links are bookmarkable (`?view=revision`), searchable in the command palette, and printable
- Print stylesheet — `⌘P` gives a clean, chrome-free copy of any lesson

## Adding a lesson

1. **Copy a page.** Copy an existing lesson to the next numbered filename and replace everything
   inside the lesson header and `.prose` container with the new content. Keep the main landmark and pager. Update `<title>`
   and the `<meta name="description">`.

2. **Register it.** Add one entry to the `LESSONS` array at the top of
   [`assets/js/app.js`](assets/js/app.js):

   ```js
   {
     num: '09',
     slug: '09-your-topic',
     title: 'Your Next Topic',
     blurb: 'One sentence for the home page card.',
     outcomes: ['First learning goal.', 'Second learning goal.', 'Third learning goal.'],
     tags: ['searchable concept', 'another concept']   // these feed the ⌘K palette
   }
   ```

   That array is the only place lesson metadata lives — the sidebar, the home page cards, the pager
   and the search index all build from it. Also update the fallback lesson count in `index.html`
   and this README's lesson list.

3. **Summarize every topic.** End each `<h2>` section with a `.keytakeaways` block, as a direct child
   of `.prose`. Quick revision reuses these blocks, so there is no second set of notes to maintain.
   The table of contents, scroll-spy, anchors and search index are generated at runtime.

## Checks

```sh
node --check assets/js/app.js
node tests/revision.test.js
```

The dependency-free check covers revision filtering, links, goals and summary coverage in every
lesson, navigation behavior at six breakpoint widths, theme preferences (including unavailable storage),
search and text contrast in both themes. It uses a small DOM stub and does not verify visual layout.
For visual checks, serve the site and try both reading modes at desktop and mobile widths, keyboard
navigation, 200% text/zoom and printing.

## Layout

```
.
├── index.html                      course home
├── sections/
│   ├── 01-http.html
│   ├── 02-routing.html
│   ├── 03-serialization.html
│   ├── 04-auth.html
│   ├── 05-validation.html
│   ├── 06-request-lifecycle.html
│   ├── 07-api-design.html
│   └── 08-databases.html
├── tests/revision.test.js          revision behavior and content coverage
└── assets/
    ├── css/main.css                the whole design system
    └── js/app.js                   nav, TOC, revision, scroll-spy, palette, theme
```

### Writing conventions

Content components available in `main.css`, so lesson pages never need their own styles:

| Class | Use |
|---|---|
| `.callout--key / --note / --tip / --warn / --danger` | Asides, by severity |
| `.keytakeaways` | Boxed summary closing each major section |
| `.cards` / `.card` | Side-by-side concept groupings |
| `.msg` | Annotated HTTP request/response block |
| `.flow` | Numbered step sequence |
| `.compare` + `.compare-col--pro / --con` | Pros vs cons |
| `.table-wrap` + `table.table` | Reference tables |
| `.chip--get / --post / --2xx / --4xx …` | Method and status-code chips |
| `.timeline` | Historical progression |
| `.stats` / `.stat` | Figure callouts |
