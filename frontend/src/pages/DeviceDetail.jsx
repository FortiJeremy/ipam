import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Server, Tag, Info, Hash, Activity, Plus, Trash2, Edit } from 'lucide-react';
import { Badge } from '../components/Badge';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';

export function DeviceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newIp, setNewIp] = useState('');
  const [newInterface, setNewInterface] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  
  const [availableSubnets, setAvailableSubnets] = useState([]);
  const [allocSubnetId, setAllocSubnetId] = useState('');
  const [allocPoolId, setAllocPoolId] = useState('');
  const [isAllocating, setIsAllocating] = useState(false);

  const [isEditIpModalOpen, setIsEditIpModalOpen] = useState(false);
  const [editingIp, setEditingIp] = useState(null);
  const [editIpFormData, setEditIpFormData] = useState({
    interface_name: '',
    status: 'ALLOCATED'
  });

  const [deviceFormData, setDeviceFormData] = useState({
    hostname: '',
    manufacturer: '',
    model: '',
    device_type: '',
    tags: '',
    notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/devices/${id}`);
      if (!res.ok) throw new Error('Device not found');
      const data = await res.json();
      setDevice(data);
    } catch (err) {
      console.error('Failed to fetch device details:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSubnets = async () => {
    try {
      const res = await fetch('/api/subnets/');
      if (res.ok) {
        const data = await res.json();
        setAvailableSubnets(data);
      }
    } catch (err) {
      console.error('Failed to fetch subnets:', err);
    }
  };

  useEffect(() => {
    if (isModalOpen) {
      fetchAvailableSubnets();
    }
  }, [isModalOpen]);

  const handleFindNext = async () => {
    if (!allocSubnetId) return;
    setIsAllocating(true);
    setError(null);
    try {
      let url = `/api/subnets/${allocSubnetId}/next-available`;
      if (allocPoolId) url += `?pool_id=${allocPoolId}`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setNewIp(data.address);
      } else {
        const err = await res.json();
        setError(err.detail || 'No available IP found');
      }
    } catch (err) {
      setError('Connection error while finding IP');
    } finally {
      setIsAllocating(false);
    }
  };

  const handleAddIp = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/devices/${id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ip_address: newIp,
          interface_name: newInterface
        }),
      });
      if (res.ok) {
        setNewIp('');
        setNewInterface('');
        setIsModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        setError(err.detail || 'Failed to assign IP');
      }
    } catch (err) {
      setError('A network error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnassignIp = async (ipId) => {
    if (!confirm('Are you sure you want to remove this IP assignment?')) return;
    try {
      const res = await fetch(`/api/ips/${ipId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: null, interface_name: null }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Failed to unassign IP:', err);
    }
  };

  const handleEditIp = (ip) => {
    setEditingIp(ip);
    setEditIpFormData({
      interface_name: ip.interface_name || '',
      status: ip.status || 'ALLOCATED'
    });
    setIsEditIpModalOpen(true);
  };

  const handleUpdateIp = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/ips/${editingIp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editIpFormData),
      });
      if (res.ok) {
        setIsEditIpModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        setError(err.detail || 'Failed to update IP');
      }
    } catch (err) {
       setError('A network error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = () => {
    setDeviceFormData({
      hostname: device.hostname || '',
      manufacturer: device.manufacturer || '',
      model: device.model || '',
      device_type: device.device_type || '',
      tags: device.tags || '',
      notes: device.notes || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/devices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deviceFormData),
      });
      if (res.ok) {
        setIsEditModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        setError(err.detail || 'Failed to update device');
      }
    } catch (err) {
      setError('A network error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const ipColumns = [
    { 
      header: 'IP Address', 
      cell: (row) => <span className="font-mono font-medium">{row.address}</span> 
    },
    { 
      header: 'Status', 
      cell: (row) => {
        const variants = {
          'ALLOCATED': 'success',
          'RESERVED': 'warning',
          'DISCOVERED': 'blue',
          'AVAILABLE': 'default'
        };
        return <Badge variant={variants[row.status]}>{row.status}</Badge>
      }
    },
    { header: 'Interface', accessor: 'interface_name' },
    { 
      header: 'Health', 
      cell: (row) => (
        <Badge variant={row.healthcheck_status === 'Online' ? 'success' : 'danger'}>
          {row.healthcheck_status || 'Unknown'}
        </Badge>
      )
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
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex gap-2">
          <button 
            onClick={() => handleEditIp(row)}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="Edit Assignment"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button 
            onClick={() => handleUnassignIp(row.id)}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="Unassign IP"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  if (loading && !device) {
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
          onClick={() => navigate('/devices')}
          className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg border border-transparent hover:border-gray-200 dark:hover:border-slate-700 transition-all"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Server className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            {device?.hostname}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">{device?.device_type} • {device?.manufacturer} {device?.model}</p>
        </div>
        <button 
          onClick={handleEdit}
          className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          title="Edit Device"
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
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" /> Add IP
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Info className="h-4 w-4" /> Device Details
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Manufacturer</span>
                <span className="text-sm font-medium dark:text-slate-200">{device?.manufacturer || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Model</span>
                <span className="text-sm font-medium dark:text-slate-200">{device?.model || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Type</span>
                <span className="text-sm font-medium dark:text-slate-200">{device?.device_type || '-'}</span>
              </div>
            </div>
            {device?.tags && (
              <div className="pt-4 border-t border-gray-100 dark:border-slate-700 transition-colors duration-200">
                <span className="text-xs font-semibold text-gray-400 uppercase block mb-2">Tags</span>
                <div className="flex gap-1 flex-wrap">
                  {device.tags.split(',').map((tag, i) => (
                    <Badge key={i} variant="default">{tag.trim()}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm transition-colors duration-200">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4" /> Notes
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {device?.notes || 'No notes available for this device.'}
            </p>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden transition-colors duration-200">
            <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center transition-colors duration-200">
              <h3 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                <Hash className="h-5 w-5 text-blue-500" />
                IP Address Assignments
              </h3>
              <Badge variant="blue">{device?.ip_addresses?.length || 0} Assigned</Badge>
            </div>
            <DataTable 
              columns={ipColumns} 
              data={device?.ip_addresses || []} 
              loading={loading}
            />
          </div>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setError(null);
          setNewIp('');
          setAllocSubnetId('');
          setAllocPoolId('');
        }}
        title="Add IP Assignment"
        footer={(
          <>
            <button
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleAddIp}
              disabled={submitting || !newIp}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? 'Assigning...' : 'Assign IP'}
            </button>
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
                  value={allocSubnetId}
                  onChange={(e) => {
                    setAllocSubnetId(e.target.value);
                    setAllocPoolId('');
                  }}
                  className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded text-gray-900 dark:text-white"
                >
                  <option value="">Select Subnet...</option>
                  {availableSubnets.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.network_address}/{s.prefix_length})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Pool (Optional)</label>
                <select 
                  value={allocPoolId}
                  disabled={!allocSubnetId}
                  onChange={(e) => setAllocPoolId(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded text-gray-900 dark:text-white disabled:opacity-50"
                >
                  <option value="">Whole Subnet</option>
                  {availableSubnets.find(s => s.id === parseInt(allocSubnetId))?.ip_ranges?.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={handleFindNext}
              disabled={!allocSubnetId || isAllocating}
              className="w-full py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isAllocating ? 'Searching...' : 'Find Next Available IP'}
            </button>
          </div>

          <form onSubmit={handleAddIp} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  IP Address
                </label>
                <input
                  type="text"
                  required
                  value={newIp}
                  onChange={(e) => setNewIp(e.target.value)}
                  placeholder="e.g. 192.168.1.50"
                  className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Interface (Optional)
                </label>
                <input
                  type="text"
                  value={newInterface}
                  onChange={(e) => setNewInterface(e.target.value)}
                  placeholder="e.g. eth0"
                  className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              The IP must belong to an existing subnet. If it doesn't exist yet, it will be created.
            </p>
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-900/30">
                {error}
              </div>
            )}
          </form>
        </div>
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setError(null);
        }}
        title="Edit Device"
        footer={(
          <>
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                setError(null);
              }}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Save Changes'}
            </button>
          </>
        )}
      >
        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hostname</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                value={deviceFormData.hostname}
                onChange={(e) => setDeviceFormData({...deviceFormData, hostname: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Manufacturer</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                value={deviceFormData.manufacturer}
                onChange={(e) => setDeviceFormData({...deviceFormData, manufacturer: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Model</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                value={deviceFormData.model}
                onChange={(e) => setDeviceFormData({...deviceFormData, model: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Device Type</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Switch, Server"
                value={deviceFormData.device_type}
                onChange={(e) => setDeviceFormData({...deviceFormData, device_type: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="comma-separated"
                value={deviceFormData.tags}
                onChange={(e) => setDeviceFormData({...deviceFormData, tags: e.target.value})}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="3"
                value={deviceFormData.notes}
                onChange={(e) => setDeviceFormData({...deviceFormData, notes: e.target.value})}
              />
            </div>
          </div>
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-900/30">
              {error}
            </div>
          )}
        </form>
      </Modal>

      <Modal
        isOpen={isEditIpModalOpen}
        onClose={() => {
          setIsEditIpModalOpen(false);
          setError(null);
        }}
        title={`Edit Assignment: ${editingIp?.address}`}
        footer={(
          <>
            <button
              onClick={() => setIsEditIpModalOpen(false)}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateIp}
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Save Changes'}
            </button>
          </>
        )}
      >
        <form onSubmit={handleUpdateIp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Interface Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. eth0, Management, Gi0/1"
              value={editIpFormData.interface_name}
              onChange={(e) => setEditIpFormData({...editIpFormData, interface_name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500"
              value={editIpFormData.status}
              onChange={(e) => setEditIpFormData({...editIpFormData, status: e.target.value})}
            >
              <option value="ALLOCATED">Allocated</option>
              <option value="RESERVED">Reserved</option>
              <option value="DISCOVERED">Discovered</option>
            </select>
          </div>
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-900/30">
              {error}
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
