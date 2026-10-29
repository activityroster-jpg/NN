import type { LessonScript } from "@/lib/courses/navigation/scripts";

// The spoken script of the lesson video. Plain data: the narration API
// records it ahead of time and the tests check it reads well. Lefkas to
// Vathi (15 miles) is the first leg of our Ionian cruising guide.

export const distanceSpeedAndTime: LessonScript = {
  slug: "distance-speed-and-time",
  speak: { "60D = ST": "sixty D equals S T" },
  scenes: [
    {
      title: "How far, how long, when?",
      narration:
        "Every charter day starts with three questions: how far is it, how long will it take, and when will we get there? " +
        "This lesson answers all three, with a pair of dividers and one simple rule. " +
        "Then we use them to plan a day that leaves time for a swim, and gets you in before the afternoon wind.",
    },
    {
      title: "Nautical miles and knots",
      narration:
        "At sea, distance is measured in nautical miles. " +
        "A nautical mile is one minute of latitude, which is 1,852 metres, a little longer than a mile on land. " +
        "Speed is measured in knots, and one knot is one nautical mile an hour. " +
        "So a yacht making six knots covers six miles in an hour, and you never need to say knots per hour.",
    },
    {
      title: "Measuring with dividers",
      narration:
        "To measure a distance on the chart, open the dividers so that one point sits on each end of the line. " +
        "Without changing the spread, carry them to the latitude scale at the side of the chart, level with where you measured. " +
        "Read the minutes and tenths between the points, and that is the distance in miles. " +
        "Never use the longitude scale along the top or bottom, because away from the equator a minute of longitude is shorter than a mile.",
    },
    {
      title: "Longer passages",
      narration:
        "For a longer passage, set the dividers to one mile on the latitude scale and walk them along the line, counting the steps. " +
        "Then measure the short gap that is left, and add it on. " +
        "Most passages have several legs, so measure each one and add them up. " +
        "The route tool on the plotter does the same sum, but check it against the chart once, so you know you can trust it.",
    },
    {
      title: "60D = ST",
      narration:
        "Distance, speed and time are linked by one rule. " +
        "At sea we count time in minutes, so the rule is written 60D = ST. " +
        "D is the distance in miles, S is the speed in knots, and T is the time in minutes. " +
        "Cover the one you want in the triangle, and the other two tell you how to find it. " +
        "The handiest version of all: at six knots, a mile takes ten minutes. " +
        "And for quick sums, six minutes is a tenth of an hour, so in six minutes you cover a tenth of your speed.",
    },
    {
      title: "A day in the Ionian",
      narration:
        "Lefkas to Vathi on Meganisi is about fifteen miles. " +
        "At five knots, the time is sixty times fifteen, divided by five, which is 180 minutes, or three hours. " +
        "Leave at ten, and you should be there at one, in time for lunch. " +
        "Watch the calculator, though: 3.5 hours is three hours thirty, not three hours fifty.",
    },
    {
      title: "Sizing a charter day",
      narration:
        "A good charter day is fifteen to twenty miles. " +
        "At five to six knots that is three to four hours of sailing, which leaves time for a swim stop and a long lunch. " +
        "Plan on five knots: the boat may do seven, but light winds, tacking and stops all pull the average down. " +
        "Sailing upwind, the distance through the water can be half as far again as the line on the chart, so allow more time or use the engine. " +
        "Thirty miles in a day is a long passage, so save it for a settled forecast.",
    },
    {
      title: "Arrive in good time",
      narration:
        "Now work backwards from when you want to arrive. " +
        "In much of the Mediterranean the breeze builds through the afternoon, and berthing stern-to in a crosswind is the hardest job of the day. " +
        "Popular harbours and buoy fields also fill by mid-afternoon in summer, so aim to be in by about three. " +
        "Charter contracts usually forbid sailing after dark, so never plan to arrive close to sunset. " +
        "In the Seychelles it is dark by about half past six all year round, so the margin is smaller than it feels. " +
        "Eighteen miles at five knots is three hours and thirty-six minutes, so to be in by three with an hour for lunch, leave by twenty past ten. " +
        "Next, we take bearings with the compass.",
    },
  ],
};
