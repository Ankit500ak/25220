
import React, { useState, useEffect } from 'react'
import Statics from './Statics';


export default function App() {
  const [activeTab, setActiveTab] = useState('shortener');
  const [url, setUrl] = useState('')
  const [shortcode, setShortcode] = useState('')
  const [validity, setValidity] = useState('')
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])
  const backend = import.meta.env.VITE_BACKEND || 'http://localhost:4000'

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('shortHistory') || '[]')
      setHistory(saved)
    } catch (e) {
      setHistory([])
    }
  }, [])

  function saveToHistory(entry) {
    const next = [entry, ...history].slice(0, 20)
    setHistory(next)
    localStorage.setItem('shortHistory', JSON.stringify(next))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage(null)
    setResult(null)
    if (!url) return setMessage({ type: 'error', text: 'Please enter a URL' })
    setLoading(true)
    try {
      const body = { url }
      if (shortcode) body.shortcode = shortcode
      if (validity) body.validity = parseInt(validity, 10)

      const res = await fetch(`${backend}/shorturls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Unknown error' })
      } else {
        setResult(data)
        setMessage({ type: 'success', text: 'Short link created' })
        saveToHistory({ shortLink: data.shortLink, expiry: data.expiry, original: url })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  function copy(text) {
    try { navigator.clipboard.writeText(text); setMessage({ type: 'success', text: 'Copied to clipboard' }) } catch (e) { setMessage({ type: 'error', text: 'Copy failed' }) }
  }

  return (

    
    <>
      <nav className="navbar">
        <div className="navbar-content">
          <span className="navbar-logo">🔗 Shortly</span>
          <div className="navbar-tabs">
            <button
              className={activeTab === 'shortener' ? 'tab-btn active' : 'tab-btn'}
              onClick={() => setActiveTab('shortener')}
            >Shortener</button>
            <button
              className={activeTab === 'stats' ? 'tab-btn active' : 'tab-btn'}
              onClick={() => setActiveTab('stats')}
            >Statistics</button>
          </div>
        </div>
      </nav>
      <div className="container">
      {activeTab === 'shortener' && (
        <header className="header">
          <h1>URL Shortener</h1>
          <p>Create short, shareable links quickly — no login required.</p>
        </header>
      )}

      {activeTab === 'shortener' && (
        <main className="main lr-layout">
          <section className="card generator-card">
            <form onSubmit={handleSubmit} className="form">
              <label>Original URL</label>
              <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/page" />

              <div className="row">
                <div style={{flex:1}}>
                  <label>Custom Shortcode (optional)</label>
                  <input value={shortcode} onChange={e => setShortcode(e.target.value)} placeholder="abcd1" />
                </div>
                <div style={{width:120}}>
                  <label>Validity (min)</label>
                  <input value={validity} onChange={e => setValidity(e.target.value)} placeholder="30" />
                </div>
              </div>

              <div className="actions">
                <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Short Link'}</button>
                <button type="button" className="secondary" onClick={() => { setUrl(''); setShortcode(''); setValidity(''); setMessage(null); setResult(null) }}>Clear</button>
              </div>
            </form>

            {message && (
              <div className={`msg ${message.type}`}>{message.text}</div>
            )}

            {result && (
              <div className="result">
                  <div className="result-link"><a href={result.shortLink} onClick={(e) => { e.preventDefault(); window.open(result.shortLink, '_blank') }} rel="noreferrer">{result.shortLink}</a></div>
                <div className="result-meta">Expires: {new Date(result.expiry).toLocaleString()}</div>
                <div className="result-actions"><button onClick={() => copy(result.shortLink)}>Copy</button></div>
                <div className="muted" style={{marginTop:6,fontSize:12}}>Note: link opens in a new tab to avoid replacing this app.</div>
              </div>
            )}
          </section>

          <aside className="card history recent-card" style={{padding:'22px 20px 18px 20px', background:'#f8fafc', boxShadow:'0 2px 8px #0001', borderRadius:14, marginTop:24}}>
            <h3 style={{marginBottom:18, fontWeight:600, color:'#2563eb', letterSpacing:0.5}}>Recent Short Links</h3>
            {history.length === 0 && <div className="muted">No recent short links</div>}
            <ul className="recent-list" style={{listStyle:'none', padding:0, margin:0}}>
              {history.map((h, i) => (
                <li key={i} className="recent-item" style={{background:'#fff', borderRadius:10, boxShadow:'0 1px 4px #0001', marginBottom:14, padding:'14px 16px', display:'flex', flexDirection:'column', gap:6}}>
                  <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:8}}>
                    <a href={h.shortLink} onClick={(e) => { e.preventDefault(); window.open(h.shortLink, '_blank') }} rel="noreferrer" style={{fontWeight:500, color:'#0ea5e9', fontSize:'1.08rem', textDecoration:'underline', wordBreak:'break-all'}}>{h.shortLink}</a>
                    <button className="copy-btn" title="Copy link" onClick={() => copy(h.shortLink)} style={{background:'#2563eb', color:'#fff', border:'none', borderRadius:6, padding:'6px 14px', fontWeight:500, cursor:'pointer', fontSize:'0.98rem', transition:'background 0.2s'}}>Copy</button>
                  </div>
                  <div style={{display:'flex', flexWrap:'wrap', alignItems:'center', gap:10, fontSize:'0.98rem', color:'#475569', marginTop:2}}>
                    <span style={{maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}} title={h.original}><b>Original:</b> {h.original}</span>
                    <span style={{color:'#cbd5e1'}}>•</span>
                    <span><b>Expires:</b> {new Date(h.expiry).toLocaleString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        </main>
      )}
      {activeTab === 'stats' && <Statics />}

      <footer className="footer">Logs are written server-side to help with debugging.</footer>
    </div>
    </>
  )
}
