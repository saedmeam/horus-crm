"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MainSidebar from '@/components/MainSidebar';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function KanbanPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedItem, setDraggedItem] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!token || !storedUser) {
      router.push('/login');
    } else {
      setUser(JSON.parse(storedUser));
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    try {
      const [convRes, setRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}`}/api/conversations`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}`}/api/settings`, { headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') } })
      ]);
      if (convRes.ok && setRes.ok) {
        const [convData, setData] = await Promise.all([convRes.json(), setRes.json()]);
        setConversations(convData);
        setStages(setData.pipelineStages || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragStart = (e: any, conv: any) => {
    setDraggedItem(conv);
    e.dataTransfer.setData('text/plain', conv.id);
    e.dataTransfer.effectAllowed = 'move';
    // Timeout keeps the card visible while dragging but slightly ghosted on the original spot
    setTimeout(() => {
      e.target.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e: any) => {
    e.target.style.opacity = '1';
    setDraggedItem(null);
  };

  const handleDragOver = (e: any) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: any, stageId: string) => {
    e.preventDefault();
    if (!draggedItem) return;
    
    // Optimistic UI update
    const convId = draggedItem.id;
    if (draggedItem.stage === stageId) return; // No change
    
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, stage: stageId } : c));

    // Update backend
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/conversations/\${convId}/stage`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify({ stage: stageId })
      });
    } catch (err) {
      console.error('Error updating stage', err);
      // Revert if error
      fetchData();
    }
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center bg-gray-50">Cargando Tablero...</div>;

  return (
    <div className="flex h-screen w-full bg-[#f4f7f6] dark:bg-[#111b21] overflow-hidden">
      <MainSidebar user={user} />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-white dark:bg-[#202c33] border-b border-gray-200 dark:border-[#374248] flex items-center px-6 shrink-0 shadow-sm z-10">
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
            Embudo de Ventas (Kanban)
          </h1>
          <div className="ml-auto flex items-center gap-4">
            <button onClick={fetchData} className="text-sm font-semibold text-blue-600 hover:text-blue-800">
              Refrescar
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-x-auto overflow-y-hidden p-6">
          <div className="flex h-full items-start space-x-6 min-w-max pb-4">
            {stages.map(stage => {
              const stageConvs = conversations.filter(c => c.stage === stage.id || (!c.stage && stage.id === 'NUEVO_LEAD'));
              
              return (
                <div 
                  key={stage.id} 
                  className="w-80 h-full flex flex-col bg-gray-100 dark:bg-[#202c33] rounded-2xl border border-gray-200 dark:border-[#2a3942] shadow-sm"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, stage.id)}
                >
                  <div 
                    className="h-1.5 w-full rounded-t-2xl" 
                    style={{ backgroundColor: stage.color || '#3b82f6' }}
                  ></div>
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-[#2a3942] flex items-center justify-between bg-white/50 dark:bg-black/10 rounded-t-xl">
                    <h2 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color || '#3b82f6' }}></div>
                      {stage.name}
                    </h2>
                    <span className="text-xs font-bold text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                      {stageConvs.length}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {stageConvs.map(conv => (
                      <div 
                        key={conv.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, conv)}
                        onDragEnd={handleDragEnd}
                        onClick={() => router.push('/?chat=' + conv.id)}
                        className="bg-white dark:bg-[#111b21] p-4 rounded-xl shadow-sm border border-gray-200 dark:border-[#374248] cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group relative"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-gray-800 dark:text-gray-100 truncate pr-2">
                            {conv.contact?.name || conv.contact?.phone}
                          </h3>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap">
                            {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true, locale: es })}
                          </span>
                        </div>
                        
                        {conv.messages && conv.messages.length > 0 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-3 italic">
                            "{conv.messages[0].content}"
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded">
                            {conv.channel}
                          </span>
                          {conv.assignedUser && (
                            <span className="text-[10px] font-bold text-blue-600 dark:text-[#00a884]">
                              👤 {conv.assignedUser.name.split(' ')[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {stageConvs.length === 0 && (
                      <div className="h-full flex items-center justify-center text-sm text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-4 text-center">
                        Suelta un contacto aquí
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
