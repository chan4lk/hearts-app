import { PrismaClient, CompetencyCategory } from '@prisma/client';

const prisma = new PrismaClient();

const competencies = [
  {
    name: 'Leadership',
    description: 'Ability to lead teams, make decisions, and inspire others',
    category: CompetencyCategory.LEADERSHIP,
    weight: 1.2,
    levels: [
      {
        level: 1,
        name: 'Beginner',
        description: 'Shows basic leadership potential',
        examples: ['Takes initiative on small tasks', 'Supports team members when asked']
      },
      {
        level: 2,
        name: 'Developing',
        description: 'Demonstrates emerging leadership skills',
        examples: ['Leads small projects', 'Provides constructive feedback to peers']
      },
      {
        level: 3,
        name: 'Competent',
        description: 'Consistently demonstrates effective leadership',
        examples: ['Leads team initiatives', 'Mentors junior team members', 'Makes sound decisions']
      },
      {
        level: 4,
        name: 'Advanced',
        description: 'Exhibits strong leadership capabilities',
        examples: ['Leads complex projects', 'Develops team strategy', 'Inspires high performance']
      },
      {
        level: 5,
        name: 'Expert',
        description: 'Exceptional leadership that transforms organizations',
        examples: ['Leads organizational change', 'Develops future leaders', 'Creates innovative strategies']
      }
    ]
  },
  {
    name: 'Technical Skills',
    description: 'Proficiency in technical tools, languages, and methodologies',
    category: CompetencyCategory.TECHNICAL,
    weight: 1.0,
    levels: [
      {
        level: 1,
        name: 'Beginner',
        description: 'Basic understanding of technical concepts',
        examples: ['Can use basic tools', 'Understands fundamental concepts']
      },
      {
        level: 2,
        name: 'Developing',
        description: 'Growing technical proficiency',
        examples: ['Can complete standard tasks', 'Learns new technologies quickly']
      },
      {
        level: 3,
        name: 'Competent',
        description: 'Solid technical skills',
        examples: ['Handles complex technical challenges', 'Mentors others on technical topics']
      },
      {
        level: 4,
        name: 'Advanced',
        description: 'Expert-level technical capabilities',
        examples: ['Solves complex technical problems', 'Designs technical solutions', 'Innovates in technical areas']
      },
      {
        level: 5,
        name: 'Expert',
        description: 'Industry-leading technical expertise',
        examples: ['Creates new technical standards', 'Publishes technical content', 'Influences technical direction']
      }
    ]
  },
  {
    name: 'Communication',
    description: 'Ability to convey information clearly and effectively',
    category: CompetencyCategory.SOFT_SKILLS,
    weight: 1.1,
    levels: [
      {
        level: 1,
        name: 'Beginner',
        description: 'Basic communication skills',
        examples: ['Communicates basic information', 'Listens to others']
      },
      {
        level: 2,
        name: 'Developing',
        description: 'Improving communication effectiveness',
        examples: ['Presents ideas clearly', 'Adapts communication style to audience']
      },
      {
        level: 3,
        name: 'Competent',
        description: 'Strong communication skills',
        examples: ['Influences others through communication', 'Handles difficult conversations well']
      },
      {
        level: 4,
        name: 'Advanced',
        description: 'Exceptional communication abilities',
        examples: ['Inspires through communication', 'Resolves conflicts effectively', 'Builds strong relationships']
      },
      {
        level: 5,
        name: 'Expert',
        description: 'Master-level communication',
        examples: ['Transforms organizational communication', 'Creates compelling narratives', 'Builds consensus across diverse groups']
      }
    ]
  },
  {
    name: 'Problem Solving',
    description: 'Ability to analyze problems and develop effective solutions',
    category: CompetencyCategory.BUSINESS,
    weight: 1.0,
    levels: [
      {
        level: 1,
        name: 'Beginner',
        description: 'Basic problem-solving approach',
        examples: ['Identifies simple problems', 'Follows established procedures']
      },
      {
        level: 2,
        name: 'Developing',
        description: 'Growing problem-solving skills',
        examples: ['Analyzes problems systematically', 'Proposes multiple solutions']
      },
      {
        level: 3,
        name: 'Competent',
        description: 'Effective problem-solving',
        examples: ['Solves complex problems', 'Evaluates solution effectiveness', 'Learns from problem-solving experiences']
      },
      {
        level: 4,
        name: 'Advanced',
        description: 'Strategic problem-solving',
        examples: ['Anticipates problems', 'Develops innovative solutions', 'Teaches problem-solving to others']
      },
      {
        level: 5,
        name: 'Expert',
        description: 'Transformational problem-solving',
        examples: ['Redefines problem spaces', 'Creates new problem-solving methodologies', 'Solves industry-wide challenges']
      }
    ]
  },
  {
    name: 'Collaboration',
    description: 'Ability to work effectively with others toward common goals',
    category: CompetencyCategory.COLLABORATION,
    weight: 1.0,
    levels: [
      {
        level: 1,
        name: 'Beginner',
        description: 'Basic collaboration skills',
        examples: ['Works in teams', 'Shares information when asked']
      },
      {
        level: 2,
        name: 'Developing',
        description: 'Growing collaboration abilities',
        examples: ['Actively participates in team activities', 'Supports team goals']
      },
      {
        level: 3,
        name: 'Competent',
        description: 'Strong collaboration',
        examples: ['Facilitates team success', 'Builds positive team dynamics', 'Resolves team conflicts']
      },
      {
        level: 4,
        name: 'Advanced',
        description: 'Exceptional collaboration',
        examples: ['Leads collaborative initiatives', 'Creates collaborative environments', 'Mentors others in collaboration']
      },
      {
        level: 5,
        name: 'Expert',
        description: 'Master-level collaboration',
        examples: ['Transforms organizational collaboration', 'Builds cross-functional partnerships', 'Creates collaborative cultures']
      }
    ]
  },
  {
    name: 'Innovation',
    description: 'Ability to think creatively and implement new ideas',
    category: CompetencyCategory.INNOVATION,
    weight: 1.1,
    levels: [
      {
        level: 1,
        name: 'Beginner',
        description: 'Basic innovative thinking',
        examples: ['Suggests small improvements', 'Learns about new approaches']
      },
      {
        level: 2,
        name: 'Developing',
        description: 'Growing innovation skills',
        examples: ['Proposes new ideas', 'Experiments with new approaches']
      },
      {
        level: 3,
        name: 'Competent',
        description: 'Effective innovation',
        examples: ['Develops innovative solutions', 'Champions new ideas', 'Takes calculated risks']
      },
      {
        level: 4,
        name: 'Advanced',
        description: 'Strategic innovation',
        examples: ['Leads innovation initiatives', 'Creates new processes', 'Inspires innovation in others']
      },
      {
        level: 5,
        name: 'Expert',
        description: 'Transformational innovation',
        examples: ['Creates new markets', 'Establishes innovation frameworks', 'Drives industry transformation']
      }
    ]
  }
];

async function seedCompetencies() {
  console.log('🌱 Seeding competencies...');

  for (const competencyData of competencies) {
    const { levels, ...competencyInfo } = competencyData;
    
    const competency = await prisma.competency.create({
      data: {
        ...competencyInfo,
        levels: {
          create: levels
        }
      }
    });

    console.log(`✅ Created competency: ${competency.name}`);
  }

  console.log('🎉 Competencies seeded successfully!');
}

async function main() {
  try {
    await seedCompetencies();
  } catch (error) {
    console.error('❌ Error seeding competencies:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { seedCompetencies }; 