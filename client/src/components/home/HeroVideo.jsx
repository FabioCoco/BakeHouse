import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import Button from '../ui/Button.jsx';
import useInView from '../../hooks/useInView.js';
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion.js';
import { HERO_MEDIA } from '../../config/hero.js';

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
    // Desktop: a vertical stack (headline, video, copy). Mobile keeps its own stacked layout.
    <section
      aria-labelledby="hero-title"
      className="relative isolate -mt-16 overflow-hidden bg-[#D8BDA2] lg:h-[min(100svh,920px)]"
    >
      <div className="flex flex-col lg:h-full">
        {/* Eyebrow and headline at the top. The -mt-16 on the section starts the hero under the navbar, so the top padding clears it. */}
        <div className="z-10 px-4 pt-28 pb-6 text-center lg:shrink-0 lg:px-6 lg:pt-24 lg:pb-10">
          {/* Sits on the sand background, where the cocoa eyebrow colour falls below AA contrast. */}
          <p className="eyebrow text-espresso">Artisan bread · Baked every morning</p>
          <h1
            id="hero-title"
            className="mx-auto mt-4 max-w-3xl text-4xl sm:text-5xl lg:mt-5 lg:max-w-[1400px] lg:text-[clamp(2.5rem,4vw,3.5rem)] lg:leading-[1.08]"
          >
            Baked this morning, from Paris to Tokyo.
          </h1>
        </div>

        {/* The frame is exactly the video's 16:9 box, so the edge fade (hero-frame-mask in index.css) lands on the video's own edges. */}
        <div className="w-full lg:flex lg:min-h-0 lg:flex-1 lg:justify-center">
          <div
            ref={mediaRef}
            className="hero-frame-mask relative aspect-video w-full lg:aspect-video lg:h-full lg:w-auto lg:max-w-[1400px]"
          >
            <img
              src={HERO_MEDIA.poster}
              alt=""
              aria-hidden="true"
              fetchPriority="high"
              className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-700 ${
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
                className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-700 ${
                  videoReady ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <source src={HERO_MEDIA.webm} type="video/webm" />
                <source src={HERO_MEDIA.mp4} type="video/mp4" />
              </video>
            )}
          </div>
        </div>

        {/* Copy and CTAs sit below the video box. The 24px top padding keeps them clear of the croissant and its shadow. */}
        <div className="z-10 flex flex-col items-center gap-6 px-4 py-8 text-center lg:shrink-0 lg:gap-4 lg:px-6 lg:pt-6 lg:pb-4">
          <p className="max-w-xl text-lg text-espresso">
            Croissants, sourdough, and cakes from our small kitchen, delivered warm to your door.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button as={Link} to="/products" size="lg">
              View menu
            </Button>
            <Button as="a" href="#cara-pesan" variant="outline" size="lg">
              How to order
            </Button>
          </div>
          <a
            href="#kategori"
            aria-label="Scroll down"
            className="mt-2 hidden rounded-full p-2 text-cocoa transition hover:text-espresso lg:block motion-safe:animate-bounce"
          >
            <ChevronDown size={22} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
