import { capabilitiesSchema, validate } from "./schema";

/*
 * INTAKE §5. Every item carries one line of evidence (a project or job); items without evidence are left off.
 * Still waiting for evidence (so not listed): photography/videography, same-day edits, content strategy +
 * copywriting, email automation (ActiveCampaign).
 */
export const capabilities = validate("content/data/capabilities.ts", capabilitiesSchema, [
  {
    group: "Creative",
    items: [
      {
        name: "Short-form video editing",
        evidence: "Vertical product videos for Honey Tribe, talking-head ads for Super Cashflow Developments and Rooming House Expert, and resort videos for Riverdance RV Resort.",
        projectSlug: "honey-tribe",
      },
      {
        name: "Static ads and carousels",
        evidence: "A five-angle ad set, an extended-stay carousel and seasonal offers for Riverdance RV Resort; product carousels for Honey Tribe; listing ads for Super Cashflow Developments.",
        projectSlug: "riverdance-rv-resort",
      },
    ],
  },
  {
    group: "Marketing",
    items: [
      {
        name: "Meta lead campaigns",
        evidence: "A lead campaign with an instant form for Rooming House Expert's free conversion guide.",
        projectSlug: "rooming-house-expert-campaign",
      },
      {
        name: "Performance reporting",
        evidence: "A one-page campaign report (leads, cost per lead, delivery and funnel) for the same campaign.",
        projectSlug: "rooming-house-expert-campaign",
      },
    ],
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
        evidence: "Sites for Sabbath Spa, Rooming House Expert, HydRate Medbar and Latte with Lata.",
        projectSlug: "rooming-house-expert",
      },
    ],
  },
]);
