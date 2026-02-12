'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel as DMLabel,
  DropdownMenuSeparator as DMSeparator,
  DropdownMenuGroup as DMGroup,
} from './dropdown-menu';

type SelectCtx = {
  value?: string;
  onValueChange?: (v: string) => void;
  labels: Record<string, string>;
  register: (v: string, label: string) => void;
};

const SelectContext = React.createContext<SelectCtx>({
  value: undefined,
  onValueChange: undefined,
  labels: {},
  register: () => {},
});

type SelectRootProps = {
  value?: string;
  onValueChange?: (v: string) => void;
  children: React.ReactNode;
};

const Select = ({ value, onValueChange, children }: SelectRootProps) => {
  const [val, setVal] = React.useState<string | undefined>(value);
  const [labels, setLabels] = React.useState<Record<string, string>>({});
  React.useEffect(() => setVal(value), [value]);
  const handleChange = (v: string) => {
    setVal(v);
    onValueChange?.(v);
  };
  const register = (v: string, label: string) => {
    setLabels((prev) => (prev[v] === label ? prev : { ...prev, [v]: label }));
  };
  return (
    <SelectContext.Provider value={{ value: val, onValueChange: handleChange, labels, register }}>
      <DropdownMenu>{children}</DropdownMenu>
    </SelectContext.Provider>
  );
};

type TriggerProps = React.ComponentPropsWithoutRef<'button'> & {
  className?: string;
  children?: React.ReactNode;
};

const SelectTrigger = React.forwardRef<HTMLButtonElement, TriggerProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <DropdownMenuTrigger asChild>
        <button
          ref={ref}
          className={cn(
            'inline-flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-dark-3 dark:text-white',
            className
          )}
          {...props}
        >
          <span className="mr-2">{children}</span>
          <ChevronDown className="size-4 opacity-70" />
        </button>
      </DropdownMenuTrigger>
    );
  }
);
SelectTrigger.displayName = 'SelectTrigger';

type ContentProps = React.ComponentPropsWithoutRef<typeof DropdownMenuContent>;
const SelectContent = ({ className, ...props }: ContentProps) => {
  return (
    <DropdownMenuContent
      className={cn('min-w-[10rem] p-1', className)}
      {...props}
    />
  );
};

type ItemProps = React.ComponentPropsWithoutRef<typeof DropdownMenuItem> & {
  value: string;
  disabled?: boolean;
};
const SelectItem = React.forwardRef<HTMLDivElement, ItemProps>(
  ({ value, disabled, children, className, ...props }, ref) => {
    const ctx = React.useContext(SelectContext);
    React.useEffect(() => {
      const label = typeof children === 'string' ? children : String(children);
      ctx.register(value, label);
    }, [value, children, ctx]);
    return (
      <DropdownMenuItem
        ref={ref}
        className={cn('cursor-pointer', className)}
        onClick={() => ctx.onValueChange?.(value)}
        data-disabled={disabled ? '' : undefined}
        disabled={disabled}
        {...props}
      >
        {children}
      </DropdownMenuItem>
    );
  }
);
SelectItem.displayName = 'SelectItem';

type ValueProps = {
  placeholder?: string;
  className?: string;
};
const SelectValue = ({ placeholder, className }: ValueProps) => {
  const ctx = React.useContext(SelectContext);
  const label = (ctx.value ? ctx.labels[ctx.value] ?? ctx.value : '') || placeholder || '';
  return <span className={cn('text-sm', className)}>{label}</span>;
};

const SelectLabel = DMLabel;
const SelectSeparator = DMSeparator;
const SelectGroup = DMGroup;

export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue, SelectLabel, SelectSeparator, SelectGroup };
