type Point = { lat: number; lon: number };

const knownLocations: Record<string, Point> = {
  bengaluru: { lat: 12.9716, lon: 77.5946 },
  bangalore: { lat: 12.9716, lon: 77.5946 },
  goa: { lat: 15.2993, lon: 74.124 },
  gokarna: { lat: 14.5479, lon: 74.3188 },
  mumbai: { lat: 19.076, lon: 72.8777 },
  coorg: { lat: 12.3375, lon: 75.8069 },
  kerala: { lat: 10.8505, lon: 76.2711 },
  hyderabad: { lat: 17.385, lon: 78.4867 },
  pune: { lat: 18.5204, lon: 73.8567 },
};

function pointFor(location: string): Point {
  const normalized = location.trim().toLowerCase();
  return knownLocations[normalized] ?? { lat: 20.5937, lon: 78.9629 };
}

function haversineKm(a: Point, b: Point): number {
  const radius = 6371;
  const latDelta = ((b.lat - a.lat) * Math.PI) / 180;
  const lonDelta = ((b.lon - a.lon) * Math.PI) / 180;
  const sine =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(lonDelta / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(sine), Math.sqrt(1 - sine)) * 1.18;
}

export type RouteDestination = {
  destinationName: string;
  stayDays: number;
  roamingRadiusKm: number;
  notes?: string;
};

export type RouteLeg = {
  from: string;
  to: string;
  distanceKm: number;
  drivingTime: string;
};

export function calculateRoute(
  startLocation: string,
  destinations: RouteDestination[],
): {
  totalDistanceKm: number;
  totalDrivingTime: string;
  legs: RouteLeg[];
} {
  const locations = [startLocation, ...destinations.map((destination) => destination.destinationName)];
  const legs = locations.slice(0, -1).map((from, index) => {
    const to = locations[index + 1];
    const distanceKm = Math.round(haversineKm(pointFor(from), pointFor(to)));
    const hours = Math.max(1, Math.round((distanceKm / 52) * 10) / 10);
    return {
      from,
      to,
      distanceKm,
      drivingTime: `${hours} hrs`,
    };
  });
  const totalDistanceKm = legs.reduce((sum, leg) => sum + leg.distanceKm, 0);
  const totalHours = Math.round(legs.reduce((sum, leg) => sum + Number.parseFloat(leg.drivingTime), 0) * 10) / 10;
  return {
    totalDistanceKm,
    totalDrivingTime: `${totalHours} hrs`,
    legs,
  };
}