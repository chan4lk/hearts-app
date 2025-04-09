import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import Image from 'next/image';

export default async function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-900 to-gray-800">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative py-24 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-indigo-500/10"></div>
          
          <div className="container mx-auto text-center relative z-10">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
                Employee Performance <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500">System</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
                Streamline your performance management process with our comprehensive solution.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <Link
                  href="/login"
                  className="px-8 py-4 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Get Started
                </Link>
                <Link
                  href="/features"
                  className="px-8 py-4 rounded-lg border-2 border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white transition-all duration-300 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 px-4 bg-gray-800/50">
          <div className="container mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Key Features
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Everything you need to manage and improve employee performance
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  number: '1',
                  title: 'Set Goals',
                  description: 'Define clear objectives and track progress effectively',
                  icon: '🎯'
                },
                {
                  number: '2',
                  title: 'Track Progress',
                  description: 'Monitor achievements and identify areas for improvement',
                  icon: '📊'
                },
                {
                  number: '3',
                  title: 'Get Feedback',
                  description: 'Receive valuable insights and grow professionally',
                  icon: '💬'
                }
              ].map((feature, index) => (
                <div 
                  key={index}
                  className="bg-gray-900/50 p-8 rounded-xl backdrop-blur-sm border border-gray-700 hover:border-purple-500/50 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-xl"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center mb-6 text-3xl">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-4">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-24 px-4 bg-gray-900">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { number: '100+', label: 'Active Users' },
                { number: '24/7', label: 'Support Available' },
                { number: '99%', label: 'Satisfaction Rate' }
              ].map((stat, index) => (
                <div 
                  key={index}
                  className="text-center p-8 bg-gray-800/50 rounded-xl backdrop-blur-sm border border-gray-700 hover:border-purple-500/50 transition-all duration-300"
                >
                  <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-indigo-500 mb-4">
                    {stat.number}
                  </div>
                  <div className="text-xl text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4 bg-gradient-to-r from-purple-900/50 to-indigo-900/50">
          <div className="container mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
              Ready to Transform Your Performance Management?
            </h2>
            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
              Join hundreds of companies already using our platform to improve their performance management process.
            </p>
            <Link
              href="/login"
              className="inline-block px-8 py-4 rounded-lg bg-white text-purple-600 hover:bg-gray-100 transition-all duration-300 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Start Free Trial
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
} 