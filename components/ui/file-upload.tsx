"use client"

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, File, Image, FileText, Loader2 } from 'lucide-react'
import { Button } from './button'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface FileUploadProps {
  despesaId: number
  existingFiles?: UploadedFile[]
  onFilesChange?: (files: UploadedFile[]) => void
  className?: string
}

interface UploadedFile {
  id: number
  url: string
  nomeOriginal: string
  tamanho: number
  tipoMime: string
}

export function FileUpload({ despesaId, existingFiles = [], onFilesChange, className }: FileUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>(existingFiles)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    setUploading(true)

    try {
      const uploadPromises = acceptedFiles.map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('despesaId', despesaId.toString())

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Erro no upload')
        }

        return response.json()
      })

      const uploadedFiles = await Promise.all(uploadPromises)
      const newFiles = [...files, ...uploadedFiles]
      setFiles(newFiles)
      onFilesChange?.(newFiles)
      
      toast.success(`${uploadedFiles.length} arquivo(s) enviado(s) com sucesso`)
    } catch (error) {
      console.error('Erro no upload:', error)
      toast.error(error instanceof Error ? error.message : 'Erro no upload')
    } finally {
      setUploading(false)
    }
  }, [despesaId, files, onFilesChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: true
  })

  const deleteFile = async (fileId: number) => {
    setDeleting(fileId)
    
    try {
      const response = await fetch(`/api/upload?id=${fileId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao deletar arquivo')
      }

      const newFiles = files.filter(f => f.id !== fileId)
      setFiles(newFiles)
      onFilesChange?.(newFiles)
      toast.success('Arquivo deletado com sucesso')
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao deletar arquivo')
    } finally {
      setDeleting(null)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-4 w-4" />
    }
    if (mimeType === 'application/pdf') {
      return <FileText className="h-4 w-4" />
    }
    return <File className="h-4 w-4" />
  }

  const isImageFile = (mimeType: string) => mimeType.startsWith('image/')

  return (
    <div className={cn("space-y-4", className)}>
      {/* Área de Upload */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50",
          uploading && "pointer-events-none opacity-50"
        )}
      >
        <input {...getInputProps()} />
        <div className="space-y-2">
          {uploading ? (
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
          ) : (
            <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium">
              {uploading 
                ? "Enviando arquivos..." 
                : isDragActive
                ? "Solte os arquivos aqui"
                : "Clique ou arraste arquivos aqui"
              }
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, GIF ou PDF (máx. 5MB cada)
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Arquivos */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Comprovantes ({files.length})</h4>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50"
              >
                {/* Ícone do arquivo */}
                <div className="flex-shrink-0 text-muted-foreground">
                  {getFileIcon(file.tipoMime)}
                </div>

                {/* Informações do arquivo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {isImageFile(file.tipoMime) ? (
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium hover:text-primary transition-colors truncate"
                        title={file.nomeOriginal}
                      >
                        {file.nomeOriginal}
                      </a>
                    ) : (
                      <span className="text-sm font-medium truncate" title={file.nomeOriginal}>
                        {file.nomeOriginal}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatFileSize(file.tamanho)}
                  </div>
                </div>

                {/* Preview para imagens */}
                {isImageFile(file.tipoMime) && (
                  <div className="flex-shrink-0">
                    <img
                      src={file.url}
                      alt={file.nomeOriginal}
                      className="w-12 h-12 object-cover rounded border"
                    />
                  </div>
                )}

                {/* Botão de deletar */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteFile(file.id)}
                  disabled={deleting === file.id}
                  className="flex-shrink-0 h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                >
                  {deleting === file.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}