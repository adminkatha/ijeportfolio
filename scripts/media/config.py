"""What the media pipeline does with each of his source files.

Paths in `src` are relative to the ehjay-files folder (see common.py). Coordinates are source pixels,
boxes are (left, top, right, bottom). Times are seconds. This file deliberately contains no street
addresses, e-mail addresses, phone numbers, customer names or business figures: where a source file
name itself contains a street address it is listed under a withheld display name and never processed.
"""
from __future__ import annotations

HT_VIDEOS = "videos/Riverdance & HoneyTribe-20261005T143802Z-1-001"
SC_VIDEOS = "videos/Super Cahsflow-20261005T143809Z-1-001"
PROPERTY = "property/Super Cashflow Development-1-001"
SERVICES = "services/Riverdance-1-001"

CLIENTS = {
    "honey-tribe": "Honey Tribe",
    "riverdance-rv-resort": "Riverdance RV Resort",
    "super-cashflow-developments": "Super Cashflow Developments",
    "rooming-house-expert": "Rooming House Expert (website)",
    "rooming-house-expert-campaign": "Rooming House Expert (Meta campaign and video ads)",
    "sabbath-spa": "Sabbath Spa & Wellness Hub",
    "hydrate-medbar": "HydRate Medbar",
    "latte-with-lata": "Latte with Lata",
    "profile": "Ehjay Lorenzo (portrait)",
}

