"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

interface RevisionItem {
  title: string;
  note: string;
}

interface RevisionFormProps {
  taskId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function RevisionForm({
  taskId,
  open,
  onOpenChange,
  onCreated,
}: RevisionFormProps) {
  const [revisions, setRevisions] = useState<RevisionItem[]>([
    { title: "", note: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  function addRevision() {
    setRevisions((prev) => [...prev, { title: "", note: "" }]);
  }

  function removeRevision(index: number) {
    setRevisions((prev) => prev.filter((_, i) => i !== index));
  }

  function updateRevision(index: number, field: keyof RevisionItem, value: string) {
    setRevisions((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validRevisions = revisions.filter((r) => r.title.trim());
    if (validRevisions.length === 0) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/revisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          revisions: validRevisions.map((r) => ({
            title: r.title.trim(),
            revisionNote: r.note.trim() || undefined,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create revisions");
      }

      toast("Revision tasks created successfully!", "success");
      setRevisions([{ title: "", note: "" }]);
      onOpenChange(false);
      onCreated?.();
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Failed to create revisions",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Request Revisions</DialogTitle>
          <DialogDescription>
            Create revision subtasks for the associate to address.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          {revisions.map((rev, index) => (
            <div
              key={index}
              className="flex flex-col gap-2 rounded-md border border-border p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  Revision {index + 1}
                </span>
                {revisions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRevision(index)}
                    className="text-label hover:text-status-orange transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <Input
                placeholder="Revision title"
                value={rev.title}
                onChange={(e) => updateRevision(index, "title", e.target.value)}
                required
              />

              <Textarea
                placeholder="Notes for the associate..."
                value={rev.note}
                onChange={(e) => updateRevision(index, "note", e.target.value)}
                rows={2}
              />
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addRevision}
            className="gap-1.5 self-start"
          >
            <Plus className="h-3.5 w-3.5" />
            Add another revision
          </Button>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || revisions.every((r) => !r.title.trim())}
            >
              {loading ? "Creating..." : "Create Revisions"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
