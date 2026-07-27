'use client';

import { useActionState } from 'react';
import { addDepartmentAction, type DepartmentFormState } from '@/lib/departments/actions';
import { DepartmentFields } from '@/components/departments/department-fields';
import { FormAlert } from '@/components/auth/form-alert';
import { SubmitButton } from '@/components/auth/submit-button';

const INITIAL: DepartmentFormState = {};

export function AddDepartmentForm({ tenantSlug }: { tenantSlug: string }) {
  const action = addDepartmentAction.bind(null, tenantSlug);
  const [state, formAction] = useActionState(action, INITIAL);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormAlert tone="error">{state.error}</FormAlert>
      <DepartmentFields fieldErrors={state.fieldErrors} />
      <SubmitButton className="w-full" pendingLabel="Creating…">
        Create department
      </SubmitButton>
    </form>
  );
}
