/**
 * Contact Profile Page
 * Displays comprehensive contact information and related data
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import ContactProfileClient from './contact-profile-client';
import { ContactService, CompanyService } from '@/lib/db/crm-service';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ContactProfilePageProps {
  params: Promise<{ id: string }>;
}

function ContactProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}

export default async function ContactProfilePage({ params }: ContactProfilePageProps) {
  const { id } = await params;

  // Fetch contact data
  const contactService = new ContactService();
  const companyService = new CompanyService();

  const contact = await contactService.getContactById(id);
  if (!contact) {
    return notFound();
  }

  // Fetch company if exists
  let company = null;
  if (contact.companyId) {
    company = await companyService.getCompanyById(contact.companyId);
  }

  // Fetch all companies for potential linking
  const companies = await companyService.getAllCompanies();

  return (
    <Suspense fallback={<ContactProfileSkeleton />}>
      <ContactProfileClient
        contact={contact}
        company={company}
        companies={companies}
      />
    </Suspense>
  );
}
