/**
 * New Contact Page
 * Clean, professional page component that orchestrates contact form
 */

"use client";

import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useContactForm } from "./use-contact-form";
import {
  BasicInformationSection,
  CompanyInformationSection,
  AddressInformationSection,
  StatusClassificationSection,
  TagsSection,
  NotesSection,
} from "./contact-form-fields";

/**
 * New Contact Page Component
 * Professional, modular contact creation form
 */
export default function NewContactPage() {
  const {
    form,
    isLoading,
    tags,
    newTag,
    setNewTag,
    onSubmit,
    addTag,
    removeTag,
  } = useContactForm();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Contact</h1>
          <p className="text-muted-foreground">
            Create a new contact in your CRM system
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/crm/contacts">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Contacts
          </Link>
        </Button>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Information */}
            <div className="lg:col-span-2 space-y-6">
              <BasicInformationSection form={form} />
              <CompanyInformationSection form={form} />
              <AddressInformationSection form={form} />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <StatusClassificationSection form={form} />
              <TagsSection
                tags={tags}
                newTag={newTag}
                setNewTag={setNewTag}
                onAddTag={addTag}
                onRemoveTag={removeTag}
              />
              <NotesSection form={form} />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/crm/contacts">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Contact
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
