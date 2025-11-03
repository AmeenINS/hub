'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useI18n } from '@/lib/i18n/i18n-context';
import { Mail, Building2, Users as UsersIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getCombinedUserName, getLocalizedUserName, getUserInitials } from '@/lib/utils';

interface User {
  id: string;
  fullNameEn: string;
  fullNameAr?: string;
  email: string;
  role?: string;
  position?: string;
  department?: string;
  managerId?: string;
  createdAt?: string;
  isActive?: boolean;
}

interface OrgChartProps {
  users: User[];
}

interface TreeNode {
  user: User;
  children: TreeNode[];
  level: number;
}

// Build hierarchical tree structure based on managerId
const buildTree = (users: User[]): TreeNode[] => {
  if (!users) return [];
  const userMap = new Map<string, User>();
  const childrenMap = new Map<string, User[]>();
  const roots: User[] = [];
  
  // Create user map
  users.forEach(user => {
    userMap.set(user.id, user);
  });
  
  // Group children by managerId
  users.forEach(user => {
    if (user.managerId && userMap.has(user.managerId)) {
      if (!childrenMap.has(user.managerId)) {
        childrenMap.set(user.managerId, []);
      }
      childrenMap.get(user.managerId)!.push(user);
    } else {
      // Root user (no manager or manager not in list)
      roots.push(user);
    }
  });
  
  // Recursively build tree
  const buildNode = (user: User, level: number): TreeNode => {
    const children = childrenMap.get(user.id) || [];
    return {
      user,
      children: children.map(child => buildNode(child, level + 1)),
      level
    };
  };
  
  return roots.map(root => buildNode(root, 0));
};

const getPositionColor = (position?: string): string => {
  if (!position) return 'bg-gray-500 text-white';
  const colorMap: Record<string, string> = {
    'CEO': 'bg-purple-500 text-white',
    'CTO': 'bg-blue-500 text-white',
    'CFO': 'bg-green-500 text-white',
    'COO': 'bg-orange-500 text-white',
    'Director': 'bg-indigo-500 text-white',
    'Manager': 'bg-cyan-500 text-white',
    'Team Lead': 'bg-teal-500 text-white',
    'Senior Developer': 'bg-amber-500 text-white',
    'Developer': 'bg-orange-400 text-white',
    'Employee': 'bg-slate-500 text-white',
  };
  const parts = position.split('/').map((part) => part.trim());
  for (const part of parts) {
    if (colorMap[part]) {
      return colorMap[part];
    }
  }
  return 'bg-gray-500 text-white';
};

