# Aporia Harian

A personal blog, built with [Jekyll](https://jekyllrb.com/) and hosted on [GitHub Pages](https://pages.github.com/).

Live at **https://ramunechoco.github.io/**. The blog itself lives under `/aporia-harian/`; the bare domain redirects there automatically — see "Site structure" below.

## Site structure

The blog's homepage and posts live under `/aporia-harian/` rather than at the bare domain root, so that other, unrelated sections could be added later as siblings without moving anything that already exists. The root URL (`/`) doesn't have a real page — it's a static redirect straight to `/aporia-harian/`, generated automatically by the `jekyll-redirect-from` plugin from the `redirect_from: [/]` line in `aporia-harian/index.html`'s front matter. GitHub Pages has no server-level redirect support, so this works via an instant meta-refresh page rather than a true HTTP redirect.

## Project structure

```
_config.yml               site settings (title, description, URL, permalink, plugins)
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
