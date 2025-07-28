import { useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function UploadPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleUpload() {
    setError(null);
    setSuccess(null);
    const files = fileInputRef.current?.files;
    if (!files || files.length === 0) {
      setError('Selecciona al menos un archivo.');
      return;
    }
    setUploading(true);
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
    setUploading(false);
    setSuccess('¡Archivos subidos correctamente!');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Carga Inteligente de Documentos</h1>
      <div className="border rounded p-4 bg-white shadow max-w-md">
        <input ref={fileInputRef} type="file" multiple className="mb-2" />
        <button
          onClick={handleUpload}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          disabled={uploading}
        >
          {uploading ? 'Subiendo...' : 'Subir archivos'}
        </button>
        {error && <p className="text-red-600 mt-2">{error}</p>}
        {success && <p className="text-green-600 mt-2">{success}</p>}
      </div>
      <p className="text-gray-500 mt-4">Puedes subir archivos PDF, Word, Excel, PowerPoint o TXT. Se almacenarán en Supabase Storage y se registrarán en la base de datos.</p>
    </div>
  );
} 