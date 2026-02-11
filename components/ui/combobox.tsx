'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';
import { Input } from './input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from './dropdown-menu';

type Option = { value: string; label: string; disabled?: boolean };

type ComboboxProps = {
  options: Option[];
  value?: string;
  onValueChange?: (v: string) => void;
  placeholder?: string;
  className?: string;
  inputPlaceholder?: string;
};

export const Combobox = ({
  options,
  value,
  onValueChange,
  placeholder,
  className,
  inputPlaceholder,
}: ComboboxProps) => {
  const [open, setOpen] = React.useState(false);
  const [filter, setFilter] = React.useState('');
  const [current, setCurrent] = React.useState<string | undefined>(value);
  const [activeIndex, setActiveIndex] = React.useState(0);

  React.useEffect(() => setCurrent(value), [value]);

  const filtered = React.useMemo(() => {
    const f = filter.toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(f) || o.value.toLowerCase().includes(f)
    );
  }, [filter, options]);

  React.useEffect(() => {
    if (activeIndex >= filtered.length) setActiveIndex(0);
  }, [filtered.length, activeIndex]);

  const selectValue = (v: string) => {
    setCurrent(v);
    onValueChange?.(v);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const opt = filtered[activeIndex];
      if (opt && !opt.disabled) selectValue(opt.value);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const currentLabel =
    options.find((o) => o.value === current)?.label ||
    placeholder ||
    'Select...';

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'inline-flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-800 dark:bg-dark-3 dark:text-white',
            className
          )}
        >
          <span className="mr-2">{currentLabel}</span>
          <ChevronDown className="size-4 opacity-70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-[14rem] p-2"
        onKeyDown={handleKeyDown}
      >
        <div className="mb-2">
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={inputPlaceholder || 'Search...'}
            className="w-full bg-white dark:bg-dark-3 text-slate-900 dark:text-white"
          />
        </div>
        <div className="max-h-64 overflow-auto">
          {filtered.length === 0 ? (
            <div className="px-2 py-1 text-sm text-slate-500 dark:text-slate-400">
              No results
            </div>
          ) : (
            filtered.map((o, idx) => (
              <DropdownMenuItem
                key={o.value}
                className={cn(
                  'cursor-pointer flex items-center justify-between',
                  idx === activeIndex && 'bg-slate-100 dark:bg-slate-800'
                )}
                data-disabled={o.disabled ? '' : undefined}
                disabled={o.disabled}
                onClick={() => !o.disabled && selectValue(o.value)}
              >
                <span>{o.label}</span>
                {current === o.value && (
                  <Check className="size-4 text-slate-700 dark:text-slate-300" />
                )}
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
