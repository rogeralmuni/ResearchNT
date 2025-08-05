import { useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';

export default function UploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (fileInputRef.current) {
        fileInputRef.current.files = e.dataTransfer.files;
      }
    }
  };

  async function handleUpload() {
    setError(null);
    setSuccess(null);
    const files = fileInputRef.current?.files;
    if (!files || files.length === 0) {
      setError('Selecciona al menos un archivo.');
      return;
    }
    setUploading(true);
    
    try {
      for (const file of Array.from(files)) {
        const filePath = `${Date.now()}_${file.name}`;
        // Upload to Supabase Storage (bucket: 'documents')
        const { data: storageData, error: storageError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);
        
        if (storageError) {
          setError(`Error subiendo ${file.name}: ${storageError.message}`);
          setUploading(false);
          return;
        }
        
        // Register in DB
        const { error: dbError } = await supabase.from('documents').insert([
          {
            name: file.name,
            type: file.type,
            url: storageData?.path,
            uploaded_at: new Date().toISOString(),
          },
        ]);
        
        if (dbError) {
          setError(`Error registrando ${file.name} en la base de datos: ${dbError.message}`);
          setUploading(false);
          return;
        }
      }
      
      setSuccess(`Se subieron ${files.length} archivo(s) exitosamente.`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError('Error inesperado durante la subida.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Carga Inteligente de Documentos
        </h1>
        <p className="text-lg text-gray-600">
          Sube documentos de startups para análisis automático y extracción de insights
        </p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">Subir Documentos</h2>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Drag and Drop Area */}
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-200 ${
              dragActive
                ? 'border-primary-400 bg-primary-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Arrastra archivos aquí o haz clic para seleccionar
                </h3>
                <p className="text-gray-500">
                  Soporta PDF, DOC, DOCX, XLS, XLSX y otros formatos de documentos
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={() => {
                  // Clear previous messages when files are selected
                  setError(null);
                  setSuccess(null);
                }}
              />
            </div>
          </div>

          {/* File Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Tipos de archivo soportados:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>PDF</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Word (DOC, DOCX)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Excel (XLS, XLSX)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                <span>Texto (TXT, CSV)</span>
              </div>
            </div>
          </div>

          {/* Upload Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleUpload}
              loading={uploading}
              disabled={uploading}
              size="lg"
            >
              {uploading ? 'Subiendo...' : 'Subir Documentos'}
            </Button>
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-error-50 border border-error-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-error-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-error-800">Error</h3>
                  <p className="text-sm text-error-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-success-50 border border-success-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-success-800">Éxito</h3>
                  <p className="text-sm text-success-700 mt-1">{success}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">¿Qué sucede después?</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Análisis Automático</h4>
              <p className="text-sm text-gray-600">Los documentos se procesan automáticamente para extraer información clave</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Extracción de KPIs</h4>
              <p className="text-sm text-gray-600">Se identifican métricas clave y datos financieros relevantes</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Detección de Riesgos</h4>
              <p className="text-sm text-gray-600">Se identifican posibles red flags y áreas de atención</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 