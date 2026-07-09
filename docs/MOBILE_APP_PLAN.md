# Mobile Posting App — Implementation Plan

Flutter app, built to an APK for sideloading (no app store). Talks directly to the `ramunechoco.github.io` repo via GitHub's Contents API — no custom backend.

## Decisions locked in (2026-07-08)

- **Editor:** plain text input with a formatting toolbar (bold/italic/link buttons wrap the current text selection in Markdown syntax), not a WYSIWYG rich text editor. Architected so the post body is always a single Markdown string behind the scenes — a future WYSIWYG editor would only need to produce/consume that same string, not change how publishing or storage works.
- **Images:** picked from the phone's gallery, uploaded to `assets/images/` via the Contents API, inserted as a centered image by default, with an optional per-image caption field (fills in the `<figure>`/`<figcaption>` pattern if provided, otherwise just the plain centered `![]()` form).
- **Token storage:** entered once into an in-app Settings screen, stored via `flutter_secure_storage` (Android Keystore-backed). Never hardcoded into source or build config, never committed anywhere.
- **APK build:** a new GitHub repo hosts the Flutter source; a GitHub Actions workflow runs `flutter build apk --release` on GitHub's runners and attaches the result to a GitHub Release. Avoids needing Flutter/Android SDK installed anywhere locally — confirmed the Cowork sandbox can't install them (network allowlist blocks the SDK downloads, and disk space is tight).
- **Viewing existing posts:** secondary priority, read-only (list + tap-to-view detail), no in-app editing or deleting of existing posts in this phase.

## Architecture

```
lib/
  models/
    post_draft.dart        - title, subtitle, bodyMarkdown, pending image list
  services/
    github_service.dart    - Contents API calls: create post file, upload image, list posts
    secure_storage_service.dart - token + repo config persistence
    markdown_builder.dart  - assembles front matter + body into the final file content
  screens/
    settings_screen.dart   - token, repo owner/name/branch config (first-run + editable later)
    compose_screen.dart    - title/subtitle fields, body text field + toolbar, image picker, Publish button
    posts_list_screen.dart - (phase 2) read-only list of _posts/, tap to view rendered detail
```

Repo owner/name/branch are kept configurable in Settings rather than hardcoded, since this repo has already been renamed once during the site's setup — cheap insurance against needing an app rebuild if it happens again.

## Publish flow

