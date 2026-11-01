// Narrated video scripts for the charter know-how guides (lib/cruising/howto.ts).
// Plain data (no React), so the narration API can record exactly these
// sentences and tests can check they read well. The player
// (components/cruising/HowToVideo.tsx) draws each scene from its `visual`.
//
// Points, steps and table rows appear one per narration sentence: item k shows
// from sentence `lead + k` (lead defaults to 1, the scene's opening sentence),
// unless the visual gives explicit `at` indices.

export type HowToIcon =
  | "cart" | "list" | "package" | "fridge" | "store" | "utensils" | "file" | "camera" | "wind" | "gauge" | "droplets"
  | "battery" | "flame" | "anchor" | "lifebuoy" | "sailboat" | "radio" | "compass" | "map" | "sun" | "shirt" | "backpack"
  | "phone" | "wallet" | "lightning" | "rain" | "thermometer" | "alert" | "wrench" | "cog" | "fuel" | "waves" | "shield"
  | "clock" | "euro" | "lock" | "moon" | "ruler" | "zap" | "users" | "id" | "check" | "recycle" | "sunset" | "mountain"
  | "bath" | "pot" | "trash" | "glasses" | "footprints" | "plug" | "info" | "search" | "eye" | "receipt" | "ban" | "siren"
  | "book" | "calendar" | "timer" | "fish" | "ship" | "rotate";

export interface HowToPoint {
  icon: HowToIcon;
  title: string;
  body?: string;
}

export type HowToVisual =
  | { kind: "title"; icon: HowToIcon }
  | { kind: "points"; points: HowToPoint[]; lead?: number; at?: number[] }
  | { kind: "steps"; steps: string[]; lead?: number; at?: number[] }
  | { kind: "table"; head: string[]; rows: string[][]; lead?: number; at?: number[] }
  | { kind: "tip"; icon: HowToIcon; text: string };

export interface HowToScene {
  title: string;
  narration: string;
  visual: HowToVisual;
  seconds?: number;
}

export interface HowToScript {
  id: string;
  /** Pronunciation fixes for the recorded voice (written → spoken). */
  speak?: Record<string, string>;
  scenes: HowToScene[];
}

// "knowhow-", not "howto-": the shorts already use "howto-med-mooring".
export const howToNarrationId = (id: string) => `knowhow-${id}`;

const P = (icon: HowToIcon, title: string, body?: string): HowToPoint => ({ icon, title, body });
const VHF = { VHF: "V H F" };
/** "Quay" is said "key". */
const QUAY = { quay: "key" };

