import type { LessonScript } from "@/lib/courses/navigation/scripts";

// The spoken script of the final check's short video. Plain data: the
// narration API records it ahead of time and the tests check it reads well.

export const charterNavigationQuiz: LessonScript = {
  slug: "charter-navigation-quiz",
  scenes: [
    {
      title: "The final check",
      narration:
        "This is the final check of Navigation for charter skippers. It is forty questions, covering every lesson in the course. " +
        "It is not an exam, and nobody else sees your score. " +
        "It is a way to find out what you know, and what to read again before your charter. " +
        "Do it in one sitting if you can, in about half an hour.",
    },
    {
      title: "What it covers",
      narration:
        "The questions follow the course in order. First the chart, distance, speed and time, and bearings. " +
        "Then the marks in both regions, the cardinals, and lights at night. " +
        "Then harbours, anchoring and the rules of the road. " +
        "And last, the weather, the plotter and the week's plan. " +
        "Every question was written for a charter week, not for an exam room.",
    },
    {
      title: "How it works",
      narration:
        "Each question is marked as soon as you answer. If you get one wrong, you have a second try. " +
        "After that, the answer is shown with a short explanation. " +
        "Some questions are sums, and some ask you to find things on the practice chart. " +
        "Have a pencil and paper beside you, and take your time. " +
        "Reset the questions at any time and start again.",
    },
    {
      title: "Reading your result",
      narration:
        "Score seventy percent or more and the course is marked complete. " +
        "But the score matters less than the pattern of your mistakes. " +
        "Two wrong answers on the same topic tell you where to go back. " +
        "The table under the questions shows which lesson covers each one. " +
        "Read that lesson's notes again, try its exercises, and then take the check a second time. " +
        "A score under seventy is not a failure, just a list of things to read.",
    },
    {
      title: "The ones that matter most",
      narration:
        "Some mistakes matter more than others on a real charter. " +
        "Red to port going in is Region A, in the Mediterranean, the Seychelles and Thailand. " +
        "In the Caribbean, in Region B, it is the other way round: red to starboard going in. " +
        "A cardinal mark tells you which side of it the safe water is. " +
        "And the course over the ground, not the heading, shows where you are really going. " +
        "If the plotter and your eyes disagree, believe your eyes and slow down. " +
        "And Mayday is for grave and immediate danger only.",
    },
    {
      title: "Before the briefing",
      narration:
        "No course replaces time on the water. " +
        "This one is free training, not a qualification, and the charter company sets its own rules for skippers. " +
        "Take what you have learned to the briefing, ask the base your questions, and enjoy your week. " +
        "Go back to any lesson whenever you like, before this trip or the next. " +
        "Good luck, and fair winds.",
    },
  ],
};
