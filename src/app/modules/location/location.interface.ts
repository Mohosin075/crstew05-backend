export interface ILocationSuggestion {
  description: string
  placeId: string
  mainText: string
  secondaryText: string
}

export interface IGeocodeResponse {
  lat: number
  lng: number
  formattedAddress: string
  placeId: string
}
