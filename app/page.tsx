import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import Image from 'next/image';
import FeaturesButton from '@/components/FeaturesButton';

export default async function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#0f172a] to-[#1e1b4b]">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="mt-12 sm:mt-20 relative py-16 sm:py-32 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
          <div className="absolute inset-0 bg-[#0f172a]/50"></div>
          
          <div className="container mx-auto text-center relative z-10">
            <div className="max-w-4xl mx-auto">
              <div className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs sm:text-sm font-medium mb-4 sm:mb-8">
                Welcome to the Future of Performance Management
              </div>
              <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold text-white mb-4 sm:mb-8 leading-tight">
                Employee Performance <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">System</span>
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
                Streamline your performance management process with our comprehensive solution.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
                <Link
                  href="/login"
                  className="px-6 sm:px-8 py-3 sm:py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 hover:shadow-indigo-500/25"
                >
                  Get Started
                </Link>
                <FeaturesButton />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 sm:py-32 px-4 bg-[#0f172a]/50 backdrop-blur-sm">
          <div className="container mx-auto">
            <div className="text-center mb-8 sm:mb-16">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">
                Everything You Need
              </h2>
              <p className="text-base sm:text-xl text-gray-400 max-w-2xl mx-auto">
                Comprehensive tools to manage and improve employee performance
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
              {[
                {
                  icon: '🎯',
                  title: 'Set Goals',
                  description: 'Define clear objectives and track progress effectively',
                  gradient: 'from-indigo-500 to-purple-500'
                },
                {
                  icon: '📊',
                  title: 'Track Progress',
                  description: 'Monitor achievements and identify areas for improvement',
                  gradient: 'from-purple-500 to-pink-500'
                },
                {
                  icon: '💬',
                  title: 'Get Feedback',
                  description: 'Receive valuable insights and grow professionally',
                  gradient: 'from-pink-500 to-indigo-500'
                }
              ].map((feature, index) => (
                <div 
                  key={index}
                  className="group bg-[#1e1b4b]/30 p-6 sm:p-8 rounded-2xl backdrop-blur-sm border border-indigo-500/20 hover:border-indigo-500/50 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl hover:shadow-indigo-500/10"
                >
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-4 sm:mb-6 text-2xl sm:text-3xl group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2 sm:mb-4 group-hover:text-indigo-400 transition-colors duration-300">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
} 