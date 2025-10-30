import { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { ContactService, CompanyService } from "@/lib/db/crm-service";
import { ContactType } from "@/types/database";
import ContactsClient from "./contacts-client";

export const metadata: Metadata = {
  title: "Contacts - CRM",
  description: "Manage your customer contacts"
};

export default async function ContactsPage() {
  // Fetch contacts from database
  const contactService = new ContactService();
  const companyService = new CompanyService();
  
  const contacts = await contactService.getAllContacts();
  const companies = await companyService.getAllCompanies();
  
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