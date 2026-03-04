// app.js — Frontend logic for Amuse Events

const API = '/api';

// --- State ---
let myUserId = 'user-' + Math.random().toString(36).slice(2, 8);
let myLat = 48.7758;  // Stuttgart default
let myLng = 9.1829;
let map, markerLayer, heatLayer;

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  initNav();
  initCreateForm();
  initRoulette();
  initFilterType();
  requestLocation();
});

// --- Navigation ---
function initNav() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      btn.classList.add('active');
      const viewId = 'view-' + btn.dataset.view;
      document.getElementById(viewId).classList.add('active');
      if (btn.dataset.view === 'map') {
        map.invalidateSize();
        loadMapEvents();
      }
      if (btn.dataset.view === 'feed') loadFeed();
    });
  });
}

// --- Geolocation ---
function requestLocation() {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(pos => {
      myLat = pos.coords.latitude;
      myLng = pos.coords.longitude;
      map.setView([myLat, myLng], 13);
      loadMapEvents();
    }, () => {
      loadMapEvents();
    });
  } else {
    loadMapEvents();
  }
}

// --- Map ---
function initMap() {
  map = L.map('map').setView([myLat, myLng], 13);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    maxZoom: 19,
  }).addTo(map);
  markerLayer = L.layerGroup().addTo(map);
  heatLayer = L.layerGroup().addTo(map);
}

const EVENT_ICONS = {
  coffee: '&#9749;',
  walk: '&#128694;',
  date: '&#10084;',
  group: '&#128101;',
  adventure: '&#9889;',
  mystery: '&#10067;',
  speeddate: '&#9200;',
  instant_date: '&#128293;',
};

function eventIcon(type) {
  return L.divIcon({
    html: `<div class="map-marker" data-type="${type}">${EVENT_ICONS[type] || '&#128205;'}</div>`,
    className: 'custom-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

async function loadMapEvents() {
  try {
    const res = await fetch(`${API}/events/map?lat=${myLat}&lng=${myLng}&radius_km=50`);
    const data = await res.json();
    markerLayer.clearLayers();
    heatLayer.clearLayers();

    for (const ev of data.events) {
      const marker = L.marker([ev.location_lat, ev.location_lng], {
        icon: eventIcon(ev.event_type),
      });
      const time = new Date(ev.start_time).toLocaleString([], {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      marker.bindPopup(`
        <strong>${escHtml(ev.title)}</strong><br>
        <span style="opacity:0.7">${ev.event_type}</span><br>
        ${time}<br>
        ${ev.participant_count} joined<br>
        <button onclick="joinFromMap('${ev.event_id}')" style="margin-top:6px;padding:4px 12px;background:#00c897;color:#fff;border:none;border-radius:4px;cursor:pointer">Join</button>
      `);
      markerLayer.addLayer(marker);
    }

    // Heatmap zones as circles
    for (const zone of data.heatmap_zones) {
      const circle = L.circle([zone.center_lat, zone.center_lng], {
        radius: zone.radius_km * 1000,
        color: '#e94560',
        fillColor: '#e94560',
        fillOpacity: 0.12,
        weight: 1,
      });
      circle.bindPopup(`<strong>${escHtml(zone.label)}</strong><br>${zone.event_count} events`);
      heatLayer.addLayer(circle);
    }

    document.getElementById('event-count').textContent = `${data.events.length} events nearby`;
    document.getElementById('heatmap-count').textContent = `${data.heatmap_zones.length} active zones`;
  } catch (e) {
    console.error('Failed to load map events', e);
  }
}

function joinFromMap(eventId) {
  joinEvent(eventId);
}

// --- Feed ---
async function loadFeed(typeFilter) {
  const list = document.getElementById('feed-list');
  list.innerHTML = '<p style="color:#888;text-align:center;padding:40px">Loading...</p>';

  try {
    let url = `${API}/events/nearby?lat=${myLat}&lng=${myLng}&radius_km=50`;
    if (typeFilter) url += `&event_type=${typeFilter}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.events.length === 0) {
      list.innerHTML = '<p style="color:#888;text-align:center;padding:40px">No events nearby. Create one!</p>';
      return;
    }

    list.innerHTML = data.events.map(ev => {
      const isPremium = ev.premium_creator;
      const time = new Date(ev.start_time).toLocaleString([], {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      const spots = ev.max_participants
        ? `${ev.participants.length}/${ev.max_participants}`
        : ev.participants.length;
      return `
        <div class="event-card ${isPremium ? 'premium' : ''}" data-id="${ev.id}">
          <div class="card-header">
            <span class="card-title">${escHtml(ev.title)}</span>
            <span class="card-type">${ev.event_type.replace('_', ' ')}</span>
          </div>
          <div class="card-meta">
            <span>${time}</span>
            <span>${escHtml(ev.location_name)}</span>
            <span>${spots} joined</span>
          </div>
          <div class="card-actions">
            <button class="btn-join" onclick="event.stopPropagation();joinEvent('${ev.id}')">Join</button>
            <button class="btn-report" onclick="event.stopPropagation();reportEvent('${ev.id}')">Report</button>
          </div>
        </div>
      `;
    }).join('');
  } catch (e) {
    list.innerHTML = '<p style="color:#e94560;text-align:center;padding:40px">Failed to load events.</p>';
  }
}

function initFilterType() {
  document.getElementById('filter-type').addEventListener('change', (e) => {
    loadFeed(e.target.value || undefined);
  });
}

// --- Join / Report ---
async function joinEvent(eventId) {
  try {
    const res = await fetch(`${API}/events/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId, user_id: myUserId }),
    });
    const data = await res.json();
    if (data.success) {
      showModal(`
        <h3>Joined!</h3>
        <p style="margin-top:8px">${escHtml(data.event.title)}</p>
        ${data.icebreaker ? `<p style="margin-top:12px;padding:12px;background:rgba(233,69,96,0.1);border-radius:8px"><strong>Icebreaker:</strong> ${escHtml(data.icebreaker.prompt.text)}</p>` : ''}
      `);
      loadMapEvents();
      loadFeed();
    } else {
      showModal(`<h3>Cannot join</h3><p style="margin-top:8px;color:#e94560">${escHtml(data.error)}</p>`);
    }
  } catch (e) {
    showModal('<h3>Error</h3><p>Network error.</p>');
  }
}

async function reportEvent(eventId) {
  try {
    await fetch(`${API}/events/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: eventId,
        reporter_id: myUserId,
        reason: 'spam',
      }),
    });
    showModal('<h3>Reported</h3><p style="margin-top:8px">Thank you. We will review this event.</p>');
  } catch (e) {
    showModal('<h3>Error</h3><p>Could not submit report.</p>');
  }
}

// --- Create Event ---
function initCreateForm() {
  document.getElementById('use-my-location').addEventListener('click', () => {
    document.getElementById('ev-lat').value = myLat;
    document.getElementById('ev-lng').value = myLng;
  });

  // Set default start time to 1 hour from now
  const now = new Date();
  now.setHours(now.getHours() + 1, 0, 0, 0);
  document.getElementById('ev-start').value = now.toISOString().slice(0, 16);

  document.getElementById('create-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const result = document.getElementById('create-result');
    const isPremium = document.getElementById('ev-premium').checked;
    const maxP = parseInt(document.getElementById('ev-max').value, 10);

    const body = {
      input: {
        creator_id: myUserId,
        title: document.getElementById('ev-title').value,
        description: document.getElementById('ev-desc').value,
        location_name: document.getElementById('ev-location').value,
        location_lat: parseFloat(document.getElementById('ev-lat').value),
        location_lng: parseFloat(document.getElementById('ev-lng').value),
        start_time: new Date(document.getElementById('ev-start').value).getTime(),
        event_type: document.getElementById('ev-type').value,
        visibility: document.getElementById('ev-visibility').value,
        max_participants: isNaN(maxP) ? undefined : maxP,
      },
      creatorProfile: {
        id: myUserId,
        interests: ['coffee', 'travel', 'music'],
        location_lat: myLat,
        location_lng: myLng,
        activity_level: 7,
        room_ids: [],
        is_online: true,
        is_premium: isPremium,
      },
    };

    try {
      const res = await fetch(`${API}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        result.className = 'success';
        const status = data.event.status === 'pending'
          ? 'Pending moderation (up to 24h)'
          : 'Live now!';
        result.innerHTML = `Event created: "${escHtml(data.event.title)}" &mdash; ${status}`;
        document.getElementById('create-form').reset();
        loadMapEvents();
      } else {
        result.className = 'error';
        result.textContent = data.error;
      }
    } catch (err) {
      result.className = 'error';
      result.textContent = 'Network error.';
    }
  });
}

