'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, getErrorMessage } from '@/core/api/client';
import { useI18n } from '@/shared/i18n/i18n-context';
import { usePermissionLevel } from '@/shared/hooks/use-permission-level';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Label } from '@/shared/components/ui/label';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import { Separator } from '@/shared/components/ui/separator';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar';
import { 
  Loader2, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  User, 
  Building2, 
  FileText, 
  DollarSign, 
  Calendar,
  Shield,
  TrendingUp,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Upload,
  Image as ImageIcon,
  X,
  File,
  ChevronLeft,
  ChevronRight,
  Globe,
  Users,
  MessageSquare,
  PartyPopper,
  HelpCircle,
  AlertCircle,
  Zap,
  Flag,
  Car,
  Heart,
  Home,
  Plane,
  Ship
} from 'lucide-react';
import { toast } from 'sonner';

// Wizard Steps
const STEPS = [
  { id: 1, name: 'basicInfo', icon: FileText },
  { id: 2, name: 'contact', icon: User },
  { id: 3, name: 'insurance', icon: Shield },
  { id: 4, name: 'files', icon: Upload },
  { id: 5, name: 'assignment', icon: TrendingUp },
];

interface UploadedFile {
  file: File;
  preview?: string;
  type: 'image' | 'document';
}

export default function NewLeadPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [contactSearchTerm, setContactSearchTerm] = useState('');
  const [companySearchTerm, setCompanySearchTerm] = useState('');
  const [filteredContacts, setFilteredContacts] = useState<any[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<any[]>([]);
  const [contactPage, setContactPage] = useState(1);
  const [companyPage, setCompanyPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const ITEMS_PER_PAGE = 10;
  const { canWrite, isLoading } = usePermissionLevel('crm_leads');
  const hasFetchedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'NEW',
    source: '',
    insuranceType: '',
    value: '',
    currentPremium: '',
    priority: 'MEDIUM',
    contactId: '',
    companyId: '',
    assignedTo: '',
    renewalDate: '',
    nextFollowUpDate: '',
    expectedCloseDate: '',
  });

  // Debug: Log assignedTo changes
  useEffect(() => {
    console.log('formData.assignedTo changed to:', formData.assignedTo);
  }, [formData.assignedTo]);

  // Fetch current user immediately on mount
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // Fetch other data when permissions are ready
  useEffect(() => {
    if (!isLoading && canWrite && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchContacts();
      fetchCompanies();
    }
  }, [canWrite, isLoading]);

  const fetchCurrentUser = async () => {
    try {
      const response = await apiClient.get('/api/users/me');
      
      if (response.success && response.data) {
        setCurrentUser(response.data);
        setFormData(prev => ({ ...prev, assignedTo: response.data.id }));
        fetchUsers(response.data.id);
      }
    } catch (error) {
      console.error('Failed to fetch current user:', error);
      toast.error(getErrorMessage(error, t('messages.errorFetchingData')));
    }
  };

  const fetchUsers = async (currentUserId: string) => {
    try {
      setLoadingUsers(true);
      
      // Fetch all users (same as OrgChart page)
      const response = await apiClient.get<{ success: boolean; data: any[] }>('/api/users');

      if (response.success && response.data) {
        const allUsers = Array.isArray(response.data) ? response.data : [];
        
        // Find current user to check if they're top-level (no manager)
        const currentUserData = allUsers.find((u: any) => u.id === currentUserId);
        
        // If user has no manager (Admin/CEO), show all users except self
        if (!currentUserData?.managerId) {
          const otherUsers = allUsers.filter((u: any) => u.id !== currentUserId);
          setUsers(otherUsers);
          setFilteredUsers(otherUsers);
          return;
        }
        
        // Otherwise, get subordinates recursively
        const getSubordinates = (managerId: string, users: any[]): any[] => {
          const direct = users.filter((u: any) => u.managerId === managerId);
          const indirect = direct.flatMap((u: any) => getSubordinates(u.id, users));
          return [...direct, ...indirect];
        };
        
        const subordinates = getSubordinates(currentUserId, allUsers);
        setUsers(subordinates);
        setFilteredUsers(subordinates);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error(getErrorMessage(error, t('messages.errorFetchingData')));
    } finally {
      setLoadingUsers(false);
    }
  };

  // Filter users based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        (user) =>
          user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.fullNameEn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.fullNameAr?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.role?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const fetchContacts = async () => {
    try {
      const response = await apiClient.get<any[]>('/api/crm/contacts');
      if (response.success && response.data) {
        const contactData = Array.isArray(response.data) ? response.data : [];
        setContacts(contactData);
        setFilteredContacts(contactData);
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await apiClient.get<any[]>('/api/crm/companies');
      if (response.success && response.data) {
        const companyData = Array.isArray(response.data) ? response.data : [];
        setCompanies(companyData);
        setFilteredCompanies(companyData);
      }
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    }
  };

  // Filter contacts based on search term
  useEffect(() => {
    if (contactSearchTerm.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter(
        (contact) =>
          contact.fullNameEn?.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
          contact.fullNameAr?.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
          contact.email?.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
          contact.phone?.includes(contactSearchTerm)
      );
      setFilteredContacts(filtered);
    }
  }, [contactSearchTerm, contacts]);

  // Filter companies based on search term
  useEffect(() => {
    if (companySearchTerm.trim() === '') {
      setFilteredCompanies(companies);
    } else {
      const filtered = companies.filter(
        (company) =>
          company.name?.toLowerCase().includes(companySearchTerm.toLowerCase()) ||
          company.industry?.toLowerCase().includes(companySearchTerm.toLowerCase()) ||
          company.email?.toLowerCase().includes(companySearchTerm.toLowerCase())
      );
      setFilteredCompanies(filtered);
    }
  }, [companySearchTerm, companies]);

  // Reset pagination when search terms change
  useEffect(() => {
    setContactPage(1);
  }, [contactSearchTerm]);

  useEffect(() => {
    setCompanyPage(1);
  }, [companySearchTerm]);

  useEffect(() => {
    setUsersPage(1);
  }, [searchTerm]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles: UploadedFile[] = files.map(file => {
      const isImage = file.type.startsWith('image/');
      return {
        file,
        type: isImage ? 'image' : 'document',
        preview: isImage ? URL.createObjectURL(file) : undefined,
      };
    });
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.title) {
          toast.error(t('crm.titleRequired'));
          return false;
        }
        if (!formData.source) {
          toast.error(t('crm.sourceRequired'));
          return false;
        }
        return true;
      case 2:
        if (!formData.contactId) {
          toast.error(t('crm.contactRequired'));
          return false;
        }
        return true;
      case 3:
        if (!formData.insuranceType) {
          toast.error(t('crm.insuranceTypeRequired'));
          return false;
        }
        return true;
      case 4:
        // Files are optional
        return true;
      case 5:
        // Assignment defaults to current user
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getAvailableUsers = () => {
    if (!currentUser) return [];
    return [currentUser, ...users];
  };

  const uploadFiles = async (leadId: string) => {
    if (uploadedFiles.length === 0) return;

    const uploadPromises = uploadedFiles.map(async ({ file, type }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', type === 'image' ? 'images' : 'documents');
      formData.append('relatedTo', 'lead');
      formData.append('relatedId', leadId);

      try {
        await apiClient.post('/api/files/upload', formData);
      } catch (error) {
        console.error('Failed to upload file:', file.name, error);
        toast.error(`${t('common.failedToUpload')}: ${file.name}`);
      }
    });

    await Promise.all(uploadPromises);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    // Validate all steps
    for (let step = 1; step <= STEPS.length; step++) {
      if (!validateStep(step)) {
        setCurrentStep(step);
        return;
      }
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        value: formData.value ? parseFloat(formData.value) : undefined,
        currentPremium: formData.currentPremium ? parseFloat(formData.currentPremium) : undefined,
        renewalDate: formData.renewalDate || undefined,
        nextFollowUpDate: formData.nextFollowUpDate || undefined,
        expectedCloseDate: formData.expectedCloseDate || undefined,
      };

      const response = await apiClient.post('/api/crm/leads', payload);
      if (response.success && response.data) {
        // Upload files if any
        if (uploadedFiles.length > 0) {
          await uploadFiles(response.data.id);
        }
        toast.success(t('crm.leadCreated'));
        router.push('/dashboard/crm/leads');
      }
    } catch (error) {
      toast.error(getErrorMessage(error, t('crm.failedToCreate')));
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!canWrite) {
    return null;
  }

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/crm/leads')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">{t('crm.createNewLead')}</h1>
            </div>
            <p className="text-muted-foreground mt-1">{t('crm.wizardDescription')}</p>
          </div>
        </div>
        <Badge variant="outline" className="text-sm">
          {t('crm.step')} {currentStep} / {STEPS.length}
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            return (
              <div
                key={step.id}
                className={`flex items-center gap-2 transition-all ${
                  isActive ? 'text-primary scale-110' : isCompleted ? 'text-green-600' : 'text-muted-foreground'
                }`}
              >
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                    isActive
                      ? 'border-primary bg-primary/10'
                      : isCompleted
                      ? 'border-green-600 bg-green-50'
                      : 'border-muted'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <span className="hidden sm:inline text-sm font-medium">
                  {t(`crm.${step.name}`)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Wizard Form */}
      <form onSubmit={(e) => {
        e.preventDefault();
        if (currentStep === STEPS.length) {
          handleSubmit();
        } else {
          nextStep();
        }
      }}>
        <Card className="border-2">
          <CardHeader className="border-b bg-muted/50">
            <CardTitle className="flex items-center gap-2">
              {React.createElement(STEPS[currentStep - 1].icon, { className: "h-5 w-5 text-primary" })}
              {t(`crm.${STEPS[currentStep - 1].name}`)}
            </CardTitle>
            <CardDescription>
              {t(`crm.${STEPS[currentStep - 1].name}Description`)}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    {t('crm.leadTitle')} *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={t('crm.leadTitlePlaceholder')}
                    className="text-lg h-12"
                    autoFocus
                  />
                  <p className="text-sm text-muted-foreground">{t('crm.leadTitleHint')}</p>
                </div>

                <Separator />

                {/* Lead Source */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">
                    {t('crm.leadSource')} *
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {[
                      { value: 'WEBSITE', label: t('crm.sourceWebsite'), icon: Globe, color: 'bg-blue-500' },
                      { value: 'REFERRAL', label: t('crm.sourceReferral'), icon: Users, color: 'bg-purple-500' },
                      { value: 'PHONE', label: t('crm.sourcePhone'), icon: Phone, color: 'bg-green-500' },
                      { value: 'EMAIL', label: t('crm.sourceEmail'), icon: Mail, color: 'bg-orange-500' },
                      { value: 'SOCIAL', label: t('crm.sourceSocial'), icon: MessageSquare, color: 'bg-pink-500' },
                      { value: 'EVENT', label: t('crm.sourceEvent'), icon: PartyPopper, color: 'bg-yellow-500' },
                      { value: 'OTHER', label: t('crm.sourceOther'), icon: HelpCircle, color: 'bg-gray-500' },
                    ].map((source) => {
                      const Icon = source.icon;
                      const isSelected = formData.source === source.value;
                      return (
                        <div
                          key={source.value}
                          className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                            isSelected
                              ? 'border-primary bg-primary/5 shadow-md'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => setFormData({ ...formData, source: source.value })}
                        >
                          <div className="flex flex-col items-center gap-2 text-center">
                            <div className={`w-10 h-10 rounded-full ${source.color} flex items-center justify-center`}>
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-sm font-medium">{source.label}</span>
                            {isSelected && (
                              <div className="absolute top-2 right-2">
                                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                {/* Priority */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">
                    {t('crm.priority')}
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { value: 'LOW', label: t('crm.priorityLow'), icon: Flag, color: 'bg-gray-500', textColor: 'text-gray-700' },
                      { value: 'MEDIUM', label: t('crm.priorityMedium'), icon: Flag, color: 'bg-blue-500', textColor: 'text-blue-700' },
                      { value: 'HIGH', label: t('crm.priorityHigh'), icon: Flag, color: 'bg-orange-500', textColor: 'text-orange-700' },
                      { value: 'URGENT', label: t('crm.priorityUrgent'), icon: Zap, color: 'bg-red-500', textColor: 'text-red-700' },
                    ].map((priority) => {
                      const Icon = priority.icon;
                      const isSelected = formData.priority === priority.value;
                      return (
                        <div
                          key={priority.value}
                          className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                            isSelected
                              ? 'border-primary bg-primary/5 shadow-md'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => setFormData({ ...formData, priority: priority.value })}
                        >
                          <div className="flex flex-col items-center gap-2 text-center">
                            <div className={`w-10 h-10 rounded-full ${priority.color} flex items-center justify-center`}>
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                            <span className={`text-sm font-medium ${isSelected ? priority.textColor : ''}`}>
                              {priority.label}
                            </span>
                            {isSelected && (
                              <div className="absolute top-2 right-2">
                                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base">
                    {t('crm.description')}
                  </Label>
                  <Textarea
                    id="description"
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t('crm.descriptionPlaceholder')}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Contact & Company */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <Alert className="border-primary/20 bg-primary/5">
                  <User className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-sm">
                    {t('crm.contactCompanyHint')}
                  </AlertDescription>
                </Alert>

                {/* Contact Selection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      {t('crm.contactInfo')} *
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('/dashboard/crm/contacts/new', '_blank')}
                    >
                      <User className="h-3.5 w-3.5 mr-1.5" />
                      {t('crm.createNewContact')}
                    </Button>
                  </div>

                  {/* Search Contacts */}
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder={t('crm.searchContacts')}
                      className="h-11 pl-10"
                      value={contactSearchTerm}
                      onChange={(e) => setContactSearchTerm(e.target.value)}
                    />
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>

                  {/* Contacts List */}
                  <div className="space-y-2">
                    {(() => {
                      const startIdx = (contactPage - 1) * ITEMS_PER_PAGE;
                      const endIdx = startIdx + ITEMS_PER_PAGE;
                      const paginatedContacts = filteredContacts.slice(startIdx, endIdx);
                      const totalPages = Math.ceil(filteredContacts.length / ITEMS_PER_PAGE);

                      return (
                        <>
                          {paginatedContacts.length > 0 ? (
                            <>
                              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                {paginatedContacts.map((contact) => (
                                  <div
                                    key={contact.id}
                                    className={`relative border rounded-lg p-3 cursor-pointer transition-all hover:border-primary/50 hover:shadow-sm ${
                                      formData.contactId === contact.id
                                        ? 'border-primary bg-primary/5 shadow-sm'
                                        : 'border-border'
                                    }`}
                                    onClick={() => setFormData({ ...formData, contactId: contact.id })}
                                  >
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-10 w-10 shrink-0">
                                        <AvatarImage src={contact.avatarUrl} alt={contact.fullNameEn || contact.email} />
                                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                          {contact.fullNameEn ? contact.fullNameEn.charAt(0).toUpperCase() : contact.email.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">
                                          {contact.fullNameEn || contact.fullNameAr || contact.email}
                                        </p>
                                        {contact.email && (
                                          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                                            <Mail className="h-3 w-3" />
                                            {contact.email}
                                          </span>
                                        )}
                                        {contact.phone && (
                                          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                            <Phone className="h-3 w-3" />
                                            {contact.phone}
                                          </span>
                                        )}
                                        {contact.type && (
                                          <Badge variant="outline" className="mt-1.5 text-xs">
                                            {contact.type}
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="shrink-0">
                                        <div
                                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                            formData.contactId === contact.id
                                              ? 'border-primary bg-primary'
                                              : 'border-muted-foreground'
                                          }`}
                                        >
                                          {formData.contactId === contact.id && (
                                            <Check className="w-3.5 h-3.5 text-white" />
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Pagination */}
                              {totalPages > 1 && (
                                <div className="flex items-center justify-between pt-2 border-t">
                                  <p className="text-xs text-muted-foreground">
                                    {t('common.showing')} {startIdx + 1}-{Math.min(endIdx, filteredContacts.length)} {t('common.of')} {filteredContacts.length}
                                  </p>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setContactPage(p => Math.max(1, p - 1))}
                                      disabled={contactPage === 1}
                                    >
                                      <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="text-xs px-2">
                                      {contactPage} / {totalPages}
                                    </span>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setContactPage(p => Math.min(totalPages, p + 1))}
                                      disabled={contactPage === totalPages}
                                    >
                                      <ChevronRight className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="text-center py-8">
                              <User className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                              <p className="text-sm text-muted-foreground mb-2">
                                {contactSearchTerm ? t('crm.noContactsFound') : t('crm.noContacts')}
                              </p>
                              {contactSearchTerm && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setContactSearchTerm('')}
                                >
                                  {t('common.clearSearch')}
                                </Button>
                              )}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Company Selection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      {t('crm.company')} <span className="text-xs text-muted-foreground font-normal">({t('common.optional')})</span>
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('/dashboard/crm/companies/new', '_blank')}
                    >
                      <Building2 className="h-3.5 w-3.5 mr-1.5" />
                      {t('crm.createNewCompany')}
                    </Button>
                  </div>

                  {/* Search Companies */}
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder={t('crm.searchCompanies')}
                      className="h-11 pl-10"
                      value={companySearchTerm}
                      onChange={(e) => setCompanySearchTerm(e.target.value)}
                    />
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>

                  {/* Companies List */}
                  <div className="space-y-2">
                    {/* None Option */}
                    <div
                      className={`relative border rounded-lg p-3 cursor-pointer transition-all hover:border-primary/50 hover:shadow-sm ${
                        !formData.companyId || formData.companyId === ''
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border'
                      }`}
                      onClick={() => setFormData({ ...formData, companyId: '' })}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-muted-foreground shrink-0">
                          <X className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{t('crm.noCompany')}</p>
                          <p className="text-xs text-muted-foreground">{t('crm.skipCompanySelection')}</p>
                        </div>
                        <div className="shrink-0">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              !formData.companyId || formData.companyId === ''
                                ? 'border-primary bg-primary'
                                : 'border-muted-foreground'
                            }`}
                          >
                            {(!formData.companyId || formData.companyId === '') && (
                              <Check className="w-3.5 h-3.5 text-white" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {(() => {
                      const startIdx = (companyPage - 1) * ITEMS_PER_PAGE;
                      const endIdx = startIdx + ITEMS_PER_PAGE;
                      const paginatedCompanies = filteredCompanies.slice(startIdx, endIdx);
                      const totalPages = Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE);

                      return (
                        <>
                          {paginatedCompanies.length > 0 ? (
                            <>
                              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                {paginatedCompanies.map((company) => (
                                  <div
                                    key={company.id}
                                    className={`relative border rounded-lg p-3 cursor-pointer transition-all hover:border-primary/50 hover:shadow-sm ${
                                      formData.companyId === company.id
                                        ? 'border-primary bg-primary/5 shadow-sm'
                                        : 'border-border'
                                    }`}
                                    onClick={() => setFormData({ ...formData, companyId: company.id })}
                                  >
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-10 w-10 shrink-0">
                                        <AvatarImage src={company.logoUrl || undefined} />
                                        <AvatarFallback className="bg-primary/10 text-primary">
                                          <Building2 className="h-5 w-5" />
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{company.name}</p>
                                        {company.industry && (
                                          <Badge variant="outline" className="mt-1 text-xs">
                                            {company.industry}
                                          </Badge>
                                        )}
                                        {company.email && (
                                          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                            <Mail className="h-3 w-3" />
                                            {company.email}
                                          </span>
                                        )}
                                      </div>
                                      <div className="shrink-0">
                                        <div
                                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                            formData.companyId === company.id
                                              ? 'border-primary bg-primary'
                                              : 'border-muted-foreground'
                                          }`}
                                        >
                                          {formData.companyId === company.id && (
                                            <Check className="w-3.5 h-3.5 text-white" />
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Pagination Controls */}
                              {totalPages > 1 && (
                                <div className="flex items-center justify-between pt-3 border-t">
                                  <p className="text-xs text-muted-foreground">
                                    {t('common.showing')} {startIdx + 1}-{Math.min(endIdx, filteredCompanies.length)} {t('common.of')} {filteredCompanies.length}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setCompanyPage(p => Math.max(1, p - 1))}
                                      disabled={companyPage === 1}
                                      className="h-8 w-8 p-0"
                                    >
                                      <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="text-xs text-muted-foreground">
                                      {companyPage} / {totalPages}
                                    </span>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setCompanyPage(p => Math.min(totalPages, p + 1))}
                                      disabled={companyPage === totalPages}
                                      className="h-8 w-8 p-0"
                                    >
                                      <ChevronRight className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : companySearchTerm ? (
                            <div className="text-center py-8">
                              <Building2 className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                              <p className="text-sm text-muted-foreground mb-2">{t('crm.noCompaniesFound')}</p>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setCompanySearchTerm('')}
                              >
                                {t('common.clearSearch')}
                              </Button>
                            </div>
                          ) : null}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Insurance Details */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Insurance Type */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    {t('crm.insuranceType')} *
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {[
                      { value: 'AUTO', label: t('crm.insuranceAuto'), icon: Car, color: 'bg-blue-500' },
                      { value: 'HEALTH', label: t('crm.insuranceHealth'), icon: Heart, color: 'bg-red-500' },
                      { value: 'LIFE', label: t('crm.insuranceLife'), icon: Shield, color: 'bg-green-500' },
                      { value: 'PROPERTY', label: t('crm.insuranceProperty'), icon: Home, color: 'bg-purple-500' },
                      { value: 'TRAVEL', label: t('crm.insuranceTravel'), icon: Plane, color: 'bg-sky-500' },
                      { value: 'MARINE', label: t('crm.insuranceMarine'), icon: Ship, color: 'bg-cyan-500' },
                      { value: 'OTHER', label: t('crm.insuranceOther'), icon: HelpCircle, color: 'bg-gray-500' },
                    ].map((insurance) => {
                      const Icon = insurance.icon;
                      const isSelected = formData.insuranceType === insurance.value;
                      return (
                        <div
                          key={insurance.value}
                          className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                            isSelected
                              ? 'border-primary bg-primary/5 shadow-md'
                              : 'border-border hover:border-primary/50'
                          }`}
                          onClick={() => setFormData({ ...formData, insuranceType: insurance.value })}
                        >
                          <div className="flex flex-col items-center gap-2 text-center">
                            <div className={`w-12 h-12 rounded-full ${insurance.color} flex items-center justify-center`}>
                              <Icon className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-sm font-medium">{insurance.label}</span>
                            {isSelected && (
                              <div className="absolute top-2 right-2">
                                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Separator />

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="value" className="text-base flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      {t('crm.estimatedValue')}
                    </Label>
                    <Input
                      id="value"
                      type="number"
                      step="0.01"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      placeholder="0.00"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentPremium" className="text-base">
                      {t('crm.currentPremium')}
                    </Label>
                    <Input
                      id="currentPremium"
                      type="number"
                      step="0.01"
                      value={formData.currentPremium}
                      onChange={(e) => setFormData({ ...formData, currentPremium: e.target.value })}
                      placeholder="0.00"
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="renewalDate" className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    {t('crm.renewalDate')}
                  </Label>
                  <Input
                    id="renewalDate"
                    type="date"
                    value={formData.renewalDate}
                    onChange={(e) => setFormData({ ...formData, renewalDate: e.target.value })}
                    className="h-11"
                  />
                </div>
              </div>
            )}

            {/* Step 4: Files & Attachments */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <Alert>
                  <Upload className="h-4 w-4" />
                  <AlertDescription>
                    {t('crm.filesHint')}
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm font-medium mb-1">{t('crm.uploadFiles')}</p>
                    <p className="text-xs text-muted-foreground">{t('crm.uploadFilesHint')}</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                      onChange={handleFileSelect}
                      className="hidden"
                      aria-label={t('crm.uploadFiles')}
                    />
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-base">{t('crm.uploadedFiles')} ({uploadedFiles.length})</Label>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {uploadedFiles.map((item, index) => (
                          <div
                            key={index}
                            className="relative group border rounded-lg p-3 hover:border-primary transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <div className="shrink-0">
                                {item.type === 'image' && item.preview ? (
                                  <div className="w-16 h-16 rounded overflow-hidden bg-muted">
                                    <img
                                      src={item.preview}
                                      alt={item.file.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-16 h-16 rounded bg-muted flex items-center justify-center">
                                    <File className="h-8 w-8 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{item.file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(item.file.size / 1024).toFixed(1)} KB
                                </p>
                                <Badge variant="outline" className="mt-1 text-xs">
                                  {item.type === 'image' ? (
                                    <><ImageIcon className="h-3 w-3 mr-1" /> {t('crm.image')}</>
                                  ) : (
                                    <><File className="h-3 w-3 mr-1" /> {t('crm.document')}</>
                                  )}
                                </Badge>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeFile(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 5: Assignment & Dates */}
            {currentStep === 5 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <Alert className="border-primary/20 bg-primary/5">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-sm">
                    {t('crm.assignmentHint')}
                  </AlertDescription>
                </Alert>

                {/* Assignment Section */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    {t('crm.assignTo')}
                  </Label>

                  {/* Current User - Self Assignment */}
                  {currentUser && (
                    <div
                      className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all hover:border-primary/50 hover:shadow-md ${
                        formData.assignedTo === currentUser.id
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border hover:bg-muted/30'
                      }`}
                      onClick={() => {
                        console.log('Assigning to current user:', currentUser.id);
                        setFormData({ ...formData, assignedTo: currentUser.id });
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 shrink-0">
                          <AvatarImage src={currentUser.avatarUrl || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                            {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : currentUser.email.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-base">
                              {currentUser.fullName || currentUser.email}
                            </span>
                            <Badge variant="default" className="text-xs">
                              {t('crm.you')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                          {currentUser.role && (
                            <Badge variant="outline" className="mt-2 text-xs">
                              {currentUser.role}
                            </Badge>
                          )}
                        </div>
                        <div className="shrink-0">
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              formData.assignedTo === currentUser.id
                                ? 'border-primary bg-primary'
                                : 'border-muted-foreground'
                            }`}
                          >
                            {formData.assignedTo === currentUser.id && (
                              <Check className="w-4 h-4 text-white" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Loading State */}
                  {loadingUsers && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="ml-3 text-sm text-muted-foreground">
                        {t('common.loading')}...
                      </span>
                    </div>
                  )}

                  {/* Team Members Section */}
                  {!loadingUsers && (
                    <>
                      <Separator className="my-6" />
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            {t('crm.teamMembers')} 
                            {`(${users.length})`}
                          </Label>
                        </div>

                        {/* Search Users */}
                        <div className="relative">
                              <Input
                                type="text"
                                placeholder={t('crm.searchUsers')}
                                className="h-11 pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                              />
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            </div>

                            {/* Users List */}
                            <div className="space-y-2">
                              {(() => {
                                const startIdx = (usersPage - 1) * ITEMS_PER_PAGE;
                                const endIdx = startIdx + ITEMS_PER_PAGE;
                                const paginatedUsers = filteredUsers.slice(startIdx, endIdx);
                                const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

                                return (
                                  <>
                                    {paginatedUsers.length > 0 ? (
                                      <>
                                        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                          {paginatedUsers.map((user) => (
                                            <div
                                              key={user.id}
                                              className={`relative border-2 rounded-lg p-3 cursor-pointer transition-all hover:border-primary/50 hover:shadow-md ${
                                                formData.assignedTo === user.id
                                                  ? 'border-primary bg-primary/5 shadow-sm'
                                                  : 'border-border hover:bg-muted/30'
                                              }`}
                                              onClick={() => {
                                                console.log('Assigning to subordinate:', user.id, user.fullName);
                                                setFormData({ ...formData, assignedTo: user.id });
                                              }}
                                            >
                                              <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 shrink-0">
                                                  <AvatarImage src={user.avatarUrl || undefined} />
                                                  <AvatarFallback className="bg-muted text-foreground font-medium">
                                                    {(user.fullNameEn || user.fullName || user.email).charAt(0).toUpperCase()}
                                                  </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                  <p className="font-medium text-sm truncate">
                                                    {user.fullNameEn || user.fullName || user.email}
                                                  </p>
                                                  <p className="text-xs text-muted-foreground truncate">
                                                    {user.email}
                                                  </p>
                                                  {user.role && (
                                                    <Badge variant="outline" className="mt-1 text-xs">
                                                      {user.role}
                                                    </Badge>
                                                  )}
                                                </div>
                                                <div className="shrink-0">
                                                  <div
                                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                                      formData.assignedTo === user.id
                                                        ? 'border-primary bg-primary'
                                                        : 'border-muted-foreground'
                                                    }`}
                                                  >
                                                    {formData.assignedTo === user.id && (
                                                      <Check className="w-4 h-4 text-white" />
                                                    )}
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>

                                        {/* Pagination Controls */}
                                        {totalPages > 1 && (
                                          <div className="flex items-center justify-between pt-3 border-t">
                                            <p className="text-xs text-muted-foreground">
                                              {t('common.showing')} {startIdx + 1}-{Math.min(endIdx, filteredUsers.length)} {t('common.of')} {filteredUsers.length}
                                            </p>
                                            <div className="flex items-center gap-2">
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                                                disabled={usersPage === 1}
                                                className="h-8 w-8 p-0"
                                              >
                                                <ChevronLeft className="h-4 w-4" />
                                              </Button>
                                              <span className="text-xs text-muted-foreground">
                                                {usersPage} / {totalPages}
                                              </span>
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setUsersPage(p => Math.min(totalPages, p + 1))}
                                                disabled={usersPage === totalPages}
                                                className="h-8 w-8 p-0"
                                              >
                                                <ChevronRight className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <div className="text-center py-8">
                                        <User className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                                        <p className="text-sm text-muted-foreground">
                                          {searchTerm ? t('crm.noUsersFound') : t('crm.noUsers')}
                                        </p>
                                        {searchTerm && (
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSearchTerm('')}
                                            className="mt-2"
                                          >
                                            {t('common.clearSearch')}
                                          </Button>
                                        )}
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                      </div>
                    </>
                  )}

                  {/* No Users Message */}
                  {users.length === 0 && !loadingUsers && (
                    <Alert className="mt-4">
                      <User className="h-4 w-4" />
                      <AlertDescription>
                        {t('crm.noSubordinatesMessage')}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <Separator className="my-6" />

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nextFollowUpDate" className="text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      {t('crm.nextFollowUp')}
                    </Label>
                    <Input
                      id="nextFollowUpDate"
                      type="date"
                      value={formData.nextFollowUpDate}
                      onChange={(e) => setFormData({ ...formData, nextFollowUpDate: e.target.value })}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expectedCloseDate" className="text-base">
                      {t('crm.expectedCloseDate')}
                    </Label>
                    <Input
                      id="expectedCloseDate"
                      type="date"
                      value={formData.expectedCloseDate}
                      onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                      className="h-11"
                    />
                  </div>
                </div>

                {/* Review Summary */}
                <div className="mt-8 p-4 bg-muted/50 rounded-lg space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    {t('crm.reviewSummary')}
                  </h3>
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('crm.leadTitle')}:</span>
                      <span className="font-medium">{formData.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('crm.priority')}:</span>
                      <Badge variant="outline">{formData.priority}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('crm.insuranceType')}:</span>
                      <span className="font-medium">{formData.insuranceType}</span>
                    </div>
                    {uploadedFiles.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('crm.attachments')}:</span>
                        <span className="font-medium">{uploadedFiles.length} {t('crm.files')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1 || loading}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.previous')}
          </Button>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push('/dashboard/crm/leads')}
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>

            {currentStep < STEPS.length ? (
              <Button type="submit" disabled={loading}>
                {t('common.next')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" disabled={loading} className="min-w-[120px]">
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Check className="h-4 w-4 mr-2" />
                {t('crm.createLead')}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
