import Geohash from 'latlon-geohash';
import { BasicProcessor } from './BasicProcessor';

export class AddLatLon extends BasicProcessor {
  async process(m: any): Promise<any> {
    m.lat = this.configAll.lat;
    m.lon = this.configAll.lon;
    if (navigator.geolocation) {
      await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position: any) => {
            m.lat = position.coords.latitude;
            m.lon = position.coords.longitude;

            const geohash = Geohash.encode(m.lat, m.lon, 8);

            m.geohash8 = geohash;
            m.geohash7 = geohash.substring(0, 7);

            m.geohashs = [];
            m.geohashs.push(m.geohash8);
            m.geohashs.push(m.geohash7);

            m.googlemaps = `https://maps.google.com/?q=${m.lat},${m.lon}`;

            resolve(null);
          },
          (msg) => {
            resolve(null);
          }
        );
      });
    }
    return m;
  }
}
