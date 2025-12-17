# Revised Security Enhancement Plan (Without Authentication)

## Overview

This revised plan addresses security vulnerabilities **without implementing authentication**, as you'll be integrating a centralized auth system across microservices later. We'll focus on:

1. **Database Integration** - Replace in-memory storage with PostgreSQL
2. **File Upload Security** - Validate and secure file uploads
3. **API Key Migration** - Move Pexels API to server-side
4. **Input Validation & XSS** - Sanitize inputs and prevent XSS
5. **Security Headers** - Add protective HTTP headers

**Timeline:** 2-3 weeks  
**Phases:** 5 (can be done incrementally)

---

## User Decisions Confirmed

✅ **Authentication:** Deferred (will implement centralized auth later)  
✅ **Database:** PostgreSQL (user has existing instance)  
✅ **Microservices:** Planning to connect multiple projects under single auth

---

## Phase 1: Database Integration (Week 1)

### Objective
Replace in-memory storage with PostgreSQL for data persistence.

---

### 1.1 Install Dependencies

```bash
npm install prisma @prisma/client
npm install --save-dev @types/node
```

---

### 1.2 Initialize Prisma

**Create:** `prisma/schema.prisma`

```prisma
// Prisma schema for Cardify

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Design storage (replaces in-memory storage)
model Design {
  id        String   @id @default(cuid())
  data      Json     // Stores the entire design JSON
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([createdAt])
}

// Uploaded files tracking
model UploadedFile {
  id           String   @id @default(cuid())
  filename     String
  originalName String
  mimeType     String
  size         Int
  path         String   // URL path to the file
  createdAt    DateTime @default(now())
  
  @@index([createdAt])
}

// Template exports
model Template {
  id        String   @id
  filename  String
  path      String
  metadata  Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([createdAt])
}
```

**Note:** No `userId` fields since we're not implementing auth yet. When you add centralized auth later, you can add a migration to include user relationships.

---

### 1.3 Create Prisma Client Utility

**Create:** `lib/prisma.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

**Why this pattern?**
- Prevents multiple Prisma instances in development (hot reload)
- Proper connection pooling
- Logging in development for debugging

---

### 1.4 Run Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Create and run migration
npx prisma migrate dev --name init

# Open Prisma Studio to view database (optional)
npx prisma studio
```

---

### 1.5 Update API Routes

#### [MODIFY] [`app/api/design/route.ts`](file:///c:/Users/DIO/Documents/PROJECT21/cardify-5/app/api/design/route.ts)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/design?id={designId}
 * Retrieve a saved design by ID
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing design ID' },
        { status: 400 }
      );
    }

    const design = await prisma.design.findUnique({
      where: { id }
    });

    if (!design) {
      return NextResponse.json(
        { error: 'Design not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(design.data);
  } catch (error) {
    console.error('Failed to fetch design:', error);
    return NextResponse.json(
      { error: 'Failed to fetch design' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/design
 * Save or update a design
 * Body: { id: string, data: any }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, data } = body;

    if (!id || !data) {
      return NextResponse.json(
        { error: 'Missing id or data' },
        { status: 400 }
      );
    }

    // Upsert: create if doesn't exist, update if exists
    const design = await prisma.design.upsert({
      where: { id },
      update: {
        data,
        updatedAt: new Date()
      },
      create: {
        id,
        data
      }
    });

    return NextResponse.json({ success: true, id: design.id });
  } catch (error) {
    console.error('Failed to save design:', error);
    return NextResponse.json(
      { error: 'Failed to save design' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/design?id={designId}
 * Delete a design
 */
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing design ID' },
        { status: 400 }
      );
    }

    await prisma.design.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete design:', error);
    return NextResponse.json(
      { error: 'Failed to delete design' },
      { status: 500 }
    );
  }
}
```

---

### 1.6 Verification

**Test persistence:**

1. Create a design in your app
2. Save it
3. **Restart the dev server:** `Ctrl+C` then `npm run dev`
4. Load the design again
5. ✅ Design should still be there (not lost!)

**Check database:**

```bash
# Open Prisma Studio
npx prisma studio

# Or use psql
psql -U postgres -d cardify
SELECT * FROM "Design";
```

---

## Phase 2: File Upload Security (Week 1-2)

### Objective
Secure file uploads with validation, size limits, and sanitization.

---

### 2.1 Install Dependencies

```bash
npm install file-type
npm install isomorphic-dompurify
```

---

### 2.2 Create File Validation Utilities

**Create:** `lib/fileValidation.ts`

```typescript
import { fileTypeFromBuffer } from 'file-type';
import DOMPurify from 'isomorphic-dompurify';

// Configuration
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
];

/**
 * Validate file size
 */
export function validateFileSize(size: number): boolean {
  return size > 0 && size <= MAX_FILE_SIZE;
}

/**
 * Validate MIME type
 */
export function validateMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType);
}

