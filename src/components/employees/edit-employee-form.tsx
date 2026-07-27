'use client';

import { useActionState } from 'react';
import { updateEmployeeAction, type EmployeeFormState } from '@/lib/employees/actions';
import { EmployeeFields } from '@/components/employees/employee-fields';
import { FormAlert } from '@/components/auth/form-alert';
import { SubmitButton } from '@/components/auth/submit-button';
import type { Employee } from '@/lib/employees/types';

const INITIAL: EmployeeFormState = {};

export function EditEmployeeForm({
  tenantSlug,
  employee,
}: {
  tenantSlug: string;
  employee: Employee;
}) {
  const action = updateEmployeeAction.bind(null, tenantSlug, employee.id);
  const [state, formAction] = useActionState(action, INITIAL);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormAlert tone="error">{state.error}</FormAlert>
      <EmployeeFields
        fieldErrors={state.fieldErrors}
        includeStatus
        defaults={{
          fullName: employee.fullName,
          jobTitle: employee.jobTitle ?? undefined,
          email: employee.email ?? undefined,
          employmentType: employee.employmentType,
          status: employee.status,
        }}
      />
      <SubmitButton className="w-full" pendingLabel="Saving…">
        Save changes
      </SubmitButton>
    </form>
  );
}
