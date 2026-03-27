import api from './axios'
import type { Attachment } from '../types'

export const attachmentsApi = {
  async upload(assetId: number, file: File, notes?: string): Promise<Attachment> {
    const form = new FormData()
    form.append('file', file)
    if (notes) form.append('notes', notes)
    const res = await api.post<Attachment>(`/assets/${assetId}/attachments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },

  downloadUrl(attachmentId: number): string {
    return `/api/v1/attachments/${attachmentId}/download`
  },

  async delete(attachmentId: number): Promise<void> {
    await api.delete(`/attachments/${attachmentId}`)
  },
}
