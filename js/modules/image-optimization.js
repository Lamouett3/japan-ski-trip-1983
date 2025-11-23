/**
 * Image Optimization Module
 * Handles lazy loading, WebP detection, and responsive image logic
 * PHASE 4 - Image Optimization
 * 
 * Usage:
 *   import imageOptimization from './modules/image-optimization.js';
 */

const imageOptimization = (() => {
  const config = {
    lazyLoadClass: 'responsive-img',
    loadedClass: 'loaded',
    errorClass: 'image-error',
    useNativeLazyLoad: 'loading' in HTMLImageElement.prototype,
  };

  /**
   * Detect WebP support
   */
  function supportsWebP() {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  /**
   * Set WebP attribute for native lazy loading fallback
   */
  function enableWebPSupport() {
    if (supportsWebP()) {
      document.documentElement.setAttribute('data-webp', 'true');
    }
  }

  /**
   * Handle image load completion
   */
  function handleImageLoad(img) {
    img.classList.add(config.loadedClass);
    img.removeAttribute('loading');
    
    // Fire custom event
    const event = new CustomEvent('imageLoaded', { detail: { img } });
    document.dispatchEvent(event);
  }

  /**
   * Handle image load errors
   */
  function handleImageError(img) {
    img.classList.add(config.errorClass);
    
    // Fire custom event
    const event = new CustomEvent('imageLoadError', { detail: { img } });
    document.dispatchEvent(event);
    
    // Log error in development
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`Image failed to load: ${img.src}`);
    }
  }

  /**
   * Setup lazy loading for an image
   */
  function setupLazyLoad(img) {
    if (!img.src && !img.srcset) {
      console.warn('Image has no src or srcset', img);
      return;
    }

    if (config.useNativeLazyLoad) {
      // Use native lazy loading
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }
      
      img.addEventListener('load', () => handleImageLoad(img), { once: true });
      img.addEventListener('error', () => handleImageError(img), { once: true });
    } else {
      // Fallback: Use Intersection Observer
      observeImage(img);
    }
  }

  /**
   * Intersection Observer for older browsers
   */
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        
        // Load image
        if (img.dataset.src) {
          img.src = img.dataset.src;
        }
        if (img.dataset.srcset) {
          img.srcset = img.dataset.srcset;
        }
        
        img.addEventListener('load', () => handleImageLoad(img), { once: true });
        img.addEventListener('error', () => handleImageError(img), { once: true });
        
        observer.unobserve(img);
      }
    });
  }, {
    rootMargin: '50px', // Start loading 50px before image enters viewport
  });

  /**
   * Observe image with Intersection Observer
   */
  function observeImage(img) {
    imageObserver.observe(img);
  }

  /**
   * Initialize all lazy-loaded images
   */
  function init() {
    // Enable WebP support detection
    enableWebPSupport();

    // Setup all images with responsive-img class or loading="lazy"
    const lazyImages = document.querySelectorAll(
      `img[loading="lazy"], img.${config.lazyLoadClass}, img[data-src]`
    );

    lazyImages.forEach(img => {
      setupLazyLoad(img);
    });

    // Also watch for dynamically added images
    observeDynamicImages();
  }

  /**
   * Watch for dynamically added images using MutationObserver
   */
  function observeDynamicImages() {
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) { // Element node
            // Check if added node is image
            if (node.tagName === 'IMG' && (node.loading === 'lazy' || node.classList.contains(config.lazyLoadClass))) {
              setupLazyLoad(node);
            }

            // Check children for images
            const images = node.querySelectorAll?.('img[loading="lazy"], img.' + config.lazyLoadClass) || [];
            images.forEach(img => setupLazyLoad(img));
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Preload image (for next/previous navigation)
   */
  function preload(src) {
    const img = new Image();
    img.src = src;
    return img;
  }

  /**
   * Get optimal image size based on device
   */
  function getOptimalSize() {
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;

    if (width <= 640) {
      return 640;
    } else if (width <= 1024) {
      return 1024;
    } else {
      return 1440;
    }
  }

  /**
   * Build srcset from variants
   */
  function buildSrcset(basePath, formats = ['webp', 'jpg']) {
    const srcset = [];

    formats.forEach(format => {
      if (format === 'webp' || format === 'jpg') {
        srcset.push(`${basePath}_640w.${format} 640w`);
        srcset.push(`${basePath}_1024w.${format} 1024w`);
        srcset.push(`${basePath}_1440w.${format} 1440w`);
      }
    });

    return srcset.join(', ');
  }

  /**
   * Report performance metrics
   */
  function reportMetrics() {
    if (!window.performance || !window.performance.getEntriesByType) {
      return;
    }

    const images = performance.getEntriesByType('resource')
      .filter(entry => entry.name.includes('/images/'));

    if (images.length === 0) return;

    const totalSize = images.reduce((sum, img) => sum + (img.transferSize || 0), 0);
    const avgLoadTime = images.reduce((sum, img) => sum + (img.duration || 0), 0) / images.length;

    console.group('📊 Image Performance Metrics');
    console.log(`Total images: ${images.length}`);
    console.log(`Total size: ${(totalSize / 1024).toFixed(2)} KB`);
    console.log(`Average load time: ${avgLoadTime.toFixed(0)}ms`);
    console.log(`Images:`, images.map(img => ({
      name: img.name.split('/').pop(),
      size: `${(img.transferSize / 1024).toFixed(1)} KB`,
      duration: `${img.duration.toFixed(0)}ms`,
    })));
    console.groupEnd();
  }

  // API publique
  return {
    init,
    supportsWebP,
    getOptimalSize,
    buildSrcset,
    preload,
    reportMetrics,
  };
})();

export default imageOptimization;
