import React, { useState, useEffect } from 'react';
import { MediaAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { IconVideo, IconFileText, IconCopy, IconTrash, IconFolder } from '../common/Icons';

export default function MediaLibrary() {
  const { showToast } = useToast();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [altText, setAltText] = useState('');
  const [uploadType, setUploadType] = useState('image');
  const [uploading, setUploading] = useState(false);

  const loadMedia = async () => {
    setLoading(true);
    try {
      const res = await MediaAPI.adminGetAssets({ type: filterType, search: searchTerm });
      if (res.success && res.assets) {
        setAssets(res.assets);
      }
    } catch (e) {
      console.error('Error loading media assets:', e);
      showToast('Error fetching media assets.', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, [filterType, searchTerm]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      showToast('Please select a file to upload.', true);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('alt_text', altText);
      formData.append('asset_type', uploadType);

      await MediaAPI.adminUpload(formData);
      showToast('Media asset uploaded successfully!');
      setUploadFile(null);
      setAltText('');
      await loadMedia();
    } catch (err) {
      showToast(err.message || 'Error uploading asset.', true);
    } finally {
      setUploading(false);
    }
  };

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url);
    showToast(`Copied URL: ${url}`);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete media asset "${name}"?`)) return;
    try {
      const res = await MediaAPI.adminDelete(id);
      if (res.success) {
        showToast('Asset deleted successfully.');
        await loadMedia();
      }
    } catch (err) {
      showToast(err.message || 'Cannot delete asset: It is currently linked or in use.', true);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: '0 0 0.25rem 0', color: 'var(--admin-navy)' }}>Media Library &amp; Assets</h2>
          <p style={{ margin: 0, color: 'var(--admin-gray-500)', fontSize: '0.875rem' }}>
            Upload, preview, and manage images, PDFs, and videos used across the Oxybott website.
          </p>
        </div>
      </div>

      {/* Upload Box */}
      <div className="data-card" style={{ background: '#fff', borderRadius: '8px', border: '1px solid var(--admin-gray-200)', padding: '1.25rem' }}>
        <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--admin-navy)' }}>Upload New Asset</h4>
        <form onSubmit={handleUpload} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr)) 140px', gap: '1rem', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Select File</label>
            <input
              type="file"
              className="form-input"
              onChange={e => setUploadFile(e.target.files[0] || null)}
            />
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Asset Type</label>
            <select
              className="form-input"
              value={uploadType}
              onChange={e => setUploadType(e.target.value)}
            >
              <option value="image">Image (.webp, .png, .jpg)</option>
              <option value="document">Document (.pdf)</option>
              <option value="video">Video (.mp4, .webm)</option>
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontSize: '0.75rem' }}>Alt Text / Title</label>
            <input
              type="text"
              className="form-input"
              placeholder="Descriptive label..."
              value={altText}
              onChange={e => setAltText(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ height: '38px' }} disabled={uploading}>
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </form>
      </div>

      {/* Filters and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['all', 'image', 'document', 'video'].map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setFilterType(t)}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '6px',
                border: filterType === t ? '1px solid var(--admin-primary)' : '1px solid var(--admin-gray-200)',
                background: filterType === t ? 'var(--admin-primary)' : '#fff',
                color: filterType === t ? '#fff' : 'var(--admin-gray-700)',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        <input
          type="text"
          className="form-input"
          placeholder="Search media by filename..."
          style={{ width: '260px', padding: '0.4rem 0.75rem' }}
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Media Grid */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--admin-gray-500)' }}>Loading assets...</div>
      ) : assets.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {assets.map(asset => {
            const isImg = asset.asset_type === 'image' || /\.(webp|png|jpg|jpeg|gif)$/i.test(asset.file_path);
            const isVid = asset.asset_type === 'video' || /\.(mp4|webm|mov)$/i.test(asset.file_path);

            return (
              <div
                key={asset.id}
                style={{
                  background: '#fff',
                  border: '1px solid var(--admin-gray-200)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ height: '140px', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
                  {isImg ? (
                    <img
                      src={asset.file_path}
                      alt={asset.alt_text}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      onError={(e) => { e.target.src = '/assets/images/oxybott_logo.webp'; }}
                    />
                  ) : isVid ? (
                    <div style={{ color: '#94a3b8' }}><IconVideo size={36} /></div>
                  ) : (
                    <div style={{ color: '#94a3b8' }}><IconFileText size={36} /></div>
                  )}
                  <span className="badge badge-purple" style={{ position: 'absolute', top: '6px', right: '6px', fontSize: '0.65rem' }}>
                    {asset.asset_type}
                  </span>
                </div>

                <div style={{ padding: '0.75rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--admin-navy)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={asset.original_name}>
                      {asset.original_name || asset.file_name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--admin-gray-500)', marginTop: '2px' }}>
                      {asset.file_size ? `${(asset.file_size / 1024).toFixed(0)} KB` : ''}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.75rem' }}>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ flex: 1, padding: '2px 4px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                      onClick={() => handleCopyUrl(asset.file_path)}
                    >
                      <IconCopy size={12} />
                      <span>Copy URL</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      style={{ padding: '2px 6px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={() => handleDelete(asset.id, asset.file_name)}
                      aria-label="Delete asset"
                    >
                      <IconTrash size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid var(--admin-gray-200)', padding: '3rem', textAlign: 'center', color: 'var(--admin-gray-500)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem', color: '#94a3b8' }}>
            <IconFolder size={40} />
          </div>
          <p style={{ margin: 0 }}>No media assets found in this filter.</p>
        </div>
      )}
    </div>
  );
}

