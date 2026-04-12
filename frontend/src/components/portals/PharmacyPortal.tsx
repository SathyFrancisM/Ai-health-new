"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Search, Filter, ShoppingCart, Plus, Minus, ArrowRight, 
  Trash2, FileText, Upload, CheckCircle, Package, ArrowLeft,
  X, AlertCircle, Phone
} from "lucide-react"

const API_BASE = "http://localhost:5000"

export function PharmacyPortal({ user, onBack }: { user: any, onBack: () => void }) {
  const [medicines, setMedicines] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [cart, setCart] = useState<any[]>([])
  const [showCart, setShowCart] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [prescriptionUrl, setPrescriptionUrl] = useState("")
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null)
  const [address, setAddress] = useState(user?.location || "")
  const [orderPlaced, setOrderPlaced] = useState<any>(null)
  const [error, setError] = useState("")
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch medicines
  useEffect(() => {
    const fetchMedicines = async () => {
      setLoading(true)
      try {
        const query = new URLSearchParams()
        if (searchTerm) query.append('search', searchTerm)
        if (selectedCategory) query.append('category', selectedCategory)
        
        const res = await fetch(`${API_BASE}/api/pharmacy/medicines?${query.toString()}`)
        const data = await res.json()
        setMedicines(data.data || [])
        if (data.categories && categories.length === 0) {
          setCategories(data.categories)
        }
      } catch (err) {
        console.error('Failed to fetch medicines:', err)
      }
      setLoading(false)
    }
    
    // Debounce search
    const timer = setTimeout(fetchMedicines, 300)
    return () => clearTimeout(timer)
  }, [searchTerm, selectedCategory]) // eslint-disable-line react-hooks/exhaustive-deps

  const addToCart = (med: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === med.id)
      if (existing) {
        return prev.map(item => item.id === med.id ? { ...item, quantity: item.quantity + 1 } : item)
      }
      return [...prev, { ...med, quantity: 1 }]
    })
  }

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = item.quantity + delta
        return newQ > 0 ? { ...item, quantity: newQ } : item
      }
      return item
    }))
  }

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Quick validation
    if (file.size > 5 * 1024 * 1024) {
      setError("File is too large. Maximum size is 5MB.")
      return
    }

    setPrescriptionFile(file)
    setUploading(true)
    setError("")

    const formData = new FormData()
    formData.append('prescription', file)

    try {
      const res = await fetch(`${API_BASE}/api/pharmacy/upload-prescription`, {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      
      if (data.error) {
        setError(data.error)
      } else {
        setPrescriptionUrl(data.prescriptionUrl)
      }
    } catch (err) {
      setError("Failed to upload prescription. Please try again.")
    }
    setUploading(false)
  }

  const placeOrder = async () => {
    if (cart.length === 0) return
    if (!address.trim()) {
      setError("Please provide a delivery address.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const orderData = {
        userId: user?.id || 'demo_user_id',
        items: cart.map(item => ({ medicineId: item.id, quantity: item.quantity })),
        shippingAddress: address,
        prescriptionUrl: prescriptionUrl || null
      }

      const res = await fetch(`${API_BASE}/api/pharmacy/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      const data = await res.json()

      if (data.error) {
        setError(data.error)
        if (data.requiresPrescription) {
          // Keep cart open if prescription needed
          setLoading(false)
          return
        }
      } else {
        setOrderPlaced(data.order)
        setCart([])
        setShowCart(false)
      }
    } catch (err) {
      setError("Failed to place order. Please try again.")
    }
    setLoading(false)
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const requiresPrescription = cart.some(item => item.requiresPrescription)

  if (orderPlaced) {
    return (
      <div className="w-full max-w-2xl mx-auto text-center py-16">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
          className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </motion.div>
        <h3 className="text-3xl font-bold text-slate-800 mb-2">Order Placed!</h3>
        <p className="text-slate-500 mb-8">Your medicines will be delivered shortly.</p>

        <div className="glass p-6 rounded-2xl text-left space-y-4 mb-8">
          <div className="flex justify-between border-b border-slate-100 pb-3">
            <span className="text-slate-500">Order ID</span>
            <span className="font-mono font-bold text-slate-700">{orderPlaced.id}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-3">
            <span className="text-slate-500">Amount Paid</span>
            <span className="font-bold text-teal-600">₹{orderPlaced.totalAmount}</span>
          </div>
          <div className="flex justify-between border-b border-slate-100 pb-3">
            <span className="text-slate-500">Estimated Delivery</span>
            <span className="font-bold text-slate-700">{orderPlaced.estimatedDelivery}</span>
          </div>
          <div className="pt-2">
            <span className="text-slate-500 block mb-1 text-sm">Delivery Address</span>
            <span className="text-slate-700 font-medium">{orderPlaced.shippingAddress}</span>
          </div>
        </div>

        <button onClick={onBack} className="bg-gradient-premium text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-teal-500/20 hover:scale-105 transition-transform flex items-center justify-center gap-2 mx-auto">
          Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl flex gap-6 relative">
      
      {/* Main Content */}
      <div className={`flex-1 transition-all ${showCart ? 'md:pr-80 hidden md:block' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-4xl font-bold text-slate-800">Online <span className="text-gradient">Pharmacy</span></h2>
            <p className="text-slate-500 mt-2">Order medicines and health products online.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="px-5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-medium text-slate-600 hidden md:block">
              Back
            </button>
            <button onClick={() => setShowCart(true)} className="relative p-3 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-teal-300 transition-colors">
              <ShoppingCart className="w-5 h-5 text-teal-600" />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative glass p-2 rounded-2xl flex items-center gap-2">
            <Search className="ml-4 text-slate-400" />
            <input type="text" placeholder="Search medicines, health products..." 
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent border-none focus:ring-0 p-3 text-slate-700 outline-none" />
          </div>
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
            className="glass px-4 py-3 rounded-2xl text-slate-600 outline-none min-w-[200px] border-none appearance-none">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Medicine Grid */}
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-teal-200 border-t-teal-600 rounded-full animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-20">
            {medicines.map((med, i) => (
              <motion.div key={med.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="glass p-5 rounded-2xl flex flex-col justify-between group hover:border-teal-300 transition-colors">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-bold px-2 py-1 rounded bg-slate-100 text-slate-500">{med.category}</span>
                    {med.requiresPrescription && (
                      <span className="text-[10px] font-bold px-2 py-1 rounded bg-red-50 text-red-500 flex items-center gap-1">
                        <FileText className="w-3 h-3" /> Rx Read
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg leading-tight mb-1">{med.name}</h3>
                  <p className="text-xs text-slate-400 mb-3 line-clamp-2">{med.description || med.genericName}</p>
                </div>
                
                <div className="flex items-end justify-between mt-4 pt-4 border-t border-slate-100">
                  <div>
                    <span className="text-xl font-bold text-teal-600">₹{med.price}</span>
                    {med.stock < 10 && med.stock > 0 && <p className="text-[10px] text-orange-500 font-bold mt-1">Only {med.stock} left!</p>}
                    {med.stock === 0 && <p className="text-[10px] text-red-500 font-bold mt-1">Out of Stock</p>}
                  </div>
                  <button 
                    onClick={() => addToCart(med)} disabled={med.stock === 0}
                    className="bg-slate-800 text-white p-2 rounded-xl hover:bg-teal-500 transition-colors disabled:opacity-50 disabled:bg-slate-300">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
            {medicines.length === 0 && (
              <div className="col-span-full text-center py-20 text-slate-400">No medicines found matching your search.</div>
            )}
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      <AnimatePresence>
        {showCart && (
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed md:absolute top-0 right-0 w-full md:w-[400px] h-full md:h-[80vh] bg-white md:rounded-3xl shadow-2xl z-50 flex flex-col border border-slate-100 overflow-hidden">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-teal-600" /> Your Cart
              </h3>
              <button onClick={() => setShowCart(false)} className="p-1 rounded-lg hover:bg-slate-200 text-slate-500"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 pb-32">
              {cart.length === 0 ? (
                <div className="text-center text-slate-400 mt-20">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex gap-3 items-center border border-slate-100 p-3 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-800 truncate">{item.name}</p>
                        <p className="text-teal-600 font-bold text-sm">₹{item.price}</p>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1">
                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 rounded bg-white shadow-sm text-slate-600 hover:text-teal-600"><Minus className="w-3 h-3" /></button>
                        <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 rounded bg-white shadow-sm text-slate-600 hover:text-teal-600"><Plus className="w-3 h-3" /></button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}

                  {/* Prescription Upload Section */}
                  {requiresPrescription && (
                    <div className="mt-6 bg-red-50 border border-red-100 p-4 rounded-xl">
                      <div className="flex gap-2 items-start text-red-600 mb-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-sm">Prescription Required</p>
                          <p className="text-xs mt-1 opacity-90">Some items in your cart require a valid doctor's prescription.</p>
                        </div>
                      </div>
                      
                      {!prescriptionUrl ? (
                        <div>
                          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,.pdf" className="hidden" />
                          <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                            className="w-full bg-white border border-red-200 text-red-600 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2">
                            {uploading ? <div className="w-4 h-4 border-2 border-red-200 border-t-red-600 rounded-full animate-spin" /> : <><Upload className="w-4 h-4" /> Upload Prescription</>}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-green-200">
                          <span className="text-xs font-medium text-green-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Inserted</span>
                          <button onClick={() => {setPrescriptionUrl(""); setPrescriptionFile(null)}} className="text-xs text-slate-400 hover:text-red-500">Remove</button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Delivery Address */}
                  <div className="mt-6">
                    <label className="text-sm font-bold text-slate-700 block mb-2">Delivery Address</label>
                    <textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter full address..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-teal-400 resize-none h-24" />
                  </div>

                  {error && <div className="text-xs text-red-500 bg-red-50 p-2 rounded-lg border border-red-100">{error}</div>}
                </div>
              )}
            </div>

            {/* Checkout Sticky Footer */}
            {cart.length > 0 && (
              <div className="absolute bottom-0 left-0 w-full bg-white border-t border-slate-100 p-5 shadow-[0_-10px_20px_rgba(0,0,0,0.03)] z-10">
                <div className="flex justify-between mb-4">
                  <span className="text-slate-500 font-medium">Total Amount</span>
                  <span className="text-xl font-bold text-teal-600">₹{cartTotal}</span>
                </div>
                <button onClick={placeOrder} disabled={loading || (requiresPrescription && !prescriptionUrl)}
                  className="w-full bg-gradient-premium text-white py-3.5 rounded-xl font-bold shadow-lg shadow-teal-500/20 hover:scale-[1.02] transition-transform disabled:opacity-50 flex justify-center items-center">
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Proceed to Checkout'}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
