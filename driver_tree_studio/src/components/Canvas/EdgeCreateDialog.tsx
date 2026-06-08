/**
 * Dialog for creating modeled or hypothesized edges on canvas connect.
 * Identity edges are created via the formula field, not drag-connect.
 */
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  Direction,
  EdgeKind,
  EvidenceGrade,
  FunctionalForm,
  MetricEdge,
} from "@/schema/types";
import type { Connection } from "@xyflow/react";
import { useState } from "react";

export interface PendingConnection {
  connection: Connection;
  childId: string;
  parentId: string;
}

interface EdgeCreateDialogProps {
  pending: PendingConnection | null;
  onClose: () => void;
  onCreate: (edge: MetricEdge) => void;
}

export function EdgeCreateDialog({
  pending,
  onClose,
  onCreate,
}: EdgeCreateDialogProps) {
  const [kind, setKind] = useState<EdgeKind>("modeled");
  const [elasticity, setElasticity] = useState("0.30");
  const [functionalForm, setFunctionalForm] = useState<FunctionalForm>("linear");
  const [evidenceGrade, setEvidenceGrade] = useState<EvidenceGrade>("illustrative");
  const [direction, setDirection] = useState<Direction>("increases");
  const [rationale, setRationale] = useState("");
  const [mechanism, setMechanism] = useState("");

  if (!pending) return null;

  const handleCreate = () => {
    const base: MetricEdge = {
      parent: pending.parentId,
      child: pending.childId,
      kind,
    };
    if (kind === "modeled") {
      onCreate({
        ...base,
        functional_form: functionalForm,
        elasticity: parseFloat(elasticity) || 0,
        evidence_grade: evidenceGrade,
        mechanism: mechanism || undefined,
        rationale: rationale || undefined,
      });
    } else if (kind === "hypothesized") {
      onCreate({
        ...base,
        direction,
        evidence_grade: "none",
        rationale: rationale || "Untested directional belief.",
      });
    }
    onClose();
  };

  return (
    <Dialog open={!!pending} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add relationship</DialogTitle>
          <DialogDescription>
            {pending.childId} → {pending.parentId}. Identity edges are defined via
            the formula field below the canvas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Edge kind</Label>
            <Select
              value={kind}
              onValueChange={(v) => setKind(v as EdgeKind)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="modeled">Modeled (assumption)</SelectItem>
                <SelectItem value="hypothesized">Hypothesized (untested)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {kind === "modeled" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Elasticity</Label>
                  <Input
                    value={elasticity}
                    onChange={(e) => setElasticity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Functional form</Label>
                  <Select
                    value={functionalForm}
                    onValueChange={(v) => setFunctionalForm(v as FunctionalForm)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="linear">linear</SelectItem>
                      <SelectItem value="logarithmic">logarithmic</SelectItem>
                      <SelectItem value="power">power</SelectItem>
                      <SelectItem value="s_curve">s_curve</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Evidence grade</Label>
                <Select
                  value={evidenceGrade}
                  onValueChange={(v) => setEvidenceGrade(v as EvidenceGrade)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="illustrative">illustrative</SelectItem>
                    <SelectItem value="estimated">estimated</SelectItem>
                    <SelectItem value="anecdotal">anecdotal</SelectItem>
                    <SelectItem value="observational">observational</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mechanism</Label>
                <Input
                  value={mechanism}
                  onChange={(e) => setMechanism(e.target.value)}
                />
              </div>
            </>
          )}

          {kind === "hypothesized" && (
            <div className="space-y-2">
              <Label>Direction</Label>
              <Select
                value={direction}
                onValueChange={(v) => setDirection(v as Direction)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="increases">increases</SelectItem>
                  <SelectItem value="decreases">decreases</SelectItem>
                  <SelectItem value="unclear">unclear</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Rationale</Label>
            <Input
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Add edge</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
