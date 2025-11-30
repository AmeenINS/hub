/**
 * Edit Contact Page
 * Professional contact editing page with i18n support
 */

"use client";

import { Button } from "@/shared/components/ui/button";
import { Form } from "@/shared/components/ui/form";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useI18n } from "@/shared/i18n/i18n-context";
import { useEditContactForm } from "./use-edit-contact-form";
import { ContactAvatarUpload } from "@/features/crm/components/contact-avatar-upload";
import {
  BasicInformationSection,
  CompanyInformationSection,
  AddressInformationSection,
  StatusClassificationSection,
  TagsSection,
  NotesSection,
} from "../../new/contact-form-fields";
import { Card, CardContent } from "@/shared/components/ui/card";

/**
 * Edit Contact Page Component
 * Professional, modular contact editing form with i18n
 */
export default function EditContactPage() {
  const { t } = useI18n();
  const params = useParams();
  const contactId = params.id as string;

  const {
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
  } = useEditContactForm({ contactId });

  // Loading state
  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-lg">
                  {t('crm.loading')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t('crm.pleaseWait')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">
          {t('crm.editContact')}
        </h1>
        <p className="text-muted-foreground">
          {t('crm.updateInfo')}
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Information - 2 columns on large screens */}
            <div className="lg:col-span-2 space-y-6">
              <BasicInformationSection form={form} />
              <CompanyInformationSection form={form} />
              <AddressInformationSection form={form} />
            </div>

            {/* Sidebar - 1 column on large screens */}
            <div className="space-y-6">
              <ContactAvatarUpload
                contactId={contactId}
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
          <div className="flex items-center justify-end space-x-4 space-x-reverse">
            <Button type="button" variant="outline" asChild disabled={isLoading}>
              <Link href="/dashboard/crm/contacts">
                {t('common.cancel')}
              </Link>
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('crm.updating')}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {t('crm.saveChanges')}
                </>
              )}
            </Button>
          </div>

          {/* Help Text */}
          <div className="rounded-lg bg-muted/50 p-4">
            <p className="text-sm text-muted-foreground">
              <strong>{t('common.note')}:</strong> {t('crm.requiredFields')}
            </p>
          </div>
        </form>
      </Form>
    </div>
  );
}
