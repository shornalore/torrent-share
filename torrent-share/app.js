/* app.js - React code for P2P File Share (revised with new features) */

const { useState, useEffect, useRef } = React;

/******************** Theme Switcher Component ********************/
function ThemeSwitcher() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('color-scheme') || 
           (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-color-scheme', theme);
    localStorage.setItem('color-scheme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return React.createElement('button', {
    className: 'theme-switcher',
    onClick: toggleTheme,
    'aria-label': `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`,
    title: `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`
  }, theme === 'dark' ? '☀️' : '🌙');
}

/******************** Copy Button Component ********************/
function CopyButton({ text, onCopy }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (onCopy) onCopy();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return React.createElement('button', {
    className: `btn btn--accent copy-button ${copied ? 'copied' : ''}`,
    onClick: handleCopy,
    disabled: !text
  }, copied ? 'Copied!' : 'Copy Magnet Link');
}

/******************** Utility Components ********************/
function ProgressBar({ progress }) {
  return React.createElement('div', { className: 'progress-bar' },
    React.createElement('div', {
      className: 'progress-bar__fill',
      style: { width: `${(progress * 100).toFixed(1)}%` }
    })
  );
}

function TorrentItem({ torrent, type }) {
  const progress = torrent.progress || 0;
  const peers = torrent.numPeers || 0;
  const downloadSpeed = torrent.downloadSpeed || 0;
  const uploadSpeed = torrent.uploadSpeed || 0;

  return React.createElement('div', { className: 'torrent-item animate-in' },
    React.createElement('div', { className: 'torrent-header' },
      React.createElement('strong', null, torrent.name || torrent.infoHash),
      React.createElement('span', { className: 'status-text' }, `${(progress * 100).toFixed(1)}%`)
    ),
    React.createElement(ProgressBar, { progress }),
    React.createElement('div', { className: 'torrent-stats' },
      `Peers: ${peers} | ↓ ${(downloadSpeed / 1024).toFixed(1)} kB/s | ↑ ${(uploadSpeed / 1024).toFixed(1)} kB/s`
    ),
    type === 'share' && torrent.magnetURI && React.createElement('div', { className: 'magnet-section' },
      React.createElement(CopyButton, { 
        text: torrent.magnetURI,
        onCopy: () => console.log('Magnet link copied!')
      }),
      React.createElement('details', { className: 'magnet-details' },
        React.createElement('summary', { className: 'status-text' }, 'View Magnet Link'),
        React.createElement('code', { 
          className: 'magnet-link',
          style: { wordBreak: 'break-all', fontSize: 'var(--font-size-xs)' } 
        }, torrent.magnetURI)
      )
    )
  );
}

/******************** Share Section ********************/
function ShareSection({ client }) {
  const [torrents, setTorrents] = useState([]);
  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  // Periodic update
  useEffect(() => {
    const id = setInterval(() => setTorrents((prev) => [...prev]), 1000);
    return () => clearInterval(id);
  }, []);

  const onFiles = (files) => {
    if (!files || files.length === 0) return;

    client.seed(Array.from(files), (torrent) => {
      setTorrents((prev) => [...prev, torrent]);
    });
  };

  useEffect(() => {
    const dz = dropRef.current;
    if (!dz) return;

    const stopDefaults = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const highlight = () => dz.classList.add('dragover');
    const unhighlight = () => dz.classList.remove('dragover');

    ['dragenter', 'dragover'].forEach((evt) => dz.addEventListener(evt, highlight));
    ['dragleave', 'drop'].forEach((evt) => dz.addEventListener(evt, unhighlight));
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((evt) => dz.addEventListener(evt, stopDefaults));

    dz.addEventListener('drop', (e) => onFiles(e.dataTransfer.files));

    return () => {
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((evt) => {
        dz.removeEventListener(evt, stopDefaults);
        dz.removeEventListener(evt, highlight);
        dz.removeEventListener(evt, unhighlight);
      });
      dz.removeEventListener('drop', (e) => onFiles(e.dataTransfer.files));
    };
  }, []);

  return React.createElement('section', { className: 'section section-enhanced animate-in' },
    React.createElement('div', { className: 'section-header' },
      React.createElement('h2', null, 'Share Files'),
      React.createElement('p', { className: 'section-subtitle' }, 'Drag & drop files or click to select')
    ),
    React.createElement('div', { className: 'drop-zone enhanced-drop-zone', ref: dropRef },
      React.createElement('div', { className: 'drop-zone-content' },
        React.createElement('div', { className: 'drop-zone-icon' }, '📁'),
        React.createElement('label', {
          htmlFor: 'file-input',
          className: 'drop-zone-label'
        }, 'Drag & Drop files here or click to select'),
        React.createElement('input', {
          id: 'file-input',
          ref: fileInputRef,
          type: 'file',
          multiple: true,
          className: 'file-input-hidden',
          onChange: (e) => onFiles(e.target.files)
        })
      )
    ),
    torrents.length > 0 && React.createElement('div', { className: 'torrent-list' },
      torrents.map((t) => React.createElement(TorrentItem, { key: t.infoHash, torrent: t, type: 'share' }))
    )
  );
}

