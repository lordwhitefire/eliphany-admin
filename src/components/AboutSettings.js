// src/components/AboutSettings.js
import { useState, useEffect } from 'react';
import { client, urlFor } from '../lib/sanity';
import { PortableText } from '@portabletext/react';
import { useNavigate } from 'react-router-dom';

const AboutSettings = () => {
  const [form, setForm] = useState({
    pageTitle: '',
    heroTitle: '',
    introText: [],
    founderImage: null,
    whatsappButtonText: '',
  });
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Portable Text Components
  const portableTextComponents = {
    marks: {
      strong: ({ children }) => <strong className="font-bold">{children}</strong>,
      em: ({ children }) => <em className="italic">{children}</em>,
    },
  };

  // Fetch current about settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await client.fetch(`*[_type == "aboutSettings"][0]`);
        if (data) {
          setForm({
            pageTitle: data.pageTitle || '',
            heroTitle: data.heroTitle || '',
            introText: data.introText || [],
            founderImage: null,
            whatsappButtonText: data.whatsappButtonText || '',
          });
          setImagePreview(data.founderImage ? urlFor(data.founderImage).url() : '');
        }
      } catch (err) {
        setError('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleImageChange = (file) => {
    if (!file) return;
    setForm(prev => ({ ...prev, founderImage: file }));
    setImagePreview(URL.createObjectURL(file));
  };

  const handleParagraphChange = (index, text) => {
    const newBlocks = [...form.introText];
    if (!newBlocks[index]) {
      newBlocks[index] = {
        _type: 'block',
        style: 'normal',
        children: [{ _type: 'span', text: '', marks: [] }]
      };
    }
    newBlocks[index].children[0].text = text;
    setForm(prev => ({ ...prev, introText: newBlocks }));
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
      let imageRef = null;
      if (form.founderImage) {
        const asset = await client.assets.upload('image', form.founderImage);
        imageRef = { _type: 'image', asset: { _ref: asset._id } };
      }

      const doc = {
        _id: 'aboutSettings',  // ← ADD THIS
        _type: 'aboutSettings',
        pageTitle: form.pageTitle,
        heroTitle: form.heroTitle,
        introText: form.introText.filter(block => block.children[0].text.trim()),
        whatsappButtonText: form.whatsappButtonText,
        ...(imageRef && { founderImage: imageRef })
      };

      await client.createOrReplace(doc);
      alert('About settings saved!');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-100">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">About Settings</h1>
              <p className="text-sm text-gray-600 mt-1">Page title, story, founder image</p>
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
          <div className="grid md:grid-cols-2 gap-6">
            {/* Form */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 space-y-6">
              {/* Page Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Page Title</label>
                <input
                  type="text"
                  value={form.pageTitle}
                  onChange={(e) => setForm(prev => ({ ...prev, pageTitle: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  maxLength={60}
                />
                <p className="text-xs text-gray-500 mt-1">{form.pageTitle.length}/60</p>
              </div>

              {/* Hero Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hero Title</label>
                <input
                  type="text"
                  value={form.heroTitle}
                  onChange={(e) => setForm(prev => ({ ...prev, heroTitle: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  maxLength={90}
                />
                <p className="text-xs text-gray-500 mt-1">{form.heroTitle.length}/90</p>
              </div>

              {/* Intro Paragraphs */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Intro Paragraphs (3)</label>
                {[0, 1, 2].map(index => (
                  <textarea
                    key={index}
                    value={form.introText[index]?.children[0]?.text || ''}
                    onChange={(e) => handleParagraphChange(index, e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 mb-3"
                    placeholder={`Paragraph ${index + 1}...`}
                  />
                ))}
              </div>

              {/* Founder Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Founder Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e.target.files[0])}
                  className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700"
                />
                {imagePreview && (
                  <img src={imagePreview} alt="Founder" className="mt-3 w-full h-48 object-cover rounded-lg shadow-md" />
                )}
              </div>

              {/* WhatsApp Button */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Button Text</label>
                <input
                  type="text"
                  value={form.whatsappButtonText}
                  onChange={(e) => setForm(prev => ({ ...prev, whatsappButtonText: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save About Settings'}
              </button>
            </div>

            {/* Live Preview */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Live Preview</h2>
              <div className="space-y-4">
                <h1 className="text-3xl font-bold text-gray-900">{form.heroTitle || 'About Eliphany'}</h1>
                <div className="prose prose-lg max-w-none text-gray-700">
                  <PortableText value={form.introText} components={portableTextComponents} />
                </div>
                {imagePreview && (
                  <img src={imagePreview} alt="Founder" className="w-full rounded-xl shadow-lg" />
                )}
                <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition">
                  {form.whatsappButtonText || 'Chat on WhatsApp'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AboutSettings;