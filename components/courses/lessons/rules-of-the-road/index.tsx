import type { ReactNode } from "react";
import type { LessonContent } from "@/lib/courses/types";
import { QuestionCard } from "../../Exercises";
import { Callout, Figure, Interactive, KeyIdea, Section, Table, Worked } from "../../LessonParts";
import { OvertakingFigure, PowerFigures, SailingFigures } from "./art";
import { Exercises, Video } from "./client";
import { DayView, ShapeStackIcon } from "./shapes";
import { notation, signalById, type SignalId } from "./signals";
import { SignalTrainer } from "./sound-widgets";
import { SignalTimeline } from "./timeline";
import { BearingWatch, EncounterSim } from "./widgets";

const sig = (id: SignalId): ReactNode => <span className="whitespace-nowrap font-extrabold tracking-wider text-teal" aria-label={signalById(id).words}>{notation(signalById(id))}</span>;

function Body() {
  return (
    <>
      <Section id="colregs" title="The rules of the road">
        <p>
          At sea there are no traffic lights and no lanes painted on the water. Instead every vessel, from a cruise ship to your
          charter yacht’s dinghy, follows one rule book: the <strong>International Regulations for Preventing Collisions at Sea</strong>,
          the COLREGs. You do not need to know all of them for a charter week. You do need the dozen or so that decide who keeps
          out of whose way, and the habit of acting early and obviously.
        </p>
        <p>
          Harbours and some coasts add local rules on top: speed limits close to beaches, swimming areas marked with yellow
          buoys, harbours where you must be under engine with the sails down. The pilot book and the charter briefing tell you
          about them; ask if they do not.
        </p>
        <KeyIdea>
          The rules decide who keeps clear, but they never give anyone the right to hit anyone. Every skipper must do whatever it
          takes to avoid a collision.
        </KeyIdea>
      </Section>

      <Section id="risk" title="Is there a risk of collision?">
        <p>
          The first question is always: are we on a collision course? The test is the <strong>bearing</strong> of the other
          vessel. Take a bearing with the hand-bearing compass every few minutes. If it <strong>stays the same while she gets
          closer</strong>, you are on a collision course. If it draws steadily aft she will pass astern of you; if it draws ahead
          she will pass ahead.
        </p>
        <p>
          Without a compass to hand, line her up with something on your own boat, a stanchion or a winch, while the helm holds a
          steady course: if she stays in line, she is on a collision course. And with a big ship, a ferry or anything at close
          range, treat any doubt as a risk: a long ship’s bow and stern bear quite differently.
        </p>
        <Interactive title="Bearing watch" instructions="Take a bearing every three minutes. When you have at least three, decide: steady, drawing ahead, or drawing aft. Then see what happens.">
          <BearingWatch />
        </Interactive>
      </Section>

      <Section id="power" title="Head-on and crossing: two power-driven vessels">
        <p>
          Your yacht counts as a <strong>power-driven vessel</strong> whenever the engine is driving her, with the sails up or not.
          So these two rules apply every time you motor between anchorages:
        </p>
        <ul>
          <li><strong>Head-on</strong> (Rule 14). Meeting on opposite or nearly opposite courses, <strong>both turn to starboard</strong> and pass port side to port side. If you are not sure whether it is head-on, assume it is.</li>
          <li><strong>Crossing</strong> (Rule 15). The vessel that has the other on her <strong>own starboard side</strong> gives way, and should avoid crossing ahead: usually a clear turn to starboard, passing astern. The other <strong>stands on</strong>, keeping her course and speed.</li>
        </ul>
        <Figure caption="Head-on, both alter to starboard; crossing, the vessel with the other on her starboard side turns to starboard and passes astern.">
          <PowerFigures />
        </Figure>
        <Callout kind="tip" title="At night">
          <p>
            If to starboard red appear, it is your duty to keep clear: a red sidelight on your starboard bow is the port side of a
            vessel crossing from your right. Both red and green with the masthead lights in line means she is coming straight at you.
            Lesson 7 covers the lights.
          </p>
        </Callout>
      </Section>

      <Section id="overtaking" title="Overtaking">
        <p>
          A vessel coming up from more than 22.5° abaft your beam is <strong>overtaking</strong>: at night she would see only your
          sternlight. The overtaking vessel keeps out of the way <strong>whatever she is</strong>: a yacht under sail overtaking a
          motor boat must keep clear of it (Rule 13). She stays the overtaking vessel until she is finally past and clear.
        </p>
        <Figure caption="The overtaking sector: more than 22.5° abaft the beam on either side, the 135° covered by the sternlight.">
          <OvertakingFigure />
        </Figure>
      </Section>

      <Section id="sail" title="Sail and power, and two sailing yachts">
        <p>
          In open water a power-driven vessel keeps out of the way of a sailing vessel (Rule 18). Remember the other side of that:
          the moment your engine is driving the boat, you are power-driven and you give way to yachts under sail, even with your
          own sails up. When two yachts under sail meet (Rule 12):
        </p>
        <ul>
          <li>with the wind on <strong>different sides</strong>, the yacht on <strong>port tack</strong> (wind over her port side, mainsail out to starboard) keeps clear;</li>
          <li>with the wind on the <strong>same side</strong>, the yacht to <strong>windward</strong> keeps clear of the one to leeward.</li>
        </ul>
        <Figure caption="Left: the port-tack yacht bears away and passes astern of the starboard-tack yacht. Right: both on starboard tack, the windward yacht keeps clear.">
          <SailingFigures />
        </Figure>
        <Callout kind="warning" title="Ships and ferries">
          <p>
            Never count on a ship or a ferry giving way to you because you are sailing. She may not have seen you, she cannot stop
            or turn quickly, and in a narrow channel the rules require you not to impede her anyway. Keep clear early.
          </p>
        </Callout>
        <Interactive title="Encounter simulator" instructions="Set up an encounter (or press Random), choose what you should do, and watch the manoeuvre the rules require. Change the wind to see how the tacks change.">
          <EncounterSim />
        </Interactive>
      </Section>

      <Section id="rule18" title="Who keeps clear of whom">
        <p>Some vessels can’t get out of your way, so the rules put them above you, whether you are sailing or motoring:</p>
        <Table
          head={["Keep clear of", "Why", "By day she shows"]}
          rows={[
            ["A vessel not under command", "Her engine or steering has failed", <ShapeStackIcon key="n" shapes={["ball", "ball"]} label="Two black balls" />],
            ["A vessel restricted in her ability to manoeuvre", "Her work ties her down: dredging, diving, laying buoys or cables", <ShapeStackIcon key="r" shapes={["ball", "diamond", "ball"]} label="Ball, diamond, ball" />],
            ["A vessel engaged in fishing", "Nets, lines or a trawl in the water", <ShapeStackIcon key="f" shapes={["cone-down", "cone-up"]} label="Two cones, points together" />],
            ["Ships and ferries in a narrow channel", "They can only navigate inside it: do not impede them (Rule 9)", "—"],
          ]}
        />
        <p>
          Judge a vessel by what she is doing, not by what she is. A fishing boat motoring home with her gear stowed is just a
          power-driven vessel, and the head-on and crossing rules apply. In Croatia and Greece small fishing boats set nets close
          inshore, often marked only by floats and small flags: give them a wide berth and never motor over a line of floats.
        </p>
      </Section>

      <Section id="action" title="Give way early, stand on with care">
        <ol>
          <li><strong>If you are the give-way vessel</strong>, act early and make a big alteration, 30° or more, that the other skipper cannot miss. A string of small changes is hard to see and easy to misread. Turning to starboard and passing astern is almost always right.</li>
          <li><strong>If you are the stand-on vessel</strong>, keep your course and speed so the other skipper can predict you, but keep watching. If she is clearly not giving way you may act, and if a collision can no longer be avoided by her alone you must. If you do act for a power-driven vessel on your port side, avoid turning to port, towards her.</li>
          <li><strong>Either way</strong>, keep checking until she is past and clear.</li>
        </ol>
        <QuestionCard
          question={{
            id: "inline-stand-on",
            kind: "choice",
            prompt: "You are motoring, and a motor cruiser is crossing from your port side on a steady bearing. She is getting close and shows no sign of turning. What do the rules allow?",
            options: [
              "You may act once it is clear she is not, and you must act if she alone cannot avoid a collision, avoiding a turn to port towards her",
              "Nothing: the stand-on vessel must hold her course and speed whatever happens",
              "Turn hard to port, towards her stern",
              "Speed up so that you are clear before she arrives",
            ],
            answer: 0,
            explain: "Rule 17: the stand-on vessel keeps her course and speed, but may act as soon as it is clear the give-way vessel is not, and must act when collision can no longer be avoided by the give-way vessel alone. If she acts at the last moment she is likely to turn to starboard, towards you, so do not turn to port.",
          }}
        />
      </Section>

      <Section id="channels" title="Narrow channels, harbour entrances and ferries">
        <p>
          In a narrow channel or a harbour entrance, keep to the <strong>starboard side</strong>, as far over as is safe. A vessel
          under 20 metres or a yacht under sail must not impede a vessel that can only navigate safely inside the channel, and no
          one should cross a channel if that would impede such a vessel (Rule 9).
        </p>
        <p>
          On a charter, that mostly means ferries. They run to a timetable, often fast, and turn up round a breakwater with little
          warning: the car ferries in and out of Split, the hydrofoils and ferries between Piraeus and the Saronic islands, the
          hydrofoils among the Aeolian islands, the ferries crossing between Corsica and Sardinia, and the Road Town ferries in the
          BVI.
        </p>
        <ul>
          <li>Hold back from a harbour mouth while a ferry is coming in or going out, then go.</li>
          <li>Cross a channel or a ferry route at right angles, briskly, and never across the bows of a ship.</li>
          <li>Under sail in a channel, have the engine running and ready, and be prepared to drop the sails early.</li>
        </ul>
        <Worked
          title="Leaving Split for Milna"
          steps={[
            "You motor out of the harbour towards the entrance. A car ferry is backing off the quay astern of you: you hear three short blasts.",
            "She is going astern, and will turn and head for the entrance. You keep to the starboard side of the harbour and slow down.",
            "Rather than race her to the entrance, you hold back, out of the channel, until she has passed through and her wash has settled.",
            "Outside, her course and yours cross. You take bearings: steady. You are both power-driven and she is on your starboard side, so you turn boldly to starboard and pass astern of her.",
          ]}
          answer="Hold back, keep to starboard, then give way early and obviously: no drama, and no horn signals aimed at you."
        />
      </Section>

      <Section id="sounds" title="The sound signals you will actually hear">
        <p>
          A short blast lasts about one second; a prolonged blast four to six seconds. In sight of each other, power-driven vessels
          use the horn to say what they are doing (Rule 34). These are the ones you will hear in every busy harbour:
        </p>
        <Table
          head={["Signal", "Means", "Where you will hear it"]}
          rows={[
            [sig("stbd"), "I am altering my course to starboard", "A ship or ferry turning to pass you"],
            [sig("port"), "I am altering my course to port", "The same, turning the other way"],
            [sig("astern"), "My engines are going astern", "A ferry backing off or onto the quay"],
            [sig("doubt"), "I don’t understand your intentions, or I doubt you are doing enough", "Aimed at you: act at once, and make it obvious"],
            [sig("bend"), "Nearing a blind bend", "Channels and harbour corners"],
          ]}
        />
        <Figure caption="Five or more short, rapid blasts: if you hear it, look round, assume it is for you, and act.">
          <SignalTimeline id="doubt" axis />
        </Figure>
        <p>
          In fog, vessels sound signals every two minutes or less (Rule 35): one prolonged blast for a power-driven vessel making
          way, one prolonged and two short for a sailing vessel, and a bell rung rapidly for a vessel at anchor. Fog is rare in the
          summer Mediterranean but does happen, notably in spring; if it comes in, the best plan is usually to stay in harbour.
        </p>
        <Interactive title="Sound-signal trainer" instructions="Listen to each signal and watch its timeline, then test yourself. Check your volume first.">
          <SignalTrainer />
        </Interactive>
      </Section>

      <Section id="shapes" title="The day shapes you are most likely to see">
        <p>
          By day, vessels hoist black shapes in the rigging to say what they are doing. On a charter you will see three often, and
          should fly two yourself:
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <figure>
            <DayView signal="anchor" className="block w-full rounded-xl" />
            <figcaption className="mt-1 text-sm text-text-secondary"><strong className="text-text-primary">One ball:</strong> at anchor. Hoist one forward when you anchor.</figcaption>
          </figure>
          <figure>
            <DayView signal="motorsail" className="block w-full rounded-xl" />
            <figcaption className="mt-1 text-sm text-text-secondary"><strong className="text-text-primary">Cone, point down:</strong> under sail with the engine running. You are power-driven.</figcaption>
          </figure>
          <figure>
            <DayView signal="fishing" className="block w-full rounded-xl" />
            <figcaption className="mt-1 text-sm text-text-secondary"><strong className="text-text-primary">Two cones, points together:</strong> fishing. Keep clear.</figcaption>
          </figure>
        </div>
        <p>
          In practice many charter yachts never fly the cone, and plenty forget the ball, but the rules apply to yachts too (only
          a boat under 7 metres anchored well away from channels and anchorages is excused). Most charter yachts have a ball, and
          sometimes a cone, in a cockpit locker: ask at the briefing.
        </p>
        <p className="text-sm text-text-secondary">
          This lesson covers the rules a charter skipper uses most, not the whole of the COLREGs. It is independent training
          material by Nautical Nomads and is not accredited by the RYA or any other body.
        </p>
      </Section>
    </>
  );
}

