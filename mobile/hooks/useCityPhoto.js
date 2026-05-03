import { useState, useEffect } from 'react';
import { API_BASE } from '../constants/config';

const cache = {};

export function useCityPhoto(query) {
  const [url, setUrl] = useState(cache[query] || null);

  useEffect(() => {
    if (!query) return;
    if (cache[query]) { setUrl(cache[query]); return; }
    fetch(`${API_BASE}/api/photo/${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(d => { if (d.url) { cache[query] = d.url; setUrl(d.url); } })
      .catch(() => {});
  }, [query]);

  return url;
}
