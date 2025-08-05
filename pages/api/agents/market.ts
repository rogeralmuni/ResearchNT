import { NextApiRequest, NextApiResponse } from 'next';
import { getStartupById } from '../../../lib/database';

const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://localhost:8001';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { startupId } = req.body;

  if (!startupId) {
    return res.status(400).json({ error: 'Startup ID is required' });
  }

  try {
    // Get startup information
    const startup = await getStartupById(startupId);
    if (!startup) {
      return res.status(404).json({ error: 'Startup not found' });
    }

    const request = {
      startupId,
      startupName: startup.name,
      startupDescription: startup.description || '',
      startupSector: startup.sector || ''
    };

    // Check if streaming is requested
    const { stream } = req.query;
    
    if (stream === 'true') {
      // Proxy to Python service for streaming
      const pythonResponse = await fetch(`${PYTHON_SERVICE_URL}/api/research/market/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!pythonResponse.ok) {
        throw new Error(`Python service error: ${pythonResponse.statusText}`);
      }

      // Set headers for streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Transfer-Encoding', 'chunked');

      // Pipe the response from Python service
      const reader = pythonResponse.body?.getReader();
      if (reader) {
        const decoder = new TextDecoder();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          res.write(chunk);
        }
        
        res.end();
      } else {
        res.status(500).json({ error: 'Failed to get stream from Python service' });
      }
    } else {
      // Non-streaming response - proxy to Python service
      const pythonResponse = await fetch(`${PYTHON_SERVICE_URL}/api/research/market`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!pythonResponse.ok) {
        throw new Error(`Python service error: ${pythonResponse.statusText}`);
      }

      const result = await pythonResponse.json();
      res.status(200).json(result);
    }
  } catch (error) {
    console.error('Error in market research:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 