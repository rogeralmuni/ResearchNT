import { NextApiRequest, NextApiResponse } from 'next';
import { getDatabase } from '../../lib/database';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = getDatabase();

  try {
    switch (req.method) {
      case 'GET':
        // Obtener mensajes del chat
        const { startupId, tabType } = req.query;
        
        if (!startupId || !tabType) {
          return res.status(400).json({ error: 'startupId y tabType son requeridos' });
        }

        const messages = db.prepare(`
          SELECT * FROM chat_messages 
          WHERE startup_id = ? AND tab_type = ? 
          ORDER BY timestamp ASC
        `).all(startupId, tabType);

        res.status(200).json(messages);
        break;

      case 'POST':
        // Enviar mensaje y obtener respuesta de IA
        const { startupId: postStartupId, tabType: postTabType, message } = req.body;
        
        if (!postStartupId || !postTabType || !message) {
          return res.status(400).json({ error: 'startupId, tabType y message son requeridos' });
        }

        // Obtener información de la startup
        const startup = db.prepare('SELECT * FROM startups WHERE id = ?').get(postStartupId);
        
        if (!startup) {
          return res.status(404).json({ error: 'Startup no encontrada' });
        }

        // Obtener contexto del chat
        const chatHistory = db.prepare(`
          SELECT * FROM chat_messages 
          WHERE startup_id = ? AND tab_type = ? 
          ORDER BY timestamp DESC 
          LIMIT 10
        `).all(postStartupId, postTabType);

        // Insertar mensaje del usuario
        const insertUserMessage = db.prepare(`
          INSERT INTO chat_messages (id, startup_id, tab_type, message_text, is_user)
          VALUES (?, ?, ?, ?, ?)
        `);

        const userMessageId = uuidv4();
        insertUserMessage.run(userMessageId, postStartupId, postTabType, message, true);

        // Preparar contexto para la IA
        const contextPrompt = postTabType === 'competitors' 
          ? `Eres un experto en análisis de competidores. Analiza la startup "${startup.name}" y responde preguntas sobre sus competidores, mercado y estrategia competitiva.`
          : `Eres un experto en análisis de mercado. Analiza la startup "${startup.name}" y responde preguntas sobre su mercado, oportunidades, tendencias y estrategia de mercado.`;

        const systemPrompt = `${contextPrompt}

        INFORMACIÓN DE LA STARTUP:
        - Nombre: ${startup.name}
        - Descripción: ${startup.description || 'No disponible'}
        - Año de fundación: ${startup.founded_year || 'No disponible'}
        - Empleados: ${startup.employee_count || 'No disponible'}
        - Financiación: ${startup.funding_raised ? `$${(startup.funding_raised / 1000000).toFixed(1)}M` : 'No disponible'}
        - Ingresos: ${startup.revenue ? `$${(startup.revenue / 1000000).toFixed(1)}M` : 'No disponible'}

        Responde de manera clara, concisa y útil. Si no tienes suficiente información, indícalo y sugiere qué datos adicionales serían útiles.`;

        // Preparar historial de conversación
        const conversationHistory = chatHistory.reverse().map((msg: any) => ({
          role: msg.is_user ? 'user' : 'assistant',
          content: msg.message_text
        }));

        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
              {
                role: "system",
                content: systemPrompt
              },
              ...conversationHistory,
              {
                role: "user",
                content: message
              }
            ],
            temperature: 0.7,
          });

          const aiResponse = completion.choices[0]?.message?.content;
          
          if (!aiResponse) {
            throw new Error('No se recibió respuesta de OpenAI');
          }

          // Insertar respuesta de la IA
          const insertAiMessage = db.prepare(`
            INSERT INTO chat_messages (id, startup_id, tab_type, message_text, is_user)
            VALUES (?, ?, ?, ?, ?)
          `);

          const aiMessageId = uuidv4();
          insertAiMessage.run(aiMessageId, postStartupId, postTabType, aiResponse, false);

          res.status(200).json({
            userMessage: { id: userMessageId, message_text: message, is_user: true },
            aiMessage: { id: aiMessageId, message_text: aiResponse, is_user: false }
          });

        } catch (aiError) {
          console.error('Error en chat AI:', aiError);
          res.status(500).json({ error: 'Error en el procesamiento del mensaje' });
        }
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error en chat-messages API:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
} 