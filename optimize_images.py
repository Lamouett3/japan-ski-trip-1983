#!/usr/bin/env python3
"""
Image Optimization Script for PHASE 4
Converts images to WebP, generates responsive variants, and optimizes for web.

Usage:
    python3 optimize_images.py
    
Requirements:
    - Pillow (PIL)
    - Optional: imagemagick for advanced formats
    
Output:
    - /images/optimized/webp/ - WebP versions
    - /images/optimized/jpg/ - Optimized JPEGs
    - /images/optimized/variants.json - Mapping for srcset generation
"""

import os
import json
from pathlib import Path
from PIL import Image
import sys

# Configuration
IMAGES_DIR = Path(__file__).parent / 'images'
OPTIMIZED_DIR = IMAGES_DIR / 'optimized'
WEBP_DIR = OPTIMIZED_DIR / 'webp'
JPG_DIR = OPTIMIZED_DIR / 'jpg'

# Variants to generate (width, quality)
VARIANTS = {
    'mobile': {'width': 640, 'quality': 85},
    'tablet': {'width': 1024, 'quality': 87},
    'desktop': {'width': 1440, 'quality': 90},
}

FALLBACK_FORMAT = 'jpg'
FALLBACK_QUALITY = 85


def setup_directories():
    """Create required directories."""
    WEBP_DIR.mkdir(parents=True, exist_ok=True)
    JPG_DIR.mkdir(parents=True, exist_ok=True)
    print(f"✅ Directories created")


def get_images():
    """Get all image files from source directory."""
    extensions = {'.jpg', '.jpeg', '.png', '.gif', '.bmp'}
    images = [
        f for f in IMAGES_DIR.glob('*')
        if f.suffix.lower() in extensions and f.name != '.DS_Store'
    ]
    return sorted(images)


def optimize_image(src_path, dest_dir, format_type, width=None, quality=None):
    """
    Optimize and convert image.
    
    Args:
        src_path: Source image path
        dest_dir: Destination directory
        format_type: 'webp' or 'jpg'
        width: Target width (maintains aspect ratio)
        quality: JPEG/WebP quality (1-100)
    
    Returns:
        Destination path if successful, None otherwise
    """
    try:
        # Open image
        img = Image.open(src_path)
        
        # Convert RGBA to RGB for JPEG (no transparency)
        if img.mode in ('RGBA', 'LA', 'P'):
            # Create white background
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
            img = background
        elif img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize if width specified
        if width:
            ratio = width / img.width
            new_height = int(img.height * ratio)
            img = img.resize((width, new_height), Image.Resampling.LANCZOS)
        
        # Create filename
        stem = src_path.stem
        variant_suffix = f"_{width}w" if width else ""
        dest_filename = f"{stem}{variant_suffix}.{format_type}"
        dest_path = dest_dir / dest_filename
        
        # Save with appropriate settings
        if format_type == 'webp':
            img.save(dest_path, 'WEBP', quality=quality or 85, method=6)
        else:  # jpg
            img.save(dest_path, 'JPEG', quality=quality or FALLBACK_QUALITY, optimize=True)
        
        return dest_path
        
    except Exception as e:
        print(f"❌ Error processing {src_path.name}: {e}")
        return None


def generate_srcset(image_name):
    """
    Generate srcset HTML attribute for responsive images.
    
    Args:
        image_name: Base image name (without extension)
    
    Returns:
        String with srcset attribute
    """
    srcset_items = []
    
    # WebP variants
    for variant_name, config in VARIANTS.items():
        width = config['width']
        webp_file = f"{image_name}_{width}w.webp"
        srcset_items.append(f"./images/optimized/webp/{webp_file} {width}w")
    
    # Fallback JPEG (full size)
    jpg_file = f"{image_name}.jpg"
    srcset_items.append(f"./images/{jpg_file}")
    
    return ', '.join(srcset_items)