/**
 * Validate file extension
 */
export function validateFileExtension(filename: string): boolean {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return allowedExtensions.includes(ext);
}

/**
 * Validate file content matches extension (magic number check)
 */
export async function validateFileContent(
  buffer: Buffer,
  expectedMimeType: string
): Promise<boolean> {
  try {
    // SVG files don't have magic numbers, skip for them
    if (expectedMimeType === 'image/svg+xml') {
      return validateSVGContent(buffer);
    }

    const fileType = await fileTypeFromBuffer(buffer);
    
    if (!fileType) {
      return false;
    }

    return fileType.mime === expectedMimeType;
  } catch (error) {
    console.error('File content validation failed:', error);
    return false;
  }
}

/**
 * Validate SVG content (check if it's valid XML and SVG)
 */
function validateSVGContent(buffer: Buffer): boolean {
  try {
    const content = buffer.toString('utf-8');
    
    // Basic checks
    if (!content.includes('<svg')) {
      return false;
    }

    // Check for malicious content
    const dangerous = [
      '<script',
      'javascript:',
      'onerror=',
      'onload=',
      'onclick=',
      '<iframe',
      '<embed',
      '<object'
    ];

    const lowerContent = content.toLowerCase();
    return !dangerous.some(pattern => lowerContent.includes(pattern));
  } catch {
    return false;
  }
}

/**
 * Sanitize SVG content
 */