# --------------------------------------------------------------------------------------------
# Images
# Optional keys: crop, obscure (list of boxes, applied before crop), fill (list of (box, rgb)),
# group, caption. Every output is a progressive JPEG, quality 82, max 2400 px, no metadata.
# --------------------------------------------------------------------------------------------
IMAGES = [
    # ---- Honey Tribe (clothing/) ----
    dict(project="honey-tribe", src="clothing/1.jpg", out="beaujo-screw-on-bracelet.jpg",
         group="Beaujo Screw-On Bracelet carousel",
         alt="Beaujo Screw-On Bracelet graphic: a wrist stacked with the bracelet in gold, rose gold, silver and black on a peach background, each finish labelled, with a Shop Now! button."),
    dict(project="honey-tribe", src="clothing/1(2).jpg", out="denim-palazzo-pink.jpg",
         group="Denim Palazzo carousels",
         alt="Pink Denim Palazzo poster: a model in a white top and wide-leg pink denim trousers in front of large outlined PINK lettering, with the line 'Get yours on shophoneytribe.com'."),
    dict(project="honey-tribe", src="clothing/2(1).jpg", out="denim-palazzo-olive.jpg",
         group="Denim Palazzo carousels",
         alt="Olive Denim Palazzo carousel slide: a photo collage of a model in olive acid-wash wide-leg trousers, with copy introducing the Zara Olive Denim Palazzo."),
    dict(project="honey-tribe", src="clothing/Bjorn-Cuff_01.jpg", out="bjorn-cuff-01.jpg",
         group="Bjorn Cuff carousel",
         alt="Bjorn Cuff carousel slide: a hand wearing a gold cuff shaped like the map of Africa, beside the title BJORN CUFF and the words 'Handmade. Natural. Timeless.'"),
    dict(project="honey-tribe", src="clothing/Bjorn-Cuff_02.jpg", out="bjorn-cuff-02.jpg",
         group="Bjorn Cuff carousel",
         alt="Bjorn Cuff carousel slide: two gold Africa-shaped cuffs on a stone stand in dappled light, with copy saying the cuff is handcrafted in Kenya from natural brass."),
    dict(project="honey-tribe", src="clothing/Eos Cuff Silver.jpg", out="eos-cuff-silver.jpg",
         group="Eos Cuff carousel", crop=(0, 0, 2160, 1350),
         caption="Slides 1 and 2 of a seamless three-slide carousel; the QR-code end slide is cropped off.",
         alt="Two-slide panorama for the Eos Cuff bracelet in silver: an arm wearing the sculpted silver cuff, the title 'Eos Cuff', and the headline 'A little shine. A little personality.' with product copy."),
    dict(project="honey-tribe", src="clothing/Janet-Jumper-Static_01.jpg", out="janet-jumper-01.jpg",
         group="Janet Jumper carousel",
         alt="Janet Jumper carousel slide: a model in an olive wide-leg jumpsuit with striped suspender ties and a burgundy top, framed by tall condensed JANET JUMPER lettering."),
    dict(project="honey-tribe", src="clothing/Janet-Jumper-in-Black_02.jpg", out="janet-jumper-in-black-02.jpg",
         group="Janet Jumper in Black carousel",
         alt="Janet Jumper in Black carousel slide: a model seen from behind in the black jumpsuit, with the headline 'Relaxed. Refined. Ready for anything.' and product copy."),
    dict(project="honey-tribe", src="clothing/Nysa-Shell-Bracelet_01.jpg", out="nysa-shell-bracelet-01.jpg",
         group="Nysa Shell Bracelet carousel",
         alt="Nysa Shell Bracelet carousel slide: a hand and wrist wearing gold cowrie-shell jewellery against a concrete wall, with NYSA SHELL BRACELET in tall lettering."),
    dict(project="honey-tribe", src="clothing/Obi-Mask-Bangle_01.jpg", out="obi-mask-bangle-01.jpg",
         group="Obi Mask Bangle carousel",
         alt="Obi Mask Bangle carousel slide: a hand with red nails wearing a bangle of black-and-white mask motifs, with the title 'Obi Mask Bangle' and 'Sculptural. Striking. Unmistakably bold.'"),
    dict(project="honey-tribe", src="clothing/Proversb-SweatPants_01.jpg", out="proverbs-3-5-scripture-sweatpants-01.jpg",
         group="Proverbs 3:5 Scripture Sweatpants carousel",
         alt="Proverbs 3:5 Scripture Sweatpants carousel slide: a model walking in yellow sweatpants with a scripture-print side panel and a red jacket, with 'Introducing Proverbs 3:5 Scripture Sweatpants' and 'Available now!'"),
    dict(project="honey-tribe", src="clothing/Proversb-SweatPants_02.jpg", out="proverbs-3-5-scripture-sweatpants-02.jpg",
         group="Proverbs 3:5 Scripture Sweatpants carousel",
         alt="Proverbs 3:5 Scripture Sweatpants carousel slide: a close-up of the yellow sweatpants opened at the side zip to show the scripture print, with 'Wear Your Faith. Own Your Style.'"),

    # ---- Super Cashflow Developments (property/) ----
    dict(project="super-cashflow-developments", src=f"{PROPERTY}/1.jpg", out="licensed-rooming-house-sunbury.jpg",
         group="Sunbury listing carousel (opening slide)",
         alt="Listing carousel slide: a brick house with LICENSED ROOMING HOUSE in Sunbury in bold white type over a blue sky, and the Super Cashflow Developments logo."),
    dict(project="super-cashflow-developments", src=f"{PROPERTY}/1(1).jpg", out="nine-rooms-nine-incomes-01.jpg",
         group="Moe listing carousel",
         alt="Listing carousel slide 1 of 3: a new house behind a timber fence with the headline '9 ROOMS 9 INCOMES.' and the banner 'A purpose-built rooming house made for cashflow'."),
    dict(project="super-cashflow-developments", src=f"{PROPERTY}/2.jpg", out="nine-rooms-nine-incomes-02.jpg",
         group="Moe listing carousel",
         alt="Listing carousel slide 2 of 3: the house frontage with the headline 'APPROX. $154K GROSS INCOME PER YEAR' and the line 'Near-new, low-maintenance, and fully self-contained.'"),
    dict(project="super-cashflow-developments", src=f"{PROPERTY}/3.jpg", out="nine-rooms-nine-incomes-03.jpg",
         group="Moe listing carousel",
         alt="Listing carousel slide 3 of 3: the garage and driveway with the headline 'STRONG RENTAL DEMAND IN MOE.' and the list: each room has its own bathroom, kitchenette and courtyard."),
    dict(project="super-cashflow-developments", src=f"{PROPERTY}/Custom is Chaos. Stratos is Control.jpg",
         out="custom-is-chaos-stratos-is-control.jpg", group="Stratos static ads",
         alt="Ad with the headline 'CUSTOM IS CHAOS. STRATOS IS CONTROL.' over a dimmed interior, describing Stratos as a standardised 9-studio rooming house system, with a Discover Stratos button."),
    dict(project="super-cashflow-developments", src=f"{PROPERTY}/Custom builds drag, stratos moves.jpg",
         out="custom-builds-drag-stratos-moves.jpg", group="Stratos static ads",
         alt="Ad with the headline 'CUSTOM BUILDS DRAG. STRATOS MOVES.' and a diagonal orange banner about a standardised 9-studio system, over an aerial photo of houses, with a Get the Stratos Brief button."),
    dict(project="super-cashflow-developments", src=f"{PROPERTY}/One System, Faster Decisions.jpg",
         out="one-system-faster-decisions.jpg", group="Stratos static ads",
         alt="Ad with the headline 'ONE SYSTEM. FASTER DECISIONS.' over an aerial view of a suburb, with a Get the Stratos Brief button."),
    dict(project="super-cashflow-developments", src=f"{PROPERTY}/After August 10 it May Be Too Late.jpg",
         out="after-august-10-it-may-be-too-late.jpg", group="SMSF deadline static ads",
         alt="Ad with the headline 'AFTER AUGUST 10, IT MAY BE TOO LATE.' over a calendar page for August 2026, about the SMSF borrowing window closing, with a View Available Listing button."),
    dict(project="super-cashflow-developments", src=f"{PROPERTY}/Turn your Super into Super Cashflow.jpg",
         out="turn-your-super-into-super-cashflow.jpg", group="SMSF deadline static ads",
         alt="Ad with the headline 'TURN YOUR SUPER INTO SUPER CASHFLOW' over a dimmed newspaper page, offering operating rooming houses to eligible SMSF investors, with a View Available Listing button."),
    dict(project="super-cashflow-developments", src=f"{PROPERTY}/Your Retirement Needs More Than A Balance.jpg",
         out="your-retirement-needs-more-than-a-balance.jpg", group="SMSF deadline static ads",
         alt="Ad with the orange headline 'YOUR RETIREMENT NEEDS MORE THAN A BALANCE' on a dark background, about investing super in an income-producing rooming house, with a View Available Listing button."),
    dict(project="super-cashflow-developments", src=f"{PROPERTY}/Not Converted. Purpose-Built..jpg",
         out="not-converted-purpose-built.jpg", group="Listing static ads",
         alt="Ad with the headline 'NOT CONVERTED. PURPOSE-BUILT.' over a furnished bedroom, with the line 'Designed from the ground up for Rooming House living.' and a Book a call now! button."),
    dict(project="super-cashflow-developments", src=f"{PROPERTY}/9-Room Rooming House For Sale.jpg",
         out="nine-room-rooming-house-for-sale.jpg", group="Listing static ads",
         alt="Ad with the headline '9-ROOM ROOMING HOUSE FOR SALE' over a new house and driveway, 'Purpose-built specialist accommodation in Shepparton', with a Book a call now! button."),

    # ---- Riverdance RV Resort (services/) ----
    dict(project="riverdance-rv-resort", src=f"{SERVICES}/Angle 1.jpg", out="angle-1-live-where-others-vacation.jpg",
         group="Five-angle static set",
         alt="Green Riverdance RV Resort ad: 'LIVE WHERE OTHERS VACATION', private Eagle River frontage, monthly sites from $1,250/mo and a Book Now! button above a photo of red chairs by the river."),
    dict(project="riverdance-rv-resort", src=f"{SERVICES}/Angle 3.jpg", out="angle-3-the-longer-you-stay.jpg",
         group="Five-angle static set",
         alt="Cream Riverdance RV Resort ad: 'THE LONGER YOU STAY, THE LESS YOU PAY' above a photo of the resort building with its Riverdance sign, with 60+ day stays from $1,200/mo."),
    dict(project="riverdance-rv-resort", src=f"{SERVICES}/Angle 4.jpg", out="angle-4-your-office-the-eagle-river.jpg",
         group="Five-angle static set",
         alt="Riverdance RV Resort ad: 'YOUR OFFICE. THE EAGLE RIVER.' under a photo of the river and mountains, aimed at remote workers, with monthly sites from $1,250/mo."),
    dict(project="riverdance-rv-resort", src=f"{SERVICES}/Angle 5.jpg", out="angle-5-why-rent-in-vail.jpg",
         group="Five-angle static set",
         alt="Riverdance RV Resort ad: 'WHY RENT IN VAIL?' with a simple bar chart comparing Vail-area rent, hotels and condos, and riverside sites from $1,250."),
    dict(project="riverdance-rv-resort", src=f"{SERVICES}/Extended-Stay-Carousel_01.jpg", out="extended-stay-01.jpg",
         group="Extended-stay carousel",
         alt="Extended-stay carousel slide 1 of 5: an RV under string lights at dusk, the Riverdance RV Resort logo and 'WHAT IF HOME LOOKED LIKE THIS?'"),
    dict(project="riverdance-rv-resort", src=f"{SERVICES}/Extended-Stay-Carousel_02.jpg", out="extended-stay-02.jpg",
         group="Extended-stay carousel",
         alt="Extended-stay carousel slide 2 of 5: 'MOUNTAIN LIVING SHOULDN'T COST A FORTUNE' over a sunset river scene, with 'Hotels. Condos. Rent. The Vail Valley adds up fast.'"),
    dict(project="riverdance-rv-resort", src=f"{SERVICES}/Extended-Stay-Carousel_03.jpg", out="extended-stay-03.jpg",
         group="Extended-stay carousel",
         alt="Extended-stay carousel slide 3 of 5: 'EXTENDED STAY ON THE EAGLE RIVER from $1,250/mo' with full-hookup monthly sites, beside an angler holding a trout."),
    dict(project="riverdance-rv-resort", src=f"{SERVICES}/Extended-Stay-Carousel_04.jpg", out="extended-stay-04.jpg",
         group="Extended-stay carousel",
         alt="Extended-stay carousel slide 4 of 5: 'YOUR EVERYDAY LOOKS LIKE THIS' with a list of amenities (hookups, Wi-Fi, fenced dog area, laundry, river frontage) over a photo of an angler holding a trout."),
    dict(project="riverdance-rv-resort", src=f"{SERVICES}/Extended-Stay-Carousel_05.jpg", out="extended-stay-05.jpg",
         group="Extended-stay carousel",
         alt="Extended-stay carousel slide 5 of 5: an aerial view of the RV park with the Riverdance RV Resort logo, 'YOUR SITE IS WAITING' and a Book Now! button."),
    dict(project="riverdance-rv-resort", src=f"{SERVICES}/Mountain Recharge ($80).png", out="mountain-recharge.jpg",
         group="Seasonal $80 offers",
         alt="Riverdance RV Resort ad: 'THE $80 MOUNTAIN RECHARGE' over a dusk photo of RV sites with string lights, with copy about full hookups and private Eagle River access 30 minutes from Vail."),
    dict(project="riverdance-rv-resort", src=f"{SERVICES}/ONE MORE AUGUST ESCAPE.png", out="one-more-august-escape.jpg",
         group="Seasonal $80 offers",
         alt="Riverdance RV Resort ad: 'ONE MORE AUGUST ESCAPE' over red chairs on a riverside lawn, 'Select RV sites are still available', starts at $80/night, with a Book Your Stay button."),
    dict(project="riverdance-rv-resort", src=f"{SERVICES}/Vail Valley Adventure ($80).png", out="vail-valley-adventure.jpg",
         group="Seasonal $80 offers",
         alt="Riverdance RV Resort ad on a cream doodle background: 'VAIL VALLEY ADVENTURE WITHOUT VAIL PRICES' above a sunset photo of RVs, with $80/night copy and a Book Now! button."),

    # ---- Sabbath Spa CRM screenshots (crm/) ----
    dict(project="sabbath-spa", src="crm/SABBATH.png", out="crm-portal-home.jpg", group="CRM screenshots",
         crop=(90, 0, 1830, 908),
         caption="Cropped at the sides to remove a development-mode badge and the browser scrollbar.",
         alt="Sabbath Spa & Wellness Hub Digital Operations Portal: the Sabbath logo above five cards for Book a Session, Digital Waiver, Membership, Sabasu and Staff Portal."),
    dict(project="sabbath-spa", src="crm/SABBATH1.png", out="crm-bookings-ledger.jpg", group="CRM screenshots",
         obscure=[(437, 665, 1822, 876), (16, 790, 330, 870)], crop=(0, 18, 1900, 876),
         caption="Booking rows (customer, therapist, date, service, amount, payment, type) and the signed-in account are blurred; the browser bookmarks bar is cropped off.",
         alt="Bookings Ledger screen of the Sabbath spa CRM: sidebar navigation, branch tabs, search box, category tabs and the table headings; the booking rows and the signed-in account are blurred."),

    # ---- Rooming House Expert Meta campaign (campaigns/) ----
    dict(project="rooming-house-expert-campaign", src="campaigns/Screenshot of the winning Ad.png",
         out="ads-manager-ad-preview.jpg", group="Ads Manager",
         fill=[((250, 616, 658, 806), (255, 255, 255))], crop=(238, 166, 1204, 870),
         caption="Cropped from an Ads Manager screenshot: campaign, ad set and ad names and an in-editor Meta suggestion were removed.",
         alt="Meta Ads Manager ad editor: placements and the instant-form action 'Book Free Strategy Call' on the left, and a feed preview of the RoomingHouse.Expert ad on the right reading '8 Rooms. $2,200/week! Convert Your Property Into a Rooming House! Download The Guide Here!'"),
    dict(project="rooming-house-expert-campaign", src="campaigns/Screenshot of the winning Ad.png",
         out="ad-preview-card.jpg", group="Ads Manager", crop=(690, 383, 930, 800),
         alt="Feed preview of the RoomingHouse.Expert ad: an illustrated man in front of a house with '8 Rooms. $2,200/week! Convert Your Property Into a Rooming House! Download The Guide Here!', the primary text 'Turn 1 Property into 2-3x Rental Income - See If Yours Qualifies!', the headline 'Convert. Rent. Repeat.' and a Sign up button."),

    # ---- Portrait ----
    dict(project="profile", src="PORTRAIT", out="ehjay-lorenzo.jpg", alt="Portrait of Ehjay Lorenzo"),
]

