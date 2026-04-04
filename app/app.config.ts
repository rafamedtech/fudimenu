export default defineAppConfig({
  ui: {
    colors: {
      primary: 'green',
      secondary: 'amber',
      neutral: 'zinc'
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
    },
    dashboardGroup: {
      base: 'min-h-svh bg-transparent'
    },
    dashboardSidebar: {
      slots: {
        root: 'bg-default/75 supports-[backdrop-filter]:bg-default/60 backdrop-blur-xl',
        header: 'h-(--ui-header-height) border-b border-default/70 px-4',
        body: 'gap-5 px-3 py-4 sm:px-4',
        footer: 'border-t border-default/70 px-3 py-3 sm:px-4',
        content: 'bg-default',
        overlay: 'bg-black/30'
      }
    },
    dashboardNavbar: {
      slots: {
        root: 'border-default/70 bg-default/75 supports-[backdrop-filter]:bg-default/60 backdrop-blur-xl px-4 sm:px-6',
        title: 'text-sm font-semibold tracking-tight text-highlighted',
        right: 'gap-2'
      }
    },
    dashboardPanel: {
      slots: {
        root: 'bg-transparent',
        body: 'flex flex-col gap-5 overflow-y-auto p-4 sm:gap-6 sm:p-6 lg:p-8'
      }
    },
    dashboardToolbar: {
      slots: {
        root: 'border-default/70 bg-muted/30 px-4 sm:px-6',
        left: 'flex items-center gap-2',
        right: 'flex items-center gap-2'
      }
    }
  }
})
