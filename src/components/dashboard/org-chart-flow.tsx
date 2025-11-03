'use client';

import * as React from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Panel,
  Position,
  MarkerType,
  Handle,
  ConnectionLineType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import '@/app/react-flow.css';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n/i18n-context';
import { Mail, Building2, Users as UsersIcon, Maximize2 } from 'lucide-react';
import { getLocalizedUserName, getUserInitials } from '@/lib/utils';

interface User {
  id: string;
  fullNameEn: string;
  fullNameAr?: string;
  email: string;
  role?: string;
  position?: string;
  department?: string;
  managerId?: string;
  positionId?: string;
  createdAt?: string;
  isActive?: boolean;
}

interface OrgChartProps {
  users: User[];
}

interface NodeData {
  user: User;
  locale: string;
  t: (key: string) => string;
  directReports: number;
  level: number;
}

// Custom Node Component
const CustomNode = ({ data }: { data: NodeData }) => {
  const { user, locale, t, directReports } = data;
  const userName = getLocalizedUserName(user, locale);
  const altName = locale === 'ar' ? user.fullNameEn : user.fullNameAr;
  const position = user.position || user.role || t('users.employee');

  // Level-based colors
  const levelColors = [
    'bg-gradient-to-br from-amber-500 to-yellow-600',      // Level 0 - CEO
    'bg-gradient-to-br from-purple-500 to-pink-600',       // Level 1
    'bg-gradient-to-br from-blue-500 to-cyan-600',         // Level 2
    'bg-gradient-to-br from-green-500 to-emerald-600',     // Level 3
    'bg-gradient-to-br from-teal-500 to-cyan-600',         // Level 4
    'bg-gradient-to-br from-slate-500 to-gray-600',        // Level 5+
  ];

  const colorClass = levelColors[Math.min(data.level || 0, levelColors.length - 1)];

  return (
    <>
      {/* Connection Handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ background: 'hsl(var(--primary))', width: 8, height: 8 }}
      />
      
      {/* User Card */}
      <Card className="w-[220px] shadow-lg hover:shadow-2xl transition-all duration-300 border-2 hover:scale-105 cursor-pointer overflow-hidden">
        {/* Colored header */}
        <div className={`h-2 ${colorClass}`} />
        
        <div className="p-3 bg-card">
          {/* Avatar and Name */}
          <div className="flex items-center gap-2 mb-2">
            <Avatar className={`h-10 w-10 ring-2 ring-offset-2 ${colorClass} ring-opacity-70`}>
              <AvatarFallback className={`${colorClass} text-white font-bold text-xs`}>
                {getUserInitials(user)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-xs truncate" title={userName}>
                {userName}
              </h3>
              {altName && (
                <p className="text-[10px] text-muted-foreground truncate" title={altName}>
                  {altName}
                </p>
              )}
            </div>
          </div>

          {/* Position Badge */}
          <Badge 
            className={`${colorClass} text-white text-[10px] w-full justify-center mb-2`}
            title={position}
          >
            {position.length > 25 ? `${position.substring(0, 22)}...` : position}
          </Badge>

          {/* Details */}
          <div className="space-y-1.5 border-t border-border/50 pt-2">
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

            {directReports > 0 && (
              <div className="flex items-center gap-1.5 text-primary font-medium bg-primary/10 rounded px-1.5 py-0.5">
                <UsersIcon className="h-3 w-3 flex-shrink-0" />
                <span className="text-[10px]">
                  {directReports} {directReports === 1 ? t('dashboard.directReport') : t('dashboard.directReports')}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Bottom Handle for children connections */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ background: 'hsl(var(--primary))', width: 8, height: 8 }}
      />
    </>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

// Calculate node positions in a tree layout
const calculateTreeLayout = (users: User[]): { nodes: Node[]; edges: Edge[] } => {
  if (!users || users.length === 0) return { nodes: [], edges: [] };

  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const userMap = new Map<string, User>();
  const childrenMap = new Map<string, string[]>();
  const levelMap = new Map<string, number>();
  const subtreeSpanMap = new Map<string, number>();
  const positionMap = new Map<string, { x: number; y: number }>();

  // Node sizing constants (kept in sync with CustomNode width)
  const nodeWidth = 220;
  const horizontalGap = 80;
  const verticalSpacing = 180;
  const unitWidth = nodeWidth + horizontalGap;
  
  // Build maps
  users.forEach(user => {
    userMap.set(user.id, user);
  });
  
  // Find roots and build children map
  const roots: string[] = [];
  users.forEach(user => {
    if (user.managerId && userMap.has(user.managerId)) {
      if (!childrenMap.has(user.managerId)) {
        childrenMap.set(user.managerId, []);
      }
      childrenMap.get(user.managerId)!.push(user.id);
    } else {
      roots.push(user.id);
    }
  });

  if (roots.length === 0 && users.length > 0) {
    roots.push(users[0].id);
  }

  // Calculate levels using BFS
  const queue: Array<{ id: string; level: number }> = roots.map(id => ({ id, level: 0 }));
  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    levelMap.set(id, level);
    const children = childrenMap.get(id) || [];
    children.forEach(childId => {
      queue.push({ id: childId, level: level + 1 });
    });
  }

  // Calculate subtree spans (how many leaf slots each node needs)
  const calculateSubtreeSpan = (userId: string): number => {
    const children = childrenMap.get(userId) || [];

    if (children.length === 0) {
      subtreeSpanMap.set(userId, 1);
      return 1;
    }

    const span = children.reduce((acc, childId) => acc + calculateSubtreeSpan(childId), 0);
    subtreeSpanMap.set(userId, span);
    return span;
  };

  // Assign concrete positions based on subtree spans
  const positionSubtree = (userId: string, depth: number, offset: number) => {
    const span = subtreeSpanMap.get(userId) ?? 1;
    const nodeCenterOffset = ((span * unitWidth) - nodeWidth) / 2;
    const x = offset + nodeCenterOffset;
    const y = depth * verticalSpacing;

    positionMap.set(userId, { x, y });

    const children = childrenMap.get(userId) || [];
    let currentOffset = offset;

    children.forEach(childId => {
      const childSpan = subtreeSpanMap.get(childId) ?? 1;
      positionSubtree(childId, depth + 1, currentOffset);
      currentOffset += childSpan * unitWidth;
    });
  };

  // Prepare positions for each root tree
  let currentOffset = 0;
  roots.forEach((rootId, index) => {
    const span = calculateSubtreeSpan(rootId);

    if (index > 0) {
      currentOffset += unitWidth; // Gap between different root trees
    }

    positionSubtree(rootId, 0, currentOffset);
    currentOffset += span * unitWidth;
  });

  // Center the entire layout
  const allX = Array.from(positionMap.values()).map(pos => pos.x);
  if (allX.length === 0) {
    return { nodes: [], edges: [] };
  }
  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const offsetX = -(minX + maxX) / 2;
  
  positionMap.forEach((pos, userId) => {
    positionMap.set(userId, { x: pos.x + offsetX, y: pos.y });
  });

  // Create nodes
  users.forEach(user => {
    const position = positionMap.get(user.id) || { x: 0, y: 0 };
    const level = levelMap.get(user.id) || 0;
    const directReports = childrenMap.get(user.id)?.length || 0;

    nodes.push({
      id: user.id,
      type: 'custom',
      position,
      data: { 
        user, 
        level,
        directReports,
        locale: 'en', // Will be set dynamically
        t: (key: string) => key, // Will be set dynamically
      },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      draggable: false, // Prevent dragging to maintain layout
    });
  });

  // Create edges with proper configuration
  users.forEach(user => {
    if (user.managerId && userMap.has(user.managerId)) {
      edges.push({
        id: `${user.managerId}-${user.id}`,
        source: user.managerId,
        target: user.id,
        sourceHandle: 'bottom',
        targetHandle: 'top',
        type: 'step',
        animated: true,
        style: { 
          stroke: 'hsl(var(--primary))',
          strokeWidth: 3,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: 'hsl(var(--primary))',
          width: 20,
          height: 20,
        },
      });
    }
  });

  return { nodes, edges };
};

const OrgChartFlow: React.FC<OrgChartProps> = ({ users }) => {
  const { t, locale } = useI18n();
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  
  // Calculate initial layout
  const initialLayout = React.useMemo(() => calculateTreeLayout(users), [users]);
  
  // Update nodes with current locale and t function
  const nodesWithLocale = React.useMemo(() => 
    initialLayout.nodes.map(node => ({
      ...node,
      data: { ...node.data, locale, t }
    })),
    [initialLayout.nodes, locale, t]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(nodesWithLocale);
  const [edges, , onEdgesChange] = useEdgesState(initialLayout.edges);

  // Update nodes when locale changes
  React.useEffect(() => {
    setNodes(nodesWithLocale);
  }, [nodesWithLocale, setNodes]);

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!users || users.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          {t('dashboard.noUsersData')}
        </div>
      </Card>
    );
  }

  const flowContent = (
    <div className={isFullscreen ? 'fixed inset-0 z-50 bg-background' : 'w-full h-[800px]'}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnScroll
        panOnDrag
        zoomOnScroll
        zoomOnPinch
        zoomOnDoubleClick={false}
        fitView
        fitViewOptions={{ 
          padding: 0.3, 
          minZoom: 0.4, 
          maxZoom: 1,
          duration: 800,
        }}
        minZoom={0.2}
        maxZoom={1.5}
        connectionLineType={ConnectionLineType.SmoothStep}
        defaultEdgeOptions={{
          type: 'step',
          animated: true,
          style: {
            strokeWidth: 3,
            stroke: 'hsl(var(--primary))',
          },
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={16} 
          size={1}
          color="hsl(var(--muted-foreground) / 0.1)"
        />
        <Controls 
          showInteractive={false}
          position={locale === 'ar' ? 'bottom-left' : 'bottom-right'}
        />
        <MiniMap 
          nodeColor={(node) => {
            const level = node.data.level || 0;
            const colors = ['#f59e0b', '#a855f7', '#3b82f6', '#10b981', '#14b8a6', '#64748b'];
            return colors[Math.min(level, colors.length - 1)];
          }}
          position={locale === 'ar' ? 'bottom-right' : 'bottom-left'}
          zoomable
          pannable
        />
        <Panel position="top-right" className="bg-background/80 backdrop-blur-sm rounded-lg p-2 shadow-lg">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFullscreen}
              className="h-8"
            >
              <Maximize2 className="h-4 w-4 mr-1" />
              {isFullscreen 
                ? (locale === 'ar' ? 'خروج' : 'Exit') 
                : (locale === 'ar' ? 'ملء الشاشة' : 'Fullscreen')
              }
            </Button>
          </div>
        </Panel>
        <Panel position="top-center" className="bg-primary/10 backdrop-blur-sm rounded-lg px-4 py-2">
          <div className="text-sm font-medium">
            💡 {locale === 'ar' 
              ? 'استخدم الماوس للتنقل والتكبير/التصغير' 
              : 'Use mouse to pan and zoom'
            }
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );

  return (
    <Card>
      <div className="border-b px-6 py-4">
        <h2 className="text-2xl font-bold">{t('dashboard.organizationChart')}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t('dashboard.orgChartPageDesc')}
        </p>
      </div>
      <div className="p-0">
        {flowContent}
      </div>
    </Card>
  );
};

// Wrapper component with ReactFlowProvider
const OrgChartFlowWrapper: React.FC<OrgChartProps> = (props) => {
  return (
    <div className="w-full">
      <OrgChartFlow {...props} />
    </div>
  );
};

export default OrgChartFlowWrapper;
