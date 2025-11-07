/**
 * Contact Form Fields Components
 * Reusable form field components for contact forms
 */

import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/shared/components/ui/form";
import { User, Building2, MapPin, Tag as TagIcon } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { ContactFormData, typeOptions, sourceOptions, preferredContactMethodOptions } from "./contact-schema";

interface BasicInformationSectionProps {
  form: UseFormReturn<ContactFormData>;
}

/**
 * Basic Information Section (Name, Email, Phone)
 */
export function BasicInformationSection({ form }: BasicInformationSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="h-5 w-5" />
          <span>Basic Information</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="fullNameEn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name (English) *</FormLabel>
                <FormControl>
                  <Input placeholder="Ahmed Al Amri" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fullNameAr"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name (Arabic)</FormLabel>
                <FormControl>
                  <Input placeholder="أحمد العامري" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="ahmed.alamri@company.om" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number *</FormLabel>
              <FormControl>
                <Input placeholder="+968 9123 4567" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}

interface CompanyInformationSectionProps {
  form: UseFormReturn<ContactFormData>;
}

/**
 * Company Information Section (Company, Position, Department)
 */
export function CompanyInformationSection({ form }: CompanyInformationSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Building2 className="h-5 w-5" />
          <span>Company Information</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Company Name</FormLabel>
              <FormControl>
                <Input placeholder="شركة عمان للاتصالات" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="position"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Title</FormLabel>
                <FormControl>
                  <Input placeholder="مدير المبيعات" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <FormControl>
                  <Input placeholder="المبيعات" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}

interface AddressInformationSectionProps {
  form: UseFormReturn<ContactFormData>;
}

/**
 * Address Information Section
 */
export function AddressInformationSection({ form }: AddressInformationSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-5 w-5" />
          <span>Address Information</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Street Address</FormLabel>
              <FormControl>
                <Input placeholder="شارع السلطان قابوس، مسقط" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="Muscat" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="state"
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl>
                  <Input placeholder="Muscat Governorate" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="zipCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ZIP Code</FormLabel>
                <FormControl>
                  <Input placeholder="100" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input placeholder="Oman" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}

interface StatusClassificationSectionProps {
  form: UseFormReturn<ContactFormData>;
}

/**
 * Status & Classification Section
 */
export function StatusClassificationSection({ form }: StatusClassificationSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TagIcon className="h-5 w-5" />
          <span>Status & Classification</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {typeOptions.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center space-x-2">
                        <Badge variant={type.color as "default" | "destructive" | "secondary" | "outline"} className="text-xs">
                          {type.label}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="source"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lead Source</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {sourceOptions.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="preferredContactMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Contact Method</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {preferredContactMethodOptions.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}

interface TagsSectionProps {
  tags: string[];
  newTag: string;
  setNewTag: (value: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
}

/**
 * Tags Section
 */
export function TagsSection({ tags, newTag, setNewTag, onAddTag, onRemoveTag }: TagsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tags</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Input
            placeholder="Add a tag"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), onAddTag())}
          />
          <Button type="button" onClick={onAddTag} size="sm">
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => onRemoveTag(tag)}
            >
              {tag} ×
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface NotesSectionProps {
  form: UseFormReturn<ContactFormData>;
}

/**
 * Notes Section
 */
export function NotesSection({ form }: NotesSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
      </CardHeader>
      <CardContent>
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder="Add any additional notes about this contact..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
