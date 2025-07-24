/* app.js - React code for P2P File Share (revised) */

const { useState, useEffect, useRef } = React;

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

  return React.createElement('div', { className: 'torrent-item' },
    React.createElement('div', { className: 'torrent-header' },
      React.createElement('strong', null, torrent.name || torrent.infoHash),
      React.createElement('span', { className: 'status-text' }, `${(progress * 100).toFixed(1)}%`)
    ),
    React.createElement(ProgressBar, { progress }),
    React.createElement('div', { className: 'status-text' },
      `Peers: ${peers} | ↓ ${(downloadSpeed / 1024).toFixed(1)} kB/s | ↑ ${(uploadSpeed / 1024).toFixed(1)} kB/s`
    ),
    type === 'share' && torrent.magnetURI && React.createElement('details', null,
      React.createElement('summary', { className: 'status-text' }, 'Magnet Link'),
      React.createElement('code', { style: { wordBreak: 'break-all', fontSize: 'var(--font-size-xs)' } }, torrent.magnetURI)
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

  return React.createElement('section', { className: 'section' },
    React.createElement('h2', null, 'Share Files'),
    React.createElement('div', { className: 'drop-zone', ref: dropRef },
      React.createElement('label', {
        htmlFor: 'file-input',
        style: { width: '100%', cursor: 'pointer' }
      }, 'Drag & Drop files here or click to select'),
      React.createElement('input', {
        id: 'file-input',
        ref: fileInputRef,
        type: 'file',
        multiple: true,
        style: { position: 'absolute', left: '-10000px' },
        onChange: (e) => onFiles(e.target.files)
      })
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

  return React.createElement('section', { className: 'section' },
    React.createElement('h2', null, 'Download Files'),
    React.createElement('div', { className: 'flex gap-8' },
      React.createElement('input', {
        ref: inputRef,
        type: 'text',
        className: 'form-control',
        placeholder: 'Paste magnet link',
        onKeyDown: handleKey,
        style: { flex: 1 }
      }),
      React.createElement('button', { className: 'btn btn--accent', onClick: handleDownload }, 'Download')
    ),
    error && React.createElement('div', { className: 'error-banner' }, error),
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
    return React.createElement('div', { className: 'container py-16' }, 'Loading...');
  }

  return React.createElement('div', { className: 'container' },
    React.createElement('h1', { style: { marginBottom: 'var(--space-24)' } }, 'P2P File Share'),
    React.createElement('div', { className: 'main-grid' },
      React.createElement(ShareSection, { client }),
      React.createElement(DownloadSection, { client })
    )
  );
}

/******************** Render ********************/
ReactDOM.render(React.createElement(App), document.getElementById('root'));