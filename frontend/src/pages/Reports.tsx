import { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import api from '../api/client';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

interface SalesData { date: string; total: number; }
interface TopProduct { producto: string; cantidad: number; monto: number; }
interface IncomeExpenses { ingresos: number; gastos: number; utilidad_bruta: number; }
interface PaymentTypeData { tipo: string; total: number; cantidad: number; }

function getDefaultDates() {
  const hoy = new Date();
  const hace30 = new Date(hoy);
  hace30.setDate(hace30.getDate() - 30);
  return {
    desde: hace30.toISOString().slice(0, 10),
    hasta: hoy.toISOString().slice(0, 10),
  };
}

export default function Reports() {
  const [sales, setSales] = useState<{ data: SalesData[] }>({ data: [] });
  const [topProducts, setTopProducts] = useState<{ data: TopProduct[] }>({ data: [] });
  const [incomeExpenses, setIncomeExpenses] = useState<IncomeExpenses | null>(null);
  const [salesByPaymentType, setSalesByPaymentType] = useState<{ data: PaymentTypeData[] }>({ data: [] });
  const [dates, setDates] = useState(getDefaultDates);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const { desde, hasta } = dates;
    Promise.all([
      api.get<{ data: SalesData[] }>(`/reports/sales-by-cobro?desde=${desde}&hasta=${hasta}`).then(r => r.data),
      api.get<{ data: TopProduct[] }>(`/reports/top-products?desde=${desde}&hasta=${hasta}`).then(r => r.data),
      api.get<IncomeExpenses>(`/reports/income-vs-expenses?desde=${desde}&hasta=${hasta}`).then(r => r.data),
      api.get<{ data: PaymentTypeData[] }>(`/reports/sales-by-payment-type?desde=${desde}&hasta=${hasta}`).then(r => r.data),
    ])
      .then(([s, t, i, p]) => {
        setSales(s as { data: SalesData[] });
        setTopProducts(t as { data: TopProduct[] });
        setIncomeExpenses(i as IncomeExpenses);
        setSalesByPaymentType(p as { data: PaymentTypeData[] });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [dates.desde, dates.hasta]);

  const salesChartData = {
    labels: sales.data.map((d) => d.date),
    datasets: [{ label: 'Ventas cobradas (₡)', data: sales.data.map((d) => d.total), backgroundColor: 'rgba(59, 130, 246, 0.6)' }],
  };

  const paymentTypeChartData = {
    labels: salesByPaymentType.data.map((p) => p.tipo),
    datasets: [{ data: salesByPaymentType.data.map((p) => p.total), backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'] }],
  };

  const pieData = {
    labels: topProducts.data.slice(0, 8).map((p) => p.producto),
    datasets: [{ data: topProducts.data.slice(0, 8).map((p) => p.monto), backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'] }],
  };

  return (
    <div className="page reports-page">
      <h1>Reportes Visuales</h1>
      <div className="reports-date-filter">
        <label>Desde</label>
        <input
          type="date"
          value={dates.desde}
          onChange={(e) => setDates((d) => ({ ...d, desde: e.target.value }))}
        />
        <label>Hasta</label>
        <input
          type="date"
          value={dates.hasta}
          onChange={(e) => setDates((d) => ({ ...d, hasta: e.target.value }))}
        />
      </div>
      {loading && <p className="reports-loading">Cargando...</p>}
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
          <h3>Rentabilidad</h3>
          {incomeExpenses && (
            <div className="stats">
              <div className="stat"><span className="label">Ingresos</span><span className="value positive">₡{incomeExpenses.ingresos.toLocaleString()}</span></div>
              <div className="stat"><span className="label">Gastos</span><span className="value negative">₡{incomeExpenses.gastos.toLocaleString()}</span></div>
              <div className="stat"><span className="label">Utilidad bruta</span><span className="value">₡{incomeExpenses.utilidad_bruta.toLocaleString()}</span></div>
            </div>
          )}
        </div>
        <div className="card">
          <h3>Ventas por tipo de pago</h3>
          <div className="chart-container small">
            {salesByPaymentType.data.length > 0 ? (
              <Doughnut data={paymentTypeChartData} options={{ responsive: true }} />
            ) : (
              <p className="chart-empty">Sin datos en el período</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
