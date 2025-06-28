import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Features } from '@/components/features';
import { Performance } from '@/components/performance';
import { AzureIntegration } from '@/components/azure';
import Link from 'next/link';
import Image from 'next/image';

export default async function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0B1120] via-[#132145] to-[#1E1B4B]">
      <Header userName="J" />  
      
      <main className="flex-grow mt-10">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center justify-center px-4 py-12 overflow-hidden">
          

          <div className="container mx-auto relative z-10">
            <div className="max-w-[90%] md:max-w-5xl mx-auto text-center">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-sm mb-6">
                <span className="w-2 h-2 rounded-full bg-indigo-400 mr-2 animate-ping"></span>
                <span className="text-indigo-400 text-sm font-medium">Elevate Your Team's Performance</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Transform Goals Into
                <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 animate-gradient">
                  Achievements
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              AzpireHub helps organizations streamline employee management, set meaningful goals, 
              and track progress with powerful analytics and intuitive dashboards.              </p>

              <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <Link
                  href="/login"
                  className="inline-flex items-center px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-lg font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 transform hover:-translate-y-1"
                >
                  Get Started Now
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <Features />

        {/* Performance Section */}
        <Performance />

        {/* Azure Integration Section */}
        <AzureIntegration />

        

        
      </main>

      <Footer />
    </div>
  );
} 