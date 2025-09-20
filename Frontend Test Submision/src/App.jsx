import React, { useState, useEffect } from 'react'


export default function App() {
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
    <div className="container">
      <header className="header">
        <h1>URL Shortener</h1>
        <p>Create short, shareable links quickly — no login required.</p>
      </header>

      <main className="main">
        <section className="card">
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

        <aside className="card history">
          <h3>Recent</h3>
          {history.length === 0 && <div className="muted">No recent short links</div>}
          <ul>
            {history.map((h, i) => (
              <li key={i}>
                <a href={h.shortLink} onClick={(e) => { e.preventDefault(); window.open(h.shortLink, '_blank') }} rel="noreferrer">{h.shortLink}</a>
                <div className="muted">{h.original} • Expires: {new Date(h.expiry).toLocaleString()}</div>
              </li>
            ))}
          </ul>
        </aside>
      </main>

      <footer className="footer">Logs are written server-side to help with debugging.</footer>
    </div>
  )
}
