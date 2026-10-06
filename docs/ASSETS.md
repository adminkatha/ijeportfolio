# ASSETS: his files, what each shows, and what was done with it

Source: `C:\Users\Client\LPT\ehjay-files\` (read-only, outside the repo; never modified). Two pipelines made everything the site uses:
- **Media** (images, videos, posters): `scripts/media/` → `public/media/` and `content/media/manifest.json`. Part 1.
- **Live dashboard demos**: `scripts/demos/` → `public/demos/` and `content/media/demos.json`. Part 2.

Privacy rules and decisions: `docs/DECISIONS.md` (2026-10-06). Every file was reviewed before it was committed.

## At a glance

| Client | On the site | Left out (reason) |
|---|---|---|
| Honey Tribe | 12 carousel images, 4 product videos (with sound), live dashboard demo | QR-code end cards, near-duplicates, a preview strip; 3 duplicate videos |
| Riverdance RV Resort | 12 ads (five-angle set, extended-stay carousel, seasonal offers), 2 videos (with sound), live dashboard demo (both tabs) | Angle 2 (same template as Angle 1), the $85 variant; the second dashboard file (same page, other tab) |
| Super Cashflow Developments | 18 static ads (incl. the Shepparton and Warragul listing carousels), 3 talking-head videos (with sound) | near-duplicates; a preview strip that repeats the Shepparton slides |
| Rooming House Expert | website recording (client stories cut); the campaign: winning ad, Ads Manager crop, 3 video angles; live dashboard demo | the campaign workbook itself (its key results are in the case study); one dashboard thumbnail with a street address (the demos weren't rebuilt) |
| Sabbath Spa & Wellness Hub | website recording, 2 portal screenshots (customer data blurred) | **the CRM demo video** (customer names, phones, health details and signatures for most of its 137 s) |
| HydRate Medbar | website recording (testimonial name and contacts blurred) | nothing |
| Latte with Lata | website recording (address blurred, browser bar cropped) | nothing |
| MeloYelo, The Contract Shop | live dashboard demos | nothing |
| Ehjay | portrait (`photo\ehjay.jpeg`, 420×525, chosen by the owner 2026-10-06) | the earlier studio portrait (`Downloads\Ehjay.webp`), replaced |

Totals: 47 images (8.0 MB) + the campaign's winning ad (copied from the demo's public creative), 16 videos (77.05 MB, each under 9 MB: the 12 social videos with their licensed soundtrack, the 4 website recordings silent), 16 posters, 5 demos (3.3 MB).

## Orchestrator review (2026-10-06)
- **Images:** every output image looked at on contact sheets, and the redacted ones at full size (the back-office ledger: rows and account unreadable; the Ads Manager crop: names and the Meta tip gone; the Sunbury listing: suburb only, no street address). EXIF/GPS stripped.
- **Videos:** every website recording sampled once per second (the blurs and cuts hold; no address, phone, email or customer name is readable); the guide mock-up in the Angle videos checked (the e-mail is blurred). None of the 16 has an audio stream.
- **Demos:** the pipeline's checks against the originals plus `pnpm check:push`; every image asset and poster looked at; text spot-checked (leads and agents are placeholders, campaign names anonymised).
- **Public claims kept:** prices and offers inside ads, and claims on clients' own public sites (years in business, number of conversions completed) are marketing copy, not private business figures.

## Update 2026-10-06: the owner's permissions
The clients approved all of these files, including real results, and the music in the social videos is licensed. Still never shown: customers' or leads' names, e-mails, phones, home addresses, health details, signatures and appointment details (every blur and cut for these stays; the Sabbath CRM demo video stays out).

**Social videos re-encoded with their original soundtrack** (AAC-LC stereo, about 96 kbps; same video settings, blurs and poster times; the talking-head ads stay at a 500 kbps video floor, product and drone videos about 15–18% lower to make room). A/V sync checked on four files against their sources (0 ms audio offset, 0 frames video offset).

| Video (`public/media/video/…`) | Before (MB, silent) | Now (MB) |
|---|---|---|
| `honey-tribe/janet-jumper.mp4` | 4.20 | 4.06 |
| `honey-tribe/milo-tassel-kimono.mp4` | 7.64 | 7.00 |
| `honey-tribe/knox-tassel-kimono.mp4` | 9.17 | 8.35 |
| `honey-tribe/proverbs-3-5-scripture-sweatpants.mp4` | 5.94 | 5.47 |
| `riverdance-rv-resort/not-just-parking.mp4` | 2.49 | 2.34 |
| `riverdance-rv-resort/place-to-park.mp4` | 9.56 | 8.55 |
| `rooming-house-expert-campaign/angle-1.mp4` | 3.70 | 4.46 |
| `rooming-house-expert-campaign/angle-2.mp4` | 3.37 | 4.06 |
| `rooming-house-expert-campaign/angle-3.mp4` | 3.41 | 4.00 |
| `super-cashflow-developments/custom-is-chaos-stratos-is-control.mp4` | 5.31 | 6.42 |
| `super-cashflow-developments/stop-treating-rooming-houses-like-normal-houses.mp4` | 5.66 | 6.84 |
| `super-cashflow-developments/the-income-is-obvious-the-process-is-the-problem.mp4` | 7.25 | 8.60 |
| 4 website recordings (unchanged, silent) | 6.90 | 6.90 |
| **All 16 videos** | **74.59** | **77.05** (limit 78) |

**New images:** the Super Cashflow listing carousels for Shepparton (`shepparton-nine-room-investment-01…03.jpg`) and Warragul (`warragul-nine-room-investment-01…03.jpg`), 1080×1350, no metadata, 1.05 MB together. Re-checked at full size: no person's name, phone or e-mail; only the listing addresses and advertised rents and returns (ad copy). Super Cashflow now has 18 images and the site 47.

**Campaign results:** the workbook's key figures (1 Aug – 1 Sep 2026) are now in the Rooming House Expert campaign case study; the workbook itself stays out (not a visual asset).

**Dashboards:** unchanged sample-data demos (no rebuild). Accessibility fixes were applied in place by `scripts/demos/a11y-pass.mjs`: one `<main>`, named regions, one `<h1>`, heading order, a proper tablist (The Contract Shop), 32 scroll containers made focusable regions with labels, a hidden label for an empty table header, and text darkened within each brand's hue where contrast fell short (Honey Tribe, Rooming House Expert, The Contract Shop). axe: from 5–848 violations per demo to 0 at 1440 and 390. Every text, chart, image and title was compared with the committed pages and is identical apart from the hidden labels.

# Part 1. Media

Media review of 2026-10-06. It covers every file in `ehjay-files/` except `dashboards/` (handled separately), plus the approved portrait. Sizes are decimal (1 MB = 1,000,000 bytes). Dimensions, byte sizes, alt text and poster times for every output are in `content/media/manifest.json`.

### Re-running the pipeline
```
python scripts/media/export_images.py    # images  -> public/media/img/
python scripts/media/encode_videos.py    # videos and posters -> public/media/video/, public/media/poster/
python scripts/media/build_manifest.py   # -> content/media/manifest.json
python scripts/media/review_sheets.py    # contact sheets for the privacy review (temp folder, not the repo)
```
Needs Python 3.12 with Pillow, and ffmpeg/ffprobe on PATH. The source folder is `EHJAY_FILES` (default `../ehjay-files`) and the portrait is `EHJAY_PORTRAIT` (default `<EHJAY_FILES>/photo/ehjay.jpeg`). Every decision (crops, blur boxes, cuts, poster times, alt text, exclusions) lives in `scripts/media/config.py`.

### Rules applied
- **There is no `notes.txt` and no résumé.** As a result:
  - social videos keep their original soundtrack (AAC-LC stereo, about 96 kbps): the music is licensed (owner, 2026-10-06). Until then they were published muted;
  - website recordings have their audio stripped;
  - **no client business figure** (revenue, spend, leads, cost per lead, ROAS, CTR, CPM, impressions…) appears in any output or in this document.
- **Removed wherever they appeared** (cropped, cut, blurred, or the file left out): customer names, e-mail addresses, phone numbers, home addresses, health details, signatures, appointment details (the street addresses printed in Super Cashflow's own listing ads are allowed since 2026-10-06), internal campaign names and browser chrome.
- **Kept:** prices and yields printed in the ads themselves (nightly or monthly rates, "approx. gross income per year"). They are public ad copy, not the client's results.
- **Images:** EXIF, XMP and ICC stripped; progressive JPEG at quality 82; long edge 2400 px or less (the 1080×1350 sources keep their size).
- **Videos:**
  - H.264 High, yuv420p, 30 fps, `+faststart`, with no audio stream and the container metadata stripped.
  - Social videos are 720×1280, two-pass. The budget left after the website recordings is shared by duration, weighted by a complexity probe (CRF 26), with a 500 kbps floor. The result: talking-head ads get about 0.5 Mbps and product or drone footage 0.75–1.6 Mbps (`--alpha 0` gives a plain duration split).
  - Website recordings are 1280 px wide at CRF 28.
- **Posters:** JPEG quality 80, at the video's own resolution.

### Outputs at a glance
**Videos** (16 files, H.264, no audio):

| File (`public/media/video/…`) | Resolution | Duration | Size | Avg bitrate |
|---|---|---|---|---|
| `honey-tribe/janet-jumper.mp4` | 720×1280 | 44.3 s | 4.20 MB | 759 kbps |
| `honey-tribe/milo-tassel-kimono.mp4` | 720×1280 | 51.1 s | 7.64 MB | 1196 kbps |
| `honey-tribe/knox-tassel-kimono.mp4` | 720×1280 | 57.9 s | 9.17 MB | 1268 kbps |
| `honey-tribe/proverbs-3-5-scripture-sweatpants.mp4` | 720×1280 | 43.0 s | 5.94 MB | 1106 kbps |
| `riverdance-rv-resort/not-just-parking.mp4` | 720×1280 | 20.8 s | 2.49 MB | 956 kbps |
| `riverdance-rv-resort/place-to-park.mp4` | 720×1280 | 48.7 s | 9.56 MB | 1571 kbps |
| `rooming-house-expert-campaign/angle-1.mp4` | 720×1280 | 58.8 s | 3.70 MB | 503 kbps |
| `rooming-house-expert-campaign/angle-2.mp4` | 720×1280 | 53.2 s | 3.37 MB | 506 kbps |
| `rooming-house-expert-campaign/angle-3.mp4` | 720×1280 | 52.4 s | 3.41 MB | 520 kbps |
| `super-cashflow-developments/custom-is-chaos-stratos-is-control.mp4` | 720×1280 | 85.1 s | 5.31 MB | 499 kbps |
| `super-cashflow-developments/stop-treating-rooming-houses-like-normal-houses.mp4` | 720×1280 | 91.0 s | 5.66 MB | 498 kbps |
| `super-cashflow-developments/the-income-is-obvious-the-process-is-the-problem.mp4` | 720×1280 | 112.9 s | 7.25 MB | 513 kbps |
| `hydrate-medbar/website.mp4` | 1280×586 | 19.5 s | 0.97 MB | 397 kbps |
| `latte-with-lata/website.mp4` | 1280×612 | 31.1 s | 3.09 MB | 795 kbps |
| `rooming-house-expert/website.mp4` | 1280×588 | 21.1 s | 1.61 MB | 609 kbps |
| `sabbath-spa/website.mp4` | 1280×580 | 19.3 s | 1.24 MB | 515 kbps |
| **Total** | | 810.1 s | **74.59 MB** (first encode, silent; see the 2026-10-06 update) | |

Budget: under 14.5 MB per file (largest 9.56 MB), and 76 MB in total.

**Images** (progressive JPEG, no metadata):

| Project | Images | Size |
|---|---|---|
| `honey-tribe` | 12 | 2.30 MB |
| `super-cashflow-developments` | 12 | 1.77 MB |
| `riverdance-rv-resort` | 12 | 2.64 MB |
| `sabbath-spa` | 2 | 0.12 MB |
| `rooming-house-expert-campaign` | 2 | 0.10 MB |
| `profile` | 1 | 0.05 MB |
| **Total** | **41** | **6.98 MB** |

**Posters:** 16 JPEGs at the video resolution, 1.34 MB in total.

### Honey Tribe (`honey-tribe`)
| Source (in `ehjay-files/`) | What it shows | Decision | Notes |
|---|---|---|---|
| `clothing/1.jpg` | Beaujo Screw-On Bracelet opening slide: one wrist wearing the bracelet in gold, rose gold, silver and black, each finish labelled | **Kept** → `img/honey-tribe/beaujo-screw-on-bracelet.jpg` | |
| `clothing/2.jpg` | Beaujo colourway slide: gold | Left out | Same layout repeats for each finish; the opening slide shows all four |
| `clothing/3.jpg` | Beaujo colourway slide: rose gold | Left out | As above |
| `clothing/4.jpg` | Beaujo colourway slide: silver | Left out | As above |
| `clothing/5.jpg` | Beaujo colourway slide: black | Left out | As above |
| `clothing/6.jpg` | QR-code card "Everything Honey Tribe" (end of the Beaujo set) | Left out | QR-code-only end card |
| `clothing/1(1).jpg` | Olive Denim Palazzo poster: a model in olive acid-wash wide-leg trousers, outlined lettering | Left out | Same poster layout as the pink version (kept) |
| `clothing/1(2).jpg` | Pink Denim Palazzo poster: a model in pink wide-leg denim, outlined PINK lettering, shop URL | **Kept** → `img/honey-tribe/denim-palazzo-pink.jpg` | |
| `clothing/2(1).jpg` | Olive Denim Palazzo collage slide with product copy | **Kept** → `img/honey-tribe/denim-palazzo-olive.jpg` | |
| `clothing/2(2).jpg` | Pink Denim Palazzo collage slide with product copy | Left out | Same collage layout as the olive slide (kept) |
| `clothing/3(1).jpg` | QR-code card, olive set | Left out | QR-code-only end card |
| `clothing/3(2).jpg` | QR-code card, pink set | Left out | QR-code-only end card; its label repeats the olive product name |
| `clothing/Bjorn-Cuff_01.jpg` | Bjorn Cuff: a hand wearing the Africa-shaped gold cuff, "Handmade. Natural. Timeless." | **Kept** → `img/honey-tribe/bjorn-cuff-01.jpg` | |
| `clothing/Bjorn-Cuff_02.jpg` | Bjorn Cuff still life with product copy | **Kept** → `img/honey-tribe/bjorn-cuff-02.jpg` | |
| `clothing/Bjorn-Cuff_03.jpg` | QR-code card | Left out | QR-code-only end card |
| `clothing/Eos Cuff Silver.jpg` | 3240×1350 strip: a seamless three-slide carousel (arm wearing the silver cuff; "A little shine. A little personality." copy; QR card) | **Kept, slides 1–2 only** → `img/honey-tribe/eos-cuff-silver.jpg` (2160×1350) | The only asset for this product; the QR slide is cropped off |
| `clothing/Janet-Jumper-Static_01.jpg` | Janet Jumper (olive) opening slide with tall condensed lettering | **Kept** → `img/honey-tribe/janet-jumper-01.jpg` | |
| `clothing/Janet-Jumper-Static_02.jpg` | Janet Jumper (olive) side view with copy | Left out | Same layout as the "in Black" slide 2 (kept) |
| `clothing/Janet-Jumper-Static_03.jpg` | QR-code card | Left out | QR-code-only end card |
| `clothing/Janet-Jumper-in-Black_01.jpg` | Janet Jumper in Black opening slide | Left out | Same layout as the olive opening slide (kept) |
| `clothing/Janet-Jumper-in-Black_02.jpg` | Back view in the black jumpsuit, "Relaxed. Refined. Ready for anything." | **Kept** → `img/honey-tribe/janet-jumper-in-black-02.jpg` | |
| `clothing/Janet-Jumper-in-Black_03.jpg` | QR-code card | Left out | QR-code-only end card |
| `clothing/Nysa-Shell-Bracelet_01.jpg` | Gold cowrie-shell jewellery on a hand and wrist, NYSA SHELL BRACELET | **Kept** → `img/honey-tribe/nysa-shell-bracelet-01.jpg` | |
| `clothing/Nysa-Shell-Bracelet_02.jpg` | Arm with the bracelet in dappled light, "Earthy texture with a handcrafted soul" | Left out | Curation (about a dozen pieces per client) |
| `clothing/Nysa-Shell-Bracelet_03.jpg` | QR-code card | Left out | QR-code-only end card |
| `clothing/Nysa Shell Bracelet.jpg` | 3240×1350 strip of the three Nysa slides | Left out | Duplicate preview strip |
| `clothing/Obi-Mask-Bangle_01.jpg` | Hand with red nails wearing the mask-motif bangle, "Sculptural. Striking. Unmistakably bold." | **Kept** → `img/honey-tribe/obi-mask-bangle-01.jpg` | |
| `clothing/Obi-Mask-Bangle_02.jpg` | Still life of the bangles with product copy | Left out | Curation |
| `clothing/Obi-Mask-Bangle_03.jpg` | QR-code card | Left out | QR-code-only end card |
| `clothing/Proversb-SweatPants_01.jpg` | "Introducing Proverbs 3:5 Scripture Sweatpants": a model in yellow sweatpants with a scripture-print panel | **Kept** → `img/honey-tribe/proverbs-3-5-scripture-sweatpants-01.jpg` | Source file names misspell "Proverbs" |
| `clothing/Proversb-SweatPants_02.jpg` | Close-up of the open side zip showing the print, "Wear Your Faith. Own Your Style." | **Kept** → `img/honey-tribe/proverbs-3-5-scripture-sweatpants-02.jpg` | |
| `clothing/Proversb-SweatPants_03.jpg` | QR-code card "Shop Now at HoneyTribe" | Left out | QR-code-only end card |
| `videos/Riverdance & HoneyTribe-…/Janet Jumper Revised 2.mp4` | 44 s product video: a model in the Janet Jumper, serif captions on its features, Honey Tribe end card with the shop URL | **Encoded** → `video/honey-tribe/janet-jumper.mp4` | Original soundtrack (licensed) |
| `clothing/Janet Jumper Revised 2.mp4` | Identical file (same md5) | Duplicate | Encoded once |
| `videos/Riverdance & HoneyTribe-…/Milo Tassel Kimono.mp4` | 51 s styling video of the pink colour-block Milo Tassel Kimono, bold word-by-word captions | **Encoded** → `video/honey-tribe/milo-tassel-kimono.mp4` | Original soundtrack (licensed) |
| `clothing/Milo Tassel Kimono.mp4` | Identical file | Duplicate | Encoded once |
| `videos/Riverdance & HoneyTribe-…/Knox Tassel Kimono .mp4` | 58 s video of the green, yellow and tan Knox Tassel Kimono in a sunlit room, serif captions | **Encoded** → `video/honey-tribe/knox-tassel-kimono.mp4` | Original soundtrack (licensed) |
| `videos/Riverdance & HoneyTribe-…/Proverbs 3_5 Revised.mp4` | 43 s video of the scripture sweatpants: the side zip opens to the print; captions on the waist, pockets, zips and inseam | **Encoded** → `video/honey-tribe/proverbs-3-5-scripture-sweatpants.mp4` | Original soundtrack (licensed) |
| `clothing/Proverbs 3_5 Revised.mp4` | Identical file | Duplicate | Encoded once |

### Riverdance RV Resort (`riverdance-rv-resort`)
| Source | What it shows | Decision | Notes |
|---|---|---|---|
| `services/Riverdance-1-001/Angle 1.jpg` | Green ad "LIVE WHERE OTHERS VACATION", monthly site price, Book Now, riverside photo | **Kept** → `img/riverdance-rv-resort/angle-1-live-where-others-vacation.jpg` | |
| `services/Riverdance-1-001/Angle 2.jpg` | Cream ad "THIS ISN'T A STOP-OVER. IT'S HOME.", RVs at night | Left out | Same template as Angle 1 in another colourway |
| `services/Riverdance-1-001/Angle 3.jpg` | "THE LONGER YOU STAY, THE LESS YOU PAY", photo of the resort building | **Kept** → `…/angle-3-the-longer-you-stay.jpg` | |
| `services/Riverdance-1-001/Angle 4.jpg` | "YOUR OFFICE. THE EAGLE RIVER." for remote workers | **Kept** → `…/angle-4-your-office-the-eagle-river.jpg` | Cites a third-party camping report statistic (ad copy) |
| `services/Riverdance-1-001/Angle 5.jpg` | "WHY RENT IN VAIL?" with a rent/hotel/condo bar chart | **Kept** → `…/angle-5-why-rent-in-vail.jpg` | |
| `services/Riverdance-1-001/Extended-Stay-Carousel_01.jpg` … `_05.jpg` | Five-slide extended-stay carousel: "WHAT IF HOME LOOKED LIKE THIS?", "MOUNTAIN LIVING SHOULDN'T COST A FORTUNE", "EXTENDED STAY ON THE EAGLE RIVER", amenities list, "YOUR SITE IS WAITING" | **Kept, all five** → `…/extended-stay-01.jpg` … `-05.jpg` | |
| `services/Riverdance-1-001/Mountain Recharge ($80).png` | "THE $80 MOUNTAIN RECHARGE" over RV sites at dusk (1122×1402 PNG) | **Kept** → `…/mountain-recharge.jpg` | Converted to JPEG |
| `services/Riverdance-1-001/Mountain Recharge.jpg` | The same offer as an $85 variant on a cream layout | Left out | Near-duplicate; the $80 version matches the other two seasonal promos |
| `services/Riverdance-1-001/ONE MORE AUGUST ESCAPE.png` | "ONE MORE AUGUST ESCAPE", red chairs by the river, nightly price (1092×1441 PNG) | **Kept** → `…/one-more-august-escape.jpg` | Converted to JPEG |
| `services/Riverdance-1-001/Vail Valley Adventure ($80).png` | "VAIL VALLEY ADVENTURE WITHOUT VAIL PRICES" on a doodle background (1092×1440 PNG) | **Kept** → `…/vail-valley-adventure.jpg` | Converted to JPEG |
| `videos/Riverdance & HoneyTribe-…/Not just parking. A full RV getaway..mp4` | 21 s promo: Eagle River, aerials, RV sites, offer card with nightly and weekly rates, logo | **Encoded** → `video/riverdance-rv-resort/not-just-parking.mp4` | Original soundtrack (licensed) |
| `videos/Super Cahsflow-…/Not just parking. A full RV getaway..mp4` | Identical file, misfiled in the Super Cashflow folder | Duplicate | Encoded once |
| `videos/Riverdance & HoneyTribe-…/Park .mp4` | 49 s drone video (HEVC 10-bit source): canyon, river, RV rows, cabins; hand-lettered captions ("Looking for a place to park your RV?", "Your home base in Gypsum Colorado"), logo | **Encoded** → `video/riverdance-rv-resort/place-to-park.mp4` | Original soundtrack (licensed); captions spell "River Dance" as two words |

### Super Cashflow Developments (`super-cashflow-developments`)
| Source (in `property/Super Cashflow Development-1-001/` unless noted) | What it shows | Decision | Notes |
|---|---|---|---|
| `1.jpg` | Opening slide of the Sunbury listing carousel: "LICENSED ROOMING HOUSE in Sunbury" | **Kept** → `img/super-cashflow-developments/licensed-rooming-house-sunbury.jpg` | |
| `2(1).jpg` | Sunbury slide 2: rooms, baths and an approximate income line | Left out | Same template as the Moe carousel (kept in full) |
| `3(1).jpg` | Sunbury slide 3: dusk photo, land size, "Book a call now!" | Left out | As above |
| `1(1).jpg`, `2.jpg`, `3.jpg` | Moe listing carousel: "9 ROOMS 9 INCOMES.", an approximate gross income headline, "STRONG RENTAL DEMAND IN MOE." | **Kept, all three** → `…/nine-rooms-nine-incomes-01.jpg` … `-03.jpg` | Order confirmed by the seamless edges between slides |
| `1(2).jpg` | Shepparton carousel slide 1, headed with the listing's street address | **Kept** → `img/super-cashflow-developments/shepparton-nine-room-investment-01.jpg` | The address is the client's public ad copy (allowed 2026-10-06) |
| `2(3).jpg` | Shepparton slide 2: "9 PRIVATE ROOMS. 9 ENSUITES." | **Kept** → `…/shepparton-nine-room-investment-02.jpg` | |
| `3(3).jpg` | Shepparton slide 3: "9 PRIVATE ROOMS. 9 ENSUITES.", Book a call now | **Kept** → `…/shepparton-nine-room-investment-03.jpg` | |
| `75 Grutzner Ave Shepparton.jpg` | 3240×1350 preview strip of the Shepparton carousel | Left out | Duplicate of the three Shepparton slides |
| `1(3).jpg` | Warragul carousel slide 1: the listing's street address across slides 1–2 | **Kept** → `…/warragul-nine-room-investment-01.jpg` | Allowed (client's public ad, 2026-10-06) |
| `2(2).jpg` | Warragul slide 2: the end of the address and an annual-return line | **Kept** → `…/warragul-nine-room-investment-02.jpg` | |
| `3(2).jpg` | Warragul slide 3: interior, "Compliant. Central. High-demand." | **Kept** → `…/warragul-nine-room-investment-03.jpg` | |
| `Custom is Chaos. Stratos is Control.jpg` | "CUSTOM IS CHAOS. STRATOS IS CONTROL.", Discover Stratos | **Kept** → `…/custom-is-chaos-stratos-is-control.jpg` | |
| `Custom builds drag, stratos moves.jpg` | "CUSTOM BUILDS DRAG. STRATOS MOVES." with a diagonal banner | **Kept** → `…/custom-builds-drag-stratos-moves.jpg` | |
| `One System, Faster Decisions.jpg` | "ONE SYSTEM. FASTER DECISIONS." over an aerial suburb | **Kept** → `…/one-system-faster-decisions.jpg` | |
| `Guesswork Delays, Stratos Controls.jpg` | "GUESSWORK DELAYS. STRATOS CONTROLS." over the same aerial | Left out | Near-duplicate of "One System" |
| `After August 10 it May Be Too Late.jpg` | "AFTER AUGUST 10, IT MAY BE TOO LATE." over a calendar | **Kept** → `…/after-august-10-it-may-be-too-late.jpg` | |
| `Turn your Super into Super Cashflow.jpg` | "TURN YOUR SUPER INTO SUPER CASHFLOW" over a newspaper | **Kept** → `…/turn-your-super-into-super-cashflow.jpg` | |
| `Your Retirement Needs More Than A Balance.jpg` | "YOUR RETIREMENT NEEDS MORE THAN A BALANCE" | **Kept** → `…/your-retirement-needs-more-than-a-balance.jpg` | |
| `Limited Rooming Houses Available Before the Deadline.jpg` | "LIMITED ROOMING HOUSES AVAILABLE BEFORE THE AUGUST 10 DEADLINE" over a newspaper | Left out | Repeats the SMSF-deadline message; the background shows a third-party byline |
| `Not Converted. Purpose-Built..jpg` | "NOT CONVERTED. PURPOSE-BUILT." over a furnished bedroom | **Kept** → `…/not-converted-purpose-built.jpg` | |
| `Private Ensuite + Kitchenette.jpg` | "PRIVATE ENSUITE + KITCHENETTE" over a bedroom | Left out | Near-duplicate of "Not Converted" |
| `A Cashflow-Focused Asset.jpg` | "A CASHFLOW FOCUSED ASSET" over a kitchenette | Left out | Same layout as "Not Converted" |
| `9-Room Rooming House For Sale.jpg` | "9-ROOM ROOMING HOUSE FOR SALE", Shepparton (town only) | **Kept** → `…/nine-room-rooming-house-for-sale.jpg` | No street address on it |
| `videos/Super Cahsflow-…/Custom is Chaos Stratos is Control .mp4` | 85 s talking head in a rounded frame, orange-highlighted captions, stock b-roll, title card, logo | **Encoded** → `video/super-cashflow-developments/custom-is-chaos-stratos-is-control.mp4` | Original soundtrack (licensed) |
| `videos/Super Cahsflow-…/Stop treating rooming houses like normal houses.mp4` | 91 s talking head on Class 1B rooming-house requirements; listing photos (no address) | **Encoded** → `…/stop-treating-rooming-houses-like-normal-houses.mp4` | Original soundtrack (licensed) |
| `videos/Super Cahsflow-…/The income is obvious the process is the problem.mp4` | 113 s talking head on permits, builders and compliance; introduces Stratos | **Encoded** → `…/the-income-is-obvious-the-process-is-the-problem.mp4` | Original soundtrack (licensed); captions also spell "Stratus" |

### Rooming House Expert (`rooming-house-expert`, `rooming-house-expert-campaign`)
Angle 1–3 were found in the Super Cashflow video folder, but they are Rooming House Expert ads (Rooming House Expert logo end card, the same free-guide offer). They stay under `rooming-house-expert-campaign` (decided 2026-10-06). Whether they ran in the campaign shown in the Ads Manager screenshot is not recorded.

| Source | What it shows | Decision | Notes |
|---|---|---|---|
| `website/RoomingHouseExpert.mp4` | 29 s recording of the website (page only, no address bar): hero, the father-and-son founders section, count-up company stats, featured properties, client stories, call to action, footer | **Encoded with cuts** → `video/rooming-house-expert/website.mp4` (21.1 s) | Cut 15.65–23.05 s (client stories: investor first names, their before/after rents and income figures, property photos) and 25.95–26.32 s (a fast scroll back past the same cards). Browser scrollbar cropped. The stats (years in the industry, conversions completed) are the site's public marketing claims and were left |
| `campaigns/Screenshot of the winning Ad.png` | Meta Ads Manager editor: breadcrumb with internal campaign, ad set and ad names (including a person tag), placements, instant-form action "Book Free Strategy Call", an in-editor Meta suggestion, and the feed preview of the RoomingHouse.Expert ad | **Kept as two crops** → `img/rooming-house-expert-campaign/ads-manager-ad-preview.jpg` (966×704: setup panel and preview) and `…/ad-preview-card.jpg` (240×417: the preview card at its native size) | Breadcrumb, status bar, warning banner and Publish bar cropped off. Meta's suggestion card (a tip promising a higher conversion rate, not a result) painted out. No ad account ID appears in the source |
| `campaigns/URHCG_Campaign_Dashboard_Aug1-Sep1_2026.xlsx` | Campaign report spreadsheet | Left out | Client business figures with no written permission. Not opened, and no figure from it appears anywhere |
| `videos/Super Cahsflow-…/Angle 1.mp4` | 59 s talking-head ad (a big weekly rent figure isn't the number that matters): captions, floor-plan animation, mock-up of a free conversion guide, Rooming House Expert logo | **Encoded** → `video/rooming-house-expert-campaign/angle-1.mp4` | Original soundtrack (licensed). The guide footer's e-mail address is blurred, 48.5–53.7 s |
| `videos/Super Cahsflow-…/Angle 2.mp4` | 53 s talking-head ad ("more rent does not automatically mean better investment"), b-roll, guide mock-up, logo | **Encoded** → `…/angle-2.mp4` | Original soundtrack (licensed); e-mail blurred 45.3–49.3 s. The route map in it carries no labels |
| `videos/Super Cahsflow-…/Angle 3.mp4` | 52 s talking-head ad (what is left after costs), animated icons, guide mock-up, logo | **Encoded** → `…/angle-3.mp4` | Original soundtrack (licensed); e-mail blurred 44.9–48.4 s |

### HydRate Medbar (`hydrate-medbar`)
| Source | What it shows | Decision | Notes |
|---|---|---|---|
| `website/HydRateMedbar.mp4` | 20 s recording of the website (page only): "Elevated Beauty & Wellness" hero (Long Island City, NY), logo loader, "Where Science Meets Serenity", treatment cards, a testimonial, a footer with a contact column, a giant wordmark | **Encoded with blurs** → `video/hydrate-medbar/website.mp4` | Blurred: the testimonial attribution (customer name and treatment) and the footer contact column (street address, e-mail, phone), each following the page as it scrolls (10.6–14.3 s); and the right two-thirds of the frame for 0.4 s (17.45–17.86 s) while a fast scroll to the top passes the contact column and a second testimonial. Scrollbar cropped. No URL visible |

### Latte with Lata (`latte-with-lata`)
| Source | What it shows | Decision | Notes |
|---|---|---|---|
| `website/LATTEWITHLATA.mp4` | 33 s recording of the **whole Chrome window**: tabs, address bar, profile avatar; then the kinetic "LATTE WITH LATA" hero, a page reload, cafe and menu sections, episode cards, the host section, newsletter, a "Visit" card and the footer | **Encoded with crop, cut and blur** → `video/latte-with-lata/website.mp4` (31.1 s) | Browser chrome (top 110 px) and scrollbar cropped; audio stripped; variable 60 fps → 30 fps. Cut 29.05–30.52 s (a "Visit" card with a street address and phone, then a fast scroll). The footer "Find us" block (street address, phone, e-mail) is blurred from 30.52 s to the end. These contact details look like placeholders (a 555-prefix phone number and an e-mail on the reserved `.example` domain), which suggests a demo or spec site. The address bar showed `addbp.github.io/latewlatta01/` (recorded in the manifest facts; not visible in the output). The footer carries a "site by" credit. Answered 2026-10-06: built by Ehjay with the team; shown as a team build with a "View the site" link, not as a client's live site |

### Sabbath Spa & Wellness Hub (`sabbath-spa`)
| Source | What it shows | Decision | Notes |
|---|---|---|---|
| `website/Sabbathspa.mp4` | 19 s recording of the website (page only): "Embrace the Gift of Rest" hero collage, logo loader, "Welcome to the Sanctuary of Grace", services line, massage carousel, footer | **Encoded** → `video/sabbath-spa/website.mp4` | Scrollbar cropped only. No contact details or URL visible |
| `crm/SABBATH.png` | CRM portal landing "Sabbath Spa & Wellness Hub · Digital Operations Portal" with five cards | **Kept, cropped** → `img/sabbath-spa/crm-portal-home.jpg` (1740×908) | 90 px trimmed at the left (a development-mode "N" badge) and 89 px at the right (scrollbar). No data on screen |
| `crm/SABBATH1.png` | "Bookings Ledger": sidebar, branch tabs, search, category tabs, a table with two booking rows (customer, therapist, date, service, amount, payment method, client type), the signed-in account box, browser bookmarks bar | **Kept, redacted** → `img/sabbath-spa/crm-bookings-ledger.jpg` (1900×858) | Bookmarks bar (top 18 px) and scrollbar cropped. Both table rows and the account box pixelated and blurred until unreadable. Navigation, headings, filters and column headers kept. The result reads as a deliberate redaction |
| `crm/Sabbath-Spa-CRM-Dashboard-Demo.mp4` | 137 s walkthrough of the CRM: POS overview, bookings, clients (profile pop-up), memberships, staff, payments, waivers, audit log | **Left out** | Checked one frame every 2 s. Customer names, mobile numbers, declared health conditions, signatures, visit histories, amounts and revenue totals fill most of it, in scrolling tables and pop-ups, so it cannot be cleaned reliably. Its title card says "sample data", which cannot be verified |

### Portrait
| Source | What it shows | Decision | Notes |
|---|---|---|---|
| `Downloads\Ehjay.webp` (outside `ehjay-files`) | The earlier studio portrait, 768×1024 | Replaced on 2026-10-06 by the owner's choice below | |
| `photo/ehjay.jpeg` | Ehjay in a beige sweatshirt on a light background, 420×525 | **Kept** → `img/ehjay-lorenzo-portrait.jpg` (420×525, metadata stripped) | The owner chose it on 2026-10-06; it is the site portrait. Alt text: "Portrait of Ehjay Lorenzo" |

### Posters (output timeline)
| Video | Poster time | Frame |
|---|---|---|
| `honey-tribe/janet-jumper` | 36.0 s | Model in the jumpsuit, mid-video |
| `honey-tribe/milo-tassel-kimono` | 39.0 s | Model in the kimono |
| `honey-tribe/knox-tassel-kimono` | 36.0 s | Model in the kimono |
| `honey-tribe/proverbs-3-5-scripture-sweatpants` | 3.0 s | Sweatpants with caption |
| `riverdance-rv-resort/not-just-parking` | 6.0 s | Scenic shot with caption |
| `riverdance-rv-resort/place-to-park` | 22.0 s | Drone shot with caption |
| `rooming-house-expert-campaign/angle-1`, `-2`, `-3` | 3.0 s | Presenter with caption |
| `super-cashflow-developments/custom-is-chaos-stratos-is-control` | 74.0 s | Title card over the presenter |
| `super-cashflow-developments/stop-treating-rooming-houses-like-normal-houses` | 50.0 s | Presenter with caption |
| `super-cashflow-developments/the-income-is-obvious-the-process-is-the-problem` | 10.0 s | Presenter with caption |
| `hydrate-medbar/website` | 3.0 s | Hero |
| `latte-with-lata/website` | 2.0 s | Hero |
| `rooming-house-expert/website` | 4.0 s | Hero |
| `sabbath-spa/website` | 4.0 s | Hero |

### Facts found
- **Brand spellings:**
  - Honey Tribe: "HoneyTribe" in the logo; "Honey Tribe" in captions and on end cards.
  - Riverdance RV Resort: the logo writes "Riverdance"; one video's captions write "River Dance".
  - Super Cashflow Developments: the source folder is spelled "Super Cahsflow". The product is "Stratos", also spelled "Stratus" in one video's captions.
  - Rooming House Expert: the Facebook page name is "RoomingHouse.Expert".
  - HydRate Medbar: capital R.
  - Latte with Lata.
  - Sabbath Spa & Wellness Hub, whose in-house cafe is "Sabasu".
- **Live URLs seen.** The orchestrator checked all three on 2026-10-06, and each answers HTTP 200:
  - `addbp.github.io/latewlatta01/`: Latte with Lata, in the recording's address bar.
  - `shophoneytribe.com`: shown as `www.shophoneytribe.com` on the video end cards and posters.
  - `www.roominghouse.expert`: in the guide mock-up's footer.
  - HydRate Medbar, Rooming House Expert and Sabbath Spa: no URL visible, because their recordings show only the page.
  - `content/media/manifest.json` records all three as `verified: true` (HTTP 200 on 2026-10-06).

### Open questions for the owner
1. **Latte with Lata:** the footer credits a web studio, and the contact details look like placeholders. Is the site Ehjay's own build, a studio project he worked on, or a spec piece?
2. **Rooming House Expert stats:** the website video still shows the company's count-up stats (years in the industry, conversions completed). Cut them if they count as business figures.
3. ~~**Music:**~~ answered 2026-10-06: the music is licensed; the social videos were re-encoded with sound.
4. **CRM demo:** it could go back in if it is re-recorded with obviously fictional demo data.

# Part 2. Live dashboard demos

Source: `C:\Users\Client\LPT\ehjay-files\dashboards\` (read-only). Six saved web pages, each an `.html` plus a `_files` folder. Their file names end with the reporting app's name; that name is not used anywhere in this repo, and the dashboards are referred to by client name only.

Outputs (untracked, waiting for the orchestrator's review):
- `public/demos/<slug>/index.html`, `assets/`, `preview.jpg` (five demos)
- `content/media/demos.json`
- `scripts/demos/` (build, verify, privacy check, manifest, sample-data generators)

### Verdicts

**(a) Riverdance: two views of one page, kept as one demo.** The two Riverdance saves are the same document with the same data. The inner dashboards' scripts and CSS are byte-identical, and the markup differs only in which tab was open when it was saved: the Paid Social tab (`#ads`) in file 1, Email · ActiveCampaign (`#email`) in file 2. Each save already contains both tabs. So there is one demo, `riverdance-rv`, with both tabs working, and `/demos/riverdance-rv/index.html#email` opens the Email view. File 2 is listed as excluded in `demos.json`.

