"use client"

import { ChartsDemo } from '@/components/ChartsDemo'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts'

const monthlyData = [
  { name: 'Jan', sales: 4000, profit: 2400, expenses: 1600 },
  { name: 'Feb', sales: 3000, profit: 1398, expenses: 1602 },
  { name: 'Mar', sales: 2000, profit: 9800, expenses: 10200 },
  { name: 'Apr', sales: 2780, profit: 3908, expenses: 1128 },
  { name: 'May', sales: 1890, profit: 4800, expenses: 2910 },
  { name: 'Jun', sales: 2390, profit: 3800, expenses: 1410 },
  { name: 'Jul', sales: 3490, profit: 4300, expenses: 810 },
]

const pieData = [
  { name: 'Product A', value: 400, color: '#0d9488' },
  { name: 'Product B', value: 300, color: '#14b8a6' },
  { name: 'Product C', value: 300, color: '#2dd4bf' },
  { name: 'Product D', value: 200, color: '#5eead4' },
]

const areaData = [
  { name: 'Q1', revenue: 4000, growth: 2400 },
  { name: 'Q2', revenue: 3000, growth: 1398 },
  { name: 'Q3', revenue: 2000, growth: 9800 },
  { name: 'Q4', revenue: 2780, growth: 3908 },
]

export default function ChartsPage() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Chart Examples</h1>
        </div>

        <ChartsDemo />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Line Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Performance</CardTitle>
              <CardDescription>
                Sales, profit, and expenses over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#0d9488"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    stroke="#14b8a6"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="#2dd4bf"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Comparison</CardTitle>
              <CardDescription>
                Bar chart showing monthly metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sales" fill="#0d9488" />
                  <Bar dataKey="profit" fill="#14b8a6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Product Distribution</CardTitle>
              <CardDescription>
                Market share by product
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#0d9488"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Area Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Quarterly Growth</CardTitle>
              <CardDescription>
                Revenue and growth trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={areaData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stackId="1"
                    stroke="#0d9488"
                    fill="#0d9488"
                  />
                  <Area
                    type="monotone"
                    dataKey="growth"
                    stackId="1"
                    stroke="#14b8a6"
                    fill="#14b8a6"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Raw Data</CardTitle>
            <CardDescription>
              Monthly performance data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Month</th>
                    <th className="text-left p-2">Sales</th>
                    <th className="text-left p-2">Profit</th>
                    <th className="text-left p-2">Expenses</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((row) => (
                    <tr key={row.name} className="border-b">
                      <td className="p-2">{row.name}</td>
                      <td className="p-2">${row.sales.toLocaleString()}</td>
                      <td className="p-2">${row.profit.toLocaleString()}</td>
                      <td className="p-2">${row.expenses.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 