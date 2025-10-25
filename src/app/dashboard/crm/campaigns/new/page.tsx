"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  Save,
  Send,
  Calendar,
  Users,
  Mail,
  MessageSquare,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  DollarSign,
  Target,
  Settings
} from "lucide-react";
import Link from "next/link";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const campaignSchema = z.object({
  name: z.string().min(2, "Campaign name must be at least 2 characters"),
  type: z.enum(["Email", "SMS", "Social Media", "Multi-channel", "Direct Mail"]),
  description: z.string().optional(),
  startDate: z.string().min(1, "Please select start date"),
  endDate: z.string().min(1, "Please select end date"),
  budget: z.string().min(1, "Please enter budget amount"),
  audienceType: z.enum(["All Contacts", "Segmented", "Custom List"]),
  segmentCriteria: z.string().optional(),
  emailSubject: z.string().optional(),
  emailContent: z.string().optional(),
  smsContent: z.string().optional(),
  socialPlatforms: z.array(z.string()).optional(),
  socialContent: z.string().optional(),
  automatedFollowUp: z.boolean().default(false),
  trackConversions: z.boolean().default(true),
  sendTestCampaign: z.boolean().default(false),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

const campaignTypes = [
  { value: "Email", label: "Email Marketing", icon: Mail },
  { value: "SMS", label: "SMS Marketing", icon: MessageSquare },
  { value: "Social Media", label: "Social Media", icon: Facebook },
  { value: "Multi-channel", label: "Multi-channel", icon: Target },
  { value: "Direct Mail", label: "Direct Mail", icon: Send }
];

const audienceTypes = [
  "All Contacts", "Segmented", "Custom List"
];

const socialPlatforms = [
  { value: "facebook", label: "Facebook", icon: Facebook },
  { value: "twitter", label: "Twitter", icon: Twitter },
  { value: "instagram", label: "Instagram", icon: Instagram },
  { value: "linkedin", label: "LinkedIn", icon: Linkedin }
];

export default function NewCampaignPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      type: "Email",
      description: "",
      startDate: "",
      endDate: "",
      budget: "",
      audienceType: "All Contacts",
      segmentCriteria: "",
      emailSubject: "",
      emailContent: "",
      smsContent: "",
      socialPlatforms: [],
      socialContent: "",
      automatedFollowUp: false,
      trackConversions: true,
      sendTestCampaign: false
    }
  });

  const selectedType = form.watch("type");
  const selectedAudience = form.watch("audienceType");

  const onSubmit = async (data: CampaignFormData) => {
    setIsLoading(true);
    try {
      // Here you would typically send the data to your API
      console.log("Campaign data:", { ...data, socialPlatforms: selectedPlatforms });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      router.push("/dashboard/crm/campaigns");
    } catch (error) {
      console.error("Error creating campaign:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/crm/campaigns">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Campaign</h1>
          <p className="text-muted-foreground">
            Design and launch your marketing campaign
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Campaign Setup */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Campaign Details</span>
                  </CardTitle>
                  <CardDescription>
                    Basic campaign information and settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Q1 Product Launch" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select campaign type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {campaignTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center space-x-2">
                                  <type.icon className="h-4 w-4" />
                                  <span>{type.label}</span>
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
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Campaign Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your campaign objectives and key messages..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date *</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date *</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="budget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="15000" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Audience Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Target Audience</span>
                  </CardTitle>
                  <CardDescription>
                    Define who will receive your campaign
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="audienceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Audience Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select audience type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {audienceTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedAudience === "Segmented" && (
                    <FormField
                      control={form.control}
                      name="segmentCriteria"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Segment Criteria</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Define your audience segment criteria (e.g., location, age, interests, etc.)"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>

              {/* Campaign Content */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Mail className="h-5 w-5" />
                    <span>Campaign Content</span>
                  </CardTitle>
                  <CardDescription>
                    Create your campaign messages and content
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(selectedType === "Email" || selectedType === "Multi-channel") && (
                    <>
                      <FormField
                        control={form.control}
                        name="emailSubject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Subject Line</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Your compelling subject line..." 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="emailContent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Content</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Write your email content here..."
                                className="min-h-[200px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {(selectedType === "SMS" || selectedType === "Multi-channel") && (
                    <FormField
                      control={form.control}
                      name="smsContent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMS Content</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Write your SMS message (160 characters recommended)..."
                              maxLength={160}
                              {...field}
                            />
                          </FormControl>
                          <div className="text-xs text-muted-foreground">
                            {field.value?.length || 0}/160 characters
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {(selectedType === "Social Media" || selectedType === "Multi-channel") && (
                    <>
                      <div className="space-y-3">
                        <Label>Social Media Platforms</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {socialPlatforms.map((platform) => (
                            <div key={platform.value} 
                              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                selectedPlatforms.includes(platform.value) 
                                  ? 'border-primary bg-primary/10' 
                                  : 'border-border hover:bg-muted'
                              }`}
                              onClick={() => togglePlatform(platform.value)}
                            >
                              <div className="flex items-center space-x-2">
                                <platform.icon className="h-5 w-5" />
                                <span className="font-medium">{platform.label}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <FormField
                        control={form.control}
                        name="socialContent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Social Media Content</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Write your social media post content..."
                                className="min-h-[120px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Settings */}
            <div className="space-y-6">
              {/* Campaign Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5" />
                    <span>Campaign Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="trackConversions"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel className="text-base">Track Conversions</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Monitor campaign ROI and conversions
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="automatedFollowUp"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel className="text-base">Automated Follow-up</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Send automated follow-up messages
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sendTestCampaign"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel className="text-base">Send Test Campaign</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Send test before launching
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Campaign Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Campaign Preview</CardTitle>
                  <CardDescription>
                    Preview how your campaign will look
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <div className="text-sm text-muted-foreground mb-2">
                      Campaign: {form.watch("name") || "Untitled Campaign"}
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Type: {selectedType}
                    </div>
                    {form.watch("emailSubject") && (
                      <div className="text-sm">
                        <strong>Subject:</strong> {form.watch("emailSubject")}
                      </div>
                    )}
                    {form.watch("budget") && (
                      <div className="text-sm text-muted-foreground">
                        Budget: ${form.watch("budget")}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Estimated Reach</CardTitle>
                  <CardDescription>
                    Projected campaign statistics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Estimated Audience</span>
                    <span className="font-semibold">2,847</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Expected Open Rate</span>
                    <span className="font-semibold">25-35%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Expected Click Rate</span>
                    <span className="font-semibold">3-8%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Projected ROI</span>
                    <span className="font-semibold text-green-600">200-400%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/crm/campaigns">
                Cancel
              </Link>
            </Button>
            <Button type="button" variant="outline">
              Save as Draft
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Create & Launch
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}