export function sanitizeSVG(buffer: Buffer): Buffer {
  try {
    const content = buffer.toString('utf-8');
    
    // Use DOMPurify to sanitize
    const clean = DOMPurify.sanitize(content, {
      USE_PROFILES: { svg: true, svgFilters: true },
      ADD_TAGS: ['use'], // Allow <use> tag for SVG sprites
      FORBID_TAGS: ['script', 'iframe', 'embed', 'object'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
    });

    return Buffer.from(clean, 'utf-8');
  } catch (error) {
    console.error('SVG sanitization failed:', error);
    throw new Error('Failed to sanitize SVG');
  }
}

/**
 * Generate secure random filename
 */
export function generateSecureFilename(originalName: string): string {
  const ext = originalName.toLowerCase().slice(originalName.lastIndexOf('.'));
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}_${random}${ext}`;
}
```

---

### 2.3 Update Upload API Route

#### [MODIFY] [`app/api/upload/route.ts`](file:///c:/Users/DIO/Documents/PROJECT21/cardify-5/app/api/upload/route.ts)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
import {
  validateFileSize,
  validateMimeType,
  validateFileExtension,
  validateFileContent,
  sanitizeSVG,
  generateSecureFilename,
  MAX_FILE_SIZE
} from '@/lib/fileValidation';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // 1. Validate file size
    if (!validateFileSize(file.size)) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // 2. Validate MIME type
    if (!validateMimeType(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images allowed.' },
        { status: 400 }
      );
    }

    // 3. Validate file extension
    if (!validateFileExtension(file.name)) {
      return NextResponse.json(
        { error: 'Invalid file extension' },
        { status: 400 }
      );
    }

    // 4. Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    let buffer = Buffer.from(arrayBuffer);

    // 5. Validate file content (magic number check)
    const isValidContent = await validateFileContent(buffer, file.type);
    if (!isValidContent) {
      return NextResponse.json(
        { error: 'File content does not match extension' },
        { status: 400 }
      );
    }

    // 6. Sanitize SVG if needed
    if (file.type === 'image/svg+xml') {
      buffer = sanitizeSVG(buffer);
    }

    // 7. Generate secure filename
    const secureFilename = generateSecureFilename(file.name);

    // 8. Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });

    // 9. Write file
    const filepath = path.join(uploadsDir, secureFilename);
    await fs.writeFile(filepath, buffer);

    // 10. Store metadata in database
    const uploadedFile = await prisma.uploadedFile.create({
      data: {
        filename: secureFilename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        path: `/uploads/${secureFilename}`
      }
    });

    return NextResponse.json({
      url: uploadedFile.path,
      id: uploadedFile.id
    });
  } catch (error) {
    console.error('Upload failed:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
```

---

### 2.4 Verification

**Test file upload security:**

1. **Valid image (< 10MB):** ✅ Should upload successfully
2. **Large file (> 10MB):** ❌ Should reject with error
3. **Wrong extension (.txt renamed to .jpg):** ❌ Should reject
4. **Malicious SVG with `<script>`:** ✅ Should upload but script removed

**Check database:**

```bash
npx prisma studio
# Check UploadedFile table for entries
```

---

## Phase 3: API Key Migration (Week 2)

### Objective
Move Pexels API calls to server-side to protect API key.

**See detailed guide:** [`api_key_migration_guide.md`](file:///C:/Users/DIO/.gemini/antigravity/brain/d0bc4748-4691-4698-8f0d-e7dec6b90524/api_key_migration_guide.md)

---

### 3.1 Update Environment Variables

**In `.env.local`:**

```diff
- NEXT_PUBLIC_PEXELS_API_KEY=your-api-key
+ PEXELS_API_KEY=your-api-key
```

---

### 3.2 Update pexelsService.ts

#### [MODIFY] [`lib/pexelsService.ts`](file:///c:/Users/DIO/Documents/PROJECT21/cardify-5/lib/pexelsService.ts)

```diff
- const PEXELS_API_KEY = process.env.NEXT_PUBLIC_PEXELS_API_KEY || '';
+ const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';
```

---

### 3.3 Create API Proxy Routes

**Create:** `app/api/images/search/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { searchPhotos } from '@/lib/pexelsService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '20');

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    if (query.length > 100) {
      return NextResponse.json(
        { error: 'Query too long' },
        { status: 400 }
      );
    }

    const results = await searchPhotos(query, page, perPage);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Image search failed:', error);
    return NextResponse.json(
      { error: 'Failed to search images' },
      { status: 500 }
    );
  }
}
```

**Create:** `app/api/images/curated/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getCuratedPhotos } from '@/lib/pexelsService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('perPage') || '20');

    const results = await getCuratedPhotos(page, perPage);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Failed to get curated photos:', error);
    return NextResponse.json(
      { error: 'Failed to get curated photos' },
      { status: 500 }
    );
  }
}
```

---

### 3.4 Update Client Components

Find components using Pexels and update them:

```bash
# Search for files using pexelsService
grep -r "pexelsService" --include="*.tsx" components/
grep -r "searchPhotos" --include="*.tsx" components/
```

**Before:**
```typescript
import { searchPhotos } from '@/lib/pexelsService';
const data = await searchPhotos('nature', 1, 20);
```

**After:**
```typescript
const response = await fetch(`/api/images/search?query=nature&page=1&perPage=20`);
const data = await response.json();
```

---

### 3.5 Verification

1. **Restart dev server** (important!)
2. **Open DevTools** → Sources → Search for `PEXELS_API_KEY`
3. ✅ Should NOT find it
4. **Test image search** → Should still work
5. **Check Network tab** → Should call `/api/images/search`, not `api.pexels.com`

---

## Phase 4: Input Validation & XSS Prevention (Week 2-3)

### Objective
Validate all inputs and remove XSS vulnerabilities.

---

### 4.1 Install Zod for Validation

```bash
npm install zod
```

---

### 4.2 Create Validation Schemas

**Create:** `lib/validation/schemas.ts`

```typescript
import { z } from 'zod';

export const DesignSchema = z.object({
  id: z.string().min(1).max(100),
  data: z.record(z.any())
});

export const FileUploadSchema = z.object({
  file: z.instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, 'File too large')
    .refine(
      (file) => ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'].includes(file.type),
      'Invalid file type'
    )
});

