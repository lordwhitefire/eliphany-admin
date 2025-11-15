// src/components/WhatsappButtonsPanel.js
import { useState, useEffect } from 'react';
import { client } from '../lib/sanity';
import { useNavigate } from 'react-router-dom';

const WhatsappButtonsPanel = () => {
  const [buttons, setButtons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const buttonConfigs = [
    { id: 'homeWpButton', label: 'Hero CTA (Home)' },
    { id: 'wpButton', label: 'Product Card CTA' },
    { id: 'footerChatButton', label: 'Footer Link' },
    { id: 'footerWhatsappUsButton', label: 'Footer CTA' },
    { id: 'floatingWpButton', label: 'Floating Button' },
    { id: 'contactWpButton', label: 'Contact Page CTA' },
  ];

  // Fetch all buttons
  useEffect(() => {
    const fetchButtons = async () => {
      try {
        const ids = buttonConfigs.map(b => b.id);
        const query = `*[_type == "whatsappButton" && _id in $ids] {
          _id, text, phoneNumber, preMessage, isActive
        }`;
        const data = await client.fetch(query, { ids });
        const map = {};
        buttonConfigs.forEach(cfg => {
          const found = data.find(d => d._id === cfg.id) || {
            _id: cfg.id,
            text: '',
            phoneNumber: '+2348012345678',
            preMessage: '',
            isActive: true,
          };
          map[cfg.id] = found;
        });
        setButtons(Object.values(map));
      } catch (err) {
        setError('Failed to load buttons');
      } finally {
        setLoading(false);
      }
    };
    fetchButtons();
  }, []);

  const handleChange = (id, field, value) => {
    setButtons(prev =>
      prev.map(b => (b._id === id ? { ...b, [field]: value } : b))
    );
  };

  const handleSave = async (id) => {

    // PAYMENT CHECK — BLOCKS WRITE IF NO TOKEN
  if (!process.env.SANITY_TOKEN) {
    alert('Payment required: Admin write access is disabled until full payment.');
    return;
  }
    setSaving(prev => ({ ...prev, [id]: true }));
    setError('');
    try {
      const btn = buttons.find(b => b._id === id);
      const doc = {
        _id: id,
        _type: 'whatsappButton',
        text: btn.text,
        phoneNumber: btn.phoneNumber,
        preMessage: btn.preMessage || '',
        isActive: btn.isActive,
      };
      await client.createOrReplace(doc);
      alert(`Button "${btn.text || id}" saved!`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">WhatsApp Buttons</h1>
              <p className="text-sm text-gray-600 mt-1">Manage all 6 CTA buttons site-wide</p>
            </div>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              ← Dashboard
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl p-12 text-center">Loading buttons...</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {buttonConfigs.map(cfg => {
              const btn = buttons.find(b => b._id === cfg.id);
              return (
                <div key={cfg.id} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 space-y-4">
                  <h3 className="font-semibold text-gray-900">{cfg.label}</h3>

                  {/* Text */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Button Text</label>
                    <input
                      type="text"
                      value={btn.text}
                      onChange={(e) => handleChange(cfg.id, 'text', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g. Chat on WhatsApp"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={btn.phoneNumber}
                      onChange={(e) => handleChange(cfg.id, 'phoneNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                      placeholder="+2348012345678"
                    />
                  </div>

                  {/* Pre-message */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Pre-filled Message</label>
                    <textarea
                      value={btn.preMessage}
                      onChange={(e) => handleChange(cfg.id, 'preMessage', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                      placeholder="Hi! I'd like to order..."
                    />
                  </div>

                  {/* Active Toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700">Show Button?</span>
                    <button
                      onClick={() => handleChange(cfg.id, 'isActive', !btn.isActive)}
                      className={`w-11 h-6 rounded-full p-1 transition ${
                        btn.isActive ? 'bg-emerald-600' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full shadow-md transform transition ${
                          btn.isActive ? 'translate-x-5' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {/* Live Preview */}
                  <div className="border-t pt-3">
                    <a
                      href={`https://wa.me/${btn.phoneNumber}?text=${encodeURIComponent(btn.preMessage)}`}
                      target="_blank"
                      rel="noopener"
                      className="block w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-center py-2 rounded-lg text-sm font-medium hover:from-emerald-600 hover:to-emerald-700 transition"
                    >
                      {btn.text || 'Preview'}
                    </a>
                  </div>

                  {error && cfg.id === buttons.find(b => b._id === cfg.id)?._id && (
                    <p className="text-xs text-red-600">{error}</p>
                  )}

                  <button
                    onClick={() => handleSave(cfg.id)}
                    disabled={saving[cfg.id]}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50"
                  >
                    {saving[cfg.id] ? 'Saving...' : 'Save'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsappButtonsPanel;