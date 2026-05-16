"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

interface Employee {
  id: string;
  name: string;
  email: string;
}

interface TaskRow {
  title: string;
  description: string;
}

export default function NewIdeaPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [tasks, setTasks] = useState<TaskRow[]>([{ title: "", description: "" }]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const res = await fetch("/api/board");
        if (res.ok) {
          const data = await res.json();
          setEmployees(
            data.map((u: { id: string; name: string; email: string }) => ({
              id: u.id,
              name: u.name,
              email: u.email,
            }))
          );
        }
      } catch {
        // silently fail
      } finally {
        setLoadingEmployees(false);
      }
    }
    fetchEmployees();
  }, []);

  function addTask() {
    setTasks((prev) => [...prev, { title: "", description: "" }]);
  }

  function removeTask(index: number) {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  }

  function updateTask(index: number, field: keyof TaskRow, value: string) {
    setTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t))
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
          assignedToId: assignedToId || undefined,
          tasks: validTasks.map((t, i) => ({
            title: t.title.trim(),
            description: t.description.trim() || undefined,
            order: i,
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
      <h1 className="text-xl font-semibold text-gray-900">Create New Idea</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="title" className="text-sm font-medium text-gray-700">
              Title <span className="text-red-500">*</span>
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
            <label htmlFor="description" className="text-sm font-medium text-gray-700">
              Description <span className="text-red-500">*</span>
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
            <label htmlFor="assignee" className="text-sm font-medium text-gray-700">
              Assign To
            </label>
            {loadingEmployees ? (
              <p className="text-sm text-gray-400">Loading employees...</p>
            ) : (
              <select
                id="assignee"
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <option value="">Unassigned</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.email})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
            Tasks
          </h2>

          {tasks.map((task, index) => (
            <div
              key={index}
              className="flex flex-col gap-2 rounded-md border border-gray-200 p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase">
                  Task {index + 1}
                </span>
                {tasks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeTask(index)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
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
