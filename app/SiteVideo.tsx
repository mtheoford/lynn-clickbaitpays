type SiteVideoProps = {
  src: string;
  title: string;
};

export default function SiteVideo({ src, title }: SiteVideoProps) {
  return (
    <div className="site-video">
      <video controls playsInline preload="metadata" aria-label={title}>
        <source src={src} type="video/mp4" />
      </video>
    </div>
  );
}
