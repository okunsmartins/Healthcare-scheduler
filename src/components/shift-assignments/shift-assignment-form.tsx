'use client';

import { useActionState } from 'react';
import {
  setShiftAssignmentsAction,
  type ShiftAssignmentFormState,
} from '@/lib/shift-assignments/actions';
import { FormAlert } from '@/components/auth/form-alert';
import { SubmitButton } from '@/components/auth/submit-button';
import type { AssignableStaff } from '@/lib/shift-assignments/types';

const INITIAL: ShiftAssignmentFormState = {};

export function ShiftAssignmentForm({
  tenantSlug,
  shiftInstanceId,
  staff,
}: {
  tenantSlug: string;
  shiftInstanceId: string;
  staff: AssignableStaff[];
}) {
  const action = setShiftAssignmentsAction.bind(null, tenantSlug, shiftInstanceId);
  const [state, formAction] = useActionState(action, INITIAL);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormAlert tone="error">{state.error}</FormAlert>

      <ul className="divide-y rounded-lg border">
        {staff.map((m) => (
          <li key={m.employeeId}>
            <label className="flex cursor-pointer items-center gap-3 p-4 hover:bg-accent">
              <input
                type="checkbox"
                name="employee"
                value={m.employeeId}
                defaultChecked={m.assigned}
                className="h-4 w-4 shrink-0 rounded border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{m.name}</span>
                {m.jobTitle ? (
                  <span className="block truncate text-xs text-muted-foreground">
                    {m.jobTitle}
                  </span>
                ) : null}
              </span>
            </label>
          </li>
        ))}
      </ul>

      <SubmitButton className="w-full" pendingLabel="Saving…">
        Save assignments
      </SubmitButton>
    </form>
  );
}
