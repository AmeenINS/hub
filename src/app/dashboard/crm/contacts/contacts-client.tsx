"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal,
  Mail,
  Phone,
  Building2,
  Edit,
  Trash2,
  User
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Contact, ContactType } from "@/types/database";
import { useToast } from "@/hooks/use-toast";
import Cookies from "js-cookie";

interface ContactsClientProps {
  initialContacts: Contact[];
  companyMap: Record<string, string>;
}

const getStatusBadgeVariant = (type: ContactType) => {
  switch (type) {
    case ContactType.CUSTOMER:
      return "default";
    case ContactType.LEAD:
      return "destructive";
    case ContactType.PARTNER:
      return "secondary";
    case ContactType.SUPPLIER:
      return "outline";
    default:
      return "outline";
  }
};

const getStatusLabel = (type: ContactType) => {
  switch (type) {
    case ContactType.CUSTOMER:
      return "Customer";
    case ContactType.LEAD:
      return "Lead";
    case ContactType.PARTNER:
      return "Partner";
    case ContactType.SUPPLIER:
      return "Supplier";
    default:
      return type;
  }
};

export default function ContactsClient({ initialContacts, companyMap }: ContactsClientProps) {
  const [contacts, setContacts] = useState(initialContacts);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // Filter contacts based on search
  const filteredContacts = contacts.filter(contact => {
    const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
    const email = contact.email?.toLowerCase() || "";
    const phone = contact.phone || "";
    const company = contact.companyId ? companyMap[contact.companyId]?.toLowerCase() || "" : "";
    const query = searchQuery.toLowerCase();

    return fullName.includes(query) || 
           email.includes(query) || 
           phone.includes(query) || 
           company.includes(query);
  });

  const handleDelete = async (contactId: string) => {
    try {
      const token = Cookies.get('auth-token');
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication required",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`/api/crm/contacts/${contactId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setContacts(contacts.filter(c => c.id !== contactId));
        toast({
          title: "Success",
          description: "Contact deleted successfully",
        });
      } else {
        throw new Error('Failed to delete contact');
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete contact",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground">
            Manage and organize your customer contacts
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/crm/contacts/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Link>
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search contacts..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contacts List */}
      <Card>
        <CardHeader>
          <CardTitle>All Contacts ({filteredContacts.length})</CardTitle>
          <CardDescription>
            Your complete contact database
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredContacts.length === 0 ? (
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No contacts found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "Try adjusting your search query" : "Get started by creating your first contact"}
              </p>
              {!searchQuery && (
                <Button asChild>
                  <Link href="/dashboard/crm/contacts/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Contact
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredContacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarFallback>
                        {contact.firstName[0]}{contact.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{contact.firstName} {contact.lastName}</h3>
                        <Badge variant={getStatusBadgeVariant(contact.type)}>
                          {getStatusLabel(contact.type)}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        {contact.email && (
                          <div className="flex items-center space-x-1">
                            <Mail className="h-3 w-3" />
                            <span>{contact.email}</span>
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center space-x-1">
                            <Phone className="h-3 w-3" />
                            <span>{contact.phone}</span>
                          </div>
                        )}
                        {contact.companyId && companyMap[contact.companyId] && (
                          <div className="flex items-center space-x-1">
                            <Building2 className="h-3 w-3" />
                            <span>{companyMap[contact.companyId]}</span>
                          </div>
                        )}
                      </div>
                      {contact.jobTitle && (
                        <div className="text-sm text-muted-foreground">
                          {contact.jobTitle}
                          {contact.department && ` • ${contact.department}`}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {contact.email && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={`mailto:${contact.email}`} title={`Email ${contact.firstName}`}>
                          <Mail className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {contact.phone && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={`tel:${contact.phone}`} title={`Call ${contact.firstName}`}>
                          <Phone className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/crm/contacts/${contact.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Contact
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/crm/contacts/${contact.id}`}>
                            View Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDelete(contact.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Contact
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
