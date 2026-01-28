import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Server, Trash2, Tag, Info, Edit, RefreshCw, Hash } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';

export function Devices() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [ips, setIps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [formData, setFormData] = useState({
    hostname: '',
    manufacturer: '',
    model: '',
    device_type: 'Server',
    tags: '',
    notes: '',
    ip_address: ''
  });
  const [error, setError] = useState(null);
  
  const [subnets, setSubnets] = useState([]);
  const [autoAllocate, setAutoAllocate] = useState(true);
  const [selectedSubnetId, setSelectedSubnetId] = useState('');
  const [selectedPoolId, setSelectedPoolId] = useState('');
  const [isAllocating, setIsAllocating] = useState(false);

  const resetForm = () => {
    setFormData({ 
      hostname: '', 
      manufacturer: '', 
      model: '', 
      device_type: 'Server', 
      tags: '', 
      notes: '',
      ip_address: ''
    });
    setEditingDevice(null);
    setError(null);
    setIsModalOpen(false);
    setAutoAllocate(true);
    setSelectedSubnetId('');
    setSelectedPoolId('');
  };

  const handleAutoAllocate = async () => {
    if (!selectedSubnetId) return;
    setIsAllocating(true);
    setError(null);
    try {
      let url = `/api/subnets/${selectedSubnetId}/next-available`;
      if (selectedPoolId) url += `?pool_id=${selectedPoolId}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setFormData({ ...formData, ip_address: data.address });
      } else {
        const err = await res.json();
        setError(err.detail || 'No IPs available in selected range');
        setAutoAllocate(false);
      }
    } catch (err) {
      setError('Connection error while allocating IP');
    } finally {
      setIsAllocating(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [devRes, ipRes, subRes] = await Promise.all([
        fetch('/api/devices/'),
        fetch('/api/ips/'),
        fetch('/api/subnets/')
      ]);
      const [devData, ipData, subData] = await Promise.all([
        devRes.json(), 
        ipRes.json(),
        subRes.json()
      ]);
      setDevices(devData);
      setIps(ipData);
      setSubnets(subData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const url = editingDevice 
        ? `/api/devices/${editingDevice.id}` 
        : '/api/devices/';

      const res = await fetch(url, {
        method: editingDevice ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsModalOpen(false);
        resetForm();
        fetchData();
      } else {
        const errorData = await res.json();
        setError(errorData.detail || `Failed to ${editingDevice ? 'update' : 'register'} device`);
      }
    } catch (err) {
      console.error(`Failed to ${editingDevice ? 'update' : 'create'} device:`, err);
      setError('A network error occurred');
    }
  };

  const handleEdit = (device, e) => {
    e.stopPropagation();
    setEditingDevice(device);
    setAutoAllocate(false);
    setFormData({
      hostname: device.hostname || '',
      manufacturer: device.manufacturer || '',
      model: device.model || '',
      device_type: device.device_type || 'Server',
      tags: device.tags || '',
      notes: device.notes || '',
      ip_address: device.ip_addresses?.[0]?.address || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this device?')) return;
    try {
      await fetch(`/api/devices/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error('Failed to delete device:', err);
    }
  };

  const columns = [
    { 
      header: 'Hostname', 
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-gray-400" />
          <span className="font-medium text-gray-900 dark:text-white font-semibold">{row.hostname}</span>
        </div>
      )
    },
    { header: 'Type', accessor: 'device_type' },
    { 
      header: 'Primary IP', 
      cell: (row) => row.ip_addresses?.[0]?.address || '-'
    },
    {
      header: 'Subnets',
      cell: (row) => {
        const subnets = [...new Set(row.ip_addresses?.map(ip => ip.subnet?.name).filter(Boolean))];
        return (
          <div className="flex gap-1">
            {subnets.map((name, i) => (
              <Badge key={i} variant="blue" className="text-[10px]">{name}</Badge>
            ))}
            {subnets.length === 0 && '-'}
          </div>
        );
      }
    },
    { header: 'Manufacturer', accessor: 'manufacturer' },
    { header: 'Model', accessor: 'model' },
    { 
      header: 'Tags', 
      cell: (row) => (
        <div className="flex gap-1 flex-wrap">
          {row.tags?.split(',').map((tag, i) => (
            <Badge key={i} variant="default" className="text-[10px] px-1.5">{tag.trim()}</Badge>
          ))}
        </div>
      )
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex gap-2">
          <button 
            onClick={(e) => handleEdit(row, e)}
            className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
            title="Edit Device"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button 
            onClick={(e) => handleDelete(row.id, e)}
            className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
            title="Delete Device"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Devices</h1>
          <p className="text-gray-500 dark:text-gray-400">Inventory of registered infrastructure</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add Device
        </button>
      </div>

      <DataTable 
        columns={columns} 
        data={devices} 
        loading={loading}
        onRowClick={(row) => navigate(`/devices/${row.id}`)}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={resetForm}
        title={editingDevice ? 'Edit Device' : 'Register New Device'}
        footer={(
          <>
            <button
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              {editingDevice ? 'Save Changes' : 'Register Device'}
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. srv-prod-01"
                value={formData.hostname}
                onChange={(e) => setFormData({...formData, hostname: e.target.value})}
              />
            </div>

            {!editingDevice && (
              <div className="col-span-2 space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/20">
                  <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                    <RefreshCw size={14} className={isAllocating ? 'animate-spin' : ''} />
                    Auto-Allocate Primary IP (Optional)
                  </h4>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Subnet</label>
                      <select 
                        value={selectedSubnetId}
                        onChange={(e) => {
                          setSelectedSubnetId(e.target.value);
                          setSelectedPoolId('');
                        }}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="">Choose Subnet...</option>
                        {subnets.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.network_address}/{s.prefix_length})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Pool (Optional)</label>
                      <select 
                        disabled={!selectedSubnetId}
                        value={selectedPoolId}
                        onChange={(e) => setSelectedPoolId(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-gray-900 dark:text-white disabled:opacity-50 focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        <option value="">Whole Subnet</option>
                        {Array.isArray(subnets.find(s => s.id === parseInt(selectedSubnetId))?.ip_ranges) && 
                          subnets.find(s => s.id === parseInt(selectedSubnetId)).ip_ranges.map(r => (
                            <option key={r.id} value={r.id.toString()}>{r.name}</option>
                          ))
                        }
                      </select>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoAllocate}
                    disabled={!selectedSubnetId || isAllocating}
                    className="w-full py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {isAllocating ? 'FINDING AVAILABLE IP...' : 'FIND NEXT AVAILABLE IP'}
                  </button>
                </div>
              </div>
            )}

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {editingDevice ? 'Manage IP (Go to detail page for more)' : 'Primary IP Address'}
              </label>
              <input
                list="available-ips"
                type="text"
                disabled={editingDevice}
                className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:opacity-50"
                placeholder={editingDevice ? 'Go to Device Detail to manage IPs' : 'Enter IP manually or use helper above'}
                value={formData.ip_address}
                onChange={(e) => setFormData({...formData, ip_address: e.target.value})}
              />
              {!editingDevice && (
                <datalist id="available-ips">
                  {ips
                    .filter(ip => !ip.device_id)
                    .map(ip => (
                      <option key={ip.id} value={ip.address}>
                        {ip.address} ({ip.status})
                      </option>
                    ))}
                </datalist>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Device Type</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.device_type}
                onChange={(e) => setFormData({...formData, device_type: e.target.value})}
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Dell, HP, etc."
                value={formData.manufacturer}
                onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Model</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="PowerEdge R740, ProLiant, etc."
                value={formData.model}
                onChange={(e) => setFormData({...formData, model: e.target.value})}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (Comma separated)</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="prod, web, linux"
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              ></textarea>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
