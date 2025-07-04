import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import { Features } from '@/app/components/features';
import { AzureIntegration } from '@/app/components/azure';
import Link from 'next/link';
import Image from 'next/image';

export default async function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0B1120] via-[#132145] to-[#1E1B4B]">
      <Header userName="" />  
      
      <main className="flex-grow flex flex-col">
        {/* Hero Section - Optimized with reduced animations */}
        <section className="flex-1 flex items-center justify-center relative min-h-[calc(100vh-4rem)] px-4 sm:px-6 py-16 sm:py-20 md:py-24 overflow-hidden mt-10">
          {/* Simplified Background - Single gradient with subtle animation */}
          <div 
            className="absolute inset-0 overflow-hidden"
            style={{ willChange: 'transform' }}
          >
            <div 
              className="absolute w-full h-full bg-gradient-to-br from-purple-500/10 via-blue-500/5 to-transparent"
              style={{
                willChange: 'opacity',
                animation: 'pulse 8s ease-in-out infinite'
              }}
            />
            {/* Optimized grid overlay with reduced opacity */}
            <div 
              className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10"
              style={{
                maskImage: 'radial-gradient(ellipse at center, white, transparent)',
                WebkitMaskImage: 'radial-gradient(ellipse at center, white, transparent)'
              }}
            />
          </div>

          <div className="container mx-auto relative z-10">
            <div className="max-w-[95%] sm:max-w-[90%] md:max-w-5xl mx-auto text-center">
              {/* Optimized Badge - Reduced animation complexity */}
              <div 
                className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-sm mb-6 sm:mb-8"
                style={{ willChange: 'transform' }}
              >
                <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-indigo-400 mr-2" />
                <span className="text-indigo-400 text-xs sm:text-sm font-medium">
                  Elevate Your Team's Performance
                </span>
              </div>
              
              {/* Main Heading - Optimized gradient animation */}
              <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 sm:mb-8 leading-[1.1] sm:leading-[1.1] tracking-tight">
                Transform Goals Into
                <span className="relative block mt-2 sm:mt-3">
                  <span 
                    className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"
                    style={{
                      willChange: 'background-position',
                      backgroundSize: '200% auto',
                      animation: 'gradientFlow 4s linear infinite'
                    }}
                  >
                    Achievements
                  </span>
                </span>
              </h1>
              
              {/* Description */}
              <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-8 sm:mb-10 max-w-xl sm:max-w-2xl mx-auto leading-relaxed">
                AspireHub helps organizations streamline employee management, set meaningful goals, 
                and track progress with powerful analytics and intuitive dashboards.
              </p>

              {/* CTA Section - Optimized hover effects */}
              <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4">
                <Link
                  href="/login"
                  className="w-full sm:w-auto group relative inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-base sm:text-lg font-semibold overflow-hidden transition-transform duration-300 hover:-translate-y-1"
                  style={{ willChange: 'transform' }}
                >
                  <span className="relative flex items-center">
                    Get Started Now
                    <svg 
                      className="w-4 h-4 sm:w-5 sm:h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" 
                      style={{ willChange: 'transform' }}
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