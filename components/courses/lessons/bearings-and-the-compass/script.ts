import type { LessonScript } from "@/lib/courses/navigation/scripts";

// The spoken script of the lesson video. Plain data: the narration API
// records it ahead of time and the tests check it reads well. The bearings
// in the captions are written as figures; `speak` says them the way a
// navigator does, one figure at a time. The figures match the practice
// chart (lines.ts: WORKED) and tests/courses.test.ts checks they agree.

export const bearingsAndTheCompass: LessonScript = {
  slug: "bearings-and-the-compass",
  speak: {
    "090°": "zero nine zero",
    "180°": "one eight zero",
    "270°": "two seven zero",
    "045°": "zero four five",
    "336°M": "three three six magnetic",
    "333°T": "three three three true",
  },
  scenes: [
    {
      title: "Bearings and the compass",
      narration:
        "A bearing is simply a direction, measured from north. With a compass and a few bearings you can check where you are without any screen at all. " +
        "This lesson covers the compass, true and magnetic north, the hand-bearing compass, fixes and transits. " +
        "And it ends with a quick check for when the plotter and your eyes disagree.",
    },
    {
      title: "Three hundred and sixty degrees",
      narration:
        "Directions are measured in degrees, clockwise from north, all the way round to three hundred and sixty. " +
        "East is 090°, south is 180° and west is 270°. " +
        "Always use three figures, so north-east is 045°, never forty-five. " +
        "Say each figure on its own, the same way on deck and on the radio. " +
        "The opposite direction, called the reciprocal, is always one hundred and eighty degrees away.",
    },
    {
      title: "True and magnetic",
      narration:
        "The chart is drawn to true north, the direction of the North Pole. " +
        "A compass points to magnetic north, which is in a slightly different place. " +
        "The difference is called variation, and it is printed in the middle of the compass rose on the chart. " +
        "Across the Mediterranean it is only a few degrees east, so many skippers barely notice it. " +
        "In the British Virgin Islands it is more than ten degrees west, which is far too much to ignore. " +
        "On the Kerran practice chart it is three degrees west, and that is the figure this course uses.",
      seconds: 26,
    },
    {
      title: "The steering compass",
      narration:
        "The steering compass sits in front of the helm. " +
        "Its card keeps pointing north while the boat turns around it. " +
        "The mark on the bowl, called the lubber line, shows the heading the boat is on. " +
        "Iron and electronics close by can pull it a degree or two, which is called deviation, and on a charter you can usually ignore it.",
    },
    {
      title: "The hand-bearing compass",
      narration:
        "A hand-bearing compass is a small compass you hold up to your eye. " +
        "Stand clear of the steering compass, the engine and the speakers, and brace yourself against the boat. " +
        "Point it at a charted landmark, wait for the card to settle, and read the figure. " +
        "Note it straight away, with the time. " +
        "Here the church spire reads 336°M.",
      seconds: 18,
    },
    {
      title: "A position line",
      narration:
        "Convert the reading to true before it goes on the chart. " +
        "Variation west, magnetic best, so take three off: 336°M is 333°T. " +
        "Now draw that line on the chart, through the spire and back out to sea. " +
        "You are somewhere on that line, but one line cannot say where.",
      seconds: 16,
    },
    {
      title: "A fix from two or three bearings",
      narration:
        "Take a second bearing, of something well round to one side, and draw that line too. " +
        "Where the two lines cross is your fix. " +
        "A third bearing is the check, because three good lines meet in a small triangle, called a cocked hat. " +
        "Choose objects spread well apart, ideally sixty to ninety degrees, not nearly in line. " +
        "If the triangle is large, one of the bearings is wrong, so check which landmark you really used.",
      seconds: 22,
    },
    {
      title: "Transits",
      narration:
        "When two charted objects line up, one behind the other, they are in transit. " +
        "You are then exactly on the line through them, with no compass needed at all. " +
        "Here the church spire comes into line with the radio mast. " +
        "Harbours often build one on purpose, with two leading lights, and Lesson 8 uses them to bring you in.",
      seconds: 16,
    },
    {
      title: "When the plotter and your eyes disagree",
      narration:
        "Sometimes the plotter puts you where your eyes say you cannot be. " +
        "Make a quick check. " +
        "Pick a landmark you are sure of, and read its bearing from the plotter position. " +
        "Then take its real bearing with the hand-bearing compass. " +
        "If the two differ by more than a few degrees, slow down, watch the depth and trust what you can see until you know why.",
    },
  ],
};
