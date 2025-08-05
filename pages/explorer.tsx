import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

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
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Buscador Inteligente
        </h1>
        <p className="text-lg text-gray-600">
          Haz preguntas sobre tu portafolio usando inteligencia artificial
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    ¡Hola! ¿En qué puedo ayudarte?
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Pregúntame sobre startups, documentos, métricas o análisis
                  </p>
                </div>
              )}
              
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-slide-up`}
                >
                  <div className={`flex items-start space-x-3 max-w-2xl ${message.isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.isUser ? 'bg-primary-600' : 'bg-gray-200'
                    }`}>
                      {message.isUser ? (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      )}
                    </div>
                    
                    {/* Message */}
                    <div className={`rounded-xl px-4 py-3 ${
                      message.isUser
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm leading-relaxed">{message.text}</p>
                      <p className={`text-xs mt-2 ${
                        message.isUser ? 'text-primary-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start animate-slide-up">
                  <div className="flex items-start space-x-3 max-w-2xl">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div className="bg-gray-100 rounded-xl px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-sm text-gray-600">Pensando...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input form */}
            <div className="border-t border-gray-200 p-4">
              <form onSubmit={handleSubmit} className="flex space-x-3">
                <div className="flex-1">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Haz una pregunta sobre startups, documentos o métricas..."
                    disabled={isLoading}
                    className="mb-0"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  loading={isLoading}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </Button>
              </form>
            </div>
          </Card>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Suggested Questions */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Preguntas Sugeridas</h3>
            </CardHeader>
            <CardContent className="space-y-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInput(question)}
                  className="w-full text-left text-sm text-gray-700 hover:text-primary-600 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200 border border-gray-200 hover:border-primary-200"
                >
                  {question}
                </button>
              ))}
            </CardContent>
          </Card>
          
          {/* Tips */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">💡 Consejos</h3>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Pregunta sobre métricas específicas (ARR, MRR, churn, etc.)</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Solicita comparaciones entre startups</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Pide análisis de documentos subidos</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>Genera memos de inversión</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 