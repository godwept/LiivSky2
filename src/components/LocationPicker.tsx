import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { LatLngTuple, LeafletEvent, LeafletMouseEvent } from 'leaflet';
import type { GeocodeResult } from '../services/weatherClient';
import { reverseLocation, searchLocations } from '../services/weatherClient';
import './LocationPicker.css';

type PickerMode = 'search' | 'map';

interface LocationPickerProps {
  isOpen: boolean;
  initialLat: number;
  initialLon: number;
  onClose: () => void;
  onConfirm: (selection: GeocodeResult) => void;
}

interface LatLon {
  lat: number;
  lon: number;
}

function MapInteractionLayer({
  selected,
  onPick,
  onCenterChange,
}: {
  selected: LatLon;
  onPick: (position: LatLon) => void;
  onCenterChange: (position: LatLon) => void;
}) {
  useMapEvents({
    click(event: LeafletMouseEvent) {
      onPick({ lat: event.latlng.lat, lon: event.latlng.lng });
    },
    moveend(event: LeafletEvent) {
      const center = event.target.getCenter();
      onCenterChange({ lat: center.lat, lon: center.lng });
    },
  });

  const selectedCenter: LatLngTuple = [selected.lat, selected.lon];

  return <CircleMarker center={selectedCenter} radius={7} pathOptions={{ color: '#00e5ff' }} />;
}

function RecenterMap({ lat, lon }: LatLon) {
  const map = useMap();

  useEffect(() => {
    map.setView([lat, lon]);
  }, [lat, lon, map]);

  return null;
}

export default function LocationPicker({
  isOpen,
  initialLat,
  initialLon,
  onClose,
  onConfirm,
}: LocationPickerProps) {
  const [mode, setMode] = useState<PickerMode>('search');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSearch, setSelectedSearch] = useState<GeocodeResult | null>(null);
  const [selectedMapPoint, setSelectedMapPoint] = useState<LatLon>({ lat: initialLat, lon: initialLon });
  const [mapCenter, setMapCenter] = useState<LatLon>({ lat: initialLat, lon: initialLon });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setMode('search');
    setQuery('');
    setSearchResults([]);
    setSelectedSearch(null);
    setSelectedMapPoint({ lat: initialLat, lon: initialLon });
    setMapCenter({ lat: initialLat, lon: initialLon });
    setError(null);
  }, [initialLat, initialLon, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || mode !== 'search') {
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    const timeout = setTimeout(() => {
      void (async () => {
        setSearching(true);
        setError(null);

        try {
          const results = await searchLocations(trimmed);
          setSearchResults(results);
        } catch (searchError) {
          const message = searchError instanceof Error ? searchError.message : 'Location search failed.';
          setError(message);
        } finally {
          setSearching(false);
        }
      })();
    }, 300);

    return () => clearTimeout(timeout);
  }, [isOpen, mode, query]);

  const selectedMapDisplay = useMemo(
    () => `${selectedMapPoint.lat.toFixed(4)}, ${selectedMapPoint.lon.toFixed(4)}`,
    [selectedMapPoint.lat, selectedMapPoint.lon],
  );

  const mapCenterTuple: LatLngTuple = [selectedMapPoint.lat, selectedMapPoint.lon];

  if (!isOpen) {
    return null;
  }

  const onConfirmSearch = async (): Promise<void> => {
    if (!selectedSearch) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      onConfirm(selectedSearch);
    } finally {
      setSubmitting(false);
    }
  };

  const onConfirmMap = async (): Promise<void> => {
    setSubmitting(true);
    setError(null);

    try {
      const resolved = await reverseLocation(selectedMapPoint.lat, selectedMapPoint.lon);
      onConfirm(resolved);
    } catch (reverseError) {
      const message = reverseError instanceof Error ? reverseError.message : 'Unable to resolve selected map location.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="location-picker-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Location picker"
      onClick={onClose}
    >
      <div className="location-picker-panel" onClick={(event) => event.stopPropagation()}>
        <header className="location-picker-header">
          <h2 className="location-picker-title">Select Location</h2>
          <button className="location-picker-close" type="button" onClick={onClose} aria-label="Close location picker">
            ✕
          </button>
        </header>

        <div className="location-picker-tabs">
          <button
            className={`location-picker-tab ${mode === 'search' ? 'location-picker-tab--active' : ''}`}
            type="button"
            onClick={() => setMode('search')}
          >
            Search
          </button>
          <button
            className={`location-picker-tab ${mode === 'map' ? 'location-picker-tab--active' : ''}`}
            type="button"
            onClick={() => setMode('map')}
          >
            Map
          </button>
        </div>

        <div className="location-picker-body">
          {mode === 'search' && (
            <section className="location-picker-search" aria-label="Search locations">
              <input
                className="location-picker-input"
                type="text"
                placeholder="Search city, town, or place"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />

              {searching && <p className="location-picker-note">Searching…</p>}
              {!searching && query.trim().length >= 2 && searchResults.length === 0 && !error && (
                <p className="location-picker-note">No locations found.</p>
              )}

              <ul className="location-picker-results" role="listbox" aria-label="Location search results">
                {searchResults.map((result) => {
                  const isActive = selectedSearch?.lat === result.lat && selectedSearch?.lon === result.lon;

                  return (
                    <li key={`${result.lat}-${result.lon}`}>
                      <button
                        type="button"
                        className={`location-picker-result ${isActive ? 'location-picker-result--active' : ''}`}
                        onClick={() => setSelectedSearch(result)}
                      >
                        <span className="location-picker-result-name">{result.name}</span>
                        <span className="location-picker-result-sub">
                          {result.region ?? ''}{result.region && result.country ? ', ' : ''}{result.country ?? ''}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <button
                className="location-picker-confirm"
                type="button"
                onClick={() => {
                  void onConfirmSearch();
                }}
                disabled={!selectedSearch || submitting}
              >
                {submitting ? 'Applying…' : 'Confirm location'}
              </button>
            </section>
          )}

          {mode === 'map' && (
            <section className="location-picker-map" aria-label="Select location from map">
              <div className="location-picker-map-frame">
                <MapContainer center={mapCenterTuple} zoom={8} className="location-picker-leaflet-map">
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <RecenterMap lat={selectedMapPoint.lat} lon={selectedMapPoint.lon} />
                  <MapInteractionLayer
                    selected={selectedMapPoint}
                    onPick={setSelectedMapPoint}
                    onCenterChange={setMapCenter}
                  />
                </MapContainer>
              </div>

              <div className="location-picker-map-meta">
                <p className="location-picker-note">Selected: {selectedMapDisplay}</p>
                <button
                  className="location-picker-secondary"
                  type="button"
                  onClick={() => setSelectedMapPoint(mapCenter)}
                >
                  Use map center
                </button>
              </div>

              <button
                className="location-picker-confirm"
                type="button"
                onClick={() => {
                  void onConfirmMap();
                }}
                disabled={submitting}
              >
                {submitting ? 'Resolving…' : 'Confirm location'}
              </button>
            </section>
          )}

          {error && <p className="location-picker-error">{error}</p>}
        </div>
      </div>
    </div>
  );
}
