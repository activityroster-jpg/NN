import type { LessonScript } from "@/lib/courses/navigation/scripts";

// The spoken script of the lesson video. Plain data: the narration API
// records it ahead of time and the tests check it reads well. Captions show
// bearings as figures; `speak` says them one figure at a time. The figures
// come from the practice chart (data.ts); tests/courses.test.ts checks they agree.

export const pilotageIntoAHarbour: LessonScript = {
  slug: "pilotage-into-a-harbour",
  speak: {
    VHF: "V H F",
    "000°T": "zero zero zero true",
    "003°M": "zero zero three magnetic",
    "027°T": "zero two seven true",
    "030°M": "zero three zero magnetic",
  },
  scenes: [
    {
      title: "Pilotage into a harbour or bay",
      narration:
        "Most charter trouble happens in the last mile, in the afternoon, with everyone tired. " +
        "Pilotage is navigating by eye in that last mile, close to the rocks and the other boats. " +
        "There is no time then to study the chart. " +
        "So the thinking is done beforehand, and on deck you look, compare and tick things off.",
    },
    {
      title: "Read the pilot book page",
      narration:
        "Start with the pilot book page for the harbour or bay. " +
        "It tells you which way to approach, what dangers lie off the entrance, and what you will see on the way in. " +
        "It gives the lights, the depths and where visitors berth or anchor. " +
        "It says which way the bay is open, and so which wind sends a swell inside. " +
        "Read it the evening before, and again an hour out.",
    },
    {
      title: "Plan the approach",
      narration:
        "Now plan the way in on the chart, from a point you can recognise offshore. " +
        "Here it starts at the Kerran Approach buoy, a safe water mark with deep water all round it. " +
        "Break the approach into legs, from one mark you can recognise to the next. " +
        "For each leg, note the heading, the distance and what you expect to see. " +
        "Leg one is 003°M, one point six miles, about nineteen minutes at five knots.",
      seconds: 22,
    },
    {
      title: "Leading lines",
      narration:
        "Many harbours mark the safe way in with a leading line: two marks or lights, one behind and above the other. " +
        "Port Kerran's leading lights are in line on 000°T, straight up the middle of the channel. " +
        "If the rear light opens to the left of the front one, you are left of the line, so steer to starboard. " +
        "If it opens to the right, steer to port. " +
        "In short, steer towards the rear light until the two line up again.",
      seconds: 22,
    },
    {
      title: "Clearing bearings",
      narration:
        "Sometimes a danger lies near your way in, with no leading line to keep you clear. " +
        "Arriving from the south-west, the wreck and Mew Rock lie to the west of the approach. " +
        "So draw a line from the church spire that passes well clear of both, and measure it: 027°T, which is 030°M. " +
        "Keep the spire bearing not more than that, and you stay on the safe side. " +
        "Check it every few minutes with the hand-bearing compass until you are past.",
      seconds: 24,
    },
    {
      title: "Picking the gap",
      narration:
        "From a few miles out, a harbour entrance can be very hard to see against the land. " +
        "Look for the lighthouse, the end of the breakwater, or boats going in and out. " +
        "Check the bearing of the entrance on the plotter, and look along it with the hand-bearing compass. " +
        "Where the way in is through coral, as in the Caribbean, go with the sun high and behind you, so you can read the colour of the water. " +
        "Then line up on the approach well outside, rather than cutting the corner.",
    },
    {
      title: "The last mile",
      narration:
        "Slow down for the last mile. " +
        "Take the sails down outside the entrance, where there is room. " +
        "Get the fenders out and the lines ready, and brief the crew on which side and what happens when. " +
        "Watch the depth, and decide in advance what reading means stop. " +
        "And know your way out, back along the line you came in on.",
    },
    {
      title: "Calling the marina",
      narration:
        "Call the marina before you arrive, by phone or on the VHF channel in the pilot book. " +
        "Give the boat's name, her length, and how many nights you want. " +
        "They will tell you where to go, and often a marinero comes out in a dinghy to guide you in. " +
        "In most Mediterranean marinas you then go in stern-to, using the lazy line they hand you. " +
        "Stern-to mooring is a skill of its own, and our Med mooring video shows it step by step.",
    },
    {
      title: "Arrive with daylight",
      narration:
        "Plan every day to arrive with plenty of daylight left. " +
        "Charter contracts often ban sailing at night, and unlit fishing floats and moorings are hard to see after dark. " +
        "In the Seychelles it is dark by about half past six, all year round. " +
        "So aim to be in by mid-afternoon, and if you are running late, choose the easier harbour.",
    },
  ],
};
