import { Camera } from 'lucide-react'
import Photo from '../../trips/components/Photo'
import { surfaceFor } from '../../trips/lib/locations'
import DetailSection from './DetailSection'

/** Mosaic: the lead photo takes a 2x2 block; every tile is fixed-ratio so height holds while images load. */
const GallerySection = ({ trip, images, onOpen }) => (
  <DetailSection id="gallery" icon={Camera} kicker="Gallery" title="A glimpse of the road">
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
      {images.map((src, i) => (
        <button
          key={i} type="button" onClick={() => onOpen(i)} aria-label={`Open gallery image ${i + 1} of ${images.length}`}
          className={`group relative min-w-0 overflow-hidden rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-saffron focus-visible:ring-offset-2 sm:rounded-2xl ${i === 0 ? 'col-span-2 sm:row-span-2' : ''}`}
        >
          <Photo
            src={src} alt={`${trip.title || 'Yatra'} photo ${i + 1}`} tone={surfaceFor(`${trip.slug || trip.id}-${i}`)} icon={<Camera size={22} strokeWidth={1.5} />}
            className={`w-full ${i === 0 ? 'aspect-[16/10] sm:aspect-square' : 'aspect-square'}`} imgClassName="group-hover:scale-105"
          >
            <span className="absolute inset-0 bg-ink/0 transition-colors group-hover:bg-ink/20" aria-hidden="true" />
          </Photo>
        </button>
      ))}
    </div>
  </DetailSection>
)

export default GallerySection
