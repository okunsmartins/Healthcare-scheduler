'use client';

import { Field } from '@/components/auth/field';
import { Label } from '@/components/ui/label';
import {
  SHIFT_TYPE_STATUS,
  SHIFT_TYPE_STATUS_LABEL,
  formatDuration,
  isOvernight,
  type ShiftTypeStatus,
} from '@/lib/shift-types/types';

const SELECT_CLASS =
  'flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export interface ShiftTypeDefaults {
  name?: string;
  startTime?: string;
  endTime?: string;
  status?: ShiftTypeStatus;
}

interface ShiftTypeFieldsProps {
  defaults?: ShiftTypeDefaults;
  fieldErrors?: Record<string, string[] | undefined>;
  /** Render the lifecycle status control (edit only — new shift types are always `active`). */
  includeStatus?: boolean;
}

/**
 * Shared shift-type fields used by both the add and edit forms. Presentational only — each form
 * supplies its own `<form action>` and submit button.
 */
export function ShiftTypeFields({
  defaults,
  fieldErrors,
  includeStatus,
}: ShiftTypeFieldsProps) {
  const start = defaults?.startTime;
  const end = defaults?.endTime;
  const hint =
    start && end
      ? `${formatDuration(start, end)}${isOvernight(start, end) ? ' · crosses midnight' : ''}`
      : '';

  return (
    <>
      <Field
        label="Name"
        name="name"
        placeholder="e.g. Day, Night, Long Day"
        defaultValue={defaults?.name}
        autoFocus
        required
        errors={fieldErrors?.name}
      />
      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Start time"
          name="startTime"
          type="time"
          defaultValue={defaults?.startTime}
          required
          errors={fieldErrors?.startTime}
        />
        <Field
          label="End time"
          name="endTime"
          type="time"
          defaultValue={defaults?.endTime}
          required
          errors={fieldErrors?.endTime}
        />
      </div>
      {hint ? <p className="text-xs text-muted-foreground">Length: {hint}</p> : null}
      {includeStatus ? (
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={defaults?.status ?? 'active'}
            className={SELECT_CLASS}
          >
            {SHIFT_TYPE_STATUS.map((s) => (
              <option key={s} value={s}>
                {SHIFT_TYPE_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Archiving hides a shift type from new rosters without deleting it.
          </p>
        </div>
      ) : null}
    </>
  );
}
