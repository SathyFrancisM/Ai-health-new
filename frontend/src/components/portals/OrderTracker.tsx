"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Package, Clock, CheckCircle, Truck, MapPin } from "lucide-react"

const API_BASE = "http://localhost:5000"

export function OrderTracker({ user, onBack }: { user: any, onBack: () => void }) {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/pharmacy/orders?userId=${user?.id || 'demo_user_id'}`)
        const data = await res.json()
        setOrders(data.data || [])
      } catch (err) {
        console.error("Failed to load orders:", err)
      }
      setLoading(false)
    }
    fetchOrders()
  }, [user])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-blue-500 bg-blue-50'
      case 'processing': return 'text-purple-500 bg-purple-50'
      case 'shipped': return 'text-orange-500 bg-orange-50'
      case 'delivered': return 'text-green-500 bg-green-50'
      case 'cancelled': return 'text-red-500 bg-red-50'
      default: return 'text-slate-500 bg-slate-50'
    }
  }

  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'pending': return 1
      case 'confirmed': return 2
      case 'processing': return 3
      case 'shipped': return 4
      case 'delivered': return 5
      default: return 0
    }
  }

  return (
    <div className="w-full max-w-4xl space-y-8 pb-20">
      <div className="flex items-center justify-between glass px-6 py-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h2 className="text-2xl font-bold text-slate-800">My <span className="text-gradient">Orders</span></h2>
        </div>
        <div className="bg-teal-50 text-teal-600 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2">
          <Package className="w-4 h-4" /> {orders.length} Orders
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-teal-200 border-t-teal-600 rounded-full animate-spin" /></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-white/50 rounded-3xl border border-slate-100">
          <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-700">No orders yet</h3>
          <p className="text-slate-500 mt-2">When you buy medicines, they will appear here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order, i) => (
            <motion.div key={order.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="glass p-6 rounded-3xl group">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-sm font-bold text-slate-700">{order.id}</span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-md uppercase ${getStatusColor(order.status)}`}>{order.status}</span>
                  </div>
                  <p className="text-slate-400 text-xs">Ordered on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-teal-600">₹{order.totalAmount}</p>
                  <p className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full inline-block mt-1">Paid</p>
                </div>
              </div>

              {order.status !== 'cancelled' && (
                <div className="mb-6 mt-2 relative">
                  <div className="h-1 bg-slate-100 rounded-full absolute top-1/2 left-0 w-full -translate-y-1/2 -z-10" />
                  <div className="h-1 bg-teal-400 rounded-full absolute top-1/2 left-0 -translate-y-1/2 -z-10 transition-all duration-1000" style={{ width: `${(getStatusProgress(order.status) - 1) * 25}%` }} />
                  
                  <div className="flex justify-between relative px-2">
                    {[
                      { step: 1, icon: Package, label: 'Placed' },
                      { step: 2, icon: CheckCircle, label: 'Confirmed' },
                      { step: 3, icon: Clock, label: 'Processed' },
                      { step: 4, icon: Truck, label: 'Shipped' },
                      { step: 5, icon: MapPin, label: 'Delivered' }
                    ].map(({ step, icon: Icon, label }) => {
                      const active = getStatusProgress(order.status) >= step;
                      return (
                        <div key={label} className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 mb-2 transition-colors duration-500 ${active ? 'bg-teal-500 border-teal-500 text-white' : 'bg-white border-slate-200 text-slate-300'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className={`text-[10px] font-bold ${active ? 'text-teal-700' : 'text-slate-400'}`}>{label}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-4 rounded-2xl">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Items</p>
                  <ul className="space-y-2">
                    {order.items.map((item: any, idx: number) => (
                      <li key={idx} className="flex justify-between text-sm">
                        <span className="text-slate-700">{item.quantity}x {item.name}</span>
                        <span className="font-medium text-slate-600">₹{item.price * item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Delivery Details</p>
                  <p className="text-sm text-slate-700 mb-2">{order.shippingAddress}</p>
                  {order.estimatedDelivery && order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <p className="text-xs font-bold text-orange-600 bg-orange-50 inline-block px-2 py-1 rounded">
                      Est. Delivery: {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  )}
                  {order.trackingId && (
                    <p className="text-xs text-slate-500 mt-2">Tracking ID: <span className="font-mono font-medium">{order.trackingId}</span></p>
                  )}
                </div>
              </div>

            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
