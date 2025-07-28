import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function ExplorerPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (text: string, isUser: boolean) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userQuestion = input.trim();
    setInput('');
    addMessage(userQuestion, true);
    setIsLoading(true);

    try {
      // For now, we'll use a simple response system
      // In a real implementation, you'd query the database and use AI
      const response = await generateAIResponse(userQuestion);
      addMessage(response, false);
    } catch (error) {
      addMessage('Lo siento, hubo un error procesando tu pregunta. Inténtalo de nuevo.', false);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIResponse = async (question: string): Promise<string> => {
    // This is a placeholder implementation
    // In a real app, you'd:
    // 1. Query relevant data from Supabase
    // 2. Send to AI endpoint with context
    // 3. Return AI-generated response

    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('startup') && lowerQuestion.includes('runway')) {
      return 'Para encontrar startups con runway específico, necesitaría consultar la base de datos de métricas. Actualmente no hay datos suficientes para responder esta pregunta.';
    }
    
    if (lowerQuestion.includes('memo') || lowerQuestion.includes('inversión')) {
      return 'Para generar un memo de inversión, necesitaría acceso a los documentos y métricas de la startup específica. ¿Podrías especificar qué startup te interesa?';
    }
    
    if (lowerQuestion.includes('churn') || lowerQuestion.includes('abandono')) {
      return 'Los datos de churn se pueden encontrar en la pestaña de métricas de cada startup. También puedes usar el comparador para ver múltiples startups a la vez.';
    }
    
    if (lowerQuestion.includes('documento') || lowerQuestion.includes('subir')) {
      return 'Puedes subir documentos desde la página de cada startup, en la pestaña "Documentos". Los archivos se procesan automáticamente con IA para extraer información clave.';
    }
    
    return 'Entiendo tu pregunta. Para darte una respuesta más precisa, necesitaría acceso a los datos específicos de las startups. ¿Podrías reformular tu pregunta o especificar qué startup te interesa?';
  };

  const suggestedQuestions = [
    '¿Qué startups tienen runway menor a 6 meses?',
    'Genera un memo de inversión para la startup X',
    '¿Cuáles son las métricas de churn más altas?',
    'Muéstrame los documentos de la startup Y',
    'Compara las métricas de ARR entre startups',
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Buscador Inteligente (IA Chat)</h1>
      
      <div className="max-w-4xl mx-auto">
        <div className="bg-white border rounded-lg shadow-sm h-96 flex flex-col">
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500">
                <p className="mb-4">Haz preguntas sobre startups, documentos o métricas</p>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Ejemplos de preguntas:</p>
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => setInput(question)}
                      className="block w-full text-left text-sm text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-gray-50"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.isUser
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-800 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                  <p className="text-sm">Pensando...</p>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input form */}
          <div className="border-t p-4">
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Haz una pregunta sobre startups, documentos o métricas..."
                className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
              >
                Enviar
              </button>
            </form>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <p>💡 <strong>Consejos:</strong></p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Pregunta sobre métricas específicas (ARR, MRR, churn, etc.)</li>
            <li>Solicita comparaciones entre startups</li>
            <li>Pide análisis de documentos subidos</li>
            <li>Genera memos de inversión</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 