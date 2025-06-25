import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import Image from 'next/image';

export default async function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0B1120] via-[#132145] to-[#1E1B4B]">
      <Header />
      
      <main className="flex-grow mt-20">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center justify-center px-4 py-12 overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10"></div>
            {/* Floating Achievement Icons */}
            <div className="absolute top-20 left-10 animate-float-slow">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg rotate-12 flex items-center justify-center text-2xl">🏆</div>
            </div>
            <div className="absolute top-40 right-20 animate-float-medium">
              <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg -rotate-12 flex items-center justify-center text-xl">📈</div>
            </div>
            <div className="absolute bottom-32 left-1/4 animate-float-fast">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg rotate-45 flex items-center justify-center text-lg">⭐</div>
            </div>
            {/* Animated Circles */}
            <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
            <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse-medium"></div>
          </div>

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
                Empower your team with our innovative Bistec AspireHub. Set goals, track progress, and celebrate success together.
              </p>

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
        <section className="py-20 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent"></div>
          
          <div className="container mx-auto relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Empower Your Workforce
              </h2>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                A comprehensive suite of tools designed to drive performance and engagement
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: '🎯',
                  title: 'Smart Goal Setting',
                  description: 'Set and track SMART goals with our intuitive goal-setting framework',
                  gradient: 'from-blue-500 to-indigo-500',
                  animation: 'hover:scale-105'
                },
                {
                  icon: '📊',
                  title: 'Real-time Progress',
                  description: 'Monitor achievements and milestones with interactive dashboards',
                  gradient: 'from-purple-500 to-pink-500',
                  animation: 'hover:scale-105'
                },
                {
                  icon: '🌟',
                  title: 'Recognition & Rewards',
                  description: 'Celebrate success with our built-in recognition and rewards system',
                  gradient: 'from-pink-500 to-rose-500',
                  animation: 'hover:scale-105'
                }
              ].map((feature, index) => (
                <div 
                  key={index}
                  className={`group relative p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-purple-500/50 transition-all duration-500 ${feature.animation}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-2xl"></div>
                  <div className={`w-16 h-16 flex items-center justify-center text-2xl rounded-xl bg-gradient-to-br ${feature.gradient} mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 transition-all duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section with Animation */}
        <section className="py-20 px-4 bg-gradient-to-b from-transparent to-[#0B1120]">
          <div className="container mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { number: '93%', label: 'Employee Engagement', icon: '📈' },
                { number: '45%', label: 'Performance Boost', icon: '🚀' },
                { number: '2.5x', label: 'Goal Completion', icon: '✅' },
                { number: '87%', label: 'Team Satisfaction', icon: '😊' }
              ].map((stat, index) => (
                <div key={index} className="text-center group hover:transform hover:scale-105 transition-all duration-300">
                  <div className="text-4xl mb-2">{stat.icon}</div>
                  <div className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2 animate-pulse">
                    {stat.number}
                  </div>
                  <div className="text-gray-400 group-hover:text-gray-300 transition-colors duration-300">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-20 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] to-transparent"></div>
          <div className="container mx-auto relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Ready to Transform Your Team's Performance?
              </h2>
              <p className="text-gray-400 text-lg mb-8">
                Join thousands of companies already using our platform to achieve their goals.
              </p>
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
        </section>
      </main>

      <Footer />
    </div>
  );
} 