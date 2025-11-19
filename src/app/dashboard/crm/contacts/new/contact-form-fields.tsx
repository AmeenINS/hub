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
import { useI18n } from "@/shared/i18n/i18n-context";
import { useState, useEffect } from "react";

interface BasicInformationSectionProps {
  form: UseFormReturn<ContactFormData>;
}

/**
 * Basic Information Section (Name, Email, Phone)
 */
export function BasicInformationSection({ form }: BasicInformationSectionProps) {
  const { t } = useI18n();
  const [countryCode, setCountryCode] = useState("+968");
  const [phoneNumber, setPhoneNumber] = useState("");

  // Parse existing phone value on mount or when it changes
  useEffect(() => {
    const fullPhone = form.watch("phone");
    if (fullPhone) {
      // Extract country code and number from full phone
      const match = fullPhone.match(/^(\+\d+)\s?(.*)$/);
      if (match) {
        setCountryCode(match[1]);
        setPhoneNumber(match[2].trim());
      } else {
        setPhoneNumber(fullPhone);
      }
    }
  }, []);

  // Update form value when country code or phone number changes
  const handlePhoneChange = (code: string, number: string) => {
    const fullPhone = number ? `${code} ${number}` : "";
    form.setValue("phone", fullPhone);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="h-5 w-5" />
          <span>{t('crm.basicInformation')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="fullNameEn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('crm.fullNameEn')} *</FormLabel>
                <FormControl>
                  <Input placeholder={t('crm.fullNameEnPlaceholder')} {...field} />
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
                <FormLabel>{t('crm.fullNameAr')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('crm.fullNameArPlaceholder')} {...field} />
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
              <FormLabel>{t('crm.email')}</FormLabel>
              <FormControl>
                <Input type="email" placeholder={t('crm.emailPlaceholder')} {...field} />
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
              <FormLabel>{t('crm.phoneNumber')} *</FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <Input
                    className="w-24"
                    value={countryCode}
                    onChange={(e) => {
                      setCountryCode(e.target.value);
                      handlePhoneChange(e.target.value, phoneNumber);
                    }}
                    placeholder="+968"
                  />
                  <Input
                    className="flex-1"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      handlePhoneChange(countryCode, e.target.value);
                    }}
                    placeholder={t('crm.phoneNumberPlaceholder')}
                  />
                </div>
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
  const { t } = useI18n();
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);

  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setIsLoadingCompanies(true);
        const response = await fetch('/api/crm/companies');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setCompanies(data.data.map((c: any) => ({ id: c.id, name: c.name })));
          }
        }
      } catch (error) {
        console.error('Failed to load companies:', error);
      } finally {
        setIsLoadingCompanies(false);
      }
    };
    loadCompanies();
  }, []);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Building2 className="h-5 w-5" />
          <span>{t('crm.companyInformation')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="companyId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('crm.company')}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value || "none"}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingCompanies ? "Loading..." : t('crm.selectCompany')} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">
                    {t('crm.noCompany')}
                  </SelectItem>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                <FormLabel>{t('crm.jobTitle')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('crm.jobTitlePlaceholder')} {...field} />
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
                <FormLabel>{t('crm.department')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('crm.departmentPlaceholder')} {...field} />
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
  const { t } = useI18n();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-5 w-5" />
          <span>{t('crm.addressInformation')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('crm.address')}</FormLabel>
              <FormControl>
                <Input placeholder={t('crm.addressPlaceholder')} {...field} />
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
                <FormLabel>{t('crm.city')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('crm.cityPlaceholder')} {...field} />
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
                <FormLabel>{t('crm.state')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('crm.statePlaceholder')} {...field} />
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
                <FormLabel>{t('crm.zip')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('crm.zipPlaceholder')} {...field} />
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
                <FormLabel>{t('crm.country')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('crm.countryPlaceholder')} {...field} />
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
  const { t } = useI18n();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TagIcon className="h-5 w-5" />
          <span>{t('crm.statusClassification')}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('crm.type')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('crm.selectType')} />
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
              <FormLabel>{t('crm.source')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('crm.selectSource')} />
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
              <FormLabel>{t('crm.preferredContactMethod')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={t('crm.selectMethod')} />
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
  const { t } = useI18n();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('crm.tags')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Input
            placeholder={t('crm.addTag')}
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), onAddTag())}
          />
          <Button type="button" onClick={onAddTag} size="sm">
            {t('common.add')}
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
  const { t } = useI18n();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('crm.notes')}</CardTitle>
      </CardHeader>
      <CardContent>
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder={t('crm.notesPlaceholder')}
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
