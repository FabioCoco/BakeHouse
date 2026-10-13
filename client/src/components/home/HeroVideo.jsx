import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import Button from '../ui/Button.jsx';
import useInView from '../../hooks/useInView.js';
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion.js';
import { HERO_MEDIA } from '../../config/hero.js';

// The video edges fade into the sand background, so the section has no visible box.
const EDGE_MASK = 'radial-gradient(ellipse 80% 85% at 50% 50%, #000 62%, transparent 100%)';

export default function HeroVideo() {
  const videoRef = useRef(null);
  const [videoReady, setVideoReady] = useState(false);
  const [mediaRef, inView] = useInView({ once: false, threshold: 0.25 });
  const reducedMotion = usePrefersReducedMotion();

  // Browsers ignore the muted attribute set by React, so set the property directly for autoplay.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
  }, [reducedMotion]);

  // Pause the video while it is off screen to save battery and bandwidth.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (inView) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [inView, videoReady]);

  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate -mt-16 overflow-hidden bg-sand lg:h-svh"
    >
      <div className="flex flex-col lg:block lg:h-full">
        {/* Top band (desktop): eyebrow and headline sit in the empty sand above the croissant. */}
        <div className="z-10 px-4 pt-28 pb-6 text-center lg:absolute lg:inset-x-0 lg:top-0 lg:pb-0 lg:pt-32">
          <p className="eyebrow">Roti artisan · Setiap pagi</p>
          <h1 id="hero-title" className="mx-auto mt-4 max-w-3xl text-4xl sm:text-5xl lg:text-6xl">
            Dipanggang Pagi Ini, dari Paris hingga Tokyo.
          </h1>
        </div>

        <div ref={mediaRef} className="relative aspect-video w-full lg:absolute lg:inset-0 lg:aspect-auto">
          <img
            src={HERO_MEDIA.poster}
            alt=""
            aria-hidden="true"
            fetchPriority="high"
            className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-700 lg:object-cover ${
              videoReady && !reducedMotion ? 'opacity-0' : 'opacity-100'
            }`}
          />
          {!reducedMotion && (
            <video
              ref={videoRef}
              autoPlay
              loop
              playsInline
              preload="metadata"
              poster={HERO_MEDIA.poster}
              aria-hidden="true"
              onCanPlay={() => setVideoReady(true)}
              style={{ maskImage: EDGE_MASK, WebkitMaskImage: EDGE_MASK }}
              className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-700 lg:object-cover ${
                videoReady ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <source src={HERO_MEDIA.webm} type="video/webm" />
              <source src={HERO_MEDIA.mp4} type="video/mp4" />
            </video>
          )}
        </div>

        {/* Bottom band (desktop): call to action sits in the empty sand below the croissant. */}
        <div className="z-10 flex flex-col items-center gap-6 px-4 py-8 text-center lg:absolute lg:inset-x-0 lg:bottom-0 lg:py-14">
          <p className="max-w-xl text-lg text-espresso">
            Croissant, sourdough, dan kue dari dapur kecil kami, dikirim hangat ke pintumu.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button as={Link} to="/products" size="lg">
              Lihat Menu
            </Button>
            <Button as="a" href="#cara-pesan" variant="outline" size="lg">
              Cara Pesan
            </Button>
          </div>
          <a
            href="#kategori"
            aria-label="Gulir ke bawah"
            className="mt-2 hidden rounded-full p-2 text-cocoa transition hover:text-espresso lg:block motion-safe:animate-bounce"
          >
            <ChevronDown size={22} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
