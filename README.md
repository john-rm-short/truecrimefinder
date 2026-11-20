# TrueCrimeFinder Web Suite

A zero-build, static three-page true crime docuseries, investigative TV, feature documentary, and podcast discovery, tracking, and forensic connection suite designed specifically for **GitHub Pages** same-origin shared storage.

## Suite Architecture

| File | Role |
|---|---|
| `index.html` | **Case Hub & Daily Dossier** — Global True Crime Search (`/`), Multi-Network Catalog & Live Releases across 12 Crime Networks (`Netflix`, `Max / HBO`, `Hulu`, `Peacock`, `Investigation Discovery`, `Oxygen True Crime`, `Paramount+ / CBS`, `Prime Video`, `Apple TV+`, `Tubi`, `Pluto TV`, `Podcasts / Audio`) + Case Status filter (`Solved`, `Cold Case`, `Exonerated`) + optional TMDB US JustWatch batch enricher, full local Mon–Sun 7-Day Crime Broadcast & Podcast Schedule, Saved Case File Dossier & Cloud Persistence, Crime Radar (Active Investigations + Investigative Journalism RSS + YouTube Case Hunter), Archives (By Era/Year 1970–2026 & By Network/Producer), and Multi-Source Case Detail Modal. |
| `vibe-graph.html` | **Evidence & Case Vibe Graph** — Seedless 3-layer Forensic Taxonomy Find Vibe, Case & Watchlist Constellation seeding, high-DPI HTML5 Canvas (Force & pure-JS deterministic t-SNE), 5-slider DNA weights (`Forensic Tags TF-IDF`, `Shared Investigators / Directors`, `Network / Producer Match`, `Category Jaccard`, `Semantic Dossier / MiniLM`), Profile Ceiling (`<100k` / `<55k`), emergent cluster halos, optional lazy-loaded WASM MiniLM (`Xenova/all-MiniLM-L6-v2` q8) embeddings, persistent Case Node Inspector with inline auto-saving Case File editor, Neighbor Expansion, Wikipedia case attachment, and an accessible Table View fallback. |
| `eclectic-lab.html` | **Forensic Discovery Lab** — 2D Crime Vibe Map (`Method × Focus` & `Pacing × Profile` with pointer drag & arrow-key nudging), Director & Investigator Tree (8 curated documentarians/journalists + 5 craft buckets), Case Attribute Arithmetic (signed `+`/`−` forensic equations with exclusion filters & negative penalties), and Classified Case File Roulette (redacted titles & sealed art until declassification + blind Case Backlog saving). |
| `shared-core.js` | **Shared Core Engine** — Unified `localStorage` (`truecrimefinder_state_v1`) with non-destructive saves, live cross-tab `storage` events, standardized Case File statuses (`Investigating`, `Case Backlog`, `Closed / Watched`, `Cold / On Hold`, `Abandoned`), per-record deletion tombstones, `TextEncoder`/`TextDecoder` Sync Codes, unified Private GitHub Gist auto-sync (`truecrimefinder-sync.json`, boot auto-pull + 600ms debounced auto-push), shared `IndexedDB` (`TrueCrimeFinderCacheDB` v2: `apiCache` + `vectors`), Canonical True Crime Dossier Catalog + live TVMaze / iTunes True Crime Podcasts / Wikipedia / TMDB enrichment, and accessible Case Detail Modal. |
| `styles.css` | Self-contained custom Forensic Noir dark UI stylesheet with zero external CDN fragility. |
| `.nojekyll` & `manifest.webmanifest` | GitHub Pages static-serving bypass and iOS/PWA home-screen install support. |

## Shared Storage on GitHub Pages

Hosting all files on GitHub Pages (`https://<username>.github.io/<repo>/`) places every page under the **same browser origin**, automatically sharing:
- **`localStorage` (`truecrimefinder_state_v1`)** — Case File Watchlist, ratings, episode counts, investigator notes, network/case status overrides, and settings sync live across open tabs via the browser `storage` event.
- **`IndexedDB` (`TrueCrimeFinderCacheDB` v2)** — Cached API responses (`apiCache`) and 384-d MiniLM embeddings (`vectors`) are shared across all three pages.
- **Deep Links** — `?seed=<id>`, `?vibe=<query>`, `?mode=watchlist`, `?tab=<name>`, `?anime=<id>`, `?studio=<name>`, `?staff=<name>`, and `#sync=<base64>`.

## Deploy to GitHub Pages

1. Create a new repository on GitHub (for example, `truecrimefinder`).
2. Inside this folder, initialize Git and push:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: TrueCrimeFinder Web Suite"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
3. On GitHub, open **Settings → Pages**:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` / `/ (root)`
   - Click **Save**.
4. Visit `https://<your-username>.github.io/<repo-name>/` — `index.html` loads automatically as the Case Hub.
