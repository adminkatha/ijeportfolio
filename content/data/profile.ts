import { fillIn, profileSchema, validate } from "./schema";

// Facts: docs/INTAKE.md §1. Never add a phone number or salary information.
export const profile = validate("content/data/profile.ts", profileSchema, {
  name: "Ehjay Lorenzo",
  title: "Creative & Marketing Technologist",
  roleLine: "I make the ads, and I build the systems that measure them.",
  // Drafted from the work in content/data/projects.ts; confirm or replace (INTAKE §1).
  positioning: "Ad creative, Meta campaigns, and the websites, CRMs and dashboards behind them.",
  bio: [
    "Ehjay works across the whole funnel. He edits short-form video, designs static ads and carousels, runs Meta campaigns, and builds the websites, CRMs and reporting dashboards that track the results.",
    "Recent work spans fashion and jewellery, e-bikes, property investment, an RV resort, a day spa and a medical aesthetics studio.",
    fillIn("where you're based and what kind of work you're looking for"),
  ],
  location: fillIn("city, country"),
  email: "ehjaylorenzo2@gmail.com",
  links: {
    linkedin: fillIn("LinkedIn URL, or remove"),
    resume: fillIn("résumé PDF (served at /resume.pdf)"),
    other: [],
  },
  photo: {
    src: "/media/img/ehjay-lorenzo.jpg",
    width: 768,
    height: 1024,
    alt: "Portrait of Ehjay Lorenzo",
  },
});
