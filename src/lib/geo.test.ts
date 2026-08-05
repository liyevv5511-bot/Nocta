import { describe, expect, it } from 'vitest';

import { distanceMetres, groundTravelMinutes, intercityTravelMinutes, travelMode } from './geo';

const LISBON = { lat: 38.7223, lng: -9.1393 };
const PORTO = { lat: 41.1579, lng: -8.6291 };
const TOKYO = { lat: 35.6762, lng: 139.6503 };
const REYKJAVIK = { lat: 64.1466, lng: -21.9426 };

describe('distanceMetres', () => {
  it('is zero for identical points', () => {
    expect(distanceMetres(LISBON, LISBON)).toBe(0);
  });

  it('matches the known Lisbon–Porto distance to within a percent', () => {
    // Great-circle distance is ~274 km.
    const metres = distanceMetres(LISBON, PORTO);
    expect(metres).toBeGreaterThan(270_000);
    expect(metres).toBeLessThan(278_000);
  });

  it('is symmetric', () => {
    expect(distanceMetres(TOKYO, REYKJAVIK)).toBeCloseTo(distanceMetres(REYKJAVIK, TOKYO), 6);
  });

  it('handles a pair either side of the antimeridian', () => {
    const west = { lat: 0, lng: -179 };
    const east = { lat: 0, lng: 179 };
    // Two degrees apart, not 358 — about 222 km at the equator.
    expect(distanceMetres(west, east)).toBeLessThan(250_000);
  });
});

describe('groundTravelMinutes', () => {
  it('walks a short hop', () => {
    // ~750 m at 75 m/min is about ten minutes.
    const minutes = groundTravelMinutes(LISBON, { lat: 38.729, lng: -9.1393 });
    expect(minutes).toBeGreaterThan(5);
    expect(minutes).toBeLessThan(20);
  });

  it('never returns zero for two distinct points', () => {
    expect(groundTravelMinutes(LISBON, { lat: 38.7224, lng: -9.1394 })).toBeGreaterThan(0);
  });

  it('switches to a transit model rather than an implausible walk', () => {
    // 25 km would be five and a half hours on foot.
    const minutes = groundTravelMinutes(LISBON, { lat: 38.7223, lng: -9.4271 });
    expect(minutes).toBeGreaterThan(20);
    expect(minutes).toBeLessThan(120);
  });

  it('clamps to the schema ceiling', () => {
    expect(groundTravelMinutes(LISBON, TOKYO)).toBe(240);
    expect(groundTravelMinutes(LISBON, TOKYO, 60)).toBe(60);
  });
});

describe('intercity travel', () => {
  it('treats a short hop as rail', () => {
    expect(travelMode(LISBON, PORTO)).toBe('rail');
    // ~274 km at an effective 90 km/h.
    expect(intercityTravelMinutes(LISBON, PORTO)).toBeGreaterThan(120);
    expect(intercityTravelMinutes(LISBON, PORTO)).toBeLessThan(240);
  });

  it('treats a long hop as a flight, with airport overhead', () => {
    expect(travelMode(LISBON, TOKYO)).toBe('air');

    const minutes = intercityTravelMinutes(LISBON, TOKYO);
    // ~11,150 km: roughly fifteen hours in the air plus three on the ground.
    expect(minutes).toBeGreaterThan(15 * 60);
    expect(minutes).toBeLessThan(22 * 60);
  });

  it('is symmetric', () => {
    expect(intercityTravelMinutes(LISBON, TOKYO)).toBe(intercityTravelMinutes(TOKYO, LISBON));
  });
});
