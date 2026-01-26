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
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">System Overview</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Network health and resource distribution</p>
      </div>

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
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm min-h-[300px] transition-colors duration-200">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">System Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-transparent dark:border-slate-700 transition-colors duration-200">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Database Connection</span>
              <span className="flex items-center text-xs font-bold text-green-600 dark:text-green-400 uppercase">
                <span className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-400 mr-2 animate-pulse"></span>
                Connected
              </span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-transparent dark:border-slate-700 transition-colors duration-200">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Background Scanner</span>
              <span className="flex items-center text-xs font-bold text-green-600 dark:text-green-400 uppercase">
                <span className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-400 mr-2 animate-pulse"></span>
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
