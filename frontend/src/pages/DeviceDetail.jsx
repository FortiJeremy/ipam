import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Server, Tag, Info, Hash, Activity } from 'lucide-react';
import { Badge } from '../components/Badge';
import { DataTable } from '../components/DataTable';

export function DeviceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);

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
          className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition-all"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Server className="h-6 w-6 text-blue-600" />
            {device?.hostname}
          </h1>
          <p className="text-gray-500">{device?.device_type} • {device?.manufacturer} {device?.model}</p>
        </div>
        <div className="flex-1"></div>
        <button 
          onClick={fetchData}
          className="flex items-center gap-2 text-gray-600 px-4 py-2 hover:bg-white rounded-lg transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Info className="h-4 w-4" /> Device Details
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Manufacturer</span>
                <span className="text-sm font-medium">{device?.manufacturer || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Model</span>
                <span className="text-sm font-medium">{device?.model || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Type</span>
                <span className="text-sm font-medium">{device?.device_type || '-'}</span>
              </div>
            </div>
            {device?.tags && (
              <div className="pt-4 border-t border-gray-100">
                <span className="text-xs font-semibold text-gray-400 uppercase block mb-2">Tags</span>
                <div className="flex gap-1 flex-wrap">
                  {device.tags.split(',').map((tag, i) => (
                    <Badge key={i} variant="default">{tag.trim()}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Activity className="h-4 w-4" /> Notes
            </h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {device?.notes || 'No notes available for this device.'}
            </p>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
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
    </div>
  );
}
