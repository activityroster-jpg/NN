// Practical charter know-how: the guides next to the destination guides on
// /cruising. Plain data, rendered by app/[locale]/cruising/how-to/[id].
// Facts that differ by country or operator are written as such; the base's
// briefing and the charter contract always win.

export interface HowToSection {
  heading: string;
  text?: string[];
  /** Plain bullet list. */
  list?: string[];
  /** Tick-box list (printable). */
  checklist?: string[];
  table?: { head: string[]; rows: string[][] };
  tip?: string;
}

export type HowToSeries = "before" | "aboard" | "weather" | "care";

export const SERIES: { id: HowToSeries; title: string; blurb: string }[] = [
  { id: "before", title: "Before you go", blurb: "Licences, packing and provisioning." },
  { id: "aboard", title: "Aboard", blurb: "Taking over the boat, living on it and handing it back." },
  { id: "weather", title: "Weather", blurb: "Forecasts, the Mediterranean's winds, squalls and a safe night at anchor." },
  { id: "care", title: "Yacht care and maintenance", blurb: "Daily checks and what to do when something goes wrong." },
];

export interface HowToGuide {
  id: string;
  series: HowToSeries;
  title: string;
  /** One line for cards and search results. */
  summary: string;
  minutes: number;
  intro: string;
  sections: HowToSection[];
  /** Related lessons and pages on this site (paths without the locale). */
  related?: { label: string; path: string }[];
}

const COURSE = "/learn/navigation";

