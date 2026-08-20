import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Truck, CheckCircle2, XCircle, Navigation, MapPin, RefreshCw, Power } from 'lucide-react';

export const AgentPortal: React.FC = () => {
  const { user } = useAuth();
  const [agentProfile, setAgentProfile] = useState<any>(user?.agentProfile || null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchAgentData();
  }, [user]);

  const fetchAgentData = async () => {
    setLoading(true);
    try {
      if (user?.role === 'AGENT') {
        const profileRes = await API.get('/auth/profile');
        setAgentProfile(profileRes.data.agentProfile);
      }

      const ordersRes = await API.get('/orders');
      setOrders(ordersRes.data);
    } catch (err) {
      console.error('Failed to fetch agent details', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (newStatus: 'AVAILABLE' | 'BUSY' | 'OFFLINE') => {
    if (!agentProfile) return;
    try {
      const res = await API.patch(`/agents/${agentProfile.id}/status`, { status: newStatus });
      setAgentProfile(res.data);
      setStatusMessage(`Availability updated to ${newStatus}`);
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update agent status');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await API.patch(`/orders/${orderId}/status`, {
        status,
        remarks: `Updated by delivery agent ${user?.name}`,
      });
      fetchAgentData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update order status');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header & Duty Controls */}
      <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="bg-blue-500/10 p-3 rounded-2xl border border-blue-500/30">
            <Truck className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              Agent Portal: {user?.name}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Vehicle: <span className="text-slate-200 font-semibold">{agentProfile?.vehicleType || 'BIKE'}</span> | Active Orders: <span className="text-emerald-400 font-bold">{orders.filter(o => !['DELIVERED', 'FAILED'].includes(o.currentStatus)).length}</span>
            </p>
          </div>
        </div>

        {/* Status Toggle Switcher */}
        <div className="flex items-center gap-3 bg-slate-900 p-2 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 font-medium px-2 flex items-center gap-1">
            <Power className="w-3.5 h-3.5 text-amber-400" /> Duty Status:
          </span>
          <button
            onClick={() => handleToggleStatus('AVAILABLE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              agentProfile?.status === 'AVAILABLE'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            AVAILABLE
          </button>
          <button
            onClick={() => handleToggleStatus('BUSY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              agentProfile?.status === 'BUSY'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            BUSY
          </button>
          <button
            onClick={() => handleToggleStatus('OFFLINE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              agentProfile?.status === 'OFFLINE'
                ? 'bg-rose-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            OFFLINE
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl mb-6 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {statusMessage}
        </div>
      )}

      {/* Orders Grid */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Navigation className="w-5 h-5 text-blue-400" /> Assigned Delivery Tasks
        </h2>
        <button
          onClick={fetchAgentData}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="bg-slate-950 p-12 rounded-2xl border border-slate-800 text-center">
          <Truck className="w-12 h-12 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">No delivery orders currently assigned to you.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-sm text-emerald-400 font-bold">{order.trackingNumber}</span>
                  <span className="text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider bg-slate-900 border border-slate-700 text-slate-200">
                    {order.currentStatus}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-300 mb-6 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong className="text-slate-400">Pickup:</strong> {order.pickupAddress} ({order.pickupPincode})</span>
                  </p>
                  <p className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                    <span><strong className="text-slate-400">Delivery:</strong> {order.dropAddress} ({order.dropPincode})</span>
                  </p>
                  <div className="flex justify-between pt-2 border-t border-slate-800 text-slate-400">
                    <span>Payment: <strong className="text-white">{order.paymentType}</strong></span>
                    <span>Total: <strong className="text-emerald-400 font-bold">₹{order.totalCharge}</strong></span>
                  </div>
                </div>
              </div>

              {/* Status Update Action Bar */}
              <div className="space-y-2 pt-4 border-t border-slate-800">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Advance Delivery State:</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleUpdateOrderStatus(order.id, 'PICKED_UP')}
                    disabled={['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED'].includes(order.currentStatus)}
                    className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Picked Up
                  </button>

                  <button
                    onClick={() => handleUpdateOrderStatus(order.id, 'IN_TRANSIT')}
                    disabled={['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED'].includes(order.currentStatus)}
                    className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    In Transit
                  </button>

                  <button
                    onClick={() => handleUpdateOrderStatus(order.id, 'OUT_FOR_DELIVERY')}
                    disabled={['OUT_FOR_DELIVERY', 'DELIVERED', 'FAILED'].includes(order.currentStatus)}
                    className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Out for Delivery
                  </button>

                  <button
                    onClick={() => handleUpdateOrderStatus(order.id, 'DELIVERED')}
                    disabled={['DELIVERED', 'FAILED'].includes(order.currentStatus)}
                    className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Delivered
                  </button>
                </div>

                <button
                  onClick={() => handleUpdateOrderStatus(order.id, 'FAILED')}
                  disabled={['DELIVERED', 'FAILED'].includes(order.currentStatus)}
                  className="w-full mt-2 py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" /> Flag Delivery Failed
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
