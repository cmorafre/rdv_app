"use client"

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, File, Image, FileText } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface FileSelectorProps {
  onFilesChange: (files: File[]) => void
  className?: string
  disabled?: boolean
}

export function FileSelector({ onFilesChange, className, disabled = false }: FileSelectorProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (disabled) return
    
    const newFiles = [...selectedFiles, ...acceptedFiles]
    setSelectedFiles(newFiles)
    onFilesChange(newFiles)
  }, [selectedFiles, onFilesChange, disabled])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: true,
    disabled
  })

  const removeFile = (index: number) => {
    if (disabled) return
    
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)
    onFilesChange(newFiles)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="h-4 w-4" />
    }
    if (file.type === 'application/pdf') {
      return <FileText className="h-4 w-4" />
    }
    return <File className="h-4 w-4" />
  }

  const isImageFile = (file: File) => file.type.startsWith('image/')

  return (
    <div className={cn("space-y-4", className)}>
      {/* Área de Seleção */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
          isDragActive && !disabled
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        <input {...getInputProps()} />
        <div className="space-y-2">
          <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              {isDragActive && !disabled
                ? "Solte os arquivos aqui"
                : "Clique ou arraste comprovantes aqui"
              }
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, GIF ou PDF (máx. 5MB cada)
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Arquivos Selecionados */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">
            Arquivos selecionados ({selectedFiles.length})
          </h4>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center gap-3 p-2 border rounded-lg bg-muted/30"
              >
                {/* Ícone do arquivo */}
                <div className="flex-shrink-0 text-muted-foreground">
                  {getFileIcon(file)}
                </div>

                {/* Informações do arquivo */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>

                {/* Preview para imagens */}
                {isImageFile(file) && (
                  <div className="flex-shrink-0">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-10 h-10 object-cover rounded border"
                    />
                  </div>
                )}

                {/* Botão de remover */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={disabled}
                  className="flex-shrink-0 h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Os arquivos serão enviados após salvar a despesa
          </p>
        </div>
      )}
    </div>
  )
}