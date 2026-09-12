import React from 'react';
import { motion } from 'framer-motion';
import { useFirestore } from '../hooks/useFirestore';
import {
  ArrowRight,
  Flame,
  Target,
  Users,
  MapPin,
  Calendar,
  Sparkles,
  ChevronRight,
  Heart,
  CheckCircle2,
  Bell,
  Plus,
  Home,
  User,
  Music,
  Clock3,
  HandHeart,
  BookOpen,
} from 'lucide-react';

import Button from '../components/ui/Button';

const Landing = ({ onLoginClick }) => {
  const { data: events } = useFirestore('events');

  // Sort upcoming events by their ISO date (fall back to human date string for legacy docs)
  const sortedEvents = [...events].sort((a, b) => {
    const aTime = a.dateISO ? new Date(a.dateISO).getTime() : new Date(a.date).getTime();
    const bTime = b.dateISO ? new Date(b.dateISO).getTime() : new Date(b.date).getTime();
    return (aTime || 0) - (bTime || 0);
  });
  const programs = [
    {
      title: 'Youth Programs',
      description:
        'Engaging activities and learning experiences designed to inspire young minds.',
      icon: <Users size={25} />,
    },
    {
      title: 'Spiritual Sessions',
      description:
        'Participate in spiritual discussions, chanting and meaningful sessions.',
      icon: <Sparkles size={25} />,
    },
    {
      title: 'Workshops',
      description:
        'Learn, grow and explore through practical workshops and interactive activities.',
      icon: <BookOpen size={25} />,
    },
    {
      title: 'Events',
      description:
        'Discover festivals, kirtans, celebrations and community gatherings.',
      icon: <Calendar size={25} />,
    },
    {
      title: 'Seva',
      description:
        'Take part in meaningful service activities and contribute to the community.',
      icon: <HandHeart size={25} />,
    },
    {
      title: 'Yatras & Activities',
      description:
        'Join yatras, outings and other spiritual and community activities.',
      icon: <MapPin size={25} />,
    },
  ];

  const eventCards = [
    {
      title: 'Spiritual Gathering',
      category: 'Spiritual Session',
      date: 'Upcoming',
      icon: <Sparkles size={30} />,
    },
    {
      title: 'Community Event',
      category: 'Community',
      date: 'Upcoming',
      icon: <Users size={30} />,
    },
    {
      title: 'Seva Activity',
      category: 'Seva',
      date: 'Upcoming',
      icon: <Heart size={30} />,
    },
  ];

  const appFeatures = [
    'Event Bookings',
    'Digital ID Card',
    'Stay Approvals',
    'Sadhana Streaks',
  ];

  const quickAccess = [
    {
      title: 'Upcoming Events',
      icon: <Calendar size={18} />,
    },
    {
      title: 'Seva Activities',
      icon: <Heart size={18} />,
    },
    {
      title: 'Accommodation',
      icon: <Home size={18} />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FDF9F1] text-gray-900 overflow-x-hidden">

      {/* =========================================================
          NAVBAR
      ========================================================= */}

      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">

          <div className="h-16 sm:h-[72px] bg-white/95 backdrop-blur-xl border border-gray-100 rounded-2xl shadow-sm flex items-center justify-between px-4 sm:px-6">

            <a href="#" className="shrink-0">
              <img
                src="/logo.png"
                alt="Folk Vizag Logo"
                className="h-9 sm:h-10 w-auto object-contain"
              />
            </a>

            <div className="hidden xl:flex items-center gap-7">

              <a
                href="#about"
                className="text-sm font-medium text-gray-600 hover:text-[#FF9933] transition"
              >
                About
              </a>

              <a
                href="#programs"
                className="text-sm font-medium text-gray-600 hover:text-[#FF9933] transition"
              >
                Programs
              </a>

              <a
                href="#events"
                className="text-sm font-medium text-gray-600 hover:text-[#FF9933] transition"
              >
                Events
              </a>

              <a
                href="#seva"
                className="text-sm font-medium text-gray-600 hover:text-[#FF9933] transition"
              >
                Seva
              </a>

              <a
                href="#accommodation"
                className="text-sm font-medium text-gray-600 hover:text-[#FF9933] transition"
              >
                Accommodation
              </a>

              <a
                href="#gallery"
                className="text-sm font-medium text-gray-600 hover:text-[#FF9933] transition"
              >
                Gallery
              </a>

              <a
                href="#contact"
                className="text-sm font-medium text-gray-600 hover:text-[#FF9933] transition"
              >
                Contact
              </a>

            </div>

            <Button
              onClick={onLoginClick}
              className="px-5 sm:px-7 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-[#FF9933] transition-all"
            >
              Login
            </Button>

          </div>
        </div>
      </nav>


      {/* =========================================================
          HERO
      ========================================================= */}

      <section className="relative pt-32 sm:pt-36 lg:pt-40 pb-20 lg:pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden">

        <div className="absolute top-20 right-[-120px] w-[420px] h-[420px] bg-orange-200/35 rounded-full blur-3xl pointer-events-none" />

        <div className="absolute bottom-[-120px] left-[-120px] w-[420px] h-[420px] bg-yellow-100/50 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-10 items-center">

          {/* LEFT */}

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="order-2 lg:order-1"
          >

            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-orange-100 rounded-full shadow-sm">

              <span className="w-2 h-2 rounded-full bg-[#FF9933]" />

              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.16em]">
                Welcome to HKMV Folk
              </span>

            </div>

            <h1 className="mt-6 text-5xl sm:text-6xl md:text-7xl lg:text-[76px] font-black tracking-tight leading-[0.94]">

              Connect.

              <br />

              Participate.

              <br />

              <span className="text-[#FF9933]">
                Serve.
              </span>

            </h1>

            <p className="mt-7 max-w-xl text-base sm:text-lg text-gray-500 leading-8">
              Discover spiritual sessions, youth programs, workshops,
              events, seva, yatras and community activities through
              HKMV Folk.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">

              <Button
                onClick={onLoginClick}
                className="px-7 py-4 bg-[#FF9933] text-white rounded-xl font-semibold shadow-lg hover:bg-[#e88822] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                Join HKMV Folk
                <ArrowRight size={18} />
              </Button>

              <a
                href="#events"
                className="px-7 py-4 border border-gray-200 bg-white rounded-xl font-semibold hover:border-[#FF9933] hover:text-[#FF9933] transition-all flex items-center justify-center gap-2"
              >
                Explore Events
                <ChevronRight size={18} />
              </a>

            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">

              {['Community', 'Spirituality', 'Seva'].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 text-sm text-gray-500"
                >
                  <CheckCircle2
                    size={17}
                    className="text-[#FF9933]"
                  />
                  {item}
                </div>
              ))}

            </div>

          </motion.div>


          {/* RIGHT IMAGE */}

          <motion.div
            initial={{ opacity: 0, scale: 0.92, x: 30 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="order-1 lg:order-2 relative flex justify-center"
          >

            <div className="relative w-full max-w-[590px]">

              <div className="absolute inset-10 bg-orange-300/30 blur-[90px] rounded-full" />

              <motion.img
                src="/krishna_toy.png"
                alt="Krishna"
                animate={{ y: [0, -10, 0] }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="relative z-10 w-full h-auto object-contain drop-shadow-[0_30px_50px_rgba(255,153,51,0.25)]"
              />

              {/* Sadhana floating card */}

              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute top-[15%] right-0 sm:right-[-15px] z-20 bg-white rounded-2xl shadow-xl border border-gray-100 p-4"
              >

                <div className="flex items-center gap-3">

                  <div className="w-11 h-11 rounded-xl bg-orange-50 text-[#FF9933] flex items-center justify-center">
                    <Flame size={21} />
                  </div>

                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                      Daily Sadhana
                    </p>

                    <p className="text-sm font-black text-gray-900">
                      Spiritual Practice
                    </p>
                  </div>

                </div>

              </motion.div>


              {/* Event floating card */}

              <motion.div
                animate={{ y: [0, 9, 0] }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.5,
                }}
                className="absolute bottom-[14%] left-0 sm:left-[-15px] z-20 bg-white rounded-2xl shadow-xl border border-gray-100 p-4"
              >

                <div className="flex items-center gap-3">

                  <div className="w-11 h-11 rounded-xl bg-yellow-50 text-[#D99D00] flex items-center justify-center">
                    <Calendar size={21} />
                  </div>

                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                      Upcoming
                    </p>

                    <p className="text-sm font-black text-gray-900">
                      Community Events
                    </p>
                  </div>

                </div>

              </motion.div>

            </div>

          </motion.div>

        </div>
      </section>

            {/* =========================================================
          STATS
      ========================================================= */}

      <section className="px-4 sm:px-6 lg:px-8 pb-20">

        <div className="max-w-7xl mx-auto">

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">

            {[
              {
                label: 'Sadhana Streaks',
                value: '15,000+',
                icon: <Flame size={23} />,
              },
              {
                label: 'Active Devotees',
                value: '2,500+',
                icon: <Users size={23} />,
              },
              {
                label: 'Events Hosted',
                value: '120+',
                icon: <Calendar size={23} />,
              },
              {
                label: 'Temple Stays',
                value: '500+',
                icon: <MapPin size={23} />,
              },
            ].map((stat, index) => (

              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-7 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
              >

                <div className="w-11 h-11 rounded-xl bg-orange-50 text-[#FF9933] flex items-center justify-center mb-5">
                  {stat.icon}
                </div>

                <div className="text-2xl sm:text-4xl font-black text-gray-900">
                  {stat.value}
                </div>

                <p className="mt-2 text-xs sm:text-sm font-medium text-gray-400">
                  {stat.label}
                </p>

              </motion.div>

            ))}

          </div>

        </div>

      </section>


      {/* =========================================================
          ABOUT
      ========================================================= */}

      <section
        id="about"
        className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-white"
      >

        <div className="max-w-7xl mx-auto">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            <div>

              <p className="text-sm font-bold text-[#FF9933] uppercase tracking-[0.18em]">
                About HKMV Folk
              </p>

              <h2 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
                A place to
                <span className="text-[#FF9933]">
                  {' '}connect
                </span>
                {' '}and participate.
              </h2>

            </div>

            <div>

              <p className="text-base sm:text-lg text-gray-500 leading-8">
                HKMV Folk brings spiritual sessions, youth programs,
                workshops, events, seva, yatras and other community
                activities together in one place.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-3">

                {[
                  'Spiritual Growth',
                  'Community',
                  'Events',
                  'Seva',
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 px-4 py-3 bg-[#FDF9F1] rounded-xl text-sm font-semibold text-gray-700"
                  >
                    <CheckCircle2
                      size={17}
                      className="text-[#FF9933]"
                    />
                    {item}
                  </div>
                ))}

              </div>

            </div>

          </div>

        </div>
      </section>


      {/* =========================================================
          PROGRAMS
      ========================================================= */}

      <section
        id="programs"
        className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8"
      >

        <div className="max-w-7xl mx-auto">

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-12">

            <div className="max-w-2xl">

              <p className="text-sm font-bold text-[#FF9933] uppercase tracking-[0.18em]">
                Programs & Activities
              </p>

              <h2 className="mt-3 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight">
                Explore what
                <span className="text-[#FF9933]">
                  {' '}HKMV Folk
                </span>
                {' '}offers.
              </h2>

            </div>

            <a
              href="#contact"
              className="flex items-center gap-2 text-sm font-bold text-[#FF9933]"
            >
              Learn More
              <ArrowRight size={17} />
            </a>

          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">

            {programs.map((program, index) => (

              <motion.div
                key={program.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className="group bg-white rounded-3xl border border-gray-100 p-7 shadow-sm hover:-translate-y-1 hover:shadow-xl transition-all"
              >

                <div className="flex items-start justify-between">

                  <div className="w-14 h-14 rounded-2xl bg-orange-50 text-[#FF9933] flex items-center justify-center group-hover:bg-[#FF9933] group-hover:text-white transition-colors">
                    {program.icon}
                  </div>

                  <ChevronRight
                    size={20}
                    className="text-gray-300 group-hover:text-[#FF9933] transition-colors"
                  />

                </div>

                <h3 className="mt-6 text-xl font-bold text-gray-900">
                  {program.title}
                </h3>

                <p className="mt-3 text-sm text-gray-500 leading-6">
                  {program.description}
                </p>

                <div className="mt-6 text-xs font-bold uppercase tracking-wider text-gray-400 group-hover:text-[#FF9933] transition">
                  Explore Program
                </div>

              </motion.div>

            ))}

          </div>

        </div>
      </section>

     {/* ================= EVENTS ================= */}

<section
  id="events"
  className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-white"
>
  <div className="max-w-7xl mx-auto">

    {/* Events Heading */}
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">

      <div>
        <p className="text-sm font-bold text-[#FF9933] uppercase tracking-[0.18em]">
          Events
        </p>

        <h2 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight text-gray-900">
          Upcoming Events
        </h2>

        <p className="mt-4 text-gray-500 max-w-xl leading-7">
          Explore upcoming HKMV Folk events and participate
          in spiritual, cultural and community activities.
        </p>
      </div>

      <a
        href="#events"
        className="flex items-center gap-2 text-sm font-bold text-[#FF9933] hover:gap-3 transition-all"
      >
        View All Events
        <ArrowRight size={17} />
      </a>

    </div>


    {/* Event Cards */}

    {sortedEvents.length > 0 ? (

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {sortedEvents.slice(0, 3).map((event, index) => (

          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.45,
              delay: index * 0.08,
            }}
            className="group bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          >

            {/* Event Image / Placeholder */}

            <div className="relative h-44 bg-gradient-to-br from-orange-50 via-yellow-50 to-orange-100 flex items-center justify-center">

              <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center text-[#FF9933] group-hover:scale-110 transition-transform duration-300">
                <Calendar
                  size={30}
                  strokeWidth={1.8}
                />
              </div>

              <span className="absolute top-4 left-4 px-3 py-1.5 bg-white rounded-full text-[10px] font-bold uppercase tracking-wider text-[#FF9933] shadow-sm">
                {event.category || 'Event'}
              </span>

            </div>


            {/* Event Content */}

            <div className="p-6">

              <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">

                <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
                  <Calendar
                    size={14}
                    className="text-[#FF9933]"
                  />
                </div>

                <span>
                  {event.date}
                  {event.time ? ` • ${event.time}` : ''}
                </span>

              </div>


              <h3 className="mt-4 text-xl font-bold text-gray-900 group-hover:text-[#FF9933] transition-colors">
                {event.title}
              </h3>


              {event.location && (
                <p className="mt-2 text-sm text-gray-400">
                  {event.location}
                </p>
              )}


              {event.description && (
                <p className="mt-3 text-sm text-gray-500 leading-6">
                  {event.description}
                </p>
              )}


              <button
                onClick={onLoginClick}
                className="mt-6 w-full py-3.5 bg-gray-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#FF9933] transition-all duration-300 flex items-center justify-center gap-2"
              >
                View Details
                <ArrowRight size={14} />
              </button>

            </div>

          </motion.div>

        ))}

      </div>

    ) : (

      <div className="border border-gray-200 rounded-3xl py-16 text-center">

        <Calendar
          size={40}
          className="mx-auto text-gray-300"
        />

        <p className="mt-4 text-gray-400">
          No upcoming events available.
        </p>

      </div>

    )}

  </div>
</section>


      {/* =========================================================
          COMMUNITY / APP
      ========================================================= */}

      <section
        id="seva"
        className="py-20 lg:py-32 bg-gray-900 relative overflow-hidden rounded-[3rem] lg:rounded-[5rem] mx-4 lg:mx-12 my-20"
      >

        <div className="absolute top-[-150px] right-[-150px] w-[400px] h-[400px] bg-orange-500/10 blur-3xl rounded-full" />

        <div className="max-w-7xl mx-auto px-6 sm:px-10 grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          <div className="relative z-10">

            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-7">
              <Heart
                className="text-[#FF9933]"
                size={28}
              />
            </div>

            <p className="text-sm font-bold text-[#FF9933] uppercase tracking-[0.18em]">
              Community Experience
            </p>

            <h2 className="mt-4 text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[0.9]">
              Everything
              <br />
              <span className="text-[#FF9933]">
                in one place.
              </span>
            </h2>

            <p className="mt-7 text-lg text-gray-400 leading-8 max-w-lg">
              Access events, activities, seva, accommodation and
              spiritual experiences through a cleaner and easier
              digital interface.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">

              {appFeatures.map((feature) => (

                <div
                  key={feature}
                  className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-semibold text-white"
                >
                  <CheckCircle2
                    size={19}
                    className="text-[#FF9933] shrink-0"
                  />

                  {feature}
                </div>

              ))}

            </div>

          </div>


          {/* PHONE */}

          <div className="flex justify-center">

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative w-full max-w-[330px]"
            >

              <div className="bg-gray-800 rounded-[3.4rem] p-3 shadow-2xl">

                <div className="bg-white rounded-[2.8rem] p-4">

                  <div className="bg-[#FDF9F1] rounded-[2.3rem] p-5 min-h-[580px]">

                    {/* PHONE HEADER */}

                    <div className="flex items-center justify-between mb-7">

                      <div className="flex items-center gap-3">

                        <div className="w-11 h-11 rounded-xl bg-[#FF9933] flex items-center justify-center text-white">
                          <User size={20} />
                        </div>

                        <div>

                          <p className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">
                            Member
                          </p>

                          <p className="font-bold text-gray-900">
                            HKMV Folk
                          </p>

                        </div>

                      </div>

                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                        <Bell
                          size={17}
                          className="text-[#FF9933]"
                        />
                      </div>

                    </div>


                    {/* DIGITAL CARD */}

                    <div className="bg-gray-900 rounded-3xl p-6 text-white mb-6 relative overflow-hidden">

                      <div className="absolute top-[-50px] right-[-40px] w-32 h-32 rounded-full bg-orange-500/10" />

                      <div className="flex justify-between relative z-10">

                        <img
                          src="/logo.png"
                          alt="Logo"
                          className="h-6 w-auto brightness-0 invert opacity-60"
                        />

                        <Sparkles
                          size={19}
                          className="text-[#FFD166]"
                        />

                      </div>

                      <div className="mt-12 relative z-10">

                        <p className="text-[9px] uppercase tracking-widest text-gray-500">
                          Digital Identity
                        </p>

                        <p className="mt-1 text-lg font-bold">
                          HKMV Folk
                        </p>

                      </div>

                    </div>


                    {/* QUICK ACCESS */}

                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 px-1 mb-4">
                      Quick Access
                    </p>

                    <div className="space-y-3">

                      {quickAccess.map((item) => (

                        <div
                          key={item.title}
                          className="p-4 bg-white rounded-2xl flex items-center justify-between shadow-sm"
                        >

                          <div className="flex items-center gap-4">

                            <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#FF9933] flex items-center justify-center">
                              {item.icon}
                            </div>

                            <span className="text-sm font-bold">
                              {item.title}
                            </span>

                          </div>

                          <ChevronRight
                            size={15}
                            className="text-gray-300"
                          />

                        </div>

                      ))}

                    </div>


                    {/* PHONE NAV */}

                    <div className="mt-8 h-14 bg-white rounded-full shadow-sm flex items-center justify-around">

                      <div className="w-9 h-9 rounded-full bg-[#FF9933] text-white flex items-center justify-center">
                        <Heart size={16} />
                      </div>

                      <Calendar
                        size={18}
                        className="text-gray-300"
                      />

                      <Home
                        size={18}
                        className="text-gray-300"
                      />

                      <User
                        size={18}
                        className="text-gray-300"
                      />

                    </div>

                  </div>

                </div>

              </div>

            </motion.div>

          </div>

        </div>
      </section>


      {/* =========================================================
    ACCOMMODATION
========================================================= */}

<section
  id="accommodation"
  className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-white"
>
  <div className="max-w-7xl mx-auto">

    {/* SECTION HEADER */}

    <div className="max-w-2xl mb-12">

      <p className="text-sm font-bold text-[#FF9933] uppercase tracking-[0.18em]">
        Accommodation
      </p>

      <h2 className="mt-3 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
        A comfortable
        <span className="text-[#FF9933]">
          {' '}stay experience.
        </span>
      </h2>

      <p className="mt-5 text-base sm:text-lg text-gray-500 leading-8">
        Explore accommodation options, facilities and stay information
        in one simple place. Find the details you need before requesting
        your stay.
      </p>

    </div>


    {/* MAIN CONTENT */}

    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

      {/* LEFT FEATURE CARD */}

      <motion.div
        initial={{ opacity: 0, x: -25 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="lg:col-span-2 relative overflow-hidden rounded-[2rem] bg-gray-900 p-7 sm:p-9 min-h-[390px] flex flex-col justify-between"
      >

        <div className="absolute top-[-100px] right-[-100px] w-72 h-72 bg-orange-500/10 rounded-full blur-3xl" />

        <div className="absolute bottom-[-120px] left-[-120px] w-72 h-72 bg-yellow-500/10 rounded-full blur-3xl" />

        <div className="relative z-10">

          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
            <Home
              size={27}
              className="text-[#FF9933]"
            />
          </div>

          <p className="mt-8 text-[10px] uppercase tracking-[0.18em] text-gray-500 font-bold">
            Temple Stay
          </p>

          <h3 className="mt-3 text-3xl sm:text-4xl font-black text-white leading-tight">
            Stay close to
            <span className="text-[#FF9933]">
              {' '}the experience.
            </span>
          </h3>

          <p className="mt-5 text-sm sm:text-base text-gray-400 leading-7 max-w-md">
            Check room information, facilities, availability and
            stay guidelines before submitting your accommodation request.
          </p>

        </div>

        <Button
          onClick={onLoginClick}
          className="relative z-10 mt-8 w-full sm:w-fit px-7 py-4 bg-[#FF9933] text-white rounded-xl font-semibold hover:bg-[#e88822] transition-all flex items-center justify-center gap-2"
        >
          Request Accommodation
          <ArrowRight size={17} />
        </Button>

      </motion.div>


      {/* RIGHT INFORMATION GRID */}

      <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">

        {[
          {
            title: 'Location',
            description:
              'View the accommodation location and nearby access points.',
            icon: <MapPin size={22} />,
          },
          {
            title: 'Room Information',
            description:
              'Understand room types and available stay options.',
            icon: <Home size={22} />,
          },
          {
            title: 'Facilities',
            description:
              'Explore the facilities available during your stay.',
            icon: <CheckCircle2 size={22} />,
          },
          {
            title: 'Availability',
            description:
              'Check available accommodation before requesting a stay.',
            icon: <Calendar size={22} />,
          },
          {
            title: 'Photos',
            description:
              'Get a visual idea of the accommodation and surroundings.',
            icon: <Sparkles size={22} />,
          },
          {
            title: 'Rules & Guidelines',
            description:
              'Review important stay rules and guidelines.',
            icon: <BookOpen size={22} />,
          },
        ].map((item, index) => (

          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.4,
              delay: index * 0.06,
            }}
            className="group bg-[#FDF9F1] rounded-2xl border border-orange-50 p-6 hover:bg-white hover:border-orange-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          >

            <div className="flex items-start justify-between">

              <div className="w-12 h-12 rounded-xl bg-white text-[#FF9933] flex items-center justify-center shadow-sm group-hover:bg-[#FF9933] group-hover:text-white transition-colors">
                {item.icon}
              </div>

              <ChevronRight
                size={18}
                className="text-gray-300 group-hover:text-[#FF9933] transition-colors"
              />

            </div>

            <h3 className="mt-5 text-lg font-bold text-gray-900">
              {item.title}
            </h3>

            <p className="mt-2 text-sm text-gray-500 leading-6">
              {item.description}
            </p>

          </motion.div>

        ))}

      </div>

    </div>

  </div>
</section>


      {/* =========================================================
    GALLERY
========================================================= */}

<section
  id="gallery"
  className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#FDF9F1]"
>
  <div className="max-w-7xl mx-auto">

    {/* HEADER */}

    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-12">

      <div className="max-w-2xl">

        <p className="text-sm font-bold text-[#FF9933] uppercase tracking-[0.18em]">
          Gallery
        </p>

        <h2 className="mt-3 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-gray-900">
          Moments that
          <span className="text-[#FF9933]">
            {' '}bring us together.
          </span>
        </h2>

        <p className="mt-5 text-base sm:text-lg text-gray-500 leading-8">
          Explore moments from HKMV Folk events, youth activities,
          seva, workshops, festivals and spiritual gatherings.
        </p>

      </div>

      <a
        href="#contact"
        className="flex items-center gap-2 text-sm font-bold text-[#FF9933] hover:gap-3 transition-all"
      >
        View More
        <ArrowRight size={17} />
      </a>

    </div>


    {/* GALLERY GRID */}

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

      {[
        {
          title: 'Events',
          gradient: 'from-orange-400 via-amber-300 to-yellow-200',
          icon: <Calendar size={40} />,
          size: 'lg:col-span-2 lg:row-span-2',
        },
        {
          title: 'Youth Activities',
          gradient: 'from-sky-400 via-blue-300 to-indigo-200',
          icon: <Users size={40} />,
          size: '',
        },
        {
          title: 'Seva',
          gradient: 'from-rose-400 via-red-300 to-orange-200',
          icon: <Heart size={40} />,
          size: '',
        },
        {
          title: 'Workshops',
          gradient: 'from-emerald-400 via-green-300 to-lime-200',
          icon: <BookOpen size={40} />,
          size: '',
        },
        {
          title: 'Festivals',
          gradient: 'from-violet-400 via-purple-300 to-fuchsia-200',
          icon: <Sparkles size={40} />,
          size: '',
        },
        {
          title: 'Yatras',
          gradient: 'from-teal-400 via-cyan-300 to-sky-200',
          icon: <MapPin size={40} />,
          size: 'lg:col-span-2',
        },
      ].map((item, index) => (

        <motion.div
          key={item.title}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.45,
            delay: index * 0.06,
          }}
          className={`group relative overflow-hidden rounded-[1.75rem] bg-white border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 min-h-[210px] ${item.size}`}
        >

          {/* IMAGE PLACEHOLDER */}

          <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white/80 group-hover:scale-105 transition-transform duration-700`}>
            {item.icon}
          </div>

          {/* IMAGE OVERLAY */}

          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

          {/* TOP BADGE */}

          <div className="absolute top-4 left-4">

            <span className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-wider text-gray-700 shadow-sm">
              HKMV Folk
            </span>

          </div>


          {/* CONTENT */}

          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">

            <div className="flex items-end justify-between gap-4">

              <div>

                <h3 className="text-xl sm:text-2xl font-black text-white">
                  {item.title}
                </h3>

                <p className="mt-1 text-xs text-white/70">
                  Explore moments & activities
                </p>

              </div>

              <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:bg-[#FF9933] group-hover:border-[#FF9933] transition-all shrink-0">

                <ChevronRight size={18} />

              </div>

            </div>

          </div>

        </motion.div>

      ))}

    </div>

  </div>
</section>

      {/* =========================================================
    TESTIMONIALS
========================================================= */}

<section
  id="testimonials"
  className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-white"
>
  <div className="max-w-7xl mx-auto">

    {/* HEADER */}

    <div className="text-center max-w-3xl mx-auto">

      <p className="text-sm font-bold text-[#FF9933] uppercase tracking-[0.18em]">
        Community Voices
      </p>

      <h2 className="mt-3 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight">
        What Our
        <span className="text-[#FF9933]">
          {' '}Community Says.
        </span>
      </h2>

      <p className="mt-5 text-base sm:text-lg text-gray-500 leading-8">
        Real experiences from participants who are part of
        HKMV Folk activities and community initiatives.
      </p>

    </div>


    {/* TESTIMONIAL CARDS */}

    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">

      {[
        {
          category: 'Community',
          placeholder:
            'Real participant feedback can be displayed here.',
        },
        {
          category: 'Spiritual Experience',
          placeholder:
            'Share a genuine experience from an HKMV Folk participant.',
        },
        {
          category: 'Seva & Activities',
          placeholder:
            'Highlight a real community experience or seva journey.',
        },
      ].map((item, index) => (

        <motion.div
          key={item.category}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.45,
            delay: index * 0.08,
          }}
          className="group bg-[#FDF9F1] rounded-3xl border border-gray-200 p-7 sm:p-8 hover:bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
        >

          {/* STARS */}

          <div className="flex gap-1 text-[#FF9933]">

            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className="text-sm"
              >
                ★
              </span>
            ))}

          </div>


          {/* QUOTE */}

          <div className="mt-6">

            <span className="text-4xl font-black text-orange-200 leading-none">
              “
            </span>

            <p className="mt-2 text-sm sm:text-base text-gray-500 leading-7">
              {item.placeholder}
            </p>

          </div>


          {/* PERSON PLACEHOLDER */}

          <div className="mt-7 pt-5 border-t border-gray-200">

            <div className="flex items-center gap-3">

              <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center">
                <Users
                  size={19}
                  className="text-[#FF9933]"
                />
              </div>

              <div>

                <p className="text-sm font-bold text-gray-800">
                  Community Participant
                </p>

                <p className="text-xs text-gray-400">
                  {item.category}
                </p>

              </div>

            </div>

          </div>

        </motion.div>

      ))}

    </div>


    {/* NOTE */}

    <div className="mt-8 text-center">

      <p className="text-xs text-gray-400">
        Testimonials will be updated with genuine participant
        experiences and feedback.
      </p>

    </div>

  </div>
</section>                  


      {/* =========================================================
    CTA
========================================================= */}

<section
  id="join"
  className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8 bg-[#FDF9F1]"
>
  <div className="max-w-6xl mx-auto">

    <div className="relative overflow-hidden bg-gray-900 rounded-[2.5rem] lg:rounded-[3.5rem] p-10 sm:p-16 lg:p-24 text-center">

      {/* BACKGROUND GLOW */}

      <div className="absolute top-[-140px] left-[-100px] w-80 h-80 bg-orange-500/10 rounded-full blur-3xl" />

      <div className="absolute bottom-[-140px] right-[-100px] w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl" />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />


      {/* CONTENT */}

      <div className="relative z-10">

        {/* ICON */}

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="w-20 h-20 bg-white/10 border border-white/10 rounded-3xl flex items-center justify-center mx-auto"
        >
          <Sparkles
            size={34}
            className="text-[#FF9933]"
          />
        </motion.div>


        {/* LABEL */}

        <p className="mt-8 text-sm font-bold text-[#FF9933] uppercase tracking-[0.18em]">
          Be Part of the Community
        </p>


        {/* HEADING */}

        <h2 className="mt-4 text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[0.95]">

          Connect.
          <br />

          <span className="text-[#FF9933]">
            Participate.
          </span>

          <br />

          Serve.

        </h2>


        {/* DESCRIPTION */}

        <p className="mt-7 text-base sm:text-lg text-gray-400 max-w-2xl mx-auto leading-8">
          Discover spiritual experiences, events, seva, sadhana
          and community activities through HKMV Folk.
        </p>


        {/* BUTTONS */}

        <div className="mt-9 flex flex-col sm:flex-row justify-center gap-4">

          <Button
            onClick={onLoginClick}
            className="px-9 py-4 bg-[#FF9933] text-white rounded-xl font-bold hover:bg-[#e88822] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            Join HKMV Folk
            <ArrowRight size={18} />
          </Button>

          <a
            href="#events"
            className="px-9 py-4 bg-white/10 border border-white/15 text-white rounded-xl font-bold hover:bg-white hover:text-gray-900 transition-all flex items-center justify-center gap-2"
          >
            Explore Events
            <ChevronRight size={18} />
          </a>

        </div>


        {/* QUICK BENEFITS */}

        <div className="mt-10 pt-8 border-t border-white/10">

          <div className="flex flex-wrap justify-center gap-x-7 gap-y-3">

            {[
              'Events',
              'Seva',
              'Sadhana',
              'Accommodation',
              'Community',
            ].map((item) => (

              <div
                key={item}
                className="flex items-center gap-2 text-xs sm:text-sm text-gray-400"
              >

                <CheckCircle2
                  size={15}
                  className="text-[#FF9933]"
                />

                {item}

              </div>

            ))}

          </div>

        </div>

      </div>

    </div>

  </div>
</section>


      {/* =========================================================
    CONTACT
========================================================= */}

<section
  id="contact"
  className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-white"
>
  <div className="max-w-7xl mx-auto">

    {/* Contact Heading */}
    <div className="max-w-2xl">
      <p className="text-sm font-bold text-[#FF9933] uppercase tracking-[0.18em]">
        Contact
      </p>

      <h2 className="mt-3 text-4xl sm:text-5xl font-black tracking-tight">
        Get in touch.
      </h2>

      <p className="mt-4 text-gray-500 leading-7">
        Have questions about programs, events, seva or
        accommodation? Connect with HKMV Folk.
      </p>
    </div>

    {/* Contact Cards */}
    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-5">

      {/* Address */}
      <div className="p-7 bg-[#FDF9F1] rounded-3xl border border-orange-50 hover:shadow-md transition-shadow">

        <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
          <MapPin
            className="text-[#FF9933]"
            size={25}
          />
        </div>

        <h3 className="mt-5 font-bold text-gray-900">
          Address
        </h3>

        <p className="mt-2 text-sm text-gray-500 leading-6">
          HKMV Folk / Temple Location
        </p>

      </div>


      {/* Phone / Email */}
      <div className="p-7 bg-[#FDF9F1] rounded-3xl border border-orange-50 hover:shadow-md transition-shadow">

        <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
          <Music
            className="text-[#FF9933]"
            size={25}
          />
        </div>

        <h3 className="mt-5 font-bold text-gray-900">
          Phone / Email
        </h3>

        <p className="mt-2 text-sm text-gray-500 leading-6">
          Contact information can be added here.
        </p>

      </div>


      {/* Location */}
      <div className="p-7 bg-[#FDF9F1] rounded-3xl border border-orange-50 hover:shadow-md transition-shadow">

        <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
          <MapPin
            className="text-[#FF9933]"
            size={25}
          />
        </div>

        <h3 className="mt-5 font-bold text-gray-900">
          Location / Map
        </h3>

        <p className="mt-2 text-sm text-gray-500 leading-6">
          Map and location details can be displayed here.
        </p>

      </div>

    </div>

  </div>
</section>


{/* =========================================================
    FOOTER
========================================================= */}

<footer className="py-14 px-6 lg:px-12 bg-gray-900 border-t border-gray-800">

  <div className="max-w-7xl mx-auto">

    <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

      {/* BRAND */}

      <div className="md:col-span-1">

        <img
          src="/logo.png"
          alt="Folk Vizag Logo"
          className="h-10 w-auto object-contain brightness-0 invert"
        />

        <p className="mt-5 text-sm text-gray-400 leading-6 max-w-xs">
          Connecting people through spirituality, community,
          seva and meaningful experiences.
        </p>

      </div>


      {/* QUICK LINKS */}

      <div>

        <h3 className="text-sm font-bold text-white">
          Explore
        </h3>

        <div className="mt-5 flex flex-col gap-3">

          <a
            href="#about"
            className="text-sm text-gray-400 hover:text-[#FF9933] transition"
          >
            About
          </a>

          <a
            href="#programs"
            className="text-sm text-gray-400 hover:text-[#FF9933] transition"
          >
            Programs
          </a>

          <a
            href="#events"
            className="text-sm text-gray-400 hover:text-[#FF9933] transition"
          >
            Events
          </a>

          <a
            href="#gallery"
            className="text-sm text-gray-400 hover:text-[#FF9933] transition"
          >
            Gallery
          </a>

        </div>

      </div>


      {/* COMMUNITY */}

      <div>

        <h3 className="text-sm font-bold text-white">
          Community
        </h3>

        <div className="mt-5 flex flex-col gap-3">

          <a
            href="#seva"
            className="text-sm text-gray-400 hover:text-[#FF9933] transition"
          >
            Seva
          </a>

          <a
            href="#accommodation"
            className="text-sm text-gray-400 hover:text-[#FF9933] transition"
          >
            Accommodation
          </a>

          <a
            href="#testimonials"
            className="text-sm text-gray-400 hover:text-[#FF9933] transition"
          >
            Community Voices
          </a>

          <a
            href="#join"
            className="text-sm text-gray-400 hover:text-[#FF9933] transition"
          >
            Join HKMV Folk
          </a>

        </div>

      </div>


      {/* CONNECT */}

      <div>

        <h3 className="text-sm font-bold text-white">
          Connect
        </h3>

        <p className="mt-5 text-sm text-gray-400 leading-6">
          Stay connected with HKMV Folk and discover upcoming
          activities and community experiences.
        </p>

        <div className="mt-5 flex gap-3">

          {[1, 2, 3].map((item) => (

            <button
              key={item}
              type="button"
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-[#FF9933] hover:border-[#FF9933] transition"
            >
              <Music size={16} />
            </button>

          ))}

        </div>

      </div>

    </div>


    {/* BOTTOM */}

    <div className="mt-12 pt-7 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">

      <p className="text-xs text-gray-500">
        © {new Date().getFullYear()} FOLK VIZAG. All rights reserved.
      </p>

      <p className="text-xs text-gray-500">
        Spirituality • Community • Seva
      </p>

    </div>

  </div>

</footer>

</div>
);
};

export default Landing;