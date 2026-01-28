import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Plus, Monitor, Hash, CheckCircle, Search, Layers, ExternalLink, Edit, Info } from 'lucide-react';
import clsx from 'clsx';
import { Badge } from '../components/Badge';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { StatsCard } from '../components/StatsCard';

export function SubnetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [subnet, setSubnet] = useState(null);
  const [ips, setIps] = useState([]);
  const [ranges, setRanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRangeModalOpen, setIsRangeModalOpen] = useState(false);
  const [isEditSubnetModalOpen, setIsEditSubnetModalOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState(null);
  const [devices, setDevices] = useState([]);
  const [isAllocating, setIsAllocating] = useState(false);
  const [allocPoolId, setAllocPoolId] = useState('');

  const [subnetFormData, setSubnetFormData] = useState({
    name: '',
    network_address: '',
    prefix_length: 24,
    gateway: '',
    vlan_id: '',
    description: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [subnetRes, ipsRes, rangesRes, devicesRes] = await Promise.all([
        fetch(`/api/subnets/${id}`),
        fetch(`/api/ips/?subnet_id=${id}`),
        fetch(`/api/ranges/?subnet_id=${id}`),
        fetch(`/api/devices/`)
      ]);
      const subnetData = await subnetRes.json();
      const ipsData = await ipsRes.json();
      const rangesData = await rangesRes.json();
      const devicesData = await devicesRes.json();
      
      setSubnet(subnetData);
      setIps(ipsData);
      setRanges(rangesData);
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
  const [rangeFormData, setRangeFormData] = useState({
    name: '',
    start_ip: '',
    end_ip: '',
    purpose: 'DHCP',
    description: ''
  });
  const [error, setError] = useState(null);

  const handlePromoteIp = (ip) => {
    setIpFormData({
      address: ip.address,
      status: 'ALLOCATED',
      device_id: ip.device_id || ''
    });
    setAllocPoolId('');
    setIsModalOpen(true);
  };

  const handleFindNext = async () => {
    setIsAllocating(true);
    setError(null);
    try {
      let url = `/api/subnets/${id}/next-available`;
      if (allocPoolId) {
        url += `?pool_id=${allocPoolId}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setIpFormData({ ...ipFormData, address: data.address });
      } else {
        const err = await res.json();
        setError(err.detail || 'No available IP found in this selection');
      }
    } catch (err) {
      setError('Connection error while finding IP');
    } finally {
      setIsAllocating(false);
    }
  };

  const handleAllocateFromPool = (range) => {
    setIpFormData({ address: '', status: 'ALLOCATED', device_id: '' });
    setAllocPoolId(range?.id ? range.id.toString() : '');
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

  const handleRangeSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/api/ranges/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...rangeFormData,
          subnet_id: parseInt(id)
        }),
      });
      if (res.ok) {
        setIsRangeModalOpen(false);
        setRangeFormData({ name: '', start_ip: '', end_ip: '', purpose: 'DHCP', description: '' });
        fetchData();
      } else {
        const errorData = await res.json();
        setError(errorData.detail || 'Failed to create IP range');
      }
    } catch (err) {
      console.error('Failed to create range:', err);
      setError('A network error occurred');
    }
  };

  const handleSubnetEdit = () => {
    setSubnetFormData({
      name: subnet.name || '',
      network_address: subnet.network_address || '',
      prefix_length: subnet.prefix_length || 24,
      gateway: subnet.gateway || '',
      vlan_id: subnet.vlan_id || '',
      description: subnet.description || ''
    });
    setIsEditSubnetModalOpen(true);
  };

  const handleSubnetSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch(`/api/subnets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...subnetFormData,
          vlan_id: subnetFormData.vlan_id ? parseInt(subnetFormData.vlan_id) : null,
          prefix_length: parseInt(subnetFormData.prefix_length)
        }),
      });
      if (res.ok) {
        setIsEditSubnetModalOpen(false);
        fetchData();
      } else {
        const errorData = await res.json();
        setError(errorData.detail || 'Failed to update subnet');
      }
    } catch (err) {
      console.error('Failed to update subnet:', err);
      setError('A network error occurred');
    }
  };

  const isIpInRange = (ip, start, end) => {
    const ipToLong = (ip) => ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
    const ipNum = ipToLong(ip);
    return ipNum >= ipToLong(start) && ipNum <= ipToLong(end);
  };

  const filteredIps = (() => {
    if (selectedRange === 'no-pool') {
      return ips.filter(ip => !ranges.some(range => isIpInRange(ip.address, range.start_ip, range.end_ip)));
    }
    if (selectedRange) {
      return ips.filter(ip => isIpInRange(ip.address, selectedRange.start_ip, selectedRange.end_ip));
    }
    return ips;
  })();

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
        <button 
          onClick={handleSubnetEdit}
          className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          title="Edit Subnet"
        >
          <Edit className="h-5 w-5" />
        </button>
        <div className="flex-1"></div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 px-4 py-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-gray-200 dark:hover:border-slate-700"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
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
          className="border-green-100 dark:border-green-900/30"
        />
        <StatsCard 
          title="Discovered" 
          value={subnet?.stats?.discovered ?? 0} 
          icon={Search} 
          description="Not yet identified"
          className="border-blue-100 dark:border-blue-900/30"
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
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Info className="h-4 w-4" /> Notes
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
            {subnet?.description || 'No notes available for this subnet.'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">IP Pools</h3>
            <button 
              onClick={() => setIsRangeModalOpen(true)}
              className="text-blue-600 hover:text-blue-700 p-1"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            {ranges.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No pools defined</p>
            ) : (
              ranges.map(range => (
                <div 
                  key={range.id} 
                  className={clsx(
                    "p-3 rounded-lg border transition-all cursor-pointer group",
                    selectedRange?.id === range.id 
                      ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" 
                      : "bg-gray-50 dark:bg-slate-900/50 border-transparent hover:border-gray-200 dark:hover:border-slate-700"
                  )}
                  onClick={() => setSelectedRange(selectedRange?.id === range.id ? null : range)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-semibold dark:text-white uppercase tracking-tight">{range.name}</span>
                    <Badge variant={range.purpose === 'DHCP' ? 'blue' : 'warning'} className="text-[10px] px-1.5 py-0">
                      {range.purpose}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <code className="text-[11px] text-gray-500 dark:text-gray-400">
                      {range.start_ip} - {range.end_ip.split('.').pop()}
                    </code>
                    {selectedRange?.id === range.id && (
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                        <ExternalLink className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          {ranges.length > 0 && (
            <div className="pt-2 border-t border-gray-100 dark:border-slate-700">
              <button
                onClick={() => setSelectedRange(selectedRange === 'no-pool' ? null : 'no-pool')}
                className={clsx(
                  "w-full text-left p-3 rounded-lg border transition-all text-sm font-medium",
                  selectedRange === 'no-pool'
                    ? "bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-500 text-slate-900 dark:text-white"
                    : "bg-gray-50 dark:bg-slate-900/50 border-transparent hover:border-gray-200 dark:hover:border-slate-700 text-gray-500 dark:text-gray-400"
                )}
              >
                <div className="flex items-center justify-between">
                  <span>Exclude all pools</span>
                  {selectedRange === 'no-pool' && <ExternalLink className="h-3.5 w-3.5" />}
                </div>
              </button>
            </div>
          )}
        </div>

        <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden transition-colors duration-200 row-span-2">
          <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center transition-colors duration-200">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-gray-800 dark:text-white">
                {selectedRange === 'no-pool' ? 'IPs Outside of Pools' : selectedRange ? `Pool: ${selectedRange.name}` : 'All IP Assignments'}
                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({filteredIps.length})
                </span>
              </h3>
              {selectedRange && (
                <button 
                  onClick={() => setSelectedRange(null)}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline"
                >
                  Clear Filter
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (selectedRange && selectedRange !== 'no-pool') {
                    handleAllocateFromPool(selectedRange);
                  } else {
                    // Allocate from subnet
                    handleAllocateFromPool({ id: null });
                  }
                }}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
              >
                <Plus className="h-4 w-4" /> 
                {selectedRange && selectedRange !== 'no-pool' ? `Allocate IP in ${selectedRange.name}` : 'Allocate IP'}
              </button>
            </div>
          </div>
          <DataTable 
            columns={columns} 
            data={filteredIps} 
            loading={loading}
          />
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setError(null);
          setAllocPoolId('');
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
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900/30">
            <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
              <RefreshCw size={14} className={isAllocating ? 'animate-spin' : ''} />
              Find Available IP
            </h4>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Subnet</label>
                <select 
                  value={id}
                  disabled
                  className="w-full px-2 py-1.5 text-xs bg-gray-100 dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded text-gray-500 dark:text-gray-400 cursor-not-allowed"
                >
                  <option value={id}>{subnet?.name} ({subnet?.network_address}/{subnet?.prefix_length})</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Pool (Optional)</label>
                <select 
                  value={allocPoolId}
                  onChange={(e) => setAllocPoolId(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded text-gray-900 dark:text-white"
                >
                  <option value="">Whole Subnet</option>
                  {ranges.map(r => (
                    <option key={r.id} value={r.id.toString()}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="button"
              onClick={handleFindNext}
              disabled={isAllocating}
              className="w-full py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isAllocating ? 'Searching...' : 'Find Next Available IP'}
            </button>
          </div>

          <form onSubmit={handleIpSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IP Address</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 uppercase placeholder:normal-case"
                placeholder={`${subnet?.network_address.split('.').slice(0,3).join('.')}.10`}
                value={ipFormData.address}
                onChange={(e) => setIpFormData({...ipFormData, address: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={ipFormData.status}
                  onChange={(e) => setIpFormData({...ipFormData, status: e.target.value})}
                >
                  <option value="ALLOCATED">Allocated</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="DHCP_POOL">DHCP Pool</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign to Device</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={ipFormData.device_id}
                  onChange={(e) => setIpFormData({...ipFormData, device_id: e.target.value})}
                >
                  <option value="">None</option>
                  {devices.map(d => (
                    <option key={d.id} value={d.id}>{d.hostname}</option>
                  ))}
                </select>
              </div>
            </div>
          </form>
        </div>
      </Modal>

      <Modal
        isOpen={isRangeModalOpen}
        onClose={() => {
          setIsRangeModalOpen(false);
          setError(null);
        }}
        title="Create IP Pool (Range)"
        footer={(
          <>
            <button 
              onClick={() => {
                setIsRangeModalOpen(false);
                setError(null);
              }} 
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button 
              onClick={handleRangeSubmit} 
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Pool
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
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pool Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. DHCP Scope 1"
              value={rangeFormData.name}
              onChange={(e) => setRangeFormData({...rangeFormData, name: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start IP</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="192.168.1.100"
                value={rangeFormData.start_ip}
                onChange={(e) => setRangeFormData({...rangeFormData, start_ip: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End IP</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="192.168.1.200"
                value={rangeFormData.end_ip}
                onChange={(e) => setRangeFormData({...rangeFormData, end_ip: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purpose</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
              value={rangeFormData.purpose}
              onChange={(e) => setRangeFormData({...rangeFormData, purpose: e.target.value})}
            >
              <option value="DHCP">DHCP Pool</option>
              <option value="STATIC">Static Reservation Pool</option>
              <option value="RESERVED">Reserved / Infrastructure</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (Optional)</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="2"
              value={rangeFormData.description}
              onChange={(e) => setRangeFormData({...rangeFormData, description: e.target.value})}
            />
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isEditSubnetModalOpen}
        onClose={() => {
          setIsEditSubnetModalOpen(false);
          setError(null);
        }}
        title="Edit Subnet"
        footer={(
          <>
            <button
              onClick={() => {
                setIsEditSubnetModalOpen(false);
                setError(null);
              }}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSubnetSubmit}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Changes
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Friendly Name</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                value={subnetFormData.name}
                onChange={(e) => setSubnetFormData({...subnetFormData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Network Address</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                value={subnetFormData.network_address}
                onChange={(e) => setSubnetFormData({...subnetFormData, network_address: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prefix Length</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                value={subnetFormData.prefix_length}
                onChange={(e) => setSubnetFormData({...subnetFormData, prefix_length: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gateway</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                value={subnetFormData.gateway}
                onChange={(e) => setSubnetFormData({...subnetFormData, gateway: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">VLAN ID</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                value={subnetFormData.vlan_id}
                onChange={(e) => setSubnetFormData({...subnetFormData, vlan_id: e.target.value})}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="3"
                value={subnetFormData.description}
                onChange={(e) => setSubnetFormData({...subnetFormData, description: e.target.value})}
              />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
