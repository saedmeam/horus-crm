"use client";
import { useState, useEffect } from 'react';
import { Plus, Image as ImageIcon, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import MainSidebar from '@/components/MainSidebar';

export default function BackordersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState<any>(null);

  const [form, setForm] = useState({
    contactId: '',
    orderNumber: '',
    productName: '',
    quantity: 1,
    notes: '',
    photoUrl: ''
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
      
      const [ordersRes, contactsRes] = await Promise.all([
        fetch(`${apiUrl}/api/backorders`, { headers }),
        fetch(`${apiUrl}/api/contacts`, { headers })
      ]);

      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (contactsRes.ok) setContacts(await contactsRes.json());
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleOpenNew = () => {
    setForm({
      contactId: '',
      orderNumber: `OC${String(orders.length + 1).padStart(4, '0')}`,
      productName: '',
      quantity: 1,
      notes: '',
      photoUrl: ''
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
      const res = await fetch(`${apiUrl}/api/backorders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        setShowModal(false);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const exportToExcel = () => {
    if (orders.length === 0) return;
    const data = orders.map(o => ({
      'Código OC': o.orderNumber,
      'Producto/Componente': o.productName,
      'Cantidad': o.quantity,
      'Contacto/Cliente': o.contact?.name || o.contact?.phone,
      'Notas': o.notes,
      'Fecha': new Date(o.createdAt).toLocaleString()
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "OrdenesDeCompra");
    XLSX.writeFile(wb, `Ordenes_Compra_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredOrders = orders.filter(o => 
    o.productName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex h-screen items-center justify-center">Cargando Órdenes...</div>;

  return (
    <div className="flex h-screen w-full bg-[#f4f7f6] dark:bg-[#111b21] overflow-hidden">
      <MainSidebar user={user} />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Órdenes de Compra (3D)</h2>
          <p className="text-gray-500 text-sm">Gestiona los componentes, repuestos y compras de la línea 3D.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={exportToExcel} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 whitespace-nowrap">
            Exportar Excel
          </button>
          <button onClick={handleOpenNew} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 whitespace-nowrap">
            <Plus size={18} /> Nueva Orden
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
          <Search size={18} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por código o producto..."
            className="w-full text-black outline-none bg-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="p-4 font-medium">Código</th>
                <th className="p-4 font-medium">Producto</th>
                <th className="p-4 font-medium">Cant.</th>
                <th className="p-4 font-medium">Cliente/Contacto</th>
                <th className="p-4 font-medium">Fecha</th>
                <th className="p-4 font-medium">Evidencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No hay órdenes de compra registradas.
                  </td>
                </tr>
              ) : filteredOrders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="p-4 font-semibold text-blue-600">{o.orderNumber || '-'}</td>
                  <td className="p-4 text-black font-medium">{o.productName}</td>
                  <td className="p-4 text-gray-700">{o.quantity}</td>
                  <td className="p-4 text-gray-700">{o.contact?.name || o.contact?.phone || '-'}</td>
                  <td className="p-4 text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="p-4">
                    {o.photoUrl ? (
                      <a href={o.photoUrl} target="_blank" rel="noreferrer" className="text-blue-500 flex items-center gap-1 hover:underline">
                        <ImageIcon size={16} /> Ver Foto
                      </a>
                    ) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Orden de Compra Form</h3>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">OrdenCompraID *</label>
                <input type="text" disabled className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-600 outline-none" value={form.orderNumber} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Repuesto *</label>
                <input required type="text" placeholder="Ej. Hotend Completo V6 24V" className="w-full px-3 py-2 border rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={form.productName} onChange={e => setForm({...form, productName: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad *</label>
                  <input required type="number" min="1" className="w-full px-3 py-2 border rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={form.quantity} onChange={e => setForm({...form, quantity: parseInt(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IdProveedor</label>
                  <select className="w-full px-3 py-2 border rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
                    value={form.contactId} onChange={e => setForm({...form, contactId: e.target.value})}>
                    <option value="">-- Seleccionar --</option>
                    {contacts.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name || c.phone}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Evidencia / Compromiso</label>
                <input type="url" placeholder="https://..." className="w-full px-3 py-2 border rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={form.photoUrl} onChange={e => setForm({...form, photoUrl: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas adicionales</label>
                <textarea rows={3} className="w-full px-3 py-2 border rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Guardar Orden</button>
              </div>
            </form>
          </div>
        </div>
      )}
            </div>
      </div>
    </div>
  );
}
