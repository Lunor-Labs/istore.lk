import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { IPhone } from '../types/database';
import { ShoppingCart, User, CreditCard } from 'lucide-react';
import Invoice from '../components/Invoice';

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerNIC?: string;
  phoneModel: string;
  phoneStorage: string;
  phoneColor: string;
  imei: string;
  sellingPrice: number;
  discount: number;
  finalPrice: number;
  paymentMethod: string;
}

export default function SellPhone() {
  const [availablePhones, setAvailablePhones] = useState<IPhone[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<IPhone | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);

  const [formData, setFormData] = useState({
    customerName: '',
    phoneNumber: '',
    nic: '',
    actualSellingPrice: '',
    paymentMethod: 'cash' as 'cash' | 'card' | 'bank_transfer',
    discount: '0',
    saleDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadAvailablePhones();
  }, []);

  const loadAvailablePhones = async () => {
    try {
      const { data, error } = await supabase
        .from('iphones')
        .select('*')
        .eq('status', 'in_stock')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAvailablePhones(data || []);
    } catch (error) {
      console.error('Error loading phones:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateFinalPrice = () => {
    if (!formData.actualSellingPrice) return 0;
    const sellingPrice = parseFloat(formData.actualSellingPrice);
    const discount = parseFloat(formData.discount) || 0;
    return sellingPrice - discount;
  };

  const calculateProfit = () => {
    if (!selectedPhone || !formData.actualSellingPrice) return 0;
    const finalPrice = calculateFinalPrice();
    return finalPrice - selectedPhone.purchase_cost;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPhone) {
      alert('Please select a phone');
      return;
    }

    setSubmitting(true);

    try {
      let customerId: string;

      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('phone_number', formData.phoneNumber)
        .maybeSingle();

      if (existingCustomer) {
        customerId = existingCustomer.id;

        await supabase
          .from('customers')
          .update({
            name: formData.customerName,
            nic: formData.nic || null,
          })
          .eq('id', customerId);
      } else {
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            name: formData.customerName,
            phone_number: formData.phoneNumber,
            nic: formData.nic || null,
          })
          .select()
          .single();

        if (customerError) throw customerError;
        customerId = newCustomer.id;
      }

      const profit = calculateProfit();

      const { error: saleError } = await supabase.from('sales').insert({
        iphone_id: selectedPhone.id,
        customer_id: customerId,
        actual_selling_price: parseFloat(formData.actualSellingPrice),
        payment_method: formData.paymentMethod,
        discount: parseFloat(formData.discount) || 0,
        profit: profit,
        sale_date: formData.saleDate,
      });

      if (saleError) throw saleError;

      const { error: updateError } = await supabase
        .from('iphones')
        .update({ status: 'sold' })
        .eq('id', selectedPhone.id);

      if (updateError) throw updateError;

      const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;
      const finalPrice = calculateFinalPrice();

      setInvoiceData({
        invoiceNumber,
        date: formData.saleDate,
        customerName: formData.customerName,
        customerPhone: formData.phoneNumber,
        customerNIC: formData.nic || undefined,
        phoneModel: selectedPhone.model,
        phoneStorage: selectedPhone.storage,
        phoneColor: selectedPhone.color,
        imei: selectedPhone.imei,
        sellingPrice: parseFloat(formData.actualSellingPrice),
        discount: parseFloat(formData.discount) || 0,
        finalPrice,
        paymentMethod: formData.paymentMethod,
      });

      setShowInvoice(true);

      setSelectedPhone(null);
      setFormData({
        customerName: '',
        phoneNumber: '',
        nic: '',
        actualSellingPrice: '',
        paymentMethod: 'cash',
        discount: '0',
        saleDate: new Date().toISOString().split('T')[0],
      });

      loadAvailablePhones();
    } catch (error: any) {
      alert(error.message || 'Failed to complete sale');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const profit = calculateProfit();
  const finalPrice = calculateFinalPrice();

  return (
    <>
      {showInvoice && invoiceData && (
        <Invoice data={invoiceData} onClose={() => setShowInvoice(false)} />
      )}

      <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Sell iPhone</h1>
        <p className="text-slate-600 mt-1">Complete a sale transaction</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Select iPhone
          </h2>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {availablePhones.length === 0 ? (
              <p className="text-slate-600 text-center py-8">No phones available in stock</p>
            ) : (
              availablePhones.map((phone) => (
                <button
                  key={phone.id}
                  onClick={() => {
                    setSelectedPhone(phone);
                    setFormData({
                      ...formData,
                      actualSellingPrice: phone.selling_price.toString(),
                    });
                  }}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    selectedPhone?.id === phone.id
                      ? 'border-slate-900 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{phone.model}</p>
                      <p className="text-sm text-slate-600">
                        {phone.storage} • {phone.color}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">IMEI: {phone.imei}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900">
                        Rs. {phone.selling_price.toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500">Cost: Rs. {phone.purchase_cost.toFixed(2)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Sale Details
          </h2>

          {!selectedPhone ? (
            <div className="text-center py-12 text-slate-600">
              Please select a phone to continue
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  NIC (Optional)
                </label>
                <input
                  type="text"
                  value={formData.nic}
                  onChange={(e) => setFormData({ ...formData, nic: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Selling Price *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.actualSellingPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, actualSellingPrice: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Payment Method *
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      paymentMethod: e.target.value as 'cash' | 'card' | 'bank_transfer',
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  required
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Discount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Sale Date *
                </label>
                <input
                  type="date"
                  value={formData.saleDate}
                  onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  required
                />
              </div>

              <div className="bg-gradient-to-r from-slate-900 to-slate-700 rounded-lg p-4 text-white">
                <div className="text-center">
                  <p className="text-sm opacity-90 mb-1">Final Price</p>
                  <p className="text-4xl font-bold">
                    Rs. {finalPrice.toFixed(2)}
                  </p>
                  <p className="text-xs opacity-75 mt-1">
                    (After {parseFloat(formData.discount || '0').toFixed(2)} discount)
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Purchase Cost:</span>
                  <span className="font-semibold text-slate-900">
                    Rs. {selectedPhone.purchase_cost.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Selling Price:</span>
                  <span className="font-semibold text-slate-900">
                    Rs. {parseFloat(formData.actualSellingPrice || '0').toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Discount:</span>
                  <span className="font-semibold text-slate-900">
                    Rs. {parseFloat(formData.discount || '0').toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-slate-200 pt-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">Profit:</span>
                    <span
                      className={`text-lg font-bold ${
                        profit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      Rs. {profit.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {submitting ? (
                  'Processing...'
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Complete Sale
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
