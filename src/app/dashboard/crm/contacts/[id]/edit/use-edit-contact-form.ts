/**
 * Edit Contact Form Hook
 * Custom hook for managing edit contact form state and logic with i18n
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/i18n-context";
import { contactFormSchema, ContactFormData, defaultContactFormValues } from "../../new/contact-schema";

interface UseEditContactFormProps {
  contactId: string;
}

export function useEditContactForm({ contactId }: UseEditContactFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: defaultContactFormValues,
  });

  // Fetch contact data
  useEffect(() => {
    let isMounted = true;
    
    const fetchContact = async () => {
      try {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('auth-token='))
          ?.split('=')[1];

        if (!token) {
          toast({
            title: t('common.error'),
            description: t('crm.unauthorized'),
            variant: "destructive",
          });
          router.push("/login");
          return;
        }

        const response = await fetch(`/api/crm/contacts/${contactId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch contact');
        }

        const result = await response.json();
        
        // Only update state if component is still mounted
        if (isMounted && result.success && result.data) {
          const contact = result.data;
          
          // Set form values
          const fallbackFullName = [contact.firstName, contact.lastName].filter(Boolean).join(' ').trim();
          form.reset({
            fullNameEn: contact.fullNameEn || fallbackFullName || "",
            fullNameAr: contact.fullNameAr || "",
            email: contact.email || "",
            phone: contact.phone || "",
            company: contact.companyId || "",
            position: contact.jobTitle || "",
            department: contact.department || "",
            type: contact.type || "LEAD",
            source: contact.source || "Website",
            preferredContactMethod: contact.preferredContactMethod || "Phone",
            address: contact.address || "",
            city: contact.city || "",
            state: contact.state || "",
            zipCode: contact.postalCode || "",
            country: contact.country || "",
            notes: contact.notes || "",
            tags: contact.tags || [],
          });

          // Set tags
          if (contact.tags && Array.isArray(contact.tags)) {
            setTags(contact.tags);
          }
        }
      } catch (error) {
        console.error("Error fetching contact:", error);
        if (isMounted) {
          toast({
            title: t('common.error'),
            description: t('crm.failedToLoad'),
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          setIsFetching(false);
        }
      }
    };

    fetchContact();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId]);

  const onSubmit = async (data: ContactFormData) => {
    setIsLoading(true);
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1];

      if (!token) {
        toast({
          title: t('common.error'),
          description: t('crm.unauthorized'),
          variant: "destructive",
        });
        router.push("/login");
        return;
      }

      const contactData = {
        fullNameEn: data.fullNameEn.trim(),
        fullNameAr: data.fullNameAr?.trim() || undefined,
        email: data.email || undefined,
        phone: data.phone,
        companyId: data.company || undefined,
        jobTitle: data.position || undefined,
        department: data.department || undefined,
        type: data.type,
        source: data.source,
        preferredContactMethod: data.preferredContactMethod || undefined,
        address: data.address || undefined,
        city: data.city || undefined,
        state: data.state || undefined,
        postalCode: data.zipCode || undefined,
        country: data.country || undefined,
        notes: data.notes || undefined,
        tags: tags,
      };

      const response = await fetch(`/api/crm/contacts/${contactId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(contactData),
      });

      if (!response.ok) {
        throw new Error('Failed to update contact');
      }

      toast({
        title: t('messages.success'),
        description: t('crm.contactUpdated'),
      });

      router.push("/dashboard/crm/contacts");
    } catch (error) {
      console.error("Error updating contact:", error);
      toast({
        title: t('common.error'),
        description: t('crm.failedToUpdate'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return {
    form,
    isLoading,
    isFetching,
    tags,
    newTag,
    setNewTag,
    onSubmit,
    addTag,
    removeTag,
  };
}
