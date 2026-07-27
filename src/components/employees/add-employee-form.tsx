'use client';

import { useActionState } from 'react';
import { addEmployeeAction, type EmployeeFormState } from '@/lib/employees/actions';
import { EmployeeFields } from '@/components/employees/employee-fields';
import { FormAlert } from '@/components/auth/form-alert';
import { SubmitButton } from '@/components/auth/submit-button';

const INITIAL: EmployeeFormState = {};

export function AddEmployeeForm({ tenantSlug }: { tenantSlug: string }) {
  const action = addEmployeeAction.bind(null, tenantSlug);
  const [state, formAction] = useActionState(action, INITIAL);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormAlert tone="error">{state.error}</FormAlert>
      <EmployeeFields fieldErrors={state.fieldErrors} />
      <SubmitButton className="w-full" pendingLabel="Adding…">
        Add staff member
      </SubmitButton>
    </form>
  );
}
