import type { LessonScript } from "@/lib/courses/navigation/scripts";

// The spoken script of the lesson video. Plain data: the narration API
// records it ahead of time and the tests check it reads well.

export const lateralMarksAAndB: LessonScript = {
  slug: "lateral-marks-a-and-b",
  speak: { IALA: "Eye-ah-la" },
  scenes: [
    {
      title: "Signposts at sea",
      narration:
        "Buoys and beacons are the road signs of the sea. They mark the edges of channels, warn of rocks and shallows, and lead you into harbour. " +
        "Nearly every country lays them to one scheme, the IALA buoyage system. " +
        "But the world is split into two regions, A and B, and the difference between them catches charter skippers out every summer.",
    },
    {
      title: "The direction of buoyage",
      narration:
        "Lateral marks show the two sides of a channel: port on one side, starboard on the other. " +
        "But your port side becomes your starboard side when you turn round, so the marks need an agreed direction. " +
        "That is the direction of buoyage: the way you go when you come in from the sea, towards a harbour, a river or a bay. " +
        "Along open coasts the authorities set it, and the chart shows it with a magenta arrow wherever it is not obvious.",
    },
    {
      title: "Region A: red to port",
      narration:
        "Start with Region A, which covers every Mediterranean charter area, the Seychelles and Thailand. " +
        "Going in, with the direction of buoyage, the marks on your port side are red. " +
        "A port-hand mark is usually a can, with a flat top, and if it has a topmark, that is a red can too. " +
        "The marks on your starboard side are green, usually cone-shaped, with a green cone on top, pointing up. " +
        "So in Region A, going in, it is red cans to port and green cones to starboard.",
    },
    {
      title: "Into Port Kerran",
      narration:
        "Here is the approach to Port Kerran on the practice chart, which is laid out in Region A. " +
        "Coming in from the sea, you head north up the channel, with the direction of buoyage. " +
        "The green cones, number one and number three, pass down your starboard side. " +
        "The red cans, number two and number four, pass down your port side. " +
        "Keep between them, and do not cut the corners, because the marks show the edge of the channel only where they stand.",
      seconds: 30,
    },
    {
      title: "Lights at night",
      narration:
        "At night you see only the lights, and on a lateral mark the colour of the light matches the colour of the mark. " +
        "So in Region A, a red light is a port-hand mark and a green light is a starboard-hand mark. " +
        "The rhythm tells you which buoy is which: number one flashes green once every five seconds, and number three flashes green twice. " +
        "Count the flashes, time the cycle, and match what you see to the chart.",
    },
    {
      title: "Leaving harbour",
      narration:
        "Leaving harbour, you are going against the direction of buoyage, so everything reverses. " +
        "The red marks now pass down your starboard side, and the green ones down your port side. " +
        "The marks have not changed, you have turned round. " +
        "Say it out loud before you slip the lines: going out, red to starboard.",
    },
    {
      title: "Preferred channel marks",
      narration:
        "Where a channel divides, a lateral mark with a broad band of the other colour shows the main, or preferred, channel. " +
        "Read its main colour and its shape, and treat it as that mark. " +
        "A red can with a green band is a port-hand mark in Region A, so keep it to port, and the preferred channel lies to starboard. " +
        "At night it shows a light in its main colour, flashing two, then one.",
    },
    {
      title: "Region B: red right returning",
      narration:
        "Now cross the Atlantic. " +
        "The Americas, including the British Virgin Islands and the rest of the Caribbean, use Region B, and so do Japan, South Korea and the Philippines. " +
        "In Region B the colours swap sides: going in, the red marks are on your starboard side and the green ones on your port side. " +
        "Americans remember it as red, right, returning: red on your right as you return from the sea. " +
        "The shapes do not swap, so going in, the cans are still to port and the cones to starboard. " +
        "In the British Virgin Islands, then, a red cone is a starboard-hand mark and a green can is a port-hand mark.",
      seconds: 34,
    },
    {
      title: "Which region is your charter in?",
      narration:
        "Before every charter, check which region you will be sailing in. " +
        "Croatia, Greece, Italy, Spain, Corsica, Montenegro and Turkey are all Region A. " +
        "So are the Seychelles and Thailand. " +
        "The British Virgin Islands are Region B, so on a Caribbean charter you keep red to starboard coming in. " +
        "The rest of the system, the cardinal, danger, safe water and special marks, is the same in both regions.",
    },
    {
      title: "Shape first, then colour",
      narration:
        "Into a low sun every buoy looks black, but the shapes still show: a can is port-hand and a cone is starboard-hand, in either region. " +
        "So find the direction of buoyage, then read the shape, then the colour. " +
        "In Region A, going in, it is red to port, and in Region B it is red to starboard. " +
        "Next, the yellow and black cardinal marks, and the rest of the family.",
    },
  ],
};
