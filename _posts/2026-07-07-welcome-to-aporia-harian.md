---
layout: post
title: "Welcome to Aporia Harian"
subtitle: "A first note on how this blog works"
date: 2026-07-07
---

This is the first post on **Aporia Harian**. Posts here are plain Markdown files, so formatting is simple:

- Wrap text in `**double asterisks**` for **bold**.
- Wrap text in `*single asterisks*` for *italics*.
- Write `[link text](https://example.com)` for a [link](https://example.com).
- Add a footnote for an aside without breaking the reading flow.[^1] Click the little number to see it.

To publish a new post, add a new file to `_posts/` named `YYYY-MM-DD-title.md` with the same front matter block at the top of this file, then commit and push. GitHub Pages rebuilds the site automatically.

[^1]: Footnotes are written as `[^1]` inline, with the matching `[^1]: text` definition placed anywhere else in the post — kramdown collects them automatically. Clicking the number pops the text up right here instead of jumping to the bottom of the page.
