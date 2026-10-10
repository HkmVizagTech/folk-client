import { Compass } from 'lucide-react'
import DetailSection from './DetailSection'

const AboutSection = ({ description }) => (
  <DetailSection icon={Compass} kicker="About this yatra" title="The journey">
    <p className="user-text whitespace-pre-line text-[16px] leading-[1.8] text-ink-soft">{description}</p>
  </DetailSection>
)

export default AboutSection