**(b) Same system: yes, so this is one project, "Client reporting dashboards", with five live demos.**
- All six pages share one portal shell: identical inline scripts (same byte lengths), stylesheet and element ids.
- Each page is the client workspace's Dashboard screen in admin view (an "admin edit" banner, a nav rail, notifications, an embed-URL setting). It embeds the client's own dashboard in an iframe; that embedded page is the actual dashboard.
- The five dashboards are built from the same parts:
  - a header with the client logo, an "Updated / Data through" stamp, Sync and a "prepared by" agency mark
  - period presets plus a separate KPI-benchmark range
  - Auto/Day/Week/Month grain and Relative/Absolute axis toggles
  - KPI scorecards with deltas against the benchmark
  - inline-SVG charts and sortable tables
  - an "ads that ran" gallery and auto-written "reading of the period" insight cards
  - the same `data.json` + `refresh` contract
- What differs per client is the tabs, the metrics and the colour theme (see the table below). No dashboard is a different system.

**(c) Tech evidence (from the files, nothing assumed).**
- Each dashboard is one HTML page with inline CSS and hand-written vanilla JavaScript. Code comments say it is kept ES5-safe for a pre-deploy esprima 4.x check (`tools/_validate_dash_js.py`).
- Charts are inline SVG drawn by each page's own code: `document.createElementNS` in four dashboards, SVG markup strings in The Contract Shop. The saved dashboards contain no `<canvas>`, no chart library and no framework markers (React, Vue, Next.js, Vite, webpack).
- Every dashboard fetches a relative `data.json` and POSTs to a relative `refresh` route (the Sync button). Comments place the dashboards under a `/d/<client>/` path of the portal and name a Python export job (`job/main.py`, `job/activecampaign.py`, `job/build_local.py`).
- Data sources named in the code and on screen:
  - Honey Tribe: Shopify and Meta via Windsor.ai
  - MeloYelo: sales lines, CRM stage history, production orders, Campaign Monitor, Meta via Windsor.ai
  - Riverdance RV Resort: Meta via Windsor.ai, ActiveCampaign
  - Rooming House Expert: Meta, ActiveCampaign
  - The Contract Shop: the quiz feed, Klaviyo email data, SQL views over a shared Meta ingest
