import { capabilitiesSchema, validate } from "./schema";

/*
 * Skills and tools from his CV (2026-10-06), plus the web work and tools already shown on the site.
 * An evidence line (a job or a project) is shown where there is one; CV skills without a distinct example
 * are listed by name only.
 */
export const capabilities = validate("content/data/capabilities.ts", capabilitiesSchema, [
  {
    group: "Marketing",
    items: [
      {
        name: "Meta Ads Manager",
        evidence: "Lead-generation and brand-awareness campaigns at Agora Data Driven, like the Rooming House Expert guide campaign.",
        projectSlug: "rooming-house-expert-campaign",
      },
      {
        name: "Campaign setup and optimization",
        evidence: "Objectives, budgets and placements configured for each campaign at Agora Data Driven.",
      },
      { name: "Audience targeting" },
      { name: "Meta Pixel and conversion tracking" },
      {
        name: "Analytics and performance reporting",
        evidence: "CTR, CPC, CPM and conversions monitored at Agora Data Driven; one-page campaign reports and client reporting dashboards.",
        projectSlug: "client-reporting-dashboards",
      },
      {
        name: "Lead generation",
        evidence: "257 leads at A$25.01 each for Rooming House Expert's guide, 1 Aug – 1 Sep 2026.",
        projectSlug: "rooming-house-expert-campaign",
      },
      {
        name: "Email automation",
        evidence: "Automated follow-up and lead-nurturing workflows at Agora Data Driven.",
      },
    ],
    tools: ["Meta Business Suite", "Google Sheets / Excel", "ActiveCampaign"],
  },
  {
    group: "Creative",
    items: [
      {
        name: "Ad creative design",
        evidence: "Static and video creatives for Facebook and Instagram at Agora Data Driven; ad sets for Riverdance RV Resort, Honey Tribe and Super Cashflow Developments.",
        projectSlug: "riverdance-rv-resort",
      },
      {
        name: "Video editing",
        evidence: "Product videos for Honey Tribe and talking-head ads for Super Cashflow Developments; video editor at Academy of Success and freelance.",
        projectSlug: "honey-tribe",
      },
      { name: "Copywriting" },
      { name: "Content strategy" },
      {
        name: "Graphic design",
        evidence: "Freelance graphic design; listing ads and carousels for Super Cashflow Developments.",
        projectSlug: "super-cashflow-developments",
      },
    ],
    tools: ["Adobe Photoshop", "Adobe Premiere Pro", "Canva"],
  },
  {
    group: "Web",
    items: [
      {
        name: "CRM and operations portals",
        evidence: "Bookings, waivers, memberships and a staff back office for Sabbath Spa & Wellness Hub.",
        projectSlug: "sabbath-spa",
      },
      {
        name: "Reporting dashboards",
        evidence: "One reporting system for five clients, shown as live demos with sample data.",
        projectSlug: "client-reporting-dashboards",
      },
      {
        name: "Websites",
        evidence: "Sites for Sabbath Spa, Rooming House Expert and HydRate Medbar, and Latte with Lata (a team build).",
        projectSlug: "rooming-house-expert",
      },
    ],
    tools: ["WordPress", "GitHub", "Vercel", "VS Code", "Supabase"],
  },
]);
