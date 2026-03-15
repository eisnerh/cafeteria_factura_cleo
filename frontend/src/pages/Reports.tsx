import { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { apiFetch } from '../api/client';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

interface SalesData { date: string; total: number; }
interface TopProduct { producto: string; cantidad: number; monto: number; }
interface IncomeExpenses { ingresos: number; gastos: number; utilidad_bruta: number; }

export default function Reports() {
  const [sales, setSales] = useState<{ data: SalesData[] }>({ data: [] });
  const [topProducts, setTopProducts] = useState<{ data: TopProduct[] }>({ data: [] });
  const [incomeExpenses, setIncomeExpenses] = useState<IncomeExpenses | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<{ data: SalesData[] }>('/reports/sales'),
      apiFetch<{ data: TopProduct[] }>('/reports/top-products'),
      apiFetch<IncomeExpenses>('/reports/income-vs-expenses'),
    ])
      .then(([s, t, i]) => {
        setSales(s);
        setTopProducts(t);
        setIncomeExpenses(i);
      })
      .catch(console.error);
  }, []);

  const salesChartData = {
    labels: sales.data.map((d) => d.date),
    datasets: [{ label: 'Ventas (₡)', data: sales.data.map((d) => d.total), backgroundColor: 'rgba(59, 130, 246, 0.6)' }],
  };

  const pieData = {
    labels: topProducts.data.slice(0, 8).map((p) => p.producto),
    datasets: [{ data: topProducts.data.slice(0, 8).map((p) => p.monto), backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'] }],
  };

  return (
    <div className="page reports-page">
      <h1>Reportes Visuales</h1>
      <div className="reports-grid">
        <div className="card">
          <h3>Ventas por día</h3>
          <div className="chart-container">
            <Bar data={salesChartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </div>
        </div>
        <div className="card">
          <h3>Productos más vendidos</h3>
          <div className="chart-container small">
            <Doughnut data={pieData} options={{ responsive: true }} />
          </div>
        </div>
        <div className="card stats-card">
          <h3>Rentabilidad (últimos 30 días)</h3>
          {incomeExpenses && (
            <div className="stats">
              <div className="stat"><span className="label">Ingresos</span><span className="value positive">₡{incomeExpenses.ingresos.toLocaleString()}</span></div>
              <div className="stat"><span className="label">Gastos</span><span className="value negative">₡{incomeExpenses.gastos.toLocaleString()}</span></div>
              <div className="stat"><span className="label">Utilidad bruta</span><span className="value">₡{incomeExpenses.utilidad_bruta.toLocaleString()}</span></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