- Comments and notes in Honey Tribe, MeloYelo and Rooming House Expert refer to the earlier Looker reports whose metrics they reproduce or correct.
- Fonts are Google Fonts:
  - Honey Tribe: Lato + EB Garamond
  - MeloYelo: Inter + Archivo
  - Riverdance RV Resort: Inter + Open Sans
  - Rooming House Expert: Inter + Playfair Display
  - The Contract Shop: system stack
- The portal shell loads Google Tag Manager and gtag. The Contract Shop's dashboard also loads gtag itself.

### Per file

| Saved page | Size | Client (brand spelling) | What the dashboard shows | Demo |
|---|---|---|---|---|
| Honey Tribe (file 1/1) | page 2.4 MB + folder 2 MB | **Honey Tribe**: the logo wordmark is set as "HONEYTRIBE" with "Bold prints. Modern cuts."; the title and alt text read "Honey Tribe" | 3 tabs. **Sales overview**: sales, customers, AOV, first-time/returning, units, metrics-over-time chart, weekly and month-to-date comparison, US state tile map, customers/AOV/sales chart, best sellers, new vs returning bars, insights. **Shopify × Meta**: funnel stages (awareness, consideration, conversion, efficiency) vs a KPI average, impression-to-purchase funnel, revenue vs spend, efficiency, frequency, ads that ran, campaign table, insights. **Product & audience**: sessions and orders by platform, category donut, category by month, best sellers by month, a generic US seasonal retail guide, age/gender and regions, sizes, order bands, weekday, units by state and month, traffic sources, insights. | `public/demos/honey-tribe/`: 604 KB (page 284 KB) |
| Melo Yelo (file 1/1) | page 3.7 MB + folder 37 MB | **MeloYelo**: logo "meloYELO E-BIKES", "just mad about e-bikes"; title and alt "MeloYelo" | 4 tabs, dark theme. **Sales performance**: FY bike target meter, FY-so-far comparison, KPI scorecards, metrics over time, month scoreboard, bike sales by model, customer-type donut, model and selling-agent leaderboards, product groups, insights. **Riders & leads**: rider community and growth, riders by source/agent/region/model, test-ride pipeline funnel, requests over time, speed-to-lead by agent, leads by region, current stage spread, insights. **Inventory & production**: stock KPIs, available stock by variant, runway by model, production orders, insights. **Marketing**: email (Campaign Monitor) KPIs and campaigns, Meta Ads KPIs, click funnel, leads and spend over time, campaign table, planned Google Ads/GA4 panes, insights. | `public/demos/meloyelo/`: 431 KB (page 176 KB) |
| Riverdance RV (file 1/2) | page 2.9 MB + folder 18 MB | **Riverdance RV Resort**: script logo "Riverdance RV Resort"; the file names say "Riverdance RV" | 2 tabs, green/cream theme. **Paid Social**: performance summary hero, KPIs, industry benchmark cards (public 2025–26 benchmarks with sources), spend and metrics chart, cumulative revenue vs spend, reach and engagement, CPC/CPM, frequency, impression-to-booking funnel, age/gender/state, creative gallery, campaign, creative and month tables, tracked bookings, takeaways. **Email · ActiveCampaign**: KPIs, one bar per campaign, lists and subscribers, contact base, every-email table, automations. | `public/demos/riverdance-rv/`: 897 KB (page 115 KB); both tabs |
| Riverdance RV (file 2/2) | page 2.9 MB + folder 18 MB | same | the same page saved on the Email tab | excluded: it is the Email tab of `riverdance-rv` |
| Rooming House Expert (file 1/1) | page 1.7 MB + folder 4 MB | **Rooming House Expert**: logo "ROOMING HOUSE EXPERT", "Turning underperforming property into cash-flow." | 4 tabs. **Meta funnel**: stage cards vs a KPI benchmark, budget context, leads/CPL/spend/clicks chart, funnel shape, KPI rail, ads that ran, campaign table, creative-fatigue table, insights. **Email performance**, **Lead magnet & sequence** and **Demographics & placement** were empty skeletons in the saved page (they draw on first open). The demo renders all four. | `public/demos/rooming-house-expert/`: 1.0 MB (page 145 KB) |
| The Contract Shop (file 1/1) | page 2.6 MB + folder 46 MB | **The Contract Shop**: logo "The CONTRACT .SHOP" | 2 views, teal theme. **Quiz diagnostic**: hero, KPIs, leads/sales/click-rate trend, cohort table, quiz leads list, emails grouped by subject, insights. **Lead Gen**: spend/leads/CPL hero and KPIs, trend chart, month-by-month blended funnel, campaigns, per-ad funnel heatmap, creative grid, insights. | `public/demos/the-contract-shop/`: 389 KB (page 208 KB) |

