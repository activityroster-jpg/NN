import type { LessonScript } from "@/lib/courses/navigation/scripts";

// The spoken script of the lesson video. Plain data: the narration API
// records it ahead of time and the tests check it reads well.

export const anchoringAndMooring: LessonScript = {
  slug: "anchoring-and-mooring",
  speak: { quay: "key" },
  scenes: [
    {
      title: "A night at anchor",
      narration:
        "A quiet night at anchor in a clear bay is one of the best things about a charter. " +
        "This lesson covers how to choose the spot, how much chain to let out, and how to know the anchor is holding. " +
        "Then we take a line ashore, and pick up a mooring buoy.",
    },
    {
      title: "Choosing the anchorage",
      narration:
        "Choose the anchorage over breakfast, with the chart and the pilot book open. " +
        "First, shelter: the bay must be protected from the wind that is forecast, tonight as well as now. " +
        "Second, depth: somewhere between about three and twelve metres is comfortable for a charter yacht. " +
        "Third, the seabed: the chart and the pilot book tell you whether it is sand, mud, weed or rock. " +
        "Fourth, room to swing, clear of rocks, swimming areas and the boats already there. " +
        "On the practice chart, Kerran Roads is sheltered from southerly winds, but wide open to the north.",
      seconds: 34,
    },
    {
      title: "The seabed",
      narration:
        "Sand is the best holding, and mud is good too. " +
        "Weed is poor: the anchor skates over it, or pulls up a clump and drags. " +
        "In the Mediterranean the weed is often Posidonia, a seagrass that grows in dark meadows on the seabed. " +
        "It is protected, and in parts of the Mediterranean, such as the Balearics, anchoring on it can bring a heavy fine. " +
        "So look down through the clear water, and drop the anchor on a light, sandy patch. " +
        "Rock and coral are no good at all: the anchor cannot dig in, and coral is easily destroyed.",
    },
    {
      title: "How much chain",
      narration:
        "The length of chain you let out is called the scope. " +
        "Measure the depth from the bow roller, so add the height of the bow, about a metre, to the depth of the water. " +
        "In settled weather, let out four to five times that depth. " +
        "If wind is forecast, let out more: seven times, if you have the room. " +
        "So in eight metres of water, eight plus one is nine, and five times nine is forty-five metres of chain. " +
        "The chain is often marked with paint or coloured tags every ten metres, so ask at the briefing what the colours mean. " +
        "And check how much chain the boat carries, because a deep bay can take all of it.",
    },
    {
      title: "Dropping and setting the anchor",
      narration:
        "Brief the crew and agree hand signals, because the helm cannot hear the bow over the engine. " +
        "Approach slowly, head to wind, and stop where you want the anchor to lie. " +
        "Lower the anchor to the seabed, then let the boat drift or motor gently astern as the chain runs out. " +
        "Never dump the chain in a heap on top of the anchor. " +
        "At about three times the depth, pause, and let the chain come taut so the anchor bites. " +
        "Then let out the rest, and go astern firmly for a minute to dig it in. " +
        "Last, put on the snubber, a rope bridle that takes the load off the windlass.",
    },
    {
      title: "Is it holding?",
      narration:
        "While you go astern, and again after an hour, check that the anchor is holding. " +
        "Pick a transit abeam: two things ashore, one behind the other, such as a chapel and a rock on the shore. " +
        "If they stay in line, you are not moving, but if they open up, you are dragging. " +
        "The plotter track helps too: a boat at anchor draws a neat arc, a dragging boat draws a line. " +
        "Set an anchor alarm on the plotter or a phone, measured from where the anchor went down, not from where the boat is. " +
        "If it drags, do not argue with it: lift the anchor and try again, somewhere else if need be.",
      seconds: 34,
    },
    {
      title: "Swinging room",
      narration:
        "A boat at anchor swings around it as the wind changes, so it needs a circle of clear water. " +
        "The radius is about the length of chain plus the length of the boat. " +
        "With forty metres of chain on a twelve metre boat, that is fifty-two metres in every direction. " +
        "Other boats swing too, so drop where you will lie like your neighbours, not on top of their anchor. " +
        "The first boat in has the spot, so leave room around the boats already there. " +
        "Then check your circle reaches no shallows, rocks or swimming areas, even if the wind swings right round in the night.",
      seconds: 34,
    },
    {
      title: "Lines ashore",
      narration:
        "In narrow coves in Croatia, Greece and Turkey there is no room to swing, so boats take a line ashore. " +
        "Drop the anchor well out, then reverse towards the shore, letting out chain. " +
        "A crew member takes a long floating line ashore by dinghy, or swims it, and passes it round a rock, a tree or a ring. " +
        "Bring the end back to the boat, so you can let go from on board. " +
        "Then tighten the chain, so the boat sits between the anchor and the shore and cannot swing. " +
        "Stern-to on a town quay, the Med mooring, works much the same way, with the quay in place of the tree.",
    },
    {
      title: "Mooring buoys",
      narration:
        "Many bays now have mooring buoys instead, and in some you must use them. " +
        "In Croatia, paid buoy fields fill the popular bays, and someone comes by in a boat to collect the fee. " +
        "In the British Virgin Islands, the National Parks moorings are for day use, with a permit and a time limit. " +
        "Approach slowly into the wind, or the way the other boats are lying, with a crew member at the bow pointing at the buoy. " +
        "Pick up the line on the buoy with the boat hook, pass your own line through its loop, and bring both ends back to a cleat. " +
        "Check the buoy is meant for a boat your size, and never tie up to a private buoy without asking. " +
        "Next, the rules of the road.",
    },
  ],
};
