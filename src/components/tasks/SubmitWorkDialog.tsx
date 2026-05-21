"use client";

import { useMemo, useState } from "react";
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
import { parsePrUrl } from "@/lib/pr-url";

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
  const [prUrl, setPrUrl] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const parsed = useMemo(() => (prUrl.trim() ? parsePrUrl(prUrl) : null), [prUrl]);
  const showInvalid = prUrl.trim().length > 0 && parsed === null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!prUrl.trim() || !parsed) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prUrl: prUrl.trim(),
          message: message.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Submission failed");
      }

      if (data.warning) {
        toast(data.warning, "info");
      } else {
        toast("Work submitted successfully!", "success");
      }
      setPrUrl("");
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
            Link the GitHub PR you opened for this task. The PR&apos;s state will
            drive this task&apos;s status automatically — merging completes it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="prUrl" className="text-sm font-medium text-foreground">
              Pull Request URL <span className="text-status-orange">*</span>
            </label>
            <Input
              id="prUrl"
              placeholder="https://github.com/owner/repo/pull/123"
              value={prUrl}
              onChange={(e) => setPrUrl(e.target.value)}
              required
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
            />
            {parsed && (
              <p className="text-[11px] font-mono text-status-green">
                {parsed.owner}/{parsed.repo}#{parsed.number}
              </p>
            )}
            {showInvalid && (
              <p className="text-[11px] text-status-orange">
                That doesn&apos;t look like a GitHub PR URL.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="message" className="text-sm font-medium text-foreground">
              Notes (optional)
            </label>
            <Textarea
              id="message"
              placeholder="Anything reviewers should know…"
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
            <Button type="submit" disabled={loading || !parsed}>
              {loading ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
