import { useRef, useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { AlertCircle, CheckCircle2, Info, Upload, X } from 'lucide-react'
import { importApi } from '../../api/import'
import type { ImportPreviewResult, ImportResult } from '../../api/import'
import LoadingSpinner from '../shared/LoadingSpinner'

interface ImportCsvModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

type Phase = 'idle' | 'previewing' | 'preview_done' | 'importing' | 'done'

export default function ImportCsvModal({ open, onOpenChange, onSuccess }: ImportCsvModalProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [networkError, setNetworkError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setPhase('idle')
    setFile(null)
    setPreview(null)
    setResult(null)
    setNetworkError(null)
    setIsDragging(false)
  }

  function handleClose(open: boolean) {
    if (!open) reset()
    onOpenChange(open)
  }

  async function handleFileSelected(selected: File) {
    setFile(selected)
    setNetworkError(null)
    setPhase('previewing')
    try {
      const data = await importApi.preview(selected)
      setPreview(data)
      setPhase('preview_done')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Une erreur est survenue lors de l\'analyse du fichier.'
      setNetworkError(msg)
      setPhase('idle')
    }
  }

  async function handleConfirm() {
    if (!file) return
    setPhase('importing')
    try {
      const data = await importApi.import(file)
      setResult(data)
      setPhase('done')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Une erreur est survenue lors de l\'import.'
      setNetworkError(msg)
      setPhase('preview_done')
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl bg-card rounded-lg border border-border shadow-xl p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="font-semibold text-lg">Importer des actifs (CSV)</Dialog.Title>
            <Dialog.Close className="p-1 rounded hover:bg-accent">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          {/* Network error alert */}
          {networkError && (
            <div className="flex items-start gap-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-md px-4 py-3 mb-4 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{networkError}</span>
            </div>
          )}

          {/* Phase: idle — file drop zone */}
          {phase === 'idle' && (
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={e => {
                e.preventDefault()
                setIsDragging(false)
                const dropped = e.dataTransfer.files[0]
                if (dropped) handleFileSelected(dropped)
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors
                ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
            >
              <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium">Glissez votre fichier CSV ici</p>
              <p className="text-xs text-muted-foreground mt-1">ou cliquez pour sélectionner</p>
              <p className="text-xs text-muted-foreground mt-3">
                Format : CSV, séparateur point-virgule (;), encodage UTF-8 — max 5 Mo
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) handleFileSelected(f)
                  e.target.value = ''
                }}
              />
            </div>
          )}

          {/* Phase: previewing / importing — spinner */}
          {(phase === 'previewing' || phase === 'importing') && (
            <div className="py-12 flex flex-col items-center gap-3">
              <LoadingSpinner />
              <p className="text-sm text-muted-foreground">
                {phase === 'previewing' ? 'Analyse du fichier en cours...' : 'Import en cours...'}
              </p>
            </div>
          )}

          {/* Phase: preview_done */}
          {phase === 'preview_done' && preview && (
            <div className="space-y-4">
              {/* Summary banner */}
              <div className={`flex items-start gap-2 rounded-md px-4 py-3 text-sm border ${
                preview.error_rows === 0
                  ? 'bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400'
                  : 'bg-orange-500/10 text-orange-700 border-orange-500/20 dark:text-orange-400'
              }`}>
                {preview.error_rows === 0
                  ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                }
                <span>
                  <strong>{preview.valid_rows}</strong> ligne(s) valide(s)
                  {preview.error_rows > 0 && <>, <strong>{preview.error_rows}</strong> ligne(s) avec erreurs (ignorées à l'import)</>}
                  {' '}— fichier : <em>{file?.name}</em>
                </span>
              </div>

              {/* Platforms to create */}
              {preview.will_create_platforms.length > 0 && (
                <div className="flex items-start gap-2 bg-blue-500/10 text-blue-700 border border-blue-500/20 dark:text-blue-400 rounded-md px-4 py-3 text-sm">
                  <Info className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>
                    Les plateformes suivantes seront créées automatiquement :{' '}
                    <strong>{preview.will_create_platforms.join(', ')}</strong>
                  </span>
                </div>
              )}

              {/* Errors list */}
              {preview.errors.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2 text-destructive">Erreurs de validation :</p>
                  <ul className="space-y-1 max-h-40 overflow-y-auto">
                    {preview.errors.map((err, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-destructive bg-destructive/5 rounded px-3 py-1.5">
                        <span className="font-medium shrink-0">Ligne {err.row}</span>
                        {err.field && <span className="shrink-0 text-muted-foreground">— {err.field}</span>}
                        <span>{err.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Valid rows preview table */}
              {preview.valid_rows > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Aperçu des lignes valides :</p>
                  <div className="border border-border rounded-md overflow-hidden">
                    <div className="overflow-x-auto max-h-48 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            <th className="text-left px-3 py-2 font-medium">Nom</th>
                            <th className="text-left px-3 py-2 font-medium">Catégorie</th>
                            <th className="text-left px-3 py-2 font-medium">Plateforme</th>
                            <th className="text-right px-3 py-2 font-medium">Valeur actuelle</th>
                            <th className="text-left px-3 py-2 font-medium">Devise</th>
                          </tr>
                        </thead>
                        <tbody>
                          {preview.rows
                            .filter(r => r.is_valid)
                            .map((r, i) => (
                              <tr key={i} className="border-t border-border">
                                <td className="px-3 py-1.5">{r.data.name}</td>
                                <td className="px-3 py-1.5 text-muted-foreground">{r.data.category_name ?? '—'}</td>
                                <td className="px-3 py-1.5 text-muted-foreground">{r.data.platform_name ?? '—'}</td>
                                <td className="px-3 py-1.5 text-right tabular-nums">{r.data.current_value?.toLocaleString('fr-FR')}</td>
                                <td className="px-3 py-1.5">{r.data.currency}</td>
                              </tr>
                            ))
                          }
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 justify-end pt-1">
                <button
                  onClick={reset}
                  className="px-4 py-2 text-sm border border-border rounded-md hover:bg-accent transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={preview.valid_rows === 0}
                  className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirmer l'import ({preview.valid_rows} actif{preview.valid_rows > 1 ? 's' : ''})
                </button>
              </div>
            </div>
          )}

          {/* Phase: done */}
          {phase === 'done' && result && (
            <div className="space-y-4">
              <div className="flex items-start gap-2 bg-green-500/10 text-green-700 border border-green-500/20 dark:text-green-400 rounded-md px-4 py-3 text-sm">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{result.message}</span>
              </div>
              {result.skipped > 0 && (
                <p className="text-sm text-muted-foreground">
                  {result.skipped} ligne(s) ignorée(s) (erreurs de validation).
                </p>
              )}
              {result.created_platforms.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Plateformes créées : <strong>{result.created_platforms.join(', ')}</strong>
                </p>
              )}
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => { onSuccess(); handleClose(false) }}
                  className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
