import { Bike, Home, Pizza, type LucideIcon } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useEffect, useRef } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

interface Point {
  lat: number
  lng: number
}

interface TrackingMapProps {
  pizzaria: Point
  destination: Point
  driver: Point
}

const SIZE = 36

const markerIcon = (Icon: LucideIcon, label: string, background: string) =>
  L.divIcon({
    className: '',
    html: `<span role="img" aria-label="${label}" style="display:flex;width:${SIZE}px;height:${SIZE}px;align-items:center;justify-content:center;border-radius:9999px;background:${background};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)">${renderToStaticMarkup(
      <Icon size={20} color="#fff" strokeWidth={2.25} />,
    )}</span>`,
    iconSize: [SIZE, SIZE],
    iconAnchor: [SIZE / 2, SIZE / 2],
  })

export function TrackingMap({ pizzaria, destination, driver }: TrackingMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const driverMarker = useRef<L.Marker | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const map = L.map(container, { zoomControl: true, attributionControl: true })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map)

    L.marker(pizzaria, { icon: markerIcon(Pizza, 'Pizzaria', '#d9480f') }).addTo(map)
    L.marker(destination, { icon: markerIcon(Home, 'Seu endereço', '#0f172a') }).addTo(map)
    driverMarker.current = L.marker(driver, { icon: markerIcon(Bike, 'Entregador', '#059669') }).addTo(map)
    map.fitBounds(L.latLngBounds([pizzaria, destination, driver]), { padding: [40, 40] })

    return () => {
      map.remove()
      driverMarker.current = null
    }
    // O mapa é criado uma vez; a posição do entregador é atualizada no efeito abaixo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pizzaria.lat, pizzaria.lng, destination.lat, destination.lng])

  const { lat: driverLat, lng: driverLng } = driver
  useEffect(() => {
    driverMarker.current?.setLatLng([driverLat, driverLng])
  }, [driverLat, driverLng])

  return <div ref={containerRef} role="region" aria-label="Mapa da entrega" className="h-72 w-full overflow-hidden rounded-xl ring-1 ring-stone-300" />
}
