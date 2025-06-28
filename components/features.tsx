import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, UserCog, Users, Goal, MessageSquare, BarChart } from 'lucide-react';

const adminFeatures = [
  { icon: UserCog, title: 'User Management', description: 'Assign roles and manage user access across the organization.' },
  { icon: Goal, title: 'Org-Wide Goals', description: 'Set and track company-wide objectives and key results.' },
  { icon: BarChart, title: 'Performance Oversight', description: 'Monitor performance ratings and calibration across all teams.' },
  { icon: MessageSquare, title: 'Feedback Moderation', description: 'Manage and oversee the behavioral feedback system.' },
];

const managerFeatures = [
  { icon: Users, title: 'Team Goal Setting', description: 'Create, assign, and track goals for your direct reports.' },
  { icon: BarChart, title: 'Performance Ratings', description: 'Evaluate employee performance and provide ratings.' },
  { icon: MessageSquare, title: 'Provide Feedback', description: 'Give constructive feedback and track employee behavior.' },
  { icon: Goal, title: 'Progress Monitoring', description: 'Keep a close eye on your team\'s progress towards their goals.' },
];

const employeeFeatures = [
  { icon: Goal, title: 'Personal Goals', description: 'Create and manage your own professional development goals.' },
  { icon: User, title: 'Self-Rating', description: 'Assess your own performance and track your growth over time.' },
  { icon: BarChart, title: 'Track Your Progress', description: 'Visualize your progress towards achieving your OKRs.' },
  { icon: MessageSquare, title: 'Submit Feedback', description: 'Provide valuable feedback to peers and managers.' },
];

export function Features() {
  return (
    <section id="features" className="py-20 md:py-28 bg-gradient-to-b from-[#0B1120] via-[#132145] to-[#1E1B4B]">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Tailored for Every Role</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            AspireHub provides a personalized experience with powerful tools for everyone, from administrators to individual contributors.
          </p>
        </div>
        <Tabs defaultValue="employee" className="w-full">
          <TabsList className="grid w-full grid-cols-1 md:w-auto md:mx-auto md:grid-cols-3 mb-10">
            <TabsTrigger value="employee">For Employees</TabsTrigger>
            <TabsTrigger value="manager">For Managers</TabsTrigger>
            <TabsTrigger value="admin">For Admins</TabsTrigger>
          </TabsList>

          <TabsContent value="employee">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {employeeFeatures.map(({ icon: Icon, title, description }) => (
                <Card key={title} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="mx-auto bg-accent/20 text-accent p-3 rounded-full w-fit">
                      <Icon className="h-8 w-8" />
                    </div>
                    <CardTitle className="mt-4">{title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="manager">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {managerFeatures.map(({ icon: Icon, title, description }) => (
                <Card key={title} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="mx-auto bg-accent/20 text-accent p-3 rounded-full w-fit">
                      <Icon className="h-8 w-8" />
                    </div>
                    <CardTitle className="mt-4">{title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="admin">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {adminFeatures.map(({ icon: Icon, title, description }) => (
                <Card key={title} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="mx-auto bg-accent/20 text-accent p-3 rounded-full w-fit">
                      <Icon className="h-8 w-8" />
                    </div>
                    <CardTitle className="mt-4">{title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
