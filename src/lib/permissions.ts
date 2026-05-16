export function isCTO(role: string): boolean {
  return role === "CTO";
}

export function canModifyTask(
  userRole: string,
  userId: string,
  taskAssigneeId: string
): boolean {
  if (isCTO(userRole)) return true;
  return userId === taskAssigneeId;
}

export function canCreateIdea(role: string): boolean {
  return isCTO(role);
}
