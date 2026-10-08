# White-Label Google Review & Reputation Widget

An embeddable Google reviews widget that marketing agencies can rebrand as their own product and install on client websites. Agencies manage every client widget from one dashboard. Clients add a single script tag to their site.

## Features

- **One-line embed.** Works in any website or CMS that accepts HTML (WordPress, Webflow, Wix, Squarespace and others).
- **Four layouts:** grid, carousel, list, and a floating badge that expands into a review panel.
- **Light, dark or auto theme**, plus a custom accent color for each widget.
- **White-label branding.** Each agency sets its own brand name, color, logo and footer link, or hides the footer branding entirely.
- **Review filtering.** Choose the minimum star rating and maximum number of reviews to display.
- **Review request link.** A short `/r/<widget-id>` link opens the Google "write a review" form for the business. Use it in follow-up emails, SMS messages or QR codes.
- **Multi-agency.** Each agency signs in with its own API key and can only see and edit its own widgets.
- **Style isolation.** The widget renders in a Shadow DOM, so the client site's CSS can't break it and the widget can't break the site.
- **Low Google API cost.** Reviews are cached in memory. Concurrent requests share one upstream call, and if Google is unavailable the widget keeps serving the last good data.
- **Demo mode.** Without a Google API key, the app serves sample reviews so you can try everything immediately.

## Quick start

Requires Node.js 22.9 or later.

```bash
npm install
cp .env.example .env   # optional: add GOOGLE_PLACES_API_KEY for real reviews
npm start
```

On first start the server creates an agency and prints its **admin API key** once. Then:

1. Open `http://localhost:3000/admin/` and sign in with the key.
2. Set your branding under **White-label branding**.
3. Click **+ New widget**, search for the business, pick a layout and save.
4. Copy the embed code into the client's site, or open `/demo.html?id=<widget-id>` to see it on a sample page.

To add more agencies, for example when reselling the tool to other agencies, run:

```bash
npm run create-agency -- "Agency Name"
```

## Connecting real Google reviews

1. In Google Cloud Console, enable **Places API (New)** and create an API key. Restrict the key to that API.
2. Set `GOOGLE_PLACES_API_KEY` in `.env` and restart the server.

Things to know:

- The Places API returns **at most 5 reviews per place**, chosen by Google's relevance ranking. This is a limit of the official API.
- Google's Maps Platform terms require showing review author attribution and Google as the source. The widget does both, and you should keep it that way. Review the [Places API policies](https://developers.google.com/maps/documentation/places/web-service/policies) before going live, including the rules on caching. Caching is controlled by `CACHE_TTL_SECONDS`.
- The minimum star filter only affects which reviews the widget **displays**. The review request link always sends every customer to Google. Google prohibits "review gating", which means steering only happy customers to leave reviews.

## Embed code

```html
<div data-review-widget="WIDGET_ID"></div>
<script src="https://your-server.example/widget.js" async></script>
```

For single-page apps, you can mount a widget manually with `window.ReviewWidget.mount(element, 'WIDGET_ID')`, or call `window.ReviewWidget.init()` after adding new `data-review-widget` elements.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | HTTP port |
| `PUBLIC_URL` | `http://localhost:$PORT` | Public base URL used in embed codes and review links |
| `GOOGLE_PLACES_API_KEY` | (empty) | Places API (New) key. If empty, the app runs in demo mode |
| `CACHE_TTL_SECONDS` | `3600` | How long reviews are cached in memory |
| `OPERATOR_API_KEY` | (empty) | Turns on `POST /api/operator/agencies` for provisioning agencies. When set, no first agency is created automatically |
| `GOOGLE_PLACES_BASE_URL` | Google's API | Override for the Places API endpoint (the acceptance tests point it at a stub) |
| `APP_VERSION` | `dev` | Build version reported by `/healthz` (set automatically in the Docker image) |
| `DATA_FILE` | `data/db.json` | JSON file that stores agencies and widgets |

## API

Public endpoints (no authentication, CORS open):

- `GET /healthz`: health status and the running version
- `GET /widget.js`: the embed script
- `GET /api/public/widgets/:id`: widget settings, branding, place summary and filtered reviews
- `GET /r/:id`: redirects to the Google review form

Admin endpoints (send `Authorization: Bearer <api key>`):

- `GET /api/admin/me`
- `PUT /api/admin/branding`
- `GET /api/admin/places/search?q=...`
- `GET | POST /api/admin/widgets`
- `PATCH | DELETE /api/admin/widgets/:id`
- `POST /api/admin/widgets/:id/refresh`: clears the cached reviews for this widget's place

Operator endpoint (send `Authorization: Bearer <OPERATOR_API_KEY>`):

- `POST /api/operator/agencies` with `{"name": "..."}`: creates an agency and returns its API key

## Project layout

```
.github/workflows/pipeline.yml   deployment pipeline (commit, acceptance and release stages)
Dockerfile                       release candidate image
acceptance/      acceptance tests: specs, DSL, protocol drivers, Google stub, smoke tests
docs/            deployment pipeline guide
src/
  server.js      entry point
  app.js         Express routes
  store.js       JSON-file storage for agencies and widgets
  google.js      Google Places API (New) client
  reviews.js     caching review service and display filtering
  demo.js        sample data for demo mode
  validation.js  input validation
public/
  widget.js      embeddable widget (plain JS, no dependencies)
  admin/         agency dashboard
  demo.html      sample client page
test/            node:test suites
```

## Development and the deployment pipeline

This project follows Dave Farley's Continuous Delivery approach. Every commit to `main` goes through a deployment pipeline. A commit that passes all stages is releasable. Read **[docs/deployment-pipeline.md](docs/deployment-pipeline.md)** for the full guide.

| Stage | Run it locally | What it does |
| --- | --- | --- |
| Commit | `npm run commit-stage` | Lint, unit and component tests with an 85% coverage gate. CI also runs a dependency audit and builds the release candidate image once |
| Acceptance | `npm run acceptance-stage` | Deploys the app with Google stubbed out, then runs smoke tests and executable specifications through the API and a real browser. Set `IMAGE=<tag>` to test a Docker image |
| Release | CI only, on `main` | Pushes the exact tested image to `ghcr.io/<owner>/reputation-widget` |

To run acceptance tests on your machine, install Chromium once with `npx playwright install chromium`.

## Roadmap ideas

- Swap the JSON file for Postgres or SQLite when running multiple server instances
- Custom domains per agency (for example, `reviews.agency.com`)
- Schema.org `AggregateRating` markup for SEO
- Built-in QR code generation for review links, and click analytics
- Monthly reputation report emails to clients
- Billing for each client seat (Stripe)
