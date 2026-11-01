import { useEffect, useState } from 'react';

function Icon({ name, size = 18 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const shapes = {
    link: <><path d="M10 13a5 5 0 0 0 7.07 0l3-3A5 5 0 0 0 13 2.93l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3A5 5 0 0 0 11 21.07l1.71-1.71"/></>,
    arrow: <><path d="M7 17 17 7M7 7h10v10"/></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></>,
    chart: <><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-5 5"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    sparkle: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/><path d="m19 14 1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14Z"/></>,
    check: <><path d="m5 12 4 4L19 6"/></>,
  };
  return <svg {...common}>{shapes[name] || shapes.link}</svg>;
}

function App() {
  const [urls, setUrls] = useState([]);
  const [destination, setDestination] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [apiStatus, setApiStatus] = useState('loading');

  const notify = (message) => { setToast(message); window.clearTimeout(notify.timer); notify.timer = window.setTimeout(() => setToast(''), 2600); };
  const copy = async (value) => {
    try { await navigator.clipboard.writeText(value); notify('Copied to clipboard'); }
    catch { notify('Could not copy. Select and copy the link instead.'); }
  };

  const loadLinks = () => fetch('/url')
    .then((response) => {
      if (!response.ok) throw new Error('The links service is unavailable.');
      return response.json();
    })
    .then((data) => { if (Array.isArray(data)) { setUrls(data); setApiStatus('ready'); } })
    .catch(() => setApiStatus('offline'));
  useEffect(() => { loadLinks(); }, []);

  async function createLink(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch('/url', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ Url: destination.trim() }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'We could not create that link.');
      const generated = `${window.location.origin}/${data.id}`;
      setShortUrl(generated);
      setDestination('');
      notify('Your short link is ready');
      loadLinks();
    } catch (error) { notify(error.message || 'Something went wrong. Please try again.'); }
    finally { setBusy(false); }
  }

  const clickCount = urls.reduce((total, url) => total + (url.visitHistory?.length || 0), 0);
  const shortId = (url) => url.shortId || url.shortIdL;
  const targetUrl = (url) => url.redirectUrl || url.redirectURL || '';
  const visibleUrls = urls
    .filter((url) => `${shortId(url) || ''} ${targetUrl(url)}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => sortBy === 'popular'
      ? (b.visitHistory?.length || 0) - (a.visitHistory?.length || 0)
      : new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const today = new Date();
  const activityDays = Array.from({ length: 7 }, (_, offset) => {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - offset));
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    const visits = urls.reduce((total, url) => total + (url.visitHistory || []).filter((visit) => {
      const timestamp = Number(visit.timestamp);
      return Number.isFinite(timestamp) && timestamp >= date.getTime() && timestamp < nextDay.getTime();
    }).length, 0);
    return { label: new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(date), date, visits };
  });
  const peakActivity = Math.max(...activityDays.map((day) => day.visits), 0);
  const bestDay = activityDays.reduce((best, day) => day.visits > best.visits ? day : best, activityDays[0]);
  const topLinks = [...urls].sort((a, b) => (b.visitHistory?.length || 0) - (a.visitHistory?.length || 0)).slice(0, 3);

  function exportCsv() {
    if (!urls.length) { notify('Create a link before exporting your collection'); return; }
    const rows = [['Short URL', 'Destination URL', 'Visits', 'Created']];
    urls.forEach((url) => rows.push([
      `${window.location.origin}/${shortId(url) || ''}`,
      targetUrl(url),
      String(url.visitHistory?.length || 0),
      url.createdAt ? new Date(url.createdAt).toISOString() : '',
    ]));
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const file = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const downloadUrl = URL.createObjectURL(file);
    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.download = 'linklet-links.csv';
    anchor.click();
    URL.revokeObjectURL(downloadUrl);
    notify('Your link report has been downloaded');
  }

  return <div className="site-shell">
    <header className="site-header">
      <a className="wordmark" href="#home" aria-label="Linklet home"><span className="logo-symbol"><Icon name="link" size={16}/></span>linklet<span className="wordmark-period">.</span></a>
      <nav className="main-nav" aria-label="Main navigation"><a className="nav-current" href="#home">Workspace</a><a href="#links">Your links <span>{urls.length}</span></a><a href="#insights">Insights</a></nav>
      <button className="account-button" type="button"><span className="account-avatar">S</span><span className="account-name">My workspace</span><span className="account-chevron">⌄</span></button>
    </header>

    <main id="home" className="page-container">
      <section className="welcome-row">
        <div className="welcome-copy"><div className="eyebrow"><span className="eyebrow-line"/>YOUR LINKS, IN GOOD SHAPE</div><h1>Make every link<br/><span>feel intentional.</span></h1><p className="welcome-description">Shorten the long ones. Keep the useful ones close.<br className="desktop-break"/> See what happens after you share.</p></div>
        <div className="hero-art" aria-hidden="true"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="art-dot dot-one"/><div className="art-dot dot-two"/><div className="art-card"><span className="art-card-icon"><Icon name="link" size={17}/></span><span className="art-card-line line-long"/><span className="art-card-line line-short"/><span className="art-card-arrow"><Icon name="arrow" size={16}/></span></div><div className="art-tag">good things travel</div></div>
      </section>

      <section className="shorten-panel" id="shorten" aria-labelledby="shorten-title">
        <div className="panel-topline"><div><div className="panel-kicker">A LITTLE LESS URL</div><h2 id="shorten-title">Shorten a link</h2></div><span className="secure-note"><span className="secure-dot"/>Free, fast, no fuss</span></div>
        <form className="shorten-form" onSubmit={createLink}><label className="url-entry"><span className="input-link-icon"><Icon name="link" size={19}/></span><span className="input-divider"/><input type="url" aria-label="Long URL" placeholder="Paste your long URL here" value={destination} onChange={(event) => setDestination(event.target.value)} required/><span className="input-protocol">HTTPS</span></label><button className="shorten-button" type="submit" disabled={busy}>{busy ? 'Making link…' : <>Make it short <Icon name="arrow" size={16}/></>}</button></form>
        <div className="panel-foot"><span>Works with any valid web address</span><span className="keyboard-hint">↵ <span>press enter to create</span></span></div>
        {shortUrl && <div className="created-link"><div className="created-check"><Icon name="check" size={15}/></div><div className="created-copy"><span>Your new short link</span><a href={shortUrl} target="_blank" rel="noreferrer">{shortUrl}</a></div><button className="copy-button" onClick={() => copy(shortUrl)} type="button"><Icon name="copy" size={15}/> Copy</button></div>}
      </section>

      <section className="overview-strip" id="insights" aria-label="Workspace overview"><div className="overview-title"><span className="overview-icon"><Icon name="sparkle" size={17}/></span><span>At a glance</span></div><div className="overview-metric"><strong>{urls.length.toLocaleString()}</strong><span>links made</span></div><div className="overview-metric"><strong>{clickCount.toLocaleString()}</strong><span>visits so far</span></div><div className="overview-note">Your little corner of the internet <span>↗</span></div></section>

      <section className="insights-grid" aria-label="Link insights">
        <article className="insight-card activity-card"><div className="insight-card-heading"><div><div className="eyebrow"><span className="eyebrow-line"/>LAST 7 DAYS</div><h3>Click activity</h3></div><span className="insight-total">{activityDays.reduce((total, day) => total + day.visits, 0)} <small>visits</small></span></div>
          <div className="activity-chart" role="img" aria-label={`Daily link visits over the past seven days. Peak: ${peakActivity} visits.`}>{activityDays.map((day) => <div className="activity-day" key={day.date.toISOString()}><span className="activity-count">{day.visits || ''}</span><div className="activity-track"><div className={`activity-bar ${day.visits ? 'has-visits' : ''}`} style={{ height: `${day.visits ? Math.max(12, (day.visits / Math.max(peakActivity, 1)) * 100) : 5}%` }}/></div><span className="activity-label">{day.label}</span></div>)}</div>
          <div className="insight-footnote">{peakActivity ? <><span className="footnote-dot"/>Most active day: <strong>{bestDay.label}</strong> with {bestDay.visits} {bestDay.visits === 1 ? 'visit' : 'visits'}</> : 'Click activity will appear here as people visit your links.'}</div>
        </article>
        <article className="insight-card top-links-card"><div className="insight-card-heading"><div><div className="eyebrow"><span className="eyebrow-line"/>YOUR TOP PERFORMERS</div><h3>Popular links</h3></div><a className="mini-link" href="#links">All links ↗</a></div>
          {topLinks.length && (topLinks[0].visitHistory?.length || 0) > 0 ? <div className="top-links-list">{topLinks.filter((url) => (url.visitHistory?.length || 0) > 0).map((url) => <div className="top-link-item" key={url._id || shortId(url)}><span className="top-link-symbol"><Icon name="link" size={14}/></span><span className="top-link-name">{shortId(url) || 'Short link'}<small>{targetUrl(url)}</small></span><strong>{url.visitHistory.length}<small> visits</small></strong></div>)}</div> : <div className="insight-empty"><span className="insight-empty-mark"><Icon name="chart" size={17}/></span><span><strong>No visits yet</strong><small>Share a link to start seeing what resonates.</small></span></div>}
        </article>
      </section>

      <section className="links-section" id="links"><div className="links-heading"><div><div className="eyebrow"><span className="eyebrow-line"/>THE COLLECTION</div><h2>Your links<span className="heading-count">{String(urls.length).padStart(2, '0')}</span><small className="collection-subtitle">A tidy place for everything you share.</small></h2></div><div className="collection-actions"><button className="export-button" onClick={exportCsv} type="button" disabled={!urls.length}>Export CSV <Icon name="arrow" size={14}/></button><button className="text-action" onClick={() => document.querySelector('input[aria-label="Long URL"]')?.focus()} type="button"><Icon name="plus" size={16}/> New link</button></div></div>
        {urls.length > 0 && <div className="collection-tools"><label className="search-box"><span className="search-glyph">⌕</span><input aria-label="Search links" placeholder="Search links or destinations" value={query} onChange={(event) => setQuery(event.target.value)}/>{query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search">×</button>}</label><label className="sort-control"><span>Sort</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="newest">Most recent</option><option value="popular">Most visited</option></select></label><button className="refresh-button" onClick={loadLinks} type="button" title="Refresh links" aria-label="Refresh links">↻</button></div>}
        {apiStatus === 'offline' && <div className="api-notice" role="status"><span><strong>Can’t reach your links right now.</strong> Check that the server and database are running.</span><button type="button" onClick={loadLinks}>Try again</button></div>}
        {urls.length ? visibleUrls.length ? <div className="link-list"><div className="list-labels"><span>SHORT LINK</span><span>POINTS TO</span><span>VISITS</span><span>CREATED</span><span/></div>{visibleUrls.map((url, index) => {
          const id = shortId(url); const fullShortUrl = `${window.location.origin}/${id}`;
          return <article className="link-row" key={url._id || id || index}><div className="link-main"><span className="link-row-icon"><Icon name="link" size={15}/></span><div><a className="link-slug" href={`/${id}`} target="_blank" rel="noreferrer">{id || 'pending'}</a><span className="link-domain">{window.location.host}/{id}</span></div></div><a className="destination-link" href={targetUrl(url)} target="_blank" rel="noreferrer" title={targetUrl(url)}>{targetUrl(url) || '—'}<Icon name="arrow" size={13}/></a><span className="visit-count"><Icon name="chart" size={14}/>{url.visitHistory?.length || 0}</span><span className="created-date">{url.createdAt ? new Date(url.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</span><button className="icon-button" onClick={() => copy(fullShortUrl)} type="button" aria-label="Copy short link"><Icon name="copy" size={16}/></button></article>;
        })}</div> : <div className="empty-links"><div className="empty-icon"><Icon name="link" size={20}/></div><div><strong>No links match that search.</strong><p>Try another short code or destination address.</p></div><button className="clear-search" onClick={() => setQuery('')} type="button">Clear search</button></div> : apiStatus === 'loading' ? <div className="empty-links"><div className="empty-icon"><span className="loading-mark"/></div><div><strong>Loading your collection…</strong><p>Your saved links will appear here.</p></div></div> : <div className="empty-links"><div className="empty-icon"><Icon name="link" size={20}/></div><div><strong>A fresh start.</strong><p>Shorten your first URL above and your collection will begin here.</p></div><span className="empty-arrow">↗</span></div>}
      </section>
      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand-block"><a className="wordmark footer-wordmark" href="#home"><span className="logo-symbol"><Icon name="link" size={16}/></span>linklet<span className="wordmark-period">.</span></a><p>Thoughtful little links for the things worth sharing.</p></div>
          <div className="footer-column"><h3>Explore</h3><a href="#shorten">Shorten a link <Icon name="arrow" size={12}/></a><a href="#insights">Insights <Icon name="arrow" size={12}/></a><a href="#links">Your collection <Icon name="arrow" size={12}/></a></div>
          <div className="footer-column"><h3>Your workspace</h3><button type="button" onClick={loadLinks}>Refresh your links <span>↻</span></button><button type="button" onClick={exportCsv}>Export link report <Icon name="arrow" size={12}/></button></div>
        </div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} Linklet. All rights reserved.</span><a href="#home">Back to top ↑</a><span className="footer-signoff">Made for links worth sharing.</span></div>
      </footer>
    </main>
    <div className={`toast ${toast ? 'show' : ''}`} role="status">{toast}</div>
  </div>;
}

export default App;
