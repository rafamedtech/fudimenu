export default defineAppConfig({
  ui: {
    colors: {
      primary: 'emerald',
      secondary: 'amber',
      neutral: 'stone'
    },
    button: {
      slots: {
        base: 'rounded-[calc(var(--ui-radius)*3)] font-semibold transition-all duration-200 shadow-sm',
        leadingIcon: 'shrink-0',
        trailingIcon: 'shrink-0'
      }
    },
    card: {
      slots: {
        root: 'overflow-hidden rounded-[calc(var(--ui-radius)*7)] border border-default/70 bg-default/85 shadow-sm backdrop-blur-xl',
        header: 'p-6 sm:p-7',
        body: 'p-6 sm:p-7',
        footer: 'border-t border-default/60 p-6 sm:p-7'
      }
    },
    badge: {
      slots: {
        base: 'rounded-[calc(var(--ui-radius)*999)] px-3 py-1 font-semibold tracking-[0.01em]'
      }
    },
    input: {
      slots: {
        base: 'rounded-[calc(var(--ui-radius)*3)] border border-default/70 bg-default/85 shadow-none placeholder:text-muted'
      }
    },
    textarea: {
      slots: {
        base: 'rounded-[calc(var(--ui-radius)*3)] border border-default/70 bg-default/85 shadow-none placeholder:text-muted'
      }
    }
  }
})
