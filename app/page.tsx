import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Features } from '@/components/features';
import { AzureIntegration } from '@/components/azure';
import Link from 'next/link';
import Image from 'next/image';

export default async function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0B1120] via-[#132145] to-[#1E1B4B]">
      <Header userName="" />  
      
      <main className="flex-grow flex flex-col">
        {/* Hero Section */}
        <section className="flex-1 flex items-center justify-center relative min-h-[calc(100vh-4rem)] px-4 sm:px-6 py-16 sm:py-20 md:py-24 overflow-hidden mt-10">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute w-[300px] sm:w-[400px] md:w-[500px] h-[300px] sm:h-[400px] md:h-[500px] -top-24 sm:-top-32 md:-top-48 -left-24 sm:-left-32 md:-left-48 bg-purple-500/30 rounded-full blur-3xl animate-pulse-slow"></div>
            <div className="absolute w-[250px] sm:w-[300px] md:w-[400px] h-[250px] sm:h-[300px] md:h-[400px] -bottom-16 sm:-bottom-24 md:-bottom-32 -right-16 sm:-right-24 md:-right-32 bg-blue-500/20 rounded-full blur-3xl animate-pulse-medium"></div>
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:radial-gradient(ellipse_at_center,white,transparent)] opacity-20"></div>
          </div>

          {/* Floating Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-20 sm:w-24 md:w-32 h-20 sm:h-24 md:h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-lg backdrop-blur-sm border border-white/10 transform rotate-12 animate-float-slow"></div>
            <div className="absolute bottom-1/3 right-1/3 w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 bg-gradient-to-br from-blue-500/10 to-transparent rounded-lg backdrop-blur-sm border border-white/10 transform -rotate-12 animate-float-medium"></div>
          </div>

          <div className="container mx-auto relative z-10">
            <div className="max-w-[95%] sm:max-w-[90%] md:max-w-5xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-sm mb-6 sm:mb-8 transform hover:scale-105 transition-transform duration-300">
                <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-indigo-400 mr-2 animate-ping"></span>
                <span className="text-indigo-400 text-xs sm:text-sm font-medium">Elevate Your Team's Performance</span>
              </div>
              
              {/* Main Heading */}
              <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 sm:mb-8 leading-[1.1] sm:leading-[1.1] tracking-tight">
                Transform Goals Into
                <span className="relative block mt-2 sm:mt-3">
                  <span className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-xl"></span>
                  <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 animate-gradient">
                    Achievements
                  </span>
                </span>
              </h1>
              
              {/* Description */}
              <p className="text-base sm:text-lg md:text-xl text-gray-300 mb-8 sm:mb-10 max-w-xl sm:max-w-2xl mx-auto leading-relaxed">
                AspireHub helps organizations streamline employee management, set meaningful goals, 
                and track progress with powerful analytics and intuitive dashboards.
              </p>

              {/* CTA Section */}
              <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4">
                <Link
                  href="/login"
                  className="w-full sm:w-auto group relative inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-base sm:text-lg font-semibold overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/25 transform hover:-translate-y-1"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  <span className="relative flex items-center">
                    Get Started Now
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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