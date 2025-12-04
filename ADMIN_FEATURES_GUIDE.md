# Admin Features Implementation Guide

> **CRITICAL REMINDER**: This file contains instructions for hiding administrative features when implementing the login/authentication system.

---

## 🔒 Features That Need Admin-Only Access

### 1. Template Export Feature

**Location**: Export Modal - "Save as Template" section

**Current Status**: ✅ Accessible to all users (development mode)

**Action Required When Implementing Auth**:

#### Files to Modify:

1. **`components/editor/ExportModal.tsx`**
   - Add admin role check before rendering "Save as Template" tab
   - Hide the entire section if user is not admin
   
   ```tsx
   // Example implementation:
   import { useAuth } from '@/hooks/useAuth'; // Your auth hook
   
   function ExportModal() {
     const { user, isAdmin } = useAuth();
     
     return (
       <Tabs>
         <Tab label="Export as Image">...</Tab>
         <Tab label="Export as PDF">...</Tab>
         
         {/* ADMIN ONLY - Template Export */}
         {isAdmin && (
           <Tab label="Save as Template">
             {/* Template export form */}
           </Tab>
         )}
       </Tabs>
     );
   }
   ```

2. **`app/api/templates/export/route.ts`**
   - Add server-side authentication check
   - Verify user has admin role before processing export
   - Return 403 Forbidden if user is not admin
   
   ```typescript
   // Example implementation:
   export async function POST(req: NextRequest) {
     // Check authentication
     const session = await getServerSession(req);
     
     if (!session || !session.user) {
       return NextResponse.json(
         { error: 'Unauthorized' }, 
         { status: 401 }
       );
     }
     
     // Check admin role
     if (session.user.role !== 'admin') {
       return NextResponse.json(
         { error: 'Forbidden - Admin access required' }, 
         { status: 403 }
       );
     }
     
     // Proceed with template export...
   }
   ```

3. **Environment Variables** (Optional Feature Flag Approach)
   
   Add to `.env.local`:
   ```env
   # Feature Flags
   NEXT_PUBLIC_ENABLE_TEMPLATE_EXPORT=false  # Set to true only for admins
   ```
   
   Then in `ExportModal.tsx`:
   ```tsx
   const canExportTemplates = 
     process.env.NEXT_PUBLIC_ENABLE_TEMPLATE_EXPORT === 'true' || 
     isAdmin;
   ```

---

## 🎯 Authentication Implementation Checklist

When you implement the login system, follow these steps:

### Phase 1: Setup Authentication

- [ ] Choose auth provider (NextAuth.js, Clerk, Auth0, etc.)
- [ ] Set up user database/schema
- [ ] Add `role` field to user model (`admin`, `user`, `premium`, etc.)
- [ ] Implement login/logout functionality
- [ ] Create auth context/hooks

### Phase 2: Protect Admin Features

- [ ] **Template Export Feature**
  - [ ] Add role check in `ExportModal.tsx`
  - [ ] Add server-side validation in `/api/templates/export`
  - [ ] Test with non-admin user (should be hidden)
  - [ ] Test with admin user (should be visible)

- [ ] **Future Admin Features** (add as needed)
  - [ ] User management dashboard
  - [ ] Template approval system
  - [ ] Analytics/reporting
  - [ ] System settings

### Phase 3: Security Hardening

- [ ] Add rate limiting to export endpoint
- [ ] Implement audit logging for admin actions
- [ ] Add CSRF protection
- [ ] Sanitize all user inputs
- [ ] Add file upload size limits
- [ ] Implement template validation

### Phase 4: Testing

- [ ] Test as anonymous user (no access)
- [ ] Test as regular user (no access)
- [ ] Test as admin user (full access)
- [ ] Test API endpoints with invalid tokens
- [ ] Test API endpoints without authentication
- [ ] Verify audit logs are working

---

## 📋 User Roles & Permissions Matrix

| Feature | Anonymous | User | Premium | Admin |
|---------|-----------|------|---------|-------|
| View Templates | ✅ | ✅ | ✅ | ✅ |
| Edit Templates | ❌ | ✅ | ✅ | ✅ |
| Export as Image/PDF | ❌ | ✅ | ✅ | ✅ |
| **Save as Template** | ❌ | ❌ | ❌ | ✅ |
| Delete Templates | ❌ | ❌ | ❌ | ✅ |
| User Management | ❌ | ❌ | ❌ | ✅ |

---

## 🔐 Recommended Auth Setup

### Option 1: NextAuth.js (Recommended)

**Pros**: 
- Built for Next.js
- Supports multiple providers
- Easy role-based access control

**Setup**:
```bash
npm install next-auth
```

