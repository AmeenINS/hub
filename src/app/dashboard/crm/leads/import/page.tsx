/**
 * Import Leads Page
 * Bulk import leads from CSV or Excel files
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { ArrowLeft, Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useI18n } from '@/shared/i18n/i18n-context';
import { toast } from 'sonner';

export default function LeadsImportPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [isImporting, setIsImporting] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file type
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];
      
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv')) {
        toast.error('Please select a CSV or Excel file');
        return;
      }
      
      setFile(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    try {
      setIsImporting(true);
      
      const formData = new FormData();
      formData.append('file', file);

      // TODO: Implement the import API endpoint
      // const response = await apiClient.post('/api/crm/leads/import', formData);
      
      // For now, just show a success message
      toast.success('Import functionality will be available soon');
      
      // Redirect back to leads page
      setTimeout(() => {
        router.push('/dashboard/crm/leads');
      }, 2000);
    } catch (error) {
      toast.error('Failed to import leads');
      console.error('Import error:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    // Create a sample CSV template
    const headers = [
      'Full Name (English)',
      'Full Name (Arabic)',
      'Email',
      'Phone',
      'Company',
      'Position',
      'Source',
      'Status',
      'Notes',
    ];
    
    const sampleRow = [
      'John Doe',
      'جون دو',
      'john@example.com',
      '+96812345678',
      'Acme Corp',
      'Sales Manager',
      'Website',
      'NEW',
      'Interested in our products',
    ];
    
    const csv = [headers.join(','), sampleRow.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Template downloaded');
  };

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Import Leads</h1>
          <p className="text-muted-foreground">
            Import multiple leads from a CSV or Excel file
          </p>
        </div>
      </div>

      {/* Instructions Card */}
      <Card className="p-6 space-y-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
          <div className="space-y-2">
            <h3 className="font-semibold">Before you import</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Download the CSV template to see the required format</li>
              <li>Ensure all required fields are filled (Name, Email, Phone)</li>
              <li>Phone numbers should be in format: +968XXXXXXXX</li>
              <li>Email addresses must be valid</li>
              <li>The system will skip duplicate entries</li>
            </ul>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={downloadTemplate}
          className="w-full sm:w-auto"
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Download Template
        </Button>
      </Card>

      {/* Upload Card */}
      <Card className="p-6 space-y-6">
        <div className="space-y-2">
          <h3 className="font-semibold">Upload File</h3>
          <p className="text-sm text-muted-foreground">
            Select a CSV or Excel file containing your leads data
          </p>
        </div>

        {/* File Input */}
        <div className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
          <input
            type="file"
            id="file-upload"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center gap-4"
          >
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">
                {file ? file.name : 'Choose a file or drag it here'}
              </p>
              <p className="text-sm text-muted-foreground">
                CSV, XLSX, or XLS files up to 10MB
              </p>
            </div>
          </label>
        </div>

        {/* Selected File Info */}
        {file && (
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div className="flex-1">
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFile(null)}
            >
              Remove
            </Button>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleImport}
            disabled={!file || isImporting}
            className="flex-1"
          >
            {isImporting ? 'Importing...' : 'Import Leads'}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={isImporting}
          >
            Cancel
          </Button>
        </div>
      </Card>

      {/* Expected Format Card */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Expected CSV Format</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-2 text-left">Full Name (EN)</th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">Phone</th>
                <th className="p-2 text-left">Company</th>
                <th className="p-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t">
                <td className="p-2">John Doe</td>
                <td className="p-2">john@example.com</td>
                <td className="p-2">+96812345678</td>
                <td className="p-2">Acme Corp</td>
                <td className="p-2">NEW</td>
              </tr>
              <tr className="border-t text-muted-foreground">
                <td className="p-2">Jane Smith</td>
                <td className="p-2">jane@example.com</td>
                <td className="p-2">+96887654321</td>
                <td className="p-2">Tech Inc</td>
                <td className="p-2">CONTACTED</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
