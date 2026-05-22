import type {
  User,
  Idea,
  Task,
  Submission,
  StatusTransition,
  TaskStatus,
  IdeaStatus,
  Role,
} from "@/generated/prisma/client";

export type { User, Idea, Task, Submission, StatusTransition, TaskStatus, IdeaStatus, Role };

export type TaskWithDetails = Task & {
  submissions: Submission[];
  revisionTasks: Task[];
  statusTransitions: StatusTransition[];
  parentTask: Task | null;
  assignee: User | null;
};

export type IdeaWithTasks = Idea & {
  tasks: TaskWithDetails[];
  creator: User;
  lead: User | null;
};
