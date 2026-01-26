import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Shield, Clock, Search, Plus, Monitor, Server } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { clsx } from 'clsx';

export function LiveView() {
  const [ips, setIps] = useState([]);
  const [subnets, setSubnets] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedSubnetId, setSelectedSubnetId] = useState(null);
  const [hideAssigned, setHideAssigned] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [error, setError] = useState(null);
  const [ipFormData, setIpFormData] = useState({
    address: '',
    status: 'ALLOCATED',
    device_id: '',
    subnet_id: ''
  });
  const [deviceFormData, setDeviceFormData] = useState({
    hostname: '',
    manufacturer: '',
    model: '',
    device_type: 'Server',
    tags: '',
    notes: '',
    ip_address: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ipsRes, subnetsRes, devicesRes] = await Promise.all([
        fetch('/api/ips/'),
        fetch('/api/subnets/'),
        fetch('/api/devices/')
      ]);
      const ipsData = await ipsRes.json();
      const subnetsData = await subnetsRes.json();
      const devicesData = await devicesRes.json();
      
      // Filter for only ones that are Online or Discovered
      const onlineIps = ipsData.filter(ip => 
        ip.healthcheck_status === 'Online' || ip.status === 'DISCOVERED'
      );
      setIps(onlineIps);
      setSubnets(subnetsData);
      setDevices(devicesData);
    } catch (err) {
      console.error('Failed to fetch live data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const handlePromoteIp = (ip) => {
    setIpFormData({
      address: ip.address,
      status: 'ALLOCATED',
      device_id: ip.device_id || '',
      subnet_id: ip.subnet_id
    });
    setIsModalOpen(true);
  };

  const handleCreateDevice = (ip) => {
    setDeviceFormData({
      hostname: ip.hostname || '',
      manufacturer: '',
      model: '',
      device_type: 'Server',
      tags: 'discovered',
      notes: `Automatically discovered on ${new Date().toLocaleDateString()}`,
      ip_address: ip.address
    });
    setIsDeviceModalOpen(true);
  };

  const handleIpSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/api/ips/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...ipFormData,
          device_id: ipFormData.device_id ? parseInt(ipFormData.device_id) : null
        }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      } else {
        const errorData = await res.json();
        setError(errorData.detail || 'Failed to assign IP address');
      }
    } catch (err) {
      console.error('Failed to assign IP:', err);
    }
  };

  const handleDeviceSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/api/devices/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deviceFormData),
      });
      if (res.ok) {
        setIsDeviceModalOpen(false);
        fetchData();
      } else {
        const errorData = await res.json();
        setError(errorData.detail || 'Failed to register device');
      }
    } catch (err) {
      console.error('Failed to register device:', err);
      setError('A network error occurred');
    }
  };

  const filteredIps = ips.filter(ip => {
    const matchesSearch = ip.address.includes(filter) || 
      ip.mac_address?.toLowerCase().includes(filter.toLowerCase());
    const matchesSubnet = selectedSubnetId ? ip.subnet_id === selectedSubnetId : true;
    const matchesHideAssigned = hideAssigned ? ip.status === 'DISCOVERED' : true;
    return matchesSearch && matchesSubnet && matchesHideAssigned;
  });

  const columns = [
    { 
      header: 'IP Address', 
      cell: (row) => (
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
          {row.status === 'DISCOVERED' ? (
            <button 
              onClick={() => handlePromoteIp(row)}
              className="font-mono font-medium text-blue-600 hover:text-blue-800 hover:underline"
              title="Assign to Device / Promote"
            >
              {row.address}
            </button>
          ) : (
            <span className="font-mono font-medium">{row.address}</span>
          )}
        </div>
      )
    },
    {
      header: 'Resolved Name',
      cell: (row) => (
        <span className="text-sm text-gray-600 dark:text-gray-400 italic">
          {row.hostname || '-'}
        </span>
      )
    },
    { 
      header: 'Status', 
      cell: (row) => (
        <Badge variant={row.status === 'DISCOVERED' ? 'blue' : 'success'}>
          {row.status === 'DISCOVERED' ? 'Found by Scanner' : 'Assigned'}
        </Badge>
      )
    },
    { 
      header: 'Assigned Device', 
      cell: (row) => {
        const device = devices.find(d => d.id === row.device_id);
        return device ? (
          <Link 
            to={`/devices/${device.id}`}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            <Monitor className="h-3.5 w-3.5" />
            {device.hostname}
          </Link>
        ) : '-'
      }
    },
    { header: 'MAC Address', accessor: 'mac_address' },
    { 
      header: 'Last Seen', 
      cell: (row) => {
        if (!row.last_seen) return 'Just now';
        // Ensure UTC interpretation if no timezone is provided
        const dateStr = row.last_seen.endsWith('Z') || row.last_seen.includes('+') 
          ? row.last_seen 
          : `${row.last_seen}Z`;
        return (
          <div className="flex items-center gap-1.5 text-gray-500">
            <Clock className="h-3.5 w-3.5" />
            {new Date(dateStr).toLocaleTimeString()}
          </div>
        );
      }
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex gap-2">
          {row.status === 'DISCOVERED' && (
            <button 
              onClick={() => handleCreateDevice(row)}
              className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              title="Register as New Device"
            >
              <Plus className="h-3 w-3" /> Device
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Activity className="h-6 w-6 text-green-500" />
            Live Discovery
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Real-time view of detected hosts on the network</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-slate-800 px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              checked={hideAssigned}
              onChange={(e) => setHideAssigned(e.target.checked)}
            />
            Hide Assigned IPs
          </label>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search IP or MAC..."
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {subnets.map(subnet => (
          <button 
            key={subnet.id} 
            onClick={() => setSelectedSubnetId(selectedSubnetId === subnet.id ? null : subnet.id)}
            className={clsx(
              "p-4 rounded-xl border-2 text-left transition-all duration-200",
              selectedSubnetId === subnet.id 
                ? "bg-blue-50/30 dark:bg-blue-900/20 border-blue-500 ring-2 ring-blue-500 ring-opacity-20" 
                : "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700/50 hover:border-gray-200 dark:hover:border-slate-600 shadow-sm"
            )}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{subnet.name}</p>
                <p className="text-sm font-mono text-gray-700 dark:text-gray-300">{subnet.network_address}/{subnet.prefix_length}</p>
              </div>
              <div className="flex flex-col items-end">
                <Badge variant={
                  subnet.scan_status === 'Scanning' ? 'blue' : 
                  subnet.scan_status === 'Error' ? 'danger' : 'success'
                }>
                  {subnet.scan_status || 'Idle'}
                </Badge>
                {subnet.last_scan && (
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                    Last: {new Date(subnet.last_scan.endsWith('Z') || subnet.last_scan.includes('+') ? subnet.last_scan : `${subnet.last_scan}Z`).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      <DataTable 
        columns={columns} 
        data={filteredIps} 
        loading={loading}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setError(null);
        }}
        title="Assign IP Address"
        footer={(
          <>
            <button onClick={() => {
              setIsModalOpen(false);
              setError(null);
            }} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">Cancel</button>
            <button onClick={handleIpSubmit} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">Assign IP</button>
          </>
        )}
      >
        <form className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IP Address</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900/50 dark:text-white"
              value={ipFormData.address}
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 dark:text-white"
              value={ipFormData.status}
              onChange={(e) => setIpFormData({...ipFormData, status: e.target.value})}
            >
              <option value="ALLOCATED">Allocated</option>
              <option value="RESERVED">Reserved</option>
              <option value="DHCP_POOL">DHCP Pool</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign to Device (Optional)</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 dark:text-white"
              value={ipFormData.device_id}
              onChange={(e) => setIpFormData({...ipFormData, device_id: e.target.value})}
            >
              <option value="">None</option>
              {devices.map(d => (
                <option key={d.id} value={d.id}>{d.hostname}</option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDeviceModalOpen}
        onClose={() => {
          setIsDeviceModalOpen(false);
          setError(null);
        }}
        title="Register New Device"
        footer={(
          <>
            <button
              onClick={() => {
                setIsDeviceModalOpen(false);
                setError(null);
              }}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleDeviceSubmit}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Register Device
            </button>
          </>
        )}
      >
        <form className="space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hostname</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. srv-prod-01"
                value={deviceFormData.hostname}
                onChange={(e) => setDeviceFormData({...deviceFormData, hostname: e.target.value})}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Primary IP Address</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg bg-gray-50 dark:bg-slate-900/50 font-mono"
                value={deviceFormData.ip_address}
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Device Type</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                value={deviceFormData.device_type}
                onChange={(e) => setDeviceFormData({...deviceFormData, device_type: e.target.value})}
              >
                <option>Server</option>
                <option>Switch</option>
                <option>Router</option>
                <option>Workstation</option>
                <option>IoT</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Manufacturer</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Dell, HP, etc."
                value={deviceFormData.manufacturer}
                onChange={(e) => setDeviceFormData({...deviceFormData, manufacturer: e.target.value})}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (Comma separated)</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="prod, web, linux"
                value={deviceFormData.tags}
                onChange={(e) => setDeviceFormData({...deviceFormData, tags: e.target.value})}
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
