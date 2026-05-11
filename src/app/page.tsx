export default function HomePage() {
  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .yt-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          color: #0a0a0a;
          border: none;
          border-radius: 12px;
          padding: 12px 22px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          transition: opacity 0.15s ease;
          font-family: inherit;
        }
        .yt-btn:hover { opacity: 0.88; }
      `}</style>
      <main
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #090909 0%, #131313 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1rem',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.92)',
              letterSpacing: '-0.03em',
              marginBottom: '10px',
            }}
          >
            GuideMaxxing
          </h1>
          <p
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.45)',
              marginBottom: '20px',
              letterSpacing: '-0.01em',
            }}
          >
            Free guides, scripts &amp; tools for gamers
          </p>
          <p
            style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.35)',
              lineHeight: '1.7',
              marginBottom: '32px',
              maxWidth: '380px',
              margin: '0 auto 32px',
            }}
          >
            I create tutorials and share free downloads for GTA Online, modding,
            emulation, and more. All resources on this site are free — just
            complete a quick task to access them.
          </p>
          <a
            href="https://www.youtube.com/channel/UCxz-dL1nRU4rAiSn45N7-jA/"
            target="_blank"
            rel="noopener noreferrer"
            className="yt-btn"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"/>
              <path fill="white" d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            Visit YouTube Channel
          </a>
        </div>
      </main>
    </>
  )
}