All five demos render offline, with a tiny inline tab script. Sizes include the 1440x900 poster (`preview.jpg`, about 120–135 KB each).

### How the demos were made

`node scripts/demos/build.mjs` builds every demo from the originals. For each dashboard it:
1. Extracts the client logo and the public ad thumbnails, resized (logo up to 200 px; creatives up to 720 px wide, JPEG/WebP quality 80) and renamed `creative-NN`. The original names were Meta creative IDs or ad titles.
2. Generates a **seeded synthetic `data.json`** in the shape the dashboard's code reads (`scripts/demos/gen/*.py`). Magnitudes are the same order as the original, never the same values, and ratios are consistent because the dashboard computes them itself.
3. Self-hosts the latin subset of the page's Google Fonts, with their SIL OFL texts in `assets/fonts/`. The Lato copyright line's contact address is written "name [at] domain", so no email pattern ships.
4. Loads the saved dashboard with JavaScript off and removes:
   - trackers, external scripts and font links
   - the elements the saved page had already filled with real data that the code appends to (select options, the retail guide, The Contract Shop's 800 lead rows, its email and ad tables)
5. Loads it on a fake origin with JavaScript on, a fixed clock and a seeded `Math.random`. Every request except the page, `data.json` and local assets is aborted. The dashboard's own code then draws every KPI, table and SVG chart from the sample data, so chart shapes come from the sample series. Tabs that draw on first open are clicked.
6. Sanitises the result:
   - strips all scripts, comments, event handlers, hover titles, creative IDs, Sync/full-screen buttons, tooltips and lightboxes
   - replaces the agency's "prepared by / managed by / built by" logo (and Riverdance's footer logo) with a neutral **Client reporting** wordmark
   - scrubs account-style IDs, 9+ digit runs and emails from text
   - unwraps external links
   - rounds SVG coordinates
   - makes filters, sorts and toggles `inert` (still visible)
   - prunes unused assets
   - adds `<meta name="robots" content="noindex, nofollow">`, the title "<Client> — Demo (sample data)", a small fixed **"Demo — sample data"** edge label in the bottom-left corner (it sits in the side gutter at 1440 and 390), and a tiny tab script (supports `#tab` deep links)

