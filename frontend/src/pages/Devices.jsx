import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Server, Trash2, Tag, Info, Edit } from 'lucide-react';
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
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [devRes, ipRes] = await Promise.all([
        fetch('/api/devices/'),
        fetch('/api/ips/')
      ]);
      const [devData, ipData] = await Promise.all([devRes.json(), ipRes.json()]);
      setDevices(devData);
      setIps(ipData);
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
          <span className="font-medium text-gray-900">{row.hostname}</span>
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
            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Edit Device"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button 
            onClick={(e) => handleDelete(row.id, e)}
            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
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
          <h1 className="text-2xl font-bold text-gray-900">Devices</h1>
          <p className="text-gray-500">Inventory of registered infrastructure</p>
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
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
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
            <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Hostname</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. srv-prod-01"
                value={formData.hostname}
                onChange={(e) => setFormData({...formData, hostname: e.target.value})}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary IP Address</label>
              <input
                list="available-ips"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                placeholder="Select or enter IP (e.g. 192.168.1.10)"
                value={formData.ip_address}
                onChange={(e) => setFormData({...formData, ip_address: e.target.value})}
              />
              <datalist id="available-ips">
                {ips
                  .filter(ip => !ip.device_id || (editingDevice && ip.device_id === editingDevice.id))
                  .map(ip => (
                    <option key={ip.id} value={ip.address}>
                      {ip.address} ({ip.status})
                    </option>
                  ))}
              </datalist>
              <p className="text-[10px] text-gray-500 mt-1 italic">
                Linking an IP will automatically assign this device to that IP's subnet.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Device Type</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Dell, HP, etc."
                value={formData.manufacturer}
                onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="PowerEdge R740, ProLiant, etc."
                value={formData.model}
                onChange={(e) => setFormData({...formData, model: e.target.value})}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags (Comma separated)</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="prod, web, linux"
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
