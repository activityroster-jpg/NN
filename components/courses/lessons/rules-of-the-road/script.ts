import type { LessonScript } from "@/lib/courses/navigation/scripts";

// The spoken script of the Lesson 10 video. Plain data: the narration API
// records it ahead of time and the tests check it reads well.

export const rulesOfTheRoad: LessonScript = {
  slug: "rules-of-the-road",
  speak: { COLREGs: "col-regs" },
  scenes: [
    {
      title: "The rules of the road",
      narration:
        "At sea there are no traffic lights, so every vessel follows one rule book: the international collision regulations, usually called the COLREGs. " +
        "They apply to every vessel, from a cruise ship to your charter yacht and its dinghy. " +
        "Harbours and some coasts add local rules of their own, so check the pilot book and listen at the briefing. " +
        "This lesson covers the rules you will actually use on a charter: who keeps out of whose way, and how to make it obvious.",
    },
    {
      title: "Is there a risk of collision?",
      narration:
        "To find out whether you are on a collision course, watch the bearing of the other vessel. " +
        "If her bearing stays the same while she gets closer, you are on a collision course. " +
        "If the bearing draws steadily aft she will pass astern of you, and if it draws ahead she will pass ahead. " +
        "Without a compass to hand, line her up with a stanchion or a winch, and with a big ship or at close range, treat any doubt as a risk.",
      seconds: 32,
    },
    {
      title: "Head-on",
      narration:
        "When two power-driven vessels meet head-on, and your yacht under engine counts as one, both have to act. " +
        "At night you would see both her red and green lights, and her white masthead lights in line. " +
        "Each turns to starboard, so that they pass port side to port side. " +
        "If you are not sure whether it is head-on, assume that it is, and turn to starboard in good time.",
    },
    {
      title: "Crossing",
      narration:
        "When two power-driven vessels are crossing, the one that has the other on her starboard side gives way. " +
        "She should not cross ahead, so the usual move is a clear turn to starboard, passing astern of the other. " +
        "The other vessel stands on: she keeps her course and speed. " +
        "At night the old rhyme helps: if to starboard red appear, it is your duty to keep clear.",
    },
    {
      title: "Overtaking",
      narration:
        "A vessel coming up from more than twenty-two and a half degrees behind your beam is overtaking you. " +
        "At night she would see only your white sternlight, and neither of your sidelights. " +
        "The overtaking vessel keeps clear, whatever she is: a yacht under sail overtaking a motor boat must keep out of her way. " +
        "She stays the overtaking vessel until she is well past and clear.",
    },
    {
      title: "Sail and power",
      narration:
        "In open water, a power-driven vessel keeps out of the way of a sailing vessel. " +
        "But the moment your engine is driving the boat, even with the sails up, you are power-driven, and you give way like one. " +
        "When two yachts under sail meet, the one on port tack, with the wind over her port side, keeps clear. " +
        "When both have the wind on the same side, the one to windward keeps clear of the one to leeward. " +
        "And never count on a ferry or a ship giving way to you just because you are sailing.",
    },
    {
      title: "Who keeps clear of whom",
      narration:
        "Some vessels have the right of way over yachts, under sail or not. " +
        "Keep clear of fishing boats working their nets or lines, and of any vessel whose work, such as dredging or laying buoys, stops her manoeuvring. " +
        "Keep clear too of a vessel not under command, whose engine or steering has failed. " +
        "In narrow channels and harbour entrances, do not get in the way of ferries and ships that can only use the channel. " +
        "A fishing boat simply motoring home is just a power-driven vessel, so judge her by what she is doing, not by what she is.",
    },
    {
      title: "Giving way and standing on",
      narration:
        "If you are the give-way vessel, act early, and make a big alteration that the other skipper cannot miss. " +
        "A string of small course changes is hard to see and easy to misread. " +
        "If you are the stand-on vessel, keep your course and speed, but keep watching. " +
        "If she is clearly not giving way, you may act, and if a collision can no longer be avoided by her alone, you must. " +
        "Either way, keep checking until the other vessel is past and clear.",
    },
    {
      title: "Narrow channels and harbour entrances",
      narration:
        "In a narrow channel or a harbour entrance, keep to the starboard side, as far over as is safe. " +
        "Small boats and yachts under sail must not get in the way of a vessel that can only navigate inside the channel. " +
        "Ferries keep a timetable, often at speed, and they may come round the breakwater with little warning. " +
        "So cross a channel or a ferry route at right angles, briskly, and never across the bows of a ship. " +
        "And hold back from a harbour mouth while a ferry is coming in or going out.",
      seconds: 30,
    },
    {
      title: "Sounds and shapes",
      narration:
        "Ships and ferries talk with their horns, and you will hear a few signals again and again. " +
        "One short blast means I am turning to starboard, and two short blasts mean I am turning to port. " +
        "Three short blasts mean my engines are going astern, which you will often hear as a ferry backs onto the quay. " +
        "Five or more short, rapid blasts mean the other vessel doubts what you are doing: act at once, and make it obvious. " +
        "By day, a black ball in the rigging means a vessel at anchor, and you should hoist one too when you anchor. " +
        "A black cone, point down, means a yacht under sail with her engine running, which makes her a power-driven vessel.",
      seconds: 34,
    },
  ],
};
