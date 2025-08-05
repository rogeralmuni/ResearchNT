import { NextApiRequest, NextApiResponse } from 'next';
import { getDatabase } from '../../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const db = getDatabase();

  try {
    switch (req.method) {
      case 'GET':
        // Obtener un documento específico
        const document = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
        
        if (!document) {
          return res.status(404).json({ error: 'Documento no encontrado' });
        }

        res.status(200).json(document);
        break;

      case 'PUT':
        // Actualizar un documento
        const { summary, kpis, red_flags, embedding } = req.body;
        
        const updateDocument = db.prepare(`
          UPDATE documents 
          SET summary = ?, kpis = ?, red_flags = ?, embedding = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `);

        const result = updateDocument.run(
          summary || null,
          kpis || null,
          red_flags || null,
          embedding || null,
          id
        );

        if (result.changes === 0) {
          return res.status(404).json({ error: 'Documento no encontrado' });
        }

        const updatedDocument = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
        res.status(200).json(updatedDocument);
        break;

      case 'DELETE':
        // Eliminar un documento
        const deleteDocument = db.prepare('DELETE FROM documents WHERE id = ?');
        const deleteResult = deleteDocument.run(id);

        if (deleteResult.changes === 0) {
          return res.status(404).json({ error: 'Documento no encontrado' });
        }

        res.status(204).end();
        break;

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error en documents API:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
} 