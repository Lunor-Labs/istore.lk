import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { IPhone } from '../types/database';
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';

const IPHONE_MODELS = [
  'iPhone (1st generation)',
  'iPhone 3G',
  'iPhone 3GS',
  'iPhone 4',
  'iPhone 4S',
  'iPhone 5',
  'iPhone 5C',
  'iPhone 5S',
  'iPhone 6',
  'iPhone 6 Plus',
  'iPhone 6S',
  'iPhone 6S Plus',
  'iPhone SE (1st generation)',
  'iPhone 7',
  'iPhone 7 Plus',
  'iPhone 8',
  'iPhone 8 Plus',
  'iPhone X',
  'iPhone XR',
  'iPhone XS',
  'iPhone XS Max',
  'iPhone SE (2nd generation)',
  'iPhone 11',
  'iPhone 11 Pro',
  'iPhone 11 Pro Max',
  'iPhone 12',
  'iPhone 12 Mini',
  'iPhone 12 Pro',
  'iPhone 12 Pro Max',
  'iPhone SE (3rd generation)',
  'iPhone 13',
  'iPhone 13 Mini',
  'iPhone 13 Pro',
  'iPhone 13 Pro Max',
  'iPhone 14',
  'iPhone 14 Plus',
  'iPhone 14 Pro',
  'iPhone 14 Pro Max',
  'iPhone 15',
  'iPhone 15 Plus',
  'iPhone 15 Pro',
  'iPhone 15 Pro Max',
  'iPhone 16',
  'iPhone 16 Plus',
  'iPhone 16 Pro',
  'iPhone 16 Pro Max',
];

const STORAGE_OPTIONS = ['4GB', '8GB', '16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB'];

export default function Stock() {
  const [iphones, setIphones] = useState<IPhone[]>([]);
  const [filteredIphones, setFilteredIphones] = useState<IPhone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPhone, setEditingPhone] = useState<IPhone | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'in_stock' | 'sold'>('in_stock');

  const [formData, setFormData] = useState({
    model: '',
    storage: '',
    color: '',
    imei: '',
    purchase_cost: '',
    selling_price: '',
    supplier_name: '',
    purchase_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    loadIphones();
  }, []);

  useEffect(() => {
    filterIphones();
  }, [iphones, searchTerm, filterStatus]);

  const loadIphones = async () => {
    try {
      const { data, error } = await supabase
        .from('iphones')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIphones(data || []);
    } catch (error) {
      console.error('Error loading iphones:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterIphones = () => {
    let filtered = iphones;

    if (filterStatus !== 'all') {
      filtered = filtered.filter((phone) => phone.status === filterStatus);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (phone) =>
          phone.imei.toLowerCase().includes(searchTerm.toLowerCase()) ||
          phone.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
          phone.color.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredIphones(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingPhone) {
        const { error } = await supabase
          .from('iphones')
          .update({
            model: formData.model,
            storage: formData.storage,
            color: formData.color,
            imei: formData.imei,
            purchase_cost: parseFloat(formData.purchase_cost),
            selling_price: parseFloat(formData.selling_price),
            supplier_name: formData.supplier_name || null,
            purchase_date: formData.purchase_date,
            notes: formData.notes || null,
          })
          .eq('id', editingPhone.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('iphones').insert({
          model: formData.model,
          storage: formData.storage,
          color: formData.color,
          imei: formData.imei,
          purchase_cost: parseFloat(formData.purchase_cost),
          selling_price: parseFloat(formData.selling_price),
          supplier_name: formData.supplier_name || null,
          purchase_date: formData.purchase_date,
          notes: formData.notes || null,
          status: 'in_stock',
        });

        if (error) throw error;
      }

      closeModal();
      loadIphones();
    } catch (error: any) {
      alert(error.message || 'Failed to save phone');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this phone?')) return;

    try {
      const { error } = await supabase.from('iphones').delete().eq('id', id);
      if (error) throw error;
      loadIphones();
    } catch (error: any) {
      alert(error.message || 'Failed to delete phone');
    }
  };

  const openModal = (phone?: IPhone) => {
    if (phone) {
      setEditingPhone(phone);
      setFormData({
        model: phone.model,
        storage: phone.storage,
        color: phone.color,
        imei: phone.imei,
        purchase_cost: phone.purchase_cost.toString(),
        selling_price: phone.selling_price.toString(),
        supplier_name: phone.supplier_name || '',
        purchase_date: phone.purchase_date,
        notes: phone.notes || '',
      });
    } else {
      setEditingPhone(null);
      setFormData({
        model: '',
        storage: '',
        color: '',
        imei: '',
        purchase_cost: '',
        selling_price: '',
        supplier_name: '',
        purchase_date: new Date().toISOString().split('T')[0],
        notes: '',
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPhone(null);
  };

  if (loading) {
    return <div className="text-center py-12">Loading stock...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Stock Management</h1>
          <p className="text-slate-600 mt-1">Manage your iPhone inventory</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-slate-900 text-white px-6 py-3 rounded-lg hover:bg-slate-800 transition-colors flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add iPhone
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by IMEI, model, or color..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterStatus === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('in_stock')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterStatus === 'in_stock'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              In Stock
            </button>
            <button
              onClick={() => setFilterStatus('sold')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterStatus === 'sold'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Sold
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                  IMEI
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                  Storage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                  Color
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                  Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredIphones.map((phone) => (
                <tr key={phone.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm text-slate-900">{phone.imei}</td>
                  <td className="px-6 py-4 text-sm text-slate-900">{phone.model}</td>
                  <td className="px-6 py-4 text-sm text-slate-900">{phone.storage}</td>
                  <td className="px-6 py-4 text-sm text-slate-900">{phone.color}</td>
                  <td className="px-6 py-4 text-sm text-slate-900">
                    Rs. {phone.purchase_cost.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900">
                    Rs. {phone.selling_price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        phone.status === 'in_stock'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {phone.status === 'in_stock' ? 'In Stock' : 'Sold'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openModal(phone)}
                        className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                        disabled={phone.status === 'sold'}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(phone.id)}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50"
                        disabled={phone.status === 'sold'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">
                {editingPhone ? 'Edit iPhone' : 'Add New iPhone'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Model *
                  </label>
                  <select
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    required
                  >
                    <option value="">Select Model</option>
                    {IPHONE_MODELS.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Storage *
                  </label>
                  <select
                    value={formData.storage}
                    onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    required
                  >
                    <option value="">Select Storage</option>
                    {STORAGE_OPTIONS.map((storage) => (
                      <option key={storage} value={storage}>
                        {storage}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Color *
                  </label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    placeholder="e.g., Black, White, Blue"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    IMEI *
                  </label>
                  <input
                    type="text"
                    value={formData.imei}
                    onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    placeholder="15-digit IMEI number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Purchase Cost *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchase_cost}
                    onChange={(e) =>
                      setFormData({ ...formData, purchase_cost: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Selling Price *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.selling_price}
                    onChange={(e) =>
                      setFormData({ ...formData, selling_price: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Supplier Name
                  </label>
                  <input
                    type="text"
                    value={formData.supplier_name}
                    onChange={(e) =>
                      setFormData({ ...formData, supplier_name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Purchase Date *
                  </label>
                  <input
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) =>
                      setFormData({ ...formData, purchase_date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                  rows={3}
                  placeholder="Optional notes"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  {editingPhone ? 'Update' : 'Add'} iPhone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
