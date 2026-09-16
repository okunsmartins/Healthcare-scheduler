'use client';

import { useActionState } from 'react';
import {
  updateShiftInstanceAction,
  type ShiftInstanceFormState,
} from '@/lib/shift-instances/actions';
import {
  ShiftInstanceFields,
  type DepartmentOption,
  type ShiftTypeOption,
} from '@/components/shift-instances/shift-instance-fields';
import { FormAlert } from '@/components/auth/form-alert';
import { SubmitButton } from '@/components/auth/submit-button';
import type { ShiftInstance } from '@/lib/shift-instances/types';

const INITIAL: ShiftInstanceFormState = {};

export function EditShiftInstanceForm({
  tenantSlug,
  shiftInstance,
  departments,
  shiftTypes,
}: {
  tenantSlug: string;
  shiftInstance: ShiftInstance;
  departments: DepartmentOption[];
  shiftTypes: ShiftTypeOption[];
}) {
  const action = updateShiftInstanceAction.bind(null, tenantSlug, shiftInstance.id);
  const [state, formAction] = useActionState(action, INITIAL);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormAlert tone="error">{state.error}</FormAlert>
      <ShiftInstanceFields
        departments={departments}
        shiftTypes={shiftTypes}
        fieldErrors={state.fieldErrors}
        includeStatus
        defaults={{
          date: shiftInstance.date,
          departmentId: shiftInstance.department.id,
          shiftTypeId: shiftInstance.shiftType.id,
          requiredStaff: shiftInstance.requiredStaff,
          notes: shiftInstance.notes ?? undefined,
          status: shiftInstance.status,
        }}
      />
      <SubmitButton className="w-full" pendingLabel="Saving…">
        Save changes
      </SubmitButton>
    </form>
  );
}
