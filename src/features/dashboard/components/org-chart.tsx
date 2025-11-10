'use client';

import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import {
  Building2,
  ChevronDown,
  ChevronRight,
  GitBranch,
  Mail,
  RefreshCcw,
  Search,
  UserCheck,
  Users as UsersIcon,
} from 'lucide-react';
import { useI18n } from '@/shared/i18n/i18n-context';
import { cn, getLocalizedUserName, getUserInitials } from '@/core/utils';

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

interface OrgNodeProps {
  node: TreeNode;
  locale: string;
  t: (key: string) => string;
  collapsedNodes: Set<string>;
  onToggleNode: (id: string) => void;
  searchMatches: Set<string>;
  searchTerm: string;
  isRoot?: boolean;
}

const DEFAULT_ZOOM = 100;
const MIN_ZOOM = 60;
const MAX_ZOOM = 160;
const ZOOM_STEP = 15;

const levelAccents = [
  'from-amber-400 to-orange-500',
  'from-purple-400 to-purple-600',
  'from-blue-400 to-blue-600',
  'from-emerald-400 to-emerald-600',
  'from-cyan-400 to-cyan-600',
  'from-slate-400 to-slate-600',
];

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getLevelAccent = (level: number) => levelAccents[Math.min(level, levelAccents.length - 1)];

const getLevelLabel = (level: number, locale: string) =>
  locale === 'ar' ? `المستوى ${level + 1}` : `Level ${level + 1}`;

const highlightMatch = (text: string, term: string) => {
  if (!term.trim()) return text;
  const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi');
  const parts = text.split(regex);
  const normalizedTerm = term.toLowerCase();

  if (parts.length === 1) return text;

  return parts.map((part, index) => {
    const isMatch = part.toLowerCase() === normalizedTerm;
    return isMatch ? (
      <mark key={`${part}-${index}`} className="rounded bg-primary/20 px-0.5 py-0">
        {part}
      </mark>
    ) : (
      <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>
    );
  });
};

const matchesSearch = (user: User, normalizedTerm: string) => {
  if (!normalizedTerm) return false;

  const haystack = [
    user.fullNameEn,
    user.fullNameAr,
    user.position,
    user.role,
    user.department,
    user.email,
  ];

  return haystack.some(
    (value) => value && value.toLowerCase().includes(normalizedTerm),
  );
};

const buildTree = (users: User[]): TreeNode[] => {
  if (!users?.length) return [];

  const userMap = new Map<string, User>();
  const childrenMap = new Map<string, User[]>();

  users.forEach((user) => {
    userMap.set(user.id, user);
  });

  users.forEach((user) => {
    if (user.managerId && userMap.has(user.managerId)) {
      const siblings = childrenMap.get(user.managerId) ?? [];
      siblings.push(user);
      childrenMap.set(user.managerId, siblings);
    }
  });

  const buildNode = (user: User, level: number): TreeNode => {
    const children = childrenMap.get(user.id) ?? [];
    return {
      user,
      children: children.map((child) => buildNode(child, level + 1)),
      level,
    };
  };

  const roots = users.filter(
    (user) => !user.managerId || !userMap.has(user.managerId),
  );

  return roots.map((root) => buildNode(root, 0));
};

const StatCard: React.FC<{
  icon: LucideIcon;
  label: string;
  value: number;
  accent: string;
}> = ({ icon: Icon, label, value, accent }) => (
  <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-3">
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold">{value.toLocaleString()}</p>
    </div>
    <span className={cn('rounded-full p-2', accent)}>
      <Icon className="h-4 w-4" />
    </span>
  </div>
);

