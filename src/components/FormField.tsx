import Input from './ui/Input'
import Textarea from './ui/Textarea'

interface FormFieldProps {
  label: string
  name: string
  type?: 'text' | 'email' | 'tel' | 'textarea' | 'url' | 'date'
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  rows?: number
}

const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  rows = 3,
}: FormFieldProps) => {
  return (
    <div className="mb-4">
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-[var(--theme-text)]">
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </label>
      {type === 'textarea' ? (
        <Textarea
          id={name}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          rows={rows}
        />
      ) : (
        <Input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
        />
      )}
    </div>
  )
}

export default FormField
