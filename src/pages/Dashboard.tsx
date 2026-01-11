import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Package, DollarSign, TrendingUp, ShoppingBag } from 'lucide-react';

interface DashboardStats {
  totalInStock: number;
  totalSold: number;
  monthlySales: number;
  monthlyRevenue: number;
  totalRevenue: number;
  totalProfit: number;
}

interface MonthlySalesData {
  month: string;
  sales: number;
  revenue: number;
}

interface ModelStats {
  model: string;
  count: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalInStock: 0,
    totalSold: 0,
    monthlySales: 0,
    monthlyRevenue: 0,
    totalRevenue: 0,
    totalProfit: 0,
  });
  const [monthlySalesData, setMonthlySalesData] = useState<MonthlySalesData[]>([]);
  const [topModels, setTopModels] = useState<ModelStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: iphones } = await supabase.from('iphones').select('*');

      const { data: sales } = await supabase
        .from('sales')
        .select('*, iphones(model)');

      if (iphones && sales) {
        const inStock = iphones.filter((p) => p.status === 'in_stock').length;
        const sold = iphones.filter((p) => p.status === 'sold').length;

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const monthlySalesData = sales.filter((sale) => {
          const saleDate = new Date(sale.sale_date);
          return (
            saleDate.getMonth() === currentMonth &&
            saleDate.getFullYear() === currentYear
          );
        });

        const totalRevenue = sales.reduce((sum, sale) => sum + sale.actual_selling_price, 0);
        const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);
        const monthlyRevenue = monthlySalesData.reduce(
          (sum, sale) => sum + sale.actual_selling_price,
          0
        );

        setStats({
          totalInStock: inStock,
          totalSold: sold,
          monthlySales: monthlySalesData.length,
          monthlyRevenue,
          totalRevenue,
          totalProfit,
        });

        const last6Months = generateLast6Months();
        const monthlyData = last6Months.map((monthYear) => {
          const [month, year] = monthYear.split(' ');
          const monthIndex = new Date(Date.parse(month + ' 1, 2000')).getMonth();
          const yearNum = parseInt(year);

          const monthSales = sales.filter((sale) => {
            const saleDate = new Date(sale.sale_date);
            return (
              saleDate.getMonth() === monthIndex &&
              saleDate.getFullYear() === yearNum
            );
          });

          return {
            month: monthYear,
            sales: monthSales.length,
            revenue: monthSales.reduce((sum, sale) => sum + sale.actual_selling_price, 0),
          };
        });

        setMonthlySalesData(monthlyData);

        const modelCounts: { [key: string]: number } = {};
        sales.forEach((sale) => {
          const model = (sale.iphones as any)?.model || 'Unknown';
          modelCounts[model] = (modelCounts[model] || 0) + 1;
        });

        const topModelsData = Object.entries(modelCounts)
          .map(([model, count]) => ({ model, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setTopModels(topModelsData);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateLast6Months = () => {
    const months = [];
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push(`${monthNames[date.getMonth()]} ${date.getFullYear()}`);
    }

    return months;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading dashboard...</div>
      </div>
    );
  }

  const maxSales = Math.max(...monthlySalesData.map((d) => d.sales), 1);
  const maxRevenue = Math.max(...monthlySalesData.map((d) => d.revenue), 1);
  const maxModelCount = Math.max(...topModels.map((m) => m.count), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">Overview of your iPhone shop performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">In Stock</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalInStock}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Sold</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.totalSold}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <ShoppingBag className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Monthly Sales</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{stats.monthlySales}</p>
            </div>
            <div className="bg-slate-100 p-3 rounded-full">
              <TrendingUp className="w-6 h-6 text-slate-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Monthly Revenue</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">
                {formatCurrency(stats.monthlyRevenue)}
              </p>
            </div>
            <div className="bg-emerald-100 p-3 rounded-full">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Revenue</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
            <div className="bg-cyan-100 p-3 rounded-full">
              <DollarSign className="w-6 h-6 text-cyan-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Profit</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">
                {formatCurrency(stats.totalProfit)}
              </p>
            </div>
            <div className="bg-teal-100 p-3 rounded-full">
              <TrendingUp className="w-6 h-6 text-teal-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Monthly Sales</h2>
          <div className="h-64 flex items-end justify-between space-x-2">
            {monthlySalesData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div className="w-full relative" style={{ height: '200px' }}>
                  <div
                    className="absolute bottom-0 w-full bg-slate-900 rounded-t transition-all hover:bg-slate-700"
                    style={{
                      height: `${(data.sales / maxSales) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-slate-600 mt-2">{data.month.split(' ')[0]}</p>
                <p className="text-xs font-semibold text-slate-900">{data.sales}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Monthly Revenue</h2>
          <div className="h-64">
            <svg width="100%" height="200" className="overflow-visible">
              <polyline
                fill="none"
                stroke="#0f172a"
                strokeWidth="3"
                points={monthlySalesData
                  .map((data, index) => {
                    const x = (index / (monthlySalesData.length - 1)) * 100;
                    const y = 100 - (data.revenue / maxRevenue) * 100;
                    return `${x}%,${y}%`;
                  })
                  .join(' ')}
              />
              {monthlySalesData.map((data, index) => {
                const x = (index / (monthlySalesData.length - 1)) * 100;
                const y = 100 - (data.revenue / maxRevenue) * 100;
                return (
                  <circle
                    key={index}
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="4"
                    fill="#0f172a"
                  />
                );
              })}
            </svg>
            <div className="flex justify-between mt-2">
              {monthlySalesData.map((data, index) => (
                <div key={index} className="text-center flex-1">
                  <p className="text-xs text-slate-600">{data.month.split(' ')[0]}</p>
                  <p className="text-xs font-semibold text-slate-900">
                    {formatCurrency(data.revenue)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Best Selling Models</h2>
        <div className="space-y-3">
          {topModels.map((model, index) => (
            <div key={index} className="flex items-center">
              <div className="w-32 text-sm text-slate-700">{model.model}</div>
              <div className="flex-1 mx-4">
                <div className="bg-slate-100 rounded-full h-8 relative overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-slate-900 rounded-full transition-all"
                    style={{ width: `${(model.count / maxModelCount) * 100}%` }}
                  />
                </div>
              </div>
              <div className="w-16 text-right text-sm font-semibold text-slate-900">
                {model.count} sold
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
