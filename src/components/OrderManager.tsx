import React, { useState } from 'react';
import {
  Plus,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  Printer,
  FileText,
  DollarSign,
  Phone,
  Trash2,
  Edit,
  ExternalLink,
  MessageCircle
} from 'lucide-react';
import { CustomerOrder, OrderStatus, TechniqueType } from '../types';

export const OrderManager: React.FC = () => {
  const [orders, setOrders] = useState<CustomerOrder[]>([
    {
      id: 'ord-101',
      orderNumber: 'PED-1082',
      customerName: 'Santiago Rossi (Gimnasio Titan)',
      phone: '+54 9 11 5824-9912',
      email: 'contacto@titanfit.com',
      technique: 'DTF Textil',
      itemsDescription: '15 Remeras Algodón Peinado 24/1 Negras (L y XL) con Logo Frente y Espalda Calada',
      quantity: 15,
      garmentType: 'Remera Algodón',
      garmentColor: 'Negro Carbón',
      status: 'En Cola de Impresión',
      deliveryDate: '2026-10-02',
      totalAmount: 142500,
      depositAmount: 70000,
      notes: 'Planchar a 160°C por 15s con despegue en frío. Segundo planchado con papel siliconado mate.',
      createdAt: '2026-09-27',
    },
    {
      id: 'ord-102',
      orderNumber: 'PED-1083',
      customerName: 'Lucía Benítez (Café Nómade)',
      phone: '+54 9 11 4110-3320',
      technique: 'Sublimación',
      itemsDescription: '24 Tazas Cerámicas Importadas AAA con diseño tropical full color',
      quantity: 24,
      garmentType: 'Taza Cerámica',
      garmentColor: 'Blanco Brillo',
      status: 'Estampado',
      deliveryDate: '2026-09-30',
      totalAmount: 84000,
      depositAmount: 84000,
      notes: 'Horno de tazas a 195°C por 180 segundos. Revisar que la manija no quede expuesta.',
      createdAt: '2026-09-25',
    },
    {
      id: 'ord-103',
      orderNumber: 'PED-1084',
      customerName: 'Federico Gómez (Band Rock)',
      phone: '+54 9 11 9923-8814',
      technique: 'DTF Textil',
      itemsDescription: '30 Buzos Hoodie Frisados con estampado DTF formato A3 en pecho',
      quantity: 30,
      garmentType: 'Buzo Hoodie',
      garmentColor: 'Gris Melange',
      status: 'Presupuesto',
      deliveryDate: '2026-10-06',
      totalAmount: 360000,
      depositAmount: 0,
      notes: 'Esperando validación de muestra virtual enviada por WhatsApp.',
      createdAt: '2026-09-28',
    },
    {
      id: 'ord-104',
      orderNumber: 'PED-1085',
      customerName: 'Cervecería Patagonia Craft',
      phone: '+54 9 11 3344-5566',
      technique: 'DTF UV',
      itemsDescription: '50 Vasos de Vidrio Pinta con logo DTF UV relieve brillante',
      quantity: 50,
      garmentType: 'Vidrio / Botellas',
      garmentColor: 'Transparente',
      status: 'Entregado',
      deliveryDate: '2026-09-26',
      totalAmount: 110000,
      depositAmount: 110000,
      notes: 'Transferencia directa sin calor. Adhesión ultra fuerte.',
      createdAt: '2026-09-22',
    },
  ]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [ticketOrder, setTicketOrder] = useState<CustomerOrder | null>(null);

  // New Order Form state
  const [newOrder, setNewOrder] = useState<Partial<CustomerOrder>>({
    customerName: '',
    phone: '',
    technique: 'DTF Textil',
    itemsDescription: '',
    quantity: 10,
    garmentType: 'Remera Algodón',
    garmentColor: 'Negro',
    status: 'En Cola de Impresión',
    deliveryDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    totalAmount: 50000,
    depositAmount: 25000,
    notes: 'Planchar con parámetros estándar DTF.',
  });

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.customerName) return;

    const created: CustomerOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: `PED-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: newOrder.customerName || '',
      phone: newOrder.phone || '',
      email: newOrder.email || '',
      technique: (newOrder.technique as TechniqueType) || 'DTF Textil',
      itemsDescription: newOrder.itemsDescription || 'Estampas personalizadas',
      quantity: Number(newOrder.quantity) || 1,
      garmentType: newOrder.garmentType || 'Remera',
      garmentColor: newOrder.garmentColor || 'Negro',
      status: (newOrder.status as OrderStatus) || 'En Cola de Impresión',
      deliveryDate: newOrder.deliveryDate || '',
      totalAmount: Number(newOrder.totalAmount) || 0,
      depositAmount: Number(newOrder.depositAmount) || 0,
      notes: newOrder.notes || '',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setOrders([created, ...orders]);
    setIsModalOpen(false);
    setNewOrder({
      customerName: '',
      phone: '',
      technique: 'DTF Textil',
      itemsDescription: '',
      quantity: 10,
      garmentType: 'Remera Algodón',
      garmentColor: 'Negro',
      status: 'En Cola de Impresión',
      totalAmount: 50000,
      depositAmount: 25000,
      notes: '',
    });
  };

  const handleUpdateStatus = (id: string, newStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
    );
  };

  const handleDeleteOrder = (id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  };

  // WhatsApp reminder generator
  const sendWhatsApp = (order: CustomerOrder) => {
    const text = encodeURIComponent(
      `¡Hola ${order.customerName}! Te escribimos desde el taller de sublimación y DTF. Tu pedido *#${order.orderNumber}* (${order.quantity} unidades) se encuentra en estado: *${order.status}*. Saldo pendiente: $${order.totalAmount - order.depositAmount}.`
    );
    const cleanPhone = order.phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.itemsDescription.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const statusColors: Record<OrderStatus, string> = {
    Presupuesto: 'text-slate-400 bg-slate-800/80 border-slate-700',
    'En Diseño': 'text-purple-400 bg-purple-950/40 border-purple-800',
    'En Cola de Impresión': 'text-amber-400 bg-amber-950/40 border-amber-800',
    Estampado: 'text-blue-400 bg-blue-950/40 border-blue-800',
    Entregado: 'text-emerald-400 bg-emerald-950/40 border-emerald-800',
  };

  return (
    <div className="flex flex-col h-full w-full p-4 gap-4 text-slate-200">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#111726] p-4 rounded-xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar cliente, número de pedido..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-64"
            />
          </div>

          {/* Status filter tabs */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
            {['all', 'Presupuesto', 'En Cola de Impresión', 'Estampado', 'Entregado'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  filterStatus === st
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st === 'all' ? 'Todos' : st}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-lg font-semibold text-xs bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Nuevo Pedido de Taller
        </button>
      </div>

      {/* Orders Table View */}
      <div className="flex-1 bg-[#111726] rounded-xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0e1422] text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Pedido / Cliente</th>
                <th className="py-3 px-4">Técnica & Prendas</th>
                <th className="py-3 px-4">Cantidad</th>
                <th className="py-3 px-4">Entrega</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Monto / Saldo</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 italic">
                    No se encontraron pedidos con los filtros actuales.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const balance = ord.totalAmount - ord.depositAmount;
                  return (
                    <tr key={ord.id} className="hover:bg-slate-900/50 transition-colors">
                      {/* Customer Info */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-white block text-sm">{ord.customerName}</span>
                        <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px] mt-0.5">
                          <span>{ord.orderNumber}</span>
                          <span>·</span>
                          <span>{ord.phone}</span>
                        </div>
                      </td>

                      {/* Technique & Items */}
                      <td className="py-3 px-4 max-w-xs">
                        <span className="font-semibold text-indigo-400 block">{ord.technique}</span>
                        <p className="text-slate-300 truncate text-[11px]" title={ord.itemsDescription}>
                          {ord.itemsDescription}
                        </p>
                      </td>

                      {/* Quantity */}
                      <td className="py-3 px-4 font-mono font-bold text-white tabular-nums">
                        {ord.quantity} uds.
                      </td>

                      {/* Delivery Date */}
                      <td className="py-3 px-4 font-mono text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{ord.deliveryDate}</span>
                        </div>
                      </td>

                      {/* Status Dropdown */}
                      <td className="py-3 px-4">
                        <select
                          value={ord.status}
                          onChange={(e) => handleUpdateStatus(ord.id, e.target.value as OrderStatus)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border ${statusColors[ord.status]} focus:outline-none`}
                        >
                          <option value="Presupuesto">Presupuesto</option>
                          <option value="En Diseño">En Diseño</option>
                          <option value="En Cola de Impresión">En Cola de Impresión</option>
                          <option value="Estampado">Estampado</option>
                          <option value="Entregado">Entregado</option>
                        </select>
                      </td>

                      {/* Financials */}
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        <span className="font-bold text-white block text-sm">
                          ${ord.totalAmount.toLocaleString()}
                        </span>
                        <span
                          className={`text-[11px] ${
                            balance <= 0 ? 'text-emerald-400' : 'text-amber-400'
                          }`}
                        >
                          {balance <= 0 ? 'Pagado Total' : `Resta: $${balance.toLocaleString()}`}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Print Workshop Ticket */}
                          <button
                            onClick={() => setTicketOrder(ord)}
                            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                            title="Ver Ficha Técnica de Taller"
                          >
                            <FileText className="w-4 h-4 text-indigo-400" />
                          </button>

                          {/* WhatsApp Client Notification */}
                          <button
                            onClick={() => sendWhatsApp(ord)}
                            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors"
                            title="Notificar por WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>

                          {/* Delete Order */}
                          <button
                            onClick={() => handleDeleteOrder(ord.id)}
                            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Eliminar Pedido"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE ORDER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111726] border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 bg-[#0e1422] flex items-center justify-between">
              <h3 className="font-bold text-white text-sm">Registrar Nuevo Pedido de Taller</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-semibold"
              >
                Cerrar
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Nombre del Cliente / Empresa</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Juan Pérez"
                    value={newOrder.customerName}
                    onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="Ej. +54 9 11 1234-5678"
                    value={newOrder.phone}
                    onChange={(e) => setNewOrder({ ...newOrder, phone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Técnica</label>
                  <select
                    value={newOrder.technique}
                    onChange={(e) => setNewOrder({ ...newOrder, technique: e.target.value as TechniqueType })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="DTF Textil">DTF Textil</option>
                    <option value="Sublimación">Sublimación</option>
                    <option value="DTF UV">DTF UV</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Cantidad (Uds)</label>
                  <input
                    type="number"
                    min="1"
                    value={newOrder.quantity}
                    onChange={(e) => setNewOrder({ ...newOrder, quantity: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Fecha de Entrega</label>
                  <input
                    type="date"
                    value={newOrder.deliveryDate}
                    onChange={(e) => setNewOrder({ ...newOrder, deliveryDate: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Detalle de Prendas o Artículos</label>
                <textarea
                  rows={2}
                  placeholder="Ej. 10 Remeras Algodón talle M y L, color Negro, estampa pecho 28x20cm"
                  value={newOrder.itemsDescription}
                  onChange={(e) => setNewOrder({ ...newOrder, itemsDescription: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Monto Total ($)</label>
                  <input
                    type="number"
                    step="100"
                    value={newOrder.totalAmount}
                    onChange={(e) => setNewOrder({ ...newOrder, totalAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Anticipo / Seña Recibida ($)</label>
                  <input
                    type="number"
                    step="100"
                    value={newOrder.depositAmount}
                    onChange={(e) => setNewOrder({ ...newOrder, depositAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Guardar Pedido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT WORKSHOP TICKET MODAL */}
      {ticketOrder && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#111726] border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 bg-[#0e1422] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-white text-sm">Ficha Técnica de Producción</h3>
              </div>
              <button
                onClick={() => setTicketOrder(null)}
                className="text-slate-400 hover:text-white text-xs font-semibold"
              >
                Cerrar
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs bg-white text-slate-900">
              <div className="flex justify-between border-b pb-3 border-slate-200">
                <div>
                  <h2 className="text-base font-extrabold tracking-tight">SUBLIDTF STUDIO - ORDEN DE TRABAJO</h2>
                  <p className="text-xs text-slate-500">Taller de Estampado Profesional</p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-sm font-bold block">{ticketOrder.orderNumber}</span>
                  <span className="text-xs text-slate-500">Entrega: {ticketOrder.deliveryDate}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 py-2 border-b border-slate-200">
                <div>
                  <span className="text-slate-500 block text-[11px]">Cliente:</span>
                  <strong className="text-slate-800">{ticketOrder.customerName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Técnica:</span>
                  <strong className="text-indigo-600">{ticketOrder.technique}</strong>
                </div>
              </div>

              <div>
                <span className="text-slate-500 block text-[11px] mb-1">Prendas / Cantidad:</span>
                <p className="p-2 bg-slate-100 rounded text-slate-800 font-medium">
                  {ticketOrder.itemsDescription} ({ticketOrder.quantity} unidades)
                </p>
              </div>

              {/* Technical Pressing Recipe Box */}
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg space-y-2">
                <span className="font-bold text-indigo-950 uppercase text-[11px] block">
                  ⚙️ Parámetros de Plancha Térmica:
                </span>
                <div className="grid grid-cols-3 gap-2 text-center text-slate-800 font-mono">
                  <div className="bg-white p-1.5 rounded border border-indigo-100">
                    <span className="text-[10px] text-slate-500 block">Temperatura</span>
                    <strong>{ticketOrder.technique === 'Sublimación' ? '200°C' : '160°C'}</strong>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-indigo-100">
                    <span className="text-[10px] text-slate-500 block">Tiempo</span>
                    <strong>{ticketOrder.technique === 'Sublimación' ? '45 seg' : '15 seg'}</strong>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-indigo-100">
                    <span className="text-[10px] text-slate-500 block">Pelado</span>
                    <strong>{ticketOrder.technique === 'Sublimación' ? 'Caliente' : 'Frío (Cold)'}</strong>
                  </div>
                </div>
                <p className="text-[11px] text-indigo-900 mt-1 italic">
                  * {ticketOrder.notes || 'Segundo planchado con papel siliconado 5 segundos para sellado mate.'}
                </p>
              </div>

              <div className="flex justify-between items-center pt-2 text-slate-600 font-mono text-[11px]">
                <span>Total: ${ticketOrder.totalAmount.toLocaleString()}</span>
                <span>Seña: ${ticketOrder.depositAmount.toLocaleString()}</span>
                <strong className="text-slate-900 text-xs">
                  Resta Cobrar: ${(ticketOrder.totalAmount - ticketOrder.depositAmount).toLocaleString()}
                </strong>
              </div>
            </div>

            <div className="p-4 bg-[#0e1422] border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir Ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
