"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { 
  ArrowLeft,
  Save,
  Building2,
  Globe,
  Users,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  Loader2
} from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiClient, getErrorMessage } from "@/core/api/client";
import { toast } from "sonner";
import { usePermissionLevel } from "@/shared/hooks/use-permission-level";

const companySchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  industry: z.string().optional(),
  size: z.string().optional(),
  website: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Please enter a valid email address").optional().or(z.literal("")),
  revenue: z.number().optional().or(z.literal(undefined)),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  description: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

const industries = [
  "Technology", "Healthcare", "Finance", "Manufacturing", "Retail", "Education",
  "Real Estate", "Consulting", "Marketing", "SaaS", "E-commerce", "Non-profit",
  "Government", "Transportation", "Energy", "Media", "Entertainment", "Other"
];

const companySizes = [
  "1-10", "11-50", "51-100", "101-500", "501-1000", "1001-5000", "5000+"
];

export default function EditCompanyPage() {
  const router = useRouter();
  const params = useParams();
  const companyId = params?.id as string;
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const { canWrite, canFull, isLoading: permLoading } = usePermissionLevel('companies');

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      industry: "",
      size: "",
      website: "",
      phone: "",
      email: "",
      revenue: undefined,
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "",
      description: "",
    }
  });

  const { register, handleSubmit, setValue, formState: { errors } } = form;

  useEffect(() => {
    const loadCompany = async () => {
      try {
        setIsLoadingData(true);
        const response = await apiClient.get(`/api/crm/companies/${companyId}`);
        if (response.success && response.data) {
          const company = response.data;
          setValue("name", company.name || "");
          setValue("industry", company.industry || "");
          setValue("size", company.size || "");
          setValue("website", company.website || "");
          setValue("phone", company.phone || "");
          setValue("email", company.email || "");
          setValue("revenue", company.revenue || undefined);
          setValue("address", company.address || "");
          setValue("city", company.city || "");
          setValue("state", company.state || "");
          setValue("zipCode", company.zipCode || "");
          setValue("country", company.country || "");
          setValue("description", company.description || "");
        }
      } catch (error) {
        toast.error(getErrorMessage(error, "Failed to load company"));
        router.push("/dashboard/crm/companies");
      } finally {
        setIsLoadingData(false);
      }
    };

    if (!permLoading && canWrite) {
      loadCompany();
    }
  }, [companyId, canWrite, permLoading, setValue, router]);

  const onSubmit = async (data: CompanyFormData) => {
    setIsLoading(true);
    try {
      const response = await apiClient.put(`/api/crm/companies/${companyId}`, data);
      
      if (response.success) {
        toast.success("Company updated successfully");
        router.push("/dashboard/crm/companies");
      } else {
        toast.error(response.error || "Failed to update company");
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Failed to update company"));
    } finally {
      setIsLoading(false);
    }
  };

  if (permLoading || isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!canWrite) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">You don't have permission to edit companies</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/crm/companies">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Companies
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Company</h1>
          <p className="text-muted-foreground">
            Update company information
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5" />
                  <span>Company Information</span>
                </CardTitle>
                <CardDescription>
                  Essential company details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    placeholder="Acme Corporation"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Select onValueChange={(value) => setValue("industry", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {industries.map((industry) => (
                          <SelectItem key={industry} value={industry}>
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="size">Company Size</Label>
                    <Select onValueChange={(value) => setValue("size", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        {companySizes.map((size) => (
                          <SelectItem key={size} value={size}>
                            {size} employees
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the company..."
                    rows={3}
                    {...register("description")}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Phone className="h-5 w-5" />
                  <span>Contact Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="phone" className="flex items-center space-x-2">
                      <Phone className="h-4 w-4" />
                      <span>Phone</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+968 1234 5678"
                      {...register("phone")}
                    />
                  </div>

                  <div>
                    <Label htmlFor="email" className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="info@company.com"
                      {...register("email")}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="website" className="flex items-center space-x-2">
                    <Globe className="h-4 w-4" />
                    <span>Website</span>
                  </Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="www.company.com"
                    {...register("website")}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5" />
                  <span>Address</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="address">Street Address</Label>
                  <Input
                    id="address"
                    placeholder="123 Business Street"
                    {...register("address")}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="Muscat"
                      {...register("city")}
                    />
                  </div>

                  <div>
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      placeholder="Muscat Governorate"
                      {...register("state")}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="zipCode">Postal Code</Label>
                    <Input
                      id="zipCode"
                      placeholder="100"
                      {...register("zipCode")}
                    />
                  </div>

                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      placeholder="Oman"
                      {...register("country")}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Financial</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="revenue">Annual Revenue</Label>
                  <Input
                    id="revenue"
                    type="number"
                    placeholder="0"
                    {...register("revenue")}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col space-y-2">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard/crm/companies")}
                    disabled={isLoading}
                    className="w-full"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
