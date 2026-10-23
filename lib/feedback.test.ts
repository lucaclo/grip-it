import { describe, expect, it } from "vitest";
import { acceptedType, FEEDBACK_LIMITS, safeName, validateMeta } from "./feedback";

const ok = { clientId: "abc12345-6789", kind: "bug", text: "  The timer froze  ", from: "Luca", createdAt: "2026-10-21T10:00:00Z", context: { screen: "390x844" } };

describe("feedback validation", () => {
  it("accepts a normal message and trims it", () => {
    const m = validateMeta(ok);
    expect("error" in m).toBe(false);
    if (!("error" in m)) {
      expect(m.text).toBe("The timer froze");
      expect(m.kind).toBe("bug");
      expect(m.context.screen).toBe("390x844");
    }
  });
  it("rejects empty or overlong text and a bad id", () => {
    expect(validateMeta({ ...ok, text: "   " })).toEqual({ error: "Write something first" });
    expect("error" in validateMeta({ ...ok, text: "x".repeat(FEEDBACK_LIMITS.textMax + 1) })).toBe(true);
    expect(validateMeta({ ...ok, clientId: "../../etc" })).toEqual({ error: "Bad request" });
    expect(validateMeta(null)).toEqual({ error: "Missing feedback" });
  });
  it("unknown kinds become other", () => {
    const m = validateMeta({ ...ok, kind: "hack" });
    expect("error" in m ? null : m.kind).toBe("other");
  });
  it("file names are made safe for storage paths", () => {
    expect(safeName("../../Screen Shot 2026.png")).toBe("Screen-Shot-2026.png");
    expect(safeName("")).toBe("file");
  });
  it("accepts images, PDFs and text only", () => {
    expect(acceptedType("image/jpeg")).toBe(true);
    expect(acceptedType("application/pdf")).toBe(true);
    expect(acceptedType("application/x-msdownload")).toBe(false);
  });
});
