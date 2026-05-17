"use client";

import { useState } from "react";
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

interface SubmitWorkDialogProps {
  taskId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmitted?: () => void;
}

export function SubmitWorkDialog({
  taskId,
  open,
  onOpenChange,
  onSubmitted,
}: SubmitWorkDialogProps) {
  const [commitRef, setCommitRef] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [branch, setBranch] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!commitRef.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commitRef: commitRef.trim(),
          repoUrl: repoUrl.trim() || undefined,
          branch: branch.trim() || undefined,
          message: message.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Submission failed");
      }

      toast("Work submitted successfully!", "success");
      setCommitRef("");
      setRepoUrl("");
      setBranch("");
      setMessage("");
      onOpenChange(false);
      onSubmitted?.();
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Failed to submit work",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Submit Work</DialogTitle>
          <DialogDescription>
            Provide the commit reference and optional details for your submission.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="commitRef" className="text-sm font-medium text-foreground">
              Commit Reference <span className="text-status-orange">*</span>
            </label>
            <Input
              id="commitRef"
              placeholder="e.g. abc1234 or full SHA"
              value={commitRef}
              onChange={(e) => setCommitRef(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="repoUrl" className="text-sm font-medium text-foreground">
              Repository URL
            </label>
            <Input
              id="repoUrl"
              placeholder="https://github.com/org/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="branch" className="text-sm font-medium text-foreground">
              Branch
            </label>
            <Input
              id="branch"
              placeholder="feature/my-branch"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="message" className="text-sm font-medium text-foreground">
              Message
            </label>
            <Textarea
              id="message"
              placeholder="Brief description of changes..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !commitRef.trim()}>
              {loading ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