// Render a single node in the tree
const OrgNode: React.FC<{ 
  node: TreeNode;
  isLast: boolean; 
  isRoot: boolean;
  locale: string;
  t: (key: string) => string;
}> = ({ node, isRoot, locale, t }) => {
  const { user, children, level } = node;
  const hasChildren = children.length > 0;

  return (
    <div className="relative">
      {/* Connecting Lines */}
      {!isRoot && (
        <>
          {/* Vertical line from parent */}
          <div 
            className={`absolute top-0 w-px bg-border ${
              locale === 'ar' ? 'right-0 -translate-x-1/2' : 'left-0 translate-x-1/2'
            }`}
            style={{ height: '2rem' }}
          />
          
          {/* Horizontal line to card */}
          <div 
            className={`absolute top-8 h-px bg-border ${
              locale === 'ar' ? 'right-0' : 'left-0'
            }`}
            style={{ width: '2rem' }}
          />
        </>
      )}

      {/* User Card */}
      <div 
        className={`${
          locale === 'ar' ? 'mr-8' : 'ml-8'
        } mt-8 first:mt-0`}
        style={{ 
          marginTop: isRoot ? 0 : '2rem',
          marginLeft: locale === 'ar' ? 0 : (level === 0 ? 0 : '2rem'),
          marginRight: locale === 'ar' ? (level === 0 ? 0 : '2rem') : 0,
        }}
      >
        <div className="inline-block">
          <div className="relative">
            {/* Card */}
            <div className="rounded-xl border-2 border-border bg-card shadow-md hover:shadow-lg transition-all duration-200 p-4 min-w-[280px] max-w-[320px]">
              {/* Header with Avatar and Name */}
              <div className="flex items-start gap-3 mb-3">
                <Avatar className="h-12 w-12 ring-2 ring-primary/20">
                  <AvatarFallback className={getPositionColor(user.position || user.role)}>
                    {getUserInitials(user)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base truncate">
                    {getLocalizedUserName(user, locale)}
                  </h3>
                  {((locale === 'ar' && user.fullNameEn) || (locale !== 'ar' && user.fullNameAr)) && (
                    <p className="text-xs text-muted-foreground truncate">
                      {locale === 'ar' ? user.fullNameEn : user.fullNameAr}
                    </p>
                  )}
                  <Badge 
                    variant="secondary" 
                    className={`${getPositionColor(user.position || user.role)} mt-1`}
                  >
                    {user.position || user.role || 'Employee'}
                  </Badge>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate text-xs">{user.email}</span>
                </div>
                
                {user.department && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate text-xs">{user.department}</span>
                  </div>
                )}

                {hasChildren && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <UsersIcon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="text-xs">
                      {children.length} {children.length === 1 ? t('dashboard.directReport') : t('dashboard.directReports')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Children Nodes */}
      {hasChildren && (
        <div 
          className={`relative ${
            locale === 'ar' ? 'mr-8' : 'ml-8'
          }`}
          style={{
            marginLeft: locale === 'ar' ? 0 : '2rem',
            marginRight: locale === 'ar' ? '2rem' : 0,
          }}
        >
          {/* Vertical line connecting children */}
          <div 
            className={`absolute top-0 w-px bg-border ${
              locale === 'ar' ? 'right-0 -translate-x-1/2' : 'left-0 translate-x-1/2'
            }`}
            style={{ height: '100%' }}
          />
          <div className="flex flex-col">
            {children.map((childNode, index) => (
              <OrgNode 
                key={childNode.user.id}
                node={childNode}
                isLast={index === children.length - 1}
                isRoot={false}
                locale={locale}
                t={t}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Group users by position/department
const groupUsersByPosition = (users: User[]) => {
  const grouped: Record<string, User[]> = {};
  users.forEach(user => {
    const position = user.position || user.role || 'Employee';
    if (!grouped[position]) {
      grouped[position] = [];
    }
    grouped[position].push(user);
  });

  return Object.entries(grouped).sort((a, b) => {
      // Sort by hierarchy (CEO/Manager -> Team Lead -> Employee)
    const hierarchy: Record<string, number> = {
      'CEO': 1,
      'Manager': 2,
      'Team Lead': 3,
      'Employee': 4,
    };
    return (hierarchy[a[0]] || 5) - (hierarchy[b[0]] || 5);
  });
};

const OrgChart: React.FC<OrgChartProps> = ({ users }) => {
  const { t, locale } = useI18n();
  const [viewMode, setViewMode] = React.useState<'chart' | 'list'>('chart');
  
  const tree = React.useMemo(() => buildTree(users), [users]);
  const groupedUsers = React.useMemo(() => groupUsersByPosition(users), [users]);

  if (!users || users.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.organizationChart')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{t('dashboard.noUsersData')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{t('dashboard.organizationChart')}</CardTitle>
            <CardDescription>{t('dashboard.orgChartDescription')}</CardDescription>
          </div>
          {/* View mode toggle can be added here if needed */}
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto p-6">
        {viewMode === 'chart' ? (
          <div className={`flex flex-col ${locale === 'ar' ? 'items-end' : 'items-start'}`}>
            {tree.map((rootNode, index) => (
              <OrgNode 
                key={rootNode.user.id} 
                node={rootNode} 
                isLast={index === tree.length - 1}
                isRoot={true}
                locale={locale}
                t={t}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {groupedUsers.map(([position, userList]) => (
              <div key={position}>
                <h2 className="text-xl font-bold mb-3">{position}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userList.map(user => (
                    <div key={user.id} className="border rounded-lg p-3">
                      <p className="font-semibold">{getCombinedUserName(user)}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrgChart;