export const HOWTO: readonly HowToGuide[] = [
  {
    id: "provisioning-for-a-week",
    series: "before",
    title: "How to provision a yacht for a week",
    summary: "What to buy, how much, where to shop and how to stow it, for a crew of four to ten.",
    minutes: 6,
    intro:
      "Good provisioning means fewer trips ashore for the basics and more time where you want to be. The trick is to plan meals, not shopping: decide which meals you will eat aboard, buy for those, and leave room for the fresh food and the restaurants you find along the way.",
    sections: [
      {
        heading: "Plan the meals first",
        text: [
          "Most crews eat breakfast and lunch aboard every day and dinner aboard three or four nights out of seven, eating ashore on the others. Write the week down as a grid of 7 breakfasts, 7 lunches and the dinners you will cook, then shop for that grid.",
          "Keep cooking simple: the galley is small, it moves, and the cook wants to swim too. One-pot dinners, big salads, pasta, grilled fish and barbecue (many catamarans have a grill) work well.",
        ],
      },
      {
        heading: "How much: a starting point per person for the week",
        table: {
          head: ["Item", "Per person, 7 days", "Notes"],
          rows: [
            ["Drinking water", "15–20 litres", "Bottled; tank water is for washing unless the base says it is drinkable"],
            ["Bread, wraps, crackers", "Buy for 2–3 days at a time", "Bakeries in most ports; crackers keep"],
            ["Eggs", "6–8", "Keep in the box, out of the sun"],
            ["Fruit", "10–14 pieces", "Apples, oranges and melons last; soft fruit within two days"],
            ["Vegetables and salad", "2–3 kg", "Tomatoes, cucumbers, peppers, onions, potatoes keep best"],
            ["Pasta, rice, couscous", "500–700 g", "Quick, light, stores anywhere"],
            ["Cheese, cured meat, yoghurt", "1–1.5 kg in all", "Fridge space is the limit, not appetite"],
            ["Coffee and tea", "Coffee 100–150 g", "Check the coffee maker aboard: often a moka pot or plunger"],
            ["Soft drinks, beer, wine", "To taste", "Cans and boxes stow better than glass; glass breaks in a seaway"],
          ],
        },
        tip: "Buy the heavy, long-life basics on day one and the fresh food every two or three days. Fridges on charter boats are small and run off the batteries.",
      },
      {
        heading: "Where to shop",
        list: [
          "A supermarket near the base on embarkation day for the long-life basics: water, drinks, pasta, rice, oil, coffee, cleaning things.",
          "Provisioning delivery: most bases and some agencies take an order in advance and deliver to the boat. It saves the first afternoon; prices are usually a little higher.",
          "Local markets and bakeries along the route for bread, fruit, vegetables and fish: often the best food of the week.",
          "Small island shops are expensive and close early or for lunch. Do not count on them for the basics.",
        ],
      },
      {
        heading: "Stowing it so it survives the sail",
        list: [
          "Heaviest items low and near the middle of the boat: water and drink packs under the saloon seats or floor.",
          "Nothing loose on the counters when you sail. Wedge bottles with towels; close every locker and the fridge lid.",
          "Fridge: drinks at the bottom, food on top. Open it as little as possible; it uses a lot of battery.",
          "Remove cardboard packaging before stowing it: it brings in insects and gets soggy.",
          "Rubbish goes ashore at every port. Take bags for recycling where the port separates it.",
        ],
      },
      {
        heading: "Easy to forget",
        checklist: [
          "Matches or a lighter for the gas stove",
          "Salt, pepper, oil, vinegar, a few spices",
          "Washing-up liquid, sponges, kitchen roll, bin bags",
          "Toilet paper (marine toilets need thin, quick-dissolving paper)",
          "Foil, cling film, zip bags, a cool bag for the beach",
          "Bottle opener and corkscrew (check the galley kit first)",
          "Ice for the first day if the fridge is still cooling down",
        ],
      },
    ],
    related: [
      { label: "Living aboard: water, power, the heads and gas", path: "/cruising/how-to/living-aboard" },
      { label: "What to pack for a charter week", path: "/cruising/how-to/what-to-pack" },
    ],
  },
  {
    id: "yacht-check-in",
    series: "aboard",
    title: "How to do the yacht check-in (handover)",
    summary: "The checklist for taking over the boat: paperwork, damage, engine, sails, safety gear and the questions to ask.",
    minutes: 8,
    intro:
      "The check-in, or handover, is when the base shows you the boat and you sign that you received it in the stated condition. It is the most important hour of the week for your deposit: anything you do not spot and note now may be charged to you at check-out. Take your time, take photos, and ask every question.",
    sections: [
      {
        heading: "Paperwork at the base office",
        checklist: [
          "Charter contract and the crew list (names, passport numbers), as the base requires",
          "Skipper's licence, and a VHF radio certificate where it is needed (originals)",
          "Security deposit, or the damage-waiver insurance if you bought it",
          "Cruising tax or transit log, where the country requires one",
          "The base's phone number for breakdowns, and the hours someone answers",
        ],
      },
      {
        heading: "Walk round the hull and deck, with photos",
        text: [
          "Walk round the boat with the base staff and photograph or film anything that is already scratched, chipped or broken: the hull, the topsides, the swim platform, the deck and the dinghy. Make sure every mark is written on the check-in form before you sign it.",
        ],
        checklist: [
          "Hull and topsides: scratches, chips, repairs",
          "Deck, hatches and windows: cracks, leaks",
          "Swim platform, ladder and bathing ladder",
          "Fenders and mooring lines: enough of them, in good condition",
          "Dinghy: no leaks, oars, pump, the outboard starts and the fuel tank is full",
          "Bimini, sprayhood and cushions",
        ],
      },
      {
        heading: "Sails and rigging",
        checklist: [
          "Unroll the headsail and roll it away again: no tears, the furling line runs freely",
          "Mainsail out and in (in-mast furling) or up and down (lazy bag): no tears, battens in place",
          "Sheets, halyards and reefing lines lead correctly; winch handles aboard (usually two or more)",
          "Look up at the rigging: nothing loose or bent",
        ],
      },
      {
        heading: "Engine, fuel and electrics",
        checklist: [
          "Engine oil and coolant levels, fan belt tight",
          "Start the engine: cooling water comes out of the exhaust",
          "Fuel: the tank is full (ask how the gauge reads full) and note the engine hours",
          "Batteries charged; you know where the battery switches are",
          "Shore power cable and the right adaptor for the marinas you will use",
          "Generator and inverter, if fitted: how to start them and what they can run",
        ],
      },
      {
        heading: "Water, heads and gas",
        checklist: [
          "Water tanks full; the water pump and hot water work",
          "Every toilet pumps properly, and you know how the holding-tank valve works",
          "Gas bottle connected and a full spare aboard; you know where the shut-off valve is",
          "Fridge cold; cooker and oven light",
        ],
      },
      {
        heading: "Safety equipment",
        checklist: [
          "Lifejackets for everyone, in the right sizes (children's sizes if needed), and harnesses",
          "Liferaft: in date, and you know how to launch it",
          "Flares: in date, and where they are",
          "Fire extinguishers and fire blanket, and where they are",
          "First-aid kit",
          "Bilge pumps, electric and manual; the manual pump handle is aboard",
          "Man-overboard equipment: lifebuoy, light, throwing line",
          "Emergency tiller and how to fit it",
          "VHF radio works (do a radio check with the base)",
        ],
      },
      {
        heading: "Navigation and anchoring",
        checklist: [
          "Chartplotter, depth and wind instruments work; autopilot engages",
          "Paper charts or a pilot book for the area, as the base provides",
          "Anchor windlass: lower and raise a few metres of chain; the remote works",
          "How much chain there is and how it is marked",
        ],
      },
      {
        heading: "Questions to ask the base",
        list: [
          "When and where do we return the boat, and when is check-out?",
          "Are there areas we must not go to, or anchorages with restrictions or fees?",
          "Where are the nearest fuel stations and which marinas do you recommend?",
          "What is the fuel policy: return it full, or pay for what we used?",
          "Who do we call if something breaks, and what can we fix ourselves?",
          "Is the tank water drinkable?",
        ],
        tip: "Sign the check-in form only when every existing mark is written on it. If something important does not work, ask the base to fix or replace it before you leave: it is much harder from an anchorage on Wednesday.",
      },
    ],
    related: [
      { label: "Check-out and getting your deposit back", path: "/cruising/how-to/yacht-check-out" },
      { label: "Navigating on a charter: what the skipper does", path: `${COURSE}/navigating-on-a-charter` },
      { label: "Anchoring and mooring buoys", path: `${COURSE}/anchoring-and-mooring` },
    ],
  },
  {
    id: "yacht-check-out",
    series: "aboard",
    title: "Check-out: returning the yacht and getting your deposit back",
    summary: "How the last day works: refuelling, the return time, the inspection and the deposit.",
    minutes: 4,
    intro:
      "Most charters return to base the evening before the last day and hand the boat over the next morning. A calm check-out comes down to three things: be back on time, return the boat as you received it, and report anything that broke during the week.",
    sections: [
      {
        heading: "The day before",
        list: [
          "Check your contract for the return time. In the Mediterranean the boat is usually due back in the base marina on Friday afternoon or evening, with check-out on Saturday morning.",
          "Refuel on the way back if the contract asks for a full tank. Fuel docks near busy bases have queues on Friday afternoon: go early.",
          "Empty the holding tanks where it is allowed, or at a pump-out station.",
          "Plan for the wind: a late Friday beat into a strong breeze is how boats get damaged on the last day.",
        ],
      },
      {
        heading: "The inspection",
        list: [
          "Base staff check the boat against the check-in form: hull, deck, sails, dinghy, engine and inventory.",
          "Many bases send a diver to look at the keel, rudder and propeller. A grounding is easy to see from underwater, so report it yourself.",
          "Report anything that broke or went missing, honestly. Damage reported early is usually handled better than damage found later.",
          "Take your own photos of the boat as you leave it.",
        ],
      },
      {
        heading: "Cleaning and packing up",
        checklist: [
          "Empty the fridge and take your food and rubbish ashore",
          "Strip the beds if the base asks; leave the linen on board",
          "Wash up and leave the galley tidy (the final clean is usually in the start pack)",
          "Check every locker and cabin for your belongings: chargers, sunglasses, passports",
        ],
      },
      {
        heading: "The deposit",
        text: [
          "If nothing is wrong, the base signs the check-out and releases the deposit. A deposit taken as a hold on a card can take several days to disappear from the statement, depending on the bank.",
          "If there is damage, the base deducts the repair cost, up to the deposit, or claims it under the damage-waiver insurance if you bought it. Ask for the deduction in writing.",
        ],
      },
    ],
    related: [{ label: "The yacht check-in (handover)", path: "/cruising/how-to/yacht-check-in" }],
  },
  {
    id: "what-to-pack",
    series: "before",
    title: "What to pack for a charter week",
    summary: "Soft bags, the right shoes, sun and wind protection and the small things that make the week easier.",
    minutes: 4,
    intro: "Space aboard is tight and lockers are small, so pack light, in soft bags, and bring the few things that matter at sea.",
    sections: [
      {
        heading: "Bags",
        text: ["Soft, foldable bags only. Hard suitcases do not fit in the lockers and there is nowhere to put them during the week."],
      },
      {
        heading: "Clothes",
        checklist: [
          "Swimwear (two sets: one is always wet)",
          "Light, long-sleeved tops and trousers for sun protection",
          "A warm layer and a windproof jacket: evenings at sea are cooler than ashore",
          "Non-marking shoes with pale soles for the deck, and sandals for ashore",
          "Something smart-casual for dinners ashore",
        ],
      },
      {
        heading: "Sun and sea",
        checklist: [
          "Reef-safe sunscreen, high factor",
          "Hat with a strap or clip, and polarised sunglasses with a cord",
          "Seasickness tablets or bands (start them before you need them)",
          "Snorkel and mask (some boats have them; your own fit better)",
          "Beach towels: bed linen and bath towels are often provided, beach towels often not",
        ],
      },
      {
        heading: "Small things that help",
        checklist: [
          "Head torch for the cabin and the dinghy at night",
          "Phone in a waterproof pouch; a power bank",
          "12V (car-socket) USB charger: not every boat has 230V sockets away from the marina",
          "Reusable water bottles",
          "Personal medicines and a small first-aid kit",
          "Some cash: small harbours, mooring buoys and island shops do not all take cards",
        ],
      },
      {
        heading: "Documents",
        checklist: [
          "Passports or ID cards for everyone on the crew list",
          "Skipper's licence and VHF certificate (originals), if you are skippering",
          "Charter contract, travel insurance details and the base's phone number",
        ],
      },
    ],
    related: [
      { label: "How to provision a yacht for a week", path: "/cruising/how-to/provisioning-for-a-week" },
      { label: "Licences and paperwork", path: "/cruising/how-to/licences-and-paperwork" },
    ],
  },
  {
    id: "living-aboard",
    series: "aboard",
    title: "Living aboard: water, power, the heads and gas",
    summary: "How a charter yacht's water, batteries, toilets and gas work, and how to make them last the week.",
    minutes: 6,
    intro:
      "A yacht is a small, self-contained home. Water and power are limited between marinas, the toilets work differently from home, and the gas needs a little care. Ten minutes understanding the systems saves a lot of trouble.",
    sections: [
      {
        heading: "Water",
        list: [
          "Charter yachts carry a few hundred litres of water (catamarans more than monohulls). With a full crew that can run out in two or three days.",
          "Short showers, the tap off while soaping, washing up in a bowl, and a rinse with the deck shower after swimming rather than a full shower.",
          "Fill up at every marina or town quay that has a hose. Some boats have a watermaker: ask how to run it.",
          "Ask at check-in whether the tank water is drinkable. Many crews drink bottled water and use the tanks for everything else.",
        ],
      },
      {
        heading: "Power",
        list: [
          "Everything aboard runs from 12V batteries. In a marina you plug into shore power; at anchor the batteries are charged by the engine, solar panels or a generator.",
          "The fridge, the anchor windlass and the autopilot use the most. Running the engine for about an hour a day at anchor is common if there is no solar or generator.",
          "230V sockets usually work only on shore power, from the generator or through an inverter. Charge phones from 12V USB sockets.",
          "Never let the batteries run flat: the engine may need them to start.",
        ],
      },
      {
        heading: "The heads (toilets)",
        list: [
          "Nothing goes in a marine toilet except what you have eaten and a little thin toilet paper. Everything else, including wipes and sanitary products, goes in the bin. A blocked toilet is the most common call to the base.",
          "Pump until the bowl is clear, then a few more strokes so the pipe is clear too.",
          "In harbours, marinas, bays and near swimmers, use the holding tank. Empty it well offshore where the local rules allow, or at a pump-out station.",
          "Learn the holding-tank valve at check-in and agree who opens and closes it.",
        ],
      },
      {
        heading: "Gas",
        list: [
          "The cooker runs on bottled gas. Open the valve at the bottle (or the switch on the panel) only while cooking and close it straight after.",
          "Gas is heavier than air and collects low in the boat. If you ever smell gas: no flames, no switches, close the bottle, open every hatch and ventilate.",
          "Know where the spare bottle is and how to change it.",
        ],
      },
      {
        heading: "Under way",
        checklist: [
          "Hatches and portholes closed before sailing",
          "Everything stowed: nothing loose on tables, counters or the chart table",
          "Fridge closed, gas off, doors latched",
          "Dinghy secured on its davits or towed on a short line in calm water",
        ],
      },
    ],
    related: [
      { label: "The yacht check-in (handover)", path: "/cruising/how-to/yacht-check-in" },
      { label: "Weather for a charter week", path: `${COURSE}/weather-for-a-charter-week` },
    ],
  },
  {
    id: "med-mooring",
    series: "aboard",
    title: "How to Med-moor (stern-to) step by step",
    summary: "Mooring stern-to with lazy lines or your own anchor: the plan, the roles and the common mistakes.",
    minutes: 5,
    intro:
      "In much of the Mediterranean you moor stern-to: the back of the boat to the quay, the bow held either by a lazy line from the seabed or by your own anchor. It looks hard the first time and becomes routine by Wednesday. The secret is a plan everyone knows before you enter the harbour.",
    sections: [
      {
        heading: "Before you go in",
        checklist: [
          "Fenders out on both sides, low, at the widest part of the boat",
          "Two stern lines ready, each led from a stern cleat, coiled and ready to throw or hand ashore",
          "Boathook ready (for the lazy line)",
          "Anchor ready to drop if you are using your own",
          "Everyone knows their job: helm, bow, two at the stern",
          "Call the marina on VHF if it assigns berths, and note your space",
        ],
      },
      {
        heading: "With lazy lines (most marinas)",
        list: [
          "Line up a boat length or two out, in line with your space, and reverse slowly and straight in. A little forward thrust stops you if you are too fast.",
          "At the quay, pass the windward stern line first, then the other. Make both fast, then hold the boat a metre off the quay with the engine.",
          "Pick up the lazy line with the boathook, walk it forward along the side of the boat (it is slimy: gloves help) and pull it tight to a bow cleat.",
          "Adjust the stern lines so the boat sits a step away from the quay. Engine in neutral, then off.",
        ],
      },
      {
        heading: "With your own anchor (town quays without lazy lines)",
        list: [
          "Drop the anchor about three to four boat lengths out from the quay, in line with your space, while reversing slowly.",
          "Let the chain out as you reverse, without letting it go slack or snubbing it hard.",
          "Pass the stern lines ashore, then take up the chain until the anchor holds and the boat sits off the quay.",
          "Watch for other boats' chains: when leaving, lift yours slowly and straight up.",
        ],
      },
      {
        heading: "Common mistakes",
        list: [
          "Going too fast. Slow is in control; you can always add power.",
          "A crosswind: start upwind of your space and let the boat drift down into it, with the windward stern line first.",
          "A stern line caught round the propeller: keep lines out of the water until they go ashore.",
          "Fending off with hands and feet between the boat and the quay. Use fenders and the engine, not people.",
        ],
        tip: "On a catamaran there are two engines: use them apart (one ahead, one astern) to turn on the spot. Practise once in open water before your first marina.",
      },
    ],
    related: [{ label: "Anchoring and mooring buoys", path: `${COURSE}/anchoring-and-mooring` }],
  },
  {
    id: "licences-and-paperwork",
    series: "before",
    title: "Licences and paperwork for a bareboat charter",
    summary: "What the skipper and crew need to charter without a skipper, and what to do if you have no licence.",
    minutes: 4,
    intro:
      "To charter without a professional skipper (bareboat), the skipper needs a recognised sailing licence, and in many countries a VHF radio certificate. The exact rules depend on the country and on the operator. Each of our destination pages says what that country asks for.",
    sections: [
      {
        heading: "What is usually accepted",
        list: [
          "The International Certificate of Competence (ICC), issued in many European countries.",
          "National licences such as the RYA Day Skipper or Yachtmaster, the ASA or US Sailing bareboat certificates, and their equivalents. Operators decide which they accept.",
          "A VHF / short-range radio operator certificate (SRC) for whoever uses the radio, where the country requires one.",
          "Some countries also ask for a second crew member with experience or a licence.",
        ],
      },
      {
        heading: "Sailing experience",
        text: [
          "Operators also look at experience: they ask for a sailing CV with the boats you have sailed and skippered. A licence alone may not be enough for a large catamaran or a 50-footer if you have never skippered one.",
        ],
      },
      {
        heading: "Documents to bring",
        checklist: [
          "Originals of the skipper's licence and VHF certificate (photos are often not accepted)",
          "Passports or ID cards for the crew list",
          "Sailing CV, if the operator asked for one",
          "The charter contract and the deposit payment method (usually a credit card)",
        ],
      },
      {
        heading: "No licence? Take a skipper",
        text: [
          "If nobody in your group has the licence, or you would rather relax, book a skipper: a professional who sails the boat and knows the area. A skipper usually costs about €1,500–2,000 a week, plus food, and sleeps aboard in a cabin or the crew cabin. On our planner, choose 'Yes, a skipper sails for us'.",
        ],
      },
    ],
    related: [
      { label: "Navigation for charter skippers (free course)", path: COURSE },
      { label: "What to pack for a charter week", path: "/cruising/how-to/what-to-pack" },
    ],
  },
  // ── Weather series ─────────────────────────────────────────────────────────
  {
    id: "reading-a-sailing-forecast",
    series: "weather",
    title: "Weather 1: reading a sailing forecast",
    summary: "Wind speed and the Beaufort scale, gusts, where to get forecasts and when to stay in port.",
    minutes: 6,
    intro:
      "On a charter week the weather decides the plan: where you sail, when you leave and where you spend the night. You do not need to be a meteorologist. You need to read the wind forecast properly, check two sources, and know your own limits.",
    sections: [
      {
        heading: "Wind first",
        text: [
          "For sailing, the forecast that matters is the wind: its strength, its direction and how it changes through the day. Wind direction is where the wind comes from: a northerly blows from the north.",
          "Forecasts give the mean wind and the gusts. The gusts are what you feel at the helm and what the boat has to handle: plan for them, not for the mean.",
        ],
      },
      {
        heading: "The Beaufort scale",
        table: {
          head: ["Force", "Knots", "What it is like on a charter yacht"],
          rows: [
            ["3", "7–10", "Gentle breeze: lovely sailing, flat water"],
            ["4", "11–16", "Moderate breeze: great sailing, a few white horses"],
            ["5", "17–21", "Fresh breeze: reef early, it gets lively and wet"],
            ["6", "22–27", "Strong breeze: reefed and hard work; many crews stay in port"],
            ["7", "28–33", "Near gale: stay in a safe harbour"],
            ["8", "34–40", "Gale: stay in a safe harbour"],
          ],
        },
        tip: "A comfortable limit for most charter crews is a mean wind of about Force 4–5. Agree the limit before the week, and say no to a passage that is beyond it.",
      },
      {
        heading: "Where to get forecasts",
        list: [
          "The national weather service of the country you are in: they forecast the local effects best.",
          "Apps that show weather models, such as Windy or PredictWind: good for seeing the pattern over several days.",
          "The base: ask at check-in, and call them if the forecast looks bad.",
          "VHF coastguard and coast-radio forecasts, broadcast at set times in the local language and in English.",
          "Other skippers and the harbour master: local knowledge beats any model.",
        ],
      },
      {
        heading: "How to use them",
        list: [
          "Check the forecast every evening for tomorrow and every morning before you leave.",
          "Compare at least two sources. If they disagree, plan for the stronger one.",
          "Models smooth out the coast. Wind accelerates round capes, between islands and down valleys, and is often stronger there than the forecast.",
          "In summer the wind often builds through the day: sail in the morning, arrive by mid-afternoon.",
        ],
      },
    ],
    related: [{ label: "Weather for a charter week (course lesson)", path: `${COURSE}/weather-for-a-charter-week` }],
  },
  {
    id: "mediterranean-winds",
    series: "weather",
    title: "Weather 2: the Mediterranean's named winds",
    summary: "The meltemi, bora, mistral, sirocco and the friendly afternoon breezes: where, when and what they do.",
    minutes: 7,
    intro:
      "The Mediterranean has winds with names, because sailors have met them for thousands of years. Knowing which ones blow where you are sailing tells you what to expect and when to be careful.",
    sections: [
      {
        heading: "The friendly ones: afternoon sea breezes",
        list: [
          "On sunny summer days the land heats up and pulls a breeze in from the sea in the afternoon. In Croatia it is called the maestral, in the Ionian the maistro: a north-westerly that builds from late morning to a pleasant Force 3–4 and fades at sunset.",
          "These breezes give the classic charter rhythm: a calm morning swim, a good sail after lunch, a quiet evening.",
        ],
      },
      {
        heading: "Meltemi (Aegean Greece and Turkey)",
        list: [
          "A northerly summer wind across the Aegean, strongest in July and August.",
          "It can blow Force 5–7 for several days, strongest in the afternoon, and it raises a short, steep sea.",
          "Plan the week so you sail downwind, south, in the afternoons; head north early in the morning or on calmer days.",
          "The Saronic Gulf near Athens is more sheltered than the open Cyclades.",
        ],
      },
      {
        heading: "Bora (Adriatic: Croatia, Montenegro)",
        list: [
          "A cold north-easterly that falls down the coastal mountains in strong, sudden gusts. More common outside summer, but it can come at any time of year.",
          "It can arrive quickly, sometimes with little warning beyond clouds on the mountain tops. The sea stays fairly flat near the coast, but the gusts are violent.",
          "Choose harbours and anchorages sheltered from the north-east when a bora is forecast, and lay plenty of chain.",
        ],
      },
      {
        heading: "Jugo / sirocco (from the south-east)",
        list: [
          "A warm, humid wind from the south-east that usually builds over a day or two, often with cloud and rain.",
          "In the Adriatic, where it is called the jugo, it raises a long, heavy swell along the coast. Harbours open to the south-east become uncomfortable.",
          "Further south it can carry Saharan dust and haze.",
        ],
      },
      {
        heading: "Mistral and tramontana (France, Corsica, Sardinia, Balearics)",
        list: [
          "The mistral is a cold northerly to north-westerly that blows down the Rhône valley into the Gulf of Lion. It can be strong for several days and reaches Corsica, northern Sardinia and the Balearics.",
          "The Strait of Bonifacio, between Corsica and Sardinia, accelerates the westerly winds: it can be much windier there than a few miles away.",
          "The tramontana is a northerly wind in the Balearics, Catalonia and Italy; on Mallorca's north coast it makes the bays exposed.",
        ],
      },
      {
        heading: "Other names you will hear",
        list: [
          "Levante: an easterly, notably in the Balearics and near Gibraltar.",
          "Libeccio: a south-westerly on the west coast of Italy and Corsica, which can raise a big sea.",
          "Etesians: the formal name for the meltemi.",
        ],
        tip: "Ask the base which wind they worry about that week and which harbours give shelter from it. Every charter area has one.",
      },
    ],
    related: [
      { label: "Reading a sailing forecast", path: "/cruising/how-to/reading-a-sailing-forecast" },
      { label: "Choosing a safe anchorage for the night", path: "/cruising/how-to/safe-anchorage-for-the-night" },
    ],
  },
  {
    id: "thunderstorms-and-squalls",
    series: "weather",
    title: "Weather 3: thunderstorms and squalls",
    summary: "How to see them coming and what to do when a squall or thunderstorm reaches the boat.",
    minutes: 5,
    intro:
      "Summer thunderstorms are usually short, but they can bring sudden strong gusts, a wind shift, heavy rain and lightning. Most of the danger comes from being caught with too much sail up or in the wrong place, so the plan is simple: see it coming, and be ready early.",
    sections: [
      {
        heading: "Signs",
        list: [
          "Tall, building cumulus clouds over the land in the afternoon, especially with an anvil-shaped top.",
          "A dark, low roll of cloud approaching, sometimes with a line of white water beneath it: the gust front.",
          "Thunder or lightning in the distance, and a sudden drop in temperature.",
          "Forecasts mention instability, convective showers or thunderstorms: take them seriously.",
        ],
      },
      {
        heading: "Under sail",
        checklist: [
          "Reef or furl early, before the first gusts arrive",
          "Lifejackets on, everyone in the cockpit or below",
          "Hatches closed, loose items stowed",
          "Engine on and ready",
          "Head for open water with room downwind, away from the shore and other boats",
          "Note your position on the plotter in case visibility drops in the rain",
        ],
      },
      {
        heading: "At anchor",
        list: [
          "Expect a wind shift: the squall may come from a direction the anchorage is not sheltered from.",
          "Let out more chain if there is room, start the engine and keep someone on watch until it passes.",
          "Take the dinghy out of the water or tie it short, and close the bimini or reduce windage where you can.",
        ],
      },
      {
        heading: "Lightning",
        list: [
          "Stay below as far as possible and keep away from the mast, the shrouds and large metal fittings.",
          "Do not swim. Keep hands off the wheel and metal rails where you can.",
          "Unplug handheld electronics if it is convenient; keep a handheld VHF and phone in the oven or a dry bag as a backup.",
        ],
        tip: "Most summer squalls pass in under an hour. If the forecast shows thunderstorms, plan short hops and be in a secure harbour or anchorage by early afternoon.",
      },
    ],
    related: [{ label: "Reading a sailing forecast", path: "/cruising/how-to/reading-a-sailing-forecast" }],
  },
  {
    id: "safe-anchorage-for-the-night",
    series: "weather",
    title: "Weather 4: choosing a safe anchorage for the night",
    summary: "Shelter from tonight's wind, not this afternoon's: how to pick, set and watch an anchorage overnight.",
    minutes: 5,
    intro:
      "The most common reason for a bad night on a charter is an anchorage that was perfect at five in the afternoon and wide open at two in the morning. Choose your night stop for the wind that is forecast overnight, not the wind you sailed in with.",
    sections: [
      {
        heading: "Before you choose",
        checklist: [
          "Check the overnight forecast: wind direction and strength until morning",
          "The bay is sheltered from that direction by land",
          "No swell running into the bay from a distant wind",
          "Enough room to swing round the anchor in a full circle, clear of rocks and other boats",
          "Good holding: sand or mud is best; dense weed and rock hold badly",
          "A plan B nearby if the wind turns",
        ],
      },
      {
        heading: "Setting the anchor",
        list: [
          "Lay out at least four to five times the depth in chain in settled weather, more if wind is forecast.",
          "Reverse gently to set the anchor, then firmly. Watch two fixed points ashore: if they do not move, the anchor has held.",
          "Snorkel over the anchor if the water is clear, to see it dug in.",
        ],
      },
      {
        heading: "Through the night",
        list: [
          "Set an anchor alarm on the plotter or a phone app.",
          "Night winds: in some places a cooler land breeze blows down from the hills at night, from the opposite direction to the afternoon sea breeze.",
          "If the wind rises or turns onshore, do not wait for daylight to decide: move early while you can still see and before it gets worse.",
          "Leave the anchor light on.",
        ],
        tip: "If the forecast is unsettled, choose a harbour or a mooring buoy for the night. The best anchorage of the week is the one where you sleep well.",
      },
    ],
    related: [
      { label: "Anchoring and mooring buoys (course lesson)", path: `${COURSE}/anchoring-and-mooring` },
      { label: "The Mediterranean's named winds", path: "/cruising/how-to/mediterranean-winds" },
    ],
  },
  // ── Yacht care and maintenance ─────────────────────────────────────────────
  {
    id: "daily-boat-checks",
    series: "care",
    title: "Yacht care 1: the five-minute daily checks",
    summary: "What to check every morning before you start the engine: oil, water, belt, bilge and fuel.",
    minutes: 4,
    intro:
      "Charter boats work hard. A five-minute check every morning, before you start the engine, catches most problems while you are still at anchor rather than off a lee shore.",
    sections: [
      {
        heading: "Every morning",
        checklist: [
          "Engine oil level on the dipstick, between the marks",
          "Engine coolant level in the header tank",
          "Fan belt: tight, not frayed",
          "Raw-water strainer: clear of weed and plastic",
          "Engine raw-water seacock open",
          "Bilges dry, or only a little water: find out where any water comes from",
          "Fuel level: enough for today with a reserve",
          "Batteries: voltage reasonable before starting",
        ],
      },
      {
        heading: "After starting",
        checklist: [
          "Cooling water comes out of the exhaust with the exhaust gas",
          "No new noises, smells or smoke",
          "Engine temperature and oil pressure normal (no warning lights or alarms)",
        ],
      },
      {
        heading: "On deck",
        checklist: [
          "Look along the sheets, halyards and furling lines for chafe",
          "Shackles and pins closed; split pins in place",
          "Dinghy secure and its painter out of the propeller's way",
          "Anchor and windlass secured for sailing",
        ],
        tip: "Keep a notebook of engine hours, fuel taken and anything unusual. It makes the conversation with the base easy if something goes wrong.",
      },
    ],
    related: [
      { label: "Engine trouble: overheating and not starting", path: "/cruising/how-to/engine-trouble" },
      { label: "The yacht check-in (handover)", path: "/cruising/how-to/yacht-check-in" },
    ],
  },
  {
    id: "engine-trouble",
    series: "care",
    title: "Yacht care 2: engine trouble, overheating and not starting",
    summary: "The usual causes and safe first steps when the engine overheats, will not start or stops.",
    minutes: 5,
    intro:
      "Most engine problems on a charter boat have a few simple causes. Know the safe first checks, and call the base before you try anything more: they want to help, and some repairs are theirs to do.",
    sections: [
      {
        heading: "First, the boat",
        text: ["If the engine stops or must be stopped, sail if you can, or anchor if it is shallow enough and safe, before you look at the engine. Get clear of the shore and other boats first."],
      },
      {
        heading: "Overheating (alarm, or no water from the exhaust)",
        list: [
          "Stop the engine.",
          "Is the raw-water seacock open?",
          "Is the strainer blocked with weed or plastic? Close the seacock before opening it, clean it and refit it carefully.",
          "Is anything round the propeller or over the water intake, such as a bag or a rope?",
          "If water still does not flow, the water-pump impeller may have failed: call the base.",
          "Never open the coolant cap on a hot engine.",
        ],
      },
      {
        heading: "It will not start",
        list: [
          "Gear lever in neutral, kill cord or stop button reset.",
          "Battery switch on, and the engine battery selected.",
          "Fuel: enough in the tank, and the fuel tap open if there is one.",
          "If it turns over but does not fire, do not keep cranking: you can flood the exhaust with water. Call the base.",
        ],
      },
      {
        heading: "It stops while running",
        list: [
          "Often fuel: an empty tank, or dirt stirred up in a low tank in rough water.",
          "Or something round the propeller: look over the stern.",
          "Do not dive under the boat in a seaway or near rocks. Call the base.",
        ],
        tip: "Every base has a breakdown number. Call it early, with your position, the engine hours and what you see. It is part of the service you paid for.",
      },
    ],
    related: [
      { label: "The five-minute daily checks", path: "/cruising/how-to/daily-boat-checks" },
      { label: "When something breaks", path: "/cruising/how-to/when-something-breaks" },
    ],
  },
  {
    id: "sails-lines-and-winches",
    series: "care",
    title: "Yacht care 3: looking after sails, lines and winches",
    summary: "Reef early, furl under control, stop the flogging and the chafe: how to keep the rig in one piece.",
    minutes: 5,
    intro:
      "Torn sails and jammed furlers are among the most common, and most expensive, charter damage. Nearly all of it is avoidable with a few habits.",
    sections: [
      {
        heading: "Furling",
        list: [
          "Furl the headsail with a little tension on the sheet, so it rolls tightly and evenly.",
          "Furl on a gentle point of sail, not dead downwind or head to wind in a strong breeze.",
          "If the furling line is hard to pull, stop and look: something is caught. Never force it with a winch.",
          "In-mast mainsails: ease the outhaul as you roll it in, and keep the boom at the right angle (the base will show you).",
        ],
      },
      {
        heading: "Reefing",
        list: [
          "Reef when you first think about it. It is easy in 15 knots and hard in 25.",
          "Reduce sail before a squall, before the afternoon breeze builds and before arriving in harbour.",
        ],
      },
      {
        heading: "Flogging and chafe",
        list: [
          "A sail flapping hard (flogging) wears out quickly. Do not leave it flogging while you sort something out: sheet in or furl it.",
          "Look for lines rubbing on the guardrails, the shrouds or the sprayhood, and re-lead them.",
          "Keep the sails off the spreaders when sailing downwind.",
        ],
      },
      {
        heading: "Winches and lines",
        list: [
          "Three or four turns on the winch, clockwise. Keep fingers clear of the drum.",
          "Take winch handles out when you are not using them: they go over the side easily.",
          "Coil and hang lines so they are ready to run, and keep them out of the water and away from the propeller.",
        ],
      },
    ],
    related: [{ label: "The five-minute daily checks", path: "/cruising/how-to/daily-boat-checks" }],
  },
  {
    id: "dinghy-and-outboard",
    series: "care",
    title: "Yacht care 4: the dinghy and outboard",
    summary: "Fuel, the kill cord, beaching, towing and keeping the dinghy where you left it.",
    minutes: 4,
    intro: "The dinghy is your car for the week: it takes you ashore for dinner, to the beach and to the shops. Look after it and it will be there when you need it.",
    sections: [
      {
        heading: "The outboard",
        list: [
          "Check the fuel before every trip, and find out at check-in whether the engine takes plain petrol or a petrol-oil mix.",
          "Attach the kill cord to the driver's wrist or lifejacket: if they fall out, the engine stops.",
          "Tilt the engine up before reaching the beach or shallow water so the propeller does not hit the bottom.",
          "Go slowly near swimmers, other boats and in harbours.",
        ],
      },
      {
        heading: "Ashore and at night",
        list: [
          "Pull the dinghy well up the beach, or tie it where it will not chafe against the quay.",
          "Lock it at night and in towns: dinghy and outboard theft happens in busy harbours.",
          "At the boat, lift it on the davits or tie it short. A loose dinghy at night bangs on the hull and can drift away.",
        ],
      },
      {
        heading: "Towing",
        list: [
          "Only in calm water and for short distances, on a line long enough that it rides on the back of your wake.",
          "Never tow with the outboard on, and keep the line away from the propeller when manoeuvring.",
        ],
      },
    ],
    related: [{ label: "When something breaks", path: "/cruising/how-to/when-something-breaks" }],
  },
  {
    id: "when-something-breaks",
    series: "care",
    title: "Yacht care 5: when something breaks",
    summary: "Who to call, what to note, what you may fix yourself and how it affects your deposit.",
    minutes: 3,
    intro: "Things break on boats, even well-kept ones. Handled calmly and reported early, most breakages are a short call and a quick fix by the base.",
    sections: [
      {
        heading: "What to do",
        list: [
          "Make the boat and crew safe first.",
          "Call the base's breakdown number with your position, what happened and what you see. Photos help.",
          "Write down what happened and when: it helps the base, and the insurance if needed.",
          "Ask before repairing anything yourself or paying a local mechanic. Keep every receipt: the base may refund agreed repairs that are not your fault.",
        ],
      },
      {
        heading: "Wear and tear or damage?",
        text: [
          "Normal wear and tear and faults in the boat's equipment are the operator's responsibility. Damage caused by the crew, such as a grounding, a collision or a sail torn by flogging, is usually charged against the deposit or claimed on the damage-waiver insurance.",
          "Being honest and reporting early is in your interest: the base can often fix it during the week, and hidden damage found at check-out tends to cost more.",
        ],
      },
    ],
    related: [
      { label: "Check-out and getting your deposit back", path: "/cruising/how-to/yacht-check-out" },
      { label: "Engine trouble", path: "/cruising/how-to/engine-trouble" },
    ],
  },
];

/** Guides in the same series, in order. */
export function seriesOf(id: HowToSeries): HowToGuide[] {
  return HOWTO.filter((g) => g.series === id);
}

export function howToById(id: string): HowToGuide | undefined {
  return HOWTO.find((g) => g.id === id);
}
