const fs = require('fs');
let code = fs.readFileSync('frontend/src/app/page.tsx', 'utf8');

// 1. Add states
code = code.replace(
  `const [showAssignDropdown, setShowAssignDropdown] = useState(false);`,
  `const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [collabSelection, setCollabSelection] = useState<string[]>([]);`
);

// 2. Add function to open collab modal
const apiCallLogic = `
  const openCollabModal = () => {
    if (!selectedChat) return;
    setCollabSelection(selectedChat.collaborators?.map((c: any) => c.id) || []);
    setShowCollabModal(true);
  };

  const handleSaveCollabs = async () => {
    if (!selectedChat) return;
    try {
      const res = await fetch(\`\${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api/conversations/\${selectedChat.id}/collaborators\`, {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer ' + localStorage.getItem('token'),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ collaboratorIds: collabSelection })
      });
      if (res.ok) {
        setShowCollabModal(false);
        // Optimistic update
        const updatedCollabs = agents.filter(a => collabSelection.includes(a.id));
        setSelectedChat((prev: any) => ({ ...prev, collaborators: updatedCollabs }));
        setConversations(prev => prev.map(c => c.id === selectedChat.id ? { ...c, collaborators: updatedCollabs } : c));
        toast.success('Colaboradores actualizados');
      }
    } catch(err) { console.error(err); }
  };
`;
code = code.replace(
  `const handleAssignTo = async`,
  apiCallLogic + '\n  const handleAssignTo = async'
);

// 3. Add Users icon import
if (!code.includes('Users,')) {
    code = code.replace(/UserPlus,/g, 'UserPlus, Users,');
} else {
    code = code.replace(/UserPlus,/g, 'UserPlus,'); // no-op if already has it
}

// 4. Add UI button in header
const oldHeaderBtns = `<button 
      onClick={() => {
        if (selectedChat?.assignedUserId) {`;
const newHeaderBtns = `<div className="relative">
      <button 
        onClick={openCollabModal}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors shadow-sm bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800"
        title="Gestionar Colaboradores"
      >
        <Users className="w-4 h-4" />
        <span className="hidden sm:inline">Colaboradores</span>
        {selectedChat?.collaborators?.length > 0 && (
          <span className="bg-indigo-200 dark:bg-indigo-700 text-indigo-800 dark:text-indigo-200 px-1.5 py-0.5 rounded-full text-xs">
            {selectedChat.collaborators.length}
          </span>
        )}
      </button>
    </div>
    
    <button 
      onClick={() => {
        if (selectedChat?.assignedUserId) {`;
code = code.replace(oldHeaderBtns, newHeaderBtns);

// 5. Add Modal HTML to the bottom of the page
const modalHtml = `
      {/* Collab Modal */}
      {showCollabModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#202c33] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-indigo-600 p-4 text-white flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg flex items-center gap-2"><Users className="w-5 h-5"/> Colaboradores del Chat</h3>
              <button onClick={() => setShowCollabModal(false)} className="hover:bg-white/20 p-1.5 rounded-full transition"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              <p className="text-sm text-gray-600 dark:text-[#aebac1] mb-4">
                Selecciona los usuarios que podrán ver y atender este chat sin cambiar la asignación principal.
              </p>
              <div className="space-y-2">
                {agents.map(agent => (
                  <label key={agent.id} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-[#2a3942] rounded-lg hover:bg-gray-50 dark:hover:bg-[#2a3942] cursor-pointer transition">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 accent-indigo-600 rounded"
                      checked={collabSelection.includes(agent.id)}
                      onChange={(e) => {
                        if (e.target.checked) setCollabSelection(p => [...p, agent.id]);
                        else setCollabSelection(p => p.filter(id => id !== agent.id));
                      }}
                    />
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{agent.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-[#2a3942] flex justify-end gap-2 shrink-0">
              <button onClick={() => setShowCollabModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-[#2a3942] font-semibold">Cancelar</button>
              <button onClick={handleSaveCollabs} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold">Guardar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
`;
code = code.replace(/\s*<\/div>\s*\);\s*\}\s*$/g, modalHtml);

// 6. Socket logic for collaborators update
const socketLogic = `
        newSocket.on('chat_collaborators_updated', (data: any) => {
          fetchConversations(); // Recargar la lista para reflejar visibilidad
          setSelectedChat((prev: any) => {
            if (prev?.id === data.conversationId) {
              return { ...prev, collaborators: data.collaborators };
            }
            return prev;
          });
        });
`;
code = code.replace(
  /newSocket\.on\('chat_assigned'/g,
  socketLogic + "\n        newSocket.on('chat_assigned'"
);

fs.writeFileSync('frontend/src/app/page.tsx', code);
console.log('page.tsx collab UI added successfully');
