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
        // Obtener competidores de una startup
        const { startupId } = req.query;
        
        if (!startupId) {
          return res.status(400).json({ error: 'startupId es requerido' });
        }

        const competitors = db.prepare(`
          SELECT * FROM competitors 
          WHERE startup_id = ? 
          ORDER BY similarity_score DESC
        `).all(startupId);

        res.status(200).json(competitors);
        break;

      case 'POST':
        // Investigar competidores usando IA
        const { startupId: postStartupId } = req.body;
        
        if (!postStartupId) {
          return res.status(400).json({ error: 'startupId es requerido' });
        }

        // Obtener información de la startup
        const startup = db.prepare('SELECT * FROM startups WHERE id = ?').get(postStartupId);
        
        if (!startup) {
          return res.status(404).json({ error: 'Startup no encontrada' });
        }

        // Prompt para investigación de competidores
        const researchPrompt = `
        Analiza la siguiente startup y encuentra competidores relevantes:

        NOMBRE: ${startup.name}
        DESCRIPCIÓN: ${startup.description || 'No disponible'}
        AÑO DE FUNDACIÓN: ${startup.founded_year || 'No disponible'}
        EMPLEADOS: ${startup.employee_count || 'No disponible'}
        FINANCIACIÓN: ${startup.funding_raised ? `$${(startup.funding_raised / 1000000).toFixed(1)}M` : 'No disponible'}
        INGRESOS: ${startup.revenue ? `$${(startup.revenue / 1000000).toFixed(1)}M` : 'No disponible'}
        ${startup.vector_description ? `DESCRIPCIÓN VECTORIZADA: ${startup.vector_description}` : ''}

        Encuentra 5-8 competidores directos e indirectos. Para cada competidor, proporciona:

        {
          "competitors": [
            {
              "competitor_name": "Nombre del competidor",
              "description": "Descripción breve del producto/servicio",
              "founded_year": 2020,
              "employee_count": 50,
              "funding_raised": 5000000,
              "revenue": 2000000,
              "linkedin_url": "https://linkedin.com/company/...",
              "website_url": "https://website.com",
              "main_features": "Características principales del producto",
              "similarity_score": 0.85
            }
          ]
        }

        Incluye tanto startups conocidas como empresas establecidas. Los scores de similitud deben estar entre 0.6 y 0.95.
        `;

        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
              {
                role: "system",
                content: "Eres un experto en análisis de mercado y competidores. Proporciona información precisa y relevante."
              },
              {
                role: "user",
                content: researchPrompt
              }
            ],
            temperature: 0.7,
          });

          const responseText = completion.choices[0]?.message?.content;
          
          if (!responseText) {
            throw new Error('No se recibió respuesta de OpenAI');
          }

          // Extraer JSON de la respuesta
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error('No se pudo extraer JSON de la respuesta');
          }

          const competitorsData = JSON.parse(jsonMatch[0]);
          
          // Insertar competidores en la base de datos
          const insertCompetitor = db.prepare(`
            INSERT INTO competitors (
              id, startup_id, competitor_name, description, founded_year, 
              employee_count, funding_raised, revenue, linkedin_url, website_url, 
              main_features, similarity_score, is_external, research_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          const transaction = db.transaction(() => {
            competitorsData.competitors.forEach((competitor: any) => {
              const competitorId = uuidv4();
              insertCompetitor.run(
                competitorId,
                postStartupId,
                competitor.competitor_name,
                competitor.description,
                competitor.founded_year,
                competitor.employee_count,
                competitor.funding_raised,
                competitor.revenue,
                competitor.linkedin_url,
                competitor.website_url,
                competitor.main_features,
                competitor.similarity_score,
                true, // is_external
                'completed'
              );
            });
          });

          transaction();

          res.status(200).json({
            message: 'Competidores investigados exitosamente',
            count: competitorsData.competitors.length
          });

        } catch (aiError) {
          console.error('Error en investigación de competidores:', aiError);
          res.status(500).json({ error: 'Error en la investigación de competidores' });
        }
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Error en competitors API:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
} 