# --------------------------------------------------------------------------------------------
# Videos. Social: 720x1280, two-pass H.264, muted. Web: 1280 wide, CRF, audio stripped.
# blur: static boxes (source px) during a window. tracked: boxes that follow a scrolling page,
# given in content coordinates (after `crop`) at time ref_t. cuts: source time ranges removed.
# poster_t is in the output timeline.
# --------------------------------------------------------------------------------------------
GUIDE_EMAIL_BOX = (560, 1235, 800, 1360)   # e-mail in the footer of the free-guide mock-up

VIDEOS = [
    # ---- Honey Tribe ----
    dict(key="janet", project="honey-tribe", out="janet-jumper.mp4", kind="social", aspect="9:16",
         src=f"{HT_VIDEOS}/Janet Jumper Revised 2.mp4", duplicates=["clothing/Janet Jumper Revised 2.mp4"],
         poster_t=36.0, title="Janet Jumper",
         description="Vertical product video: a model in Honey Tribe's army-green Janet Jumper (a wide-leg jumpsuit with striped tie suspenders) in an arched, plant-filled set, with captions on the relaxed fit, adjustable suspenders, pockets and convertible ankles. Ends on a Honey Tribe 'Shop Now' card with shophoneytribe.com."),
    dict(key="milo", project="honey-tribe", out="milo-tassel-kimono.mp4", kind="social", aspect="9:16",
         src=f"{HT_VIDEOS}/Milo Tassel Kimono.mp4", duplicates=["clothing/Milo Tassel Kimono.mp4"],
         poster_t=39.0, title="Milo Tassel Kimono",
         description="Vertical product video: a model styles the pink colour-block Milo Tassel Kimono with cream tassels, with bold word-by-word captions about layering it over different outfits. Ends on a Honey Tribe end card."),
    dict(key="knox", project="honey-tribe", out="knox-tassel-kimono.mp4", kind="social", aspect="9:16",
         src=f"{HT_VIDEOS}/Knox Tassel Kimono .mp4",
         poster_t=36.0, title="Knox Tassel Kimono",
         description="Vertical product video: the green, yellow and tan Knox Tassel Kimono worn in a sunlit room, with serif captions such as 'easy to layer and designed to move with you'. Ends on a Honey Tribe end card."),
    dict(key="proverbs", project="honey-tribe", out="proverbs-3-5-scripture-sweatpants.mp4", kind="social", aspect="9:16",
         src=f"{HT_VIDEOS}/Proverbs 3_5 Revised.mp4", duplicates=["clothing/Proverbs 3_5 Revised.mp4"],
         poster_t=3.0, title="Proverbs 3:5 Scripture Sweatpants",
         description="Vertical product video: yellow wide-leg sweatpants whose side zip opens to a Proverbs 3:5 scripture print, with captions on the stretch waist, pockets, zippers and inseam. Ends on a Honey Tribe end card."),

    # ---- Riverdance RV Resort ----
    dict(key="notjustparking", project="riverdance-rv-resort", out="not-just-parking.mp4", kind="social", aspect="9:16",
         src=f"{HT_VIDEOS}/Not just parking. A full RV getaway..mp4",
         duplicates=[f"{SC_VIDEOS}/Not just parking. A full RV getaway..mp4"],
         poster_t=6.0, title="Not just parking. A full RV getaway.",
         description="Vertical promo: the Eagle River, aerial views and RV sites with captions such as 'Wake up to the calm of the Eagle River.', then an offer card with nightly and weekly rates and the Riverdance RV Resort logo."),
    dict(key="park", project="riverdance-rv-resort", out="place-to-park.mp4", kind="social", aspect="9:16",
         src=f"{HT_VIDEOS}/Park .mp4",
         poster_t=22.0, title="A place to park your RV",
         description="Vertical drone video of Riverdance RV Resort in Gypsum, Colorado: canyon, river, RV rows and cabins, with hand-lettered captions ('Looking for a place to park your RV?', 'Your home base in Gypsum Colorado'), a Book Now! button and the resort logo."),

    # ---- Rooming House Expert video ads (found in the Super Cashflow folder) ----
    dict(key="angle1", project="rooming-house-expert-campaign", out="angle-1.mp4", kind="social", aspect="9:16",
         src=f"{SC_VIDEOS}/Angle 1.mp4", blur=[dict(box=GUIDE_EMAIL_BOX, window=(48.5, 53.7))],
         poster_t=3.0, title="Angle 1: the weekly rent figure",
         description="Vertical talking-head ad for Rooming House Expert: a presenter explains that a big weekly rent figure isn't the number that matters, with captions, a floor-plan animation and a mock-up of the free 'Ultimate Rooming House Conversion Guide'. Ends on the Rooming House Expert logo. The e-mail address on the guide mock-up is blurred."),
    dict(key="angle2", project="rooming-house-expert-campaign", out="angle-2.mp4", kind="social", aspect="9:16",
         src=f"{SC_VIDEOS}/Angle 2.mp4", blur=[dict(box=GUIDE_EMAIL_BOX, window=(45.3, 49.3))],
         poster_t=3.0, title="Angle 2: more rent isn't a better investment",
         description="Vertical talking-head ad for Rooming House Expert: 'more rent does not automatically mean better investment', with captions, b-roll (paperwork, a route map, a calculator), the free guide mock-up and the Rooming House Expert logo. The e-mail address on the guide mock-up is blurred."),
    dict(key="angle3", project="rooming-house-expert-campaign", out="angle-3.mp4", kind="social", aspect="9:16",
         src=f"{SC_VIDEOS}/Angle 3.mp4", blur=[dict(box=GUIDE_EMAIL_BOX, window=(44.9, 48.4))],
         poster_t=3.0, title="Angle 3: what is actually left",
         description="Vertical talking-head ad for Rooming House Expert: what is left after costs decides whether a rooming house strategy works, with animated icons (layout, demand, management, vacancy, compliance, expenses), the free guide mock-up and the Rooming House Expert logo. The e-mail address on the guide mock-up is blurred."),

    # ---- Super Cashflow Developments ----
    dict(key="custom", project="super-cashflow-developments", out="custom-is-chaos-stratos-is-control.mp4", kind="social",
         aspect="9:16", src=f"{SC_VIDEOS}/Custom is Chaos Stratos is Control .mp4",
         poster_t=74.0, title="Custom Is Chaos, Stratos Is Control",
         description="Vertical talking-head video: a presenter in a rounded frame with orange-highlighted captions contrasts custom builds with the standardised 9-studio Stratos rooming house system, cut with stock b-roll of plans, builders and paperwork, a 'Custom Is Chaos / The Stratos Is Control' title card and the Super Cashflow Developments logo."),
    dict(key="stop", project="super-cashflow-developments", out="stop-treating-rooming-houses-like-normal-houses.mp4",
         kind="social", aspect="9:16", src=f"{SC_VIDEOS}/Stop treating rooming houses like normal houses.mp4",
         poster_t=50.0, title="Stop treating rooming houses like normal houses",
         description="Vertical talking-head video: opens on 'this is why most rooming house projects fall apart', then covers Class 1B requirements (access, fire separation, ventilation, soundproofing) with stock b-roll and listing photos ('6 bedrooms, multiple bathrooms, professionally managed'). Ends on the Super Cashflow Developments logo."),
    dict(key="income", project="super-cashflow-developments", out="the-income-is-obvious-the-process-is-the-problem.mp4",
         kind="social", aspect="9:16", src=f"{SC_VIDEOS}/The income is obvious the process is the problem.mp4",
         poster_t=10.0, title="The income is obvious, the process is the problem",
         description="Vertical talking-head video: the presenter argues that rooming-house income is easy to see but the process (council permits, builders, compliance) is where projects stall, and introduces the Stratos system, with stock b-roll. Ends on the Super Cashflow Developments logo."),

    # ---- Website screen recordings ----
    dict(key="hydrate", project="hydrate-medbar", out="website.mp4", kind="web",
         src="website/HydRateMedbar.mp4", crop=(0, 0, 1902, 870), crf=28,
         track_band=(100, 127, 1880, 866), clip_top=122,
         tracked=[
             # testimonial attribution (customer name + treatment), page section around 10.6-14.3 s
             dict(window=(10.6, 14.3), ref_t=12.0, box=(850, 497, 1100, 575)),
             # footer contact column (street address, e-mail, phone)
             dict(window=(10.6, 14.3), ref_t=13.6, box=(1390, 317, 1775, 487)),
         ],
         static=[
             # fast scroll back to the top passes the contact column and a second testimonial
             dict(window=(17.45, 17.86), box=(840, 122, 1902, 870)),
         ],
         poster_t=3.0, title="HydRate Medbar website",
         description="Screen recording of the HydRate Medbar website: the 'Elevated Beauty & Wellness' hero (Long Island City, NY), a logo loader, 'Where Science Meets Serenity', the treatment cards (Botox & Fillers, IV Drip Therapy, Laser Hair Removal, Microneedling), a testimonial and the footer. Testimonial names and the footer contact details are blurred; browser scrollbar cropped."),
    dict(key="latte", project="latte-with-lata", out="website.mp4", kind="web",
         src="website/LATTEWITHLATA.mp4", crop=(0, 110, 1902, 1020), crf=28,
         # 29.05-30.52 s: a "Visit" card (street address, phone), then a fast scroll into the footer.
         cuts=[(29.05, 30.52)],
         static=[
             # settled footer: "Find us" block (street address, phone, e-mail); content coordinates
             dict(window=(30.52, 99.0), box=(495, 240, 760, 460)),
         ],
         poster_t=2.0, title="Latte with Lata website",
         description="Screen recording of the Latte with Lata website (a cafe and podcast): the kinetic 'LATTE WITH LATA' hero, a page reload with its letter-reveal intro, cafe and menu sections, episode cards, the host section and the footer. Browser tabs and address bar cropped; a 'Visit' card with the street address is cut, and the footer address, phone and e-mail are blurred."),
    dict(key="rhe", project="rooming-house-expert", out="website.mp4", kind="web",
         src="website/RoomingHouseExpert.mp4", crop=(0, 0, 1902, 874), crf=28,
         cuts=[(15.65, 23.05), (25.95, 26.32)],
         poster_t=4.0, title="Rooming House Expert website",
         description="Screen recording of the Rooming House Expert website: 'The Future of Investing' hero, the father-and-son founders section, company stats, featured properties, the 'Think your property might work as a Rooming House?' call to action and the footer. The client-stories section (investor names and income figures) is cut out."),
    dict(key="sabbathweb", project="sabbath-spa", out="website.mp4", kind="web",
         src="website/Sabbathspa.mp4", crop=(0, 0, 1902, 862), crf=28,
         poster_t=4.0, title="Sabbath Spa & Wellness Hub website",
         description="Screen recording of the Sabbath Spa & Wellness Hub website: the 'Embrace the Gift of Rest' hero with a tilted photo collage, a logo loader, 'Welcome to the Sanctuary of Grace' with photos of the spa's signage, the services line, a massage carousel and the footer."),
]

