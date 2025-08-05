import { NextApiRequest, NextApiResponse } from 'next';
import { getDatabase } from '../../lib/database';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = getDatabase();

  try {
    switch (req.method) {
      case 'GET':
        // Obtener documentos de una startup
        const { startupId } = req.query;
        
        if (!startupId) {
          return res.status(400).json({ error: 'startupId es requerido' });
        }

        const documents = db.prepare(`
          SELECT * FROM documents 
          WHERE startup_id = ? 
          ORDER BY uploaded_at DESC
        `).all(startupId);

        res.status(200).json(documents);
        break;

      default:
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error en documents API:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
} 