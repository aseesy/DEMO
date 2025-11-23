/**
 * Figma Design Generator
 * 
 * Generates fully-styled design pages from component data
 * Creates pixel-perfect designs matching the actual app
 */

const FigmaGenerator = require('./figmaGenerator');

class FigmaDesignGenerator extends FigmaGenerator {
  constructor(figmaService, fileKey) {
    super(figmaService, fileKey);
    // Load design tokens
    this.tokens = this.loadDesignTokens();
  }

  /**
   * Load design tokens
   */
  loadDesignTokens() {
    try {
      const fs = require('fs');
      const path = require('path');
      const tokensPath = path.join(
        __dirname,
        '..',
        '.design-tokens-mcp',
        'tokens.json'
      );
      return JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));
    } catch (error) {
      console.warn('Could not load design tokens:', error.message);
      return null;
    }
  }

  /**
   * Generate fully-styled design page (not wireframe)
   */
  generateDesignPage(component) {
    const designPage = {
      name: `${component.name} - Design`,
      type: 'FRAME',
      width: 1440, // Desktop width
      height: 2000, // Will auto-size based on content
      background: { r: 0.9, g: 0.96, b: 0.96 }, // teal-lightest background
      fills: [{ 
        type: 'GRADIENT_LINEAR',
        gradientStops: [
          { position: 0, color: this.hexToRgb('#E6F7F5') }, // teal-lightest
          { position: 1, color: { r: 1, g: 1, b: 1 } } // white
        ],
        gradientTransform: [[1, 0, 0], [0, 1, 0]]
      }],
      children: this.generateStyledElements(component.structure, {
        x: 0,
        y: 0,
        width: 1440,
        height: 2000,
      }),
      layoutMode: 'VERTICAL',
      primaryAxisSizingMode: 'AUTO',
      counterAxisSizingMode: 'FIXED',
      paddingTop: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      paddingRight: 0,
    };

    return designPage;
  }

  /**
   * Generate styled elements with full visual fidelity
   */
  generateStyledElements(structure, bounds) {
    const elements = [];
    
    if (!structure || !structure.children) return elements;

    let currentY = 0;

    structure.children.forEach((child, index) => {
      const element = this.createStyledElement(child, {
        x: 0,
        y: currentY,
        width: bounds.width,
        height: 100,
      });

      elements.push(element);
      currentY += element.height + (element.margin || 0);
    });

    return elements;
  }

  /**
   * Create a styled Figma element with full design details
   */
  createStyledElement(element, bounds) {
    const styledElement = {
      type: this.mapElementType(element.type),
      name: this.getElementName(element),
      x: bounds.x,
      y: bounds.y,
      width: this.calculateWidth(element, bounds),
      height: this.calculateHeight(element, bounds),
    };

    // Apply full styling
    const styles = this.parseTailwindClasses(element.attributes?.className || '');
    
    // Background color or gradient
    const className = element.attributes?.className || '';
    if (this.hasGradient(element)) {
      const gradient = this.parseGradient(className);
      styledElement.fills = [{
        type: 'GRADIENT_LINEAR',
        gradientStops: [
          { position: 0, color: this.hexToRgb(gradient.from) },
          { position: 1, color: this.hexToRgb(gradient.to) },
        ],
        gradientTransform: [[1, 0, 0], [0, 1, 0]],
      }];
    } else if (styles.backgroundColor && styles.backgroundColor !== 'gradient') {
      styledElement.fills = [{
        type: 'SOLID',
        color: this.hexToRgb(styles.backgroundColor),
      }];
    } else if (element.type === 'div' && !styles.backgroundColor) {
      // Default white background for containers
      styledElement.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
    }

    // Border - parse border color from className
    if (this.hasBorder(element)) {
      const borderColor = this.parseBorderColor(className);
      styledElement.strokes = [{
        type: 'SOLID',
        color: this.hexToRgb(borderColor),
      }];
      // Get border width from className (border-2 = 2px)
      const borderWidthMatch = className.match(/border-(\d+)/);
      styledElement.strokeWeight = borderWidthMatch ? parseInt(borderWidthMatch[1]) : 1;
    }

    // Border radius
    if (styles.borderRadius) {
      styledElement.cornerRadius = styles.borderRadius;
    }

    // Text styling
    if (element.type === 'h1' || element.type === 'h2' || element.type === 'h3' || element.text) {
      styledElement.type = 'TEXT';
      styledElement.characters = element.text || element.name || 'Text';
      styledElement.fontSize = this.getFontSize(element, styles);
      styledElement.fontFamily = 'Inter';
      styledElement.fontWeight = this.getFontWeight(element, styles);
      styledElement.textAlignHorizontal = this.getTextAlign(element, styles);
      
      if (styles.textColor) {
        styledElement.fills = [{
          type: 'SOLID',
          color: this.hexToRgb(styles.textColor),
        }];
      }
    }

    // Shadows - parse shadow size from className
    if (this.hasShadow(element)) {
      const shadow = this.parseShadow(className);
      styledElement.effects = [{
        type: 'DROP_SHADOW',
        color: shadow.color,
        offset: shadow.offset,
        radius: shadow.radius,
        spread: shadow.spread || 0,
        visible: true,
        blendMode: 'NORMAL',
      }];
    }

    // Padding
    if (styles.padding) {
      styledElement.paddingLeft = styles.padding;
      styledElement.paddingRight = styles.padding;
      styledElement.paddingTop = styles.padding;
      styledElement.paddingBottom = styles.padding;
    }

    // Add children recursively
    if (element.children && element.children.length > 0) {
      styledElement.children = this.generateStyledElements(
        { children: element.children },
        {
          x: bounds.x + (styles.padding || 0),
          y: bounds.y + (styles.padding || 0),
          width: styledElement.width - (styles.padding || 0) * 2,
          height: styledElement.height - (styles.padding || 0) * 2,
        }
      );
    }

    return styledElement;
  }

  /**
   * Get element name for display
   */
  getElementName(element) {
    if (element.attributes?.className?.includes('button')) return 'Button';
    if (element.attributes?.className?.includes('modal')) return 'Modal';
    if (element.attributes?.className?.includes('input')) return 'Input';
    if (element.type === 'h1' || element.type === 'h2' || element.type === 'h3') return 'Heading';
    return element.type.charAt(0).toUpperCase() + element.type.slice(1);
  }

  /**
   * Check if element has border
   */
  hasBorder(element) {
    const className = element.attributes?.className || '';
    return className.includes('border') || className.includes('border-');
  }

  /**
   * Check if element has shadow
   */
  hasShadow(element) {
    const className = element.attributes?.className || '';
    return className.includes('shadow');
  }

  /**
   * Get font size from element or styles
   */
  getFontSize(element, styles) {
    if (element.type === 'h1') return 48;
    if (element.type === 'h2') return 36;
    if (element.type === 'h3') return 24;
    return 16;
  }

  /**
   * Get font weight
   */
  getFontWeight(element, styles) {
    const className = element.attributes?.className || '';
    if (className.includes('font-bold')) return 700;
    if (className.includes('font-semibold')) return 600;
    if (className.includes('font-medium')) return 500;
    if (element.type === 'h1' || element.type === 'h2') return 600;
    return 400;
  }

  /**
   * Get text alignment
   */
  getTextAlign(element, styles) {
    const className = element.attributes?.className || '';
    if (className.includes('text-center')) return 'CENTER';
    if (className.includes('text-right')) return 'RIGHT';
    return 'LEFT';
  }

  /**
   * Enhanced color mapping with full token support
   */
  mapTailwindColor(className) {
    const colorMap = {
      // Teal palette
      'bg-teal-darkest': '#1f4447',
      'bg-teal-dark': '#275559',
      'bg-teal-medium': '#4DA8B0',
      'bg-teal-light': '#C5E8E4',
      'bg-teal-lightest': '#E6F7F5',
      'text-teal-darkest': '#1f4447',
      'text-teal-dark': '#275559',
      'text-teal-medium': '#4DA8B0',
      'text-teal-light': '#C5E8E4',
      'text-teal-lightest': '#E6F7F5',
      // UI colors
      'bg-white': '#FFFFFF',
      'bg-gray-50': '#F9FAFB',
      'bg-gray-100': '#F3F4F6',
      'bg-gray-200': '#E5E7EB',
      'text-white': '#FFFFFF',
      'text-gray-900': '#111827',
      'text-gray-700': '#374151',
      'text-gray-600': '#4b5563',
      'text-gray-500': '#6b7280',
      'border-gray-200': '#E5E7EB',
      'border-teal-light': '#C5E8E4',
      'border-teal-medium': '#4DA8B0',
      'border-teal-dark': '#275559',
      // Semantic colors
      'bg-red-600': '#dc2626',
      'bg-green-600': '#16a34a',
      'text-red-600': '#dc2626',
      // Background gradients
      'bg-black/40': 'rgba(0, 0, 0, 0.4)',
    };

    // Handle gradient classes
    if (className.includes('gradient-to-r') || className.includes('gradient-to-br')) {
      // Will be handled separately
      return 'gradient';
    }

    return colorMap[className] || null;
  }

  /**
   * Check if element has gradient
   */
  hasGradient(element) {
    const className = element.attributes?.className || '';
    return className.includes('gradient-to-');
  }

  /**
   * Parse gradient classes
   */
  parseGradient(className) {
    const gradientMap = {
      'from-teal-dark': '#275559',
      'from-teal-medium': '#4DA8B0',
      'to-teal-medium': '#4DA8B0',
      'to-teal-lightest': '#E6F7F5',
      'to-white': '#FFFFFF',
    };

    const parts = className.split(' ');
    const fromColor = parts.find(p => p.startsWith('from-'))?.replace('from-', '');
    const toColor = parts.find(p => p.startsWith('to-'))?.replace('to-', '');
    const direction = parts.find(p => p.includes('gradient-to-'))?.replace('bg-', '');

    let gradientType = 'LINEAR';
    if (direction && direction.includes('br')) {
      // Diagonal gradient
      gradientType = 'LINEAR';
    }

    return {
      type: gradientType,
      from: gradientMap[`from-${fromColor}`] || '#275559',
      to: gradientMap[`to-${toColor}`] || '#FFFFFF',
    };
  }

  /**
   * Enhanced spacing mapping
   */
  mapTailwindSpacing(className) {
    const spacingMap = {
      'p-2': 8,
      'p-3': 12,
      'p-4': 16,
      'p-6': 24,
      'p-8': 32,
      'px-4': 16,
      'py-3': 12,
      'm-4': 16,
      'm-6': 24,
      'm-8': 32,
      'gap-3': 12,
      'gap-4': 16,
    };

    // Extract number from class like p-4, m-6
    const match = className.match(/(p|m|px|py|gap)-(\d+)/);
    if (match) {
      return parseInt(match[2]) * 4; // Tailwind spacing scale
    }

    return spacingMap[className] || 0;
  }

  /**
   * Parse border color from className
   */
  parseBorderColor(className) {
    const borderColorMap = {
      'border-gray-200': '#E5E7EB',
      'border-teal-light': '#C5E8E4',
      'border-teal-medium': '#4DA8B0',
      'border-teal-dark': '#275559',
    };

    for (const [classPattern, color] of Object.entries(borderColorMap)) {
      if (className.includes(classPattern)) {
        return color;
      }
    }

    return '#C5E8E4'; // Default to teal-light
  }

  /**
   * Parse shadow from className
   */
  parseShadow(className) {
    const shadowMap = {
      'shadow-sm': { radius: 4, offset: { x: 0, y: 1 }, color: { r: 0, g: 0, b: 0, a: 0.05 } },
      'shadow-md': { radius: 8, offset: { x: 0, y: 2 }, color: { r: 0, g: 0, b: 0, a: 0.1 } },
      'shadow-lg': { radius: 12, offset: { x: 0, y: 4 }, color: { r: 0, g: 0, b: 0, a: 0.15 } },
      'shadow-xl': { radius: 16, offset: { x: 0, y: 8 }, color: { r: 0, g: 0, b: 0, a: 0.2 } },
      'shadow-2xl': { radius: 24, offset: { x: 0, y: 12 }, color: { r: 0, g: 0, b: 0, a: 0.25 } },
    };

    for (const [shadowClass, shadowProps] of Object.entries(shadowMap)) {
      if (className.includes(shadowClass)) {
        return shadowProps;
      }
    }

    // Default shadow
    return {
      radius: 8,
      offset: { x: 0, y: 2 },
      color: { r: 0, g: 0, b: 0, a: 0.1 },
      spread: 0,
    };
  }
}

module.exports = FigmaDesignGenerator;