# --------------------------------------------------------------------------------------------
# Everything left out, with the reason. (Duplicates of encoded videos are listed in VIDEOS.)
# --------------------------------------------------------------------------------------------
QR = "QR-code-only end card."
EXCLUDED = [
    # Honey Tribe
    dict(source="clothing/2.jpg", reason="Beaujo colourway slide (gold): the same layout repeats for each finish; the opening slide shows all four finishes."),
    dict(source="clothing/3.jpg", reason="Beaujo colourway slide (rose gold): same layout as the other colourway slides; the opening slide is kept."),
    dict(source="clothing/4.jpg", reason="Beaujo colourway slide (silver): same layout as the other colourway slides; the opening slide is kept."),
    dict(source="clothing/5.jpg", reason="Beaujo colourway slide (black): same layout as the other colourway slides; the opening slide is kept."),
    dict(source="clothing/6.jpg", reason=QR),
    dict(source="clothing/1(1).jpg", reason="Olive Denim Palazzo poster: same poster layout as the pink version (kept); the olive colourway is shown through its collage slide."),
    dict(source="clothing/2(2).jpg", reason="Pink Denim Palazzo collage slide: same collage layout as the olive version (kept)."),
    dict(source="clothing/3(1).jpg", reason=QR),
    dict(source="clothing/3(2).jpg", reason=QR + " (Its label repeats the olive product name on the pink set.)"),
    dict(source="clothing/Bjorn-Cuff_03.jpg", reason=QR),
    dict(source="clothing/Janet-Jumper-Static_02.jpg", reason="Same layout as Janet Jumper in Black slide 2 (kept); the olive colourway is shown through its opening slide."),
    dict(source="clothing/Janet-Jumper-Static_03.jpg", reason=QR),
    dict(source="clothing/Janet-Jumper-in-Black_01.jpg", reason="Same layout as the Janet Jumper opening slide (kept)."),
    dict(source="clothing/Janet-Jumper-in-Black_03.jpg", reason=QR),
    dict(source="clothing/Nysa-Shell-Bracelet_02.jpg", reason="Curation: the set is represented by its opening slide (about a dozen pieces per client)."),
    dict(source="clothing/Nysa-Shell-Bracelet_03.jpg", reason=QR),
    dict(source="clothing/Nysa Shell Bracelet.jpg", reason="Preview strip (3240x1350) made of the three Nysa slides: duplicate."),
    dict(source="clothing/Obi-Mask-Bangle_02.jpg", reason="Curation: the set is represented by its opening slide (about a dozen pieces per client)."),
    dict(source="clothing/Obi-Mask-Bangle_03.jpg", reason=QR),
    dict(source="clothing/Proversb-SweatPants_03.jpg", reason=QR),
    # Super Cashflow Developments
    dict(source=f"{PROPERTY}/1(2).jpg", reason="Shows a street address (Shepparton listing)."),
    dict(source=f"{PROPERTY}/2(3).jpg", reason="Slide 2 of the Shepparton carousel, whose opening slide shows a street address; left out with its set (same layout family as the Moe carousel, kept)."),
    dict(source=f"{PROPERTY}/3(3).jpg", reason="Slide 3 of the Shepparton carousel, whose opening slide shows a street address; left out with its set."),
    dict(source=f"{PROPERTY}/1(3).jpg", reason="Shows a street address (Warragul listing; the address runs across slides 1 and 2)."),
    dict(source=f"{PROPERTY}/2(2).jpg", reason="Shows the end of a street address (Warragul listing)."),
    dict(source=f"{PROPERTY}/3(2).jpg", reason="Slide 3 of the Warragul carousel, whose first two slides show a street address; left out with its set."),
    dict(source=f"{PROPERTY}/[file name withheld: a street address] Shepparton.jpg",
         reason="Preview strip (3240x1350) of the Shepparton carousel: duplicate, and it shows a street address (so does its file name, withheld here)."),
    dict(source=f"{PROPERTY}/2(1).jpg", reason="Slide 2 of the Sunbury carousel: same template as the Moe carousel (kept in full); the Sunbury opening slide is kept."),
    dict(source=f"{PROPERTY}/3(1).jpg", reason="Slide 3 of the Sunbury carousel: same template as the Moe carousel (kept in full)."),
    dict(source=f"{PROPERTY}/Guesswork Delays, Stratos Controls.jpg", reason="Near-duplicate of 'One System, Faster Decisions' (same aerial photo and layout)."),
    dict(source=f"{PROPERTY}/Limited Rooming Houses Available Before the Deadline.jpg", reason="Same SMSF-deadline message as the ads kept; its newspaper background also shows a third-party byline."),
    dict(source=f"{PROPERTY}/Private Ensuite + Kitchenette.jpg", reason="Near-duplicate of 'Not Converted. Purpose-Built.' (same bedroom-photo layout)."),
    dict(source=f"{PROPERTY}/A Cashflow-Focused Asset.jpg", reason="Same interior-photo layout as 'Not Converted. Purpose-Built.' (kept)."),
    # Riverdance RV Resort
    dict(source=f"{SERVICES}/Angle 2.jpg", reason="Same template as Angle 1 in a cream colourway; Angle 1 is kept."),
    dict(source=f"{SERVICES}/Mountain Recharge.jpg", reason="$85 variant of the Mountain Recharge ad; the $80 version is kept (it matches the price on the other two seasonal promos)."),
    # Sabbath Spa
    dict(source="crm/Sabbath-Spa-CRM-Dashboard-Demo.mp4",
         reason="Customer names, phone numbers, declared health conditions, signatures, visit histories, amounts and revenue totals appear in scrolling tables and pop-ups for most of its 137 seconds, so it cannot be cleaned reliably. Its title card says 'sample data', but that cannot be verified."),
    # Campaign report
    dict(source="campaigns/URHCG_Campaign_Dashboard_Aug1-Sep1_2026.xlsx",
         reason="Campaign report full of client business figures (spend, leads and the like); no written permission (no notes.txt). Not opened for publication and no figure from it is used."),
    # Portrait
    dict(source="photo/ehjay.jpeg", reason="A different, smaller photo (420x525); the approved 768x1024 portrait is used instead."),
]

