"use client"

import { ShieldCheck, LogIn, Users } from "lucide-react"
import { cn } from "@/lib/utils"

const benefits = [
  {
    icon: LogIn,
    title: "Single Sign-On (SSO)",
    description: "Eliminate password fatigue. Employees can log in instantly and securely using their existing Microsoft credentials.",
    gradient: "from-blue-500 to-indigo-500"
  },
  {
    icon: ShieldCheck,
    title: "Enterprise-Grade Security",
    description: "Leverage Microsoft's robust security infrastructure to protect your organization's data and ensure compliance.",
    gradient: "from-purple-500 to-pink-500"
  },
  {
    icon: Users,
    title: "Automated User Provisioning",
    description: "Sync your Azure Active Directory to automate user onboarding, offboarding, and role management effortlessly.",
    gradient: "from-pink-500 to-rose-500"
  }
];

const AzureLogoFull = () => (
  <svg width="120" height="120" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-400 transform transition-transform duration-700 group-hover:scale-110">
    <path d="M11.25 0.762695L5.86406 10.4354H14.1359L11.25 0.762695Z" fill="currentColor" className="animate-float-slow"/>
    <path d="M5.42188 10.4354L0 19.2373H7.8125L12.9688 10.4354H5.42188Z" fill="currentColor" className="animate-float-medium"/>
    <path d="M8.4375 19.2373H13.5938L11.25 14.881L8.4375 19.2373Z" fill="currentColor" className="animate-float-fast"/>
    <path d="M14.0625 19.2373H20L13.2812 10.4354L11.25 14.881L14.0625 19.2373Z" fill="currentColor" className="animate-float-medium"/>
  </svg>
);

export function AzureIntegration() {
  return (
    <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B1120] via-[#132145] to-[#1E1B4B] opacity-95"></div>
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10"></div>
      
      {/* Animated Background */}
      <div className="absolute top-1/4 -right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute -bottom-1/4 -left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse-medium"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-3xl animate-pulse-slow opacity-30"></div>

      <div className="container mx-auto relative z-10">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-sm mb-4 sm:mb-6 transform hover:scale-105 transition-transform duration-300">
            <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-indigo-400 mr-2 animate-ping"></span>
            <span className="text-indigo-400 text-xs sm:text-sm font-medium">Azure Integration</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
            Seamless & Secure with{" "}
            <span className="relative">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                Azure
              </span>
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></span>
            </span>
          </h2>
          <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto px-4 sm:px-0">
            AspireHub integrates directly with Microsoft Azure Active Directory, providing your organization with unmatched security and convenience.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          <div className="flex justify-center order-2 lg:order-1">
            <div className="relative group perspective-1000">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-xl animate-pulse-slow transform rotate-180 group-hover:rotate-0 transition-transform duration-700"></div>
              <div className="relative w-48 h-48 sm:w-64 sm:h-64 bg-white/5 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/10 transition-all duration-500 group-hover:border-purple-500/50 transform group-hover:rotate-12">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <AzureLogoFull />
                <ShieldCheck className="absolute -top-4 -right-4 w-12 sm:w-16 h-12 sm:h-16 text-indigo-400 bg-white/5 backdrop-blur-sm rounded-full p-2 shadow-lg border border-white/10 transform hover:scale-110 hover:rotate-12 transition-all duration-300" />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:gap-6 order-1 lg:order-2">
            {benefits.map(({ icon: Icon, title, description, gradient }, index) => (
              <div 
                key={title}
                className={cn(
                  "group relative p-4 sm:p-6 rounded-xl sm:rounded-2xl",
                  "bg-white/5 backdrop-blur-sm border border-white/10",
                  "hover:border-purple-500/50 transition-all duration-500",
                  "transform hover:-translate-y-1"
                )}
              >
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10",
                  "transition-opacity duration-500 rounded-xl sm:rounded-2xl",
                  gradient
                )}></div>
                <div className="flex gap-3 sm:gap-4 items-start">
                  <div className={cn(
                    "flex-shrink-0 p-2.5 sm:p-3 rounded-lg sm:rounded-xl",
                    "group-hover:scale-110 transition-transform duration-300",
                    `bg-gradient-to-br ${gradient}`
                  )}>
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div>
                    <h3 className={cn(
                      "text-base sm:text-lg font-semibold mb-1 sm:mb-2",
                      "text-white group-hover:text-transparent",
                      "group-hover:bg-clip-text group-hover:bg-gradient-to-r",
                      "group-hover:from-purple-400 group-hover:to-pink-400",
                      "transition-all duration-300"
                    )}>
                      {title}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-400 leading-relaxed">{description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
