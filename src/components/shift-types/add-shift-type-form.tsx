'use client';

import { useActionState } from 'react';
import { addShiftTypeAction, type ShiftTypeFormState } from '@/lib/shift-types/actions';
import { ShiftTypeFields } from '@/components/shift-types/shift-type-fields';
import { FormAlert } from '@/components/auth/form-alert';
import { SubmitButton } from '@/components/auth/submit-button';

const INITIAL: ShiftTypeFormState = {};

export function AddShiftTypeForm({ tenantSlug }: { tenantSlug: string }) {
  const action = addShiftTypeAction.bind(null, tenantSlug);
  const [state, formAction] = useActionState(action, INITIAL);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <FormAlert tone="error">{state.error}</FormAlert>
      <ShiftTypeFields fieldErrors={state.fieldErrors} />
      <SubmitButton className="w-full" pendingLabel="Creating…">
        Create shift type
      </SubmitButton>
    </form>
  );
}
