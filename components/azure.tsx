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
  <svg width="120" height="120" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-400">
    <path d="M11.25 0.762695L5.86406 10.4354H14.1359L11.25 0.762695Z" fill="currentColor"/>
    <path d="M5.42188 10.4354L0 19.2373H7.8125L12.9688 10.4354H5.42188Z" fill="currentColor"/>
    <path d="M8.4375 19.2373H13.5938L11.25 14.881L8.4375 19.2373Z" fill="currentColor"/>
    <path d="M14.0625 19.2373H20L13.2812 10.4354L11.25 14.881L14.0625 19.2373Z" fill="currentColor"/>
  </svg>
);

export function AzureIntegration() {
  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B1120] via-[#132145] to-[#1E1B4B] opacity-95"></div>
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10"></div>
      
      {/* Animated Background */}
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse-medium"></div>

      <div className="container mx-auto relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-sm mb-6">
            <span className="w-2 h-2 rounded-full bg-indigo-400 mr-2 animate-ping"></span>
            <span className="text-indigo-400 text-sm font-medium">Azure Integration</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Seamless & Secure with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              Azure
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            AspireHub integrates directly with Microsoft Azure Active Directory, providing your organization with unmatched security and convenience.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="flex justify-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-xl animate-pulse-slow"></div>
              <div className="relative w-64 h-64 bg-white/5 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/10 transition-all duration-500 group-hover:border-purple-500/50">
                <AzureLogoFull />
                <ShieldCheck className="absolute -top-4 -right-4 w-16 h-16 text-indigo-400 bg-white/5 backdrop-blur-sm rounded-full p-2 shadow-lg border border-white/10" />
              </div>
            </div>
          </div>

          <div className="grid gap-8">
            {benefits.map(({ icon: Icon, title, description, gradient }, index) => (
              <div 
                key={title}
                className={cn(
                  "group relative p-6 rounded-2xl",
                  "bg-white/5 backdrop-blur-sm border border-white/10",
                  "hover:border-purple-500/50 transition-all duration-500"
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-2xl"></div>
                <div className="flex gap-4">
                  <div className={cn(
                    "flex-shrink-0 p-3 rounded-xl",
                    "group-hover:scale-110 transition-transform duration-300",
                    `bg-gradient-to-br ${gradient}`
                  )}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className={cn(
                      "text-lg font-semibold mb-2",
                      "text-white group-hover:text-transparent",
                      "group-hover:bg-clip-text group-hover:bg-gradient-to-r",
                      "group-hover:from-purple-400 group-hover:to-pink-400",
                      "transition-all duration-300"
                    )}>
                      {title}
                    </h3>
                    <p className="text-gray-400 leading-relaxed">{description}</p>
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
