
export const ACTIVITY_ACTIONS = {
  CREATED: "CREATED",
  UPDATED: "UPDATED",
  STATUS_CHANGED: "STATUS_CHANGED",
  DELETED: "DELETED",
} as const;

export type ActivityAction =
  (typeof ACTIVITY_ACTIONS)[keyof typeof ACTIVITY_ACTIONS];
