import { useEffect, useRef } from "react";
import videoAsset from "@/assets/gm7-promo-web.mp4.asset.json";
import posterAsset from "@/assets/gm7-promo-poster.jpg.asset.json";

const AUDIO_FLAG = "hasPlayedGm7BannerAudio";

export function AnnouncementBar() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let active = true;
    let canTryAudio = window.localStorage.getItem(AUDIO_FLAG) !== "true";

    const play = async (withAudio: boolean) => {
      video.muted = !withAudio;
      try {
        await video.play();
        if (withAudio) window.localStorage.setItem(AUDIO_FLAG, "true");
      } catch {
        if (!active) return;
        video.muted = true;
        try {
          await video.play();
        } catch {
          // A direct gesture may still be required by the browser.
        }
      }
    };

    const tryAudioOnce = () => {
      if (!canTryAudio) return;
      canTryAudio = false;
      void play(true);
    };

    const muteAfterFirstLoop = () => {
      if (lastTimeRef.current > video.currentTime + 0.5) video.muted = true;
      lastTimeRef.current = video.currentTime;
    };

    const muteForOtherMedia = (event: Event) => {
      const target = event.target;
      if (target instanceof HTMLMediaElement && target !== video && !target.muted) {
        video.muted = true;
      }
    };

    video.addEventListener("timeupdate", muteAfterFirstLoop);
    document.addEventListener("play", muteForOtherMedia, true);
    window.addEventListener("pointerdown", tryAudioOnce, { once: true });
    window.addEventListener("keydown", tryAudioOnce, { once: true });
    void play(canTryAudio);

    return () => {
      active = false;
      video.removeEventListener("timeupdate", muteAfterFirstLoop);
      document.removeEventListener("play", muteForOtherMedia, true);
      window.removeEventListener("pointerdown", tryAudioOnce);
      window.removeEventListener("keydown", tryAudioOnce);
    };
  }, []);

  return (
    <>
      <div className="announcement-strip" role="status">
        <span className="announcement-dot" aria-hidden="true" />
        <span>GM7 COMMUNITY • جديدنا يجمع اللعب، المنافسة والسوق في مكان واحد</span>
      </div>
      <aside className="announcement-video-banner" aria-label="فيديو GM7 الترويجي">
        <video
          ref={videoRef}
          src={videoAsset.url}
          poster={posterAsset.url}
          autoPlay
          loop
          playsInline
          preload="metadata"
          className="h-full w-full object-cover object-center"
          aria-label="فيديو GM7 الترويجي"
        />
      </aside>
    </>
  );
}