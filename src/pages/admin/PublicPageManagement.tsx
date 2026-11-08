import React, { useState, useEffect } from 'react';
import { useFest } from '../../context/FestContext';
import {
  FestPublicPageData,
  FestHeroMedia,
  FestLogoMedia,
  FestPhotoItem,
  FestPublicPageContent
} from '../../types';
import {
  fetchDraftFestPage,
  saveDraftFestPage,
  publishFestPage,
  getDefaultFestPublicPage
} from '../../firebase/firestoreService';
import { uploadFestMedia, deleteFestMedia } from '../../firebase/storageService';
import {
  Globe,
  Upload,
  Video,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Eye,
  Save,
  Send,
  MoveUp,
  MoveDown,
  Trash2,
  ExternalLink,
  Plus,
  RefreshCw,
  Sparkles,
  Sliders,
  FileText,
  Layout,
  HelpCircle
} from 'lucide-react';
import { PublicFestPage } from '../public/PublicFestPage';

export const PublicPageManagement: React.FC = () => {
  const { activeFestId, settings, addToast } = useFest();
  const currentFestId = activeFestId || 'FEST-01';

  const [activeSubTab, setActiveSubTab] = useState<
    'hero' | 'logo' | 'photos' | 'gallery' | 'content' | 'preview'
  >('hero');

  const [pageData, setPageData] = useState<FestPublicPageData>(() =>
    getDefaultFestPublicPage(currentFestId, settings.festName)
  );

  const [loading, setLoading] = useState(true);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load draft data on mount
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const draft = await fetchDraftFestPage(currentFestId, settings.festName);
        if (isMounted && draft) {
          setPageData(draft);
        }
      } catch (err) {
        console.warn('Failed to load draft:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [currentFestId, settings.festName]);

  // Handle Save Draft
  const handleSaveDraft = async () => {
    setSavingDraft(true);
    setStatusMessage(null);
    try {
      await saveDraftFestPage(currentFestId, pageData);
      setStatusMessage({ type: 'success', text: 'Draft changes saved successfully.' });
      addToast('success', 'Draft Saved', 'Your edits have been saved privately in draft mode.');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save draft.' });
      addToast('error', 'Error', 'Failed to save draft changes.');
    } finally {
      setSavingDraft(false);
    }
  };

  // Handle Publish Changes
  const handlePublishChanges = async () => {
    setPublishing(true);
    setStatusMessage(null);
    try {
      await publishFestPage(currentFestId, pageData);
      setStatusMessage({ type: 'success', text: 'Public page published! All changes are now live.' });
      addToast('success', 'Published Live', `Published public fest page for ${settings.festName}!`);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to publish changes.' });
      addToast('error', 'Error', 'Failed to publish public changes.');
    } finally {
      setPublishing(false);
    }
  };

  // Video upload handler
  const handleHeroVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgress(0);
    try {
      const result = await uploadFestMedia(currentFestId, 'hero', file, (percent) => {
        setUploadProgress(percent);
      });
      setPageData((prev) => ({
        ...prev,
        hero: {
          ...prev.hero,
          videoUrl: result.downloadUrl,
          videoType: result.contentType
        }
      }));
      addToast('success', 'Video Uploaded', 'Hero background video uploaded successfully.');
    } catch (err: any) {
      addToast('error', 'Upload Failed', err.message || 'Failed to upload video.');
    } finally {
      setUploadProgress(null);
      e.target.value = '';
    }
  };

  // Poster image upload handler
  const handleHeroPosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgress(0);
    try {
      const result = await uploadFestMedia(currentFestId, 'photos', file, (percent) => {
        setUploadProgress(percent);
      });
      setPageData((prev) => ({
        ...prev,
        hero: {
          ...prev.hero,
          videoPosterUrl: result.downloadUrl
        }
      }));
      addToast('success', 'Poster Uploaded', 'Hero fallback poster image uploaded.');
    } catch (err: any) {
      addToast('error', 'Upload Failed', err.message || 'Failed to upload fallback image.');
    } finally {
      setUploadProgress(null);
      e.target.value = '';
    }
  };

  // Logo upload handler
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgress(0);
    try {
      const result = await uploadFestMedia(currentFestId, 'logo', file, (percent) => {
        setUploadProgress(percent);
      });
      setPageData((prev) => ({
        ...prev,
        logo: {
          ...prev.logo,
          logoUrl: result.downloadUrl
        }
      }));
      addToast('success', 'Logo Uploaded', 'Transparent PNG logo saved successfully.');
    } catch (err: any) {
      addToast('error', 'Upload Failed', err.message || 'Failed to upload PNG logo.');
    } finally {
      setUploadProgress(null);
      e.target.value = '';
    }
  };

  // Photo upload handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadProgress(0);
    try {
      const newItems: FestPhotoItem[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await uploadFestMedia(currentFestId, 'photos', file);
        newItems.push({
          id: `photo_${Date.now()}_${i}`,
          url: res.downloadUrl,
          caption: file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
          description: '',
          order: pageData.photos.length + i,
          featuredInMain: true,
          category: 'General',
          createdAt: new Date().toISOString()
        });
      }

      setPageData((prev) => ({
        ...prev,
        photos: [...prev.photos, ...newItems]
      }));
      addToast('success', 'Photos Uploaded', `Uploaded ${newItems.length} photo(s).`);
    } catch (err: any) {
      addToast('error', 'Upload Failed', err.message || 'Failed to upload photos.');
    } finally {
      setUploadProgress(null);
      e.target.value = '';
    }
  };

  // Reorder photo
  const handleMovePhoto = (index: number, direction: 'up' | 'down') => {
    const newPhotos = [...pageData.photos];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newPhotos.length) return;

    const temp = newPhotos[index];
    newPhotos[index] = newPhotos[targetIndex];
    newPhotos[targetIndex] = temp;

    // re-assign orders
    newPhotos.forEach((p, idx) => {
      p.order = idx;
    });

    setPageData((prev) => ({ ...prev, photos: newPhotos }));
  };

  // Delete photo
  const handleDeletePhoto = (photoId: string) => {
    const photo = pageData.photos.find((p) => p.id === photoId);
    if (photo?.url) {
      deleteFestMedia(photo.url);
    }
    setPageData((prev) => ({
      ...prev,
      photos: prev.photos.filter((p) => p.id !== photoId)
    }));
    addToast('info', 'Photo Removed', 'Photo removed from fest public page.');
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-slate-500 text-sm">
          <RefreshCw className="w-6 h-6 animate-spin text-slate-900" />
          <span>Loading Public Page Content Manager...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Public Page Management
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Manage hero video, PNG logo, and curated photos for your public portal (/f/{currentFestId})
              </p>
            </div>
          </div>
        </div>

        {/* Global Save Draft & Publish Buttons */}
        <div className="flex items-center gap-2.5">
          <a
            href={`/f/${currentFestId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>View Live Public Page</span>
          </a>

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={savingDraft || publishing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors shadow-2xs disabled:opacity-50"
          >
            {savingDraft ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Draft</span>
          </button>

          <button
            type="button"
            onClick={handlePublishChanges}
            disabled={savingDraft || publishing}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-50"
          >
            {publishing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5 text-indigo-300" />}
            <span>Publish Changes</span>
          </button>
        </div>
      </div>

      {/* Progress & Feedback Notifications */}
      {uploadProgress !== null && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-between text-xs text-indigo-900">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
            <span>Uploading media to Firebase Storage... {uploadProgress}%</span>
          </div>
          <div className="w-32 bg-indigo-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full transition-all duration-150"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {statusMessage && (
        <div
          className={`p-3 rounded-lg flex items-center gap-2 text-xs font-medium ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Navigation Tabs (1. Hero Section, 2. Fest Logo, 3. Main Photos, 4. Photo Gallery, 5. Page Content, 6. Preview and Publish) */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-px text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveSubTab('hero')}
          className={`px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'hero'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>1. Hero Section</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('logo')}
          className={`px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'logo'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>2. Fest Logo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('photos')}
          className={`px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'photos'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>3. Main Photos ({pageData.photos.filter((p) => p.featuredInMain).length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('gallery')}
          className={`px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'gallery'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layout className="w-3.5 h-3.5" />
          <span>4. Photo Gallery ({pageData.photos.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('content')}
          className={`px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'content'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>5. Page Content</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('preview')}
          className={`px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeSubTab === 'preview'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Eye className="w-3.5 h-3.5 text-indigo-600" />
          <span>6. Preview & Publish</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: HERO SECTION                                                  */}
      {/* ==================================================================== */}
      {activeSubTab === 'hero' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white p-6 rounded-xl border border-slate-200">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Video className="w-4 h-4 text-indigo-600" />
              <span>Hero Background Video & Fallback</span>
            </h3>

            {/* Video File Upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Upload Hero Background Video (MP4 or WebM, Max 50MB)
              </label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose Video File</span>
                  <input
                    type="file"
                    accept="video/mp4,video/webm"
                    onChange={handleHeroVideoUpload}
                    className="hidden"
                  />
                </label>
                {pageData.hero.videoUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      setPageData((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, videoUrl: undefined, videoType: undefined }
                      }))
                    }
                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
                  >
                    Remove Video
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Autoplays on loop (muted) to deliver a high-energy cinematic entry.
              </p>
            </div>

            {/* Fallback image upload */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fallback Hero Poster / Image (Optional)
              </label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Upload Poster Image</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleHeroPosterUpload}
                    className="hidden"
                  />
                </label>
                {pageData.hero.videoPosterUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      setPageData((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, videoPosterUrl: undefined }
                      }))
                    }
                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
                  >
                    Remove Poster
                  </button>
                )}
              </div>
            </div>

            {/* CSS Fallback Toggle */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="cssFallbackToggle"
                checked={pageData.hero.showFallbackCss}
                onChange={(e) =>
                  setPageData((prev) => ({
                    ...prev,
                    hero: { ...prev.hero, showFallbackCss: e.target.checked }
                  }))
                }
                className="w-4 h-4 rounded text-slate-900 focus:ring-slate-900 border-slate-300"
              />
              <label htmlFor="cssFallbackToggle" className="text-xs font-semibold text-slate-700">
                Use CSS-designed gradient fallback when video is unavailable
              </label>
            </div>

            {/* Text Inputs */}
            <div className="pt-2 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hero Heading *
                </label>
                <input
                  type="text"
                  value={pageData.hero.heading}
                  onChange={(e) =>
                    setPageData((prev) => ({
                      ...prev,
                      hero: { ...prev.hero, heading: e.target.value }
                    }))
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hero Subtitle / Description *
                </label>
                <textarea
                  rows={2}
                  value={pageData.hero.description}
                  onChange={(e) =>
                    setPageData((prev) => ({
                      ...prev,
                      hero: { ...prev.hero, description: e.target.value }
                    }))
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Primary CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={pageData.hero.primaryCtaText || ''}
                    onChange={(e) =>
                      setPageData((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, primaryCtaText: e.target.value }
                      }))
                    }
                    placeholder="e.g. Register Now"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Secondary CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={pageData.hero.secondaryCtaText || ''}
                    onChange={(e) =>
                      setPageData((prev) => ({
                        ...prev,
                        hero: { ...prev.hero, secondaryCtaText: e.target.value }
                      }))
                    }
                    placeholder="e.g. View Schedule"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Video Preview Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700">Live Hero Preview</h4>
            <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 relative flex items-center justify-center">
              {pageData.hero.videoUrl ? (
                <video
                  src={pageData.hero.videoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  controls
                  className="w-full h-full object-cover"
                />
              ) : pageData.hero.videoPosterUrl ? (
                <img
                  src={pageData.hero.videoPosterUrl}
                  alt="Hero Poster"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col items-center justify-center p-6 text-center">
                  <Sparkles className="w-8 h-8 text-indigo-400 mb-2 opacity-80" />
                  <p className="text-xs font-bold text-white tracking-wide">
                    CSS Gradient Fallback Active
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                    No video uploaded. The hero will render this responsive, high-performance CSS gradient.
                  </p>
                </div>
              )}
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 leading-relaxed">
              Videos are streamed directly from Firebase Storage. On mobile devices, videos autoplay muted with hardware-accelerated playback.
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: FEST LOGO                                                     */}
      {/* ==================================================================== */}
      {activeSubTab === 'logo' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-6 max-w-2xl">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>Fest Official PNG Logo</span>
            </h3>
            <p className="text-xs text-slate-500">
              Upload a transparent background PNG logo for the public fest navbar and hero section.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Transparent PNG Logo</span>
              <input
                type="file"
                accept="image/png"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </label>
            {pageData.logo.logoUrl && (
              <button
                type="button"
                onClick={() =>
                  setPageData((prev) => ({
                    ...prev,
                    logo: { ...prev.logo, logoUrl: undefined }
                  }))
                }
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
              >
                Remove Logo
              </button>
            )}
          </div>

          {/* Logo Size Slider */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
              <span>Display Width: {pageData.logo.widthPx}px</span>
              <span className="text-slate-400 font-normal">Range: 60px – 240px</span>
            </div>
            <input
              type="range"
              min="60"
              max="240"
              value={pageData.logo.widthPx}
              onChange={(e) =>
                setPageData((prev) => ({
                  ...prev,
                  logo: { ...prev.logo, widthPx: Number(e.target.value) }
                }))
              }
              className="w-full accent-slate-900 cursor-pointer"
            />
          </div>

          {/* Alignment */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Header Logo Alignment
            </label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="logoAlign"
                  checked={pageData.logo.alignment === 'left'}
                  onChange={() =>
                    setPageData((prev) => ({
                      ...prev,
                      logo: { ...prev.logo, alignment: 'left' }
                    }))
                  }
                  className="text-slate-900 focus:ring-slate-900"
                />
                <span>Left Aligned</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="logoAlign"
                  checked={pageData.logo.alignment === 'center'}
                  onChange={() =>
                    setPageData((prev) => ({
                      ...prev,
                      logo: { ...prev.logo, alignment: 'center' }
                    }))
                  }
                  className="text-slate-900 focus:ring-slate-900"
                />
                <span>Center Aligned</span>
              </label>
            </div>
          </div>

          {/* Logo Transparency Preview Checkboard */}
          <div>
            <span className="block text-xs font-semibold text-slate-700 mb-1.5">
              Transparency Preview:
            </span>
            <div
              className="p-8 rounded-xl border border-slate-200 flex items-center justify-center"
              style={{
                backgroundImage:
                  'linear-gradient(45deg, #f1f5f9 25%, transparent 25%), linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f5f9 75%), linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)',
                backgroundSize: '16px 16px',
                backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px'
              }}
            >
              {pageData.logo.logoUrl ? (
                <img
                  src={pageData.logo.logoUrl}
                  alt="Fest Logo"
                  style={{ width: `${pageData.logo.widthPx}px` }}
                  className="h-auto object-contain transition-all"
                />
              ) : (
                <div className="text-center text-xs text-slate-400 font-medium">
                  No logo uploaded. Default typography badge will display.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3 & 4: MAIN PHOTOS & PHOTO GALLERY                               */}
      {/* ==================================================================== */}
      {(activeSubTab === 'photos' || activeSubTab === 'gallery') && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-600" />
                <span>
                  {activeSubTab === 'photos' ? 'Main Photos (Landing Highlights)' : 'Photo Gallery Albums'}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                {activeSubTab === 'photos'
                  ? 'Reorder, caption, and select which photos appear prominently in the landing sections.'
                  : 'Manage all fest albums, high-resolution ceremony photos, and stage captures.'}
              </p>
            </div>

            <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs">
              <Plus className="w-3.5 h-3.5" />
              <span>Upload Photos (JPG/PNG/WebP)</span>
              <input
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>

          {pageData.photos.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
              <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-xs font-bold text-slate-700">No photos uploaded yet</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Upload fest photos to showcase ceremonies, cultural performances, and audience moments.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pageData.photos
                .filter((p) => (activeSubTab === 'photos' ? true : true))
                .map((photo, index) => (
                  <div
                    key={photo.id}
                    className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 flex flex-col shadow-2xs"
                  >
                    <div className="aspect-4/3 w-full bg-slate-200 relative overflow-hidden group">
                      <img
                        src={photo.url}
                        alt={photo.caption}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 flex gap-1 opacity-90">
                        <button
                          type="button"
                          onClick={() => handleMovePhoto(index, 'up')}
                          disabled={index === 0}
                          title="Move Earlier"
                          className="p-1 bg-white/90 rounded text-slate-700 hover:bg-white disabled:opacity-30 shadow-2xs"
                        >
                          <MoveUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMovePhoto(index, 'down')}
                          disabled={index === pageData.photos.length - 1}
                          title="Move Later"
                          className="p-1 bg-white/90 rounded text-slate-700 hover:bg-white disabled:opacity-30 shadow-2xs"
                        >
                          <MoveDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(photo.id)}
                          title="Delete Photo"
                          className="p-1 bg-white/90 rounded text-rose-600 hover:bg-white shadow-2xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-3.5 bg-white flex-1 space-y-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Caption
                        </label>
                        <input
                          type="text"
                          value={photo.caption}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPageData((prev) => ({
                              ...prev,
                              photos: prev.photos.map((p) =>
                                p.id === photo.id ? { ...p, caption: val } : p
                              )
                            }));
                          }}
                          placeholder="e.g. Grand Valedictory Ceremony"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-800"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={photo.featuredInMain}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setPageData((prev) => ({
                                ...prev,
                                photos: prev.photos.map((p) =>
                                  p.id === photo.id ? { ...p, featuredInMain: checked } : p
                                )
                              }));
                            }}
                            className="rounded text-slate-900 border-slate-300"
                          />
                          <span className="text-[11px] font-medium">Feature in Main Landing</span>
                        </label>

                        <select
                          value={photo.category || 'General'}
                          onChange={(e) => {
                            const cat = e.target.value;
                            setPageData((prev) => ({
                              ...prev,
                              photos: prev.photos.map((p) =>
                                p.id === photo.id ? { ...p, category: cat } : p
                              )
                            }));
                          }}
                          className="text-[10px] bg-slate-100 border border-slate-200 rounded px-1.5 py-1"
                        >
                          <option value="General">General</option>
                          <option value="Ceremony">Ceremony</option>
                          <option value="Performance">Performance</option>
                          <option value="Competitions">Competitions</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 5: PAGE CONTENT                                                  */}
      {/* ==================================================================== */}
      {activeSubTab === 'content' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4 max-w-2xl">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>Public Page Written Content</span>
            </h3>
            <p className="text-xs text-slate-500">
              Customize the welcome message, festival background, venue directions, and contact information.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Welcome Section Title
            </label>
            <input
              type="text"
              value={pageData.content.welcomeTitle}
              onChange={(e) =>
                setPageData((prev) => ({
                  ...prev,
                  content: { ...prev.content, welcomeTitle: e.target.value }
                }))
              }
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Welcome Message / Intro Paragraph
            </label>
            <textarea
              rows={3}
              value={pageData.content.welcomeMessage}
              onChange={(e) =>
                setPageData((prev) => ({
                  ...prev,
                  content: { ...prev.content, welcomeMessage: e.target.value }
                }))
              }
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              About the Fest / Heritage
            </label>
            <textarea
              rows={3}
              value={pageData.content.aboutFest}
              onChange={(e) =>
                setPageData((prev) => ({
                  ...prev,
                  content: { ...prev.content, aboutFest: e.target.value }
                }))
              }
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Contact Email
              </label>
              <input
                type="email"
                value={pageData.content.contactEmail}
                onChange={(e) =>
                  setPageData((prev) => ({
                    ...prev,
                    content: { ...prev.content, contactEmail: e.target.value }
                  }))
                }
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Helpdesk Phone
              </label>
              <input
                type="tel"
                value={pageData.content.contactPhone}
                onChange={(e) =>
                  setPageData((prev) => ({
                    ...prev,
                    content: { ...prev.content, contactPhone: e.target.value }
                  }))
                }
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900"
              />
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 6: PREVIEW AND PUBLISH                                           */}
      {/* ==================================================================== */}
      {activeSubTab === 'preview' && (
        <div className="space-y-4">
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between text-xs text-indigo-900">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-600" />
              <span>
                <strong>Live Draft Preview:</strong> This preview reflects your current draft changes. Public visitors will not see these changes until you click <strong>Publish Changes</strong>.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={savingDraft || publishing}
                className="px-3 py-1.5 bg-white border border-indigo-300 text-indigo-900 rounded-md font-semibold hover:bg-indigo-100"
              >
                Save Draft
              </button>
              <button
                type="button"
                onClick={handlePublishChanges}
                disabled={savingDraft || publishing}
                className="px-3.5 py-1.5 bg-slate-900 text-white rounded-md font-semibold hover:bg-slate-800"
              >
                Publish Changes Now
              </button>
            </div>
          </div>

          {/* Embedded Full-Fidelity Public Fest Page Preview Container */}
          <div className="border-4 border-slate-200 rounded-2xl overflow-hidden shadow-2xl bg-white">
            <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between text-xs">
              <span className="font-mono text-slate-400">Preview Mode: /f/{currentFestId} (Draft Data)</span>
              <span className="bg-amber-400 text-amber-950 font-bold px-2 py-0.5 rounded text-[10px]">
                DRAFT PREVIEW
              </span>
            </div>
            <div className="max-h-[85vh] overflow-y-auto">
              <PublicFestPage festId={currentFestId} previewData={pageData} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
