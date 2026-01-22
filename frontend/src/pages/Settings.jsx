import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Trash2, ShieldAlert, Cpu, Network, Clock } from 'lucide-react';

export function Settings() {
  const [settings, setSettings] = useState({
    discovery_interval: 15,
    arp_enabled: true,
    icmp_enabled: true,
    dns_enabled: false,
    dns_server: '',
    dns_search_domains: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [purgeDays, setPurgeDays] = useState(30);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully. The Brain will pick up changes on next loop.' });
      } else {
        setMessage({ type: 'error', text: 'Failed to save settings.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error connecting to server.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePurge = async () => {
    if (!window.confirm(`Are you sure you want to delete all DISCOVERED IPs not seen in the last ${purgeDays} days? This cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/settings/purge?days=${purgeDays}`, {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message);
      }
    } catch (error) {
      console.error('Error purging IPs:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Settings</h1>
          <p className="text-slate-500 mt-2">Manage scanner configuration and system maintenance</p>
        </div>
      </div>

      <div className="max-w-4xl">
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <ShieldAlert size={20} />
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Scanner Settings */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                <Cpu size={20} className="text-slate-600" />
                <h2 className="font-semibold text-slate-800">Scanner Configuration "The Brain"</h2>
              </div>
              <form onSubmit={handleSave} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Clock size={16} />
                    Discovery Interval (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    value={settings.discovery_interval}
                    onChange={(e) => setSettings({ ...settings, discovery_interval: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-slate-500">How often the background worker scans all subnets. Lower values increase network traffic.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                      <Network size={20} className="text-blue-500" />
                      <div>
                        <div className="font-medium text-slate-800">ARP Scanning</div>
                        <div className="text-xs text-slate-500">Fast, local segment discovery via MAC broadcast.</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={settings.arp_enabled}
                        onChange={(e) => setSettings({ ...settings, arp_enabled: e.target.checked })}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                      <RefreshCw size={20} className="text-indigo-500" />
                      <div>
                        <div className="font-medium text-slate-800">ICMP Discovery (Ping)</div>
                        <div className="text-xs text-slate-500">Detects hosts across routers/gateways. Slower than ARP.</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={settings.icmp_enabled}
                        onChange={(e) => setSettings({ ...settings, icmp_enabled: e.target.checked })}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3">
                      <ShieldAlert size={20} className="text-amber-500" />
                      <div>
                        <div className="font-medium text-slate-800">DNS Resolution</div>
                        <div className="text-xs text-slate-500">Attempt reverse DNS lookup for discovered IPs.</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={settings.dns_enabled}
                        onChange={(e) => setSettings({ ...settings, dns_enabled: e.target.checked })}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {settings.dns_enabled && (
                    <div className="space-y-4 p-4 bg-amber-50 rounded-lg border border-amber-100">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Preferred DNS Server</label>
                        <input
                          type="text"
                          placeholder="8.8.8.8"
                          value={settings.dns_server}
                          onChange={(e) => setSettings({ ...settings, dns_server: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Search Domains</label>
                        <input
                          type="text"
                          placeholder="lan, local, example.com"
                          value={settings.dns_search_domains}
                          onChange={(e) => setSettings({ ...settings, dns_search_domains: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                    Save Configuration
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Maintenance / Danger Zone */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-red-50 flex items-center gap-2">
                <Trash2 size={20} className="text-red-600" />
                <h2 className="font-semibold text-slate-800">Maintenance</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Purge stale discovered IPs
                  </label>
                  <div className="flex gap-2">
                    <select 
                      value={purgeDays}
                      onChange={(e) => setPurgeDays(parseInt(e.target.value))}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    >
                      <option value="7">Older than 7 days</option>
                      <option value="30">Older than 30 days</option>
                      <option value="90">Older than 90 days</option>
                    </select>
                    <button 
                      onClick={handlePurge}
                      className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                    >
                      Purge
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Removes ephemeral "Discovered" IPs that haven't been seen recently. 
                    Assigned IPs are never purged.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
              <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <ShieldAlert size={18} />
                Network Permissions
              </h3>
              <p className="text-sm text-blue-700 leading-relaxed">
                "The Brain" requires <strong>NET_ADMIN</strong> privileges to perform ARP broadcasts and raw socket ICMP scans. 
                Ensure the container or process has the correct capabilities.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