The build is deterministic: rebuilding gives byte-identical files.

### What was replaced or removed, per demo

- **All:**
  - every business figure is sample data: spend, revenue, sales, orders, leads, CPL, ROAS, CTR, CPC, CPM, impressions, reach, frequency, conversions, targets, stock, email counts and rates, percentages, deltas, axis ticks and insight text
  - dates and reporting windows are kept in the same form
  - "Updated" shows a fixed sample date
- **Honey Tribe:**
  - generic product names replace the real catalogue (some products carry first names)
  - campaign/ad names follow the real agency naming convention; names containing a third-party agency or first names were dropped
  - the three ad cards keep their public ad copy
  - the ad images were not in the saved page, so the cards show the dashboard's own headline tiles
- **MeloYelo:**
  - every selling agent is "Agent #NN"; 149 original agent names were checked and none appears
  - a Google Ads account number hard-coded in the dashboard's code is replaced by "(ID removed)"
  - model, colour, region, stage and source labels are the brand's public or generic vocabulary
  - email and Meta campaign names are clean or generic
- **Riverdance RV Resort:**
  - the ad names, campaign names and the four ad images (five cards; one had no image) are the resort's public creatives, renamed and resized
  - the footer's ad-account label is generic
  - the email account also held lists, automations and campaigns for other businesses plus an account handle: the demo shows resort-only sample names and no handle
