import type { LessonScript } from "@/lib/courses/navigation/scripts";

// The spoken script of the lesson video. Plain data: the narration API
// records it ahead of time and the tests check it reads well.

export const navigatingOnACharter: LessonScript = {
  slug: "navigating-on-a-charter",
  scenes: [
    {
      title: "Welcome",
      narration:
        "Welcome to Navigation for charter skippers, from Nautical Nomads. This course is for people who charter a yacht for a week, with a skipper or on their own. " +
        "By the end you will know how to read the chart, what the marks mean, how to get into a harbour, and how to plan a week that works. Let us start with what a charter skipper actually does.",
    },
    {
      title: "What is on board",
      narration:
        "On a charter yacht the navigation kit is nearly always the same. A chart plotter at the helm, with the electronic chart and your position on it. " +
        "A paper chart of the area, usually in the saloon. A pilot book, with a page for every harbour and bay. And a tablet or phone with a charting app, as a second opinion.",
    },
    {
      title: "Three jobs",
      narration:
        "Navigating a charter comes down to three jobs. Before you leave, decide where you are going and how long it will take. " +
        "On the way, keep track of where you are and what is around you. And on arrival, bring the boat in safely: the marks, the depth and the berth.",
    },
    {
      title: "The plotter is one source",
      narration:
        "The plotter does most of the work, and it is excellent. It shows your position, your speed and your track. " +
        "But it is a screen, and a screen can be wrong: an old chart, a wrong setting, a lost signal. " +
        "So the plotter is one source, not the only one. Your eyes, the depth sounder and the paper chart are the others.",
    },
    {
      title: "The chart",
      narration:
        "The chart is a map of the sea. It shows the depth of the water, the rocks and shallows under it, and the buoys and lights you steer by. " +
        "This course uses one practice chart, of a made-up island called Kerran, drawn like a real chart, so everything you learn transfers. Never use it to navigate a real boat.",
      seconds: 14,
    },
    {
      title: "The five-minute plan",
      narration:
        "Every morning, before the lines come off, make a five-minute plan. Where are we going, and how far is it? How long will it take at six knots? " +
        "Which way is the wind, and what is the forecast? Where will we stop if it goes wrong? And what does the pilot book say about getting in?",
    },
    {
      title: "Who does what",
      narration:
        "Share the jobs. One person helms. One watches the plotter and the chart. One looks out, for other boats, marks and the colour of the water. " +
        "Swap round, so everyone learns. Even with a professional skipper on board, the crew who understand the plan have the best week.",
    },
    {
      title: "How this course works",
      narration:
        "Every lesson has the same four parts. Watch the walkthrough. Read the notes below it. Try the interactive charts and tools. " +
        "Then practise with exercises that are marked straight away. Next, we read the chart.",
    },
  ],
};
