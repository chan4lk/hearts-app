import { prisma } from './prisma';

/**
 * Query Result Cache - Use Redis in production for distributed caching
 * Currently using in-memory cache for development
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const queryCache = new Map<string, CacheEntry<any>>();

/**
 * Get data from cache or fetch fresh
 */
export async function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000 // 5 minutes default
): Promise<T> {
  // Check cache validity
  const cached = queryCache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    console.debug(`[Cache HIT] ${key}`);
    return cached.data as T;
  }

  console.debug(`[Cache MISS] ${key} - fetching fresh data`);

  // Fetch fresh data
  const data = await fetcher();

  // Store in cache
  queryCache.set(key, { data, timestamp: Date.now() });

  return data;
}

/**
 * Invalidate cache entries matching pattern
 */
export function invalidateCache(pattern: string) {
  const keysToDelete: string[] = [];

  // Convert Map keys iterator to array
  Array.from(queryCache.keys()).forEach(key => {
    if (key.includes(pattern)) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach(key => queryCache.delete(key));
  console.debug(`[Cache INVALIDATE] Cleared ${keysToDelete.length} entries matching pattern: ${pattern}`);
}

/**
 * Clear all cache
 */
export function clearCache() {
  queryCache.clear();
  console.debug('[Cache CLEAR] All cache entries cleared');
}

// ============================================
// OPTIMIZED QUERY FUNCTIONS
// ============================================

/**
 * Get goals with pagination - optimized single query
 */
export async function getGoalsOptimized(
  where: any,
  page: number = 1,
  limit: number = 20,
  sortBy: string = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc'
) {
  const skip = (page - 1) * limit;

  // Combined query instead of separate count + fetch
  const [goals, totalCount] = await Promise.all([
    prisma.goal.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        progress: true,
        category: true,
        priority: true,
        dueDate: true,
        createdAt: true,
        updatedAt: true,
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.goal.count({ where }),
  ]);

  return {
    goals,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page < Math.ceil(totalCount / limit),
      hasPrevPage: page > 1,
    },
  };
}

/**
 * Get managed employees - with caching
 */
export async function getManagedEmployees(managerId: string) {
  const cacheKey = `managed-employees:${managerId}`;

  return getCachedOrFetch(
    cacheKey,
    async () => {
      return prisma.user.findMany({
        where: {
          managerId,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          email: true,
          department: true,
          role: true,
        },
        orderBy: { name: 'asc' },
      });
    },
    10 * 60 * 1000 // Cache for 10 minutes
  );
}

/**
 * Get employee dashboard stats
 */
export async function getEmployeeDashboardStats(employeeId: string) {
  const cacheKey = `employee-stats:${employeeId}`;

  return getCachedOrFetch(
    cacheKey,
    async () => {
      const [goalStats, ratingsStats, notifications] = await Promise.all([
        // Goal statistics
        prisma.goal.groupBy({
          by: ['status'],
          where: { employeeId },
          _count: true,
        }),

        // Rating statistics
        prisma.rating.findMany({
          where: {
            goal: { employeeId },
          },
          select: {
            selfScore: true,
            managerScore: true,
          },
        }),

        // Unread notifications count
        prisma.notification.count({
          where: {
            userId: employeeId,
            isRead: false,
          },
        }),
      ]);

      const goalCounts = goalStats.reduce(
        (acc, stat) => {
          acc[stat.status] = stat._count;
          return acc;
        },
        {} as Record<string, number>
      );

      const avgSelfScore = ratingsStats.length > 0
        ? ratingsStats.reduce((sum, r) => sum + (r.selfScore || 0), 0) / ratingsStats.length
        : 0;

      const avgManagerScore = ratingsStats.length > 0
        ? ratingsStats.reduce((sum, r) => sum + (r.managerScore || 0), 0) / ratingsStats.length
        : 0;

      return {
        goalStats: goalCounts,
        avgSelfScore: Math.round(avgSelfScore * 10) / 10,
        avgManagerScore: Math.round(avgManagerScore * 10) / 10,
        unreadNotifications: notifications,
      };
    },
    5 * 60 * 1000 // Cache for 5 minutes
  );
}

/**
 * Get manager dashboard stats
 */
export async function getManagerDashboardStats(managerId: string) {
  const cacheKey = `manager-stats:${managerId}`;

  return getCachedOrFetch(
    cacheKey,
    async () => {
      const [employeeGoals, teamStats] = await Promise.all([
        // Get goals for all managed employees
        prisma.goal.findMany({
          where: {
            manager: {
              id: managerId,
            },
          },
          select: {
            status: true,
            progress: true,
            employeeId: true,
          },
        }),

        // Get team statistics
        prisma.user.findMany({
          where: {
            managerId,
            isActive: true,
          },
          select: {
            id: true,
            goals: {
              select: { status: true, progress: true },
            },
          },
        }),
      ]);

      const statusCounts = employeeGoals.reduce(
        (acc, goal) => {
          acc[goal.status] = (acc[goal.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      return {
        totalDirectReports: teamStats.length,
        totalGoalsUnderReview: employeeGoals.length,
        goalsByStatus: statusCounts,
        teamProgressAverage:
          employeeGoals.length > 0
            ? Math.round(
                (employeeGoals.reduce((sum, g) => sum + g.progress, 0) / employeeGoals.length) * 10
              ) / 10
            : 0,
      };
    },
    5 * 60 * 1000 // Cache for 5 minutes
  );
}

/**
 * Get active users for admin - with efficient pagination
 */
export async function getActiveUsersAdmin(
  page: number = 1,
  limit: number = 50,
  search?: string
) {
  const skip = (page - 1) * limit;

  // Fix TypeScript issue with OR clause
  const where: any = {
    isActive: true,
  };

  // Add search filter if provided
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' as 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' as 'insensitive' } },
    ];
  }

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        department: true,
        isActive: true,
        lastLoginAt: true,
        managerId: true,
      },
      skip,
      take: limit,
      orderBy: { name: 'asc' },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      hasNextPage: page < Math.ceil(totalCount / limit),
      hasPrevPage: page > 1,
    },
  };
}