- **Rooming House Expert:**
  - one neutral account label replaces the real ad-account names (one is a person's name)
  - campaign and ad names lose street names, property names and team members' first names
  - ad copy is shortened where it named a street address, town or listing figures
  - two thumbnails are withheld: one printed a street address and another company's logo, one was an empty frame; both show the dashboard's headline tile
  - the email, lead-magnet and demographics tabs use neutral labels (quiz answers, list, automation and template names), not the client's; those tabs were never rendered in the saved page
- **The Contract Shop:**
  - every quiz lead is a placeholder ("Lead #2059", handle "lead2059@•••", which is not an email address)
  - the 800 real names and emails in the saved page were removed before rendering, and the privacy check confirms none appears
  - email subject lines, campaign and ad names are the public marketing copy
  - two creative images embedded in the page are kept; the other ad images were expiring Meta CDN links, so those cards show the dashboard's "no preview" tile
  - the off-screen hover tooltip that widened the page by 125 px is removed

### Verification

`node scripts/demos/verify.mjs --shots <dir>` serves `public/` from a tiny local Node server and opens each demo in Chrome (Playwright) with every non-local request blocked and logged.

| Demo | External requests | Console/page errors | 4xx/5xx | Tabs | Horizontal overflow at 1440 / 390 |
|---|---|---|---|---|---|
| honey-tribe | 0 | 0 | 0 | 3 working | 0 / 0 |
| meloyelo | 0 | 0 | 0 | 4 working | 0 / 0 |
| riverdance-rv | 0 | 0 | 0 | 2 working (+ `#email`) | 0 / 0 |
| rooming-house-expert | 0 | 0 | 0 | 4 working | 0 / 0 |
| the-contract-shop | 0 | 0 | 0 | 2 working | 0 / 0 |

Screenshots at 1440x900 and 390x844 (every tab, full page) were taken and reviewed. `preview.jpg` is the 1440x900 top-of-page poster.

`node scripts/demos/privacy-check.mjs` passes. It checks:
- **Every output file** for the agency name (joined, with separators, or as single words), emails, phone-like numbers, ad-account IDs, 9+ digit runs, API keys, tokens, JWTs, GA/GTM IDs, private, app or tracker hosts, and street addresses or postcodes.
- **Each demo against its original:**
  - no shared figure with 6 or more significant digits
  - no run of three original figures in the same order
  - no original KPI value in a demo KPI tile
  - none of the original's emails (800 checked in The Contract Shop)
  - none of the original's names, accounts or address-bearing strings (1,383 checked in The Contract Shop, 149 in MeloYelo, 75 in Rooming House Expert, 57 in Riverdance)

Single four- or five-digit values do coincide by chance between two long tables (about 0–22 per demo, at chance level and in unrelated rows), so they are reported, not failed.

### Problems and limits

- **The demos are static.** Filters, date pickers, sorting, hover tooltips and click-to-filter do not work; only the tabs do. The controls are shown as they were, but inert.
- **Labels written as placeholders.** In Rooming House Expert's three lazily drawn tabs, and in Riverdance's email tab, the labels are placeholders. They are not the client's real campaign, list or template names.
- **Ad images.** Honey Tribe's ad images and most of The Contract Shop's were not in the saved pages, so those cards show the dashboards' own fallback tiles.
- **Latin-only fonts.** Fonts are self-hosted for the latin subset only, so rare glyphs (macrons, arrows) fall back to the system font, as they did for any glyph outside the original subsets.
- **Not used: portal-only images.** The `_files` folders also hold large ad and email images that belong to the portal's other sections, not to the dashboards:
  - MeloYelo: 19 PNGs, about 37 MB
  - The Contract Shop: about 30 images, about 46 MB
  - Riverdance: about 30 images, about 18 MB per copy
  - None is used here; they are a separate decision for the media work.
- **Logged elsewhere.** `CLAUDE.md` asks for each dashboard screenshot review to be logged in `docs/DECISIONS.md`. That file is outside this agent's outputs, so the orchestrator records the entry.

### Re-run

From the repo root, with the originals in place (override the path with `DASHBOARD_SRC`; temp files go to `DEMO_WORK`, default the OS temp folder):

```
node scripts/demos/build.mjs            # all demos, or: node scripts/demos/build.mjs meloyelo
node scripts/demos/verify.mjs --shots <screenshot folder>
node scripts/demos/privacy-check.mjs
node scripts/demos/manifest.mjs         # rewrites content/media/demos.json
node scripts/demos/a11y-pass.mjs [--check] [slug ...]   # accessibility pass, in place (build.mjs runs it too)
node scripts/demos/verify.mjs --shots <dir> [--posters]  # axe on every tab; --posters rewrites preview.jpg
```

It needs Python 3.12 + Pillow and Node with the repo's Playwright (local Chrome). Network is used once to download the self-hosted font files and their OFL texts; nothing contacts the dashboards' live services.
