import { describe, expect, it } from "vitest";
import { resolveProfileViewContext } from "../lib/profileView";

describe("resolveProfileViewContext", () => {
  it("keeps the authenticated admin identity separate from the selected profile", () => {
    expect(resolveProfileViewContext("admin-user-id", "target-user-id")).toEqual({
      viewerId: "admin-user-id",
      targetId: "target-user-id",
      isOwn: false,
    });
  });

  it("uses the authenticated user as the viewer when no profile is selected", () => {
    expect(resolveProfileViewContext("admin-user-id", undefined)).toEqual({
      viewerId: "admin-user-id",
      targetId: "admin-user-id",
      isOwn: true,
    });
  });
});
