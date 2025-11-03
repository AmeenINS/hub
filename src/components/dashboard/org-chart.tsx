'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useI18n } from '@/lib/i18n/i18n-context';
import { Mail, Building2, Users as UsersIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getLocalizedUserName, getUserInitials } from '@/lib/utils';

interface User {
  id: string;
  fullNameEn: string;
  fullNameAr?: string;
  email: string;
  avatarUrl?: string;
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

const getPositionColor = (level: number): string => {
  const colors = [
    'bg-gradient-to-br from-yellow-400 to-yellow-600', // Level 0 - CEO
    'bg-gradient-to-br from-purple-400 to-purple-600', // Level 1 - C-Level
    'bg-gradient-to-br from-blue-400 to-blue-600',     // Level 2 - Directors
    'bg-gradient-to-br from-emerald-400 to-emerald-600', // Level 3 - Managers
    'bg-gradient-to-br from-cyan-400 to-cyan-600',     // Level 4 - Team Leads
    'bg-gradient-to-br from-slate-400 to-slate-600',   // Level 5+ - Employees
  ];
  return colors[Math.min(level, colors.length - 1)];
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
  const userName = getLocalizedUserName(user, locale);
  const altName = locale === 'ar' ? user.fullNameEn : user.fullNameAr;
  const position = user.position || user.role || t('users.employee');

  return (
    <div className="flex flex-col items-center">
      {/* Vertical connector from parent - THICKER */}
      {!isRoot && (
        <div className="w-1 h-12 bg-border border-2 border-primary/30 rounded-full" />
      )}

      {/* User Card */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative group">
              <div className="rounded-lg border-2 border-border/60 bg-card shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-primary/50 w-48 overflow-hidden cursor-pointer">
                {/* Colored Header Strip */}
                <div className={`h-1.5 ${getPositionColor(level)}`} />
                
                <div className="p-3">
                  {/* Avatar and Name Section */}
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className={`h-10 w-10 ring-2 ring-offset-1 ${getPositionColor(level)} ring-opacity-50 shrink-0`}>
                      <AvatarImage 
                        src={user.avatarUrl} 
                        alt={userName}
                      />
                      <AvatarFallback className={`${getPositionColor(level)} text-white text-xs font-bold`}>
                        {getUserInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-xs truncate leading-tight" title={userName}>
                        {userName}
                      </h3>
                      {altName && (
                        <p className="text-[10px] text-muted-foreground truncate leading-tight" title={altName}>
                          {altName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Position Badge */}
                  <div className="mb-2">
                    <Badge 
                      variant="secondary" 
                      className={`${getPositionColor(level)} text-white text-[10px] w-full justify-center truncate py-0.5 px-2`}
                      title={position}
                    >
                      {position.length > 28 ? `${position.substring(0, 25)}...` : position}
                    </Badge>
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5 border-t border-border/40 pt-2">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Mail className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate text-[10px]" title={user.email}>
                        {user.email}
                      </span>
                    </div>
                    
                    {user.department && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Building2 className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate text-[10px]" title={user.department}>
                          {user.department}
                        </span>
                      </div>
                    )}

                    {hasChildren && (
                      <div className="flex items-center gap-1.5 text-primary/80 font-medium bg-primary/5 rounded px-2 py-0.5">
                        <UsersIcon className="h-3 w-3 flex-shrink-0" />
                        <span className="text-[10px]">
                          {children.length} {children.length === 1 ? t('dashboard.directReport') : t('dashboard.directReports')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-semibold text-sm">{userName}</p>
              {altName && <p className="text-xs text-muted-foreground">{altName}</p>}
              <p className="text-xs font-medium">{position}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              {user.department && <p className="text-xs text-muted-foreground">📍 {user.department}</p>}
              {hasChildren && (
                <p className="text-xs text-primary font-medium pt-1 border-t">
                  👥 {children.length} {children.length === 1 ? t('dashboard.directReport') : t('dashboard.directReports')}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Children Section */}
      {hasChildren && (
        <>
          {/* Vertical line to children - THICKER */}
          <div className="w-1 h-12 bg-border border-2 border-primary/30 rounded-full" />
          
          {/* Horizontal line spanning children - MUCH THICKER AND CLEARER */}
          {children.length > 1 && (
            <div className="relative w-full flex justify-center">
              <div 
                className="absolute top-0 h-1 bg-primary/40 border-2 border-primary/50 rounded-full shadow-sm" 
                style={{ width: `${(children.length - 1) * 208}px` }}
              />
            </div>
          )}
          
          {/* Children nodes in a row */}
          <div className="flex gap-6 pt-12">
            {children.map((childNode, index) => (
              <div key={childNode.user.id} className="relative">
                {/* Vertical connector to horizontal line - THICKER */}
                {children.length > 1 && (
                  <div className="absolute left-1/2 -translate-x-1/2 -top-12 w-1 h-12 bg-border border-2 border-primary/30 rounded-full" />
                )}
                <OrgNode 
                  node={childNode}
                  isLast={index === children.length - 1}
                  isRoot={false}
                  locale={locale}
                  t={t}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const OrgChart: React.FC<OrgChartProps> = ({ users }) => {
  const { t, locale } = useI18n();
  const [zoomLevel, setZoomLevel] = React.useState(100);

  // Build the organization tree
  const tree = buildTree(users);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 10, 50));
  const handleResetZoom = () => setZoomLevel(100);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <CardTitle>{t('dashboard.organizationChart')}</CardTitle>
            <CardDescription>{t('dashboard.orgChartPageDesc')}</CardDescription>
          </div>
          
          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 50}
              className="h-8 px-3"
            >
              <span className="text-lg">−</span>
            </Button>
            <span className="text-xs font-medium text-muted-foreground min-w-[60px] text-center">
              {zoomLevel}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 150}
              className="h-8 px-3"
            >
              <span className="text-lg">+</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetZoom}
              className="h-8 px-3 text-xs"
            >
              {locale === 'ar' ? 'إعادة تعيين' : 'Reset'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto overflow-y-hidden p-8 bg-gradient-to-br from-muted/20 to-muted/5">
        {/* Zoom hint */}
        <div className="text-xs text-muted-foreground mb-4 text-center">
          💡 {locale === 'ar' ? 'استخدم أزرار التكبير/التصغير أعلاه أو Ctrl + Scroll' : 'Use zoom buttons above or Ctrl + Scroll'}
        </div>
        
        <div 
          className="flex flex-col items-center min-w-fit mx-auto transition-transform duration-300"
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
        >
          {tree.map((rootNode) => (
            <div key={rootNode.user.id} className="mb-8">
              <OrgNode 
                node={rootNode} 
                isLast={false}
                isRoot={true}
                locale={locale}
                t={t}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrgChart;
