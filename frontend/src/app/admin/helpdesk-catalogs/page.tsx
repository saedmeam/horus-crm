"use client";
import React, { useState, useEffect } from 'react';

export default function HelpdeskCatalogs() {
  const [activeTab, setActiveTab] = useState('clients');
  const [data, setData] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form
  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [brand, setBrand] = useState('');
  
  useEffect(() => {
    fetchData();
    if (activeTab === 'equipments') {
      fetchClients();
    }
  }, [activeTab]);

  const fetchClients = async () => {
    const token = localStorage.getItem('token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
    try {
      const res = await fetch(`${apiUrl}/api/helpdesk/clients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setClients(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
    let endpoint = '';
    if (activeTab === 'clients') endpoint = '/api/helpdesk/clients';
    if (activeTab === 'equipments') endpoint = '/api/helpdesk/equipments';
    if (activeTab === 'incident-types') endpoint = '/api/helpdesk/incident-types';
    if (activeTab === 'task-types') endpoint = '/api/helpdesk/task-types';
    
    try {
      const res = await fetch(`${apiUrl}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setData(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (activeTab === 'equipments' && !clientId) {
      alert('Debe seleccionar un cliente para este equipo');
      return;
    }

    const token = localStorage.getItem('token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
    let endpoint = '';
    const bodyData: any = { name };

    if (activeTab === 'clients') endpoint = '/api/helpdesk/clients';
    if (activeTab === 'equipments') {
      endpoint = '/api/helpdesk/equipments';
      bodyData.clientId = clientId;
      bodyData.brand = brand;
    }
    if (activeTab === 'incident-types') endpoint = '/api/helpdesk/incident-types';
    if (activeTab === 'task-types') endpoint = '/api/helpdesk/task-types';

    try {
      const res = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyData)
      });
      if (res.ok) {
        setName('');
        setBrand('');
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Catálogos de Mesa de Ayuda</h1>
      
      <div className="flex space-x-1 bg-gray-100 dark:bg-[#202c33] p-1 rounded-lg mb-6">
        {[
          { id: 'clients', label: 'Clientes (Hospitales/Empresas)' },
          { id: 'equipments', label: 'Equipos' },
          { id: 'incident-types', label: 'Tipos de Incidencia' },
          { id: 'task-types', label: 'Tipos de Tareas (Reportes)' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab.id ? 'bg-white dark:bg-[#111b21] shadow text-blue-600 dark:text-[#00a884]' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-[#202c33] p-6 rounded-xl shadow-sm border border-gray-200 dark:border-[#374248]">
        <form onSubmit={handleSave} className="flex flex-col gap-4 mb-6">
          <div className="flex gap-4">
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Escriba el nombre del nuevo elemento..."
              className="flex-1 border border-gray-300 dark:border-[#374248] rounded-lg px-4 py-2 bg-white dark:bg-[#111b21] text-gray-900 dark:text-white outline-none"
            />
            
            {activeTab === 'equipments' && (
              <>
                <input 
                  type="text" 
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Marca (Opcional)"
                  className="w-1/4 border border-gray-300 dark:border-[#374248] rounded-lg px-4 py-2 bg-white dark:bg-[#111b21] text-gray-900 dark:text-white outline-none"
                />
                <select 
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-1/3 border border-gray-300 dark:border-[#374248] rounded-lg px-4 py-2 bg-white dark:bg-[#111b21] text-gray-900 dark:text-white outline-none"
                >
                  <option value="">Seleccione Cliente...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </>
            )}
            
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors whitespace-nowrap">
              Agregar
            </button>
          </div>
        </form>

        {loading ? (
          <p className="text-gray-500">Cargando...</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-[#374248]">
            {data.map(item => (
              <li key={item.id} className="py-4 flex justify-between items-center text-gray-800 dark:text-gray-200">
                <div>
                  <div className="font-semibold">{item.name}</div>
                  {activeTab === 'equipments' && item.client && (
                    <div className="text-sm text-gray-500 mt-1">
                      Pertenece a: <span className="font-medium text-blue-600 dark:text-[#00a884]">{item.client.name}</span>
                    </div>
                  )}
                </div>
                {item.brand && <span className="text-gray-500 text-sm bg-gray-100 dark:bg-[#111b21] px-2 py-1 rounded">Marca: {item.brand}</span>}
              </li>
            ))}
            {data.length === 0 && (
              <li className="py-4 text-center text-gray-500">No hay registros en este catálogo.</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
