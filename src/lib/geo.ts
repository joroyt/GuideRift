import geoip from 'geoip-lite'

export function getCountryFromIp(ip: string): string | null {
  const geo = geoip.lookup(ip)
  return geo?.country ?? null
}
