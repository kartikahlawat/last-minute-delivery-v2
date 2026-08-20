import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Calculator, Package, Clock, CheckCircle2, AlertTriangle, Calendar, ArrowRight, Shield, MapPin } from 'lucide-react';

export const CustomerPortal: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'quote' | 'my-orders'>('quote');

  // Form State
  const [formData, setFormData] = useState({
    pickupAddress: 'MG Road Hub, Bangalore',
    pickupPincode: '560001',
    dropAddress: 'Koramangala Tech Park, Bangalore',
    dropPincode: '560034',
    lengthCm: '30',
    breadthCm: '20',
    heightCm: '15',
    actualWeightKg: '2.5',
    orderType: 'B2C',
    paymentType: 'PREPAID',
    scheduledDate: new Date().toISOString().split('T')[0],
  });

  const [quoteResult, setQuoteResult] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);

  useEffect(() => {
    if (activeTab === 'my-orders') {
      fetchOrders();
    }
  }, [activeTab]);

  const fetchOrders = async () => {
    try {
      const res = await API.get('/orders');
      setOrders(res.data);
    } catch (err: any) {
      console.error('Failed to fetch orders', err);
    }
  };

  const fetchTimeline = async (orderId: string) => {
    try {
      const res = await API.get(`/orders/${orderId}/timeline`);
      setTimeline(res.data);
    } catch (err: any) {
      console.error('Failed to fetch timeline', err);
    }
  };

  const handleCalculateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setCalculating(true);
    setMessage(null);
    try {
      const res = await API.post('/orders/quote', {
        ...formData,
        lengthCm: Number(formData.lengthCm),
        breadthCm: Number(formData.breadthCm),
        heightCm: Number(formData.heightCm),
        actualWeightKg: Number(formData.actualWeightKg),
      });
      setQuoteResult(res.data);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Quote calculation failed.' });
    } finally {
      setCalculating(false);
    }
  };

  const handleCreateOrder = async () => {
    setPlacingOrder(true);
    setMessage(null);
    try {
      const res = await API.post('/orders', {
        ...formData,
        lengthCm: Number(formData.lengthCm),
        breadthCm: Number(formData.breadthCm),
        heightCm: Number(formData.heightCm),
        actualWeightKg: Number(formData.actualWeightKg),
      });
      setMessage({ type: 'success', text: `Order placed successfully! Tracking #: ${res.data.trackingNumber}` });
      setActiveTab('my-orders');
      setQuoteResult(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Order placement failed.' });
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      await API.post(`/orders/${selectedOrder.id}/reschedule`, {
        newDate: rescheduleDate,
        reason: rescheduleReason,
      });
      setShowRescheduleModal(false);
      fetchOrders();
      fetchTimeline(selectedOrder.id);
      setMessage({ type: 'success', text: 'Order delivery rescheduled successfully.' });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Reschedule failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package className="w-7 h-7 text-emerald-400" /> Customer Shipping & Order Tracking
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Get instant rate quotes with volumetric weight calculations and track your shipments in real-time.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 self-start">
          <button
            onClick={() => setActiveTab('quote')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'quote' ? 'bg-emerald-500 text-slate-950 shadow-md font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calculator className="w-4 h-4" /> Instant Quote & Order
          </button>
          <button
            onClick={() => setActiveTab('my-orders')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === 'my-orders' ? 'bg-emerald-500 text-slate-950 shadow-md font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" /> My Orders ({orders.length})
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl mb-6 border flex items-center gap-3 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          {message.text}
        </div>
      )}

      {/* TAB 1: Quote Estimator & Order Creation */}
      {activeTab === 'quote' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form */}
          <div className="lg:col-span-7 bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-400" /> Rate Calculation & Shipment Inputs
            </h2>

            <form onSubmit={handleCalculateQuote} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Pickup Address</label>
                  <input
                    type="text"
                    value={formData.pickupAddress}
                    onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Pickup Pincode</label>
                  <input
                    type="text"
                    value={formData.pickupPincode}
                    onChange={(e) => setFormData({ ...formData, pickupPincode: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. 560001"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Delivery Address</label>
                  <input
                    type="text"
                    value={formData.dropAddress}
                    onChange={(e) => setFormData({ ...formData, dropAddress: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Delivery Pincode</label>
                  <input
                    type="text"
                    value={formData.dropPincode}
                    onChange={(e) => setFormData({ ...formData, dropPincode: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. 560034 or 400001"
                    required
                  />
                </div>
              </div>

              {/* Package Dimensions & Weight */}
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
                <p className="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-emerald-400" /> Package Dimensions & Weight
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Length (cm)</label>
                    <input
                      type="number"
                      value={formData.lengthCm}
                      onChange={(e) => setFormData({ ...formData, lengthCm: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Breadth (cm)</label>
                    <input
                      type="number"
                      value={formData.breadthCm}
                      onChange={(e) => setFormData({ ...formData, breadthCm: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Height (cm)</label>
                    <input
                      type="number"
                      value={formData.heightCm}
                      onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Actual Wt (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.actualWeightKg}
                      onChange={(e) => setFormData({ ...formData, actualWeightKg: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Order Type & Payment Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Order Category</label>
                  <select
                    value={formData.orderType}
                    onChange={(e) => setFormData({ ...formData, orderType: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="B2C">B2C Retail Shipment</option>
                    <option value="B2B">B2B Bulk Commercial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Payment Method</label>
                  <select
                    value={formData.paymentType}
                    onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="PREPAID">Prepaid (Online)</option>
                    <option value="COD">Cash on Delivery (COD)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={calculating}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
              >
                {calculating ? 'Calculating Engine Quote...' : 'Calculate Shipping Quote'}
              </button>
            </form>
          </div>

          {/* Quote Result Card */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl flex-1 flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center justify-between">
                  <span>Shipping Quote Preview</span>
                  {quoteResult && (
                    <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-1 rounded-full border border-emerald-500/30">
                      {quoteResult.relation} Zone
                    </span>
                  )}
                </h2>

                {quoteResult ? (
                  <div className="space-y-4">
                    {/* Price Banner */}
                    <div className="bg-gradient-to-br from-emerald-950/60 to-slate-900 p-5 rounded-2xl border border-emerald-500/30 text-center">
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Estimated Charge</p>
                      <p className="text-4xl font-extrabold text-white mt-1">₹{quoteResult.totalCharge}</p>
                      <p className="text-xs text-emerald-400 mt-1 font-medium">Includes base rate + COD surcharges</p>
                    </div>

                    {/* Weight Breakdown */}
                    <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
                      <div className="flex justify-between text-slate-300">
                        <span>Actual Weight:</span>
                        <span className="font-semibold text-white">{formData.actualWeightKg} kg</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Volumetric Weight:</span>
                        <span className="font-semibold text-emerald-400">{quoteResult.volumetricWeightKg} kg</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-slate-800 text-slate-200 font-medium">
                        <span>Billed Weight (Max):</span>
                        <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded">{quoteResult.billedWeightKg} kg</span>
                      </div>
                    </div>

                    {/* Charge Breakdown Table */}
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
                      <div className="flex justify-between text-slate-300">
                        <span>Base Charge ({quoteResult.relation}):</span>
                        <span className="font-semibold text-white">₹{quoteResult.baseCharge}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>COD Surcharge:</span>
                        <span className="font-semibold text-amber-400">₹{quoteResult.codSurcharge}</span>
                      </div>
                    </div>

                    {/* Formula Explanation */}
                    <p className="text-[11px] text-slate-400 bg-slate-900/40 p-3 rounded-lg border border-slate-800/60 font-mono">
                      Formula: {quoteResult.breakdown.volumetricFormula}
                    </p>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-800 rounded-xl">
                    <Calculator className="w-12 h-12 text-slate-600 mb-3" />
                    <p className="text-slate-300 text-sm font-medium">No quote calculated yet</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">
                      Fill out shipment dimensions and pincodes to calculate live rate card charges.
                    </p>
                  </div>
                )}
              </div>

              {quoteResult && (
                <button
                  onClick={handleCreateOrder}
                  disabled={placingOrder}
                  className="w-full mt-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  {placingOrder ? 'Confirming Order...' : 'Confirm & Place Order'} <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: My Orders & Immutable Timeline */}
      {activeTab === 'my-orders' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Orders List */}
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-400" /> Recent Shipments ({orders.length})
            </h2>

            {orders.length === 0 ? (
              <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800 text-center">
                <Package className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">No shipments found.</p>
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => {
                    setSelectedOrder(order);
                    fetchTimeline(order.id);
                  }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                    selectedOrder?.id === order.id
                      ? 'bg-slate-900 border-emerald-500 shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-emerald-400 font-bold">{order.trackingNumber}</span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        order.currentStatus === 'DELIVERED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : order.currentStatus === 'FAILED'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {order.currentStatus}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1">
                    <p className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {order.pickupAddress} → {order.dropAddress}
                    </p>
                    <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-800/80">
                      <span>Billed Weight: {order.billedWeightKg} kg</span>
                      <span className="font-bold text-white">₹{order.totalCharge}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Timeline View */}
          <div className="lg:col-span-7">
            {selectedOrder ? (
              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
                  <div>
                    <h3 className="text-lg font-bold text-white font-mono">{selectedOrder.trackingNumber}</h3>
                    <p className="text-xs text-slate-400">Created: {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                  </div>

                  {selectedOrder.currentStatus === 'FAILED' && (
                    <button
                      onClick={() => {
                        setRescheduleDate(new Date().toISOString().split('T')[0]);
                        setShowRescheduleModal(true);
                      }}
                      className="px-3.5 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-rose-500/20"
                    >
                      <Calendar className="w-4 h-4" /> Reschedule Delivery
                    </button>
                  )}
                </div>

                {/* Agent & Address Details */}
                <div className="grid grid-cols-2 gap-4 mb-6 text-xs bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-slate-400 block mb-1">Assigned Agent:</span>
                    <span className="font-semibold text-white">
                      {selectedOrder.assignedAgent?.user?.name || 'Unassigned'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-1">Payment Mode:</span>
                    <span className="font-semibold text-white">{selectedOrder.paymentType}</span>
                  </div>
                </div>

                {/* Immutable Timeline Stream */}
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" /> Immutable Status History Log
                </h4>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                  {timeline.map((entry, idx) => (
                    <div key={entry.id || idx} className="relative group">
                      <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-slate-950" />
                      <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800/80">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-emerald-400 uppercase">{entry.status}</span>
                          <span className="text-slate-500 text-[11px]">{new Date(entry.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-xs text-slate-300">{entry.remarks}</p>
                        <p className="text-[10px] text-slate-500 mt-1">Actor: {entry.actorRole} ({entry.actor?.name || 'System'})</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-slate-950 p-12 rounded-2xl border border-slate-800 text-center">
                <Clock className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-300 text-sm">Select an order from the list to view its immutable audit timeline.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-rose-400" /> Reschedule Delivery
            </h3>
            <form onSubmit={handleReschedule} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">New Delivery Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Reason for Rescheduling</label>
                <textarea
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 text-sm"
                  rows={3}
                  placeholder="e.g. Recipient was unavailable on original attempt."
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRescheduleModal(false)}
                  className="w-1/2 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  Confirm Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