/******************** Download Section ********************/
function DownloadSection({ client }) {
  const inputRef = useRef(null);
  const [torrents, setTorrents] = useState([]);
  const [error, setError] = useState('');

  // Periodic update
  useEffect(() => {
    const id = setInterval(() => setTorrents((prev) => [...prev]), 1000);
    return () => clearInterval(id);
  }, []);

  const isValidMagnet = (magnet) => magnet.startsWith('magnet:?xt=urn:btih:') && magnet.length > 25;

  const handleDownload = () => {
    const magnetLink = inputRef.current.value.trim();

    if (!magnetLink) {
      setError('Please enter a magnet link');
      return;
    }

    if (!isValidMagnet(magnetLink)) {
      setError('Invalid magnet link');
      return;
    }

    try {
      const torrent = client.add(magnetLink, (t) => {
        t.files.forEach((file) => {
          file.getBlobURL((err, url) => {
            if (err) return console.error(err);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          });
        });
      });

      setTorrents((prev) => [...prev, torrent]);
      inputRef.current.value = '';
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to download torrent');
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') handleDownload();
  };

  return React.createElement('section', { className: 'section section-enhanced animate-in' },
    React.createElement('div', { className: 'section-header' },
      React.createElement('h2', null, 'Download Files'),
      React.createElement('p', { className: 'section-subtitle' }, 'Paste a magnet link to download')
    ),
    React.createElement('div', { className: 'download-form' },
      React.createElement('div', { className: 'input-group' },
        React.createElement('input', {
          ref: inputRef,
          type: 'text',
          className: 'form-control enhanced-input',
          placeholder: 'magnet:?xt=urn:btih:...',
          onKeyDown: handleKey
        }),
        React.createElement('button', { 
          className: 'btn btn--accent download-btn', 
          onClick: handleDownload 
        }, 'Download')
      )
    ),
    error && React.createElement('div', { className: 'error-banner animate-in' }, error),
    torrents.length > 0 && React.createElement('div', { className: 'torrent-list' },
      torrents.map((t) => React.createElement(TorrentItem, { key: t.infoHash, torrent: t, type: 'download' }))
    )
  );
}

/******************** Main App ********************/
function App() {
  const [client, setClient] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!WebTorrent.WEBRTC_SUPPORT) {
      setError('WebRTC is not supported in this browser.');
      return;
    }

    const c = new WebTorrent();
    setClient(c);

    return () => c.destroy();
  }, []);

  if (error) {
    return React.createElement('div', { className: 'container py-16' },
      React.createElement('div', { className: 'error-banner' }, error)
    );
  }

  if (!client) {
    return React.createElement('div', { className: 'container py-16 loading' }, 
      React.createElement('div', { className: 'loading-text' }, 'Loading...')
    );
  }

  return React.createElement('div', { className: 'app-container' },
    React.createElement(ThemeSwitcher),
    React.createElement('div', { className: 'container' },
      React.createElement('header', { className: 'app-header animate-in' },
        React.createElement('h1', null, 'Torrent-Share'),
        React.createElement('p', { className: 'app-subtitle' }, 'Minimal P2P File Sharing')
      ),
      React.createElement('div', { className: 'main-grid enhanced-grid' },
        React.createElement(ShareSection, { client }),
        React.createElement(DownloadSection, { client })
      )
    )
  );
}

/******************** Render ********************/
ReactDOM.render(React.createElement(App), document.getElementById('root'));
