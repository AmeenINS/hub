'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { FileUpload, UploadedFile } from '@/shared/components/ui/file-upload';
import { ImageUpload, UploadedImage } from '@/shared/components/ui/image-upload';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, FileIcon, Image as ImageIcon, Users, Briefcase } from 'lucide-react';

export default function FileUploadDemoPage() {
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [contactImage, setContactImage] = useState<string>('');

  const handleFileUpload = (file: UploadedFile) => {
    toast.success('File uploaded successfully!', {
      description: `${file.originalName} (${formatFileSize(file.size)})`,
      icon: <CheckCircle2 className="h-4 w-4 text-green-500" />
    });
  };

  const handleFileError = (error: string) => {
    toast.error('Upload failed', {
      description: error,
      icon: <XCircle className="h-4 w-4 text-red-500" />
    });
  };

  const handleAvatarUpload = (image: UploadedImage) => {
    setAvatarUrl(image.fileUrl);
    toast.success('Avatar updated!', {
      icon: <CheckCircle2 className="h-4 w-4 text-green-500" />
    });
  };

  const handleContactImageUpload = (image: UploadedImage) => {
    setContactImage(image.fileUrl);
    toast.success('Contact image uploaded!', {
      icon: <CheckCircle2 className="h-4 w-4 text-green-500" />
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">File Upload System</h1>
          <p className="text-muted-foreground mt-2">
            Professional file upload components for any use case
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Any File Type</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload images, documents, videos, and more
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ImageIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Image Preview</h3>
                  <p className="text-sm text-muted-foreground">
                    Live preview for images with drag & drop
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Reusable</h3>
                  <p className="text-sm text-muted-foreground">
                    Use in profiles, contacts, tasks, anywhere
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Examples */}
        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General Files</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="avatar">Avatar</TabsTrigger>
            <TabsTrigger value="examples">Use Cases</TabsTrigger>
          </TabsList>

          {/* General File Upload */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>General File Upload</CardTitle>
                <CardDescription>
                  Upload any type of file (images, documents, videos, etc.)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload
                  onUploadComplete={handleFileUpload}
                  onUploadError={handleFileError}
                  multiple={true}
                  maxSize={10 * 1024 * 1024} // 10MB
                  showPreview={true}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Restricted File Upload</CardTitle>
                <CardDescription>
                  Only PDF and document files allowed (5MB max)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload
                  onUploadComplete={handleFileUpload}
                  onUploadError={handleFileError}
                  allowedTypes={[
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                  ]}
                  accept=".pdf,.doc,.docx"
                  maxSize={5 * 1024 * 1024}
                  showPreview={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Image Upload */}
          <TabsContent value="images" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Card Style Image</CardTitle>
                  <CardDescription>
                    Full-width image upload with preview
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ImageUpload
                    onUploadComplete={handleFileUpload}
                    onUploadError={handleFileError}
                    variant="card"
                    maxSize={5 * 1024 * 1024}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Square Image</CardTitle>
                  <CardDescription>
                    Perfect for product images or thumbnails
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ImageUpload
                    onUploadComplete={handleFileUpload}
                    onUploadError={handleFileError}
                    variant="card"
                    shape="square"
                    maxSize={5 * 1024 * 1024}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Avatar Upload */}
          <TabsContent value="avatar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Avatar Upload</CardTitle>
                <CardDescription>
                  Different sizes for user avatars
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-end gap-8">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Small</p>
                    <ImageUpload
                      onUploadComplete={handleAvatarUpload}
                      onUploadError={handleFileError}
                      variant="avatar"
                      size="sm"
                      shape="circle"
                      currentImageUrl={avatarUrl}
                      entityType="user"
                      entityId="demo-user-1"
                      fallbackText="SM"
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Medium</p>
                    <ImageUpload
                      onUploadComplete={handleAvatarUpload}
                      onUploadError={handleFileError}
                      variant="avatar"
                      size="md"
                      shape="circle"
                      currentImageUrl={avatarUrl}
                      entityType="user"
                      entityId="demo-user-2"
                      fallbackText="MD"
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Large</p>
                    <ImageUpload
                      onUploadComplete={handleAvatarUpload}
                      onUploadError={handleFileError}
                      variant="avatar"
                      size="lg"
                      shape="circle"
                      currentImageUrl={avatarUrl}
                      entityType="user"
                      entityId="demo-user-3"
                      fallbackText="LG"
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Extra Large</p>
                    <ImageUpload
                      onUploadComplete={handleAvatarUpload}
                      onUploadError={handleFileError}
                      variant="avatar"
                      size="xl"
                      shape="circle"
                      currentImageUrl={avatarUrl}
                      entityType="user"
                      entityId="demo-user-4"
                      fallbackText="XL"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Square Avatars</CardTitle>
                <CardDescription>
                  For company logos or brand icons
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-end gap-8">
                  <ImageUpload
                    onUploadComplete={handleFileUpload}
                    onUploadError={handleFileError}
                    variant="avatar"
                    size="md"
                    shape="square"
                    fallbackText="CO"
                  />

                  <ImageUpload
                    onUploadComplete={handleFileUpload}
                    onUploadError={handleFileError}
                    variant="avatar"
                    size="lg"
                    shape="square"
                    fallbackText="BR"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Use Cases */}
          <TabsContent value="examples" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Real-World Use Cases</CardTitle>
                <CardDescription>
                  See how to use these components in your application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* User Profile */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">User Profile Picture</h3>
                  </div>
                  <div className="flex items-start gap-4 p-4 border rounded-lg">
                    <ImageUpload
                      onUploadComplete={(img) => {
                        toast.success('Profile picture updated!');
                      }}
                      onUploadError={handleFileError}
                      variant="avatar"
                      size="lg"
                      shape="circle"
                      entityType="user"
                      entityId="user-123"
                      fallbackText="JD"
                    />
                    <div>
                      <p className="font-medium">John Doe</p>
                      <p className="text-sm text-muted-foreground">john.doe@example.com</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Click the avatar to upload a new profile picture
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Image */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">CRM Contact Image</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center gap-3">
                        <ImageUpload
                          onUploadComplete={handleContactImageUpload}
                          onUploadError={handleFileError}
                          variant="avatar"
                          size="md"
                          shape="circle"
                          entityType="contact"
                          entityId="contact-456"
                          currentImageUrl={contactImage}
                        />
                        <div>
                          <p className="font-medium">Alice Smith</p>
                          <Badge variant="outline">Lead</Badge>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg space-y-3">
                      <p className="text-sm font-medium">Contact Details</p>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <p>Email: alice@company.com</p>
                        <p>Phone: +1 234 567 8900</p>
                        <p>Company: Tech Corp</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Task Attachments */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileIcon className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Task Attachments</h3>
                  </div>
                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="space-y-2">
                      <p className="font-medium">Project Proposal Review</p>
                      <p className="text-sm text-muted-foreground">
                        Attach documents, images, or any files related to this task
                      </p>
                    </div>
                    <FileUpload
                      onUploadComplete={handleFileUpload}
                      onUploadError={handleFileError}
                      entityType="task"
                      entityId="task-789"
                      multiple={true}
                      maxSize={10 * 1024 * 1024}
                      showPreview={true}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Code Examples */}
            <Card>
              <CardHeader>
                <CardTitle>Code Examples</CardTitle>
                <CardDescription>
                  How to use these components in your code
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Avatar Upload:</p>
                  <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto">
{`<ImageUpload
  variant="avatar"
  size="lg"
  shape="circle"
  entityType="user"
  entityId="user-123"
  onUploadComplete={(image) => {
    console.log('Uploaded:', image.fileUrl);
  }}
/>`}
                  </pre>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">General File Upload:</p>
                  <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto">
{`<FileUpload
  entityType="task"
  entityId="task-456"
  multiple={true}
  maxSize={10 * 1024 * 1024}
  onUploadComplete={(file) => {
    console.log('File uploaded:', file);
  }}
/>`}
                  </pre>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Restricted Types:</p>
                  <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto">
{`<FileUpload
  allowedTypes={['application/pdf', 'image/*']}
  accept=".pdf,.png,.jpg"
  maxSize={5 * 1024 * 1024}
  onUploadComplete={(file) => {
    console.log('Document uploaded');
  }}
/>`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
