import { profileSchema, validate } from "./schema";

// Facts: docs/INTAKE.md §1. Never add a phone number or salary information.
export const profile = validate("content/data/profile.ts", profileSchema, {
  name: "Ehjay Lorenzo",
  title: "Creative & Marketing Technologist",
  roleLine: "I make the ads, and I build the systems that measure them.",
  // Drafted from the work in content/data/projects.ts; confirm or replace (INTAKE §1).
  positioning: "Ad creative, Meta campaigns, and the websites, CRMs and dashboards behind them.",
  // From his CV (summary, jobs) and his application email; nothing beyond what they say.
  bio: [
    "Ehjay works across the whole funnel. He runs Meta ad campaigns, designs the static and video creatives that go into them, sets up the tracking, reporting and email automation behind them, and builds the websites and reporting dashboards that track the results.",
    "Since 2025 he has worked in digital marketing and creatives at Agora Data Driven, after video editing at Academy of Success, freelance video and graphic design, and photographing and filming weddings and debuts for Rutenzo Photography, same-day edits included.",
    "Based in Malolos, Bulacan, in the Philippines, he's open to new opportunities where he can keep growing and put that range to work for a team's goals.",
  ],
  // City only: never the street address (or his phone number).
  location: "Malolos, Bulacan, Philippines",
  email: "ehjaylorenzo2@gmail.com",
  links: {
    linkedin: "https://www.linkedin.com/in/ehjaylorenzocrtv/",
    resume: "/resume.pdf",
    other: [],
  },
  photo: {
    src: "/media/img/ehjay-lorenzo.jpg",
    width: 768,
    height: 1024,
    alt: "Portrait of Ehjay Lorenzo",
  },
});
