# Aporia Ananta

A personal blog, built with [Jekyll](https://jekyllrb.com/) and hosted on [GitHub Pages](https://pages.github.com/).

Live at **https://kothar.me/**.

## Project structure

```
_config.yml               site settings (title, description, URL, permalink, plugins)
CNAME                     custom domain, managed by GitHub Pages — don't hand-edit
_layouts/                 page templates (default.html, post.html)
_includes/                header/footer snippets
_posts/                   blog posts (one .md file per post), served under /blog/
blog/index.html           the blog homepage (lists all posts)
assets/css/               stylesheet
assets/js/                footnote popup behavior
assets/images/            images used in posts
about.md                  about page (published at /ihwal/)
docs/MOBILE_APP_PLAN.md   companion Android posting app: design notes and build history
```

Note: there's no `index.html` at the repo root — the redirect page there is generated automatically at build time, not a file that lives in this folder.
