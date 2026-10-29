import type { LessonScript } from "@/lib/courses/navigation/scripts";

// The spoken script of the lesson video. Plain data: the narration API
// records it ahead of time and the tests check it reads well.

export const cardinalAndOtherMarks: LessonScript = {
  slug: "cardinal-and-other-marks",
  scenes: [
    {
      title: "Marks named after the compass",
      narration:
        "Lateral marks show the sides of a channel, but many dangers lie out in open water, off a headland or in the middle of a bay. " +
        "Cardinal marks guard them using the points of the compass. " +
        "Imagine lines drawn out from the danger to the north-east, south-east, south-west and north-west. " +
        "They split the sea around it into four quadrants: north, east, south and west. " +
        "A cardinal mark sits in one of them, and you pass on its named side, so you pass north of a north cardinal.",
    },
    {
      title: "North and south",
      narration:
        "Every cardinal mark is black and yellow, with two black cones on top, and the cones are the quickest way to read it. " +
        "A north cardinal has both cones pointing up, and it is black above yellow. " +
        "A south cardinal has both cones pointing down, and it is yellow above black. " +
        "The cones always point to where the black is.",
    },
    {
      title: "East and west",
      narration:
        "An east cardinal has its cones base to base, like an egg, and it is black with a yellow band. " +
        "A west cardinal has its cones point to point, like a wine glass, and it is yellow with a black band. " +
        "Again the cones point to the black: out to the top and bottom on the east mark, in to the middle on the west.",
    },
    {
      title: "Lights like a clock face",
      narration:
        "Every cardinal light is white, and it flashes quick or very quick. " +
        "Now picture a clock face. " +
        "East is at three o'clock and flashes in threes, south is at six and flashes six, and west is at nine and flashes nine. " +
        "North, at twelve, flashes without a break. " +
        "South adds one long flash after its six, so it cannot be mistaken for three or nine.",
      seconds: 30,
    },
    {
      title: "Passing The Teeth",
      narration:
        "On the practice chart, The Teeth are rocks east of Gull Point, guarded by two cardinal marks. " +
        "North Teeth buoy is a north cardinal, so you keep to the north of it. " +
        "East Teeth buoy is an east cardinal, so you pass east of it, well clear of the rocks. " +
        "Never cut between a cardinal mark and the danger it guards.",
      seconds: 26,
    },
    {
      title: "Isolated danger",
      narration:
        "An isolated danger mark sits right on top of a small danger, such as a single rock, with safe water all round it. " +
        "It is black with a broad red band, and its topmark is two black balls, one above the other. " +
        "At night it flashes white in groups of two: two balls, two flashes. " +
        "You can pass either side, but give it a wide berth, because the mark does not show how far the danger spreads. " +
        "You will see them on rocks and shoals all over the Mediterranean.",
    },
    {
      title: "Safe water",
      narration:
        "A safe water mark has red and white vertical stripes, and a single red ball on top. " +
        "It marks no danger at all, because there is safe water all round it. " +
        "You find it at the seaward end of a channel, or as the first mark to look for when you arrive from sea. " +
        "Its white light has an even, unhurried rhythm, such as one long flash every ten seconds.",
    },
    {
      title: "Special marks",
      narration:
        "Yellow marks are special marks, with a yellow cross on top if they have a topmark, and a yellow light if they are lit. " +
        "They do not guide you in, they mark an area, and the chart or pilot book says what it is. " +
        "In the Mediterranean you will meet two kinds above all. " +
        "Lines of yellow buoys off a beach mark a swimming area, so anchor the yacht outside them and take the tender in slowly, by the marked lane if there is one. " +
        "Yellow buoys and lights round a block of floating pens mark a fish farm, so give it room and never anchor or tie up to it. " +
        "Cables, outfalls and racing marks can be yellow too, so always check the chart.",
      seconds: 40,
    },
    {
      title: "The emergency wreck marking buoy",
      narration:
        "One mark is newer than the rest: the emergency wreck marking buoy. " +
        "It has blue and yellow vertical stripes, and a yellow upright cross on top. " +
        "At night it flashes blue and yellow, one after the other. " +
        "It marks a new wreck that is not yet on the charts, so keep well clear.",
    },
    {
      title: "Reading any mark",
      narration:
        "These marks are the same in Region A and Region B, so they read the same in Greece and in the British Virgin Islands. " +
        "By day, look at the topmark first, then the colours. " +
        "By night, read the colour of the light, then count the flashes. " +
        "Then ask two questions: what is it, and what does it tell me to do? " +
        "Next, lights at night, and why charter companies ask you to arrive by daylight.",
    },
  ],
};