**Example Configuration**:
```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import { PrismaAdapter } from '@next-auth/prisma-adapter';

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Your providers
  ],
  callbacks: {
    session: async ({ session, user }) => {
      if (session?.user) {
        session.user.id = user.id;
        session.user.role = user.role; // Add role to session
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

### Option 2: Clerk

**Pros**:
- Pre-built UI components
- Easy setup
- Built-in user management

**Setup**:
```bash
npm install @clerk/nextjs
```

---

## 🚨 Security Best Practices

### 1. Never Trust Client-Side Checks Alone

❌ **Bad**:
```tsx
// Only checking on client
{isAdmin && <AdminButton />}
```

✅ **Good**:
```tsx
// Check on client AND server
{isAdmin && <AdminButton />}

// In API route:
if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
```

### 2. Always Validate on Server

Every admin API endpoint should:
1. Check if user is authenticated
2. Check if user has admin role
3. Validate all inputs
4. Log the action
5. Return appropriate error codes

### 3. Use Environment Variables for Sensitive Data

```env
# .env.local (NEVER commit this file)
DATABASE_URL=...
NEXTAUTH_SECRET=...
ADMIN_EMAIL=admin@example.com
```

### 4. Implement Audit Logging

```typescript
// lib/auditLog.ts
export async function logAdminAction(
  userId: string,
  action: string,
  details: any
) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      details: JSON.stringify(details),
      timestamp: new Date(),
      ipAddress: req.headers.get('x-forwarded-for'),
    },
  });
}

// Usage in API route:
await logAdminAction(session.user.id, 'TEMPLATE_EXPORT', {
  templateId: template.id,
  filename: generatedFilename,
});
```

---

## 📝 Code Snippets for Quick Implementation

### Custom Hook: `useIsAdmin`

```typescript
// hooks/useIsAdmin.ts
import { useSession } from 'next-auth/react';

export function useIsAdmin() {
  const { data: session, status } = useSession();
  
  const isAdmin = session?.user?.role === 'admin';
  const isLoading = status === 'loading';
  
  return { isAdmin, isLoading };
}

// Usage:
const { isAdmin, isLoading } = useIsAdmin();

if (isLoading) return <Spinner />;
if (!isAdmin) return null;

return <AdminFeature />;
```

### Server-Side Auth Check Utility

```typescript
// lib/auth.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function requireAdmin(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  
  if (session.user.role !== 'admin') {
    throw new Error('Forbidden - Admin access required');
  }
  
  return session.user;
}

// Usage in API route:
export async function POST(req: NextRequest) {
  try {
    const user = await requireAdmin(req);
    // Proceed with admin action...
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.message.includes('Unauthorized') ? 401 : 403 }
    );
  }
}
```

---

## 🎨 UI/UX Considerations

### 1. Admin Badge/Indicator

Show admin users they have special privileges:

```tsx
// components/ui/AdminBadge.tsx
export function AdminBadge() {
  const { isAdmin } = useIsAdmin();
  
  if (!isAdmin) return null;
  
  return (
    <div className="fixed top-4 right-4 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
      👑 Admin Mode
    </div>
  );
}
```

### 2. Feature Tooltips

Explain why features are hidden:

```tsx
{!isAdmin && (
  <Tooltip content="This feature is only available to administrators">
    <Button disabled>Save as Template</Button>
  </Tooltip>
)}
```

### 3. Admin Dashboard

Create a dedicated admin panel:
- `/admin/dashboard` - Overview
- `/admin/templates` - Template management
- `/admin/users` - User management
- `/admin/logs` - Audit logs

---

## 📚 Additional Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Clerk Documentation](https://clerk.com/docs)
- [OWASP Security Guidelines](https://owasp.org/)
- [Next.js Authentication Patterns](https://nextjs.org/docs/authentication)

---

## ⚠️ IMPORTANT REMINDERS

1. **Before Going to Production**:
   - [ ] All admin features are protected
   - [ ] Server-side validation is in place
   - [ ] Audit logging is implemented
   - [ ] Rate limiting is configured
   - [ ] Environment variables are set correctly
   - [ ] Security testing is complete

2. **Regular Security Audits**:
   - Review admin access logs monthly
   - Update dependencies regularly
   - Monitor for suspicious activity
   - Test authentication flows

3. **Backup Plan**:
   - Keep backups of `public/templates/` folder
   - Document all admin actions
   - Have rollback procedures ready

---

**Last Updated**: 2025-12-04  
**Next Review**: When implementing authentication system

---

## 🔄 Version History

| Date | Change | Author |
|------|--------|--------|
| 2025-12-04 | Initial creation - Template export feature guide | System |
| TBD | Authentication implementation | TBD |
| TBD | Production security hardening | TBD |
