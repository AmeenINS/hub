# 🚀 Performance Optimization Tips for Developers

## ⚡ Quick Wins

### 1. Use Turbo Mode in Development
```bash
npm run dev:turbo
```
Turbo mode uses Rust-based compiler for faster HMR (Hot Module Replacement)

### 2. Analyze Bundle Size
```bash
npm run build:analyze
```
This will show you which packages are taking up the most space

### 3. Enable React Strict Mode
Already enabled in `next.config.ts` - helps identify potential problems

## 🎯 Component Optimization

### Use React.memo for Pure Components
```tsx
// ❌ Bad - Re-renders on every parent render
function UserCard({ user }) {
  return <div>{user.name}</div>;
}

// ✅ Good - Only re-renders when user changes
const UserCard = React.memo(({ user }) => {
  return <div>{user.name}</div>;
});
```

### Use useMemo for Expensive Calculations
```tsx
// ❌ Bad - Recalculates on every render
function Component({ items }) {
  const sorted = items.sort((a, b) => a.name.localeCompare(b.name));
  return <List items={sorted} />;
}

// ✅ Good - Only recalculates when items change
function Component({ items }) {
  const sorted = useMemo(
    () => items.sort((a, b) => a.name.localeCompare(b.name)),
    [items]
  );
  return <List items={sorted} />;
}
```

### Use useCallback for Event Handlers
```tsx
// ❌ Bad - Creates new function on every render
function Component() {
  return <Child onClick={() => console.log('clicked')} />;
}

// ✅ Good - Stable function reference
function Component() {
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []);
  return <Child onClick={handleClick} />;
}
```

## 🔄 Data Fetching Optimization

### Batch API Requests
```tsx
// ❌ Bad - Sequential requests
const users = await fetch('/api/users');
const products = await fetch('/api/products');
const orders = await fetch('/api/orders');

// ✅ Good - Parallel requests
const [users, products, orders] = await Promise.all([
  fetch('/api/users'),
  fetch('/api/products'),
  fetch('/api/orders'),
]);
```

### Implement Proper Caching
```tsx
// Use SWR or React Query for caching
import useSWR from 'swr';

function Component() {
  const { data, error } = useSWR('/api/users', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 60000, // 1 minute
  });
}
```

## 🖼️ Image Optimization

### Use Next.js Image Component
```tsx
import Image from 'next/image';

// ✅ Good - Automatic optimization
<Image
  src="/hero.jpg"
  width={800}
  height={600}
  alt="Hero"
  priority // for above-the-fold images
/>

// For dynamic images
<Image
  src={user.avatar}
  width={40}
  height={40}
  alt={user.name}
  quality={75} // Lower quality for avatars
/>
```

### Use WebP/AVIF Formats
Already configured in `next.config.ts`

## 📦 Code Splitting

### Dynamic Imports for Heavy Components
```tsx
import dynamic from 'next/dynamic';

// ❌ Bad - Loads chart library on initial page load
import { LineChart } from 'recharts';

// ✅ Good - Loads only when component is rendered
const LineChart = dynamic(() => import('recharts').then(mod => mod.LineChart), {
  loading: () => <div>Loading chart...</div>,
  ssr: false, // Don't render on server
});
```

## 🎨 Animation Optimization

### Prefer CSS Animations
```tsx
// ❌ Bad - JS-based animation (causes reflow)
<motion.div
  animate={{ x: 100 }}
  transition={{ duration: 1 }}
>
  Content
</motion.div>

// ✅ Good - CSS-based animation (GPU accelerated)
<div className="transition-transform duration-1000 translate-x-100">
  Content
</div>
```

### Use will-change for Complex Animations
```css
.animated-element {
  will-change: transform, opacity;
}
```

## 🗂️ List Optimization

### Use Virtualization for Long Lists
```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function LongList({ items }) {
  const parentRef = useRef();
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div key={virtualItem.index}>
            {items[virtualItem.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 🧹 Cleanup

### Always Cleanup in useEffect
```tsx
// ❌ Bad - Memory leak
useEffect(() => {
  const interval = setInterval(() => {
    console.log('tick');
  }, 1000);
}, []);

// ✅ Good - Proper cleanup
useEffect(() => {
  const interval = setInterval(() => {
    console.log('tick');
  }, 1000);
  
  return () => clearInterval(interval);
}, []);
```

## 📊 Monitoring

### Chrome DevTools
1. Open DevTools > Performance
2. Click Record
3. Interact with your app
4. Stop recording
5. Analyze flame graph

### React DevTools Profiler
1. Install React DevTools
2. Open Profiler tab
3. Click Record
4. Interact with app
5. Analyze component render times

### Lighthouse
```bash
# Run Lighthouse audit
npx lighthouse http://localhost:4000 --view
```

## 🎯 Performance Targets

- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.8s
- **Total Blocking Time (TBT)**: < 200ms
- **Cumulative Layout Shift (CLS)**: < 0.1

## 🛠️ Tools

1. **Next.js Bundle Analyzer**
   ```bash
   npm install @next/bundle-analyzer
   ```

2. **React DevTools Profiler**
   Browser extension

3. **Lighthouse**
   Built into Chrome DevTools

4. **webpack-bundle-analyzer**
   Visualize bundle composition

## 📚 Resources

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Web Vitals](https://web.dev/vitals/)
- [Chrome DevTools Performance](https://developer.chrome.com/docs/devtools/performance/)
