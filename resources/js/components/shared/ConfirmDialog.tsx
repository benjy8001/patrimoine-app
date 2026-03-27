import * as AlertDialog from '@radix-ui/react-alert-dialog'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  confirmLabel?: string
  onConfirm: () => void
  destructive?: boolean
}

export default function ConfirmDialog({
  open, onOpenChange, title, description, confirmLabel = 'Confirmer', onConfirm, destructive = false,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-50 animate-fade-in" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-card rounded-lg border border-border shadow-xl p-6 animate-fade-in">
          <AlertDialog.Title className="font-semibold text-base mb-2">{title}</AlertDialog.Title>
          {description && <AlertDialog.Description className="text-sm text-muted-foreground mb-5">{description}</AlertDialog.Description>}
          <div className="flex justify-end gap-3">
            <AlertDialog.Cancel className="px-4 py-2 text-sm rounded-md border border-border hover:bg-accent transition-colors">
              Annuler
            </AlertDialog.Cancel>
            <AlertDialog.Action
              onClick={onConfirm}
              className={`px-4 py-2 text-sm rounded-md font-medium transition-colors ${
                destructive
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {confirmLabel}
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
