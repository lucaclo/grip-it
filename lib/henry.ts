/** True when the profile's first name is Henry, in any case: "Henry", "HENRY", "henry smith". */
export function isHenry(name: string | undefined) {
  const first = name?.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "");
  return first === "henry";
}
