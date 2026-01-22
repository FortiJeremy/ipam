import { useState, useEffect } from 'react';
import { LayoutGrid, Server, Hash, Activity } from 'lucide-react';
import { StatsCard } from '../components/StatsCard';

export function Dashboard() {
  const [stats, setStats] = useState({
    subnets: 0,
    devices: 0,
    total_ips: 0,
    discovery_queue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch stats:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard 
          title="Total Subnets" 
          value={stats.subnets} 
          icon={LayoutGrid} 
          description="Configured ranges"
          href="/subnets"
        />
        <StatsCard 
          title="Registered Devices" 
          value={stats.devices} 
          icon={Server} 
          description="Hosts in inventory"
          href="/devices"
        />
        <StatsCard 
          title="Online Hosts" 
          value={stats.discovery_queue} 
          icon={Activity} 
          description="Currently reachable"
          href="/live"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm min-h-[300px]">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">System Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Database Connection</span>
              <span className="flex items-center text-xs font-bold text-green-600 uppercase">
                <span className="h-2 w-2 rounded-full bg-green-600 mr-2 animate-pulse"></span>
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-600">Background Scanner</span>
              <span className="flex items-center text-xs font-bold text-green-600 uppercase">
                <span className="h-2 w-2 rounded-full bg-green-600 mr-2 animate-pulse"></span>
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
