'use client';

import { Field } from '@/components/auth/field';
import { Label } from '@/components/ui/label';
import {
  EMPLOYMENT_TYPE_LABEL,
  EMPLOYEE_STATUS,
  EMPLOYEE_STATUS_LABEL,
  type EmployeeStatus,
  type EmploymentType,
} from '@/lib/employees/types';

const SELECT_CLASS =
  'flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

const TYPES: EmploymentType[] = ['permanent', 'bank', 'agency'];

export interface EmployeeDefaults {
  fullName?: string;
  jobTitle?: string;
  email?: string;
  employmentType?: EmploymentType;
  status?: EmployeeStatus;
}

interface EmployeeFieldsProps {
  defaults?: EmployeeDefaults;
  fieldErrors?: Record<string, string[] | undefined>;
  /** Render the lifecycle status control (edit only — new staff are always `active`). */
  includeStatus?: boolean;
}

/**
 * The shared set of staff fields used by both the add and edit forms. Presentational only —
 * each form supplies its own `<form action>` and submit button.
 */
export function EmployeeFields({
  defaults,
  fieldErrors,
  includeStatus,
}: EmployeeFieldsProps) {
  return (
    <>
      <Field
        label="Full name"
        name="fullName"
        autoComplete="name"
        defaultValue={defaults?.fullName}
        autoFocus
        required
        errors={fieldErrors?.fullName}
      />
      <Field
        label="Job title"
        name="jobTitle"
        placeholder="e.g. Staff Nurse"
        defaultValue={defaults?.jobTitle}
        errors={fieldErrors?.jobTitle}
      />
      <Field
        label="Email (optional)"
        name="email"
        type="email"
        autoComplete="email"
        defaultValue={defaults?.email}
        errors={fieldErrors?.email}
      />
      <div className="space-y-1.5">
        <Label htmlFor="employmentType">Employment type</Label>
        <select
          id="employmentType"
          name="employmentType"
          defaultValue={defaults?.employmentType ?? 'permanent'}
          className={SELECT_CLASS}
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {EMPLOYMENT_TYPE_LABEL[t]}
            </option>
          ))}
        </select>
      </div>
      {includeStatus ? (
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={defaults?.status ?? 'active'}
            className={SELECT_CLASS}
          >
            {EMPLOYEE_STATUS.map((s) => (
              <option key={s} value={s}>
                {EMPLOYEE_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Archiving hides a staff member from active use without deleting their record.
          </p>
        </div>
      ) : null}
    </>
  );
}
