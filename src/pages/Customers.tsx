import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Customer } from '../types/database';
import { Users, Search, ShoppingBag } from 'lucide-react';

interface CustomerWithSales extends Customer {
  salesCount: number;
  totalSpent: number;
}

export default function Customers() {
  const [customers, setCustomers] = useState<CustomerWithSales[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerWithSales[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm]);

  const loadCustomers = async () => {
    try {
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (customersError) throw customersError;

      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('customer_id, actual_selling_price');

      if (salesError) throw salesError;

      const customerSalesMap = new Map<
        string,
        { count: number; total: number }
      >();

      salesData?.forEach((sale) => {
        const current = customerSalesMap.get(sale.customer_id) || {
          count: 0,
          total: 0,
        };
        customerSalesMap.set(sale.customer_id, {
          count: current.count + 1,
          total: current.total + sale.actual_selling_price,
        });
      });

      const customersWithSales: CustomerWithSales[] =
        customersData?.map((customer) => {
          const salesInfo = customerSalesMap.get(customer.id) || {
            count: 0,
            total: 0,
          };
          return {
            ...customer,
            salesCount: salesInfo.count,
            totalSpent: salesInfo.total,
          };
        }) || [];

      setCustomers(customersWithSales);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    if (!searchTerm) {
      setFilteredCustomers(customers);
      return;
    }

    const filtered = customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone_number.includes(searchTerm) ||
        customer.nic?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredCustomers(filtered);
  };

  if (loading) {
    return <div className="text-center py-12">Loading customers...</div>;
  }

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.salesCount > 0).length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Customers</h1>
        <p className="text-slate-600 mt-1">View and manage customer information</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Customers</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{totalCustomers}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Active Customers</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{activeCustomers}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <ShoppingBag className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Revenue</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">
                Rs. {totalRevenue.toFixed(2)}
              </p>
            </div>
            <div className="bg-emerald-100 p-3 rounded-full">
              <ShoppingBag className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, phone, or NIC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                  NIC
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                  Purchases
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                  Total Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase">
                  Joined Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">
                    {customer.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900">
                    {customer.phone_number}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900">
                    {customer.nic || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900">
                    <span className="px-2 py-1 bg-slate-100 rounded-full text-xs font-medium">
                      {customer.salesCount} {customer.salesCount === 1 ? 'sale' : 'sales'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                    Rs. {customer.totalSpent.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900">
                    {new Date(customer.created_at).toLocaleDateString()}
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
