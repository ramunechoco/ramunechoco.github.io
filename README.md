# Aporia Harian

A personal blog, built with [Jekyll](https://jekyllrb.com/) and hosted on [GitHub Pages](https://pages.github.com/).

Live at **https://kothar.me/**. The blog itself lives under `/aporia-harian/`; the bare domain redirects there automatically — see "Site structure" below.

## Site structure

The blog's homepage and posts live under `/aporia-harian/` rather than at the bare domain root, so that other, unrelated sections could be added later as siblings without moving anything that already exists. The root URL (`/`) doesn't have a real page — it's a static redirect straight to `/aporia-harian/`, generated automatically by the `jekyll-redirect-from` plugin from the `redirect_from: [/]` line in `aporia-harian/index.html`'s front matter. GitHub Pages has no server-level redirect support, so this works via an instant meta-refresh page rather than a true HTTP redirect.

Note that this redirect is built as an *absolute* URL from the `url:` value in `_config.yml`. If the domain ever changes again, `url:` must be updated or the root of the new domain will redirect visitors back to the old one.

## Custom domain

The site is served from `kothar.me`, configured as a GitHub Pages custom domain. The `CNAME` file at the repo root holds the domain name and is managed by GitHub itself (created/updated when the domain is set under repo Settings → Pages) — don't edit or delete it by hand. DNS lives at Namecheap: four `A` records on `@` pointing at GitHub's Pages IPs, a `CNAME` for `www` pointing at `ramunechoco.github.io.`, and a `_github-pages-challenge-ramunechoco` `TXT` record that must stay in place to keep the domain verified.

The old `ramunechoco.github.io` URLs still work — GitHub redirects them to the custom domain automatically.

## Project structure

```
_config.yml               site settings (title, description, URL, permalink, plugins)
CNAME                     custom domain, managed by GitHub Pages — don't hand-edit
_layouts/                 page templates (default.html, post.html)
_includes/                header/footer snippets
_posts/                   blog posts (one .md file per post), served under /aporia-harian/
aporia-harian/index.html  the blog homepage (lists all posts)
assets/css/               stylesheet
assets/js/                footnote popup behavior
assets/images/            images used in posts
about.md                  about page (published at /ihwal/)
docs/MOBILE_APP_PLAN.md   companion Android posting app: design notes and build history
```

Note: there's no `index.html` at the repo root — the redirect page there is generated automatically at build time, not a file that lives in this folder.
