/**
 * Contact Form Hook
 * Custom hook for managing contact form state and submission
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactFormSchema, type ContactFormData, defaultContactFormValues } from "./contact-schema";

/**
 * Hook for managing contact form logic
 */
export function useContactForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: defaultContactFormValues,
  });

  /**
   * Handle form submission
   */
  const onSubmit = async (data: ContactFormData) => {
    setIsLoading(true);
    try {
      // Get authentication token from cookie
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth-token='))
        ?.split('=')[1];

      if (!token) {
        throw new Error('Not authenticated. Please login again.');
      }

      // Map form data to database Contact type
      const contactData = {
        type: data.status === 'Lead' ? 'LEAD' : 
              data.status === 'Customer' ? 'CUSTOMER' : 
              data.status === 'Prospect' ? 'PARTNER' : 'LEAD',
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        jobTitle: data.position,
        department: data.department,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country,
        notes: data.notes,
        tags: tags,
      };

      // Submit to API
      const response = await fetch('/api/crm/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(contactData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create contact');
      }

      // Success - redirect to contacts list
      router.push("/dashboard/crm/contacts");
      router.refresh();
    } catch (error) {
      console.error("Error creating contact:", error);
      alert(error instanceof Error ? error.message : 'Failed to create contact');
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
    setNewTag,
    onSubmit,
    addTag,
    removeTag,
  };
}
