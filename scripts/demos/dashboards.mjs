// One entry per demo. `source` is the client-name prefix of the saved page (see lib.mjs).
//
// preclean:   elements the saved page already filled with REAL data that the renderer appends to
//             (instead of replacing), removed before the sample data is rendered.
// tabs:       selector for the tab buttons; the demo ships a tiny script that toggles their panels.
// tabPanel:   panel id template for tab buttons that do not carry aria-controls ("pane-{data-tab}").
// renderTabs: click every tab during the build (for dashboards that draw a tab when it is opened).
// sensitive:  selectors whose text in the ORIGINAL page (people, accounts, other businesses) must not
//             appear anywhere in the demo (privacy-check.mjs); sensitiveAllow lists reused labels.
export const DASHBOARDS = [
  {
    slug: "honey-tribe",
    client: "Honey Tribe",
    source: "Honey Tribe",
    generator: "honey_tribe.py",
    preclean: [
      "#s1state option:not(:first-child)",
      "#s2camp option:not(:first-child)",
      "#s2ad option:not(:first-child)",
      "#s3month option:not(:first-child)",
      "#s3season option:not(:first-child)",
      "#tblGuide tbody tr",
    ],
    tabs: "#tabs [role=tab]",
    renderTabs: false,
    views: ["Sales overview", "Shopify × Meta funnel", "Product & audience"],
  },
  {
    slug: "meloyelo",
    client: "MeloYelo",
    source: "Melo Yelo",
    generator: "meloyelo.py",
    preclean: [],
    tabs: "#tabs [role=tab]",
    renderTabs: false,
    views: ["Sales performance", "Riders & leads", "Inventory & production", "Marketing"],
    // selling agents are people: none of the original names may appear in the demo
    sensitive: ["#tblAgents tbody td:nth-child(2) span", "#chartRiderAgents text", "#chartStl text", "#s1agent option", "#s2agent option"],
    sensitiveAllow: ["Direct Sale", "MeloYelo Internal"],
  },
  {
    // The second saved copy of this page is the same document and data on the Email tab;
    // it is reachable here as the Email tab (deep link #email), not as a second demo.
    slug: "riverdance-rv",
    client: "Riverdance RV Resort",
    source: "Riverdance RV",
    generator: "riverdance_rv.py",
    preclean: ["#campaignFilter option:not(:first-child)", "#heroDdMenu > *"],
    tabs: "#tabs [role=tab]",
    renderTabs: true,
    views: ["Paid social (Meta Ads)", "Email (ActiveCampaign)"],
    tabSubtitle: { target: "#top-sub", values: { ads: "Meta Ads · Gypsum, CO", email: "Email · ActiveCampaign" } },
    // the shared email account also held other businesses' lists, automations and campaigns
    sensitive: ["#em-acct", "#em-lists .ln", "#em-autos .tname", "#em-table .tname", "#foot-about"],
    // resort-only labels the sample data reuses on purpose
    sensitiveAllow: ["Riverdance", "Riverdance - Extended Stay Leads", "Riverdance - Tenants", "Partnership",
      "Email 1", "Email 2", "Email 3", "Email 4", "Email 5", "Email 6",
      "Email 1 - Extended stays", "Email 2 - Extended stays", "Email 3 - Extended stays", "Email 4 - Extended stays"],
  },
  {
    slug: "rooming-house-expert",
    client: "Rooming House Expert",
    source: "Rooming House Expert",
    generator: "rooming_house_expert.py",
    preclean: [],
    tabs: ".tabs[role=tablist] [role=tab]",
    tabPanel: "pane-{data-tab}",
    renderTabs: true, // tabs 2-4 are drawn only when opened (they were empty in the saved page)
    views: ["Meta funnel", "Email performance", "Lead magnet & sequence", "Demographics & placement"],
    // campaign/ad names and ad copy that carried street addresses, property names or first names
    sensitive: ["#campTbl td.nm", "#adTbl td.nm", "#campsel option", "#creativeGallery .cc-copy"],
    sensitiveAllow: ["LEADS_RHE_URHCG - 12/2025", "LEADS_RHE_Interstate_URHCG", "LIKES_RHE Page Campaign 03/31/2026",
      "RHE | Interstate | Winner Angle - Copy", "Reel1_ it's not a maybe one day development play_Download",
      "Reel_Community Looks_V1_LearnMore", "Reel_Compilation1 V2"],
  },
  {
    slug: "the-contract-shop",
    client: "The Contract Shop",
    source: "The Contract Shop",
    generator: "the_contract_shop.py",
    // the saved page holds ~800 real leads (names + emails): cleared before anything renders
    preclean: ["#leads tbody tr", "#camps tbody tr", "#paidAds > *", "#paidHeat tbody tr", "#cohorts tbody tr"],
    remove: ["#actTip", "#paidTip"], // hover tooltips (dead without the app; one sat off-screen and widened the page)
    tabs: "#seg-view button[data-v]",
    tabPanel: "view-{data-v}",
    renderTabs: true, // the Lead Gen view draws its chart only when shown
    views: ["Quiz diagnostic", "Lead Gen"],
    sensitive: ["#leads td .name", "#leads td .em"],
  },
];

// Elements removed from every demo (live-app only): sync/refresh, full screen, loaders,
// tooltips, lightboxes. Ids are the dashboards' own.
export const REMOVE_ALWAYS = ["#syncBtn", "#fsBtn", "#boot", "#tip", "#cMod", "#modal", ".err"];

// Controls that only work with the live app: made inert (still visible, not focusable/clickable).
export const INERT_ALWAYS = [
  ".controls", "#controls", ".seg", ".preset", ".legend .lg", "[data-kpi]", ".sortable", "th.srt",
  ".ccard", ".click", "[role=button]", "select", "input", "textarea", "details > summary",
];
