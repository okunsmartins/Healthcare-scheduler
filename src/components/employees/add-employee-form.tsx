'use client';

import { useActionState } from 'react';
import { addEmployeeAction, type AddEmployeeState } from '@/lib/employees/actions';
import { EMPLOYMENT_TYPE_LABEL, type EmploymentType } from '@/lib/employees/types';
import { Field } from '@/components/auth/field';
import { FormAlert } from '@/components/auth/form-alert';
import { SubmitButton } from '@/components/auth/submit-button';
import { Label } from '@/components/ui/label';

const INITIAL: AddEmployeeState = {};
const TYPES: EmploymentType[] = ['permanent', 'bank', 'agency'];

export function AddEmployeeForm({ tenantSlug }: { tenantSlug: string }) {
  const action = addEmployeeAction.bind(null, tenantSlug);
  const [state, formAction] = useActionState(action, INITIAL);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormAlert tone="error">{state.error}</FormAlert>
      <Field
        label="Full name"
        name="fullName"
        autoComplete="name"
        autoFocus
        required
        errors={state.fieldErrors?.fullName}
      />
      <Field
        label="Job title"
        name="jobTitle"
        placeholder="e.g. Staff Nurse"
        errors={state.fieldErrors?.jobTitle}
      />
      <Field
        label="Email (optional)"
        name="email"
        type="email"
        autoComplete="email"
        errors={state.fieldErrors?.email}
      />
      <div className="space-y-1.5">
        <Label htmlFor="employmentType">Employment type</Label>
        <select
          id="employmentType"
          name="employmentType"
          defaultValue="permanent"
          className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {EMPLOYMENT_TYPE_LABEL[t]}
            </option>
          ))}
        </select>
      </div>
      <SubmitButton className="w-full" pendingLabel="Adding…">
        Add staff member
      </SubmitButton>
    </form>
  );
}
