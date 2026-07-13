import { Input, type InputProps } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FieldProps extends InputProps {
  label: string;
  name: string;
  errors?: string[];
}

/**
 * Labelled input with inline validation messaging. When `errors` are present the input is
 * marked `aria-invalid` and wired to the error text via `aria-describedby`.
 */
export function Field({ label, name, errors, id, ...props }: FieldProps) {
  const fieldId = id ?? name;
  const errorId = `${fieldId}-error`;
  const hasError = Boolean(errors?.length);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={fieldId}>{label}</Label>
      <Input
        id={fieldId}
        name={name}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? errorId : undefined}
        {...props}
      />
      {hasError ? (
        <p id={errorId} className="text-sm text-critical">
          {errors![0]}
        </p>
      ) : null}
    </div>
  );
}