# --------------------------------------------------------------------------------------------
# Facts recorded in the manifest
# --------------------------------------------------------------------------------------------
FACTS = {
    "brandSpellings": {
        "honey-tribe": "Logo wordmark 'HoneyTribe' (one word, tagline 'Bold Prints. Modern Cuts.'); 'Honey Tribe' (two words) in captions and on end cards ('Everything Honey Tribe'); shop domain shophoneytribe.com.",
        "riverdance-rv-resort": "Logo 'Riverdance' (script) + 'RV RESORT', 'Gypsum, CO'; one video's captions write 'River Dance' as two words.",
        "super-cashflow-developments": "Logo 'SUPER CASHFLOW DEVELOPMENTS'; source folder spelled 'Super Cahsflow'. Product system 'Stratos'; the captions of 'The income is obvious...' also spell it 'Stratus'.",
        "rooming-house-expert": "'Rooming House Expert' (website and logo); Facebook page name 'RoomingHouse.Expert'; domain roominghouse.expert.",
        "hydrate-medbar": "'HydRate Medbar' (capital R), monogram logo 'HR', footer '(c) 2026 HYDRATE MEDBAR'.",
        "latte-with-lata": "'Latte with Lata' (headings in capitals: 'LATTE WITH LATA'), line 'Real Conversations. Built on Purpose.'",
        "sabbath-spa": "'Sabbath Spa & Wellness Hub' (logo 'SABBATH - SPA & WELLNESS HUB'); in-house cafe brand 'Sabasu'.",
    },
    "liveUrls": {
        "latte-with-lata": {"url": "addbp.github.io/latewlatta01/", "seenIn": "browser address bar in the website recording (cropped out of the published video)", "verified": False},
        "honey-tribe": {"url": "www.shophoneytribe.com", "seenIn": "video end cards and the Denim Palazzo posters", "verified": False},
        "rooming-house-expert": {"url": "www.roominghouse.expert", "seenIn": "footer of the free-guide mock-up in the Angle 1-3 videos; page name in the ad preview", "verified": False},
    },
    "notes": [
        "No live URL is visible in the HydRate Medbar, Sabbath Spa and Rooming House Expert recordings (they show only the page, without the browser's address bar).",
        "Exact duplicates (md5): three Honey Tribe videos exist in both clothing/ and the Riverdance & HoneyTribe video folder; 'Not just parking. A full RV getaway.' (a Riverdance video) also sits in the Super Cashflow video folder. Each is encoded once.",
        "Angle 1-3 were in the Super Cashflow video folder but are Rooming House Expert ads (Rooming House Expert logo end card; they promote a free downloadable guide, as does the ad in the Ads Manager screenshot), so they are filed under rooming-house-expert-campaign. Whether they ran in that campaign is not recorded.",
        "All social videos are muted: no note confirms that the music is licensed or original.",
        "The Latte with Lata footer carries a 'SITE BY ...' credit naming a web studio: confirm who built it before presenting it as his build.",
        "The Latte with Lata contact details look like placeholders (a 555-prefix phone number and an e-mail on the reserved .example domain), which suggests a demo or spec site; they are blurred anyway. Confirm before labelling it client work.",
        "The Honey Tribe sweatpants images are named 'Proversb-SweatPants' in the source (typo); output names use 'proverbs'.",
        "Advertised offer prices and yields inside the ads (nightly or monthly rates, approximate gross income) are ad copy and left as is; no client business figure is quoted anywhere.",
    ],
}
