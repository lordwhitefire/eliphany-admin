// src/components/ProductForm.js
import { useState, useEffect } from 'react';
import { useProducts } from '../context/ProductsContext';
import { client } from '../lib/sanity';

const ProductForm = ({ product, onClose }) => {
  const { addProduct, updateProduct } = useProducts();
  const isEdit = !!product;

  const [form, setForm] = useState({
    name: '',
    shortDescription: '',
    description: '',
    category: '',
    tagsInput: '', // ← text input
    tags: [],
    mainImage: null,
  });

  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit && product) {
      setForm({
        name: product.name || '',
        shortDescription: product.shortDescription || '',
        description: product.description || '',
        category: product.category || '',
        tagsInput: (product.tags || []).join(', '),
        tags: product.tags || [],
        mainImage: null,
      });
      setImagePreview(product.imageUrl || '');
    }
  }, [product, isEdit]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image must be under 2MB');
        return;
      }
      setForm(prev => ({ ...prev, mainImage: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleTagsInput = (value) => {
    const cleaned = value.replace(/,\s+/g, ',').replace(/\s+,/g, ',');
    setForm(prev => ({ ...prev, tagsInput: cleaned }));

    const tagsArray = cleaned
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    setForm(prev => ({ ...prev, tags: tagsArray }));
  };

  const handleSubmit = async (e) => {
    // PAYMENT CHECK — BLOCKS WRITE IF NO TOKEN
  if (!process.env.SANITY_TOKEN) {
    alert('Payment required: Admin write access is disabled until full payment.');
    return;
  }
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let imageRef = null;
      if (form.mainImage) {
        const asset = await client.assets.upload('image', form.mainImage, {
          filename: form.name || 'product-image'
        });
        imageRef = { _type: 'image', asset: { _ref: asset._id } };
      }

      const payload = {
        name: form.name.trim(),
        shortDescription: form.shortDescription.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        tags: form.tags,
        ...(imageRef && { mainImage: imageRef })
      };

      if (isEdit) {
        await updateProduct(product._id, payload);
      } else {
        await addProduct(payload);
      }

      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {isEdit ? 'Edit Product' : 'Add New Product'}
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            placeholder="e.g. Keto Burn Max"
          />
        </div>

        {/* Short Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Short Description</label>
          <textarea
            value={form.shortDescription}
            onChange={(e) => setForm(prev => ({ ...prev, shortDescription: e.target.value }))}
            required
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            placeholder="One-liner for product cards"
          />
        </div>

        {/* Full Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
            required
            rows={5}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            placeholder="Detailed benefits, usage, ingredients..."
          />
        </div>

        {/* Category - FREE TEXT */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <input
            type="text"
            value={form.category}
            onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            placeholder="e.g. Menopause Relief, Detox, Hair Growth"
          />
          <p className="text-xs text-gray-500 mt-1">Type anything. No limits.</p>
        </div>

        {/* Tags - COMMA SEPARATED */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
          <input
            type="text"
            value={form.tagsInput}
            onChange={(e) => handleTagsInput(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            placeholder="fat burner, keto, women health, 30-day supply"
          />
          <p className="text-xs text-gray-500 mt-1">
            Separate with commas. Current: <strong>{form.tags.join(', ') || 'none'}</strong>
          </p>
        </div>

        {/* Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
          />
          {imagePreview && (
            <div className="mt-3">
              <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg shadow-md" />
            </div>
          )}
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50"
          >
            {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;