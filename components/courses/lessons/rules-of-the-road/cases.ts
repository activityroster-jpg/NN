// The fixed encounters behind the lesson's exercises and notes. Each is a
// true collision course; rules.test.ts checks every one against `decide`,
// so the written answers can never disagree with the rules engine.

import { dir, type Encounter, type Kind, type Side, type Vessel } from './rules'

/** A vessel that reaches the origin after `T` hours on `heading` at `speed` knots. */
export function onCourse(kind: Kind, heading: number, speed: number, T = 0.25, mainsail?: Side): Vessel {
  const d = dir(heading)
  return { kind, heading, speed, x: -d.x * speed * T, y: -d.y * speed * T, mainsail }
}

/** You (power-driven, 000) and a motor cruiser crossing from your starboard side: you give way. */
export const Q_CROSSING: Encounter = { a: onCourse('power', 0, 7), b: onCourse('power', 250, 10) }

/** Two power-driven vessels meeting head-on. */
export const Q_HEAD_ON: Encounter = { a: onCourse('power', 0, 8), b: onCourse('power', 180, 10) }

/** Wind from the north-west. A is on port tack, B on starboard tack: A gives way. */
export const Q_TACKS: Encounter = { a: onCourse('sail', 15, 6), b: onCourse('sail', 255, 6), windFrom: 315 }

/** Wind from 040°. Both on starboard tack; B is to windward and gives way. */
export const Q_WINDWARD: Encounter = { a: onCourse('sail', 340, 6), b: onCourse('sail', 270, 5), windFrom: 40 }

/** You, under sail at 6 kn, catching up a motor boat doing 3 kn from her starboard quarter: you keep clear. */
export const Q_SAIL_OVERTAKES: Encounter = { a: onCourse('sail', 355, 6, 0.3), b: onCourse('power', 20, 3, 0.3), windFrom: 75 }

/** Your yacht motor-sailing (power-driven) and a yacht under sail alone crossing from your port side: you keep clear. */
export const Q_MOTORSAILING: Encounter = { a: onCourse('power', 0, 6), b: onCourse('sail', 80, 5), windFrom: 170 }

/** Under sail, with a vessel engaged in fishing crossing from your port side: you keep clear. */
export const Q_TRAWLER: Encounter = { a: onCourse('sail', 0, 5), b: onCourse('fishing', 100, 4), windFrom: 270 }
