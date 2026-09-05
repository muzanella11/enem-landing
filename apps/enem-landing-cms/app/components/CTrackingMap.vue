<script lang="ts" setup>
import 'leaflet/dist/leaflet.css';
import type { TrackingLocation } from '@enem-landing/shared-types';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { LayerGroup, Map as LeafletMap } from 'leaflet';

const props = withDefaults(
  defineProps<{
    locations: TrackingLocation[];
    height?: string;
  }>(),
  {
    height: '320px',
  },
);

const mapContainer = ref<HTMLDivElement>();
let mapInstance: LeafletMap | null = null;
let markersLayer: LayerGroup | null = null;

const renderMarkers = async () => {
  if (!mapInstance) return;
  const L = await import('leaflet');
  markersLayer?.clearLayers();
  markersLayer = markersLayer ?? L.layerGroup().addTo(mapInstance);

  for (const location of props.locations) {
    // Log-scaled so one very active city doesn't dwarf the rest into
    // invisible dots.
    const radius = Math.min(6 + Math.log2(location.count + 1) * 4, 30);
    L.circleMarker([location.latitude, location.longitude], {
      radius,
      color: '#0E7C6B',
      fillColor: '#0E7C6B',
      fillOpacity: 0.5,
      weight: 1,
    })
      .bindTooltip(
        `${[location.city, location.country].filter(Boolean).join(', ') || 'Unknown'}: ${location.count}`,
      )
      .addTo(markersLayer);
  }
};

onMounted(async () => {
  const L = await import('leaflet');
  if (!mapContainer.value) return;
  mapInstance = L.map(mapContainer.value, { worldCopyJump: true }).setView(
    [20, 0],
    2,
  );
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18,
  }).addTo(mapInstance);
  await renderMarkers();
});

watch(() => props.locations, renderMarkers);

onBeforeUnmount(() => {
  mapInstance?.remove();
  mapInstance = null;
  markersLayer = null;
});
</script>

<template>
  <div
    ref="mapContainer"
    :style="{ height, width: '100%', borderRadius: '8px' }"
  />
</template>
