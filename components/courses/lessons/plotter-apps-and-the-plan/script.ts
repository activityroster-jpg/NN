import type { LessonScript } from "@/lib/courses/navigation/scripts";

// The spoken script of the lesson video. Plain data: the narration API
// records it ahead of time and the tests check it reads well.

export const plotterAppsAndThePlan: LessonScript = {
  slug: "plotter-apps-and-the-plan",
  speak: { AIS: "A I S", VHF: "V H F" },
  scenes: [
    {
      title: "The plotter, the apps and the plan",
      narration:
        "This lesson brings the electronics and the week together. First the chart plotter, and the charting apps on your phone and tablet. " +
        "Then AIS and the VHF radio, the two that talk to other boats. And finally the plan for seven days, so you are back at the base on Friday evening.",
    },
    {
      title: "Zoom hides detail",
      narration:
        "Zoom the plotter out to see the whole day, and the route looks clear. " +
        "But a zoomed-out plotter leaves things off: soundings, small rocks, sometimes whole reefs. " +
        "Zoom in along every leg, and that same line may cross a rock. " +
        "Zoom in too far and the opposite happens: the chart looks more precise than the survey behind it. " +
        "So check each leg zoomed in, and keep a sensible distance off every danger.",
      seconds: 26,
    },
    {
      title: "How old is the chart?",
      narration:
        "The chart in a charter plotter may not have been updated for years. " +
        "And every chart is only as good as its survey, and some surveys were made with a lead line long ago. " +
        "In parts of the Caribbean, the Seychelles and Thailand, a reef can sit a little away from where the screen puts it. " +
        "Near reefs, read the water with your eyes, and go slowly with someone on the bow.",
    },
    {
      title: "Position, heading and course over the ground",
      narration:
        "The plotter shows three different things, and they are easy to mix up. " +
        "Position is where you are, worked out from the satellites. " +
        "Heading is the way the bow points, from the compass. " +
        "Course over the ground is the way you are actually moving, and with a current or leeway it is not the same. " +
        "If the course over the ground points at a rock, that is where you are going, whatever the bow says.",
    },
    {
      title: "Waypoints, routes and tracks",
      narration:
        "A waypoint is a position you store in the plotter, such as the start of a harbour approach. " +
        "Never put one on a buoy or a rock: set it off in clear water, on the safe side. " +
        "A route joins waypoints into legs, and the plotter shows the distance and time to the next one. " +
        "The track is the trail of where you have been, which can lead you back out of a bay you came into. " +
        "And every plotter has a man overboard button, which marks the spot the moment you press it. " +
        "Find it at the briefing, and press it first if anyone goes over the side.",
    },
    {
      title: "Phones and tablets",
      narration:
        "A charting app on a phone or tablet is a superb second opinion, and good for planning in the cockpit. " +
        "Download the charts for the whole area before you leave Wi-Fi, because mobile signal at sea comes and goes. " +
        "Your phone finds its position without mobile signal, but navigating on it flattens the battery in a few hours. " +
        "In the sun a phone can also overheat and switch itself off, just when you need it. " +
        "So keep it charged, in the shade, in a waterproof case, and never rely on it alone.",
    },
    {
      title: "AIS",
      narration:
        "AIS shows other ships on the plotter, with their name, course and speed. " +
        "Big ships and passenger ferries must transmit it, and many yachts do too, while some charter boats only receive. " +
        "The plotter can work out how close a ship will pass, and when, if nobody changes course. " +
        "But fishing boats, small motor boats and many yachts do not show at all, so keep looking out.",
      seconds: 22,
    },
    {
      title: "The VHF radio",
      narration:
        "The VHF radio is the boat's telephone to the coastguard, the marinas and other boats. " +
        "Channel 16 is for distress, safety and calling, and you keep it switched on at sea. " +
        "To call a marina, use the channel in the pilot book, which is often not 16. " +
        "Say the marina's name twice, then this is, and your boat's name twice, and wait for the reply. " +
        "Keep it short, and move to a working channel if they ask you to. " +
        "Mayday is only for grave and immediate danger to the boat or a person. " +
        "In outline, you say Mayday three times, the boat's name, where you are, what is wrong, what help you need and how many are on board. " +
        "If your radio has a red distress button, press and hold it first, and read the card by the radio at the briefing.",
    },
    {
      title: "Seven days",
      narration:
        "A charter week is seven days, but only six of them are for sailing. " +
        "You check in on Saturday, sail from Sunday to Friday, and hand the boat back on the next Saturday morning. " +
        "Keep most days to ten to twenty miles, three or four hours at sea, with time to swim and eat ashore. " +
        "Leave room for a rest day, or a short day, in the middle of the week. " +
        "Put the longest passage and the furthest point early, while the forecast is clear and you have days in hand. " +
        "Read the week's forecast at check-in, and move the plan round the windy days. " +
        "And for every day, know your bolt-hole, the nearest shelter if it goes wrong.",
    },
    {
      title: "Back on Friday",
      narration:
        "Every one of our cruising guides ends where it started, at the base marina, on Friday evening. " +
        "Most bases want you in by late afternoon, refuelled, for the inspection. " +
        "So aim to be within an easy half day of the base by Thursday night, in case Friday is windy. " +
        "If the weather stops you getting back, call the base early, and never sail into bad weather to make the deadline. " +
        "That is the end of the lessons, and next comes the final check.",
    },
  ],
};
