# Intake: facts for Ehjay Lorenzo's portfolio

Every `[FILL IN: …]` below shows on the site as a visible placeholder until it's answered. Nothing gets invented. ✅ = already confirmed (source: his current application email, or your instructions on 2026-10-05).

**Never on the site:** his phone number, salary or compensation information.

---

## 0. Files
| Item | Status |
|---|---|
| `C:\Users\Nico\ehjay-assets\` (photo, résumé, work samples) | ❌ **Not found.** The folder doesn't exist on this machine. [FILL IN: correct path, or create the folder and add the files] |
| Portrait photo | Found `C:\Users\Nico\Downloads\Ehjay.webp` (768×1024). [FILL IN: confirm it's him and approved for the site, and give alt text] |
| Résumé PDF | [FILL IN: file, which will be served at /resume.pdf] |
| Work images and videos | [FILL IN: files, grouped by project] |

## 1. Profile → `content/data/profile.ts`
| Field | Answer |
|---|---|
| name | ✅ Ehjay Lorenzo |
| title (lead, editable) | ✅ Creative & Marketing Technologist (default) |
| roleLine | ✅ "I make the ads, and I build the systems that measure them." (default) |
| current job title (for Experience) | ✅ Digital Marketing, Social Media and Creative Specialist |
| positioning (one line, beyond the role line) | [FILL IN] |
| bio (2–3 sentences, portfolio voice) | Will be drafted from ✅ his experience list below; [FILL IN: anything personal to add, e.g. where he's based and what he's looking for] |
| location | [FILL IN] |
| email | ✅ ehjaylorenzo2@gmail.com |
| links.github | [FILL IN or "none"] |
| links.linkedin | [FILL IN or "none"] |
| links.resume | [FILL IN: PDF file] |
| other links (Instagram, Behance, YouTube…) | [FILL IN or skip] |

## 2. Experience areas (source material for bio and capabilities) ✅
Video editing · graphic design · photography/videography · ad creative production · Meta Ads · content strategy · copywriting · performance reporting · same-day edits · freelance and marketing-focused creative projects.
**New:** full-stack web development (CRM work, dashboards) and digital/Meta marketing campaigns. Details: [FILL IN]
**Tools:** Adobe Premiere Pro, Adobe Photoshop, Canva, Meta Business Suite, Google Sheets/Excel, ActiveCampaign. Web stack used for the CRM/dashboard work: [FILL IN]

## 3. Work → `content/data/projects.ts` (+ `content/work/<slug>.mdx`)
Disciplines: **Web & Systems** (CRM, dashboards) · **Campaigns** (Meta) · **Video** (short-form) · **Creative** (Clothing, Services, Property).
Existing categories ✅: Clothing, Services, Property, Short-form videos, Sample campaigns.

Rules:
- Sample campaigns are labelled "Sample campaign" everywhere.
- Results are real numbers only.
- Clients are named only with permission.
- CRM/dashboard screenshots show no real customer or client data.

**Featured on the homepage (4, ideally one per discipline):** [FILL IN: which 4]

Copy this block for every piece:

| Field | Answer |
|---|---|
| title | [FILL IN] |
| discipline | [FILL IN: web-systems / campaigns / video / creative] |
| sector (Creative only) | [FILL IN: clothing / services / property] |
| isSample (sample campaign/spec work?) | [FILL IN: yes / no] |
| client name + permission to name it | [FILL IN or "don't name"] |
| eyebrow (small label) | [FILL IN] |
| summary (2–3 sentences) | [FILL IN] |
| his role | [FILL IN] |
| tools / stack | [FILL IN] |
| result (real) | [FILL IN or skip] |
| metric (real number + label, e.g. "3.1× ROAS") | [FILL IN or skip] |
| liveUrl / githubUrl | [FILL IN or skip] |
| cover image file | [FILL IN or "none" (gets a typographic cover)] |
| gallery files | [FILL IN or skip] |
| video file + aspect ratio (9:16 / 16:9 / 1:1 / 4:5) | [FILL IN or skip] |
| year | [FILL IN] |
| status | [FILL IN: shipped / in-progress] |

**Case-study notes by discipline** (bullet points are fine; I'll shape them into prose without adding facts):
- Web & Systems: Problem · Context · Constraints · Architecture · Implementation · Key technical decision · Result · What I learned → [FILL IN]
- Campaigns: Objective · Audience · Creative approach · Setup · Results · What I learned → [FILL IN]
- Video / Creative: a short brief (what it was for, his role, tools) → [FILL IN]

**GrowthTrack:** dropped (it came from old notes). [FILL IN: only if it is his work, confirm and give details]

## 4. Experience → `content/data/experience.ts`
| Field | Role 1 |
|---|---|
| company (name only with permission) | [FILL IN] |
| role | [FILL IN, e.g. ✅ Digital Marketing, Social Media and Creative Specialist] |
| start / end (month + year, or present) | [FILL IN] |
| 2–4 bullets (real outcomes only) | [FILL IN] |
| tools | [FILL IN] |
| freelance? | [FILL IN] |

Role 2, 3, …: [FILL IN]

## 5. Capabilities → `content/data/capabilities.ts`
Groups: **Creative · Marketing · Web**. Every item needs one line of evidence (a project or job); items without it are left off.

| Group | Item | Evidence |
|---|---|---|
| Creative | Video editing (Premiere Pro) | [FILL IN: which project/job] |
| Creative | Graphic design (Photoshop, Canva) | [FILL IN] |
| Creative | Photography / videography | [FILL IN] |
| Creative | Same-day edits | [FILL IN] |
| Marketing | Meta Ads (Meta Business Suite) | [FILL IN] |
| Marketing | Ad creative production | [FILL IN] |
| Marketing | Content strategy + copywriting | [FILL IN] |
| Marketing | Performance reporting (Sheets/Excel) | [FILL IN] |
| Marketing | Email automation (ActiveCampaign) | [FILL IN] |
| Web | CRM development | [FILL IN] |
| Web | Dashboards | [FILL IN] |
| Web | Stack items | [FILL IN] |

## 6. Now → `content/data/now.ts`
| Field | Answer |
|---|---|
| building | [FILL IN] |
| learning | [FILL IN] |
| updatedAt | [FILL IN: YYYY-MM-DD] |

## 7. Playground / Writing
Hidden, together with their nav links, while empty ✅. Items or posts to add later: [FILL IN or skip]

## 8. Contact
| Field | Answer |
|---|---|
| heading | ✅ "LET'S BUILD SOMETHING USEFUL." |
| channels | ✅ email; GitHub / LinkedIn / résumé once provided. Never phone. |
| availability line | [FILL IN or skip] |

## 9. Video hosting (decide before any video is added; see PLAN §5)
| Option | Your answer |
|---|---|
| A: compressed MP4 in the repo (recommended for short-form; needs ffmpeg installed) / B: Vercel Blob / C: YouTube or Vimeo | [FILL IN] |

## 10. Deploy (answer at Phase 16)
- `SITE_URL` / domain: [FILL IN]
- Vercel account/team: [FILL IN]
- GitHub repo + visibility + push permission: [FILL IN]
- Analytics on: [FILL IN]
