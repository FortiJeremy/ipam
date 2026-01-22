import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Shield, Clock, Search, Plus, Monitor } from 'lucide-react';
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
  const [error, setError] = useState(null);
  const [ipFormData, setIpFormData] = useState({
    address: '',
    status: 'ALLOCATED',
    device_id: '',
    subnet_id: ''
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
        <span className="text-sm text-gray-600 italic">
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
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Activity className="h-6 w-6 text-green-500" />
            Live Discovery
          </h1>
          <p className="text-gray-500">Real-time view of detected hosts on the network</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-white px-3 py-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
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
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
              "bg-white p-4 rounded-xl border-2 text-left transition-all duration-200",
              selectedSubnetId === subnet.id 
                ? "border-blue-500 ring-2 ring-blue-500 ring-opacity-20 bg-blue-50/30" 
                : "border-gray-100 hover:border-gray-200 shadow-sm"
            )}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{subnet.name}</p>
                <p className="text-sm font-mono text-gray-700">{subnet.network_address}/{subnet.prefix_length}</p>
              </div>
              <div className="flex flex-col items-end">
                <Badge variant={
                  subnet.scan_status === 'Scanning' ? 'blue' : 
                  subnet.scan_status === 'Error' ? 'danger' : 'success'
                }>
                  {subnet.scan_status || 'Idle'}
                </Badge>
                {subnet.last_scan && (
                  <span className="text-[10px] text-gray-400 mt-1">
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
            }} className="px-4 py-2 text-gray-600">Cancel</button>
            <button onClick={handleIpSubmit} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">Assign IP</button>
          </>
        )}
      >
        <form className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              value={ipFormData.address}
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              value={ipFormData.status}
              onChange={(e) => setIpFormData({...ipFormData, status: e.target.value})}
            >
              <option value="ALLOCATED">Allocated</option>
              <option value="RESERVED">Reserved</option>
              <option value="DHCP_POOL">DHCP Pool</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Device (Optional)</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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
    </div>
  );
}
