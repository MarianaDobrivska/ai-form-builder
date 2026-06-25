type BaseField = {
  id: string
  label: string
  required: boolean
  readonly?: boolean
}

export type TextField = BaseField & { kind: 'text'; minLength?: number; maxLength?: number }
export type NumberField = BaseField & { kind: 'number'; min?: number; max?: number }
export type SelectField = BaseField & { kind: 'select'; options: readonly string[] }
export type CheckboxField = BaseField & { kind: 'checkbox'; defaultChecked?: boolean }
export type DateField = BaseField & { kind: 'date'; minDate?: string; maxDate?: string }

export type FormField = TextField | NumberField | SelectField | CheckboxField | DateField

export type FieldKind = FormField['kind']

export type FieldValue<T extends FormField> =
  T extends TextField ? string :
  T extends NumberField ? number :
  T extends CheckboxField ? boolean :
  T extends SelectField ? T['options'][number] :
  T extends DateField ? string :
  never
