/**
 * Contact Form Hook
 * Custom hook for managing contact form state and submission
 */

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactFormSchema, type ContactFormData, defaultContactFormValues } from "./contact-schema";
import { apiClient, getErrorMessage } from "@/core/api/client";
import { toast } from "sonner";

/**
 * Hook for managing contact form logic
 */
export function useContactForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>();

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: defaultContactFormValues,
  });

  // Pre-select company if companyId is in URL
  useEffect(() => {
    const companyId = searchParams.get('companyId');
    if (companyId) {
      form.setValue('companyId', companyId);
    }
  }, [searchParams, form]);

  /**
   * Handle form submission
   */
  const onSubmit = async (data: ContactFormData) => {
    setIsLoading(true);
    try {
      // Map form data to database Contact type
      const contactData = {
        type: data.type, // Already in correct format (LEAD, CUSTOMER, PARTNER, SUPPLIER)
        fullNameEn: data.fullNameEn.trim(),
        fullNameAr: data.fullNameAr?.trim() || undefined,
        email: data.email,
        phone: data.phone,
        companyId: data.companyId && data.companyId !== 'none' ? data.companyId : undefined,
        jobTitle: data.position,
        department: data.department,
        avatarUrl: avatarUrl,
        preferredContactMethod: data.preferredContactMethod,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country,
        notes: data.notes,
        tags: tags,
      };

      // Submit to API using apiClient
      const response = await apiClient.post('/api/crm/contacts', contactData);

      if (response.success) {
        toast.success(response.message || 'Contact created successfully');
        router.push("/dashboard/crm/contacts");
        router.refresh();
      }
    } catch (error) {
      console.error("Error creating contact:", error);
      toast.error(getErrorMessage(error, 'Failed to create contact'));
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Add a new tag
   */
  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag("");
    }
  };

  /**
   * Remove a tag
   */
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return {
    form,
    isLoading,
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
