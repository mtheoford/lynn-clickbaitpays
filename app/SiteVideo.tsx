"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { SiteLocale } from "@/lib/i18n";
import { videoPlaybackUrl } from "@/lib/video-playback";

const playLabels = {
  en: "Play video",
  fr: "Lire la vidéo",
  de: "Video abspielen",
} satisfies Record<SiteLocale, string>;

type SiteVideoProps = {
  src: string;
  title: string;
  poster: string;
  locale: SiteLocale;
  priority?: boolean;
};

export default function SiteVideo(props: SiteVideoProps) {
  // Navigation to another language/video must start with its own clean cover.
  return <SiteVideoSession key={`${props.locale}:${props.src}`} {...props} />;
}

function SiteVideoSession({ src, title, poster, locale, priority = false }: SiteVideoProps) {
  const [activated, setActivated] = useState(false);
  const playerRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (activated) playerRef.current?.focus({ preventScroll: true });
  }, [activated]);

  return (
    <div className="site-video">
      {activated ? (
        <iframe
          ref={playerRef}
          src={videoPlaybackUrl(src)}
          title={title}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          tabIndex={0}
        />
      ) : (
        <button
          className="site-video__cover"
          type="button"
          aria-label={`${playLabels[locale]}: ${title}`}
          onClick={() => setActivated(true)}
        >
          <Image
            className="site-video__poster"
            src={poster}
            alt=""
            fill
            sizes="(max-width: 900px) 100vw, 900px"
            priority={priority}
          />
          <span className="site-video__play" aria-hidden="true">
            <span className="site-video__play-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M10 6.5L22 14L10 21.5V6.5Z" fill="currentColor" />
              </svg>
            </span>
            <span className="site-video__play-label">{playLabels[locale]}</span>
          </span>
        </button>
      )}
    </div>
  );
}
