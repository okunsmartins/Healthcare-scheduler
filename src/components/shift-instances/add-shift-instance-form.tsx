'use client';

import { useActionState } from 'react';
import {
  addShiftInstanceAction,
  type ShiftInstanceFormState,
} from '@/lib/shift-instances/actions';
import {
  ShiftInstanceFields,
  type DepartmentOption,
  type ShiftTypeOption,
} from '@/components/shift-instances/shift-instance-fields';
import { FormAlert } from '@/components/auth/form-alert';
import { SubmitButton } from '@/components/auth/submit-button';

const INITIAL: ShiftInstanceFormState = {};

export function AddShiftInstanceForm({
  tenantSlug,
  departments,
  shiftTypes,
}: {
  tenantSlug: string;
  departments: DepartmentOption[];
  shiftTypes: ShiftTypeOption[];
}) {
  const action = addShiftInstanceAction.bind(null, tenantSlug);
  const [state, formAction] = useActionState(action, INITIAL);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormAlert tone="error">{state.error}</FormAlert>
      <ShiftInstanceFields
        departments={departments}
        shiftTypes={shiftTypes}
        fieldErrors={state.fieldErrors}
      />
      <SubmitButton className="w-full" pendingLabel="Scheduling…">
        Schedule shift
      </SubmitButton>
    </form>
  );
}
