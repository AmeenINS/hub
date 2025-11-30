/**
 * Company Contacts Page
 * Display all contacts associated with a specific company
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient, getErrorMessage } from '@/core/api/client';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { ArrowLeft, Loader2, Mail, Phone, User } from 'lucide-react';
import { useI18n } from '@/shared/i18n/i18n-context';
import { toast } from 'sonner';

interface Contact {
  id: string;
  fullNameEn: string;
  fullNameAr?: string;
  email: string;
  phone: string;
  position?: string;
  type: string;
  avatarUrl?: string;
}

interface Company {
  id: string;
  name: string;
  industry?: string;
}

export default function CompanyContactsPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useI18n();
  const companyId = params?.id as string;

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [companyId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load company details
      const companyResponse = await apiClient.get(`/api/crm/companies/${companyId}`);
      if (companyResponse.success) {
        setCompany(companyResponse.data);
      }

      // Load contacts for this company
      const contactsResponse = await apiClient.get(`/api/crm/contacts?companyId=${companyId}`);
      if (contactsResponse.success) {
        setContacts(contactsResponse.data || []);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load data'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              {company?.name || 'Company Contacts'}
            </h1>
            <p className="text-muted-foreground">
              {contacts.length} {contacts.length === 1 ? 'contact' : 'contacts'}
            </p>
          </div>
        </div>
        <Button onClick={() => router.push(`/dashboard/crm/contacts/new?companyId=${companyId}`)}>
          Add Contact
        </Button>
      </div>

      {/* Contacts Grid */}
      {contacts.length === 0 ? (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <User className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">No contacts found</h3>
              <p className="text-sm text-muted-foreground">
                This company doesn't have any contacts yet.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contacts.map((contact) => (
            <Card
              key={contact.id}
              className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/dashboard/crm/contacts/${contact.id}`)}
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  {contact.avatarUrl ? (
                    <img
                      src={contact.avatarUrl}
                      alt={contact.fullNameEn}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-6 w-6 text-primary" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">
                    {contact.fullNameEn}
                  </h3>
                  {contact.position && (
                    <p className="text-sm text-muted-foreground truncate">
                      {contact.position}
                    </p>
                  )}
                  
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{contact.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{contact.phone}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