/**
 * Get overdue goals for a user
 */
export async function getOverdueGoals(userId: string) {
  const cacheKey = `overdue-goals:${userId}`;

  return getCachedOrFetch(
    cacheKey,
    async () => {
      return prisma.goal.findMany({
        where: {
          employeeId: userId,
          status: {
            in: ['DRAFT', 'PENDING', 'IN_PROGRESS'],
          },
          dueDate: {
            lt: new Date(),
          },
        },
        select: {
          id: true,
          title: true,
          status: true,
          dueDate: true,
          priority: true,
        },
        orderBy: { dueDate: 'asc' },
      });
    },
    5 * 60 * 1000 // Cache for 5 minutes
  );
}

/**
 * Batch fetch users to avoid N+1 queries
 */
export async function batchFetchUsers(userIds: string[]) {
  if (userIds.length === 0) return [];

  // Remove duplicates
  const uniqueIds = Array.from(new Set(userIds));

  return prisma.user.findMany({
    where: {
      id: { in: uniqueIds },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      department: true,
    },
  });
}

/**
 * Get goal statistics by status
 */
export async function getGoalStatsByStatus(where: any) {
  const cacheKey = `goal-stats:${JSON.stringify(where)}`;

  return getCachedOrFetch(
    cacheKey,
    async () => {
      const stats = await prisma.goal.groupBy({
        by: ['status'],
        where,
        _count: true,
        _avg: { progress: true },
      });

      return stats.reduce(
        (acc, stat) => {
          acc[stat.status] = {
            count: stat._count,
            avgProgress: Math.round((stat._avg.progress || 0) * 10) / 10,
          };
          return acc;
        },
        {} as Record<string, { count: number; avgProgress: number }>
      );
    },
    5 * 60 * 1000 // Cache for 5 minutes
  );
}

/**
 * Invalidate user-related caches
 */
export function invalidateUserCache(userId: string) {
  invalidateCache(`managed-employees:${userId}`);
  invalidateCache(`employee-stats:${userId}`);
  invalidateCache(`manager-stats:${userId}`);
  invalidateCache(`overdue-goals:${userId}`);
}

/**
 * Invalidate goal-related caches
 */
export function invalidateGoalCache(employeeId?: string) {
  if (employeeId) {
    invalidateUserCache(employeeId);
  }
  invalidateCache('goal-stats:');
}
