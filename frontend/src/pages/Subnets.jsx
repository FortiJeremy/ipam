import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LayoutGrid, Trash2, Edit } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { Badge } from '../components/Badge';

export function Subnets() {
  const navigate = useNavigate();
  const [subnets, setSubnets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubnet, setEditingSubnet] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    network_address: '',
    prefix_length: 24,
    gateway: '',
    description: '',
    vlan_id: ''
  });
  const [error, setError] = useState(null);

  const resetForm = () => {
    setFormData({ name: '', network_address: '', prefix_length: 24, gateway: '', description: '', vlan_id: '' });
    setEditingSubnet(null);
    setError(null);
    setIsModalOpen(false);
  };

  const fetchSubnets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/subnets/');
      const data = await res.json();
      setSubnets(data);
    } catch (err) {
      console.error('Failed to fetch subnets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubnets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const url = editingSubnet 
        ? `/api/subnets/${editingSubnet.id}` 
        : '/api/subnets/';
      
      const res = await fetch(url, {
        method: editingSubnet ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          vlan_id: formData.vlan_id ? parseInt(formData.vlan_id) : null,
          prefix_length: parseInt(formData.prefix_length)
        }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        resetForm();
        fetchSubnets();
      } else {
        const errorData = await res.json();
        setError(errorData.detail || `Failed to ${editingSubnet ? 'update' : 'create'} subnet`);
      }
    } catch (err) {
      console.error(`Failed to ${editingSubnet ? 'update' : 'create'} subnet:`, err);
      setError('A network error occurred');
    }
  };

  const handleEdit = (subnet, e) => {
    e.stopPropagation();
    setEditingSubnet(subnet);
    setFormData({
      name: subnet.name || '',
      network_address: subnet.network_address || '',
      prefix_length: subnet.prefix_length || 24,
      gateway: subnet.gateway || '',
      description: subnet.description || '',
      vlan_id: subnet.vlan_id || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this subnet?')) return;
    try {
      await fetch(`/api/subnets/${id}`, { method: 'DELETE' });
      fetchSubnets();
    } catch (err) {
      console.error('Failed to delete subnet:', err);
    }
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { 
      header: 'Network', 
      cell: (row) => `${row.network_address}/${row.prefix_length}` 
    },
    {
      header: 'Free IPs',
      cell: (row) => row.stats?.free ?? '-'
    },
    { 
      header: 'VLAN', 
      cell: (row) => row.vlan_id ? <Badge variant="blue">{row.vlan_id}</Badge> : '-' 
    },
    {
      header: 'Gateway',
      cell: (row) => row.gateway || '-'
    },
    {
      header: 'Scan Status',
      cell: (row) => (
        <div className="flex flex-col">
          <Badge variant={
            row.scan_status === 'Scanning' ? 'blue' : 
            row.scan_status === 'Error' ? 'danger' : 'success'
          }>
            {row.scan_status || 'Idle'}
          </Badge>
          {row.last_scan && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
              {new Date(row.last_scan.endsWith('Z') || row.last_scan.includes('+') ? row.last_scan : `${row.last_scan}Z`).toLocaleString()}
            </span>
          )}
        </div>
      )
    },
    { header: 'Description', accessor: 'description' },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex gap-2">
          <button 
            onClick={(e) => handleEdit(row, e)}
            className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
            title="Edit Subnet"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button 
            onClick={(e) => handleDelete(row.id, e)}
            className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
            title="Delete Subnet"
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subnets</h1>
          <p className="text-gray-500 dark:text-gray-400">Manage your network address space</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add Subnet
        </button>
      </div>

      <DataTable 
        columns={columns} 
        data={subnets} 
        loading={loading}
        onRowClick={(row) => navigate(`/subnets/${row.id}`)}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={resetForm}
        title={editingSubnet ? 'Edit Subnet' : 'Add New Subnet'}
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
              {editingSubnet ? 'Save Changes' : 'Create Subnet'}
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="e.g. Office LAN"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Network Address</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="10.0.0.0"
                value={formData.network_address}
                onChange={(e) => setFormData({...formData, network_address: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prefix Length (CIDR)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="24"
                value={formData.prefix_length}
                onChange={(e) => setFormData({...formData, prefix_length: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Gateway (Optional)</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="10.0.0.1"
                value={formData.gateway}
                onChange={(e) => setFormData({...formData, gateway: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">VLAN ID (Optional)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                value={formData.vlan_id}
                onChange={(e) => setFormData({...formData, vlan_id: e.target.value})}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              ></textarea>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
