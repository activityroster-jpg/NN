// Short vertical videos (1080×1920, under a minute) for TikTok, Reels and
// YouTube Shorts: yachting how-tos, sailing facts and one-minute destination
// teasers. Like the cruising guides, each is data; the script, the captions,
// the stock footage and the diagrams are all derived from it.

export type Strand = "howto" | "fact" | "place";

/** Pixabay stock footage behind a scene; downloaded into our storage, never hotlinked. */
export interface Footage {
  /** Pixabay search, at most 100 characters. */
  q: string;
  /** Which of the ranked results to use (0 = best); bump to swap a poor clip. */
  pick?: number;
  /** Seconds into the clip to start from. */
  start?: number;
}

export type Visual =
  | { kind: "footage"; footage: Footage }
  /** A drawn explainer; the id picks the component, the step what it shows. */
  | { kind: "diagram"; id: "med-mooring"; step: number }
  | { kind: "end" };

export interface ShortScene {
  /** Small label above the heading, e.g. "Step 1 of 5". */
  badge?: string;
  /** Large heading; the hook on the first scene. */
  heading?: string;
  /** Second line of the heading. */
  sub?: string;
  /** Spoken before the narration while the heading shows; not captioned. */
  lead?: string;
  /** Spoken and captioned sentence by sentence. */
  narration: string;
  /** Minimum length in seconds, for scenes with little to say. */
  seconds?: number;
  visual: Visual;
}

export interface Short {
  /** Slug, also the file name; must not clash with a cruising guide id. */
  id: string;
  strand: Strand;
  /** Title in the admin list and the video file name. */
  title: string;
  scenes: ShortScene[];
  /** Pronunciation fixes for the voice; captions keep the written form. */
  speak?: Record<string, string>;
  /** Post text to paste into TikTok, Instagram or YouTube. */
  caption: string;
  hashtags: string[];
  /** What the content was checked against. */
  sources: string[];
}
