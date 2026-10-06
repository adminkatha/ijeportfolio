"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";

export type PlayerVideo = {
  src: string;
  poster: string;
  width: number;
  height: number;
  title: string;
  description?: string;
  durationSec?: number;
  captions?: string;
  /** Has a soundtrack: plays with sound (the click is the user gesture). Silent recordings play muted. */
  audio?: boolean;
};

type VideoPlayerProps = {
  video: PlayerVideo;
  /** next/image sizes for the poster, matching the slot the player sits in. */
  sizes: string;
  /** Show the title/description under the player. */
  caption?: boolean;
  className?: string;
};

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

/**
 * Poster-first video. Until it is played there is no <video> element at all, only a button showing the
 * sized poster, so no video bytes load. Pressing it creates the <video> (preload="none", src set then,
 * controls, playsInline; muted only when it has no soundtrack), starts it inside the same gesture and moves
 * focus to it; the poster stays
 * on top until the first frame plays. The box keeps the video's own aspect ratio (9:16 social clips or
 * wide screen recordings), so nothing shifts.
 */
export function VideoPlayer({ video, sizes, caption = true, className = "" }: VideoPlayerProps) {
  const [state, setState] = useState<"poster" | "starting" | "playing">("poster");
  const ref = useRef<HTMLVideoElement>(null);
  const duration = video.durationSec ? clock(video.durationSec) : null;

  const start = () => {
    // Render the <video> synchronously so play() runs inside the click (iOS needs the user gesture).
    flushSync(() => setState("starting"));
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.play().catch(() => setState("playing")); // refused: reveal the native controls
  };

  const poster = <Image src={video.poster} alt="" fill sizes={sizes} className="object-cover" />;

  return (
    <figure className={className}>
      <div className="relative overflow-hidden border border-line bg-surface" style={{ aspectRatio: `${video.width} / ${video.height}` }}>
        {state !== "poster" ? (
          <video
            ref={ref}
            src={video.src}
            width={video.width}
            height={video.height}
            controls
            playsInline
            muted={!video.audio}
            preload="none"
            tabIndex={0}
            aria-label={video.title}
            onPlaying={() => setState("playing")}
            className="absolute inset-0 size-full bg-bg object-contain"
          >
            {video.captions ? <track kind="captions" src={video.captions} srcLang="en" label="English" default /> : null}
          </video>
        ) : null}
        {state === "starting" ? (
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            {poster}
          </div>
        ) : null}
        {state === "poster" ? (
          <button
            type="button"
            onClick={start}
            className="group absolute inset-0 size-full cursor-pointer"
            aria-label={`Play video: ${video.title}${duration ? ` (${duration})` : ""}`}
          >
            {poster}
            <span
              aria-hidden="true"
              className="absolute top-1/2 left-1/2 flex size-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-text/40 bg-bg text-text transition-transform duration-(--dur-1) ease-out group-hover:scale-[1.06]"
            >
              <svg viewBox="0 0 24 24" className="ml-1 size-6" fill="currentColor">
                <path d="M7 4.5v15l12.5-7.5z" />
              </svg>
            </span>
            {duration ? (
              <span aria-hidden="true" className="label-mono absolute bottom-3 left-3 bg-bg px-2 py-1 text-text">
                {duration}
              </span>
            ) : null}
          </button>
        ) : null}
      </div>
      {caption ? (
        <figcaption className="mt-3">
          <span className="block text-text">{video.title}</span>
          {video.description ? <span className="mt-1 block text-sm text-text-2">{video.description}</span> : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
