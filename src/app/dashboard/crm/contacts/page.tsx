'use client';

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { ContactType, Contact } from "@/shared/types/database";
import { apiClient, getErrorMessage } from "@/core/api/client";
import { usePermissionLevel } from "@/shared/hooks/use-permission-level";
import { useI18n } from "@/shared/i18n/i18n-context";
import { Loader2 } from "lucide-react";
import ContactsClient from "./contacts-client";

export default function ContactsPage() {
  const { t } = useI18n();
  const { canView, isLoading: permissionsLoading } = usePermissionLevel('crm_contacts');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data function
  const fetchData = async () => {
    try {
      setLoading(true);
      const [contactsResponse, companiesResponse] = await Promise.all([
        apiClient.get('/api/crm/contacts'),
        apiClient.get('/api/crm/companies')
      ]);

      if (contactsResponse.success) {
        setContacts(contactsResponse.data || []);
      }
      if (companiesResponse.success) {
        setCompanies(companiesResponse.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) {
      fetchData();
    }
  }, [canView]);

  // Check permissions first
  if (permissionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium">{t('accessDenied.title')}</h3>
          <p className="text-muted-foreground">{t('accessDenied.description')}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Create a map of company IDs to company names
  const companyMap = new Map(companies.map(c => [c.id, c.name]));
  
  // Calculate stats
  const stats = {
    total: contacts.length,
    customers: contacts.filter(c => c.type === ContactType.CUSTOMER).length,
    leads: contacts.filter(c => c.type === ContactType.LEAD).length,
    partners: contacts.filter(c => c.type === ContactType.PARTNER).length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Contacts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.customers}</div>
            <p className="text-xs text-muted-foreground">Active Customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.leads}</div>
            <p className="text-xs text-muted-foreground">New Leads</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.partners}</div>
            <p className="text-xs text-muted-foreground">Partners</p>
          </CardContent>
        </Card>
      </div>

      {/* Client Component for Interactive UI */}
      <ContactsClient initialContacts={contacts} companyMap={Object.fromEntries(companyMap)} />
    </div>
  );
}