export const ImageSearchSchema = z.object({
  query: z.string().min(1).max(100),
  page: z.number().int().min(1).max(100).default(1),
  perPage: z.number().int().min(1).max(80).default(20)
});
```

---

### 4.3 Update API Routes with Validation

#### [MODIFY] `app/api/design/route.ts`

```typescript
import { DesignSchema } from '@/lib/validation/schemas';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate input
    const validation = DesignSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid data',
          details: validation.error.errors
        },
        { status: 400 }
      );
    }

    const { id, data } = validation.data;

    // ... rest of code
  } catch (error) {
    // ... error handling
  }
}
```

---

### 4.4 Remove dangerouslySetInnerHTML

#### [MODIFY] [`components/editor/ShapeLibrary.tsx`](file:///c:/Users/DIO/Documents/PROJECT21/cardify-5/components/editor/ShapeLibrary.tsx#L220-L230)

**Replace the `renderShapeThumbnail` function:**

```typescript
const renderShapeThumbnail = useCallback((shape: CustomShape) => {
  const hasScaleTransform = shape.transform.includes('scale');
  const viewBox = hasScaleTransform ? '0 0 480 480' : shape.viewBox;

  return (
    <svg
      width="40"
      height="40"
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
      className="pointer-events-none"
    >
      {shape.paths && shape.paths.length > 0 ? (
        shape.paths.map((p, idx) => (
          <path
            key={idx}
            d={p.d}
            fill={shape.displayFill}
            stroke={shape.displayStroke}
            strokeWidth={shape.strokeWidth}
            fillRule={p.fillRule || 'nonzero'}
          />
        ))
      ) : (
        <path
          d={shape.pathData}
          fill={shape.displayFill}
          stroke={shape.displayStroke}
          strokeWidth={shape.strokeWidth}
        />
      )}
    </svg>
  );
}, []);
```

#### [MODIFY] [`components/editor/IconLibrary.tsx`](file:///c:/Users/DIO/Documents/PROJECT21/cardify-5/components/editor/IconLibrary.tsx#L12-L36)

**Replace the `IconPreview` component:**

```typescript
const IconPreview = ({ iconName }: { iconName: string }) => {
  const [svgData, setSvgData] = useState<{ width: number; height: number; body: string } | null>(null);

  useEffect(() => {
    const iconData = getIcon(iconName);
    if (iconData) {
      setSvgData(iconData);
    }
  }, [iconName]);

  if (!svgData) {
    return <div className="w-6 h-6 bg-gray-100 rounded animate-pulse" />;
  }

  const isLucide = iconName.startsWith('lucide:') || !iconName.includes(':');

  return (
    <svg
      viewBox={`0 0 ${svgData.width} ${svgData.height}`}
      width="100%"
      height="100%"
      fill={isLucide ? 'none' : 'currentColor'}
      stroke={isLucide ? 'currentColor' : 'none'}
      strokeWidth={isLucide ? 2 : 0}
      className="w-7 h-7 text-gray-600 group-hover:text-gray-900 transition-colors mb-2"
    >
      {/* Parse and render SVG paths safely */}
      {parseSVGBody(svgData.body)}
    </svg>
  );
};

// Helper to parse SVG body into React elements
function parseSVGBody(body: string): React.ReactNode {
  // This is a simplified parser - you may need a more robust solution
  // For now, we'll use a safe approach with DOMParser
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<svg>${body}</svg>`, 'image/svg+xml');
    const paths = doc.querySelectorAll('path, circle, rect, polygon, polyline, line');
    
    return Array.from(paths).map((element, idx) => {
      const tagName = element.tagName.toLowerCase();
      const props: any = {};
      
      // Copy attributes
      Array.from(element.attributes).forEach(attr => {
        props[attr.name] = attr.value;
      });
      
      return React.createElement(tagName, { key: idx, ...props });
    });
  } catch (error) {
    console.error('Failed to parse SVG:', error);
    return null;
  }
}
```

---

### 4.5 Update Input Component

#### [MODIFY] [`components/ui/Input.tsx`](file:///c:/Users/DIO/Documents/PROJECT21/cardify-5/components/ui/Input.tsx)

```typescript
"use client";

import { InputHTMLAttributes, useState } from "react";
import clsx from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  sanitize?: boolean;
}

export default function Input({ 
  label, 
  error, 
  className,
  sanitize = true,
  onChange,
  ...props 
}: InputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (sanitize) {
      // Basic XSS prevention
      e.target.value = e.target.value.replace(/[<>]/g, '');
    }
    
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <div className="flex flex-col w-full">
      {label && <label className="mb-1 text-sm font-medium text-gray-700">{label}</label>}
      <input
        className={clsx(
          "border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400",
          error ? "border-red-500" : "border-gray-300",
          className
        )}
        onChange={handleChange}
        {...props}
      />
      {error && <span className="text-red-500 text-xs mt-1">{error}</span>}
    </div>
  );
}
```

---

## Phase 5: Security Headers & Best Practices (Week 3)

### Objective
Add HTTP security headers and implement security best practices.

---

### 5.1 Configure Security Headers

#### [MODIFY] [`next.config.js`](file:///c:/Users/DIO/Documents/PROJECT21/cardify-5/next.config.js)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  },
  
  reactStrictMode: true,
  poweredByHeader: false
};

