import { Phone, Siren } from 'lucide-react'
import * as Tooltip from '@radix-ui/react-tooltip'

const CALL_ACTIONS = [
  {
    href: 'tel:102',
    label: 'Call ambulance (102)',
    icon: Siren,
    className: 'gradient-danger',
  },
  {
    href: 'tel:112',
    label: 'Call emergency services (112)',
    icon: Phone,
    className: 'bg-blue-600 hover:bg-blue-700',
  },
]

export function FloatingCallButton() {
  return (
    <Tooltip.Provider delayDuration={200}>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {CALL_ACTIONS.map((action) => (
          <Tooltip.Root key={action.href}>
            <Tooltip.Trigger asChild>
              <a
                href={action.href}
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-strong hover:scale-105 transition-transform text-white ${action.className}`}
                aria-label={action.label}
              >
                <action.icon className="h-5 w-5" />
              </a>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="bg-gray-900 text-white text-xs px-3 py-1.5 rounded-md shadow-medium"
                sideOffset={6}
                side="left"
              >
                {action.label}
                <Tooltip.Arrow className="fill-gray-900" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        ))}
      </div>
    </Tooltip.Provider>
  )
}