const lesson: LessonContent = {
  objectives: [
    "Tell whether you are on a collision course from the bearing of the other vessel",
    "Know who gives way head-on, crossing, overtaking, between sail and power and between two yachts under sail",
    "Keep clear of fishing boats, ferries and ships in channels, and act early and obviously when you give way",
    "Recognise the horn signals and day shapes you will meet on a charter, and fly the right shapes yourself",
  ],
  keyTerms: [
    { term: "COLREGs", definition: "The International Regulations for Preventing Collisions at Sea: the rules of the road for every vessel." },
    { term: "Steady bearing", definition: "A bearing of another vessel that does not change while she gets closer: you are on a collision course." },
    { term: "Give-way vessel", definition: "The vessel that must keep out of the way: she acts early, with a big, obvious alteration." },
    { term: "Stand-on vessel", definition: "The vessel that keeps her course and speed, while watching that the other gives way." },
    { term: "Power-driven vessel", definition: "Any vessel driven by an engine, including a yacht with her sails up and the engine running." },
    { term: "Port tack", definition: "Sailing with the wind over the port side (mainsail out to starboard); a port-tack yacht keeps clear of a starboard-tack yacht." },
    { term: "Overtaking", definition: "Coming up on another vessel from more than 22.5° abaft her beam; the overtaking vessel always keeps clear." },
    { term: "Narrow channel", definition: "A channel or fairway where you keep to the starboard side and must not impede vessels confined to it." },
    { term: "Short blast", definition: "About one second on the horn: one means turning to starboard, two to port, three going astern." },
    { term: "Day shape", definition: "A black shape hoisted by day: a ball at anchor, a cone point down when motor-sailing, two cones when fishing." },
  ],
  Body,
  Video,
  Exercises,
};

export default lesson;
