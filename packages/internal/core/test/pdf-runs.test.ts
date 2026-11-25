/**
 * A block of text cut between two of its lines (src/pdf/runs.ts): its lines matched to its text as the engine laid
 * them out, and its runs cut at a character.
 */
import type { Run } from "../src/pdf/model";
import { lineEnds, runsText, splitRuns } from "../src/pdf/runs";

describe("a block of text's lines, matched to its text", () => {
  it("ends each where its characters end, a line break between two lines in neither", () => {
    expect(lineEnds("One two three\nfour", ["One two ", "three", "four"])).toEqual([
      { end: 8, next: 8, hyphenated: false },
      { end: 13, next: 14, hyphenated: false },
      { end: 18, next: 18, hyphenated: false },
    ]);
  });

  it("knows a line that ends in a word broken by a hyphen (the hyphen isn't in the text)", () => {
    expect(lineEnds("Supercalifragilistic words", ["Supercali-", "fragilistic words"])).toEqual([
      { end: 9, next: 9, hyphenated: true },
      { end: 26, next: 26, hyphenated: false },
    ]);
  });

  it("matches nothing where the lines aren't the text, or don't reach its end", () => {
    expect(lineEnds("One two", ["One ", "three"])).toBeUndefined();
    expect(lineEnds("One two three", ["One ", "two "])).toBeUndefined();
  });
});

describe("a block of text's runs", () => {
  const runs: Run[] = ["Start ", { kind: "span", style: { fontWeight: 700 }, runs: ["bold ", { kind: "link", href: "https://x.test", style: {}, runs: ["link"] }] }, " end"];

  it("are its text as laid out, an image a character", () => {
    expect(runsText(runs, {})).toBe("Start bold link end");
    expect(runsText(["a", { kind: "image", src: "data:image/png;base64,", style: {} }, "b"], {})).toBe("a￼b");
  });

  it("are transformed as drawn, and can't be matched where a transform changes the text's length", () => {
    expect(runsText(["Straße"], { textTransform: "lowercase" })).toBe("straße");
    expect(runsText(["Straße"], { textTransform: "uppercase" })).toBeUndefined();
  });

  it("cut at a character, each run's style kept on both sides", () => {
    expect(splitRuns(runs, 8)).toEqual([
      ["Start ", { kind: "span", style: { fontWeight: 700 }, runs: ["bo"] }],
      [{ kind: "span", style: { fontWeight: 700 }, runs: ["ld ", { kind: "link", href: "https://x.test", style: {}, runs: ["link"] }] }, " end"],
    ]);
    // Inside the link: the link on both sides.
    expect(splitRuns(runs, 13)[1][0]).toEqual({ kind: "span", style: { fontWeight: 700 }, runs: [{ kind: "link", href: "https://x.test", style: {}, runs: ["nk"] }] });
    expect(splitRuns(runs, 0)).toEqual([[], runs]);
    expect(splitRuns(runs, 19)).toEqual([runs, []]);
  });
});
