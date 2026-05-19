import { cn } from '@/lib/utils';

type DoodleProps = {
  name:
    | 'hero'
    | 'chef'
    | 'mail'
    | 'notebook'
    | 'chart'
    | 'qr-phone'
    | 'settings'
    | 'empty-menu'
    | 'offline'
    | 'plate'
    | 'error'
    | 'sync';
  className?: string;
};

const base = 'overflow-visible text-[var(--brand-accent-text)]';

export function Doodle({ name, className }: DoodleProps) {
  const props = {
    viewBox: '0 0 220 180',
    className: cn(base, className),
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    role: 'img',
    'aria-hidden': true,
  } as const;

  if (name === 'hero') {
    return (
      <svg {...props}>
        <path d="M38 128c38 24 104 24 144 0" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity=".28" />
        <rect x="30" y="62" width="54" height="84" rx="10" fill="#D4F2E4" stroke="currentColor" strokeWidth="4" />
        <path d="M45 84h24M45 99h18M45 116h24" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <rect x="142" y="48" width="52" height="64" rx="8" fill="#FFF1C2" stroke="currentColor" strokeWidth="4" />
        <path d="M154 60h11v11h-11zM172 60h10v10h-10zM154 88h10v10h-10zM172 83h6M184 84v8M178 99h8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <path d="M82 108c18-35 55-38 68-16 10 16-4 34-31 39-30 6-46-5-37-23Z" fill="#FF6B5B" stroke="currentColor" strokeWidth="4" />
        <path d="M103 80c13-16 31-14 42-2M99 102c15 8 31 9 47 2" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <circle cx="112" cy="96" r="5" fill="#F4B400" />
        <circle cx="132" cy="95" r="4" fill="#5BC499" />
      </svg>
    );
  }

  if (name === 'chef') {
    return (
      <svg {...props}>
        <path d="M52 142h86c-8-34-20-53-43-53-25 0-36 18-43 53Z" fill="#F4B400" stroke="currentColor" strokeWidth="4" />
        <circle cx="94" cy="76" r="28" fill="#FFF8E7" stroke="currentColor" strokeWidth="4" />
        <path d="M64 54c-5-18 17-28 28-15 14-18 42-5 34 16" fill="#FFFCF5" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <path d="M83 78c8 8 18 8 25 0M78 68h.5M110 68h.5" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
        <path d="M135 96c15-16 29-12 35-2 7 13-1 31-20 33" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <path d="M142 101l21-12" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === 'mail') {
    return (
      <svg {...props}>
        <rect x="45" y="66" width="112" height="70" rx="12" fill="#FFF1C2" stroke="currentColor" strokeWidth="4" />
        <path d="m54 79 47 34 47-34" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M137 52c18 2 30 12 39 28M159 48l19 31-34 8" fill="#D4F2E4" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === 'chart') {
    return (
      <svg {...props}>
        <rect x="48" y="42" width="108" height="94" rx="16" fill="#FFFFFF" stroke="currentColor" strokeWidth="4" />
        <path d="M72 112V90M100 112V68M128 112V82" stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
        <circle cx="151" cy="55" r="25" fill="#D4F2E4" stroke="currentColor" strokeWidth="4" />
        <path d="m168 72 22 22" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === 'qr-phone') {
    return (
      <svg {...props}>
        <rect x="40" y="42" width="70" height="108" rx="14" fill="#D4F2E4" stroke="currentColor" strokeWidth="4" />
        <rect x="130" y="58" width="56" height="56" rx="8" fill="#FFF1C2" stroke="currentColor" strokeWidth="4" />
        <path d="M144 72h9v9h-9zM165 72h8v8h-8zM144 94h8v8h-8zM162 93h5M174 94v9M166 106h9" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <path d="M116 73h13M116 91h13M116 109h13" stroke="#FF6B5B" strokeWidth="5" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === 'settings') {
    return (
      <svg {...props}>
        <path d="M74 60 148 134M148 60 74 134" stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
        <path d="M103 74c5-29 43-28 48 2 4 24-18 44-48 69-30-25-52-45-48-69 5-30 43-31 48-2Z" fill="#FF6B5B" stroke="currentColor" strokeWidth="4" />
      </svg>
    );
  }

  if (name === 'offline') {
    return (
      <svg {...props}>
        <path d="M65 114h98c21 0 31-34 5-43-10-30-51-32-65-6-24-7-42 12-38 49Z" fill="#D4F2E4" stroke="currentColor" strokeWidth="4" />
        <path d="M84 125 142 67M89 90c12-10 29-10 41 0M99 106c6-5 14-5 20 0" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === 'plate') {
    return (
      <svg {...props}>
        <ellipse cx="110" cy="104" rx="64" ry="34" fill="#FFF8E7" stroke="currentColor" strokeWidth="4" />
        <ellipse cx="110" cy="104" rx="34" ry="15" stroke="currentColor" strokeWidth="4" opacity=".45" />
        <path d="M62 48v40M54 48v23M70 48v23M158 48v40" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === 'sync') {
    return (
      <svg {...props}>
        <rect x="42" y="62" width="50" height="80" rx="10" fill="#FFF1C2" stroke="currentColor" strokeWidth="4" />
        <rect x="128" y="42" width="50" height="80" rx="10" fill="#D4F2E4" stroke="currentColor" strokeWidth="4" />
        <path d="M100 72h24l-9-10M120 132H96l9 10" stroke="#FF6B5B" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  const isError = name === 'error';
  return (
    <svg {...props}>
      <rect x="58" y="44" width="104" height="104" rx="16" fill={isError ? '#FFE0DB' : '#FFF1C2'} stroke="currentColor" strokeWidth="4" />
      <path d="M82 72h56M82 92h42M82 112h50" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="m144 42 18 20M166 42l-22 20" stroke="#FF6B5B" strokeWidth="5" strokeLinecap="round" />
      {!isError && <path d="M132 126c9-8 20-8 28 0" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />}
    </svg>
  );
}