const OrgNode: React.FC<OrgNodeProps> = ({
  node,
  locale,
  t,
  collapsedNodes,
  onToggleNode,
  searchMatches,
  searchTerm,
  isRoot = false,
}) => {
  const { user, children, level } = node;
  const hasChildren = children.length > 0;
  const isCollapsed = collapsedNodes.has(user.id);
  const userName = getLocalizedUserName(user, locale);
  const altName = locale === 'ar' ? user.fullNameEn : user.fullNameAr;
  const position = user.position || user.role || t('users.employee');
  const isHighlighted = searchMatches.has(user.id);
  const accent = getLevelAccent(level);
  const gradient = `bg-gradient-to-r ${accent}`;
  const expandLabel = locale === 'ar' ? 'توسيع' : 'Expand';
  const collapseLabel = locale === 'ar' ? 'طي' : 'Collapse';

  return (
    <div className="flex flex-col items-center text-center">
      {!isRoot && <span className="mb-4 block h-8 w-px bg-border" aria-hidden />}

      <div
        className={cn(
          'group relative w-60 rounded-2xl border bg-card p-4 text-left shadow-sm transition-all',
          'hover:border-primary/60 hover:shadow-lg',
          isHighlighted && 'border-primary/70 shadow-lg ring-2 ring-primary/30',
          user.isActive === false && 'opacity-80 grayscale-[15%]',
        )}
      >
        <div className="flex items-start gap-3">
          <Avatar className={cn('h-12 w-12 border-2 border-background shadow-sm', gradient)}>
            <AvatarImage src={user.avatarUrl} alt={userName} />
            <AvatarFallback className={cn('text-white', gradient)}>
              {getUserInitials(user)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 space-y-1">
            <p className="font-semibold text-sm leading-tight truncate" title={userName}>
              {highlightMatch(userName, searchTerm)}
            </p>
            {altName && (
              <p className="text-xs text-muted-foreground truncate" title={altName}>
                {highlightMatch(altName, searchTerm)}
              </p>
            )}
            <p className="text-[11px] font-medium text-primary/90">{position}</p>
          </div>

          {hasChildren && (
            <button
              type="button"
              onClick={() => onToggleNode(user.id)}
              className="rounded-full border p-1 text-muted-foreground transition hover:bg-muted"
              aria-label={isCollapsed ? expandLabel : collapseLabel}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>

        <div className="mt-4 space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 truncate" title={user.email}>
            <Mail className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{highlightMatch(user.email, searchTerm)}</span>
          </div>
          {user.department && (
            <div className="flex items-center gap-2 truncate" title={user.department}>
              <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{highlightMatch(user.department, searchTerm)}</span>
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="secondary" className="border-0 text-[10px] font-semibold text-primary">
            {getLevelLabel(level, locale)}
          </Badge>
          {user.isActive === false && (
            <Badge variant="outline" className="border-destructive/50 text-[10px] text-destructive">
              {locale === 'ar' ? 'غير نشط' : 'Inactive'}
            </Badge>
          )}
          {hasChildren && (
            <Badge variant="outline" className="text-[10px]">
              {children.length}{' '}
              {children.length === 1 ? t('dashboard.directReport') : t('dashboard.directReports')}
            </Badge>
          )}
        </div>
      </div>

      {hasChildren && !isCollapsed && (
        <>
          <span className="my-4 block h-8 w-px bg-border" aria-hidden />
          <div className="relative flex w-full flex-wrap justify-center gap-6 pt-6">
            {children.length > 1 && (
              <span className="absolute left-4 right-4 top-0 h-px bg-border" aria-hidden />
            )}

            {children.map((child) => (
              <div key={child.user.id} className="relative flex flex-col items-center pt-4">
                <span className="absolute left-1/2 top-0 block h-4 w-px -translate-x-1/2 bg-border" aria-hidden />
                <OrgNode
                  node={child}
                  locale={locale}
                  t={t}
                  collapsedNodes={collapsedNodes}
                  onToggleNode={onToggleNode}
                  searchMatches={searchMatches}
                  searchTerm={searchTerm}
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
  const [zoomLevel, setZoomLevel] = React.useState(DEFAULT_ZOOM);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [departmentFilter, setDepartmentFilter] = React.useState<string>('all');
  const [onlyActive, setOnlyActive] = React.useState(false);
  const [collapsedNodes, setCollapsedNodes] = React.useState<Set<string>>(new Set());

  const departmentOptions = React.useMemo(() => {
    const unique = new Set(
      users
        .map((user) => user.department)
        .filter((dept): dept is string => Boolean(dept)),
    );

    return Array.from(unique).sort((a, b) => a.localeCompare(b, locale === 'ar' ? 'ar' : 'en'));
  }, [users, locale]);

  const filteredUsers = React.useMemo(
    () =>
      users.filter((user) => {
        if (onlyActive && user.isActive === false) return false;
        if (departmentFilter !== 'all' && user.department !== departmentFilter) return false;
        return true;
      }),
    [users, departmentFilter, onlyActive],
  );

  const tree = React.useMemo(() => buildTree(filteredUsers), [filteredUsers]);

  const normalizedTerm = searchTerm.trim().toLowerCase();

  const searchMatches = React.useMemo(() => {
    if (!normalizedTerm) return new Set<string>();
    return new Set(
      users.filter((user) => matchesSearch(user, normalizedTerm)).map((user) => user.id),
    );
  }, [users, normalizedTerm]);

  const stats = React.useMemo(
    () => ({
      total: users.length,
      visible: filteredUsers.length,
      departments: departmentOptions.length,
    }),
    [users.length, filteredUsers.length, departmentOptions.length],
  );

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
  const handleResetView = () => {
    setZoomLevel(DEFAULT_ZOOM);
    setSearchTerm('');
    setDepartmentFilter('all');
    setOnlyActive(false);
    setCollapsedNodes(new Set());
  };
  const toggleNode = (id: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <Card>
      <CardHeader className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>{t('dashboard.organizationChart')}</CardTitle>
            <CardDescription>{t('dashboard.orgChartPageDesc')}</CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoomLevel <= MIN_ZOOM}
              className="h-8 w-8"
            >
              −
            </Button>
            <span className="text-xs font-semibold text-muted-foreground min-w-[60px] text-center">
              {zoomLevel}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoomLevel >= MAX_ZOOM}
              className="h-8 w-8"
            >
              +
            </Button>
            <Button variant="outline" size="sm" onClick={handleResetView} className="h-8 gap-1 px-3">
              <RefreshCcw className="h-3.5 w-3.5" />
              {locale === 'ar' ? 'إعادة الضبط' : 'Reset'}
            </Button>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={locale === 'ar' ? 'ابحث حسب الاسم أو البريد' : 'Search name, email, team'}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger>
              <SelectValue
                placeholder={
                  locale === 'ar' ? 'تصفية حسب القسم' : 'Filter by department'
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {locale === 'ar' ? 'جميع الأقسام' : 'All departments'}
              </SelectItem>
              {departmentOptions.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant={onlyActive ? 'default' : 'outline'}
            className="gap-2"
            onClick={() => setOnlyActive((prev) => !prev)}
          >
            <UserCheck className="h-4 w-4" />
            {locale === 'ar' ? 'الموظفون النشطون فقط' : 'Only active employees'}
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard
            icon={UsersIcon}
            label={locale === 'ar' ? 'إجمالي الأفراد' : 'Total people'}
            value={stats.total}
            accent="bg-primary/10 text-primary"
          />
          <StatCard
            icon={UserCheck}
            label={locale === 'ar' ? 'يتم عرضهم الآن' : 'Visible now'}
            value={stats.visible}
            accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
          />
          <StatCard
            icon={GitBranch}
            label={locale === 'ar' ? 'عدد الأقسام' : 'Departments'}
            value={stats.departments}
            accent="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
          />
        </div>
      </CardHeader>

      <CardContent className="overflow-x-auto bg-gradient-to-br from-muted/20 to-muted/5 p-6">
        <div className="text-center text-xs text-muted-foreground">
          {locale === 'ar'
            ? 'استخدم أزرار التكبير أو Ctrl + تمرير للتنقل في المخطط.'
            : 'Use the zoom controls or Ctrl + Scroll to navigate the chart.'}
        </div>

        <div
          className="mt-6 flex min-w-fit flex-col items-center transition-transform duration-300"
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'top center',
          }}
        >
          {tree.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-card/60 px-6 py-16 text-center text-sm text-muted-foreground">
              {locale === 'ar'
                ? 'لا توجد نتائج مطابقة. حاول تعديل المرشحات أو إعادة التعيين.'
                : 'No records match the current filters. Adjust filters or reset the view.'}
            </div>
          ) : (
            tree.map((node) => (
              <div key={node.user.id} className="mb-10">
                <OrgNode
                  node={node}
                  locale={locale}
                  t={t}
                  collapsedNodes={collapsedNodes}
                  onToggleNode={toggleNode}
                  searchMatches={searchMatches}
                  searchTerm={searchTerm}
                  isRoot
                />
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrgChart;