1. User fills in title, optional subtitle, body (via toolbar-assisted plain text), optionally inserts images.
2. On Publish: any picked images upload first via `PUT /repos/{owner}/{repo}/contents/assets/images/{filename}` (base64-encoded content), and local image references in the body get swapped for their final `/assets/images/...` paths.
3. Filename is generated as `YYYY-MM-DD-slugified-title.md` (today's date, slug from title).
4. Front matter + body get assembled (`layout: post`, `title`, `subtitle` if present, `date`) and pushed via `PUT /repos/{owner}/{repo}/contents/_posts/{filename}`.
5. GitHub Pages rebuilds automatically, same as any other push.

## Open item: token scope

The token provided for this phase is scoped to the `ramunechoco.github.io` repo only (per how it was described). Pushing the *app's own source code* to a new repo (e.g. `aporia-harian-app`) needs separate push access to that new repo — either a broader token or a second fine-grained token scoped to it, requested once that repo exists.

## Phase 1.5: network fix + APK shrink (done 2026-07-08)

Two issues found after installing `Build 1` (47.3 MB):

1. **Network calls failed on-device**: settings verification threw `SocketException: Failed host lookup: 'api.github.com'`. Root cause: the CI workflow scaffolds a fresh `AndroidManifest.xml` via `flutter create` on every build, and Flutter only auto-injects the `INTERNET` permission for debug/profile builds, not release. Without it, Android silently blocks all network access at the OS level, which surfaces as a host-lookup failure rather than a permissions error. Fixed by adding a workflow step that greps for `android.permission.INTERNET` in the generated manifest and injects it via `sed` if missing, right after the scaffold step and before `flutter build`.
2. **Oversized APK**: caused by building a "fat" universal APK containing native engine binaries for every CPU architecture (arm64-v8a, armeabi-v7a, x86, x86_64) at once. Fixed by adding `--target-platform android-arm64` to the `flutter build apk --release` command, since virtually all modern Android phones are arm64.

Both fixes landed in `.github/workflows/build-apk.yml`, commit `38e0c81`. `Build 2` confirmed: **16.8 MB** (down from 47.3 MB) and completed successfully with the permission fix applied before build.

## Phase 2: view/edit/delete existing posts (done 2026-07-08)

- **Posts list**: new `PostsListScreen` fetches `_posts/`, fetches+parses each file's front matter to show title/subtitle/date (not just raw filenames), newest first. Reachable from Compose via a new app bar icon.
- **Post detail**: new `PostDetailScreen` renders a post's Markdown read-only, with Edit and Delete actions. Since the in-app renderer (`flutter_markdown_plus`, see below) doesn't understand kramdown extensions or raw HTML the way the live site's kramdown processor does, the body goes through a small best-effort preview transform before rendering (`lib/utils/post_preview.dart`): the site's `<figure>/<figcaption>` captioned-image HTML becomes a plain image + italic caption line, kramdown's `{: .centered }` attribute syntax is stripped, and site-relative image paths (`/assets/images/...`) are rewritten to absolute `raw.githubusercontent.com` URLs so they actually load. This only affects the in-app preview — the stored file on GitHub is never touched by it. Known gap: caption *styling* (centered, small grey text) won't match the website exactly in-app, just the content.
- **Editing**: reuses `ComposeScreen` in an edit mode (`editingPath`/`editingSha`/`editingDate` params). **Decision: editing always keeps the post's original filename and date, even if the title changes** — the file itself is never renamed, so a post's URL never breaks from an in-app edit. Uses the GitHub Contents API's update-in-place semantics (`PUT` with the file's current `sha`).
- **Deleting**: confirmation dialog, then `DELETE` via Contents API (also needs the file's `sha`).
- **GitHubService**: added `updateFile`/`deleteFile`; `fetchFileContent` became `fetchFile`, now returning both content and `sha` together (both are needed for edit/delete).
- **MarkdownBuilder**: added `parsePostFile`, the inverse of `buildPostFile` — splits a raw post file back into title/subtitle/date/body for loading into the editor or detail view.
- **Markdown rendering dependency**: used `flutter_markdown_plus` (not `flutter_markdown` — Google discontinued that package; `flutter_markdown_plus` is the actively maintained continuation fork, same API). Note: its internal `MarkdownBuilder` class collides by name with our own service class of the same name — resolved with `hide MarkdownBuilder` on the package import in `post_detail_screen.dart`, since only `MarkdownBody` is needed from the package there.

### Further APK size reduction (done 2026-07-08, additional to Phase 1.5's arm64-only build)

Implemented (safe, low-risk):
- `--obfuscate --split-debug-info=build/debug-info` added to the release build command — obfuscates Dart symbol names and strips debug symbol tables out of the shipped binary (kept as a discarded CI build artifact instead). Purely a Dart-level change; doesn't touch generated Android/Gradle files, so no blind-editing risk.
- Dropped the unused `cupertino_icons` dependency (never referenced in the app's code).
- Combined effect: 16.8 MB → 16.5 MB. Modest, as expected — most of the APK's weight is the Flutter engine's native `.so` binaries, which these two changes don't touch.

Researched but **not implemented** (documented for a future pass, not done blind):
- **R8 code/resource shrinking** (`minifyEnabled true`, `shrinkResources true`) in the Android build config. Likely worth another 1-3 MB, but the Android build files are freshly regenerated by `flutter create` on every CI run rather than kept in the repo, and can't be test-compiled locally in this sandbox (no Flutter/Android SDK available, per the constraint noted in "Decisions locked in"). Editing Gradle syntax blind risks a broken build requiring iteration; worth doing in a dedicated pass with a way to verify the change compiles first.
- **Android App Bundle / per-device dynamic delivery**: not applicable — that mechanism only benefits Play Store distribution, not direct APK sideloading.

## Phased delivery

1. **Phase 1 (MVP):** Settings screen, Compose screen with title/subtitle/body+toolbar, image picker/upload with optional caption, Publish button. Shipped as a downloadable APK via GitHub Actions. **Done (2026-07-08)** — `Build 1` on `ramunechoco/aporia-harian-app`.
1.5. **Phase 1.5 (fixes):** network-access fix + APK size reduction. **Done (2026-07-08)** — `Build 2`, 16.8 MB, see "Phase 1.5" section above.
2. **Phase 2 (done 2026-07-08):** View, edit, and delete existing posts, plus further APK size cuts. `Build 4` on `ramunechoco/aporia-harian-app`, 16.5 MB. Details below.
3. **Later, not scheduled:** possible WYSIWYG editor upgrade, Google Docs paste-and-convert support (discussed separately), closer visual parity between the in-app post preview and the live site's rendering (captioned-image styling), R8 code/resource shrinking for a further APK trim.
