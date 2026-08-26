# Backend Principles — course notes

A static notes site for a backend engineering course, written from the lecture transcripts.
Concept-first: no framework, no language, no code samples to install — just the mechanisms
underneath, which stay true whichever stack you end up in.

## Lessons

| # | Lesson | Covers |
|---|--------|--------|
| 01 | [Understanding HTTP](sections/01-http.html) | Statelessness, client–server, TCP/OSI, versions, message anatomy, headers, methods & idempotency, CORS, status codes, caching, content negotiation, compression, keep-alive, multipart & streaming, TLS |
| 02 | [Routing](sections/02-routing.html) | Method + path as a compound key, static routes, path params, query params, nested routes, versioning & deprecation, catch-all |
| 03 | [Serialization & Deserialization](sections/03-serialization.html) | The cross-language problem, where your responsibility ends, text vs binary formats, the rules of JSON |
| 04 | [Authentication & Authorization](sections/04-auth.html) | History, sessions/JWT/cookies, stateful vs stateless, API keys, OAuth 2.0 & OIDC, RBAC, generic errors & timing attacks |

## Running it

There is no build step and there are no dependencies. Any static server works:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` directly from the filesystem also works.

## Features

- Dark and light theme, remembered across visits, with no flash on load
- `⌘K` / `Ctrl+K` (or `/`) command palette — searches lessons, page sections and topics
- Auto-generated "On this page" table of contents with scroll-spy
- Reading progress bar, prev/next pager, mobile drawer nav
- Print stylesheet — `⌘P` gives a clean, chrome-free copy of any lesson

## Adding a lesson

1. **Copy a page.** `cp sections/02-routing.html sections/05-validation.html` and replace everything
   between `<main class="main">` and `<nav class="pager">` with the new content. Update `<title>`
   and the `<meta name="description">`.

2. **Register it.** Add one entry to the `LESSONS` array at the top of
   [`assets/js/app.js`](assets/js/app.js):

   ```js
   {
     num: '05',
     slug: '05-validation',
     title: 'Validations & Transformations',
     blurb: 'One sentence for the home page card.',
     tags: ['zod', 'DTOs', 'sanitisation']   // these feed the ⌘K palette
   }
   ```

   That array is the only place lesson metadata lives — the sidebar, the home page cards, the pager
   and the search index all build from it.

3. **Nothing else.** The table of contents, scroll-spy, anchors and search index are generated at
   runtime from the headings you wrote.

## Layout

```
.
├── index.html                      course home
├── sections/
│   ├── 01-http.html
│   ├── 02-routing.html
│   ├── 03-serialization.html
│   └── 04-auth.html
└── assets/
    ├── css/main.css                the whole design system
    └── js/app.js                   nav, TOC, scroll-spy, palette, theme
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
