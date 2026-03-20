import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { Features } from '@/app/components/features';
import { AzureIntegration } from '@/app/components/azure';
import Link from 'next/link';

export default async function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-primary">
      <Header userName="" />

      <main className="flex-grow flex flex-col">
        {/* Hero Section */}
        <section className="flex-1 flex items-center justify-center relative min-h-[calc(100vh-4rem)] px-4 sm:px-6 py-16 sm:py-20 md:py-24 overflow-hidden mt-10">
          {/* Background layers */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Aurora glow */}
            <div
              className="absolute w-full h-full bg-gradient-to-br from-indigo-500/[0.08] via-purple-500/[0.04] to-transparent"
              style={{ animation: 'pulse 8s ease-in-out infinite' }}
            />
            {/* Grid overlay */}
            <div
              className="absolute inset-0 opacity-[0.025]"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(99, 102, 241, 0.5) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(99, 102, 241, 0.5) 1px, transparent 1px)
                `,
                backgroundSize: '80px 80px',
                maskImage: 'radial-gradient(ellipse at center, white, transparent)',
                WebkitMaskImage: 'radial-gradient(ellipse at center, white, transparent)',
              }}
            />
            {/* Nebula center glow */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(99, 102, 241, 0.06) 0%, rgba(139, 92, 246, 0.03) 40%, transparent 70%)',
                filter: 'blur(60px)',
              }}
            />
          </div>

          <div className="container mx-auto relative z-10">
            <div className="max-w-[95%] sm:max-w-[90%] md:max-w-5xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-indigo-500/[0.08] border border-indigo-500/[0.15] backdrop-blur-sm mb-6 sm:mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-400" />
                </span>
                <span className="text-indigo-300 text-xs sm:text-sm font-medium">
                  Elevate Your Team&apos;s Performance
                </span>
              </div>

              {/* Heading */}
              <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-primary mb-6 sm:mb-8 leading-[1.1] tracking-tight">
                Transform Goals Into
                <span className="relative block mt-2 sm:mt-3">
                  <span
                    className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 animate-gradient"
                  >
                    Achievements
                  </span>
                </span>
              </h1>

              {/* Description */}
              <p className="text-base sm:text-lg md:text-xl text-secondary mb-8 sm:mb-10 max-w-xl sm:max-w-2xl mx-auto leading-relaxed">
                AspireHub helps organizations streamline employee management, set meaningful goals,
                and track progress with powerful analytics and intuitive dashboards.
              </p>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4">
                <Link
                  href="/login"
                  className="w-full sm:w-auto group relative inline-flex items-center justify-center px-7 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-base sm:text-lg font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all duration-300 hover:-translate-y-0.5"
                >
                  <span className="relative flex items-center gap-2">
                    Get Started Now
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <Features />

        {/* Azure Integration Section */}
        <AzureIntegration />
      </main>

      <Footer />
    </div>
  );
}
