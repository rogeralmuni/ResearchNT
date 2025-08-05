import { NextApiRequest, NextApiResponse } from 'next';
import { getDatabase } from '../../lib/database';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { startupId, fileName, fileType, fileBase64 } = req.body;

    if (!startupId || !fileName || !fileType || !fileBase64) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = getDatabase();

    // Crear directorio de uploads si no existe
    const uploadsDir = path.join(process.cwd(), 'data', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generar nombre único para el archivo
    const fileId = uuidv4();
    const fileExtension = path.extname(fileName);
    const uniqueFileName = `${fileId}${fileExtension}`;
    const filePath = path.join(uploadsDir, uniqueFileName);

    // Decodificar y guardar el archivo
    const buffer = Buffer.from(fileBase64, 'base64');
    fs.writeFileSync(filePath, buffer);

    // Obtener tamaño del archivo
    const stats = fs.statSync(filePath);
    const fileSize = stats.size;

    // Guardar metadata en la base de datos
    const insertDocument = db.prepare(`
      INSERT INTO documents (id, startup_id, filename, file_path, file_size, file_type)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const documentId = uuidv4();
    insertDocument.run(
      documentId,
      startupId,
      fileName,
      uniqueFileName, // Guardamos solo el nombre del archivo, no la ruta completa
      fileSize,
      fileType
    );

    res.status(200).json({
      id: documentId,
      filename: fileName,
      file_path: uniqueFileName,
      file_size: fileSize,
      file_type: fileType,
      message: 'Document uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Error uploading document' });
  }
} 