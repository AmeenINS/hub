# Insurance Companies List - Professional Logo Display

## Overview

Updated the insurance companies list page to display company logos professionally with an enhanced visual design.

## Design Changes

### Card Layout

The company card now features:

1. **Logo Section** (Top Center)
   - 96x96px rounded container
   - Gradient background (blue to indigo)
   - Company logo displayed prominently
   - Fallback to Building icon if no logo

2. **Brand Name** (Below Logo)
   - Large, bold text (text-xl)
   - Primary color
   - Only shown if brand name exists

3. **Company Names** (Below Brand)
   - English name (bold, base size)
   - Arabic name (smaller, muted)
   - Center aligned
   - Tight line spacing

4. **Status Badge** (Below Names)
   - Centered display
   - Color-coded by status

5. **Company Details** (Bottom Section)
   - Company code
   - License number
   - Contact information (email, phone, mobile, WhatsApp)
   - Website
   - Address

## Visual Hierarchy

```
┌────────────────────────┐
│                        │
│      [LOGO IMAGE]      │ ← 96x96px, gradient bg
│                        │
│    Brand Name          │ ← Bold, primary color
│                        │
│  Company Name (EN)     │ ← Semibold
│  Company Name (AR)     │ ← Muted, smaller
│                        │
│     [Status Badge]     │ ← Active/Inactive/Suspended
│                        │
├────────────────────────┤
│                        │
│  • Code: XXX-001       │
│  • License: LIC-...    │
│  • 📧 email            │
│  • ☎️ phone            │
│  • 📱 mobile           │
│  • 💬 whatsapp         │
│  • 🌐 website          │
│                        │
│  [Edit] [Delete]       │
│                        │
└────────────────────────┘
```

## Features

### Logo Display
- **Professional Appearance**: Gradient background with shadow
- **Responsive**: Scales well on all devices
- **Optimized**: Uses Next.js Image component
- **Fallback**: Building icon for companies without logos

### Brand Emphasis
- **Prominent Display**: Brand name gets primary focus
- **Optional**: Only shown when brand name exists
- **Clear Hierarchy**: Brand → Company → Details

### Search Enhancement
- Search now includes brand name
- Users can find companies by:
  - English name
  - Arabic name
  - Brand name (NEW)
  - Company code
  - License number

## Technical Implementation

### Image Component
```tsx
<Image
  src={company.logoUrl}
  alt={company.brandName || company.nameEn}
  width={96}
  height={96}
  className="object-contain w-full h-full p-2"
/>
```

### Styling
- **Container**: `h-24 w-24 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50`
- **Logo**: `object-contain` ensures proper aspect ratio
- **Padding**: `p-2` provides breathing room
- **Shadow**: `shadow-sm` for subtle depth

### Responsive Design
- **Mobile**: Single column, full width
- **Tablet**: 2 columns (md:grid-cols-2)
- **Desktop**: 3 columns (lg:grid-cols-3)
- **Hover**: Enhanced shadow on hover

## Examples

### With Logo and Brand Name
```
┌────────────────────────┐
│                        │
│   [Liva Logo Image]    │
│                        │
│       Liva             │ ← Brand name
│                        │
│ National Life & Gen... │ ← Company name (EN)
│ شركة الحياة العامة... │ ← Company name (AR)
│                        │
│    [Active Badge]      │
│                        │
└────────────────────────┘
```

### Without Logo (Fallback)
```
┌────────────────────────┐
│                        │
│   [Building Icon]      │
│                        │
│ Dhofar Insurance Co.   │ ← Company name (EN)
│ شركة ظفار للتأمين     │ ← Company name (AR)
│                        │
│    [Active Badge]      │
│                        │
└────────────────────────┘
```

## Benefits

1. **Professional Look**: Modern, clean design
2. **Brand Recognition**: Logos make companies easily identifiable
3. **Better UX**: Visual hierarchy guides the eye
4. **Consistent**: All cards follow same layout
5. **Accessible**: Proper alt text for images
6. **Responsive**: Works on all screen sizes
7. **Fast**: Optimized images with Next.js

## Files Modified

- `src/app/dashboard/insurance-companies/page.tsx` - Main list page
  - Added Image import from Next.js
  - Updated card layout
  - Enhanced search to include brand name
  - Improved visual hierarchy

## Status

✅ **COMPLETED** - Professional logo display implemented in insurance companies list!

## Related Documentation

- `INSURANCE_COMPANY_BRAND_LOGO.md` - Brand name and logo upload feature
- `INSURANCE_COMPANIES_CONTACT_UPDATE.md` - Contact fields update