def generate_picture_html(image_name, alt_text=""):
    """
    Generate HTML <picture> element for optimal responsive images.
    
    Args:
        image_name: Base image name
        alt_text: Alt text for accessibility
    
    Returns:
        HTML string
    """
    html = f'''<picture>
    <!-- WebP format (modern browsers) -->
    <source srcset="./images/optimized/webp/{image_name}_640w.webp 640w,
                    ./images/optimized/webp/{image_name}_1024w.webp 1024w,
                    ./images/optimized/webp/{image_name}_1440w.webp 1440w"
            type="image/webp"
            sizes="(max-width: 640px) 100vw,
                   (max-width: 1024px) 100vw,
                   1440px">
    
    <!-- JPEG fallback (older browsers) -->
    <img src="./images/{image_name}.jpg"
         alt="{alt_text}"
         loading="lazy"
         width="1440"
         height="900"
         class="responsive-img">
</picture>'''
    return html


def process_images():
    """Process all images and generate variants."""
    images = get_images()
    
    if not images:
        print("❌ No images found in /images directory")
        return
    
    print(f"📸 Found {len(images)} images")
    print()
    
    variants_map = {}
    
    for idx, src_path in enumerate(images, 1):
        image_name = src_path.stem
        print(f"[{idx}/{len(images)}] Processing: {src_path.name}")
        
        # Generate WebP variants (multiple sizes)
        webp_variants = []
        for variant_name, config in VARIANTS.items():
            webp_path = optimize_image(
                src_path,
                WEBP_DIR,
                'webp',
                width=config['width'],
                quality=config['quality']
            )
            if webp_path:
                original_size = src_path.stat().st_size
                optimized_size = webp_path.stat().st_size
                savings = ((original_size - optimized_size) / original_size) * 100
                print(f"  ✓ WebP {variant_name:8} ({config['width']:4}w): -{savings:.1f}%")
                webp_variants.append({
                    'variant': variant_name,
                    'width': config['width'],
                    'file': webp_path.name
                })
        
        # Generate JPEG fallback (full resolution, optimized)
        jpg_path = optimize_image(
            src_path,
            JPG_DIR,
            'jpg',
            quality=FALLBACK_QUALITY
        )
        if jpg_path:
            original_size = src_path.stat().st_size
            optimized_size = jpg_path.stat().st_size
            savings = ((original_size - optimized_size) / original_size) * 100
            print(f"  ✓ JPEG fallback: -{savings:.1f}%")
        
        # Store mapping
        variants_map[image_name] = {
            'original': src_path.name,
            'webp': webp_variants,
            'jpg_fallback': jpg_path.name if jpg_path else None,
            'srcset': generate_srcset(image_name),
            'picture_html': generate_picture_html(image_name, alt_text=f"Japan Ski Trip - {image_name}")
        }
        
        print()
    
    # Save variants mapping
    variants_file = OPTIMIZED_DIR / 'variants.json'
    with open(variants_file, 'w') as f:
        json.dump(variants_map, f, indent=2)
    
    print(f"✅ Variants mapping saved to: {variants_file}")
    print()
    
    # Summary
    total_original = sum(img.stat().st_size for img in images)
    total_webp = sum(f.stat().st_size for f in WEBP_DIR.glob('**/*.webp'))
    total_jpg = sum(f.stat().st_size for f in JPG_DIR.glob('**/*.jpg'))
    
    print("📊 Summary:")
    print(f"  Original total:  {total_original / 1024 / 1024:.2f} MB")
    print(f"  WebP variants:   {total_webp / 1024 / 1024:.2f} MB")
    print(f"  JPEG fallback:   {total_jpg / 1024 / 1024:.2f} MB")
    print(f"  Savings (WebP):  {((total_original - total_webp) / total_original) * 100:.1f}%")
    print()
    print("✨ PHASE 4 Image Optimization Complete!")


if __name__ == '__main__':
    try:
        setup_directories()
        process_images()
    except KeyboardInterrupt:
        print("\n⚠️ Interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)
