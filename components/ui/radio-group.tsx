import * as React from "react"
import { cn } from "@/lib/utils"

type RadioGroupContextValue = {
  value?: string
  onValueChange?: (value: string) => void
}

const RadioGroupContext = React.createContext<RadioGroupContextValue>({})

export interface RadioGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

export const RadioGroup = ({
  className,
  value: controlledValue,
  defaultValue,
  onValueChange,
  ...props
}: RadioGroupProps) => {
  const [value, setValue] = React.useState<string | undefined>(defaultValue)

  React.useEffect(() => {
    if (controlledValue !== undefined) {
      setValue(controlledValue)
    }
  }, [controlledValue])

  const handleChange = (next: string) => {
    setValue(next)
    onValueChange?.(next)
  }

  return (
    <RadioGroupContext.Provider value={{ value, onValueChange: handleChange }}>
      <div
        role="radiogroup"
        className={cn("grid gap-2", className)}
        {...props}
      />
    </RadioGroupContext.Provider>
  )
}

export interface RadioGroupItemProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string
  value: string
}

export const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, id, value, ...props }, ref) => {
    const ctx = React.useContext(RadioGroupContext)
    const checked = ctx.value === value

    const onChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
      if (e.target.checked) {
        ctx.onValueChange?.(value)
      }
    }

    return (
      <div className="flex items-center space-x-2">
        <input
          ref={ref}
          type="radio"
          id={id}
          value={value}
          checked={checked}
          onChange={onChange}
          className={cn(
            "peer h-4 w-4 shrink-0 rounded-full border border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-600 dark:border-slate-700",
            className
          )}
          {...props}
        />
        {/* Visual dot to mimic shadcn style when checked */}
        <span className={cn(
          "pointer-events-none inline-block h-2 w-2 rounded-full",
          checked ? "bg-blue-600 dark:bg-blue-400" : "bg-transparent"
        )} />
      </div>
    )
  }
)
RadioGroupItem.displayName = "RadioGroupItem"

