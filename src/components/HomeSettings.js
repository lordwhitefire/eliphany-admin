// src/components/HomeSettings.js
import { useState, useEffect } from 'react';
import { client, urlFor } from '../lib/sanity';
import { useNavigate } from 'react-router-dom';

const HomeSettings = () => {
  const [form, setForm] = useState({
    heroHeadline: '',
    heroSubline: '',
    heroBackgroundImage: null,
    instagramHandle: '',
    instagramUrl: '',
    instagramImages: [],
  });
  const [imagePreviews, setImagePreviews] = useState({
    hero: '',
    ig: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [currentData, setCurrentData] = useState(null); // ← KEEPS EXISTING IMAGES
  const navigate = useNavigate();

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await client.fetch(`*[_type == "homeSettings"][0]`);
        setCurrentData(data); // ← SAVE RAW DATA

        setForm({
          heroHeadline: data?.heroHeadline || '',
          heroSubline: data?.heroSubline || '',
          heroBackgroundImage: null, // ← New file only
          instagramHandle: data?.instagramHandle || '',
          instagramUrl: data?.instagramUrl || '',
          instagramImages: [], // ← New files only
        });

        setImagePreviews({
          hero: data?.heroBackgroundImage ? urlFor(data.heroBackgroundImage).url() : '',
          ig: data?.instagramImages?.map(img => urlFor(img).url()) || [],
        });
      } catch (err) {
        setError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleImageChange = (field, file) => {
    if (!file) return;
    setForm(prev => ({ ...prev, [field]: file }));
    const preview = URL.createObjectURL(file);
    if (field === 'heroBackgroundImage') {
      setImagePreviews(prev => ({ ...prev, hero: preview }));
    }
  };

  const handleIgImageChange = (index, file) => {
    if (!file) return;
    const newImages = [...form.instagramImages];
    newImages[index] = file;
    setForm(prev => ({ ...prev, instagramImages: newImages }));

    const newPreviews = [...imagePreviews.ig];
    newPreviews[index] = URL.createObjectURL(file);
    setImagePreviews(prev => ({ ...prev, ig: newPreviews }));
  };

const handleSave = async () => {
  // PAYMENT CHECK — BLOCKS WRITE IF NO TOKEN
  if (!process.env.SANITY_TOKEN) {
    alert('Payment required: Admin write access is disabled until full payment.');
    return;
  }
  setError('');
  setSaving(true);

  try {
    // Upload HERO if new file
    const heroAsset = form.heroBackgroundImage instanceof File
      ? await client.assets.upload('image', form.heroBackgroundImage)
      : null;

    // Upload IG images if new files
    const igFiles = form.instagramImages.filter(f => f instanceof File);
    const igAssets = igFiles.length > 0
      ? await Promise.all(igFiles.map(f => client.assets.upload('image', f)))
      : [];

    // Build final IG images: keep old, replace only new + ADD _key
    const finalIgImages = (currentData?.instagramImages || []).map((oldImg, i) => {
      const newFile = form.instagramImages[i];
      if (newFile instanceof File) {
        const uploaded = igAssets.shift();
        return uploaded
          ? { _type: 'image', _key: `ig-${i}`, asset: { _ref: uploaded._id } }
          : oldImg;
      }
      return oldImg
        ? { _type: 'image', _key: oldImg._key || `ig-${i}`, asset: { _ref: oldImg.asset._ref } }
        : null;
    }).filter(Boolean);

    // Hero: keep old if no new
    const heroImage = heroAsset
      ? { _type: 'image', asset: { _ref: heroAsset._id } }
      : currentData?.heroBackgroundImage
        ? { _type: 'image', asset: { _ref: currentData.heroBackgroundImage.asset._ref } }
        : undefined;

    const doc = {
      _id: 'homeSettings',
      _type: 'homeSettings',
      heroHeadline: form.heroHeadline,
      heroSubline: form.heroSubline,
      instagramHandle: form.instagramHandle,
      instagramUrl: form.instagramUrl || undefined,
      ...(heroImage && { heroBackgroundImage: heroImage }),
      instagramImages: finalIgImages
    };

    await client.createOrReplace(doc);
    alert('Home settings saved!');

    // Refresh previews
    const updated = await client.fetch(`*[_type == "homeSettings"][0]`);
    setCurrentData(updated);
    setImagePreviews({
      hero: updated.heroBackgroundImage ? urlFor(updated.heroBackgroundImage).url() : '',
      ig: updated.instagramImages?.map(img => urlFor(img).url()) || [],
    });
  } catch (err) {
    setError(err.message || 'Failed to save');
  } finally {
    setSaving(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Home Settings</h1>
              <p className="text-sm text-gray-600 mt-1">Hero, Instagram, and branding</p>
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
          <div className="bg-white rounded-xl p-12 text-center">Loading...</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 space-y-8">
            {/* Hero Headline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hero Headline</label>
              <input
                type="text"
                value={form.heroHeadline}
                onChange={(e) => setForm(prev => ({ ...prev, heroHeadline: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                maxLength={60}
              />
              <p className="text-xs text-gray-500 mt-1">{form.heroHeadline.length}/60</p>
            </div>

            {/* Hero Subline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hero Sub-line</label>
              <textarea
                value={form.heroSubline}
                onChange={(e) => setForm(prev => ({ ...prev, heroSubline: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                maxLength={120}
              />
              <p className="text-xs text-gray-500 mt-1">{form.heroSubline.length}/120</p>
            </div>

            {/* Hero Background Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hero Background Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange('heroBackgroundImage', e.target.files[0])}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
              {imagePreviews.hero && (
                <img src={imagePreviews.hero} alt="Hero" className="mt-3 w-full h-48 object-cover rounded-lg shadow-md" />
              )}
            </div>

            {/* Instagram Handle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Instagram Handle (without @)</label>
              <input
                type="text"
                value={form.instagramHandle}
                onChange={(e) => setForm(prev => ({ ...prev, instagramHandle: e.target.value.replace(/@/g, '') }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="eliphany.ng"
              />
            </div>

            {/* Instagram URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Instagram URL (optional)</label>
              <input
                type="url"
                value={form.instagramUrl}
                onChange={(e) => setForm(prev => ({ ...prev, instagramUrl: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="https://instagram.com/eliphany.ng"
              />
            </div>

            {/* Instagram Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Instagram Images (max 4)</label>
              <div className="grid grid-cols-2 gap-4">
                {[0, 1, 2, 3].map((index) => (
                  <div key={index} className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleIgImageChange(index, e.target.files[0])}
                      className="w-full text-xs file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-pink-50 file:text-pink-700"
                    />
                    {imagePreviews.ig[index] && (
                      <img src={imagePreviews.ig[index]} alt={`IG ${index + 1}`} className="w-full h-32 object-cover rounded-lg shadow-sm" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save All Settings'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeSettings;