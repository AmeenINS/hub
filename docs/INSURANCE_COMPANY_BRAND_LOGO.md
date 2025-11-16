# Insurance Company - Brand Name and Logo Upload Feature

## Summary

Successfully added **Brand Name** field and **Logo Upload** functionality to the Insurance Companies module.

## Changes Made

### 1. Database Schema (`src/shared/types/database.ts`)

Added new fields to `InsuranceCompany` interface:
```typescript
brandName?: string; // Brand name (e.g., "Liva" for NLGIC)
logoUrl?: string; // Already existed - company logo URL
```

### 2. Form Components

#### Create Company Form (`new/page.tsx`)
- ✅ Added `brandName` text input field
- ✅ Added `ImageUpload` component for logo upload
- ✅ Logo upload handler with success/error toasts
- ✅ Logo URL state management
- ✅ Logo sent to API on form submission

#### Edit Company Form (`[id]/edit/page.tsx`)
- ✅ Added `brandName` text input field  
- ✅ Added `ImageUpload` component for logo upload
- ✅ Logo upload handler with success/error toasts
- ✅ Logo URL loaded from existing company data
- ✅ Logo URL updated on form submission

### 3. ImageUpload Component Integration

Using the existing `ImageUpload` component with the following configuration:

```typescript
<ImageUpload
  onUploadComplete={handleLogoUpload}
  onUploadError={handleLogoError}
  currentImageUrl={logoUrl}
  entityType="insurance-company-logo"
  entityId={companyId} // Only in edit mode
  variant="card"
  shape="rounded"
  size="lg"
  disabled={loading}
  fallbackText={t('insuranceProducts.companyLogo')}
/>
```

**Features:**
- 📤 Drag & drop or click to upload
- 🖼️ Image preview
- ✅ File type validation (images only)
- 📏 File size validation (5MB max)
- 🔄 Replace existing logo
- ❌ Remove logo option
- 💾 Automatic upload to server
- 📍 Entity tracking (insurance-company-logo)

### 4. Translations (`src/shared/i18n/translations.ts`)

#### English
```typescript
brandName: 'Brand Name',
companyLogo: 'Company Logo',
uploadCompanyLogo: 'Upload company logo or brand image',
logoUploaded: 'Logo uploaded successfully',
```

#### Arabic
```typescript
brandName: 'اسم العلامة التجارية',
companyLogo: 'شعار الشركة',
uploadCompanyLogo: 'تحميل شعار الشركة أو صورة العلامة التجارية',
logoUploaded: 'تم تحميل الشعار بنجاح',
```

### 5. Form Structure

#### New/Edit Form Layout:

**1. Basic Information Card**
- Company Name (English) * Required
- Company Name (Arabic)
- **Brand Name** ← NEW
- Company Code * Required
- License Number
- Status
- Description (English)
- Description (Arabic)

**2. Company Logo Card** ← NEW SECTION
- Logo upload component
- Preview of current logo
- Replace/Remove options

**3. Contact Information Card**
- Email
- Phone (Office)
- Mobile
- WhatsApp
- Website
- Address (English/Arabic)

## Usage Examples

### Example 1: NLGIC / Liva
- **Company Name (English)**: National Life & General Insurance Company
- **Company Name (Arabic)**: شركة الحياة العامة الوطنية للتأمين
- **Brand Name**: Liva ← Now operating under this brand
- **Logo**: Upload Liva brand logo

### Example 2: Al Ahlia / RSA Oman
- **Company Name (English)**: Al Ahlia Insurance Company
- **Company Name (Arabic)**: شركة الأهلية للتأمين
- **Brand Name**: RSA Oman
- **Logo**: Upload RSA brand logo

## Features

### Brand Name Field
- Optional text field
- Stores marketing/operating brand name
- Useful when company operates under different brand
- Example: "NLGIC" operates as "Liva"

### Logo Upload
- ✅ Drag & drop support
- ✅ Click to browse
- ✅ Image preview before upload
- ✅ Automatic upload to server
- ✅ File validation (type & size)
- ✅ Replace existing logo
- ✅ Remove logo option
- ✅ Entity-specific storage
- ✅ Success/Error feedback

### Image Storage
- Uploaded to: `/data/uploads/images/insurance-company-logo/`
- File tracking in database
- Associated with company ID
- Retrievable via `fileUrl`

## Technical Details

### File Upload Process
1. User selects image (drag/drop or browse)
2. Client validates file type and size
3. Image uploaded to `/api/files/upload`
4. Server stores in `/data/uploads/images/`
5. Returns uploaded image data
6. Logo URL saved in company record

### API Integration
```typescript
// Create company
POST /api/insurance-companies
{
  nameEn: "Company Name",
  brandName: "Brand Name",  // NEW
  logoUrl: "https://.../.../logo.png",  // NEW
  ...
}

// Update company
PUT /api/insurance-companies/:id
{
  brandName: "Updated Brand",  // NEW
  logoUrl: "https://.../.../new-logo.png",  // NEW
  ...
}
```

## Files Modified

1. ✅ `src/shared/types/database.ts` - Added brandName field
2. ✅ `src/app/dashboard/insurance-companies/new/page.tsx` - Create form
3. ✅ `src/app/dashboard/insurance-companies/[id]/edit/page.tsx` - Edit form
4. ✅ `src/shared/i18n/translations.ts` - Translations (EN/AR)

## Files Created

1. ✅ `scripts/update-companies-add-brand-field.ts` - Migration script
2. ✅ `docs/INSURANCE_COMPANY_BRAND_LOGO.md` - This documentation

## Migration

Run the migration script to add brandName field to existing companies:
```bash
npx tsx scripts/update-companies-add-brand-field.ts
```

All 20 existing companies will be updated with the new field structure.

## Status

✅ **COMPLETED** - Brand name and logo upload features fully implemented and ready to use!

## Testing

To test the feature:
1. Navigate to Insurance Companies
2. Click "Add New Company" or edit existing company
3. Fill in brand name field (optional)
4. Upload company logo using drag & drop or browse
5. Save company
6. Logo and brand name should be saved successfully

## Server Location

Access the feature at:
- **Create**: http://localhost:5050/dashboard/insurance-companies/new
- **Edit**: http://localhost:5050/dashboard/insurance-companies/:id/edit

## Benefits

1. 📝 **Brand Identity**: Store marketing/operating brand names separate from legal names
2. 🖼️ **Visual Recognition**: Company logos for better UX
3. 🎨 **Professional Look**: Modern image upload component
4. 🌐 **Bilingual Support**: Full Arabic/English translations
5. ✅ **Easy to Use**: Drag & drop or click to upload
6. 🔒 **Validated**: File type and size validation
7. 💾 **Tracked**: All uploads tracked in database

