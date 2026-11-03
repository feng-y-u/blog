// Route-level placeholder for "/" while the HomePage chunk downloads.
// Matches the real splash (same dark backdrop, same breathing ✦) so the swap
// into <HomeSplash> is invisible; every other route keeps the compact skeleton.
export default function SplashFallback() {
  return (
    <div className="home-splash">
      <div className="splash-boot" aria-hidden="true">
        <span className="splash-boot-mark">✦</span>
      </div>
    </div>
  )
}