export const HOWTO_SCRIPTS: Record<string, HowToScript> = {
  "provisioning-for-a-week": {
    id: "provisioning-for-a-week",
    scenes: [
      {
        title: "Provisioning for a week",
        narration: "Good provisioning means fewer trips ashore for the basics, and more time where you want to be. Here is how to plan, buy and stow food and drink for a week aboard.",
        visual: { kind: "title", icon: "cart" },
      },
      {
        title: "Plan the meals first",
        narration:
          "Start with the meals, not the shopping list. Most crews eat breakfast and lunch aboard every day. Dinner aboard three or four nights, and ashore on the others. And keep the cooking simple: one-pot dinners, big salads, pasta and the barbecue.",
        visual: { kind: "points", points: [P("sun", "Breakfast and lunch aboard", "every day"), P("pot", "Dinner aboard", "three or four nights"), P("utensils", "Keep it simple", "one-pot dinners, salads, pasta, the grill")] },
      },
      {
        title: "How much to buy",
        narration:
          "As a starting point, each person needs fifteen to twenty litres of drinking water for the week. Six to eight eggs, and ten to fourteen pieces of fruit. Two to three kilos of vegetables and salad. About half a kilo of pasta or rice. Buy the heavy basics on the first day, and fresh food every two or three days.",
        visual: {
          kind: "table",
          head: ["Per person, 7 days", ""],
          rows: [["Drinking water", "15–20 litres"], ["Eggs · fruit", "6–8 · 10–14 pieces"], ["Vegetables and salad", "2–3 kg"], ["Pasta, rice", "500–700 g"]],
          lead: 0,
        },
      },
      {
        title: "Where to shop",
        narration:
          "There are four good places to shop. A supermarket near the base, for the long-life basics on the first day. Delivery to the boat, ordered ahead through the base, which saves the first afternoon. Markets and bakeries along the route, for the best fresh food of the week. And small island shops, which are expensive and close early, so do not count on them for the basics.",
        visual: { kind: "points", points: [P("store", "Supermarket near the base", "long-life basics, day one"), P("package", "Delivery to the boat", "order ahead through the base"), P("fish", "Markets and bakeries", "fresh food along the way"), P("clock", "Island shops", "pricey, and close early")] },
      },
      {
        title: "Stow it for the sail",
        narration:
          "Stow everything before you sail. Heavy things go low and near the middle of the boat. Nothing stays loose on the counters, and every locker is closed. In the fridge, drinks go at the bottom and food on top, and open it as little as you can. Take off the cardboard before stowing, and take your rubbish ashore at every port.",
        visual: { kind: "points", points: [P("package", "Heavy items low and central"), P("lock", "Nothing loose", "lockers and fridge closed"), P("fridge", "Fridge", "drinks down, food on top"), P("recycle", "Cardboard off, rubbish ashore")] },
      },
      {
        title: "Easy to forget",
        narration:
          "And the things crews always forget: matches or a lighter for the stove, washing-up liquid, bin bags, and thin toilet paper for the marine toilets. The full checklist is on this page.",
        visual: { kind: "tip", icon: "list", text: "Matches for the stove · washing-up liquid · bin bags · thin toilet paper · salt, oil, spices · a cool bag" },
      },
    ],
  },
  "yacht-check-in": {
    id: "yacht-check-in",
    speak: VHF,
    scenes: [
      {
        title: "The yacht check-in",
        narration: "The check-in, or handover, is when the base shows you the boat and you sign for it. Anything you do not spot now may be charged to you at the end of the week, so take your time.",
        visual: { kind: "title", icon: "check" },
      },
      {
        title: "Paperwork",
        narration:
          "It starts in the base office. The charter contract and the crew list, with everyone's passport details. The skipper's licence, and a VHF radio certificate where it is needed, as originals. The security deposit, or the damage waiver if you bought one. And the base's phone number for breakdowns.",
        visual: { kind: "points", points: [P("file", "Contract and crew list"), P("id", "Licence and VHF certificate", "the originals"), P("euro", "Deposit or damage waiver"), P("phone", "Breakdown phone number")] },
      },
      {
        title: "Walk round with photos",
        narration:
          "Then walk round the boat with the base staff, and photograph every mark that is already there. The hull, the topsides and the swim platform. The deck, the hatches and the windows. The dinghy and the outboard: start it, and check the fuel. Make sure every mark is written on the check-in form.",
        visual: { kind: "points", points: [P("camera", "Hull, topsides, swim platform"), P("search", "Deck, hatches, windows"), P("anchor", "Dinghy and outboard", "start it, check the fuel"), P("file", "Every mark on the form")] },
      },
      {
        title: "Sails and engine",
        narration:
          "Unroll the headsail and roll it away again, and do the same with the mainsail. Check the engine oil, the coolant and the fan belt. Start the engine, and make sure cooling water comes out of the exhaust. Check the fuel tank is full, and note the engine hours.",
        visual: { kind: "points", points: [P("sailboat", "Sails out and in", "no tears, lines run freely"), P("cog", "Oil, coolant, fan belt"), P("waves", "Cooling water from the exhaust"), P("fuel", "Fuel full, engine hours noted")], lead: 0 },
      },
      {
        title: "Water, toilets and gas",
        narration:
          "Next, the systems you live with. The water tanks are full, and the pump and hot water work. Every toilet pumps properly, and you know how the holding tank valve works. The gas bottle is connected, there is a full spare, and you know where the shut-off valve is.",
        visual: { kind: "points", points: [P("droplets", "Water tanks full", "pump and hot water work"), P("bath", "Toilets and holding tank"), P("flame", "Gas", "spare bottle, shut-off valve")] },
      },
      {
        title: "Safety equipment",
        narration:
          "Then the safety gear. Lifejackets for everyone, in the right sizes, including children's. The liferaft and the flares are in date. The fire extinguishers and the first aid kit are aboard, and you know where they are. And do a radio check with the base on the VHF.",
        visual: { kind: "points", points: [P("lifebuoy", "Lifejackets for everyone", "children's sizes too"), P("calendar", "Liferaft and flares in date"), P("siren", "Extinguishers and first aid"), P("radio", "VHF radio check")] },
      },
      {
        title: "Ask, then sign",
        narration:
          "Before you sign, ask your questions. When and where do you return the boat? Are there places you must not go, and what is the fuel policy? Sign the form only when every existing mark is on it.",
        visual: { kind: "tip", icon: "file", text: "Ask: return time · no-go areas · fuel policy · who to call. Sign only when every mark is on the form." },
      },
    ],
  },
  "yacht-check-out": {
    id: "yacht-check-out",
    scenes: [
      {
        title: "Check-out and your deposit",
        narration: "A calm check-out comes down to three things. Be back on time, return the boat as you received it, and report anything that broke during the week.",
        visual: { kind: "title", icon: "receipt" },
      },
      {
        title: "The day before",
        narration:
          "Check your contract for the return time. In the Mediterranean the boat is usually due back on Friday afternoon or evening, with check-out on Saturday morning. If the contract asks for a full tank, refuel on the way back, and go early because the fuel docks have queues. Empty the holding tanks where it is allowed. And watch the wind: a late Friday beat into a strong breeze is how boats get damaged on the last day.",
        visual: { kind: "points", points: [P("clock", "Back on time", "usually Friday afternoon"), P("fuel", "Refuel early", "if the contract asks"), P("bath", "Empty the holding tank"), P("wind", "Watch the wind", "no late beat into a strong breeze")] },
      },
      {
        title: "The inspection",
        narration:
          "The base then checks the boat against the check-in form. Many bases send a diver to look at the keel, the rudder and the propeller. Report anything that broke, honestly: damage reported early is usually handled better. And take your own photos of the boat as you leave it.",
        visual: { kind: "points", points: [P("file", "Checked against the form"), P("eye", "Diver checks below", "keel, rudder, propeller"), P("alert", "Report damage honestly"), P("camera", "Your own photos")], lead: 0 },
      },
      {
        title: "The deposit",
        narration:
          "If nothing is wrong, the base signs the check-out and releases the deposit. A hold on a card can take several days to disappear from your statement. If there is damage, ask for any deduction in writing.",
        visual: { kind: "tip", icon: "euro", text: "No damage: deposit released (a card hold can take a few days to clear). Damage: ask for the deduction in writing." },
      },
    ],
  },
  "what-to-pack": {
    id: "what-to-pack",
    speak: { ...VHF, ID: "I D" },
    scenes: [
      {
        title: "What to pack",
        narration: "Space aboard is tight and the lockers are small. So pack light, in soft bags, and bring the few things that matter at sea.",
        visual: { kind: "title", icon: "backpack" },
      },
      {
        title: "Bags and clothes",
        narration:
          "First, the bags and clothes. Soft bags only, because hard suitcases will not fit in the lockers. Two sets of swimwear, because one is always wet. A warm layer and a windproof jacket, because evenings at sea are cooler than ashore. And shoes with pale, non-marking soles for the deck.",
        visual: { kind: "points", points: [P("backpack", "Soft bags only"), P("shirt", "Two sets of swimwear"), P("wind", "Warm layer, windproof jacket"), P("footprints", "Non-marking deck shoes")] },
      },
      {
        title: "Sun and sea",
        narration:
          "For the sun and the sea, bring high factor, reef-safe sunscreen. A hat with a strap, and polarised sunglasses on a cord. Seasickness tablets, started before you need them. And beach towels, because the boat often provides bed linen and bath towels, but not beach towels.",
        visual: { kind: "points", points: [P("sun", "Reef-safe sunscreen"), P("glasses", "Hat and sunglasses", "with a strap and a cord"), P("waves", "Seasickness tablets", "start them early"), P("shirt", "Beach towels")], lead: 0 },
      },
      {
        title: "Small things that help",
        narration:
          "A few small things make the week easier. A head torch for the cabin and the dinghy at night. A waterproof pouch for your phone, and a car-socket charger, because the sockets may only work in the marina. And some cash, because not every small harbour or island shop takes cards.",
        visual: { kind: "points", points: [P("zap", "Head torch"), P("phone", "Waterproof pouch, car-socket charger"), P("wallet", "Some cash")] },
      },
      {
        title: "Documents",
        narration: "Last, the documents: passports or ID cards for the whole crew, and the skipper's licence and VHF certificate, as originals.",
        visual: { kind: "tip", icon: "id", text: "Passports or ID for everyone · skipper's licence and VHF certificate (originals) · contract and insurance details" },
      },
    ],
  },
  "living-aboard": {
    id: "living-aboard",
    speak: QUAY,
    scenes: [
      {
        title: "Living aboard",
        narration: "A yacht is a small, self-contained home. Water and power are limited between marinas, the toilets work differently from home, and the gas needs a little care.",
        visual: { kind: "title", icon: "ship" },
      },
      {
        title: "Water",
        narration:
          "A charter yacht carries a few hundred litres of water, and a full crew can use it in two or three days. Take short showers, and turn the tap off while you soap. Fill up at every marina or town quay with a hose. And ask at check-in whether the tank water is drinkable.",
        visual: { kind: "points", points: [P("droplets", "A few hundred litres", "two or three days for a full crew"), P("timer", "Short showers"), P("store", "Fill up at every hose"), P("info", "Drinkable? Ask the base")], lead: 0 },
      },
      {
        title: "Power",
        narration:
          "Everything aboard runs from twelve volt batteries. In a marina you plug into shore power. At anchor the engine, solar panels or a generator charge them, and many crews run the engine for about an hour a day. The fridge, the windlass and the autopilot use the most. Never let the batteries run flat, because the engine may need them to start.",
        visual: { kind: "points", points: [P("battery", "12-volt batteries"), P("plug", "Shore power in the marina"), P("sun", "Engine, solar, generator at anchor", "about an hour of engine a day"), P("fridge", "Fridge and windlass use the most"), P("alert", "Never run them flat")], lead: 0 },
      },
      {
        title: "The toilets",
        narration:
          "The heads, or toilets, are the most common call to the base. Nothing goes in them except what you have eaten and a little thin toilet paper. Pump until the bowl is clear, then a few more strokes. In harbours and bays, use the holding tank, and empty it offshore where it is allowed.",
        visual: { kind: "points", points: [P("ban", "Nothing else in the toilet", "no wipes, no sanitary products"), P("bath", "Pump until clear", "then a few more strokes"), P("waves", "Holding tank in harbours", "empty it offshore where allowed")], lead: 1 },
      },
      {
        title: "Gas",
        narration:
          "The cooker runs on bottled gas. Open the valve only while you cook, and close it straight after. Gas is heavier than air and collects low in the boat. If you ever smell it, no flames and no switches: close the bottle, and open every hatch.",
        visual: { kind: "points", points: [P("flame", "Valve open only while cooking"), P("alert", "Gas sinks to the bilge"), P("wind", "Smell gas?", "no flames, close the bottle, ventilate")] },
      },
      {
        title: "Before you sail",
        narration: "And before every sail: hatches closed, everything stowed, the fridge shut and the gas off.",
        visual: { kind: "tip", icon: "check", text: "Hatches closed · everything stowed · fridge shut · gas off · dinghy secured" },
      },
    ],
  },
  "med-mooring": {
    id: "med-mooring",
    speak: { ...QUAY, "the bow held": "the bough held", "the bow and two": "the bough and two", "a bow cleat": "a bough cleat" },
    scenes: [
      {
        title: "Med mooring",
        narration:
          "In much of the Mediterranean you moor stern-to: the back of the boat to the quay, and the bow held by a lazy line or your own anchor. It looks hard the first time and becomes routine by Wednesday.",
        visual: { kind: "title", icon: "anchor" },
      },
      {
        title: "Before you go in",
        narration:
          "The secret is a plan everyone knows before you enter the harbour. Fenders out on both sides, low, at the widest part of the boat. Two stern lines ready, one from each stern cleat. The boathook ready for the lazy line. And everyone knows their job: the helm, the bow and two at the stern.",
        visual: { kind: "points", points: [P("shield", "Fenders out, both sides"), P("anchor", "Two stern lines ready"), P("search", "Boathook ready"), P("users", "Everyone knows their job")] },
      },
      {
        title: "With lazy lines",
        narration:
          "Most marinas have lazy lines. Line up a boat length or two out, and reverse slowly and straight in. At the quay, pass the windward stern line first, then the other. Hold the boat a metre off with the engine, and pick up the lazy line with the boathook. Walk it forward and pull it tight to a bow cleat. Then adjust the stern lines, and switch off.",
        visual: { kind: "steps", steps: ["Line up and reverse in slowly", "Windward stern line first, then the other", "Hold off with the engine, hook the lazy line", "Walk it forward, tight to a bow cleat", "Adjust the stern lines, engine off"] },
      },
      {
        title: "With your own anchor",
        narration:
          "On a town quay without lazy lines, use your own anchor. Drop it three to four boat lengths out, in line with your space, while reversing slowly. Let the chain run out as you go, without letting it go slack. Pass the stern lines ashore, then take up the chain until the anchor holds.",
        visual: { kind: "steps", steps: ["Drop 3–4 boat lengths out", "Reverse, chain running out", "Stern lines ashore, take up the chain"] },
      },
      {
        title: "Common mistakes",
        narration:
          "The common mistakes are easy to avoid. Going too fast: slow is in control. In a crosswind, start upwind of your space and pass the windward line first. Keep lines out of the water so they cannot catch the propeller. And never fend off with hands or feet: use fenders and the engine.",
        visual: { kind: "points", points: [P("timer", "Too fast", "slow is in control"), P("wind", "Crosswind", "start upwind, windward line first"), P("cog", "Lines near the propeller"), P("ban", "Hands and feet as fenders")] },
      },
      {
        title: "On a catamaran",
        narration: "On a catamaran, use the two engines apart, one ahead and one astern, to turn on the spot. Practise once in open water before your first marina.",
        visual: { kind: "tip", icon: "sailboat", text: "Two engines: one ahead, one astern turns her on the spot. Practise in open water first." },
      },
    ],
  },
  "licences-and-paperwork": {
    id: "licences-and-paperwork",
    speak: { ...VHF, ICC: "I C C", RYA: "R Y A", CV: "C V" },
    scenes: [
      {
        title: "Licences and paperwork",
        narration:
          "To charter without a professional skipper, the skipper needs a recognised sailing licence, and in many countries a VHF radio certificate. The rules depend on the country and on the operator.",
        visual: { kind: "title", icon: "id" },
      },
      {
        title: "What is usually accepted",
        narration:
          "These are the licences operators usually accept. The International Certificate of Competence, or ICC. National licences such as the RYA Day Skipper or Yachtmaster, and their equivalents. A VHF radio certificate for whoever uses the radio, where the country asks for one. And some countries also want a second crew member with experience or a licence.",
        visual: { kind: "points", points: [P("id", "ICC", "International Certificate of Competence"), P("check", "National licences", "such as RYA Day Skipper"), P("radio", "VHF radio certificate"), P("users", "Sometimes a second crew member")] },
      },
      {
        title: "Experience counts",
        narration:
          "Operators also look at experience. Many ask for a sailing CV, with the boats you have sailed and skippered. A licence alone may not be enough for a big catamaran if you have never skippered one.",
        visual: { kind: "tip", icon: "book", text: "Bring a sailing CV: the boats you have sailed and skippered, and where." },
      },
      {
        title: "No licence? Take a skipper",
        narration:
          "No licence in the group, or would you rather relax? Book a skipper. A professional sails the boat and knows the area, for about fifteen hundred to two thousand euros a week, plus food. Choose it in our planner.",
        visual: { kind: "tip", icon: "users", text: "A skipper: about €1,500–2,000 a week plus food. Choose “Yes, a skipper sails for us” in the planner." },
      },
    ],
  },
  "reading-a-sailing-forecast": {
    id: "reading-a-sailing-forecast",
    scenes: [
      {
        title: "Reading a sailing forecast",
        narration: "On a charter week, the weather decides the plan. You do not need to be a meteorologist, but you do need to read the wind forecast properly.",
        visual: { kind: "title", icon: "wind" },
      },
      {
        title: "Wind first",
        narration:
          "For sailing, the forecast that matters is the wind. Wind direction is where the wind comes from, so a northerly blows from the north. Forecasts give the mean wind and the gusts. Plan for the gusts, because they are what the boat has to handle.",
        visual: { kind: "points", points: [P("compass", "Direction", "where it comes from"), P("gauge", "Mean wind"), P("wind", "Gusts", "plan for these")] },
      },
      {
        title: "The Beaufort scale",
        narration:
          "Sailors measure wind on the Beaufort scale. Force three, seven to ten knots, is a gentle breeze and lovely sailing. Force four, up to sixteen knots, is great sailing with a few white horses. Force five, up to twenty one knots, means reef early. Force six and above, many charter crews stay in port. A comfortable limit for most crews is force four to five.",
        visual: {
          kind: "table",
          head: ["Force", "Knots", "On a charter yacht"],
          rows: [["3", "7–10", "Gentle: lovely sailing"], ["4", "11–16", "Great sailing, white horses"], ["5", "17–21", "Fresh: reef early"], ["6+", "22+", "Many crews stay in port"]],
        },
      },
      {
        title: "Where to get forecasts",
        narration:
          "Check more than one source. The national weather service of the country you are in forecasts local effects best. Apps that show the weather models help you see the pattern over several days. And the base, the harbour master and other skippers know the local winds.",
        visual: { kind: "points", points: [P("map", "National weather service"), P("phone", "Model apps", "the pattern over several days"), P("users", "The base and local skippers")] },
      },
      {
        title: "How to use them",
        narration:
          "Check every evening for tomorrow, and again in the morning before you leave. If two sources disagree, plan for the stronger one. Wind speeds up round capes and between islands. And in summer it often builds through the day, so sail in the morning and arrive by mid-afternoon.",
        visual: { kind: "points", points: [P("calendar", "Evening and morning"), P("alert", "Sources disagree?", "plan for the stronger"), P("mountain", "Capes and channels", "faster than forecast"), P("sun", "Sail early, arrive by mid-afternoon")], lead: 0 },
      },
    ],
  },
  "mediterranean-winds": {
    id: "mediterranean-winds",
    speak: { maestral: "ma esstrahl", jugo: "yoogo", meltemi: "meltemmy", "Rhône": "Rone", Bonifacio: "Bonifahcho" },
    scenes: [
      {
        title: "The Mediterranean's named winds",
        narration: "The Mediterranean's winds have names, because sailors have met them for thousands of years. Knowing which ones blow where you are sailing tells you what to expect.",
        visual: { kind: "title", icon: "wind" },
      },
      {
        title: "The afternoon sea breeze",
        narration:
          "First, the friendly one. On sunny summer days the land heats up and pulls in a breeze from the sea after lunch. In Croatia it is called the maestral: a north-westerly that builds to a pleasant force three or four and fades at sunset. It gives the classic charter rhythm: a calm morning swim, a good afternoon sail and a quiet evening.",
        visual: { kind: "points", points: [P("sun", "Builds after lunch"), P("wind", "Maestral in Croatia", "north-westerly, force 3–4"), P("sunset", "Fades at sunset")] },
      },
      {
        title: "Meltemi: the Aegean",
        narration:
          "The meltemi is the northerly summer wind of the Aegean, in Greece and Turkey. It is strongest in July and August, and can blow force five to seven for days. It is at its strongest in the afternoon and raises a short, steep sea. So plan to sail south with it in the afternoons, and head north early in the morning.",
        visual: { kind: "points", points: [P("map", "Aegean: Greece and Turkey"), P("calendar", "July and August", "force 5–7, often for days"), P("waves", "Afternoons, steep sea"), P("compass", "Sail south with it", "head north early")], lead: 0 },
      },
      {
        title: "Bora and jugo: the Adriatic",
        narration:
          "In the Adriatic, watch for two winds. The bora is a cold north-easterly that falls off the mountains in sudden, violent gusts, sometimes with little warning. Shelter from the north-east and lay plenty of chain. The jugo is a warm south-easterly that builds over a day or two, often with rain, and sends a heavy swell along the coast.",
        visual: { kind: "points", points: [P("mountain", "Bora", "cold north-easterly, violent gusts"), P("anchor", "Shelter from the north-east", "plenty of chain"), P("rain", "Jugo", "warm south-easterly, swell and rain")] },
      },
      {
        title: "Mistral and tramontana",
        narration:
          "Further west, the mistral is a cold northerly that pours down the Rhône valley and can blow hard for days. It reaches Corsica, Sardinia and the Balearics. The Strait of Bonifacio, between Corsica and Sardinia, can be much windier than a few miles away. And the tramontana is the northerly of the Balearics, Catalonia and Italy.",
        visual: { kind: "points", points: [P("wind", "Mistral", "cold northerly, can last days"), P("map", "Reaches Corsica, Sardinia, Balearics"), P("alert", "Strait of Bonifacio", "much windier"), P("mountain", "Tramontana", "the northerly of the Balearics")], lead: 0 },
      },
      {
        title: "Ask the base",
        narration: "Every charter area has one wind the locals watch. Ask the base which wind they worry about that week, and which harbours give shelter from it.",
        visual: { kind: "tip", icon: "users", text: "Ask the base: which wind are you watching this week, and where is the shelter from it?" },
      },
    ],
  },
  "thunderstorms-and-squalls": {
    id: "thunderstorms-and-squalls",
    scenes: [
      {
        title: "Thunderstorms and squalls",
        narration: "Summer thunderstorms are usually short, but they bring sudden gusts, a wind shift, heavy rain and lightning. The plan is simple: see them coming, and be ready early.",
        visual: { kind: "title", icon: "lightning" },
      },
      {
        title: "The signs",
        narration:
          "Watch for the signs. Tall, building clouds over the land in the afternoon, sometimes with an anvil-shaped top. A dark, low roll of cloud approaching, with a line of white water under it. Thunder in the distance, and a sudden drop in temperature. And take the forecast seriously when it mentions thunderstorms.",
        visual: { kind: "points", points: [P("mountain", "Towering clouds", "anvil-shaped tops"), P("rain", "Dark roll of cloud", "white water beneath"), P("thermometer", "Thunder, sudden chill"), P("phone", "Thunderstorms in the forecast")] },
      },
      {
        title: "Under sail",
        narration:
          "If one is coming while you are sailing, reef or furl early, before the first gusts. Lifejackets on, and everyone in the cockpit or below. Close the hatches and start the engine. Then head for open water, away from the shore and other boats.",
        visual: { kind: "steps", steps: ["Reef or furl early", "Lifejackets on, crew in the cockpit", "Hatches closed, engine on", "Head for open water"], lead: 0 },
      },
      {
        title: "At anchor",
        narration:
          "At anchor, expect the wind to shift to a direction the bay may not shelter you from. Let out more chain if there is room. Start the engine, and keep someone on watch until it passes.",
        visual: { kind: "points", points: [P("compass", "Expect a wind shift"), P("anchor", "More chain if there is room"), P("eye", "Engine on, someone on watch")], lead: 0 },
      },
      {
        title: "Lightning",
        narration:
          "For lightning, stay below as far as you can, away from the mast and the rigging. Nobody goes swimming. Most squalls pass in under an hour, so on a stormy day, plan short hops and be in a safe harbour by early afternoon.",
        visual: { kind: "tip", icon: "lightning", text: "Stay below, away from the mast · no swimming · short hops, safe harbour by early afternoon" },
      },
    ],
  },
  "safe-anchorage-for-the-night": {
    id: "safe-anchorage-for-the-night",
    scenes: [
      {
        title: "A safe anchorage for the night",
        narration:
          "The most common bad night on a charter is an anchorage that was perfect at five in the afternoon, and wide open at two in the morning. Choose your night stop for tonight's wind, not this afternoon's.",
        visual: { kind: "title", icon: "moon" },
      },
      {
        title: "Choosing the bay",
        narration:
          "Before you choose, check the overnight forecast. The bay must be sheltered by land from that direction. No swell should be running in from a distant wind. There must be room to swing in a full circle, and good holding, such as sand or mud. And have a plan B nearby.",
        visual: { kind: "points", points: [P("shield", "Sheltered from tonight's wind"), P("waves", "No swell running in"), P("ruler", "Room to swing"), P("anchor", "Sand or mud"), P("map", "A plan B nearby")], at: [1, 2, 3, 3, 4] },
      },
      {
        title: "Setting the anchor",
        narration:
          "Let out at least four to five times the depth in chain, and more if wind is forecast. Reverse gently, then firmly, and watch two fixed points ashore. If they do not move, the anchor has held. Snorkel over it if the water is clear.",
        visual: { kind: "steps", steps: ["Chain: four to five times the depth", "Reverse gently, then firmly", "Two marks ashore stay still", "Snorkel over the anchor"], lead: 0, at: [0, 1, 2, 3] },
      },
      {
        title: "Through the night",
        narration:
          "Set an anchor alarm on the plotter or a phone. Remember that a cool land breeze can blow down from the hills at night. If the wind rises or turns onshore, move early, while you can still see. And leave the anchor light on.",
        visual: { kind: "points", points: [P("siren", "Anchor alarm on"), P("mountain", "Night land breeze"), P("alert", "Wind turns onshore?", "move early"), P("moon", "Anchor light on")], lead: 0 },
      },
      {
        title: "When in doubt",
        narration: "If the forecast is unsettled, choose a harbour or a mooring buoy for the night. The best anchorage of the week is the one where you sleep well.",
        visual: { kind: "tip", icon: "moon", text: "Unsettled forecast? Take a harbour or a mooring buoy. The best anchorage is the one where you sleep well." },
      },
    ],
  },
  "daily-boat-checks": {
    id: "daily-boat-checks",
    scenes: [
      {
        title: "The five-minute daily checks",
        narration: "Charter boats work hard. A five-minute check every morning, before you start the engine, catches most problems while you are still at anchor.",
        visual: { kind: "title", icon: "wrench" },
      },
      {
        title: "Before you start the engine",
        narration:
          "Before starting, check the engine oil on the dipstick, and the coolant level. Look at the fan belt: tight, and not frayed. Make sure the raw-water strainer is clear and the seacock is open. Check the bilges are dry. And check you have enough fuel for the day, with a reserve.",
        visual: { kind: "points", points: [P("cog", "Oil and coolant"), P("wrench", "Fan belt"), P("waves", "Strainer clear, seacock open"), P("droplets", "Bilges dry"), P("fuel", "Fuel for the day, plus reserve")], lead: 0 },
      },
      {
        title: "After starting",
        narration:
          "Once it is running, make sure cooling water comes out of the exhaust. Listen and look for new noises, smells or smoke. And check there are no warning lights or alarms.",
        visual: { kind: "points", points: [P("waves", "Water from the exhaust"), P("search", "No new noise, smell or smoke"), P("alert", "No warning lights")], lead: 0 },
      },
      {
        title: "On deck",
        narration:
          "Then a quick look on deck. Check the sheets and halyards for chafe. Make sure shackles are closed, and the dinghy is secure with its line clear of the propeller. Keep a notebook of engine hours, fuel and anything unusual.",
        visual: { kind: "points", points: [P("search", "Sheets and halyards", "look for chafe"), P("lock", "Shackles closed, dinghy secure"), P("book", "Log engine hours and fuel")] },
      },
    ],
  },
  "engine-trouble": {
    id: "engine-trouble",
    scenes: [
      {
        title: "Engine trouble",
        narration: "Most engine problems on a charter boat have a few simple causes. Know the safe first checks, and call the base before you try anything more.",
        visual: { kind: "title", icon: "cog" },
      },
      {
        title: "First, the boat",
        narration: "If the engine stops, look after the boat first. Sail if you can, or anchor if it is shallow and safe, and get clear of the shore and other boats before you look at the engine.",
        visual: { kind: "tip", icon: "sailboat", text: "Boat first: sail or anchor, clear of the shore and other boats. Then look at the engine." },
      },
      {
        title: "Overheating",
        narration:
          "If the engine overheats, or no water comes out of the exhaust, stop it. Check that the raw-water seacock is open. Close it, then clean the strainer of weed and plastic. Look for a bag or rope round the propeller or over the water intake. If water still does not flow, the pump may have failed, so call the base. And never open the coolant cap on a hot engine.",
        visual: { kind: "steps", steps: ["Stop the engine", "Seacock open?", "Clean the strainer (seacock closed)", "Anything round the propeller?", "Still no water: call the base", "Never open a hot coolant cap"], lead: 0 },
      },
      {
        title: "It will not start",
        narration:
          "If it will not start, check the gear lever is in neutral, and the kill cord or stop button is reset. Check the battery switch is on. Check there is fuel. And if it turns over but does not fire, stop cranking and call the base.",
        visual: { kind: "steps", steps: ["Neutral, stop button reset", "Battery switch on", "Fuel in the tank", "Turns but will not fire: call the base"], lead: 0 },
      },
      {
        title: "Call the base early",
        narration: "Every base has a breakdown number. Call it early, with your position, the engine hours and what you can see. It is part of the service you paid for.",
        visual: { kind: "tip", icon: "phone", text: "Call the breakdown number early: your position, engine hours and what you see." },
      },
    ],
  },
  "sails-lines-and-winches": {
    id: "sails-lines-and-winches",
    scenes: [
      {
        title: "Sails, lines and winches",
        narration: "Torn sails and jammed furlers are among the most common, and most expensive, charter damage. Nearly all of it is avoidable with a few habits.",
        visual: { kind: "title", icon: "sailboat" },
      },
      {
        title: "Furling",
        narration:
          "Furl the headsail with a little tension on the sheet, so it rolls tightly. Furl on a gentle point of sail, not dead downwind in a strong breeze. And if the furling line is hard to pull, stop and look, and never force it with a winch.",
        visual: { kind: "points", points: [P("sailboat", "A little sheet tension", "rolls tight and even"), P("wind", "On a gentle point of sail"), P("ban", "Hard to pull? Stop and look", "never force it with a winch")], lead: 0 },
      },
      {
        title: "Reefing",
        narration:
          "Reef when you first think about it. It is easy in fifteen knots and hard in twenty five. Reduce sail before a squall, before the afternoon breeze builds, and before you arrive in harbour.",
        visual: { kind: "tip", icon: "wind", text: "Reef when you first think about it: easy in 15 knots, hard in 25." },
      },
      {
        title: "Flogging and chafe",
        narration:
          "A sail flapping hard wears out fast, so sheet it in or furl it. Look for lines rubbing on the guardrails, the shrouds or the sprayhood. And on a run, keep the sails off the spreaders.",
        visual: { kind: "points", points: [P("wind", "No flogging", "sheet in or furl"), P("search", "Look for chafe", "re-lead rubbing lines"), P("sailboat", "Off the spreaders downwind")], lead: 0 },
      },
      {
        title: "Winches and lines",
        narration:
          "Put three or four turns on the winch, clockwise, and keep your fingers clear of the drum. Take the handles out when you are not using them, because they go over the side easily. And keep lines coiled, out of the water and away from the propeller.",
        visual: { kind: "points", points: [P("rotate", "Three or four turns, clockwise"), P("lock", "Handles out when not in use"), P("cog", "Lines out of the water")], lead: 0 },
      },
    ],
  },
  "dinghy-and-outboard": {
    id: "dinghy-and-outboard",
    speak: QUAY,
    scenes: [
      {
        title: "The dinghy and outboard",
        narration: "The dinghy is your car for the week. It takes you ashore for dinner, to the beach and to the shops, so look after it.",
        visual: { kind: "title", icon: "anchor" },
      },
      {
        title: "The outboard",
        narration:
          "Check the fuel before every trip, and ask at check-in whether it takes plain petrol or a petrol and oil mix. Clip the kill cord to the driver, so the engine stops if they fall out. Tilt the engine up before the beach. And go slowly near swimmers and in harbours.",
        visual: { kind: "points", points: [P("fuel", "Fuel before every trip", "plain petrol or a mix?"), P("lifebuoy", "Kill cord on the driver"), P("waves", "Tilt up before the beach"), P("users", "Slow near swimmers")], lead: 0 },
      },
      {
        title: "Ashore and at night",
        narration:
          "Ashore, pull the dinghy well up the beach, or tie it where it will not rub against the quay. Lock it at night and in towns, because dinghies do get stolen. And at the boat, lift it on the davits or tie it short, so it cannot bang on the hull or drift away.",
        visual: { kind: "points", points: [P("anchor", "Well up the beach, or tied clear"), P("lock", "Locked at night and in towns"), P("moon", "Lifted or tied short at the boat")], lead: 0 },
      },
      {
        title: "Towing",
        narration: "Tow only in calm water and for short distances, never with the outboard on, and keep the line away from your propeller.",
        visual: { kind: "tip", icon: "sailboat", text: "Tow only in calm water, short distances, outboard off, line clear of the propeller." },
      },
    ],
  },
  "when-something-breaks": {
    id: "when-something-breaks",
    scenes: [
      {
        title: "When something breaks",
        narration: "Things break on boats, even well-kept ones. Handled calmly and reported early, most breakages are a short call and a quick fix by the base.",
        visual: { kind: "title", icon: "wrench" },
      },
      {
        title: "What to do",
        narration:
          "First, make the boat and the crew safe. Then call the base's breakdown number, with your position, what happened and what you can see. Photos of the problem help them. Write down what happened and when. And ask before you repair anything yourself, keeping every receipt.",
        visual: { kind: "steps", steps: ["Boat and crew safe", "Call the base: position and what you see", "Photos and notes", "Ask before repairing, keep receipts"], lead: 0, at: [0, 1, 2, 4] },
      },
      {
        title: "Wear and tear, or damage?",
        narration:
          "Normal wear and tear is the operator's responsibility. Damage caused by the crew, such as a grounding or a torn sail, usually comes out of the deposit or the damage waiver. Reporting early is in your interest, because hidden damage found at check-out tends to cost more.",
        visual: { kind: "points", points: [P("cog", "Wear and tear", "the operator's responsibility"), P("euro", "Crew damage", "deposit or damage waiver"), P("check", "Report early", "it usually costs less")], lead: 0 },
      },
    ],
  },
};

/** Every sentence a how-to video speaks, in order. */
export function howToSentences(s: HowToScript, split: (text: string) => string[]): string[] {
  return s.scenes.flatMap((sc) => split(sc.narration));
}
