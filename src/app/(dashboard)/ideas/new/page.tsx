"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface Person {
  id: string;
  name: string;
  username: string;
}

interface TaskRow {
  title: string;
  description: string;
  assignedToId: string;
  dueDate: string;
  reviewerIds: string[];
}

export default function NewIdeaPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [leadId, setLeadId] = useState("");
  const [ideaDueDate, setIdeaDueDate] = useState("");
  const [associates, setAssociates] = useState<Person[]>([]);
  const [ctos, setCtos] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAssociates, setLoadingAssociates] = useState(true);

  const [tasks, setTasks] = useState<TaskRow[]>([
    { title: "", description: "", assignedToId: "", dueDate: "", reviewerIds: [] },
  ]);

  useEffect(() => {
    async function fetchPeople() {
      try {
        const [boardRes, ctoRes] = await Promise.all([
          fetch("/api/board"),
          fetch("/api/users/ctos"),
        ]);
        if (boardRes.ok) {
          const data = await boardRes.json();
          setAssociates(
            data.map((u: Person) => ({
              id: u.id,
              name: u.name,
              username: u.username,
            }))
          );
        }
        if (ctoRes.ok) {
          const data = await ctoRes.json();
          const list: Person[] = data.map((u: Person) => ({
            id: u.id,
            name: u.name,
            username: u.username,
          }));
          setCtos(list);
          // Default new tasks to "Both" — all CTO ids selected
          setTasks((prev) =>
            prev.map((t) =>
              t.reviewerIds.length === 0
                ? { ...t, reviewerIds: list.map((c) => c.id) }
                : t
            )
          );
        }
      } catch {
        // silently fail
      } finally {
        setLoadingAssociates(false);
      }
    }
    fetchPeople();
  }, []);

  function addTask() {
    setTasks((prev) => [
      ...prev,
      {
        title: "",
        description: "",
        assignedToId: "",
        dueDate: "",
        // New tasks default to "all CTOs" (Both, when there are 2)
        reviewerIds: ctos.map((c) => c.id),
      },
    ]);
  }

  function removeTask(index: number) {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  }

  function updateTask(
    index: number,
    field: keyof TaskRow,
    value: string | string[]
  ) {
    setTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t))
    );
  }

  function toggleReviewer(index: number, ctoId: string) {
    setTasks((prev) =>
      prev.map((t, i) => {
        if (i !== index) return t;
        const has = t.reviewerIds.includes(ctoId);
        const next = has
          ? t.reviewerIds.filter((id) => id !== ctoId)
          : [...t.reviewerIds, ctoId];
        return { ...t, reviewerIds: next };
      })
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validTasks = tasks.filter((t) => t.title.trim());
    if (!title.trim() || !description.trim() || validTasks.length === 0) {
      toast("Please fill in the title, description, and at least one task.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          leadId: leadId || undefined,
          dueDate: ideaDueDate || undefined,
          tasks: validTasks.map((t, i) => ({
            title: t.title.trim(),
            description: t.description.trim() || undefined,
            order: i,
            assignedToId: t.assignedToId || undefined,
            dueDate: t.dueDate || undefined,
            reviewerIds: t.reviewerIds,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create idea");
      }

      const idea = await res.json();
      toast("Idea created successfully!", "success");
      router.push(`/ideas/${idea.id}`);
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Failed to create idea",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold text-foreground">Create New Idea</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-border bg-surface p-6 space-y-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="title" className="text-sm font-medium text-foreground">
              Title <span className="text-status-orange">*</span>
            </label>
            <Input
              id="title"
              placeholder="Idea title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-sm font-medium text-foreground">
              Description <span className="text-status-orange">*</span>
            </label>
            <Textarea
              id="description"
              placeholder="Describe the idea..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="ideaDueDate" className="text-sm font-medium text-foreground">
              Idea Due Date <span className="text-label">(optional)</span>
            </label>
            <Input
              id="ideaDueDate"
              type="date"
              value={ideaDueDate}
              onChange={(e) => setIdeaDueDate(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="lead" className="text-sm font-medium text-foreground">
              Lead <span className="text-label">(optional)</span>
            </label>
            <p className="text-[11px] text-muted-foreground">
              The person accountable for the whole idea. Individual task assignees are set per-task below.
            </p>
            {loadingAssociates ? (
              <p className="text-sm text-label">Loading associates...</p>
            ) : (
              <select
                id="lead"
                value={leadId}
                onChange={(e) => setLeadId(e.target.value)}
                className="h-10 rounded-xl border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <option value="">No lead</option>
                {associates.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} (@{emp.username})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6 space-y-4">
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Tasks
          </h2>

          {tasks.map((task, index) => (
            <div
              key={index}
              className="flex flex-col gap-2 rounded-xl border border-border p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  Task {index + 1}
                </span>
                {tasks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTask(index)}
                    className="text-label hover:text-status-orange transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <Input
                placeholder="Task title"
                value={task.title}
                onChange={(e) => updateTask(index, "title", e.target.value)}
                required
              />
              <Textarea
                placeholder="Task description (optional)"
                value={task.description}
                onChange={(e) => updateTask(index, "description", e.target.value)}
                rows={2}
              />
              <div className="flex gap-2">
                <select
                  value={task.assignedToId}
                  onChange={(e) => updateTask(index, "assignedToId", e.target.value)}
                  className="h-9 flex-1 rounded-xl border border-border bg-surface px-3 text-[12px] text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  disabled={loadingAssociates}
                >
                  <option value="">Unassigned</option>
                  {associates.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      Assign to {emp.name} (@{emp.username})
                    </option>
                  ))}
                </select>
                <Input
                  type="date"
                  value={task.dueDate}
                  onChange={(e) => updateTask(index, "dueDate", e.target.value)}
                  className="h-9 w-44 text-[12px]"
                  title="Due date"
                />
              </div>

              {ctos.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-label">
                    <Eye className="h-3 w-3" />
                    Reviewer
                  </span>
                  {ctos.map((cto) => {
                    const selected = task.reviewerIds.includes(cto.id);
                    return (
                      <button
                        key={cto.id}
                        type="button"
                        onClick={() => toggleReviewer(index, cto.id)}
                        className={cn(
                          "inline-flex h-7 items-center gap-1.5 rounded-lg border px-2 text-[11px] font-medium uppercase tracking-wider transition-all duration-150 ease-out active:scale-95",
                          selected
                            ? "border-primary bg-primary/15 text-primary shadow-[inset_0_0_0_1px_rgba(123,184,255,0.35)]"
                            : "border-border bg-transparent text-muted-foreground hover:border-border-strong hover:text-foreground"
                        )}
                        aria-pressed={selected}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "h-1.5 w-1.5 rounded-full transition-colors duration-150",
                            selected ? "bg-primary" : "bg-border-strong"
                          )}
                        />
                        {cto.name}
                      </button>
                    );
                  })}
                  {ctos.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        updateTask(
                          index,
                          "reviewerIds",
                          task.reviewerIds.length === ctos.length
                            ? []
                            : ctos.map((c) => c.id)
                        )
                      }
                      className="ml-auto text-[10px] uppercase tracking-wider text-label transition-colors hover:text-primary"
                    >
                      {task.reviewerIds.length === ctos.length
                        ? "Clear"
                        : "Select both"}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addTask}
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Task
          </Button>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Idea"}
          </Button>
        </div>
      </form>
    </div>
  );
}
