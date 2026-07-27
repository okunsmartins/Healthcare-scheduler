'use client';

import { Field } from '@/components/auth/field';
import { Label } from '@/components/ui/label';
import {
  DEPARTMENT_STATUS,
  DEPARTMENT_STATUS_LABEL,
  type DepartmentStatus,
} from '@/lib/departments/types';

const SELECT_CLASS =
  'flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export interface DepartmentDefaults {
  name?: string;
  code?: string;
  status?: DepartmentStatus;
}

interface DepartmentFieldsProps {
  defaults?: DepartmentDefaults;
  fieldErrors?: Record<string, string[] | undefined>;
  /** Render the lifecycle status control (edit only — new departments are always `active`). */
  includeStatus?: boolean;
}

/**
 * Shared department fields used by both the add and edit forms. Presentational only — each form
 * supplies its own `<form action>` and submit button.
 */
export function DepartmentFields({
  defaults,
  fieldErrors,
  includeStatus,
}: DepartmentFieldsProps) {
  return (
    <>
      <Field
        label="Department name"
        name="name"
        placeholder="e.g. Emergency"
        defaultValue={defaults?.name}
        autoFocus
        required
        errors={fieldErrors?.name}
      />
      <Field
        label="Code (optional)"
        name="code"
        placeholder="e.g. ED"
        defaultValue={defaults?.code}
        errors={fieldErrors?.code}
      />
      {includeStatus ? (
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={defaults?.status ?? 'active'}
            className={SELECT_CLASS}
          >
            {DEPARTMENT_STATUS.map((s) => (
              <option key={s} value={s}>
                {DEPARTMENT_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Archiving hides a department from active use without deleting it.
          </p>
        </div>
      ) : null}
    </>
  );
}
