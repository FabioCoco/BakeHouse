import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../ui/Button.jsx';
import Container from '../layout/Container.jsx';
import useFetch from '../../hooks/useFetch.js';
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion.js';
import { settingsService } from '../../services/settingsService.js';

const AUTOPLAY_MS = 6000;

// Banner images are either full https URLs or file names inside /uploads/banners.
const bannerSrc = (image) => (/^https:\/\//i.test(image) ? image : `/uploads/banners/${image}`);

// Promo banners below the hero. Autoplay stops for users who ask for reduced motion, and on hover or focus.
export default function BannerCarousel() {
  const { body } = useFetch(() => settingsService.getPublic(), []);
  const banners = body?.banners ?? [];
  const reducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (banners.length < 2 || reducedMotion || paused) return undefined;
    const timer = setInterval(() => setIndex((current) => (current + 1) % banners.length), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [banners.length, reducedMotion, paused]);

  if (banners.length === 0) return null;

  const current = banners[Math.min(index, banners.length - 1)];
  const go = (step) => setIndex((prev) => (prev + step + banners.length) % banners.length);

  return (
    <Container as="section" aria-roledescription="carousel" aria-label="Promo" className="py-10">
      <div
        className="relative overflow-hidden rounded-2xl border border-line bg-surface shadow-soft"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <div className="grid items-center gap-6 md:grid-cols-2">
          <div className="aspect-[16/9] overflow-hidden bg-sand/40 md:aspect-auto md:h-full">
            <img
              key={current._id}
              src={bannerSrc(current.image)}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-opacity duration-500"
            />
          </div>

          <div className="flex flex-col gap-4 p-8 md:p-12" aria-live="polite">
            <p className="eyebrow">Promo</p>
            <h2 className="text-3xl md:text-4xl">{current.title}</h2>
            {current.subtitle && <p className="text-cocoa">{current.subtitle}</p>}
            {current.ctaLabel && current.ctaLink && (
              <div>
                {/^https?:\/\//.test(current.ctaLink) ? (
                  <Button as="a" href={current.ctaLink} target="_blank" rel="noopener noreferrer">
                    {current.ctaLabel}
                  </Button>
                ) : (
                  <Button as={Link} to={current.ctaLink}>
                    {current.ctaLabel}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {banners.length > 1 && (
          <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Promo sebelumnya"
              className="rounded-full bg-surface/90 p-2 text-espresso shadow-soft transition hover:bg-surface"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <div className="flex gap-2">
              {banners.map((banner, i) => (
                <button
                  key={banner._id}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Tampilkan promo ${i + 1}`}
                  aria-current={i === index}
                  className={`h-2.5 rounded-full transition-all ${i === index ? 'w-6 bg-crust' : 'w-2.5 bg-sand-dark'}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Promo berikutnya"
              className="rounded-full bg-surface/90 p-2 text-espresso shadow-soft transition hover:bg-surface"
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </Container>
  );
}
