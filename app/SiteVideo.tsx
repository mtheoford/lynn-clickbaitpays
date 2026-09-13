type SiteVideoProps = {
  poster: string;
  src: string;
  title: string;
};

export default function SiteVideo({ poster, src, title }: SiteVideoProps) {
  return (
    <div className="site-video">
      <video controls playsInline preload="metadata" poster={poster} aria-label={title}>
        <source src={src} type="video/mp4" />
      </video>
    </div>
  );
}
