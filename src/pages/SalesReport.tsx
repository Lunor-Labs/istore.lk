import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { FileDown, Filter, Calendar } from 'lucide-react';

interface SaleWithDetails {
  id: string;
  actual_selling_price: number;
  payment_method: string;
  discount: number;
  profit: number;
  sale_date: string;
  created_at: string;
  iphones: {
    model: string;
    storage: string;
    color: string;
    imei: string;
    purchase_cost: number;
  };
  customers: {
    name: string;
    phone_number: string;
  };
}

export default function SalesReport() {
  const [sales, setSales] = useState<SaleWithDetails[]>([]);
  const [filteredSales, setFilteredSales] = useState<SaleWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    model: '',
    customerName: '',
    minPrice: '',
    maxPrice: '',
  });

  useEffect(() => {
    loadSales();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [sales, filters]);

  const loadSales = async () => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(
          `
          *,
          iphones (model, storage, color, imei, purchase_cost),
          customers (name, phone_number)
        `
        )
        .order('sale_date', { ascending: false });

      if (error) throw error;
      setSales((data as any) || []);
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...sales];

    if (filters.startDate) {
      filtered = filtered.filter((sale) => sale.sale_date >= filters.startDate);
    }

    if (filters.endDate) {
      filtered = filtered.filter((sale) => sale.sale_date <= filters.endDate);
    }

    if (filters.model) {
      filtered = filtered.filter((sale) =>
        sale.iphones.model.toLowerCase().includes(filters.model.toLowerCase())
      );
    }

    if (filters.customerName) {
      filtered = filtered.filter((sale) =>
        sale.customers.name.toLowerCase().includes(filters.customerName.toLowerCase())
      );
    }

    if (filters.minPrice) {
      filtered = filtered.filter(
        (sale) => sale.actual_selling_price >= parseFloat(filters.minPrice)
      );
    }

    if (filters.maxPrice) {
      filtered = filtered.filter(
        (sale) => sale.actual_selling_price <= parseFloat(filters.maxPrice)
      );
    }

    setFilteredSales(filtered);
  };

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      model: '',
      customerName: '',
      minPrice: '',
      maxPrice: '',
    });
  };

  const exportToCSV = () => {
    const headers = [
      'Date',
      'IMEI',
      'Model',
      'Customer',
      'Phone',
      'Selling Price',
      'Discount',
      'Profit',
      'Payment Method',
    ];

    const rows = filteredSales.map((sale) => [
      sale.sale_date,
      sale.iphones.imei,
      `${sale.iphones.model} ${sale.iphones.storage}`,
      sale.customers.name,
      sale.customers.phone_number,
      sale.actual_selling_price.toFixed(2),
      sale.discount.toFixed(2),
      sale.profit.toFixed(2),
      sale.payment_method,
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.actual_selling_price, 0);
  const totalProfit = filteredSales.reduce((sum, sale) => sum + sale.profit, 0);
  const totalDiscount = filteredSales.reduce((sum, sale) => sum + sale.discount, 0);

  if (loading) {
    return <div className="text-center py-12">Loading sales...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Sales Report</h1>
          <p className="text-slate-600 mt-1">View and analyze all sales transactions</p>
        </div>
        <button
          onClick={exportToCSV}
          className="bg-slate-900 text-white px-6 py-3 rounded-lg hover:bg-slate-800 transition-colors flex items-center"
        >
          <FileDown className="w-5 h-5 mr-2" />
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center mb-4">
          <Filter className="w-5 h-5 text-slate-600 mr-2" />
          <h2 className="text-lg font-semibold text-slate-900">Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Model
            </label>
            <input
              type="text"
              value={filters.model}
              onChange={(e) => setFilters({ ...filters, model: e.target.value })}
              placeholder="Search model"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Customer
            </label>
            <input
              type="text"
              value={filters.customerName}
              onChange={(e) => setFilters({ ...filters, customerName: e.target.value })}
              placeholder="Customer name"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Min Price
            </label>
            <input
              type="number"
              value={filters.minPrice}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              placeholder="0"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Max Price
            </label>
            <input
              type="number"
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              placeholder="9999"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={resetFilters}
            className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm text-slate-600">Total Sales</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{filteredSales.length}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm text-slate-600">Total Revenue</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            Rs. {totalRevenue.toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm text-slate-600">Total Profit</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            Rs. {totalProfit.toFixed(2)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm text-slate-600">Total Discount</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            Rs. {totalDiscount.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                  IMEI
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                  Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                  Profit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                  Payment
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm text-slate-900">
                    {new Date(sale.sale_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900">{sale.iphones.imei}</td>
                  <td className="px-6 py-4 text-sm text-slate-900">
                    <div>
                      <p className="font-medium">{sale.iphones.model}</p>
                      <p className="text-xs text-slate-500">
                        {sale.iphones.storage} • {sale.iphones.color}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900">
                    <div>
                      <p className="font-medium">{sale.customers.name}</p>
                      <p className="text-xs text-slate-500">{sale.customers.phone_number}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900">
                    Rs. {sale.actual_selling_price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900">
                    Rs. {sale.discount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`font-semibold ${
                        sale.profit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      Rs. {sale.profit.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900 capitalize">
                    {sale.payment_method.replace('_', ' ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
