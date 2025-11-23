/**
 * Figma Generator
 * 
 * Generates Figma file structure from component data
 * Creates wireframes and design pages in Figma
 */

const FigmaService = require('./figmaService');
const ComponentScanner = require('./componentScanner');

class FigmaGenerator {
  constructor(figmaService, fileKey) {
    this.figmaService = figmaService;
    this.fileKey = fileKey;
  }

  /**
   * Generate wireframe from component structure
   */
  generateWireframe(component) {
    const wireframe = {
      name: `${component.name} - Wireframe`,
      type: 'FRAME',
      width: 1440, // Default desktop width
      height: 900,
      background: { r: 0.98, g: 0.98, b: 0.98 }, // Light gray background
      children: this.generateStructureElements(component.structure, {
        x: 0,
        y: 0,
        width: 1440,
        height: 900,
      }),
    };

    return wireframe;
  }

  /**
   * Recursively generate Figma elements from component structure
   */
  generateStructureElements(structure, bounds) {
    const elements = [];
    
    if (!structure || !structure.children) return elements;

    let currentY = bounds.y + 16; // Padding
    let currentX = bounds.x + 16;

    structure.children.forEach((child, index) => {
      const element = this.createFigmaElement(child, {
        x: currentX,
        y: currentY,
        width: bounds.width - 32,
        height: 100, // Default height
      });

      elements.push(element);
      
      // Position next element
      if (structure.layout && structure.layout.direction === 'row') {
        currentX += element.width + 16;
      } else {
        currentY += element.height + 16;
      }
    });

    return elements;
  }

  /**
   * Create a Figma element from component structure
   */
  createFigmaElement(element, bounds) {
    const figmaElement = {
      type: this.mapElementType(element.type),
      name: element.type.charAt(0).toUpperCase() + element.type.slice(1),
      x: bounds.x,
      y: bounds.y,
      width: this.calculateWidth(element, bounds),
      height: this.calculateHeight(element, bounds),
    };

    // Apply styles from className
    if (element.attributes && element.attributes.className) {
      const styles = this.parseTailwindClasses(element.attributes.className);
      figmaElement.styles = styles;
      
      // Apply background color
      if (styles.backgroundColor) {
        figmaElement.fills = [{
          type: 'SOLID',
          color: this.hexToRgb(styles.backgroundColor),
        }];
      }
    }

    // Add text if present
    if (element.text) {
      figmaElement.characters = element.text;
      figmaElement.fontSize = 16;
      figmaElement.fontFamily = 'Inter';
    }

    // Add children recursively
    if (element.children && element.children.length > 0) {
      figmaElement.children = this.generateStructureElements(
        { children: element.children, layout: { direction: 'column' } },
        {
          x: bounds.x + 8,
          y: bounds.y + 8,
          width: figmaElement.width - 16,
          height: figmaElement.height - 16,
        }
      );
    }

    return figmaElement;
  }

  /**
   * Map HTML/React element types to Figma types
   */
  mapElementType(type) {
    const typeMap = {
      div: 'FRAME',
      button: 'RECTANGLE', // Buttons become rectangles in wireframe
      input: 'RECTANGLE',
      textarea: 'RECTANGLE',
      img: 'RECTANGLE',
      h1: 'TEXT',
      h2: 'TEXT',
      h3: 'TEXT',
      h4: 'TEXT',
      p: 'TEXT',
      span: 'TEXT',
      a: 'TEXT',
    };

    return typeMap[type] || 'FRAME';
  }

  /**
   * Calculate element width based on Tailwind classes
   */
  calculateWidth(element, bounds) {
    if (!element.attributes || !element.attributes.className) {
      return bounds.width;
    }

    const classes = element.attributes.className.split(' ');
    
    // Check for width classes
    if (classes.includes('w-full')) return bounds.width;
    if (classes.includes('w-1/2')) return bounds.width / 2;
    if (classes.includes('w-1/3')) return bounds.width / 3;
    if (classes.includes('w-2/3')) return (bounds.width * 2) / 3;
    if (classes.includes('w-1/4')) return bounds.width / 4;

    // Check for max-width
    const maxWidthMatch = classes.find(c => c.startsWith('max-w-'));
    if (maxWidthMatch) {
      const maxWidth = maxWidthMatch.split('-')[2];
      const widthMap = {
        'sm': 640,
        'md': 768,
        'lg': 1024,
        'xl': 1280,
        '2xl': 1536,
      };
      return Math.min(widthMap[maxWidth] || bounds.width, bounds.width);
    }

    return bounds.width;
  }

