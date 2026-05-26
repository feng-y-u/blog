import SocialLinks from './SocialLinks'

const SOCIAL_ICONS = {
  github: <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>,
  bilibili: <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><ellipse cx="6.5" cy="6" rx="3.2" ry="3.8"/><ellipse cx="17.5" cy="6" rx="3.2" ry="3.8"/><rect x="2" y="5" width="20" height="16" rx="4"/><path d="M10 9.5v6l5-3-5-3z"/></svg>,
  twitter: <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  zenn: <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M.264 23.771h4.984c.264 0 .498-.147.645-.352L19.614.874c.176-.293-.029-.645-.381-.645h-4.72c-.235 0-.44.117-.557.323L.03 23.361c-.088.176.029.41.234.41zM17.445 23.419l6.48-10.688c.205-.322-.029-.733-.41-.733h-4.72c-.293 0-.557.176-.704.41l-3.373 5.62-.938 1.583c-.117.205-.117.41-.029.586l2.106 3.582c.147.264.44.41.733.41h.85c.293 0 .557-.147.704-.41l.704-1.114z"/></svg>,
  qiita: <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M4 6h16v2H4V6zm0 5h16v2H4v-2zm0 5h10v2H4v-2z"/></svg>,
  weibo: <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><circle cx="4" cy="12" r="2.5"/><circle cx="20" cy="6" r="2.5"/><circle cx="20" cy="18" r="2.5"/><path d="M6.5 13.5l11 4M17.5 6.5l-11 4"/></svg>,
  email: <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>,
  website: <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>,
}

export default function ProfileCard({ avatar, name, socialLinks, signature }) {
  return (
    <div className="profile-card">
      <div className="profile-avatar">
        <img src={avatar} alt={name} />
      </div>
      <div className="profile-name">{name}</div>
      {signature && <div className="profile-signature">{signature}</div>}
      <SocialLinks links={socialLinks} icons={SOCIAL_ICONS} />
    </div>
  )
}
