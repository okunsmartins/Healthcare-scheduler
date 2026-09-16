'use client';

import { Field } from '@/components/auth/field';
import { Label } from '@/components/ui/label';
import {
  SHIFT_INSTANCE_STATUS,
  SHIFT_INSTANCE_STATUS_LABEL,
  type ShiftInstanceStatus,
} from '@/lib/shift-instances/types';

const SELECT_CLASS =
  'flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export interface DepartmentOption {
  id: string;
  name: string;
}
export interface ShiftTypeOption {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

export interface ShiftInstanceDefaults {
  date?: string;
  departmentId?: string;
  shiftTypeId?: string;
  requiredStaff?: number;
  notes?: string;
  status?: ShiftInstanceStatus;
}

interface ShiftInstanceFieldsProps {
  departments: DepartmentOption[];
  shiftTypes: ShiftTypeOption[];
  defaults?: ShiftInstanceDefaults;
  fieldErrors?: Record<string, string[] | undefined>;
  includeStatus?: boolean;
}

function FieldError({ errors }: { errors?: string[] }) {
  return errors?.length ? <p className="text-sm text-critical">{errors[0]}</p> : null;
}

export function ShiftInstanceFields({
  departments,
  shiftTypes,
  defaults,
  fieldErrors,
  includeStatus,
}: ShiftInstanceFieldsProps) {
  return (
    <>
      <Field
        label="Date"
        name="date"
        type="date"
        defaultValue={defaults?.date}
        required
        errors={fieldErrors?.date}
      />

      <div className="space-y-1.5">
        <Label htmlFor="departmentId">Department</Label>
        <select
          id="departmentId"
          name="departmentId"
          defaultValue={defaults?.departmentId ?? ''}
          className={SELECT_CLASS}
        >
          <option value="" disabled>
            Choose a department…
          </option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <FieldError errors={fieldErrors?.departmentId} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="shiftTypeId">Shift type</Label>
        <select
          id="shiftTypeId"
          name="shiftTypeId"
          defaultValue={defaults?.shiftTypeId ?? ''}
          className={SELECT_CLASS}
        >
          <option value="" disabled>
            Choose a shift type…
          </option>
          {shiftTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.startTime}–{t.endTime})
            </option>
          ))}
        </select>
        <FieldError errors={fieldErrors?.shiftTypeId} />
      </div>

      <Field
        label="Staff required"
        name="requiredStaff"
        type="number"
        min={1}
        max={99}
        defaultValue={defaults?.requiredStaff ?? 1}
        required
        errors={fieldErrors?.requiredStaff}
      />

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes (optional)</Label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={defaults?.notes}
          placeholder="e.g. extra cover for a busy clinic"
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        />
        <FieldError errors={fieldErrors?.notes} />
      </div>

      {includeStatus ? (
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={defaults?.status ?? 'active'}
            className={SELECT_CLASS}
          >
            {SHIFT_INSTANCE_STATUS.map((s) => (
              <option key={s} value={s}>
                {SHIFT_INSTANCE_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </>
  );
}
