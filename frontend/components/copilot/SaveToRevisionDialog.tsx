'use client';

import * as React from 'react';
import { BookmarkCheck, BookOpenText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { RevisionSaveType, RevisionSubject } from '@/lib/types';
import {
  REVISION_SAVE_TYPE_OPTIONS,
  REVISION_SUBJECT_OPTIONS,
  type RevisionAutoFillSuggestion,
  buildRevisionSavePreview,
} from '@/lib/revision-save-taxonomy';

export interface RevisionSaveDialogDraft {
  sourceText: string;
  selectedText?: string | null;
  topic?: string | null;
  subject?: RevisionSubject | null;
  saveType?: RevisionSaveType | null;
  autoFill?: RevisionAutoFillSuggestion | null;
}

interface SaveToRevisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: RevisionSaveDialogDraft | null;
  isSaving?: boolean;
  onConfirm: (selection: { subject: RevisionSubject; saveType: RevisionSaveType }) => Promise<void> | void;
}

export function SaveToRevisionDialog({
  open,
  onOpenChange,
  draft,
  isSaving = false,
  onConfirm,
}: SaveToRevisionDialogProps) {
  const [subject, setSubject] = React.useState<RevisionSubject | ''>('');
  const [saveType, setSaveType] = React.useState<RevisionSaveType | ''>('');

  React.useEffect(() => {
    if (!open || !draft) return;
    const allowAutoApply = !draft.autoFill?.needsReview;
    setSubject(allowAutoApply ? (draft.subject || '') : '');
    setSaveType(allowAutoApply ? (draft.saveType || '') : '');
  }, [draft, open]);

  const autoFill = draft?.autoFill || null;
  const canUseDraftFallback = !autoFill?.needsReview;
  const resolvedSubject = subject || (canUseDraftFallback ? (draft?.subject || '') : '');
  const resolvedSaveType = saveType || (canUseDraftFallback ? (draft?.saveType || '') : '');
  const preview =
    resolvedSaveType
      ? buildRevisionSavePreview({
          saveType: resolvedSaveType,
          subject: resolvedSubject || draft?.subject || null,
          topic: draft?.topic || null,
          selectedText: draft?.selectedText || null,
          sourceText: draft?.sourceText || null,
        })
      : null;

  const handleConfirm = async () => {
    if (!resolvedSubject || !resolvedSaveType) return;
    await onConfirm({
      subject: resolvedSubject as RevisionSubject,
      saveType: resolvedSaveType as RevisionSaveType,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[540px] rounded-[28px] border border-slate-200/90 bg-white/95 p-0 shadow-[0_28px_90px_rgba(15,23,42,0.18)]">
        <div className="border-b border-slate-200/80 bg-[radial-gradient(circle_at_top,_rgba(186,230,253,0.38),_transparent_58%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,252,0.98))] px-6 py-5">
          <DialogHeader className="space-y-2 text-left">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--copilot-accent-soft)] text-[var(--copilot-accent-text)] shadow-sm">
              <BookmarkCheck className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl font-semibold text-slate-900">Save to Revision</DialogTitle>
            <DialogDescription className="max-w-[420px] text-sm leading-6 text-slate-600">
              Save this as a short revision note you can revisit later.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-5 px-6 py-5">
          {autoFill ? (
            <div
              className={`rounded-[20px] border px-4 py-3 ${
                autoFill.confidence === 'high'
                  ? 'border-emerald-200 bg-emerald-50/70'
                  : autoFill.confidence === 'medium'
                    ? 'border-amber-200 bg-amber-50/70'
                    : 'border-rose-200 bg-rose-50/75'
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                Autofill {autoFill.confidence === 'high' ? 'High confidence' : autoFill.confidence === 'medium' ? 'Medium confidence' : 'Needs review'}
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {autoFill.needsReview
                  ? 'Please choose subject and save type before saving.'
                  : 'Auto-filled details look ready. Confirm and save.'}
              </p>
              {autoFill.confidenceReasons.length > 0 ? (
                <p className="mt-2 text-xs leading-5 text-slate-600">{autoFill.confidenceReasons.join(' ')}</p>
              ) : null}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Subject</p>
              <Select value={resolvedSubject} onValueChange={(value) => setSubject(value as RevisionSubject)}>
                <SelectTrigger className="h-11 rounded-2xl border-slate-200 bg-white text-sm">
                  <SelectValue placeholder="Choose subject" />
                </SelectTrigger>
                <SelectContent>
                  {REVISION_SUBJECT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Save as</p>
              <Select value={resolvedSaveType} onValueChange={(value) => setSaveType(value as RevisionSaveType)}>
                <SelectTrigger className="h-11 rounded-2xl border-slate-200 bg-white text-sm">
                  <SelectValue placeholder="Choose save type" />
                </SelectTrigger>
                <SelectContent>
                  {REVISION_SAVE_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {preview ? (
            <div className="rounded-[24px] border border-slate-200/80 bg-slate-50/85 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
                  {preview.subjectLabel}
                </span>
                <span className="inline-flex items-center rounded-full bg-[var(--copilot-accent-soft)] px-3 py-1 text-xs font-medium text-[var(--copilot-accent-text)]">
                  {preview.saveTypeLabel}
                </span>
              </div>

              <div className="mt-4 rounded-[20px] border border-white/80 bg-white/90 px-4 py-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                    <BookOpenText className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{preview.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{preview.summary}</p>
                  </div>
                </div>
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-500">{preview.helper}</p>
            </div>
          ) : (
            <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50/70 px-4 py-4 text-sm text-slate-500">
              Choose a subject and save type to see the revision preview.
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-slate-200/80 px-6 py-4 sm:justify-between sm:space-x-0">
          <Button
            type="button"
            variant="ghost"
            className="h-10 rounded-full px-4 text-sm text-slate-600"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="h-10 rounded-full px-5 text-sm"
            disabled={isSaving || !resolvedSubject || !resolvedSaveType}
            onClick={handleConfirm}
          >
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
