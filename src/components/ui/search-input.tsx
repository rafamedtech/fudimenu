import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  clearLabel: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  clearLabel,
}: SearchInputProps) {
  return (
    <label className="flex h-12 items-center gap-2 rounded-md border border-[var(--brand-card-border)] bg-[var(--brand-card)] px-4 shadow-sm transition-all focus-within:border-[var(--brand-primary)] focus-within:shadow-glow-mostaza">
      <span className="sr-only">{ariaLabel}</span>
      <Search className="size-[18px] text-ink-500" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="size-full appearance-none bg-transparent text-base font-medium text-ink-900 outline-none placeholder:text-ink-500 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
      />
      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={clearLabel}
          onClick={() => onChange('')}
          className="size-8 rounded-full text-ink-500 hover:text-ink-900"
        >
          <X className="size-3.5" aria-hidden />
        </Button>
      ) : null}
    </label>
  );
}
