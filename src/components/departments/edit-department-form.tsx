'use client';

import { useActionState } from 'react';
import {
  updateDepartmentAction,
  type DepartmentFormState,
} from '@/lib/departments/actions';
import { DepartmentFields } from '@/components/departments/department-fields';
import { FormAlert } from '@/components/auth/form-alert';
import { SubmitButton } from '@/components/auth/submit-button';
import type { Department } from '@/lib/departments/types';

const INITIAL: DepartmentFormState = {};

export function EditDepartmentForm({
  tenantSlug,
  department,
}: {
  tenantSlug: string;
  department: Department;
}) {
  const action = updateDepartmentAction.bind(null, tenantSlug, department.id);
  const [state, formAction] = useActionState(action, INITIAL);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormAlert tone="error">{state.error}</FormAlert>
      <DepartmentFields
        fieldErrors={state.fieldErrors}
        includeStatus
        defaults={{
          name: department.name,
          code: department.code ?? undefined,
          status: department.status,
        }}
      />
      <SubmitButton className="w-full" pendingLabel="Saving…">
        Save changes
      </SubmitButton>
    </form>
  );
}
