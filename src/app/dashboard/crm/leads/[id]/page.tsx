'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, getErrorMessage } from '@/core/api/client';
import { useI18n } from '@/shared/i18n/i18n-context';
import { usePermissionLevel } from '@/shared/hooks/use-permission-level';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { Input } from '@/shared/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { 
  Loader2, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  Calendar, 
  DollarSign, 
  Building2, 
  User, 
  Phone, 
  Mail, 
  FileText, 
  Plus,
  Download,
  Eye,
  X,
  Image as ImageIcon,
  File as FileIcon,
  Link2,
  Shield,
  Car,
  Heart,
  Home,
  Plane,
  Ship,
  Package,
  Search,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import type { Lead, Activity, Contact, Company, InsuranceProduct, ProductCompanyRelation, InsuranceCompany } from '@/shared/types/database';

interface UploadedFile {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  entityType?: string;
  entityId?: string;
}

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { t, locale } = useI18n();
  const router = useRouter();
  
  // Lead data
  const [lead, setLead] = useState<Lead | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [contact, setContact] = useState<Contact | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [assignedUser, setAssignedUser] = useState<{ 
    id: string; 
    fullNameEn: string; 
    fullNameAr?: string; 
    email?: string;
    avatarUrl?: string;
  } | null>(null);
  
  // Files data
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  
  // Insurance product-company relations data
  const [linkedProductCompanies, setLinkedProductCompanies] = useState<Array<ProductCompanyRelation & { product?: InsuranceProduct; company?: InsuranceCompany }>>([]);
  const [allProductCompanies, setAllProductCompanies] = useState<Array<ProductCompanyRelation & { product?: InsuranceProduct; company?: InsuranceCompany }>>([]);
  const [productCompanySearchTerm, setProductCompanySearchTerm] = useState('');
  const [loadingProductCompanies, setLoadingProductCompanies] = useState(false);
  const [linkProductCompanyDialogOpen, setLinkProductCompanyDialogOpen] = useState(false);
  const [linkedProductCompanyIds, setLinkedProductCompanyIds] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const { canView, canWrite, canFull, isLoading } = usePermissionLevel('crm_leads');

  useEffect(() => {
    if (!isLoading && canView) {
      fetchLead();
      fetchActivities();
      fetchFiles();
      fetchAllProductCompanies();
    }
  }, [resolvedParams.id, canView, isLoading]);
  
  // Fetch linked product companies after allProductCompanies is loaded
  useEffect(() => {
    if (allProductCompanies.length > 0 && lead) {
      fetchLinkedProductCompanies();
    }
  }, [allProductCompanies, lead?.customFields?.linkedProductCompanyIds]);

  const fetchLead = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<Lead>(`/api/crm/leads/${resolvedParams.id}`);
      if (response.success && response.data) {
        setLead(response.data);
        
        // Fetch related data
        if (response.data.assignedTo) {
          fetchAssignedUser(response.data.assignedTo);
        }
        if (response.data.contactId) {
          fetchContact(response.data.contactId);
        }
        if (response.data.companyId) {
          fetchCompany(response.data.companyId);
        }
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to fetch lead'));
      router.push('/dashboard/crm/leads');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedUser = async (userId: string) => {
    try {
      const response = await apiClient.get(`/api/users/${userId}`);
      if (response.success && response.data) {
        setAssignedUser(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch assigned user:', error);
    }
  };

  const fetchContact = async (contactId: string) => {
    try {
      const response = await apiClient.get(`/api/crm/contacts/${contactId}`);
      if (response.success && response.data) {
        setContact(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch contact:', error);
    }
  };

  const fetchCompany = async (companyId: string) => {
    try {
      const response = await apiClient.get(`/api/crm/companies/${companyId}`);
      if (response.success && response.data) {
        setCompany(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch company:', error);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await apiClient.get<Activity[]>(`/api/crm/activities?leadId=${resolvedParams.id}`);
      if (response.success && response.data) {
        setActivities(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    }
  };

  const fetchFiles = async () => {
    try {
      setLoadingFiles(true);
      const response: any = await apiClient.get(`/api/upload?entityType=lead&entityId=${resolvedParams.id}`);
      if (response.success && response.files) {
        setFiles(Array.isArray(response.files) ? response.files : []);
      }
    } catch (error) {
      console.error('Failed to fetch files:', error);
      setFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  };

  const fetchLinkedProductCompanies = async () => {
    try {
      setLoadingProductCompanies(true);
      // Get linked product-company relation IDs from lead metadata
      if (lead?.customFields?.linkedProductCompanyIds && allProductCompanies.length > 0) {
        const ids = lead.customFields.linkedProductCompanyIds as string[];
        setLinkedProductCompanyIds(ids);
        
        // Filter allProductCompanies to get only linked ones
        const linkedRelations = allProductCompanies.filter(relation => ids.includes(relation.id));
        setLinkedProductCompanies(linkedRelations);
      } else {
        setLinkedProductCompanies([]);
      }
    } catch (error) {
      console.error('Failed to fetch linked product-companies:', error);
    } finally {
      setLoadingProductCompanies(false);
    }
  };

  const fetchAllProductCompanies = async () => {
    try {
      // Fetch all insurance products
      const productsResponse = await apiClient.get<{ success: boolean; data: InsuranceProduct[] }>('/api/insurance-products');
      if (!productsResponse.success || !productsResponse.data) {
        setAllProductCompanies([]);
        return;
      }

      const products = Array.isArray(productsResponse.data) ? productsResponse.data : [];
      
      // For each product, fetch its company relations
      const allRelations: Array<ProductCompanyRelation & { product?: InsuranceProduct; company?: InsuranceCompany }> = [];
      
      // Fetch all companies first
      const companiesResponse = await apiClient.get<{ success: boolean; data: InsuranceCompany[] }>('/api/insurance-companies');
      const companies = companiesResponse.success && Array.isArray(companiesResponse.data) ? companiesResponse.data : [];
      
      // Create a map for quick company lookup
      const companyMap = new Map<string, InsuranceCompany>();
      companies.forEach(company => companyMap.set(company.id, company));
      
      for (const product of products) {
        try {
          const relationsResponse: any = await apiClient.get(`/api/insurance-products/${product.id}/companies`);
          if (relationsResponse.success && relationsResponse.data) {
            const relations = Array.isArray(relationsResponse.data) ? relationsResponse.data : [];
            // Add product and company info to each relation
            relations.forEach((relation: ProductCompanyRelation & { product?: InsuranceProduct; company?: InsuranceCompany }) => {
              relation.product = product;
              relation.company = companyMap.get(relation.companyId);
              allRelations.push(relation);
            });
          }
        } catch (error) {
          console.error(`Failed to fetch relations for product ${product.id}:`, error);
        }
      }
      
      setAllProductCompanies(allRelations);
    } catch (error) {
      console.error('Failed to fetch product-companies:', error);
      toast.error(getErrorMessage(error, 'Failed to load insurance products and companies'));
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      setStatusUpdating(true);
      const response = await apiClient.patch(`/api/crm/leads/${resolvedParams.id}`, {
        status: newStatus,
      });
      if (response.success) {
        toast.success(t('crm.statusUpdated'));
        fetchLead();
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update status'));
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('crm.deleteContactDescription'))) return;

    try {
      const response = await apiClient.delete(`/api/crm/leads/${resolvedParams.id}`);
      if (response.success) {
        toast.success(t('crm.leadDeleted'));
        router.push('/dashboard/crm/leads');
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to delete lead'));
    }
  };

  const handleConvertToDeal = async () => {
    if (!confirm(t('crm.convertToDeal') + '?')) return;

    try {
      const response = await apiClient.post(`/api/crm/leads/${resolvedParams.id}/convert`);
      if (response.success) {
        toast.success(t('crm.leadConverted'));
        router.push('/dashboard/crm/deals');
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to convert lead'));
    }
  };

  const handleDownloadFile = (fileId: string, fileName: string) => {
    // Open file in new tab for download
    window.open(`/api/files/${fileId}`, '_blank');
  };

  const handleViewFile = (fileId: string) => {
    // Open file in new tab for viewing
    window.open(`/api/files/${fileId}`, '_blank');
  };

  const handleLinkProductCompany = async (relationId: string) => {
    try {
      // Add relation ID to lead's customFields
      const currentIds = linkedProductCompanyIds || [];
      if (currentIds.includes(relationId)) {
        toast.info(t('crm.productLinkedSuccessfully'));
        setLinkProductCompanyDialogOpen(false);
        return;
      }

      const updatedIds = [...currentIds, relationId];
      
      // Update lead with new linked product-company relation
      const response = await apiClient.patch(`/api/crm/leads/${resolvedParams.id}`, {
        customFields: {
          ...lead?.customFields,
          linkedProductCompanyIds: updatedIds
        }
      });

      if (response.success) {
        toast.success(t('crm.productLinkedSuccessfully'));
        setLinkedProductCompanyIds(updatedIds);
        setLinkProductCompanyDialogOpen(false);
        fetchLead();
        fetchLinkedProductCompanies();
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t('crm.productLinkedSuccessfully')));
    }
  };

  const handleUnlinkProductCompany = async (relationId: string) => {
    try {
      if (!confirm(t('crm.confirmUnlinkProduct'))) return;

      const currentIds = linkedProductCompanyIds || [];
      const updatedIds = currentIds.filter(id => id !== relationId);
      
      // Update lead
      const response = await apiClient.patch(`/api/crm/leads/${resolvedParams.id}`, {
        customFields: {
          ...lead?.customFields,
          linkedProductCompanyIds: updatedIds
        }
      });

      if (response.success) {
        toast.success(t('crm.productUnlinkedSuccessfully'));
        setLinkedProductCompanyIds(updatedIds);
        fetchLead();
        fetchLinkedProductCompanies();
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to unlink product'));
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      NEW: 'default',
      QUALIFIED: 'outline',
      PROPOSAL: 'secondary',
      NEGOTIATION: 'secondary',
      CLOSED_WON: 'default',
      CLOSED_LOST: 'destructive',
    };

    return <Badge variant={variants[status] || 'default'}>{t(`crm.status${status.charAt(0) + status.slice(1).toLowerCase()}`)}</Badge>;
  };

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null;
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      LOW: 'secondary',
      MEDIUM: 'default',
      HIGH: 'destructive',
      URGENT: 'destructive',
    };
    return <Badge variant={variants[priority]}>{t(`crm.priority${priority.charAt(0) + priority.slice(1).toLowerCase()}`)}</Badge>;
  };

  const getInsuranceIcon = (type?: string, size: 'sm' | 'md' = 'md') => {
    const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
    const containerSize = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
    
    const iconConfig = {
      'AUTO': { icon: Car, color: 'text-blue-600', bg: 'bg-blue-100' },
      'MOTOR': { icon: Car, color: 'text-blue-600', bg: 'bg-blue-100' },
      'HEALTH': { icon: Heart, color: 'text-red-500', bg: 'bg-red-100' },
      'LIFE': { icon: Shield, color: 'text-green-600', bg: 'bg-green-100' },
      'PROPERTY': { icon: Home, color: 'text-orange-600', bg: 'bg-orange-100' },
      'TRAVEL': { icon: Plane, color: 'text-sky-600', bg: 'bg-sky-100' },
      'MARINE': { icon: Ship, color: 'text-cyan-600', bg: 'bg-cyan-100' },
    };
    
    const config = iconConfig[type as keyof typeof iconConfig] || { icon: Package, color: 'text-gray-600', bg: 'bg-gray-100' };
    const IconComponent = config.icon;
    
    return (
      <div className={`${containerSize} rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
        <IconComponent className={`${iconSize} ${config.color}`} />
      </div>
    );
  };

  const formatCurrency = (value: number) => {
    const formatted = value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 3 });
    return locale === 'ar' ? `${formatted} ر.ع` : `${formatted} OMR`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <ImageIcon className="h-5 w-5" />;
    return <FileIcon className="h-5 w-5" />;
  };

  const getUserInitials = (user: { fullNameEn: string; fullNameAr?: string } | null) => {
    if (!user) return '?';
    const name = locale === 'ar' && user.fullNameAr ? user.fullNameAr : user.fullNameEn;
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredProductCompanies = allProductCompanies.filter(relation => {
    if (!productCompanySearchTerm) return true;
    const searchLower = productCompanySearchTerm.toLowerCase();
    const productNameEn = relation.product?.nameEn?.toLowerCase() || '';
    const productNameAr = relation.product?.nameAr?.toLowerCase() || '';
    const productCode = relation.product?.code?.toLowerCase() || '';
    const companyNameEn = relation.company?.nameEn?.toLowerCase() || '';
    const companyNameAr = relation.company?.nameAr?.toLowerCase() || '';
    return productNameEn.includes(searchLower) || 
           productNameAr.includes(searchLower) || 
           productCode.includes(searchLower) ||
           companyNameEn.includes(searchLower) ||
           companyNameAr.includes(searchLower);
  });

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!canView || !lead) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/crm/leads')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold tracking-tight">{lead.title}</h1>
              {getStatusBadge(lead.status)}
              {getPriorityBadge(lead.priority)}
            </div>
            <p className="text-muted-foreground">{t('crm.leadDetails')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canWrite && lead.status === 'QUALIFIED' && (
            <Button onClick={handleConvertToDeal}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {t('crm.convertToDeal')}
            </Button>
          )}
          {canWrite && (
            <Button variant="outline" onClick={() => router.push(`/dashboard/crm/leads/${lead.id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              {t('common.edit')}
            </Button>
          )}
          {canFull && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              {t('common.delete')}
            </Button>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {canWrite && (
        <Card>
          <CardHeader>
            <CardTitle>{t('crm.quickActions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => router.push(`/dashboard/crm/activities/new?leadId=${lead.id}`)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('crm.newActivity')}
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t('crm.status')}:</span>
                <Select value={lead.status} onValueChange={handleStatusChange} disabled={statusUpdating}>
                  <SelectTrigger className="w-[180px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW">{t('crm.statusNew')}</SelectItem>
                    <SelectItem value="QUALIFIED">{t('crm.statusQualified')}</SelectItem>
                    <SelectItem value="PROPOSAL">{t('crm.statusProposal')}</SelectItem>
                    <SelectItem value="NEGOTIATION">{t('crm.statusNegotiation')}</SelectItem>
                    <SelectItem value="CLOSED_WON">{t('crm.statusClosed_won')}</SelectItem>
                    <SelectItem value="CLOSED_LOST">{t('crm.statusClosed_lost')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content - Left 2 columns */}
        <div className="md:col-span-2 space-y-6">
          {/* Overview Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('crm.overview')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lead.description && (
                <>
                  <div>
                    <h3 className="text-sm font-medium mb-2">{t('crm.notes')}</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{lead.description}</p>
                  </div>
                  <Separator />
                </>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{t('crm.leadSource')}</p>
                  <p className="text-sm text-muted-foreground">
                    {lead.source ? t(`crm.source${lead.source.charAt(0) + lead.source.slice(1).toLowerCase()}`) : '-'}
                  </p>
                </div>

                {lead.value && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{t('crm.dealValue')}</p>
                    <p className="text-sm font-semibold">{formatCurrency(lead.value)}</p>
                  </div>
                )}

                {lead.renewalDate && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{t('crm.renewalDate')}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(lead.renewalDate).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {lead.nextFollowUpDate && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{t('crm.nextFollowUp')}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(lead.nextFollowUpDate).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {lead.expectedCloseDate && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{t('crm.expectedCloseDate')}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(lead.expectedCloseDate).toLocaleDateString()}
                    </p>
                  </div>
                )}

                {lead.probability !== undefined && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{t('crm.conversionRate')}</p>
                    <p className="text-sm text-muted-foreground">{lead.probability}%</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Insurance Details Card */}
          {lead.insuranceType && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getInsuranceIcon(lead.insuranceType)}
                  {t('crm.insuranceDetails')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{t('crm.insuranceType')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t(`crm.insurance${lead.insuranceType.charAt(0) + lead.insuranceType.slice(1).toLowerCase()}`)}
                    </p>
                  </div>

                  {lead.currentPremium && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{t('crm.currentPremium')}</p>
                      <p className="text-sm font-semibold">{formatCurrency(lead.currentPremium)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Files & Attachments Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {t('crm.filesAndAttachments')}
                </CardTitle>
                {canWrite && (
                  <Button variant="outline" size="sm" disabled>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('crm.uploadMoreFiles')}
                  </Button>
                )}
              </div>
              <CardDescription>
                {files.length > 0 ? `${files.length} ${files.length === 1 ? 'file' : 'files'}` : t('crm.noFilesAttached')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingFiles ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-8">
                  <FileIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{t('crm.noFilesAttached')}</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        <div className="shrink-0">
                          {file.mimeType.startsWith('image/') ? (
                            <div className="w-16 h-16 rounded border overflow-hidden bg-muted">
                              <img
                                src={`/api/files/${file.id}`}
                                alt={file.originalName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded border flex items-center justify-center bg-muted">
                              {getFileIcon(file.mimeType)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{file.originalName}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t('crm.fileUploadedOn')} {new Date(file.uploadedAt).toLocaleDateString()}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => handleViewFile(file.id)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              {t('crm.viewFile')}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => handleDownloadFile(file.id, file.originalName)}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              {t('crm.downloadFile')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Linked Insurance Products & Companies Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  {t('crm.linkedProducts')}
                </CardTitle>
                {canWrite && (
                  <Dialog open={linkProductCompanyDialogOpen} onOpenChange={setLinkProductCompanyDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          fetchAllProductCompanies();
                          setLinkProductCompanyDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {t('crm.linkProduct')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{t('crm.linkProduct')}</DialogTitle>
                        <DialogDescription>
                          {t('crm.selectProductToLink')}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder={t('crm.searchProducts')}
                            className="pl-10"
                            value={productCompanySearchTerm}
                            onChange={(e) => setProductCompanySearchTerm(e.target.value)}
                          />
                        </div>
                        
                        {allProductCompanies.length === 0 ? (
                          <div className="text-center py-8">
                            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">{t('crm.noProductsAvailable')}</p>
                          </div>
                        ) : filteredProductCompanies.length === 0 ? (
                          <div className="text-center py-8">
                            <p className="text-sm text-muted-foreground">{t('crm.noProductsAvailable')}</p>
                          </div>
                        ) : (
                          <div className="grid gap-3">
                            {filteredProductCompanies.map((relation) => (
                              <div
                                key={relation.id}
                                className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${linkedProductCompanyIds.includes(relation.id) ? 'bg-muted/50' : ''}`}
                                onClick={() => handleLinkProductCompany(relation.id)}
                              >
                                <div className="space-y-3">
                                  <div className="flex items-start gap-3">
                                    {getInsuranceIcon(relation.product?.type, 'md')}
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <p className="font-medium">
                                          {locale === 'ar' && relation.product?.nameAr ? relation.product.nameAr : relation.product?.nameEn}
                                        </p>
                                        <Badge variant="outline">{relation.product?.type}</Badge>
                                        {relation.isPreferred && (
                                          <Badge variant="default" className="text-xs">Preferred</Badge>
                                        )}
                                        {linkedProductCompanyIds.includes(relation.id) && (
                                          <Badge variant="secondary" className="text-xs">Linked</Badge>
                                        )}
                                      </div>
                                      <p className="text-xs text-muted-foreground font-mono mt-1">{relation.product?.code}</p>
                                    </div>
                                  </div>
                                  
                                  <Separator />
                                  
                                  <div className="flex items-center gap-2">
                                    {relation.company?.logoUrl ? (
                                      <img 
                                        src={relation.company.logoUrl} 
                                        alt={relation.company.nameEn}
                                        className="h-6 w-6 rounded object-contain"
                                      />
                                    ) : (
                                      <Building2 className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <p className="text-sm font-medium">
                                      {locale === 'ar' && relation.company?.nameAr ? relation.company.nameAr : relation.company?.nameEn}
                                    </p>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    {relation.basePremium && (
                                      <div>
                                        <span className="text-muted-foreground">{t('crm.basePremiumValue')}: </span>
                                        <span className="font-medium">{formatCurrency(relation.basePremium)}</span>
                                      </div>
                                    )}
                                    {relation.commissionRate && (
                                      <div>
                                        <span className="text-muted-foreground">Commission: </span>
                                        <span className="font-medium">{relation.commissionRate}%</span>
                                      </div>
                                    )}
                                    {relation.minCoverage && relation.maxCoverage && (
                                      <div className="col-span-2">
                                        <span className="text-muted-foreground">{t('crm.coverageRange')}: </span>
                                        <span className="font-medium">
                                          {formatCurrency(relation.minCoverage)} - {formatCurrency(relation.maxCoverage)}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              <CardDescription>
                {linkedProductCompanies.length > 0 
                  ? `${linkedProductCompanies.length} ${linkedProductCompanies.length === 1 ? 'product-company' : 'product-companies'} linked` 
                  : t('crm.noProductsLinked')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingProductCompanies ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : linkedProductCompanies.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{t('crm.noProductsLinked')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {linkedProductCompanies.map((relation) => (
                    <div
                      key={relation.id}
                      className="border rounded-lg p-4"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          {getInsuranceIcon(relation.product?.type, 'md')}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium">
                                {locale === 'ar' && relation.product?.nameAr ? relation.product.nameAr : relation.product?.nameEn}
                              </p>
                              <Badge variant="outline">{relation.product?.type}</Badge>
                              {relation.isPreferred && (
                                <Badge variant="default" className="text-xs">Preferred</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground font-mono mt-1">{relation.product?.code}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/dashboard/insurance-products/${relation.productId}`)}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            {canWrite && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUnlinkProductCompany(relation.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div className="flex items-center gap-2">
                          {relation.company?.logoUrl ? (
                            <img 
                              src={relation.company.logoUrl} 
                              alt={relation.company.nameEn}
                              className="h-6 w-6 rounded object-contain"
                            />
                          ) : (
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                          )}
                          <p className="text-sm font-medium">
                            {locale === 'ar' && relation.company?.nameAr ? relation.company.nameAr : relation.company?.nameEn}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {relation.basePremium && (
                            <div>
                              <p className="text-muted-foreground text-xs">{t('crm.basePremiumValue')}</p>
                              <p className="font-semibold">{formatCurrency(relation.basePremium)}</p>
                            </div>
                          )}
                          {relation.commissionRate && (
                            <div>
                              <p className="text-muted-foreground text-xs">Commission</p>
                              <p className="font-semibold">{relation.commissionRate}%</p>
                            </div>
                          )}
                          {relation.minCoverage && relation.maxCoverage && (
                            <div className="col-span-2">
                              <p className="text-muted-foreground text-xs">{t('crm.coverageRange')}</p>
                              <p className="font-semibold">
                                {formatCurrency(relation.minCoverage)} - {formatCurrency(relation.maxCoverage)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activities Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('crm.activities')}</CardTitle>
              <CardDescription>{activities.length} {t('crm.activities').toLowerCase()}</CardDescription>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">{t('crm.noActivitiesFound')}</p>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{activity.subject}</h4>
                          <Badge variant="outline">{activity.type}</Badge>
                        </div>
                        {activity.description && (
                          <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.startDate).toLocaleDateString()}
                          </p>
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs"
                            onClick={() => router.push(`/dashboard/crm/activities/${activity.id}`)}
                          >
                            {t('crm.viewDetails')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Right 1 column */}
        <div className="space-y-6">
          {/* Contact Info Card */}
          {lead.contactId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t('crm.contactInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {contact ? (
                  <>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={contact.avatarUrl} alt={contact.fullNameEn} />
                        <AvatarFallback>
                          {contact.fullNameEn
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">
                          {locale === 'ar' && contact.fullNameAr ? contact.fullNameAr : contact.fullNameEn}
                        </h4>
                        {contact.type && (
                          <Badge variant="outline" className="mt-1">
                            {t(`crm.type${contact.type.charAt(0) + contact.type.slice(1).toLowerCase()}`)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      {contact.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <a href={`mailto:${contact.email}`} className="hover:underline text-muted-foreground">
                            {contact.email}
                          </a>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <a href={`tel:${contact.phone}`} className="hover:underline text-muted-foreground">
                            {contact.phone}
                          </a>
                        </div>
                      )}
                    </div>
                    <Separator />
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      size="sm"
                      onClick={() => router.push(`/dashboard/crm/contacts/${contact.id}`)}
                    >
                      {t('crm.viewDetails')}
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Company Info Card */}
          {lead.companyId && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {t('crm.companyInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {company ? (
                  <>
                    <div className="space-y-2">
                      <h4 className="font-medium">{company.name}</h4>
                      {company.industry && (
                        <p className="text-sm text-muted-foreground">
                          {t('crm.industry')}: {company.industry}
                        </p>
                      )}
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      {company.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <a href={`mailto:${company.email}`} className="hover:underline text-muted-foreground">
                            {company.email}
                          </a>
                        </div>
                      )}
                      {company.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <a href={`tel:${company.phone}`} className="hover:underline text-muted-foreground">
                            {company.phone}
                          </a>
                        </div>
                      )}
                      {company.website && (
                        <div className="flex items-center gap-2 text-sm">
                          <FileText className="h-3 w-3 text-muted-foreground" />
                          <a 
                            href={company.website} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="hover:underline text-muted-foreground"
                          >
                            {company.website}
                          </a>
                        </div>
                      )}
                    </div>
                    <Separator />
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      size="sm"
                      onClick={() => router.push(`/dashboard/crm/companies/${company.id}`)}
                    >
                      {t('crm.viewDetails')}
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Assignment Card */}
          {lead.assignedTo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t('crm.assignedTo')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {assignedUser ? (
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={assignedUser.avatarUrl} alt={assignedUser.fullNameEn} />
                      <AvatarFallback>{getUserInitials(assignedUser)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {locale === 'ar' && assignedUser.fullNameAr 
                          ? assignedUser.fullNameAr 
                          : assignedUser.fullNameEn}
                      </p>
                      {assignedUser.email && (
                        <p className="text-xs text-muted-foreground truncate">{assignedUser.email}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{lead.assignedTo}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Metadata Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('crm.metadata')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('crm.createdAt')}</span>
                <span>{new Date(lead.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('crm.updatedAt')}</span>
                <span>{new Date(lead.updatedAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
