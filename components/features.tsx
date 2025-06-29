import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, UserCog, Users, Goal, MessageSquare, BarChart, Shield, Zap, LineChart, Award, Bell, Clock } from 'lucide-react';
import { MotionDiv, container, item } from './animations/motion';

const adminFeatures = [
  { 
    icon: UserCog, 
    title: 'User Management', 
    description: 'Assign roles and manage user access across the organization.',
    color: 'from-purple-500/20 to-pink-500/20 text-purple-500'
  },
  { 
    icon: Shield, 
    title: 'Access Control', 
    description: 'Define and manage security policies and permissions.',
    color: 'from-blue-500/20 to-cyan-500/20 text-blue-500'
  },
  { 
    icon: LineChart, 
    title: 'Analytics Dashboard', 
    description: 'Comprehensive analytics and reporting tools.',
    color: 'from-emerald-500/20 to-teal-500/20 text-emerald-500'
  },
  { 
    icon: Zap, 
    title: 'System Settings', 
    description: 'Configure and optimize system performance.',
    color: 'from-amber-500/20 to-orange-500/20 text-amber-500'
  },
];

const managerFeatures = [
  { 
    icon: Users, 
    title: 'Team Management', 
    description: 'Create and manage high-performing teams efficiently.',
    color: 'from-blue-500/20 to-indigo-500/20 text-blue-500'
  },
  { 
    icon: Award, 
    title: 'Performance Review', 
    description: 'Conduct thorough performance evaluations.',
    color: 'from-purple-500/20 to-violet-500/20 text-purple-500'
  },
  { 
    icon: Bell, 
    title: 'Team Notifications', 
    description: 'Stay updated with team activities and progress.',
    color: 'from-rose-500/20 to-pink-500/20 text-rose-500'
  },
  { 
    icon: Clock, 
    title: 'Time Tracking', 
    description: 'Monitor team productivity and time allocation.',
    color: 'from-teal-500/20 to-emerald-500/20 text-teal-500'
  },
];

const employeeFeatures = [
  { 
    icon: Goal, 
    title: 'Goal Setting', 
    description: 'Set and track personal and professional goals.',
    color: 'from-emerald-500/20 to-green-500/20 text-emerald-500'
  },
  { 
    icon: User, 
    title: 'Profile Management', 
    description: 'Manage your professional profile and achievements.',
    color: 'from-blue-500/20 to-sky-500/20 text-blue-500'
  },
  { 
    icon: BarChart, 
    title: 'Progress Tracking', 
    description: 'Visual insights into your performance metrics.',
    color: 'from-violet-500/20 to-purple-500/20 text-violet-500'
  },
  { 
    icon: MessageSquare, 
    title: 'Communication Hub', 
    description: 'Collaborate and share feedback seamlessly.',
    color: 'from-pink-500/20 to-rose-500/20 text-pink-500'
  },
];

export function Features() {
  return (
    <section id="features" className="py-12 md:py-20 lg:py-28 bg-gradient-to-b from-[#0B1120] via-[#132145] to-[#1E1B4B] relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:radial-gradient(ellipse_at_center,white,transparent)] opacity-20"></div>
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200/10 to-transparent"></div>
      
      <div className="container mx-auto px-4 sm:px-6 relative">
        <MotionDiv 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-10 md:mb-16"
        >
          <span className="inline-flex items-center px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-sm mb-3 sm:mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mr-2"></span>
            <span className="text-indigo-400 text-xs sm:text-sm font-medium">Powerful Features</span>
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white mb-3 sm:mb-4">
            Tailored for Every Role
          </h2>
          <p className="text-base sm:text-lg text-gray-400 px-4 sm:px-0">
            AspireHub provides a personalized experience with powerful tools for everyone, from administrators to individual contributors.
          </p>
        </MotionDiv>

        <Tabs defaultValue="employee" className="w-full">
          <TabsList className="relative grid w-full grid-cols-3 mb-8 md:mb-12 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl p-1 text-xs sm:text-sm">
            <TabsTrigger 
              value="employee"
              className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white rounded-lg sm:rounded-xl transition-all duration-300 py-1.5 sm:py-2"
            >
              For Employees
            </TabsTrigger>
            <TabsTrigger 
              value="manager"
              className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white rounded-lg sm:rounded-xl transition-all duration-300 py-1.5 sm:py-2"
            >
              For Managers
            </TabsTrigger>
            <TabsTrigger 
              value="admin"
              className="data-[state=active]:bg-indigo-500 data-[state=active]:text-white rounded-lg sm:rounded-xl transition-all duration-300 py-1.5 sm:py-2"
            >
              For Admins
            </TabsTrigger>
          </TabsList>

          <TabsContent value="employee">
            <MotionDiv 
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
            >
              {employeeFeatures.map(({ icon: Icon, title, description, color }) => (
                <MotionDiv key={title} variants={item}>
                  <Card className="group relative bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300">
                    <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-lg`}></div>
                    <CardHeader className="space-y-3 md:space-y-4 py-4 md:py-6">
                      <div className={`mx-auto bg-gradient-to-br ${color} p-2.5 sm:p-3 rounded-lg sm:rounded-xl w-fit group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <CardTitle className="text-base sm:text-lg text-white group-hover:text-white/90 transition-colors">{title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm sm:text-base text-gray-400 group-hover:text-gray-300 transition-colors">{description}</p>
                    </CardContent>
                  </Card>
                </MotionDiv>
              ))}
            </MotionDiv>
          </TabsContent>
          
          <TabsContent value="manager">
            <MotionDiv 
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
            >
              {managerFeatures.map(({ icon: Icon, title, description, color }) => (
                <MotionDiv key={title} variants={item}>
                  <Card className="group relative bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300">
                    <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-lg`}></div>
                    <CardHeader className="space-y-3 md:space-y-4 py-4 md:py-6">
                      <div className={`mx-auto bg-gradient-to-br ${color} p-2.5 sm:p-3 rounded-lg sm:rounded-xl w-fit group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <CardTitle className="text-base sm:text-lg text-white group-hover:text-white/90 transition-colors">{title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm sm:text-base text-gray-400 group-hover:text-gray-300 transition-colors">{description}</p>
                    </CardContent>
                  </Card>
                </MotionDiv>
              ))}
            </MotionDiv>
          </TabsContent>

          <TabsContent value="admin">
            <MotionDiv 
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
            >
              {adminFeatures.map(({ icon: Icon, title, description, color }) => (
                <MotionDiv key={title} variants={item}>
                  <Card className="group relative bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300">
                    <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-lg`}></div>
                    <CardHeader className="space-y-3 md:space-y-4 py-4 md:py-6">
                      <div className={`mx-auto bg-gradient-to-br ${color} p-2.5 sm:p-3 rounded-lg sm:rounded-xl w-fit group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <CardTitle className="text-base sm:text-lg text-white group-hover:text-white/90 transition-colors">{title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm sm:text-base text-gray-400 group-hover:text-gray-300 transition-colors">{description}</p>
                    </CardContent>
                  </Card>
                </MotionDiv>
              ))}
            </MotionDiv>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
