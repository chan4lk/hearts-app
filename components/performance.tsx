"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

interface PerformanceData {
  team: string;
  completed: number;
  target: number;
}

const performanceData: PerformanceData[] = [
  { team: "Engineering", completed: 82, target: 90 },
  { team: "Sales", completed: 78, target: 85 },
  { team: "Marketing", completed: 95, target: 90 },
  { team: "Support", completed: 88, target: 95 },
  { team: "Product", completed: 91, target: 90 },
  { team: "HR", completed: 75, target: 80 },
].sort((a, b) => b.completed - a.completed);

export function Performance() {
  return (
    <section id="performance" className="py-8 md:py-28 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B1120] via-[#132145] to-[#1E1B4B] opacity-95"></div>
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10"></div>
      
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse-medium"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-start">
          <div className="max-w-md mx-auto lg:mx-0">
            <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-sm mb-4 md:mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mr-2 animate-ping"></span>
              <span className="text-indigo-400 text-xs md:text-sm font-medium">Performance Insights</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 md:mb-6">
              Visualize Success,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                Drive Results
              </span>
            </h2>
            <p className="mt-2 md:mt-4 text-sm md:text-lg text-gray-300">
              Track performance at every level. Identify top performers and make data-driven decisions for success.
            </p>
          </div>
          
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 hover:border-purple-500/50 transition-all duration-500">
            <CardHeader className="space-y-2">
              <CardTitle className="text-white text-lg md:text-xl">Team Performance Q3</CardTitle>
              <CardDescription className="text-gray-400 text-sm">Goal completion rates by team</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {performanceData.map((item) => (
                  <div key={item.team} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-200 font-medium">{item.team}</span>
                      <span className="text-gray-400">{item.completed}% of {item.target}%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                        style={{ 
                          width: `${(item.completed / item.target) * 100}%`,
                          opacity: item.completed >= item.target ? "1" : "0.7"
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{item.completed >= item.target ? "Target Achieved" : "In Progress"}</span>
                      <span>{Math.round((item.completed / item.target) * 100)}% Complete</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
