import React from 'react'
import { Page } from '../../components/common'
import { greeting } from '../../lib/dates'
import { STAGES, stageLabel } from '../../content/journey'
import { useHomeData } from './hooks/useHomeData'
import { firstName } from './lib/format'
import HomeHero from './components/HomeHero'
import StatStrip from './components/StatStrip'
import NextProgramCard from './components/NextProgramCard'
import GuideCard from './components/GuideCard'
import JourneyCard from './components/JourneyCard'
import CheckInCard from './components/CheckInCard'
import YatrasCard from './components/YatrasCard'

const MemberHomePage = ({ setActiveTab }) => {
  const d = useHomeData()
  const go = (tab) => () => setActiveTab(tab)

  return (
    <Page className="space-y-5 sm:space-y-6">
      <HomeHero
        greeting={greeting()}
        name={firstName(d.user)}
        stageName={stageLabel(d.stage)}
        verse={d.verse}
        rounds={d.rounds}
        target={d.target}
        done={d.done}
        streak={d.streak}
        loading={d.logLoading}
        hasLog={!!d.log}
        onLog={go('sadhana')}
        onQR={go('profile')}
      />
      <StatStrip
        streak={d.streak}
        longest={d.user?.longestStreak || 0}
        rounds={d.rounds}
        target={d.target}
        yatras={d.activeTrips.length}
        stageStep={d.stageIdx + 1}
        stageTotal={STAGES.length}
      />
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-3">
        <NextProgramCard event={d.next} going={d.going} loading={d.eventsLoading} onAll={go('events')} onRsvp={go('events')} />
        <GuideCard name={d.user?.guideName} phone={d.user?.guidePhone} />
        <JourneyCard stages={STAGES} stageIdx={d.stageIdx} />
        <CheckInCard onOpen={go('profile')} />
        <YatrasCard trips={d.activeTrips} loading={d.tripsLoading} onBrowse={go('trips')} />
      </div>
    </Page>
  )
}

export default MemberHomePage
