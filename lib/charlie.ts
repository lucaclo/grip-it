/** Charlie and the usual spellings and short forms of the name. */
const CHARLIE_NAMES = new Set(["charlie", "charley", "charly", "charli", "charles", "chas", "chaz", "chuck"]);

/** True when the profile's first name is any form of Charlie, in any case: "Charlie", "CHARLES", "charley cohen". */
export function isCharlie(name: string | undefined) {
  const first = name?.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "");
  return !!first && CHARLIE_NAMES.has(first);
}