// --- Roulette ---
function initRoulette() {
  document.getElementById('roulette-btn').addEventListener('click', async () => {
    const result = document.getElementById('roulette-result');
    result.innerHTML = '<p style="color:#888">Finding your match...</p>';

    try {
      const res = await fetch(`${API}/events/roulette`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: myUserId,
          user_profile: {
            id: myUserId,
            interests: ['coffee', 'travel'],
            location_lat: myLat,
            location_lng: myLng,
            activity_level: 7,
            room_ids: [],
            is_online: true,
            is_premium: false,
          },
          candidate_profiles: [
            {
              id: 'roulette-match-' + Math.random().toString(36).slice(2, 8),
              interests: ['music', 'coffee'],
              location_lat: myLat + (Math.random() - 0.5) * 0.01,
              location_lng: myLng + (Math.random() - 0.5) * 0.01,
              activity_level: 6,
              room_ids: [],
              is_online: true,
              is_premium: false,
            },
          ],
          location_lat: myLat,
          location_lng: myLng,
          location_name: 'Surprise Location',
        }),
      });
      const data = await res.json();
      if (data.success) {
        const revealTime = new Date(data.match.location_revealed_at).toLocaleString([], {
          hour: '2-digit', minute: '2-digit'
        });
        result.innerHTML = `
          <div style="background:var(--surface);padding:24px;border-radius:12px;border:1px solid var(--accent);display:inline-block;text-align:left;max-width:400px">
            <h3 style="color:var(--accent);margin-bottom:8px">${escHtml(data.event.title)}</h3>
            <p style="margin-bottom:6px">${escHtml(data.event.description)}</p>
            <p style="color:var(--text-muted);font-size:0.85rem">Location reveals at ${revealTime}</p>
          </div>
        `;
        loadMapEvents();
      } else {
        result.innerHTML = `<p style="color:var(--accent)">${escHtml(data.error)}</p>`;
      }
    } catch (e) {
      result.innerHTML = '<p style="color:var(--accent)">Network error.</p>';
    }
  });
}

// --- Modal ---
function showModal(html) {
  document.getElementById('modal-content').innerHTML = html;
  document.getElementById('modal-overlay').classList.remove('hidden');
}

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('modal-close')) {
    document.getElementById('modal-overlay').classList.add('hidden');
  }
});

// --- Helpers ---
function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// --- Custom marker styles (injected) ---
const style = document.createElement('style');
style.textContent = `
  .custom-marker { background: none; border: none; }
  .map-marker {
    width: 36px;
    height: 36px;
    background: var(--surface, #1a1a2e);
    border: 2px solid var(--accent, #e94560);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    box-shadow: 0 2px 12px rgba(233,69,96,0.3);
  }
`;
document.head.appendChild(style);
