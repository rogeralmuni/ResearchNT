import { useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface DocumentUploaderProps {
  startupId?: string;
}

export default function DocumentUploader({ startupId }: DocumentUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [vectorizing, setVectorizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function extractTextFromFile(file: File): Promise<string> {
    if (file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.type === 'application/msword') {
      setExtracting(true);
      try {
        const reader = new FileReader();
        return await new Promise((resolve, reject) => {
          reader.onload = async (e) => {
            try {
              const base64 = (e.target?.result as string)?.split(',')[1];
              const res = await fetch('/api/extract-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fileBase64: base64, fileType: file.type }),
              });
              if (!res.ok) throw new Error('Error extrayendo texto');
              const data = await res.json();
              resolve(data.text);
            } catch (err) {
              reject(err);
            } finally {
              setExtracting(false);
            }
          };
          reader.onerror = (err) => {
            setExtracting(false);
            reject(err);
          };
          reader.readAsDataURL(file);
        });
      } catch (err) {
        setExtracting(false);
        throw err;
      }
    } else if (file.type.startsWith('text/')) {
      // Plain text file
      return await file.text();
    } else {
      return '';
    }
  }

  async function vectorizeText(text: string): Promise<number[] | null> {
    setVectorizing(true);
    try {
      const res = await fetch('/api/vectorize-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error('Error vectorizando texto');
      const data = await res.json();
      return data.embedding;
    } catch (err) {
      setError('Error vectorizando el texto');
      return null;
    } finally {
      setVectorizing(false);
    }
  }

  async function processDocumentWithAI(content: string, documentId: string) {
    try {
      const response = await fetch('/api/process-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) throw new Error('Error processing document with AI');

      const aiResults = await response.json();

      // Update document with AI results
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          summary: aiResults.summary,
          kpis: aiResults.kpis,
          red_flags: aiResults.redFlags,
        })
        .eq('id', documentId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error('Error processing document with AI:', error);
    }
  }

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
      const docData: any = {
        name: file.name,
        type: file.type,
        url: storageData?.path,
        uploaded_at: new Date().toISOString(),
      };
      if (startupId) docData.startup_id = startupId;
      const { data: insertedDoc, error: dbError } = await supabase.from('documents').insert([docData]).select();
      if (dbError) {
        setError(`Error registrando ${file.name} en la base de datos: ${dbError.message}`);
        setUploading(false);
        return;
      }

      // Extract text and process with AI
      let extractedText = '';
      try {
        extractedText = await extractTextFromFile(file);
      } catch (err) {
        setError(`Error extrayendo texto de ${file.name}`);
        setUploading(false);
        return;
      }

      // Vectorize text and store embedding
      let embedding: number[] | null = null;
      if (extractedText && insertedDoc && insertedDoc[0]) {
        embedding = await vectorizeText(extractedText);
        if (embedding) {
          await supabase
            .from('documents')
            .update({ embedding })
            .eq('id', insertedDoc[0].id);
        }
      }

      if (extractedText && insertedDoc && insertedDoc[0]) {
        setProcessing(true);
        try {
          await processDocumentWithAI(extractedText, insertedDoc[0].id);
        } catch (error) {
          console.error('Error processing with AI:', error);
        }
        setProcessing(false);
      }
    }
    setUploading(false);
    setSuccess('¡Archivos subidos y procesados correctamente!');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  return (
    <div className="border rounded p-4 bg-white shadow max-w-md">
      <h3 className="text-lg font-bold mb-2">Sube tus documentos</h3>
      <input ref={fileInputRef} type="file" multiple className="mb-2" />
      <button
        onClick={handleUpload}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        disabled={uploading || processing || extracting || vectorizing}
      >
        {uploading
          ? 'Subiendo...'
          : extracting
          ? 'Extrayendo texto...'
          : vectorizing
          ? 'Vectorizando...'
          : processing
          ? 'Procesando IA...'
          : 'Subir archivos'}
      </button>
      {error && <p className="text-red-600 mt-2">{error}</p>}
      {success && <p className="text-green-600 mt-2">{success}</p>}
    </div>
  );
} 