'use client';

import { useActionState } from 'react';
import {
  updateShiftTypeAction,
  type ShiftTypeFormState,
} from '@/lib/shift-types/actions';
import { ShiftTypeFields } from '@/components/shift-types/shift-type-fields';
import { FormAlert } from '@/components/auth/form-alert';
import { SubmitButton } from '@/components/auth/submit-button';
import type { ShiftType } from '@/lib/shift-types/types';

const INITIAL: ShiftTypeFormState = {};

export function EditShiftTypeForm({
  tenantSlug,
  shiftType,
}: {
  tenantSlug: string;
  shiftType: ShiftType;
}) {
  const action = updateShiftTypeAction.bind(null, tenantSlug, shiftType.id);
  const [state, formAction] = useActionState(action, INITIAL);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormAlert tone="error">{state.error}</FormAlert>
      <ShiftTypeFields
        fieldErrors={state.fieldErrors}
        includeStatus
        defaults={{
          name: shiftType.name,
          startTime: shiftType.startTime,
          endTime: shiftType.endTime,
          status: shiftType.status,
        }}
      />
      <SubmitButton className="w-full" pendingLabel="Saving…">
        Save changes
      </SubmitButton>
    </form>
  );
}
