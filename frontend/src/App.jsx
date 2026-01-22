import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Subnets } from './pages/Subnets';
import { SubnetDetail } from './pages/SubnetDetail';
import { Devices } from './pages/Devices';
import { DeviceDetail } from './pages/DeviceDetail';
import { LiveView } from './pages/LiveView';
import { Settings } from './pages/Settings';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/subnets" element={<Subnets />} />
          <Route path="/subnets/:id" element={<SubnetDetail />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/devices/:id" element={<DeviceDetail />} />
          <Route path="/live" element={<LiveView />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
