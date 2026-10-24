import { geocodeAddress } from './geocodeAddress'

export const INTERVENTION_RADIUS_VALUES = [
  '10km',
  '30km',
  '50km',
  '100km',
] as const

export type InterventionRadiusValue =
  (typeof INTERVENTION_RADIUS_VALUES)[number]

export type LatLng = { lat: number; lng: number }

type LocationLike = {
  address?: string
  city?: string
  country?: string
  coordinates?: Partial<LatLng> | null
}

type ProfileAreaLike =
  | {
      mainCity?: string
      radius?: string
      availableForTravel?: boolean
    }
  | null
  | undefined

const isLegacyWholeCountryRadius = (normalized: string): boolean => {
  // Removed product values — treat as max km so booking distance still works
  return (
    normalized === 'whole france' ||
    normalized === 'whole country' ||
    normalized === 'wholecountry' ||
    normalized === 'tout le pays' ||
    normalized === 'toute la france' ||
    normalized.includes('whole country') ||
    normalized.includes('whole france')
  )
}

/** Parse profile Intervention Radius string → km (km-only options). */
export const parseInterventionRadiusKm = (
  radius?: string | null,
): number | null => {
  if (!radius || typeof radius !== 'string') return null

  const normalized = radius.trim().toLowerCase().replace(/\s+/g, ' ')

  if (isLegacyWholeCountryRadius(normalized)) return 100

  const match = normalized.match(/^(\d+)\s*km$/)
  if (!match) return null

  const km = Number(match[1])
  if ([10, 30, 50, 100].includes(km)) return km
  return null
}

/** Parse listing `serviceRadiusKm` number → allowed km, else null. */
export const parseServiceRadiusKm = (
  value?: number | string | null,
): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return [10, 30, 50, 100].includes(value) ? value : null
  }
  if (typeof value === 'string') return parseInterventionRadiusKm(value)
  return null
}

/**
 * Listing radius wins; profile radius is fallback for legacy services.
 */
export const resolveInterventionRadiusKm = (
  serviceRadiusKm?: number | string | null,
  profileRadius?: string | null,
): number | null =>
  parseServiceRadiusKm(serviceRadiusKm) ??
  parseInterventionRadiusKm(profileRadius)

/**
 * Max bookable distance from pro base.
 * - Normal: intervention radius only
 * - availableForTravel: limited extension (not whole-country) — blocks e.g. Paris→Nice
 */
export const maxBookableDistanceKm = (
  radiusKm: number,
  availableForTravel: boolean,
): number => {
  if (!availableForTravel) return radiusKm
  // Travel allowed: radius + 100km, hard-capped at 200km from base
  return Math.min(radiusKm + 100, 200)
}

/** Whether an event point is inside the pro's bookable intervention area. */
export const isWithinInterventionArea = (
  distanceKm: number,
  radiusKm: number,
  availableForTravel: boolean,
): boolean => distanceKm <= maxBookableDistanceKm(radiusKm, availableForTravel)

/** Normalize UI/API radius strings to canonical stored values. */
export const normalizeInterventionRadius = (
  radius?: string | null,
): InterventionRadiusValue | null => {
  if (!radius || typeof radius !== 'string') return null
  const normalized = radius.trim().toLowerCase().replace(/\s+/g, ' ')

  if (isLegacyWholeCountryRadius(normalized)) return '100km'

  const match = normalized.match(/^(\d+)\s*km$/)
  if (!match) {
    // Bare number from older clients: "50" / "100"
    const bare = Number(normalized)
    if (bare === 10) return '10km'
    if (bare === 30) return '30km'
    if (bare === 50) return '50km'
    if (bare === 100) return '100km'
    return null
  }
  const km = Number(match[1])
  if (km === 10) return '10km'
  if (km === 30) return '30km'
  if (km === 50) return '50km'
  if (km === 100) return '100km'
  return null
}

/**
 * Persist-safe radius: maps legacy/invalid → nearest allowed km value.
 * Returns undefined when empty so callers can omit the field.
 */
export const coerceInterventionRadius = (
  radius?: string | null,
): InterventionRadiusValue | undefined => {
  if (radius == null || String(radius).trim() === '') return undefined
  return normalizeInterventionRadius(radius) ?? '100km'
}

export const hasCoordinates = (
  coords?: Partial<LatLng> | null,
): coords is LatLng =>
  typeof coords?.lat === 'number' &&
  typeof coords?.lng === 'number' &&
  !Number.isNaN(coords.lat) &&
  !Number.isNaN(coords.lng)

export const calculateDistanceInKm = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Provider distance center (strict — listing only):
 * 1) service.location.coordinates
 * 2) geocode service address/city/country
 *
 * Profile `mainCity` is NOT used. Radius/travel still come from profile;
 * the geographic center is always the service location.
 */
export const resolveProviderCoordinates = async (
  serviceLocation?: LocationLike | null,
  _areaOfIntervention?: ProfileAreaLike,
): Promise<LatLng | null> => {
  if (hasCoordinates(serviceLocation?.coordinates)) {
    return {
      lat: serviceLocation!.coordinates!.lat!,
      lng: serviceLocation!.coordinates!.lng!,
    }
  }

  if (serviceLocation?.city || serviceLocation?.address) {
    const fullAddress = [
      serviceLocation.address,
      serviceLocation.city,
      serviceLocation.country,
    ]
      .filter(Boolean)
      .join(', ')
    if (fullAddress.trim()) {
      const geocoded = await geocodeAddress(fullAddress)
      if (geocoded) return { lat: geocoded.lat, lng: geocoded.lng }
    }
  }

  return null
}

export const resolveEventCoordinates = async (
  eventLocation: LocationLike,
): Promise<LatLng | null> => {
  if (hasCoordinates(eventLocation.coordinates)) {
    return {
      lat: eventLocation.coordinates!.lat!,
      lng: eventLocation.coordinates!.lng!,
    }
  }

  const fullAddress = [
    eventLocation.address,
    eventLocation.city,
    eventLocation.country,
  ]
    .filter(Boolean)
    .join(', ')

  if (!fullAddress.trim()) return null

  const geocoded = await geocodeAddress(fullAddress)
  if (!geocoded) return null
  return { lat: geocoded.lat, lng: geocoded.lng }
}
