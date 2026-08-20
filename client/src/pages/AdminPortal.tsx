import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { ShieldCheck, Package, Users, DollarSign, Cpu, Settings, Edit3, ArrowRight, RefreshCw, AlertOctagon } from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'rate-cards' | 'agents'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [rateCards, setRateCards] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrderForOverride, setSelectedOrderForOverride] = useState<any>(null);
  const [overrideStatus, setOverrideStatus] = useState('DELIVERED');
  const [overrideRemarks, setOverrideRemarks] = useState('');

  // Edit Rate Card Modal
  const [editingRateCard, setEditingRateCard] = useState<any>(null);

  useEffect(() => {
    fetchAdminData();
  }, [statusFilter]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const ordersRes = await API.get('/orders', { params: { status: statusFilter } });
      const agentsRes = await API.get('/agents');
      const ratesRes = await API.get('/rate-cards');
      const zonesRes = await API.get('/zones');

      setOrders(ordersRes.data);
      setAgents(agentsRes.data);
      setRateCards(ratesRes.data);
      setZones(zonesRes.data);
    } catch (err) {
      console.error('Failed to fetch admin dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoAssign = async (orderId: string) => {
    try {
      const res = await API.post(`/orders/${orderId}/auto-assign`);
      alert(`Auto-assigned: ${res.data.assignment.reason}`);
      fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.error || err.response?.data?.reason || 'Auto-assignment failed');
    }
  };

  const handleManualAssign = async (orderId: string, agentId: string) => {
    if (!agentId) return;
    try {
      await API.patch(`/orders/${orderId}/assign`, { agentId });
      fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Manual assignment failed');
    }
  };

  const handleOverrideStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForOverride) return;
    try {
      await API.patch(`/orders/${selectedOrderForOverride.id}/override-status`, {
        status: overrideStatus,
        remarks: overrideRemarks,
      });
      setSelectedOrderForOverride(null);
      fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Admin override failed');
    }
  };

  const handleSaveRateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRateCard) return;
    try {
      await API.put(`/rate-cards/${editingRateCard.id}`, editingRateCard);
      setEditingRateCard(null);
      fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update rate card');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl flex items-center gap-4">
          <div className="bg-emerald-500/10 p-3 rounded-2xl border border-emerald-500/30">
            <Package className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Orders</p>
            <p className="text-2xl font-bold text-white mt-0.5">{orders.length}</p>
          </div>
        </div>

        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl flex items-center gap-4">
          <div className="bg-blue-500/10 p-3 rounded-2xl border border-blue-500/30">
            <Users className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Available Agents</p>
            <p className="text-2xl font-bold text-white mt-0.5">
              {agents.filter((a) => a.status === 'AVAILABLE').length} / {agents.length}
            </p>
          </div>
        </div>

        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl flex items-center gap-4">
          <div className="bg-amber-500/10 p-3 rounded-2xl border border-amber-500/30">
            <AlertOctagon className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Unassigned Orders</p>
            <p className="text-2xl font-bold text-amber-400 mt-0.5">
              {orders.filter((o) => !o.assignedAgentId).length}
            </p>
          </div>
        </div>

        <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl flex items-center gap-4">
          <div className="bg-purple-500/10 p-3 rounded-2xl border border-purple-500/30">
            <DollarSign className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Total Revenue</p>
            <p className="text-2xl font-bold text-white mt-0.5">
              ₹{orders.reduce((acc, o) => acc + (o.totalCharge || 0), 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-4">
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all ${
              activeTab === 'orders' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" /> Dispatch & Orders Management
          </button>

          <button
            onClick={() => setActiveTab('rate-cards')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs transition-all ${
              activeTab === 'rate-cards' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" /> Configurable Rate Cards
          </button>
        </div>

        <button
          onClick={fetchAdminData}
          className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-center gap-1.5 self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Live Grid
        </button>
      </div>

      {/* TAB 1: Dispatch & Orders Management */}
      {activeTab === 'orders' && (
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl overflow-x-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Live Orders Grid</h2>

            {/* Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Order Statuses</option>
              <option value="CREATED">CREATED</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="PICKED_UP">PICKED_UP</option>
              <option value="IN_TRANSIT">IN_TRANSIT</option>
              <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="FAILED">FAILED</option>
              <option value="RESCHEDULED">RESCHEDULED</option>
            </select>
          </div>

          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3">Tracking #</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Route</th>
                <th className="p-3">Weight / Charge</th>
                <th className="p-3">Status</th>
                <th className="p-3">Assigned Agent</th>
                <th className="p-3">Assignment Action</th>
                <th className="p-3">Admin Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3 font-mono font-bold text-emerald-400">{order.trackingNumber}</td>
                  <td className="p-3">
                    <p className="font-semibold text-white">{order.customer?.name}</p>
                    <p className="text-[10px] text-slate-500">{order.customer?.phone}</p>
                  </td>
                  <td className="p-3">
                    <p>{order.pickupPincode} → {order.dropPincode}</p>
                    <span className="text-[10px] text-slate-500 capitalize">{order.orderType} ({order.paymentType})</span>
                  </td>
                  <td className="p-3">
                    <p className="font-semibold text-white">{order.billedWeightKg} kg</p>
                    <p className="text-emerald-400 font-bold">₹{order.totalCharge}</p>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-900 border border-slate-700 text-slate-200">
                      {order.currentStatus}
                    </span>
                  </td>
                  <td className="p-3">
                    {order.assignedAgent ? (
                      <span className="font-semibold text-white">{order.assignedAgent.user?.name}</span>
                    ) : (
                      <span className="text-amber-400 font-semibold flex items-center gap-1">Unassigned</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAutoAssign(order.id)}
                        className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg text-[11px] transition-all flex items-center gap-1 shadow-sm"
                        title="Run Auto-Assignment Engine"
                      >
                        <Cpu className="w-3 h-3" /> Auto
                      </button>

                      <select
                        onChange={(e) => handleManualAssign(order.id, e.target.value)}
                        defaultValue=""
                        className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-300 focus:outline-none"
                      >
                        <option value="" disabled>Manual...</option>
                        {agents.map((ag) => (
                          <option key={ag.id} value={ag.id}>
                            {ag.name} ({ag.status})
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => {
                        setSelectedOrderForOverride(order);
                        setOverrideStatus(order.currentStatus);
                      }}
                      className="px-2.5 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1"
                    >
                      <ShieldCheck className="w-3 h-3" /> Override
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: Configurable Rate Cards */}
      {activeTab === 'rate-cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rateCards.map((card) => (
            <div key={card.id} className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {card.orderType}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {card.relation} Zone
                  </span>
                </div>
                <div className="space-y-1 text-xs text-slate-300 mt-4">
                  <p>Rate per Kg: <strong className="text-white text-sm">₹{card.ratePerKg}</strong></p>
                  <p>Base Charge: <strong className="text-white">₹{card.baseCharge}</strong></p>
                  <p>Minimum Charge: <strong className="text-white">₹{card.minCharge}</strong></p>
                </div>
              </div>

              <button
                onClick={() => setEditingRateCard(card)}
                className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl"
              >
                <Edit3 className="w-4 h-4 text-emerald-400" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Admin Privileged Override Modal */}
      {selectedOrderForOverride && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-400" /> Privileged Status Override
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Tracking #: <span className="font-mono text-emerald-400 font-bold">{selectedOrderForOverride.trackingNumber}</span>
            </p>

            <form onSubmit={handleOverrideStatus} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">New Status State</label>
                <select
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="CREATED">CREATED</option>
                  <option value="ASSIGNED">ASSIGNED</option>
                  <option value="PICKED_UP">PICKED_UP</option>
                  <option value="IN_TRANSIT">IN_TRANSIT</option>
                  <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="FAILED">FAILED</option>
                  <option value="RESCHEDULED">RESCHEDULED</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Admin Override Reason / Audit Remarks</label>
                <textarea
                  value={overrideRemarks}
                  onChange={(e) => setOverrideRemarks(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                  rows={3}
                  placeholder="e.g. Manual override due to customer verification."
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrderForOverride(null)}
                  className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20"
                >
                  Apply Admin Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Rate Card Modal */}
      {editingRateCard && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-emerald-400" /> Edit Rate Card Rule
            </h3>

            <form onSubmit={handleSaveRateCard} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Rate per Kg (₹)</label>
                <input
                  type="number"
                  value={editingRateCard.ratePerKg}
                  onChange={(e) => setEditingRateCard({ ...editingRateCard, ratePerKg: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Base Charge (₹)</label>
                <input
                  type="number"
                  value={editingRateCard.baseCharge}
                  onChange={(e) => setEditingRateCard({ ...editingRateCard, baseCharge: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Minimum Charge (₹)</label>
                <input
                  type="number"
                  value={editingRateCard.minCharge}
                  onChange={(e) => setEditingRateCard({ ...editingRateCard, minCharge: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingRateCard(null)}
                  className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  Save Rate Card Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
