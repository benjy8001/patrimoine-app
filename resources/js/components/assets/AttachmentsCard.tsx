import { useRef, useState } from 'react'
import { FileText, FileImage, File, Download, Trash2, Upload, Paperclip } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '../shared/Card'
import { attachmentsApi } from '../../api/attachments'
import type { Attachment } from '../../types'

interface AttachmentsCardProps {
  assetId: number
  attachments: Attachment[]
  onChanged: () => void
}

function formatSize(bytes: number | null): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function FileIcon({ mimeType }: { mimeType: string | null }) {
  if (!mimeType) return <File className="w-4 h-4 text-muted-foreground" />
  if (mimeType === 'application/pdf') return <FileText className="w-4 h-4 text-red-500" />
  if (mimeType.startsWith('image/')) return <FileImage className="w-4 h-4 text-blue-500" />
  return <File className="w-4 h-4 text-muted-foreground" />
}

export default function AttachmentsCard({ assetId, attachments, onChanged }: AttachmentsCardProps) {
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(file: File) {
    setError(null)
    setUploading(true)
    try {
      await attachmentsApi.upload(assetId, file)
      onChanged()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Erreur lors de l\'upload.'
      setError(msg)
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id)
    try {
      await attachmentsApi.delete(id)
      onChanged()
    } catch {
      setError('Erreur lors de la suppression.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Paperclip className="w-4 h-4" />
            Pièces jointes
            {attachments.length > 0 && (
              <span className="text-xs font-normal text-muted-foreground">({attachments.length})</span>
            )}
          </span>
        </CardTitle>
      </CardHeader>

      {/* Error */}
      {error && (
        <p className="text-xs text-destructive mb-3">{error}</p>
      )}

      {/* File list */}
      {attachments.length > 0 && (
        <ul className="divide-y divide-border mb-4">
          {attachments.map(att => (
            <li key={att.id} className="flex items-center gap-3 py-2.5">
              <FileIcon mimeType={att.mime_type} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{att.original_name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatSize(att.size)}
                  {att.notes && <> · {att.notes}</>}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={attachmentsApi.downloadUrl(att.id)}
                  download={att.original_name}
                  className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                  title="Télécharger"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => handleDelete(att.id)}
                  disabled={deletingId === att.id}
                  className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive disabled:opacity-50"
                  title="Supprimer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={e => {
          e.preventDefault()
          setIsDragging(false)
          const file = e.dataTransfer.files[0]
          if (file) handleUpload(file)
        }}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`flex items-center justify-center gap-2 border-2 border-dashed rounded-md px-4 py-3 text-sm cursor-pointer transition-colors
          ${isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-muted/30'}
          ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <Upload className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-muted-foreground">
          {uploading ? 'Envoi en cours...' : 'Déposer un fichier ou cliquer pour sélectionner'}
        </span>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx,.csv,.txt"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) handleUpload(file)
            e.target.value = ''
          }}
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1.5">
        PDF, images, Word, Excel — max 10 Mo
      </p>
    </Card>
  )
}
