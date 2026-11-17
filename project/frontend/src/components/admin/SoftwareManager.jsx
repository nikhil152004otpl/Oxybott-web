import React, { useState, useEffect } from 'react';
import { SoftwareAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { IconSmartphone, IconTerminal, IconCpu, IconLaptop, IconDownload, IconExternalLink, IconX } from '../common/Icons';

export default function SoftwareManager() {
  const { showToast } = useToast();
  const [softwareList, setSoftwareList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Software Modal / Form
  const [editingSoftware, setEditingSoftware] = useState(null);
  const [showAddSoftware, setShowAddSoftware] = useState(false);
  const [softwareForm, setSoftwareForm] = useState({
    name: '',
    slug: '',
    icon: 'Code',
    short_desc: '',
    description: '',
    supported_os: 'Windows 10/11, macOS, Linux',
    primary_btn_text: 'Download',
    primary_btn_action: '',
    secondary_btn_text: '',
    secondary_btn_action: '',
    is_published: true
  });

  // Release Modal / Form
  const [targetSoftware, setTargetSoftware] = useState(null);
  const [showAddRelease, setShowAddRelease] = useState(false);
  const [releaseForm, setReleaseForm] = useState({
    version: '1.0.0',
    platform: 'windows',
    architecture: 'x64',
    release_notes: '',
    external_url: '',
    is_latest: true
  });
  const [releaseFile, setReleaseFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const loadSoftware = async () => {
    setLoading(true);
    try {
      const res = await SoftwareAPI.adminGetAll();
      if (res.success && res.software) {
        setSoftwareList(res.software);
      }
    } catch (err) {
      console.error('Error fetching software catalog:', err);
      showToast('Error loading software items.', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSoftware();
  }, []);

  // Save Software Item
  const handleSaveSoftware = async (e) => {
    e.preventDefault();
    if (!softwareForm.name) {
      showToast('Software name is required.', true);
      return;
    }

    const osArray = softwareForm.supported_os
      ? softwareForm.supported_os.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    try {
      if (editingSoftware) {
        await SoftwareAPI.adminUpdate(editingSoftware.id, {
          ...softwareForm,
          supported_os: osArray
        });
        showToast(`Software "${softwareForm.name}" updated successfully.`);
      } else {
        await SoftwareAPI.adminCreate({
          ...softwareForm,
          supported_os: osArray
        });
        showToast(`Software product "${softwareForm.name}" created.`);
      }

      setEditingSoftware(null);
      setShowAddSoftware(false);
      await loadSoftware();
    } catch (err) {
      showToast(err.message || 'Error saving software product.', true);
    }
  };

  // Delete Software Item
  const handleDeleteSoftware = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete software "${name}" and all its releases?`)) return;
    try {
      await SoftwareAPI.adminDelete(id);
      showToast('Software product deleted.');
      await loadSoftware();
    } catch (err) {
      showToast(err.message || 'Error deleting software.', true);
    }
  };

  // Upload/Add Release
  const handleSaveRelease = async (e) => {
    e.preventDefault();
    if (!targetSoftware) return;

    if (!releaseFile && !releaseForm.external_url) {
      showToast('Please provide an installer file OR external download URL.', true);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('version', releaseForm.version);
      formData.append('platform', releaseForm.platform);
      formData.append('architecture', releaseForm.architecture);
      formData.append('release_notes', releaseForm.release_notes);
      formData.append('external_url', releaseForm.external_url);
      formData.append('is_latest', releaseForm.is_latest ? 'true' : 'false');
      if (releaseFile) {
        formData.append('file', releaseFile);
      }

      await SoftwareAPI.adminAddRelease(targetSoftware.id, formData);
      showToast(`Release v${releaseForm.version} (${releaseForm.platform}) published!`);
      setShowAddRelease(false);
      setReleaseFile(null);
      await loadSoftware();
    } catch (err) {
      showToast(err.message || 'Error uploading release.', true);
    } finally {
      setUploading(false);
    }
  };

  // Delete Release
  const handleDeleteRelease = async (releaseId, version) => {
    if (!window.confirm(`Delete release v${version}? The physical binary will be removed from the server.`)) return;
    try {
      await SoftwareAPI.adminDeleteRelease(releaseId);
      showToast('Release deleted.');
      await loadSoftware();
    } catch (err) {
      showToast(err.message || 'Error deleting release.', true);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--admin-gray-500)' }}>Loading Software &amp; Downloads...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: '0 0 0.25rem 0', color: 'var(--admin-navy)' }}>Software &amp; Downloadable Releases</h2>
          <p style={{ margin: 0, color: 'var(--admin-gray-500)', fontSize: '0.875rem' }}>
            Manage desktop IDEs, Android APKs, ESP32 flash utilities, and library ZIPs with multi-platform releases.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setEditingSoftware(null);
            setSoftwareForm({
              name: '',
              slug: '',
              icon: 'Code',
              short_desc: '',
              description: '',
              supported_os: 'Windows 10/11, macOS, Linux',
              primary_btn_text: 'Download',
              primary_btn_action: '',
              secondary_btn_text: '',
              secondary_btn_action: '',
              is_published: true
            });
            setShowAddSoftware(true);
          }}
        >
          + Add Software Product
        </button>
      </div>

      {/* Software Items List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {softwareList.map(item => (
          <div
            key={item.id}
            className="data-card"
            style={{
              background: '#fff',
              borderRadius: '8px',
              border: '1px solid var(--admin-gray-200)',
              padding: '1.5rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--admin-gray-200)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: item.icon_bg || 'var(--oxy-primary-light)', color: item.icon_color || 'var(--oxy-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {item.icon === 'Smartphone' ? <IconSmartphone size={24} /> : item.icon === 'Terminal' ? <IconTerminal size={24} /> : item.icon === 'Cpu' ? <IconCpu size={24} /> : <IconLaptop size={24} />}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 0.25rem 0', color: 'var(--admin-navy)', fontSize: '1.15rem' }}>
                    {item.name}
                  </h3>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--admin-gray-500)' }}>/{item.slug}</span>
                    {item.is_published ? (
                      <span className="badge badge-green">Published</span>
                    ) : (
                      <span className="badge badge-orange">Draft</span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setTargetSoftware(item);
                    setReleaseForm({ version: '1.0.0', platform: 'windows', architecture: 'x64', release_notes: '', external_url: '', is_latest: true });
                    setReleaseFile(null);
                    setShowAddRelease(true);
                  }}
                >
                  + Upload Release
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setEditingSoftware(item);
                    setSoftwareForm({
                      name: item.name,
                      slug: item.slug,
                      icon: item.icon || 'Code',
                      short_desc: item.short_desc || '',
                      description: item.description || '',
                      supported_os: Array.isArray(item.supported_os) ? item.supported_os.join(', ') : '',
                      primary_btn_text: item.primary_btn_text || '',
                      primary_btn_action: item.primary_btn_action || '',
                      secondary_btn_text: item.secondary_btn_text || '',
                      secondary_btn_action: item.secondary_btn_action || '',
                      is_published: Boolean(item.is_published)
                    });
                    setShowAddSoftware(true);
                  }}
                >
                  Edit Product
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDeleteSoftware(item.id, item.name)}
                >
                  Delete
                </button>
              </div>
            </div>

            <p style={{ color: 'var(--admin-gray-600)', fontSize: '0.9rem', margin: '0.75rem 0' }}>
              {item.short_desc || item.description}
            </p>

            {/* Platform Releases Table */}
            <div style={{ marginTop: '1rem' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--admin-gray-700)', marginBottom: '0.5rem' }}>
                Platform Releases ({item.releases?.length || 0}):
              </div>
              {item.releases?.length > 0 ? (
                <div className="table-responsive" style={{ border: '1px solid var(--admin-gray-200)', borderRadius: '6px', overflow: 'hidden' }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Version</th>
                        <th>Platform</th>
                        <th>File / Source</th>
                        <th>Size</th>
                        <th>Downloads</th>
                        <th>SHA-256 Checksum</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.releases.map(rel => (
                        <tr key={rel.id}>
                          <td>
                            <strong>v{rel.version}</strong>
                            {rel.is_latest && <span className="badge badge-green" style={{ marginLeft: '4px', fontSize: '0.65rem' }}>Latest</span>}
                          </td>
                          <td>
                            <span className="badge badge-purple" style={{ fontSize: '0.75rem' }}>{rel.platform} ({rel.architecture || 'x64'})</span>
                          </td>
                          <td style={{ fontSize: '0.82rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {rel.external_url ? (
                              <a href={rel.external_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--admin-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <span>External Link</span>
                                <IconExternalLink size={12} />
                              </a>
                            ) : (
                              rel.file_name || <em style={{ color: '#94a3b8' }}>Stored binary</em>
                            )}
                          </td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--admin-gray-600)' }}>
                            {rel.file_size ? `${(rel.file_size / (1024 * 1024)).toFixed(1)} MB` : '—'}
                          </td>
                          <td>
                            <strong>{rel.download_count || 0}</strong>
                          </td>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--admin-gray-500)', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {rel.sha256_checksum || '—'}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              <a
                                href={`/api/software/download/${rel.id}`}
                                className="btn btn-outline btn-sm"
                                style={{ padding: '2px 6px', fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                download
                              >
                                <span>Test Download</span>
                                <IconDownload size={12} />
                              </a>
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                style={{ padding: '2px 6px', fontSize: '0.72rem' }}
                                onClick={() => handleDeleteRelease(rel.id, rel.version)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', textAlign: 'center', color: 'var(--admin-gray-500)', fontSize: '0.85rem' }}>
                  No releases uploaded yet. Click <strong>+ Upload Release</strong> to add .exe, .dmg, .apk, or external link.
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL: ADD / EDIT SOFTWARE */}
      {showAddSoftware && (
        <div className="admin-modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="admin-modal" style={{ background: '#fff', borderRadius: '8px', width: '100%', maxWidth: '640px', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--admin-gray-200)', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, color: 'var(--admin-navy)' }}>
                {editingSoftware ? 'Edit Software Product' : 'Add New Software Product'}
              </h3>
              <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748b' }} onClick={() => setShowAddSoftware(false)} aria-label="Close modal"><IconX size={18} /></button>
            </div>

            <form onSubmit={handleSaveSoftware} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Software Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. OxyCode Studio Desktop"
                  required
                  value={softwareForm.name}
                  onChange={e => setSoftwareForm({ ...softwareForm, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Slug</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. oxycode-studio"
                    value={softwareForm.slug}
                    onChange={e => setSoftwareForm({ ...softwareForm, slug: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Icon Type</label>
                  <select
                    className="form-input"
                    value={softwareForm.icon}
                    onChange={e => setSoftwareForm({ ...softwareForm, icon: e.target.value })}
                  >
                    <option value="Code">Code (IDE / Desktop)</option>
                    <option value="Smartphone">Smartphone (Mobile APK)</option>
                    <option value="Terminal">Terminal (Flasher Tool)</option>
                    <option value="Cpu">Cpu (Arduino Library / Firmware)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Short Description</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Brief 1-sentence feature highlight..."
                  value={softwareForm.short_desc}
                  onChange={e => setSoftwareForm({ ...softwareForm, short_desc: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Full Description</label>
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder="Detailed toolchain capabilities..."
                  value={softwareForm.description}
                  onChange={e => setSoftwareForm({ ...softwareForm, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Supported Operating Systems (Comma separated)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Windows 10/11 (x64), macOS (Universal), Linux"
                  value={softwareForm.supported_os}
                  onChange={e => setSoftwareForm({ ...softwareForm, supported_os: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="softPublishCheck"
                  checked={softwareForm.is_published}
                  onChange={e => setSoftwareForm({ ...softwareForm, is_published: e.target.checked })}
                />
                <label htmlFor="softPublishCheck" style={{ margin: 0, fontSize: '0.9rem', cursor: 'pointer' }}>
                  Show product publicly on /software page
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Save Software Product
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddSoftware(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD RELEASE */}
      {showAddRelease && targetSoftware && (
        <div className="admin-modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="admin-modal" style={{ background: '#fff', borderRadius: '8px', width: '100%', maxWidth: '580px', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--admin-gray-200)', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--admin-navy)' }}>Upload Software Release</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--admin-gray-500)' }}>For {targetSoftware.name}</div>
              </div>
              <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748b' }} onClick={() => setShowAddRelease(false)} aria-label="Close modal"><IconX size={18} /></button>
            </div>

            <form onSubmit={handleSaveRelease} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Version *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 2.4.0"
                    required
                    value={releaseForm.version}
                    onChange={e => setReleaseForm({ ...releaseForm, version: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Platform *</label>
                  <select
                    className="form-input"
                    value={releaseForm.platform}
                    onChange={e => setReleaseForm({ ...releaseForm, platform: e.target.value })}
                  >
                    <option value="windows">Windows (.exe / .msi)</option>
                    <option value="macos">macOS (.dmg / .pkg)</option>
                    <option value="android">Android (.apk)</option>
                    <option value="linux">Linux (.AppImage / .deb)</option>
                    <option value="firmware">ESP32 Firmware (.bin / .hex)</option>
                    <option value="library">Arduino / Code Library (.zip)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Upload Binary File (Max 500MB)</label>
                <input
                  type="file"
                  className="form-input"
                  accept=".exe,.msi,.dmg,.pkg,.apk,.zip,.bin,.hex,.uf2,.pdf,.appimage"
                  onChange={e => setReleaseFile(e.target.files[0] || null)}
                />
                <small style={{ color: 'var(--admin-gray-500)', fontSize: '0.75rem', display: 'block', marginTop: '4px' }}>
                  Supported formats: .exe, .msi, .dmg, .pkg, .apk, .zip, .bin, .hex, .uf2, .pdf. SHA-256 will be calculated automatically.
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">OR External Download URL (Optional)</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://play.google.com/store/apps/... or https://github.com/..."
                  value={releaseForm.external_url}
                  onChange={e => setReleaseForm({ ...releaseForm, external_url: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Release Notes</label>
                <textarea
                  className="form-input"
                  rows="2"
                  placeholder="New features, fixes, or changelog..."
                  value={releaseForm.release_notes}
                  onChange={e => setReleaseForm({ ...releaseForm, release_notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="relLatestCheck"
                  checked={releaseForm.is_latest}
                  onChange={e => setReleaseForm({ ...releaseForm, is_latest: e.target.checked })}
                />
                <label htmlFor="relLatestCheck" style={{ margin: 0, fontSize: '0.9rem', cursor: 'pointer' }}>
                  Mark as primary/latest release for this platform
                </label>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={uploading}>
                  {uploading ? 'Calculating SHA-256 & Uploading...' : 'Publish Release'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddRelease(false)} disabled={uploading}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

