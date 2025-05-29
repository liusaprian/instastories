import { map, tileLayer } from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import CONFIG from '../config';
 
export default class Map {
  #zoom = 5;
  #map = null;
  #markers = [];
 
  static async getPlaceNameByCoordinate(latitude, longitude) {
    try {
      const url = new URL(`https://api.maptiler.com/geocoding/${longitude},${latitude}.json`);
      url.searchParams.set('key', CONFIG.MAP_SERVICE_API_KEY);
      url.searchParams.set('language', 'id');
      url.searchParams.set('limit', '1');
      const response = await fetch(url);
      const json = await response.json();
      const place = json.features[0].place_name.split(', ');
      return [place.at(-2), place.at(-1)].map((name) => name).join(', ');
    } catch (error) {
      console.error('getPlaceNameByCoordinate: error:', error);
      return `${latitude}, ${longitude}`;
    }
  }
  
  addMapEventListener(eventName, callback) {
    this.#map.addEventListener(eventName, callback);
  }
 
  getCenter() {
    const { lat, lng } = this.#map.getCenter();
    return {
      latitude: lat,
      longitude: lng,
    };
  }
 
  createIcon(options = {}) {
    return L.icon({
      ...L.Icon.Default.prototype.options,
      iconRetinaUrl: markerIcon2x,
      iconUrl: markerIcon,
      shadowUrl: markerShadow,
      ...options,
    });
  }

  addMarker(coordinates, markerOptions = {}, popupOptions = null) {
    if (typeof markerOptions !== 'object') {
      throw new Error('markerOptions must be an object');
    }
    const marker = L.marker(coordinates, {
      icon: this.createIcon(),
      ...markerOptions,
    });
    if (popupOptions) {
      if (typeof popupOptions !== 'object') {
        throw new Error('popupOptions must be an object');
      }
      if (!('content' in popupOptions)) {
        throw new Error('popupOptions must include `content` property.');
      }
      const newPopup = L.popup(coordinates, popupOptions);
      marker.bindPopup(newPopup);
    }
    marker.addTo(this.#map);
    this.#markers.push(marker);
    return marker;
  }

  removeAllMarkers() {
    this.#markers.forEach(marker => {
      this.#map.removeLayer(marker);
    });
    this.#markers = [];
  }

  static isGeolocationAvailable() {
    return 'geolocation' in navigator;
  }
 
  static getCurrentPosition(options = {}) {
    return new Promise((resolve, reject) => {
      if (!Map.isGeolocationAvailable()) {
        reject('Geolocation API unsupported');
        return;
      }
 
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  }
 
  static async build(selector, options = {}) {
    if ('center' in options && options.center) {
      return new Map(selector, options);
    }
 
    const indonesiaCoordinate = [-2.548926, 118.0148634];
 
    if ('locate' in options && options.locate) {
      try {
        const position = await Map.getCurrentPosition();
        const coordinate = [position.coords.latitude, position.coords.longitude];
 
        return new Map(selector, {
          ...options,
          center: coordinate,
        });
      } catch (error) {
        console.error('build: error:', error);
 
        return new Map(selector, {
          ...options,
          center: indonesiaCoordinate,
        });
      }
    }
 
    return new Map(selector, {
      ...options,
      center: indonesiaCoordinate,
    });
  }
 
  constructor(selector, options = {}) {
    this.#zoom = options.zoom ?? this.#zoom;
 
    const tileOsm = tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
    });

    const tileOsmHOT = tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr/" target="_blank">OpenStreetMap France</a>',
    });
    const openTopoMap = tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution:
        'Map data: &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors, <a href="https://viewfinderpanoramas.org/" target="_blank">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org/" target="_blank">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank">CC-BY-SA</a>)',
    });
    const baseMaps = {
      'OpenStreetMap': tileOsm,
      'OpenStreetMap.HOT': tileOsmHOT,
      'OpenTopoMap': openTopoMap
    };
    const layerControl = L.control.layers(baseMaps);
 
    this.#map = map(document.querySelector(selector), {
      zoom: this.#zoom,
      scrollWheelZoom: false,
      layers: [tileOsm],
      ...options,
    });
    layerControl.addTo(this.#map);
  }
  
  changeCamera(coordinate, zoomLevel = null) {
    if (!zoomLevel) {
      this.#map.setView(L.latLng(coordinate), this.#zoom);
      return;
    }
    this.#map.setView(L.latLng(coordinate), zoomLevel);
  }
}