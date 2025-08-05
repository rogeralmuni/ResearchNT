import { useState } from 'react';

interface DocumentUploaderProps {
  startupId?: string;
  onUploadComplete?: () => void;
}

export default function DocumentUploader({ startupId, onUploadComplete }: DocumentUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [vectorizing, setVectorizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function extractTextFromFile(file: File): Promise<string> {
    setExtracting(true);
    try {
      if (file.type === 'application/pdf') {
        // For PDF files, we'll just return a placeholder since we removed the extract-text API
        return `PDF Document: ${file.name}`;
      } else if (file.type.startsWith('text/')) {
        // Plain text file
        return await file.text();
      } else {
        return '';
      }
    } catch (err) {
      setExtracting(false);
      throw err;
    } finally {
      setExtracting(false);
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

      // Update document with AI results using local API
      const updateResponse = await fetch(`/api/documents/${documentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: aiResults.summary,
          kpis: aiResults.kpis,
          red_flags: aiResults.redFlags,
        }),
      });

      if (!updateResponse.ok) throw new Error('Error updating document');
    } catch (error) {
      console.error('Error processing document with AI:', error);
    }
  }

  async function uploadFile(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = (e.target?.result as string)?.split(',')[1];
          const response = await fetch('/api/upload-document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              startupId,
              fileName: file.name,
              fileType: file.type,
              fileBase64: base64,
            }),
          });

          if (!response.ok) throw new Error('Error uploading file');
          const uploadResult = await response.json();
          resolve(uploadResult);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Error reading file'));
      reader.readAsDataURL(file);
    });
  }

  async function handleUpload() {
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    const file = fileInput?.files?.[0];
    
    if (!file) {
      setError('Please select a file');
      return;
    }

    if (!startupId) {
      setError('Startup ID is required');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Upload the file
      const uploadResult = await uploadFile(file);
      
      // Extract text content
      const textContent = await extractTextFromFile(file);
      
      // Process with AI if we have content
      if (textContent) {
        await processDocumentWithAI(textContent, uploadResult.id);
      }

      // Update the document with the extracted text
      await fetch(`/api/documents/${uploadResult.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: textContent,
        }),
      });

      // Clear the file input
      fileInput.value = '';
      
      // Notify parent component
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('Error uploading file');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <div className="text-center">
          <div className="mt-4">
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="mt-2 block text-sm font-medium text-gray-900">
                Upload a document
              </span>
              <span className="mt-1 block text-xs text-gray-500">
                PDF, TXT, or other text files
              </span>
            </label>
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              className="sr-only"
              accept=".pdf,.txt,.doc,.docx"
              onChange={() => setError(null)}
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleUpload}
          disabled={uploading || extracting || vectorizing}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : extracting ? 'Extracting...' : vectorizing ? 'Processing...' : 'Upload Document'}
        </button>
      </div>
    </div>
  );
} 