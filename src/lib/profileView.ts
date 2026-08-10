export function resolveProfileViewContext(viewerId: string | undefined, targetId: string | undefined) {
  const effectiveViewerId = viewerId ?? "";
  const effectiveTargetId = targetId ?? effectiveViewerId;

  return {
    viewerId: effectiveViewerId,
    targetId: effectiveTargetId,
    isOwn: Boolean(effectiveViewerId && effectiveTargetId === effectiveViewerId),
  };
}
