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
import { apiClient, getErrorMessage } from "@/lib/api-client";
import { Contact } from "@/types/database";

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
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: defaultContactFormValues,
  });

  // Fetch contact data
  useEffect(() => {
    let isMounted = true;
    
    const fetchContact = async () => {
      try {
        const response = await apiClient.get<Contact>(`/api/crm/contacts/${contactId}`);
        
        // Only update state if component is still mounted
        if (isMounted && response.success && response.data) {
          const contact = response.data;
          
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
            source: "Website", // Default value
            preferredContactMethod: contact.preferredContactMethod || "Phone",
            address: contact.address || "",
            city: contact.city || "",
            state: contact.state || "",
            zipCode: contact.zipCode || "",
            country: contact.country || "",
            notes: contact.notes || "",
            tags: contact.tags || [],
          });

          // Set avatar URL
          if (contact.avatarUrl) {
            setAvatarUrl(contact.avatarUrl);
          }

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
            description: getErrorMessage(error, t('crm.failedToLoad')),
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
      const contactData = {
        fullNameEn: data.fullNameEn.trim(),
        fullNameAr: data.fullNameAr?.trim() || undefined,
        email: data.email || undefined,
        phone: data.phone,
        companyId: data.company || undefined,
        jobTitle: data.position || undefined,
        department: data.department || undefined,
        avatarUrl: avatarUrl,
        type: data.type,
        preferredContactMethod: data.preferredContactMethod || undefined,
        address: data.address || undefined,
        city: data.city || undefined,
        state: data.state || undefined,
        zipCode: data.zipCode || undefined,
        country: data.country || undefined,
        notes: data.notes || undefined,
        tags: tags,
      };

      const response = await apiClient.put(`/api/crm/contacts/${contactId}`, contactData);

      if (response.success) {
        toast({
          title: t('messages.success'),
          description: response.message || t('crm.contactUpdated'),
        });

        router.push("/dashboard/crm/contacts");
      }
    } catch (error) {
      console.error("Error updating contact:", error);
      toast({
        title: t('common.error'),
        description: getErrorMessage(error, t('crm.failedToUpdate')),
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
    avatarUrl,
    setNewTag,
    setAvatarUrl,
    onSubmit,
    addTag,
    removeTag,
  };
}
