import type { TaskStatus } from "@/generated/prisma/client";

export interface StatusConfig {
  label: string;
  color: string;
  textColor: string;
}

export const STATUS_CONFIG: Record<TaskStatus, StatusConfig> = {
  WHITE:     { label: "Not Started",     color: "#6B7493", textColor: "#050B1A" },
  YELLOW:    { label: "Working on it",   color: "#E8A538", textColor: "#050B1A" },
  GREEN:     { label: "Pending Review",  color: "#52D499", textColor: "#050B1A" },
  ORANGE:    { label: "Stuck",           color: "#E66478", textColor: "#050B1A" },
  COMPLETED: { label: "Done",            color: "#A8C8FF", textColor: "#050B1A" },
};

export const STATUS_ORDER: TaskStatus[] = ["WHITE", "YELLOW", "GREEN", "ORANGE", "COMPLETED"];

export function getStatusLabel(status: TaskStatus): string {
  return STATUS_CONFIG[status].label;
}

export function getStatusColor(status: TaskStatus): string {
  return STATUS_CONFIG[status].color;
}

export function getStatusTextColor(status: TaskStatus): string {
  return STATUS_CONFIG[status].textColor;
}
