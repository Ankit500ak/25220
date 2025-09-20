
import React, { useEffect, useState } from 'react';

export default function Statics() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const backend = import.meta.env.VITE_BACKEND || 'http://localhost:4000';

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        const history = JSON.parse(localStorage.getItem('shortHistory') || '[]');
        const codes = history.map(h => {
          try {
            return h.shortLink.split('/').pop();
          } catch {
            return null;
          }
        }).filter(Boolean);
        const uniqueCodes = Array.from(new Set(codes));
        // Map code to shortLink using history
        const codeToShortLink = {};
        history.forEach(h => {
          try {
            const code = h.shortLink.split('/').pop();
            codeToShortLink[code] = h.shortLink;
          } catch {}
        });
        const results = await Promise.all(uniqueCodes.map(async code => {
          try {
            const res = await fetch(`${backend}/shorturls/${code}`);
            if (!res.ok) throw new Error('Not found');
            const data = await res.json();
            // Attach the actual shortLink
            data.shortLink = codeToShortLink[code] || data.shortLink || data.url;
            return data;
          } catch {
            return null;
          }
        }));
        setStats(results.filter(Boolean));
      } catch (e) {
        setError('Failed to load statistics');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <main className="main lr-layout" style={{justifyContent: 'center', alignItems: 'flex-start', minHeight: 320, background:'#f6f8fa', padding:'40px 0 60px 0'}}>
      <div style={{width: '100%', maxWidth: 950, margin: '0 auto', background:'#fff', borderRadius:22, boxShadow:'0 6px 32px #0001', padding:'36px 36px 28px 36px', border:'1.5px solid #e0e7ef'}}>
        <h2 style={{marginBottom: 8, fontWeight:800, color:'#2563eb', letterSpacing:0.5, fontSize:'2.2rem', textAlign:'left'}}>📊 URL Shortener Statistics</h2>
        <div style={{color:'#64748b', fontSize:'1.13rem', marginBottom:28, fontWeight:500}}>
          View all your generated short links, their usage, and a live preview of each destination.
        </div>
        {loading && <div className="muted" style={{fontSize:'1.1rem'}}>Loading statistics...</div>}
        {error && <div className="msg error">{error}</div>}
        {!loading && !error && stats.length === 0 && (
          <div className="muted" style={{fontSize:'1.1rem'}}>No statistics available. Create some short links first.</div>
        )}
        {!loading && !error && stats.length > 0 && (
          <div style={{display:'flex', flexDirection:'column', gap:'28px'}}>
            {stats.map((s, i) => (
              <div key={s.shortcode || i} style={{
                background:'#f8fafc',
                borderRadius:16,
                boxShadow:'0 2px 12px #0001',
                padding:'18px 18px 16px 18px',
                border:'1.5px solid #e0e7ef',
                display:'flex',
                flexDirection:'row',
                alignItems:'flex-start',
                gap:22,
                minHeight:160,
                maxWidth:800,
                transition:'box-shadow 0.2s',
                position:'relative',
                cursor:'pointer',
                outline:'none',
                ':hover':{boxShadow:'0 6px 24px #2563eb22'}
              }}>
                {/* Description Section (Left) */}
                <div style={{flex:2, minWidth:0, display:'flex', flexDirection:'column', gap:8}}>
                  <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:2}}>
                    <span style={{fontWeight:700, color:'#2563eb', fontSize:'1.08rem'}}>Shortened URL:</span>
                    <a href={s.shortLink || s.url} target="_blank" rel="noreferrer" style={{color:'#0ea5e9', textDecoration:'underline', wordBreak:'break-all', fontWeight:600, fontSize:'1.08rem'}}>{s.shortLink || s.url}</a>
                    <button style={{background:'linear-gradient(90deg,#2563eb 0%,#1e40af 100%)', color:'#fff', border:'none', borderRadius:6, padding:'4px 2px', width:'80px', fontWeight:600, cursor:'pointer', fontSize:'0.93rem', marginLeft:8, boxShadow:'0 1px 4px #0001', minWidth:48}} onClick={() => window.open(s.shortLink || s.url, '_blank')}>Open</button>
                  </div>
                  <div style={{display:'flex', flexWrap:'wrap', gap:18, color:'#475569', fontSize:'1.01rem', marginBottom:2}}>
                    <div><b>Shortcode:</b> {s.shortcode}</div>
                    <div><b>Created:</b> {s.createdAt ? new Date(s.createdAt).toLocaleString() : '-'}</div>
                  </div>
                  <div style={{display:'flex', flexWrap:'wrap', gap:18, color:'#475569', fontSize:'1.01rem', marginBottom:2}}>
                    <div><b>Expires:</b> {s.expiry ? new Date(s.expiry).toLocaleString() : '-'}</div>
                    <div><b>Total Clicks:</b> {s.clickCount}</div>
                  </div>
                  <div style={{marginTop:4, marginBottom:2}}>
                    <span style={{fontWeight:700, color:'#2563eb'}}>Click Details:</span>
                    {(!s.clicks || s.clicks.length === 0) ? (
                      <div className="muted" style={{marginLeft:12}}>No clicks yet.</div>
                    ) : (
                      <ul style={{marginTop:4, fontSize:'0.99rem', color:'#475569', paddingLeft:16, display:'flex', flexDirection:'column', gap:4}}>
                        {s.clicks.map((c, j) => (
                          <li key={j} style={{marginBottom:0, background:'#e0e7ef', borderRadius:7, padding:'7px 12px', fontSize:'0.98rem', marginTop:2}}>
                            <div><b>Timestamp:</b> {c.timestamp ? new Date(c.timestamp).toLocaleString() : '-'}</div>
                            <div><b>Source:</b> {c.referrer || 'Direct/Unknown'}</div>
                            <div><b>Location:</b> {c.geo || 'Unknown'}</div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                {/* Iframe Preview (Right) */}
                <div
                  style={{
                    flex: '0 0 160px',
                    maxWidth: 160,
                    minWidth: 120,
                    marginLeft: 16,
                    border: '1.5px solid #e0e7ef',
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: 90,
                    height: 90,
                    boxShadow: '0 2px 8px #0002',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.boxShadow = '0 6px 24px #2563eb22';
                    e.currentTarget.style.transform = 'scale(1.08)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.boxShadow = '0 2px 8px #0002';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  title="Preview of destination URL"
                >
                  <iframe
                    src={s.url}
                    title={`preview-${s.shortcode || i}`}
                    style={{
                      width: '700%',
                      height: '600%',
                      border: 'none',
                      background: '#fff',
                      display: 'block',
                      overflow: 'hidden',
                      borderRadius: '12px',
                      transition: 'box-shadow 0.2s',
                    }}
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    loading="lazy"
                    scrolling="no"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="muted" style={{marginTop:32, fontSize:'1.07rem', textAlign:'center'}}>Feature requirements as per project instructions.</div>
      </div>
    </main>
  );
}
