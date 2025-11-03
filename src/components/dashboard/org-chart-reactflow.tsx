'use client';

import React, { useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  BackgroundVariant,
  Handle,
  Position,
  ConnectionLineType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import '@/app/orgchart.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Mail, Building2, Users as UsersIcon } from 'lucide-react';
import { useI18n } from '@/lib/i18n/i18n-context';
import { getLocalizedUserName, getUserInitials } from '@/lib/utils';

interface User {
  id: string;
  fullNameEn: string;
  fullNameAr?: string;
  email: string;
  avatarUrl?: string;
  role?: string;
  position?: string;
  positionId?: string;
  department?: string;
  managerId?: string;
}

interface OrgChartProps {
  users: User[];
}

// Position colors based on hierarchy level
const getPositionColor = (level: number) => {
  const colors = [
    'bg-amber-500',      // Level 0 - CEO
    'bg-purple-500',     // Level 1
    'bg-blue-500',       // Level 2
    'bg-green-500',      // Level 3
    'bg-teal-500',       // Level 4
    'bg-slate-500',      // Level 5+
  ];
  return colors[Math.min(level, colors.length - 1)];
};

interface CustomNodeData {
  user: User;
  level: number;
  childrenCount: number;
}

// Custom Node Component
const CustomNode = ({ data }: { data: CustomNodeData }) => {
  const { t, locale } = useI18n();
  const userName = getLocalizedUserName(data.user, locale);
  const altName = locale === 'ar' ? data.user.fullNameEn : data.user.fullNameAr;
  const position = data.user.position || data.user.role || t('users.employee');

  return (
    <div className="group">
      {/* Connection handles */}
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-primary" />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-primary" />
      
      <div className="rounded-lg border-2 border-border/60 bg-card shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:border-primary/50 w-64 overflow-hidden">
        {/* Colored Header Strip */}
        <div className={`h-2 ${getPositionColor(data.level)}`} />
        
        <div className="p-4">
          {/* Avatar and Name Section */}
          <div className="flex items-center gap-3 mb-3">
            <Avatar className={`h-12 w-12 ring-2 ring-offset-2 ${getPositionColor(data.level)} ring-opacity-50 shrink-0`}>
              <AvatarImage 
                src={data.user.avatarUrl} 
                alt={userName}
              />
              <AvatarFallback className={`${getPositionColor(data.level)} text-white text-sm font-bold`}>
                {getUserInitials(data.user)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm truncate leading-tight" title={userName}>
                {userName}
              </h3>
              {altName && (
                <p className="text-xs text-muted-foreground truncate leading-tight" title={altName}>
                  {altName}
                </p>
              )}
            </div>
          </div>

          {/* Position Badge */}
          <div className="mb-3">
            <Badge 
              variant="secondary" 
              className={`${getPositionColor(data.level)} text-white text-xs w-full justify-center py-1 px-2`}
              title={position}
            >
              {position.length > 30 ? `${position.substring(0, 27)}...` : position}
            </Badge>
          </div>

          {/* Details */}
          <div className="space-y-2 border-t border-border/40 pt-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate text-xs" title={data.user.email}>
                {data.user.email}
              </span>
            </div>
            
            {data.user.department && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate text-xs" title={data.user.department}>
                  {data.user.department}
                </span>
              </div>
            )}

            {data.childrenCount > 0 && (
              <div className="flex items-center gap-2 text-primary/80 font-medium bg-primary/5 rounded px-2 py-1.5">
                <UsersIcon className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="text-xs">
                  {data.childrenCount} {data.childrenCount === 1 ? t('dashboard.directReport') : t('dashboard.directReports')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

// Calculate tree layout positions
const getLayoutedElements = (users: User[]) => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  
  if (!users || users.length === 0) {
    return { nodes, edges };
  }
  
  // Build hierarchy
  const userMap = new Map<string, User>();
  const childrenMap = new Map<string, string[]>();
  const roots: string[] = [];
  
  // First pass: create maps
  users.forEach(user => {
    userMap.set(user.id, user);
    childrenMap.set(user.id, []);
  });
  
  // Second pass: build relationships
  users.forEach(user => {
    if (user.managerId && userMap.has(user.managerId)) {
      childrenMap.get(user.managerId)?.push(user.id);
    } else {
      roots.push(user.id);
    }
  });

  // Layout configuration
  const NODE_WIDTH = 280;
  const NODE_HEIGHT = 200;
  const HORIZONTAL_SPACING = 50;
  const VERTICAL_SPACING = 100;
  
  // Position nodes recursively
  const positionNode = (
    userId: string,
    level: number,
    leftOffset: number
  ): number => {
    const user = userMap.get(userId);
    if (!user) return leftOffset;
    
    const children = childrenMap.get(userId) || [];
    
    if (children.length === 0) {
      // Leaf node - position it at leftOffset
      const x = leftOffset * (NODE_WIDTH + HORIZONTAL_SPACING);
      const y = level * (NODE_HEIGHT + VERTICAL_SPACING);
      
      nodes.push({
        id: userId,
        type: 'custom',
        position: { x, y },
        data: { 
          user, 
          level,
          childrenCount: 0,
        },
      });
      
      return leftOffset + 1;
    }
    
    // Process children first
    let currentOffset = leftOffset;
    const childPositions: number[] = [];
    
    children.forEach(childId => {
      const childX = currentOffset * (NODE_WIDTH + HORIZONTAL_SPACING);
      childPositions.push(childX);
      
      // Create edge from parent to child
      edges.push({
        id: `${userId}-${childId}`,
        source: userId,
        target: childId,
        type: 'smoothstep',
        animated: false,
        style: { 
          stroke: '#3b82f6',
          strokeWidth: 4,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 25,
          height: 25,
          color: '#3b82f6',
        },
      });
      
      currentOffset = positionNode(childId, level + 1, currentOffset);
    });
    
    // Position parent centered over children
    const firstChildX = childPositions[0];
    const lastChildX = childPositions[childPositions.length - 1];
    const parentX = (firstChildX + lastChildX) / 2;
    const parentY = level * (NODE_HEIGHT + VERTICAL_SPACING);
    
    nodes.push({
      id: userId,
      type: 'custom',
      position: { x: parentX, y: parentY },
      data: { 
        user, 
        level,
        childrenCount: children.length,
      },
    });
    
    return currentOffset;
  };
  
  // Layout each root tree
  let currentOffset = 0;
  roots.forEach(rootId => {
    currentOffset = positionNode(rootId, 0, currentOffset);
    currentOffset += 2; // Extra spacing between root trees
  });
  
  console.log('📊 OrgChart Layout:', {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    roots: roots.length,
  });
  
  return { nodes, edges };
};

const OrgChartReactFlow: React.FC<OrgChartProps> = ({ users }) => {
  const { t } = useI18n();
  
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    return getLayoutedElements(users);
  }, [users]);
  
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // Debug: Log edges to console
  React.useEffect(() => {
    console.log('🔗 Edges in ReactFlow:', {
      count: edges.length,
      edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target, type: e.type })),
    });
  }, [edges]);

  if (!users || users.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.organizationChart')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t('dashboard.noUsersData')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[calc(100vh-280px)]">
      <CardHeader className="py-4">
        <CardTitle className="text-xl">{t('dashboard.organizationChart')}</CardTitle>
        <CardDescription className="text-sm">{t('dashboard.orgChartPageDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="h-[calc(100%-88px)] p-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
          fitView
          fitViewOptions={{
            padding: 0.2,
            minZoom: 0.5,
            maxZoom: 1.5,
          }}
          minZoom={0.1}
          maxZoom={2}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: false,
            style: {
              strokeWidth: 4,
              stroke: '#3b82f6',
            },
          }}
          connectionLineType={ConnectionLineType.SmoothStep}
          proOptions={{ hideAttribution: true }}
        >
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={16} 
            size={1}
            color="hsl(var(--muted-foreground) / 0.2)"
          />
          <Controls 
            showInteractive={false}
            className="bg-card border border-border rounded-lg shadow-lg"
          />
        </ReactFlow>
      </CardContent>
    </Card>
  );
};

export default OrgChartReactFlow;