  /**
   * Calculate element height based on content and classes
   */
  calculateHeight(element, bounds) {
    if (element.text) {
      // Estimate height based on text length
      const estimatedLines = Math.ceil(element.text.length / 50);
      return Math.max(estimatedLines * 24, 40);
    }

    if (element.children && element.children.length > 0) {
      // Calculate based on children
      return element.children.length * 60 + 32; // Padding
    }

    return 60; // Default height
  }

  /**
   * Parse Tailwind classes to extract design information
   */
  parseTailwindClasses(className) {
    const classes = className.split(' ');
    const styles = {
      backgroundColor: null,
      textColor: null,
      padding: null,
      margin: null,
      borderRadius: null,
    };

    classes.forEach(cls => {
      // Background colors
      if (cls.startsWith('bg-')) {
        styles.backgroundColor = this.mapTailwindColor(cls);
      }
      
      // Text colors
      if (cls.startsWith('text-')) {
        styles.textColor = this.mapTailwindColor(cls);
      }
      
      // Padding
      if (cls.startsWith('p-')) {
        styles.padding = this.mapTailwindSpacing(cls);
      }
      
      // Margin
      if (cls.startsWith('m-')) {
        styles.margin = this.mapTailwindSpacing(cls);
      }
      
      // Border radius
      if (cls.startsWith('rounded-')) {
        styles.borderRadius = this.mapTailwindRadius(cls);
      }
    });

    return styles;
  }

  /**
   * Map Tailwind color class to hex value
   */
  mapTailwindColor(className) {
    const colorMap = {
      'bg-teal-dark': '#275559',
      'bg-teal-darkest': '#1f4447',
      'bg-teal-medium': '#4DA8B0',
      'bg-teal-light': '#C5E8E4',
      'bg-teal-lightest': '#E6F7F5',
      'text-teal-dark': '#275559',
      'text-teal-medium': '#4DA8B0',
      'text-white': '#FFFFFF',
      'text-gray-900': '#111827',
      'text-gray-600': '#4b5563',
      'bg-white': '#FFFFFF',
      'bg-gray-50': '#F9FAFB',
      'bg-gray-100': '#F3F4F6',
    };

    return colorMap[className] || null;
  }

  /**
   * Map Tailwind spacing to pixels
   */
  mapTailwindSpacing(className) {
    const spacingMap = {
      'p-4': 16,
      'p-6': 24,
      'p-8': 32,
      'm-4': 16,
      'm-6': 24,
      'm-8': 32,
    };

    return spacingMap[className] || 0;
  }

  /**
   * Map Tailwind radius to pixels
   */
  mapTailwindRadius(className) {
    const radiusMap = {
      'rounded-sm': 6,
      'rounded-md': 8,
      'rounded-lg': 12,
      'rounded-xl': 16,
      'rounded-2xl': 24,
      'rounded-full': 9999,
    };

    return radiusMap[className] || 0;
  }

  /**
   * Convert hex color to RGB
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255,
    } : { r: 1, g: 1, b: 1 };
  }

  /**
   * Generate complete Figma page structure from components
   */
  async generateFigmaPage(components, pageType = 'wireframes') {
    const page = {
      name: pageType === 'wireframes' ? '📐 Wireframes' : '🎨 Design Pages',
      type: 'CANVAS',
      children: [],
    };

    components.forEach((component, index) => {
      if (pageType === 'wireframes') {
        const wireframe = this.generateWireframe(component);
        wireframe.x = 0;
        wireframe.y = index * 1000; // Stack vertically
        page.children.push(wireframe);
      } else {
        // Generate design page with actual styling
        const designPage = this.generateDesignPage ? this.generateDesignPage(component) : this.generateWireframe(component);
        designPage.x = 0;
        designPage.y = index * 1200;
        page.children.push(designPage);
      }
    });

    return page;
  }

  /**
   * Generate design page with full styling
   */
  generateDesignPage(component) {
    const designPage = {
      name: `${component.name} - Design`,
      type: 'FRAME',
      width: 1440,
      height: 1000,
      background: { r: 1, g: 1, b: 1 }, // White background
      children: this.generateStyledElements(component),
    };

    return designPage;
  }

  /**
   * Generate styled elements with actual colors and typography
   */
  generateStyledElements(component) {
    // Similar to generateStructureElements but with full styling
    return this.generateStructureElements(component.structure, {
      x: 0,
      y: 0,
      width: 1440,
      height: 1000,
    });
  }

  /**
   * Convert generated structure to Figma Plugin API format
   */
  toFigmaPluginFormat(figmaStructure) {
    // This will be sent to the Figma plugin to create actual elements
    return {
      command: 'create-structure',
      structure: figmaStructure,
    };
  }
}

module.exports = FigmaGenerator;

