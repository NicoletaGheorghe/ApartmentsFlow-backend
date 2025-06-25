# Frontend Troubleshooting Guide

## Table of Contents
1. [Next.js Build Issues](#nextjs-build-issues)
2. [React Component Issues](#react-component-issues)
3. [API Client Problems](#api-client-problems)
4. [State Management Issues](#state-management-issues)
5. [Image Optimization Issues](#image-optimization-issues)
6. [Navigation Issues](#navigation-issues)
7. [Styling Issues](#styling-issues)
8. [Quick Reference](#quick-reference)

---

## Next.js Build Issues

### 1. Build Failures
**Issue**: Next.js build failing
**Error**: Various build-time errors

**Fix**: Common build fixes:
```bash
# Clear Next.js cache
rm -rf .next
npm run build

# Check for TypeScript errors
npx tsc --noEmit

# Clear all caches
npm run clean
rm -rf node_modules package-lock.json
npm install
```

### 2. Environment Variable Issues
**Issue**: Environment variables not accessible
**Error**: Undefined variables

**Fix**: Proper environment variable usage:
```javascript
// Server-side only
const secret = process.env.SECRET_KEY;

// Client-side accessible
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
```

### 3. API Route Issues
**Issue**: API routes not working properly
**Error**: 404 errors, routing issues

**Fix**: Proper API route structure:
```javascript
// pages/api/example.js
export default function handler(req, res) {
  if (req.method === 'POST') {
    // Handle POST
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
```

---

## React Component Issues

### 1. Component Not Rendering
**Issue**: Component not displaying or updating
**Error**: Component not rendering, stale data

**Fix**: Check component lifecycle and state:
```javascript
// Use useEffect for side effects
useEffect(() => {
  // Effect logic
}, [dependencies]);

// Use functional updates for state
setState(prevState => ({ ...prevState, newValue }));
```

### 2. Props Issues
**Issue**: Props not being passed correctly
**Error**: Undefined props, type errors

**Fix**: Proper prop handling:
```javascript
// Destructure with defaults
const { title = 'Default Title', description } = props;

// Check for required props
if (!title) {
  throw new Error('Title is required');
}
```

### 3. Event Handler Issues
**Issue**: Event handlers not working
**Error**: Events not firing, incorrect behavior

**Fix**: Proper event handling:
```javascript
// Use arrow functions or bind
const handleClick = (e) => {
  e.preventDefault();
  // Handler logic
};

// Or bind in constructor
this.handleClick = this.handleClick.bind(this);
```

---

## API Client Problems

### 1. Network Errors
**Issue**: Frontend showing "Network Error" when trying to connect to backend
**Error**: `Network Error` in browser console

**Fix**: 
1. Restart both frontend and backend servers
2. Check if both servers are running on correct ports
3. Verify CORS configuration
4. Check firewall settings

### 2. Authentication Token Issues
**Issue**: Authentication tokens not being properly passed or validated
**Error**: 401 Unauthorized errors

**Fix**: Ensure proper token handling:
```javascript
// Include token in headers
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
};

// Handle token expiration
if (response.status === 401) {
  localStorage.removeItem('token');
  router.push('/login');
}
```

### 3. Data Format Mismatches
**Issue**: Frontend and backend expecting different data structures
**Error**: Various parsing and validation errors

**Fix**: Establish clear API contracts and validate data at both ends:
```javascript
// Validate data before sending
const validateFormData = (data) => {
  const errors = [];
  if (!data.title) errors.push('Title is required');
  if (!data.price || data.price <= 0) errors.push('Valid price is required');
  return errors;
};
```

---

## State Management Issues

### 1. State Not Updating
**Issue**: State not updating properly, components not re-rendering
**Error**: UI not reflecting data changes

**Fix**: Proper state management:
```javascript
// Use functional updates for state
setState(prevState => ({ ...prevState, newValue }));

// Use useEffect for side effects
useEffect(() => {
  // Effect logic
}, [dependencies]);
```

### 2. Context Issues
**Issue**: Context not providing data correctly
**Error**: Context consumers not receiving data

**Fix**: Proper context setup:
```javascript
// Create context with default value
const AuthContext = createContext({
  user: null,
  login: () => {},
  logout: () => {}
});

// Provide context value
<AuthContext.Provider value={{ user, login, logout }}>
  {children}
</AuthContext.Provider>
```

### 3. Local Storage Issues
**Issue**: Data not persisting in local storage
**Error**: Data lost on page refresh

**Fix**: Proper local storage handling:
```javascript
// Save to local storage
localStorage.setItem('user', JSON.stringify(userData));

// Load from local storage
const userData = JSON.parse(localStorage.getItem('user') || 'null');

// Clear local storage
localStorage.removeItem('user');
```

---

## Image Optimization Issues

### 1. Images Not Loading
**Issue**: Images not displaying properly
**Error**: Image loading errors, broken images

**Fix**: Proper Next.js Image configuration:
```javascript
// next.config.mjs
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com', 'localhost'],
    formats: ['image/webp', 'image/avif'],
  },
};
```

### 2. Image Optimization Performance
**Issue**: Slow image loading, poor performance
**Error**: Large bundle sizes, slow rendering

**Fix**: Optimize images:
```javascript
// Use Next.js Image component
import Image from 'next/image';

<Image
  src="/path/to/image.jpg"
  alt="Description"
  width={500}
  height={300}
  priority={true} // For above-the-fold images
/>
```

### 3. Cloudinary Integration Issues
**Issue**: Cloudinary images not loading
**Error**: CORS errors, authentication issues

**Fix**: Proper Cloudinary setup:
```javascript
// Configure Cloudinary domain in next.config.mjs
images: {
  domains: ['res.cloudinary.com'],
}
```

---

## Navigation Issues

### 1. Client-Side Navigation Problems
**Issue**: Navigation not working, page not updating
**Error**: Router errors, stale data

**Fix**: Proper Next.js routing:
```javascript
import { useRouter } from 'next/navigation';

const router = useRouter();

// Navigate to new page
router.push('/new-page');

// Force refresh
router.refresh();

// Go back
router.back();
```

### 2. Route Protection Issues
**Issue**: Protected routes not working correctly
**Error**: Users accessing unauthorized pages

**Fix**: Implement route protection:
```javascript
// Check authentication in useEffect
useEffect(() => {
  if (!user) {
    router.push('/login');
  }
}, [user, router]);
```

### 3. Dynamic Routing Issues
**Issue**: Dynamic routes not working
**Error**: 404 errors for dynamic pages

**Fix**: Proper dynamic routing:
```javascript
// pages/apartments/[id].js
export default function ApartmentPage({ params }) {
  const { id } = params;
  // Use id to fetch apartment data
}
```

---

## Styling Issues

### 1. CSS Module Issues
**Issue**: CSS modules not working properly
**Error**: Styles not applying, class name conflicts

**Fix**: Proper CSS module usage:
```javascript
import styles from './Component.module.css';

<div className={styles.container}>
  <h1 className={styles.title}>Title</h1>
</div>
```

### 2. Tailwind CSS Issues
**Issue**: Tailwind classes not working
**Error**: Styles not applying, build errors

**Fix**: Proper Tailwind configuration:
```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### 3. Responsive Design Issues
**Issue**: Layout not working on different screen sizes
**Error**: Broken layouts, overflow issues

**Fix**: Proper responsive design:
```css
/* Use CSS Grid or Flexbox */
.container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

/* Use media queries */
@media (max-width: 768px) {
  .container {
    grid-template-columns: 1fr;
  }
}
```

---

## Quick Reference

### Common Commands
```bash
# Start frontend
npm run dev

# Build for production
npm run build

# Check for linting issues
npm run lint

# Analyze bundle size
npm run analyze

# Clear Next.js cache
rm -rf .next
```

### Common Error Messages
- `Module not found`: Missing dependency → Run `npm install`
- `Cannot read property of undefined`: Null check needed
- `Maximum call stack size exceeded`: Infinite loop or recursion
- `Unexpected token`: Syntax error → Check code syntax

### Emergency Procedures
1. **Frontend Won't Start**
   - Check port availability
   - Verify dependencies
   - Clear cache
   - Check for syntax errors

2. **Build Failures**
   - Clear Next.js cache
   - Check for TypeScript errors
   - Verify environment variables
   - Check for missing dependencies

3. **API Connection Issues**
   - Verify backend is running
   - Check CORS configuration
   - Verify API endpoints
   - Check network connectivity

4. **Component Issues**
   - Check component lifecycle
   - Verify props and state
   - Check for infinite loops
   - Review event handlers

---

*Last Updated: December 2024*
*Part of the Apartment Search Project Troubleshooting Suite* 