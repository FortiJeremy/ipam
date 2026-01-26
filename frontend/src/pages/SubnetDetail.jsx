import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Plus, Monitor, Hash, CheckCircle, Search } from 'lucide-react';
import { Badge } from '../components/Badge';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { StatsCard } from '../components/StatsCard';

export function SubnetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [subnet, setSubnet] = useState(null);
  const [ips, setIps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIp, setSelectedIp] = useState(null);
  const [devices, setDevices] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subnetRes, ipsRes, devicesRes] = await Promise.all([
        fetch(`/api/subnets/${id}`),
        fetch(`/api/ips/?subnet_id=${id}`),
        fetch(`/api/devices/`)
      ]);
      const subnetData = await subnetRes.json();
      const ipsData = await ipsRes.json();
      const devicesData = await devicesRes.json();
      
      setSubnet(subnetData);
      setIps(ipsData);
      setDevices(devicesData);
    } catch (err) {
      console.error('Failed to fetch subnet details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const [ipFormData, setIpFormData] = useState({
    address: '',
    status: 'ALLOCATED',
    device_id: ''
  });
  const [error, setError] = useState(null);

  const handlePromoteIp = (ip) => {
    setIpFormData({
      address: ip.address,
      status: 'ALLOCATED',
      device_id: ip.device_id || ''
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
          subnet_id: parseInt(id),
          device_id: ipFormData.device_id ? parseInt(ipFormData.device_id) : null
        }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setIpFormData({ address: '', status: 'ALLOCATED', device_id: '' });
        fetchData();
      } else {
        const errorData = await res.json();
        setError(errorData.detail || 'Failed to assign IP address');
      }
    } catch (err) {
      console.error('Failed to assign IP:', err);
      setError('A network error occurred');
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'ALLOCATED': return 'success';
      case 'RESERVED': return 'warning';
      case 'DISCOVERED': return 'blue';
      default: return 'default';
    }
  };

  const columns = [
    { 
      header: 'IP Address', 
      cell: (row) => (
        row.status === 'DISCOVERED' ? (
          <button 
            onClick={() => handlePromoteIp(row)}
            className="font-mono text-blue-600 hover:text-blue-800 hover:underline font-medium"
            title="Assign to Device / Promote"
          >
            {row.address}
          </button>
        ) : (
          <span className="font-mono">{row.address}</span>
        )
      )
    },
    {
      header: 'Resolved Name',
      cell: (row) => (
        <span className="text-sm text-gray-500 italic">
          {row.hostname || '-'}
        </span>
      )
    },
    { 
      header: 'Status', 
      cell: (row) => <Badge variant={getStatusVariant(row.status)}>{row.status}</Badge>
    },
    { header: 'MAC Address', accessor: 'mac_address' },
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
    { 
      header: 'Last Seen', 
      cell: (row) => {
        if (!row.last_seen) return 'Never';
        const dateStr = row.last_seen.endsWith('Z') || row.last_seen.includes('+') 
          ? row.last_seen 
          : `${row.last_seen}Z`;
        return new Date(dateStr).toLocaleString();
      }
    }
  ];

  if (loading && !subnet) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/subnets')}
          className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-slate-700 transition-all"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{subnet?.name}</h1>
          <p className="text-gray-500 dark:text-gray-400">{subnet?.network_address}/{subnet?.prefix_length}</p>
        </div>
        <div className="flex-1"></div>
        <button 
          onClick={fetchData}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 px-4 py-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-gray-200 dark:hover:border-slate-700"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard 
          title="Free IPs" 
          value={subnet?.stats?.free ?? 0} 
          icon={Hash} 
          description="Unallocated addresses"
        />
        <StatsCard 
          title="Assigned IPs" 
          value={subnet?.stats?.assigned ?? 0} 
          icon={CheckCircle} 
          description="Inventory + Reserved"
          className="border-green-100 bg-green-50/10 dark:border-green-900/30 dark:bg-green-900/10"
        />
        <StatsCard 
          title="Discovered" 
          value={subnet?.stats?.discovered ?? 0} 
          icon={Search} 
          description="Not yet identified"
          className="border-blue-100 bg-blue-50/10 dark:border-blue-900/30 dark:bg-blue-900/10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Subnet Info</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Gateway</span>
              <span className="text-sm font-medium dark:text-slate-200">{subnet?.gateway || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">VLAN ID</span>
              <span className="text-sm font-medium dark:text-slate-200">{subnet?.vlan_id || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Description</span>
              <span className="text-sm font-medium dark:text-slate-200">{subnet?.description || 'No description'}</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">IP Assignments</h3>
            <button
               onClick={() => {
                 setIpFormData({ address: '', status: 'ALLOCATED', device_id: '' });
                 setIsModalOpen(true);
               }}
               className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" /> Manual Assign
            </button>
          </div>
          <DataTable 
            columns={columns} 
            data={ips} 
            loading={loading}
          />
        </div>
      </div>

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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder={`${subnet?.network_address.split('.').slice(0,3).join('.')}.10`}
              value={ipFormData.address}
              onChange={(e) => setIpFormData({...ipFormData, address: e.target.value})}
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