module.exports = nextConfig;
```

---

### 5.2 Update Dependencies

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update Next.js (fixes glob vulnerability)
npm install next@latest

# Check for outdated packages
npm outdated
```

---

### 5.3 Add Error Handling Utility

**Create:** `lib/errorHandler.ts`

```typescript
import { NextResponse } from 'next/server';

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function handleError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  // Don't expose internal errors
  console.error('Unexpected error:', error);
  return NextResponse.json(
    { error: 'An unexpected error occurred' },
    { status: 500 }
  );
}
```

---

## Verification Plan

### Phase 1: Database

```bash
# Test persistence
1. Create design → Save → Restart server → Load design
✅ Design should persist

# Check database
npx prisma studio
✅ Should see Design entries
```

### Phase 2: File Upload

```bash
# Test security
1. Upload 15MB file → ❌ Should reject
2. Upload .exe renamed to .jpg → ❌ Should reject
3. Upload valid 5MB image → ✅ Should succeed
4. Upload SVG with <script> → ✅ Should upload but sanitized

# Check database
npx prisma studio
✅ Should see UploadedFile entries
```

### Phase 3: API Key

```bash
# Test security
1. Restart dev server
2. Open DevTools → Sources → Search "PEXELS_API_KEY"
✅ Should NOT find it

3. Test image search
✅ Should work via /api/images/search
```

### Phase 4: XSS Prevention

```bash
# Check components
1. Inspect ShapeLibrary in DevTools
✅ No dangerouslySetInnerHTML

2. Try entering "<script>alert('xss')</script>" in input
✅ Should be sanitized
```

### Phase 5: Security Headers

```bash
# Check headers
1. Open DevTools → Network → Refresh page
2. Check response headers
✅ Should see X-Frame-Options, X-Content-Type-Options, etc.
```

---

## Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| **Phase 1** | 2-3 days | Database setup, Prisma integration, API updates |
| **Phase 2** | 2-3 days | File validation, upload security |
| **Phase 3** | 1-2 days | API key migration, proxy routes |
| **Phase 4** | 3-4 days | Input validation, XSS fixes |
| **Phase 5** | 1-2 days | Security headers, dependency updates |
| **Total** | **2-3 weeks** | |

---

## Dependencies to Install

```bash
# Database
npm install prisma @prisma/client

# Validation
npm install zod

# File validation
npm install file-type isomorphic-dompurify

# Types
npm install --save-dev @types/node
```

---

## Future: Adding Centralized Auth

When you're ready to add your centralized auth system:

1. **Add user fields to schema:**
```prisma
model Design {
  id        String   @id @default(cuid())
  userId    String   // Add this
  user      User     @relation(fields: [userId], references: [id])
  data      Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([userId])
}
```

2. **Create migration:**
```bash
npx prisma migrate dev --name add_user_relations
```

3. **Update API routes** to check user ownership

---

## Summary

This revised plan focuses on:

✅ **Database persistence** (no more data loss)  
✅ **File upload security** (validation, sanitization)  
✅ **API key protection** (server-side only)  
✅ **Input validation** (Zod schemas)  
✅ **XSS prevention** (remove dangerouslySetInnerHTML)  
✅ **Security headers** (HTTP protections)

**Deferred for later:**
- Authentication (will be centralized across microservices)
- CSRF protection (requires auth)
- Rate limiting (can add later)

Ready to start with **Phase 1: Database Setup**?
