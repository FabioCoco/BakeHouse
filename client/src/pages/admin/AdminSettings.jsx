import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/ui/Button.jsx';
import Card from '../../components/ui/Card.jsx';
import ImageUploader from '../../components/admin/ImageUploader.jsx';
import Input from '../../components/ui/Input.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';
import useFetch from '../../hooks/useFetch.js';
import { categoryService } from '../../services/categoryService.js';
import { settingsService } from '../../services/settingsService.js';
import { mapServerErrors } from '../../utils/validators.js';

const MAX_BANNERS = 10;
const MAX_FEATURED = 6;
const IMAGE_PATTERN = /^(https:\/\/\S+|[A-Za-z0-9][A-Za-z0-9._-]*\.(jpg|jpeg|png|webp|avif))$/i;

const NEW_BANNER = { title: '', subtitle: '', image: '', ctaLabel: '', ctaLink: '', isActive: true };

export default function AdminSettings() {
  const settings = useFetch(() => settingsService.getAdmin(), []);
  const categories = useFetch(() => categoryService.list(), []);
  const categoryList = categories.body?.data ?? [];

  const [announcement, setAnnouncement] = useState('');
  const [banners, setBanners] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Load the saved settings into the form once they arrive.
  useEffect(() => {
    if (!settings.body) return;
    setAnnouncement(settings.body.announcement ?? '');
    setBanners(
      [...(settings.body.banners ?? [])]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((b) => ({ ...b, subtitle: b.subtitle ?? '', ctaLabel: b.ctaLabel ?? '', ctaLink: b.ctaLink ?? '' })),
    );
    setFeatured((settings.body.featuredCategories ?? []).map((c) => c._id));
  }, [settings.body]);

  useEffect(() => {
    document.title = 'Settings · Admin BakeHouse';
  }, []);

  const updateBanner = (index, name, value) => {
    setBanners((list) => list.map((b, i) => (i === index ? { ...b, [name]: value } : b)));
    setErrors((prev) => ({ ...prev, [`banners.${index}.${name}`]: undefined }));
  };

  const moveBanner = (index, step) => {
    setBanners((list) => {
      const next = [...list];
      const target = index + step;
      if (target < 0 || target >= next.length) return list;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const toggleFeatured = (id) => {
    setFeatured((list) => {
      if (list.includes(id)) return list.filter((x) => x !== id);
      if (list.length >= MAX_FEATURED) {
        toast.error(`Up to ${MAX_FEATURED} featured categories allowed.`);
        return list;
      }
      return [...list, id];
    });
  };

  const validate = () => {
    const next = {};
    banners.forEach((b, i) => {
      if (!b.title.trim()) next[`banners.${i}.title`] = 'Title is required';
      if (!IMAGE_PATTERN.test(b.image.trim())) {
        next[`banners.${i}.image`] = 'Use an https URL or an image file name such as promo.jpg';
      }
      if (b.ctaLink && !(b.ctaLink.startsWith('/') || /^https:\/\//.test(b.ctaLink))) {
        next[`banners.${i}.ctaLink`] = 'Link must start with "/" or https://';
      }
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) {
      toast.error('Check the banner fields.');
      return;
    }
    setSaving(true);
    try {
      await settingsService.updateAdmin({
        announcement: announcement.trim(),
        banners: banners.map((b, i) => ({
          title: b.title.trim(),
          subtitle: b.subtitle.trim(),
          image: b.image.trim(),
          ctaLabel: b.ctaLabel.trim(),
          ctaLink: b.ctaLink.trim(),
          isActive: b.isActive,
          sortOrder: i,
        })),
        featuredCategories: featured,
      });
      toast.success('Settings saved.');
      setErrors({});
    } catch (err) {
      const fieldErrors = mapServerErrors(err.errors);
      if (Object.keys(fieldErrors).length) setErrors(fieldErrors);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (settings.loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (settings.error) {
    return <p className="text-cocoa">Settings could not be loaded.</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <p className="eyebrow">Shop</p>
        <h1 className="text-4xl">Settings</h1>
      </header>

      <Card className="flex flex-col gap-4 p-6">
        <h2 className="text-2xl">Announcement</h2>
        <Input
          label="Announcement text (leave empty to hide)"
          value={announcement}
          maxLength={160}
          onChange={(e) => setAnnouncement(e.target.value)}
          hint={`${announcement.length}/160 karakter`}
        />
      </Card>

      <section aria-labelledby="banner-title" className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 id="banner-title" className="text-2xl">
            Promo Banner
          </h2>
          <Button
            variant="outline"
            size="sm"
            disabled={banners.length >= MAX_BANNERS}
            onClick={() => setBanners((list) => [...list, { ...NEW_BANNER }])}
          >
            <Plus size={16} aria-hidden="true" /> Add banner
          </Button>
        </div>

        {banners.length === 0 && <p className="text-cocoa">No banners yet. Banners appear below the home hero.</p>}

        {banners.map((banner, index) => (
          <Card key={banner._id ?? `new-${index}`} className="flex flex-col gap-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-semibold text-crust">Banner {index + 1}</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => moveBanner(index, -1)} aria-label="Naikkan urutan" className="rounded-full p-2 text-cocoa hover:bg-sand/40">
                  <ArrowUp size={16} aria-hidden="true" />
                </button>
                <button type="button" onClick={() => moveBanner(index, 1)} aria-label="Turunkan urutan" className="rounded-full p-2 text-cocoa hover:bg-sand/40">
                  <ArrowDown size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setBanners((list) => list.filter((_, i) => i !== index))}
                  aria-label={`Delete banner ${index + 1}`}
                  className="rounded-full p-2 text-berry hover:bg-berry/10"
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Title"
                value={banner.title}
                maxLength={100}
                onChange={(e) => updateBanner(index, 'title', e.target.value)}
                error={errors[`banners.${index}.title`]}
              />
              <Input
                label="Subjudul"
                value={banner.subtitle}
                maxLength={200}
                onChange={(e) => updateBanner(index, 'subtitle', e.target.value)}
              />
              <ImageUploader
                kind="banner"
                label="Banner image"
                value={banner.image}
                onChange={(filename) => updateBanner(index, 'image', filename)}
                onRemove={() => updateBanner(index, 'image', '')}
                error={errors[`banners.${index}.image`]}
                hint="JPG, PNG, WebP, or AVIF, max 2 MB."
              />
              <Input
                label="Button label"
                value={banner.ctaLabel}
                maxLength={40}
                onChange={(e) => updateBanner(index, 'ctaLabel', e.target.value)}
              />
              <Input
                label="Button link"
                value={banner.ctaLink}
                maxLength={200}
                onChange={(e) => updateBanner(index, 'ctaLink', e.target.value)}
                error={errors[`banners.${index}.ctaLink`]}
                hint='Contoh: /products?onSale=true'
              />
              <label className="flex items-center gap-3 self-end pb-3 text-sm text-espresso">
                <input
                  type="checkbox"
                  checked={banner.isActive}
                  onChange={(e) => updateBanner(index, 'isActive', e.target.checked)}
                  className="h-4 w-4 accent-crust"
                />
                Show on home page
              </label>
            </div>
          </Card>
        ))}
      </section>

      <section aria-labelledby="featured-title" className="flex flex-col gap-4">
        <h2 id="featured-title" className="text-2xl">
          Featured Categories
        </h2>
        <p className="text-sm text-cocoa">Choose up to {MAX_FEATURED} categories. They set the category order on the home page.</p>
        <fieldset className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <legend className="sr-only">Featured categories</legend>
          {categoryList.map((category) => (
            <label key={category._id} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm">
              <input
                type="checkbox"
                checked={featured.includes(category._id)}
                onChange={() => toggleFeatured(category._id)}
                className="h-4 w-4 accent-crust"
              />
              {category.name}
            </label>
          ))}
        </fieldset>
      </section>

      <div className="flex justify-end">
        <Button size="lg" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
