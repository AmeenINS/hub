/**
 * New Contact Page
 * Clean, professional page component that orchestrates contact form
 */

"use client";

import { Button } from "@/shared/components/ui/button";
import { Form } from "@/shared/components/ui/form";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/shared/hooks/use-i18n";
import { useContactForm } from "./use-contact-form";
import { ContactAvatarUpload } from "@/features/crm/components/contact-avatar-upload";
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
    avatarUrl,
    setNewTag,
    setAvatarUrl,
    onSubmit,
    addTag,
    removeTag,
  } = useContactForm();

  const { t } = useI18n();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('crm.addNewContact')}</h1>
        <p className="text-muted-foreground">
          {t('crm.createInfo')}
        </p>
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
              <ContactAvatarUpload
                currentAvatarUrl={avatarUrl}
                contactName={form.watch("fullNameEn")}
                onAvatarChange={setAvatarUrl}
                variant="card"
              />
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
