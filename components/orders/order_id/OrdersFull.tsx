'use client'

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, Edit2, Check, Search, ChevronDown, ChevronUp, X } from 'lucide-react';
import React from 'react';
import DownloadReceipt from './DownloadReceipt';
import { toast } from 'sonner';

type AddonItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
};

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  merchant_name?: string;
  people?: number;
  customerName?: string;
  customerWa?: string;
  date?: string;
  times?: string[];
  addons?: AddonItem[];
  slug?: string;
  thumbnail?: string;
  total?: number;
  selectedSessions?: any;
};

type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  merchant_name?: string;
  people?: number;
  customerName?: string;
  customerWa?: string;
  date?: string;
  times?: string[];
};

type Order = {
  id: string;
  uid: string;
  order_id: string;
  midtrans_order_id: string;
  customer_name: string;
  customer_wa: string;
  gross_amount: number;
  payment_status: string;
  created_at: string;
  updated_at: any;
  midtrans_items: OrderItem[];
  original_cart_items: CartItem[];
  total_people: number;
  total_quantity: number;
  total_sessions: number;
  redirect_url?: string;
  token?: string;
  voucherDiscount?: string;
  date?: any;
};

const OrdersFull = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Order>>({});
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    let mounted = true;
    const unsubscribeFunctions: (() => void)[] = [];

    const fetchAllOrdersRealTime = async () => {
      try {
        setLoading(true);
        
        const usersRef = collection(db, 'users');
        const usersSnapshot = await getDocs(usersRef);
        
        if (!mounted) return;
        
        for (const userDoc of usersSnapshot.docs) {
          const userId = userDoc.id;
          const ordersRef = collection(db, 'users', userId, 'orders');
          const ordersQuery = query(ordersRef, orderBy('created_at', 'desc'));
          
          const userUnsubscribe = onSnapshot(ordersQuery, 
            (ordersSnapshot) => {
              if (!mounted) return;

              setOrders(prevOrders => {
                const filteredOrders = prevOrders.filter(order => order.uid !== userId);
                const newOrdersForUser: Order[] = [];
                
                ordersSnapshot.forEach(doc => {
                  const data = doc.data();
                  
                  if (data.payment_status === 'success') {
                    const order: Order = {
                      id: doc.id,
                      uid: userId,
                      order_id: data.order_id || '',
                      midtrans_order_id: data.midtrans_order_id || '',
                      customer_name: data.customer_name || '',
                      customer_wa: data.customer_wa || '',
                      gross_amount: data.gross_amount || 0,
                      payment_status: data.payment_status || '',
                      created_at: data.created_at || new Date().toISOString(),
                      updated_at: data.updated_at || null,
                      midtrans_items: Array.isArray(data.midtrans_items) ? data.midtrans_items : [],
                      original_cart_items: Array.isArray(data.original_cart_items) ? data.original_cart_items : [],
                      total_people: data.total_people || 0,
                      total_quantity: data.total_quantity || 0,
                      total_sessions: data.total_sessions || 0,
                      redirect_url: data.redirect_url || '',
                      token: data.token || '',
                      voucherDiscount: data.voucherDiscount || '',
                      date: data.date || null
                    };
                    
                    newOrdersForUser.push(order);
                  }
                });
                
                const updatedOrders = [...filteredOrders, ...newOrdersForUser];
                updatedOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                
                return updatedOrders;
              });
            },
            (error) => {
              console.error(`Error in real-time listener for user ${userId}:`, error);
              toast.error('Error loading orders');
            }
          );
          
          unsubscribeFunctions.push(userUnsubscribe);

          try {
            const initialOrdersSnapshot = await getDocs(ordersQuery);
            if (!mounted) return;

            const initialOrders: Order[] = [];
            initialOrdersSnapshot.forEach(doc => {
              const data = doc.data();
              
              if (data.payment_status === 'success') {
                const order: Order = {
                  id: doc.id,
                  uid: userId,
                  order_id: data.order_id || '',
                  midtrans_order_id: data.midtrans_order_id || '',
                  customer_name: data.customer_name || '',
                  customer_wa: data.customer_wa || '',
                  gross_amount: data.gross_amount || 0,
                  payment_status: data.payment_status || '',
                  created_at: data.created_at || new Date().toISOString(),
                  updated_at: data.updated_at || null,
                  midtrans_items: Array.isArray(data.midtrans_items) ? data.midtrans_items : [],
                  original_cart_items: Array.isArray(data.original_cart_items) ? data.original_cart_items : [],
                  total_people: data.total_people || 0,
                  total_quantity: data.total_quantity || 0,
                  total_sessions: data.total_sessions || 0,
                  redirect_url: data.redirect_url || '',
                  token: data.token || '',
                  voucherDiscount: data.voucherDiscount || '',
                  date: data.date || null
                };
                
                initialOrders.push(order);
              }
            });

            setOrders(prev => {
              const filtered = prev.filter(order => order.uid !== userId);
              const combined = [...filtered, ...initialOrders];
              combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
              return combined;
            });
          } catch (error) {
            console.error(`Error fetching initial orders for user ${userId}:`, error);
            toast.error('Error loading initial orders');
          }
        }
        
        setLoading(false);
        
      } catch (error) {
        console.error('Error setting up real-time listeners:', error);
        toast.error('Failed to setup order listeners');
        setLoading(false);
      }
    };

    fetchAllOrdersRealTime();

    return () => {
      mounted = false;
      unsubscribeFunctions.forEach(fn => fn());
    };

  }, [isClient]);

  const toggleRowExpand = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleEdit = (order: Order) => {
    setEditingId(order.id);
    setEditData({
      payment_status: order.payment_status
    });
  };

  const handleSave = async (id: string) => {
    if (!editData) return;
    
    try {
      const orderToUpdate = orders.find(order => order.id === id);
      if (!orderToUpdate) {
        toast.error('Order not found');
        return;
      }

      await updateDoc(doc(db, 'users', orderToUpdate.uid, 'orders', id), {
        ...editData,
        updated_at: new Date()
      });
      setEditingId(null);
      setEditData({});
      toast.success('Order updated successfully');
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
    toast.info('Edit cancelled');
  };

  const formatDate = (date: string | { toDate: () => Date } | any) => {
    if (!date) return '-';
    
    try {
      let actualDate: Date;
      
      if (typeof date === 'string') {
        actualDate = new Date(date);
      } else if (date && typeof date.toDate === 'function') {
        actualDate = date.toDate();
      } else {
        return '-';
      }
      
      if (isNaN(actualDate.getTime())) {
        return '-';
      }
      
      return actualDate.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '-';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const filteredOrders = orders.filter(order =>
    (order.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_wa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.midtrans_items?.[0]?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (order.original_cart_items?.[0]?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()))
  );

  const getMainProduct = (order: Order) => {
    return order.midtrans_items?.[0] || order.original_cart_items?.[0] || null;
  };

  const getAddons = (order: Order) => {
    const mainItem = order.original_cart_items?.[0];
    return mainItem?.addons || [];
  };

  const getSessions = (order: Order) => {
    const mainItem = order.original_cart_items?.[0];
    return mainItem?.times || [];
  };

  const getBookingDate = (order: Order) => {
    const mainItem = order.original_cart_items?.[0];
    return mainItem?.date || order.date || '-';
  };

  if (!isClient) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center h-32">
          <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
          <span className="ml-2 text-gray-600">Loading orders...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">All Orders</h1>
          <div className="text-sm text-gray-600 bg-green-50 px-3 py-1 rounded-full mt-1 inline-block">
            Total: {orders.length} successful orders
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
          <input
            type="text"
            placeholder="Search by order ID, customer name, WhatsApp, or product..."
            className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg w-full bg-white text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
          <span className="ml-2 text-gray-600">Loading orders...</span>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider">Order ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500 text-sm">
                      {searchTerm ? 'No orders found matching your search' : 'No successful orders found'}
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const mainProduct = getMainProduct(order);
                    const addons = getAddons(order);
                    const sessions = getSessions(order);
                    const bookingDate = getBookingDate(order);

                    return (
                      <React.Fragment key={order.id}>
                        {/* Main row */}
                        <tr className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-4 py-3 whitespace-nowrap font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleRowExpand(order.id)}
                                className="text-gray-500 hover:text-gray-700 transition-colors"
                              >
                                {expandedRows[order.id] ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </button>
                              <span className="text-gray-900 font-mono text-xs">{order.order_id}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div>
                              <div className="font-medium text-gray-900">{order.customer_name}</div>
                              <div className="text-xs text-gray-500 font-mono">{order.customer_wa}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="max-w-[250px]">
                              <div className="font-medium text-gray-900 truncate" title={mainProduct?.name}>
                                {mainProduct?.name || 'N/A'}
                              </div>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {mainProduct?.quantity && mainProduct.quantity > 1 && (
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Qty: {mainProduct.quantity}</span>
                                )}
                                {mainProduct?.people && (
                                  <span className="text-xs text-gray-500 bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1">
                                    👥 {mainProduct.people}
                                  </span>
                                )}
                                {bookingDate && bookingDate !== '-' && (
                                  <span className="text-xs text-gray-500 bg-purple-50 px-2 py-0.5 rounded">📅 {bookingDate}</span>
                                )}
                                {sessions.length > 0 && (
                                  <span className="text-xs text-gray-500 bg-green-50 px-2 py-0.5 rounded">⏰ {sessions.length} sesi</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="font-medium text-gray-900">{formatCurrency(order.gross_amount)}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {editingId === order.id ? (
                              <select
                                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                value={editData.payment_status || order.payment_status}
                                onChange={(e) => setEditData({ ...editData, payment_status: e.target.value })}
                              >
                                <option value="pending">Pending</option>
                                <option value="success">Success</option>
                                <option value="failed">Failed</option>
                                <option value="expired">Expired</option>
                              </select>
                            ) : (
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                order.payment_status === 'success' ? 'bg-green-100 text-green-800' :
                                order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                order.payment_status === 'failed' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {order.payment_status}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex gap-2">
                              {editingId === order.id ? (
                                <>
                                  <button
                                    onClick={() => handleSave(order.id)}
                                    className="text-green-600 hover:text-green-800 p-1 transition-colors"
                                    title="Save"
                                  >
                                    <Check className="h-5 w-5" />
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="text-gray-600 hover:text-gray-800 p-1 transition-colors"
                                    title="Cancel"
                                  >
                                    <X className="h-5 w-5" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleEdit(order)}
                                    className="text-blue-600 hover:text-blue-800 p-1 transition-colors"
                                    title="Edit Status"
                                  >
                                    <Edit2 className="h-5 w-5" />
                                  </button>
                                  <DownloadReceipt 
                                    orderData={order}
                                    orderId={order.order_id}
                                  />
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                        {/* Expanded row */}
                        {expandedRows[order.id] && (
                          <tr className="bg-gray-50">
                            <td colSpan={6} className="px-4 py-4">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-sm p-4">
                                {/* Order Details */}
                                <div className="space-y-4">
                                  <div>
                                    <h3 className="font-semibold text-gray-900 mb-3 text-base">Order Details</h3>
                                    
                                    <div className="space-y-2 bg-white rounded-lg border border-gray-200 p-4">
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Order ID:</span>
                                        <span className="font-medium text-gray-900 font-mono">{order.order_id}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Midtrans Order ID:</span>
                                        <span className="font-medium text-gray-900 font-mono">{order.midtrans_order_id}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">User ID:</span>
                                        <span className="font-medium text-gray-900 font-mono text-xs">{order.uid}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Total People:</span>
                                        <span className="font-medium text-gray-900">{order.total_people}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Total Sessions:</span>
                                        <span className="font-medium text-gray-900">{order.total_sessions}</span>
                                      </div>
                                      {order.voucherDiscount && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Voucher Discount:</span>
                                          <span className="font-medium text-green-600">{order.voucherDiscount}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Payment Info */}
                                  <div>
                                    <h3 className="font-semibold text-gray-900 mb-3 text-base">Payment Information</h3>
                                    <div className="space-y-2 bg-white rounded-lg border border-gray-200 p-4">
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Gross Amount:</span>
                                        <span className="font-medium text-gray-900">{formatCurrency(order.gross_amount)}</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Status:</span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                          order.payment_status === 'success' ? 'bg-green-100 text-green-800' :
                                          order.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                          order.payment_status === 'failed' ? 'bg-red-100 text-red-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {order.payment_status}
                                        </span>
                                      </div>
                                      {order.redirect_url && (
                                        <div className="flex justify-between items-center">
                                          <span className="text-gray-600">Payment Link:</span>
                                          <a 
                                            href={order.redirect_url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium"
                                          >
                                            View Payment
                                          </a>
                                        </div>
                                      )}
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Created:</span>
                                        <span className="font-medium text-gray-900 text-xs">{formatDate(order.created_at)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Updated:</span>
                                        <span className="font-medium text-gray-900 text-xs">{formatDate(order.updated_at)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Product Details */}
                                <div className="space-y-4">
                                  {/* Main Product */}
                                  <div>
                                    <h3 className="font-semibold text-gray-900 mb-3 text-base">Product Details</h3>
                                    {mainProduct && (
                                      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
                                        <h4 className="font-medium text-gray-900">{mainProduct.name}</h4>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                          <div className="text-gray-600">Price:</div>
                                          <div className="font-medium text-gray-900">{formatCurrency(mainProduct.price)}</div>
                                          <div className="text-gray-600">Quantity:</div>
                                          <div className="font-medium text-gray-900">{mainProduct.quantity}</div>
                                          {mainProduct.people && (
                                            <>
                                              <div className="text-gray-600">People:</div>
                                              <div className="font-medium text-gray-900">{mainProduct.people}</div>
                                            </>
                                          )}
                                          {mainProduct.category && (
                                            <>
                                              <div className="text-gray-600">Category:</div>
                                              <div className="font-medium text-gray-900">{mainProduct.category}</div>
                                            </>
                                          )}
                                          {bookingDate && bookingDate !== '-' && (
                                            <>
                                              <div className="text-gray-600">Booking Date:</div>
                                              <div className="font-medium text-gray-900">{bookingDate}</div>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Addons */}
                                  {addons.length > 0 && (
                                    <div>
                                      <h3 className="font-semibold text-gray-900 mb-3 text-base">Addons ({addons.length})</h3>
                                      <div className="space-y-2">
                                        {addons.map((addon, index) => (
                                          <div key={index} className="bg-white rounded-lg border border-gray-200 p-3">
                                            <div className="flex justify-between items-start">
                                              <div>
                                                <div className="font-medium text-gray-900">{addon.name}</div>
                                                <div className="text-sm text-gray-600 mt-1">
                                                  {formatCurrency(addon.price)} × {addon.qty}
                                                </div>
                                              </div>
                                              <div className="font-medium text-gray-900">
                                                {formatCurrency(addon.price * addon.qty)}
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Sessions */}
                                  {sessions.length > 0 && (
                                    <div>
                                      <h3 className="font-semibold text-gray-900 mb-3 text-base">Sessions ({sessions.length})</h3>
                                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        {sessions.map((session, index) => (
                                          <div key={index} className="bg-white rounded-lg border border-gray-200 p-3 text-center">
                                            <div className="text-sm font-medium text-gray-900">Session {index + 1}</div>
                                            <div className="text-xs text-gray-600 mt-1">{session}</div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersFull;