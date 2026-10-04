import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { OperationProvider } from './context/OperationProvider'
import { DispatchPage } from './pages/DispatchPage'
import { DriverDeliveriesPage } from './pages/DriverDeliveriesPage'
import { DriverSelectPage } from './pages/DriverSelectPage'
import { MetricsPage } from './pages/MetricsPage'
import { OrderLookupPage } from './pages/OrderLookupPage'
import { ProfileSelectPage } from './pages/ProfileSelectPage'
import { TrackingPage } from './pages/TrackingPage'

export default function App() {
  return (
    <OperationProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<ProfileSelectPage />} />
            <Route path="despacho" element={<DispatchPage />} />
            <Route path="metricas" element={<MetricsPage />} />
            <Route path="entregador" element={<DriverSelectPage />} />
            <Route path="entregador/:id" element={<DriverDeliveriesPage />} />
            <Route path="pedido" element={<OrderLookupPage />} />
            <Route path="pedido/:id" element={<TrackingPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </OperationProvider>
  )
}
