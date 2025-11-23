/**
 * Component Scanner
 * 
 * Scans React components and extracts design information:
 * - Component structure (JSX hierarchy)
 * - Props and variants
 * - Styling (className patterns, Tailwind classes)
 * - Layout structure
 * - Design tokens used
 */

const fs = require('fs');
const path = require('path');

class ComponentScanner {
  constructor(componentsPath) {
    this.componentsPath = componentsPath;
    this.components = [];
    this.designTokens = this.loadDesignTokens();
  }

  /**
   * Load design tokens from tokens.json
   */
  loadDesignTokens() {
    try {
      const tokensPath = path.join(
        __dirname,
        '..',
        '.design-tokens-mcp',
        'tokens.json'
      );
      const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));
      return tokens;
    } catch (error) {
      console.warn('Could not load design tokens:', error.message);
      return null;
    }
  }

  /**
   * Scan all components in the components directory
   */
  async scanComponents() {
    const components = [];
    const componentsDir = path.join(
      process.cwd(),
      '..',
      'chat-client-vite',
      'src',
      'components'
    );

    // Scan UI components
    const uiDir = path.join(componentsDir, 'ui');
    if (fs.existsSync(uiDir)) {
      const uiComponents = this.scanDirectory(uiDir, 'ui');
      components.push(...uiComponents);
    }

    // Scan page components
    const pageComponents = [
      'LandingPage.jsx',
      'LoginSignup.jsx',
      'ChatInterface.jsx',
      'Navigation.jsx',
      'ProfilePanel.jsx',
      'ContactsPanel.jsx',
      'UpdatesPanel.jsx',
      'UIShowcase.jsx', // UI Design System Showcase
    ];

    pageComponents.forEach(filename => {
      const filePath = path.join(componentsDir, filename);
      if (fs.existsSync(filePath)) {
        const component = this.scanComponentFile(filePath, filename);
        if (component) components.push(component);
      }
    });

    // Scan modals
    const modalsDir = path.join(componentsDir, 'modals');
    if (fs.existsSync(modalsDir)) {
      const modals = this.scanDirectory(modalsDir, 'modals');
      components.push(...modals);
    }

    this.components = components;
    return components;
  }

  /**
   * Scan a directory for components
   */
  scanDirectory(dir, category) {
    const components = [];
    
    if (!fs.existsSync(dir)) return components;

    const files = fs.readdirSync(dir, { withFileTypes: true });

    files.forEach(file => {
      const filePath = path.join(dir, file.name);
      
      if (file.isDirectory()) {
        // Check for index.js or ComponentName.jsx
        const indexFile = path.join(filePath, 'index.js');
        const componentFile = path.join(filePath, `${file.name}.jsx`);
        
        if (fs.existsSync(indexFile)) {
          const indexContent = fs.readFileSync(indexFile, 'utf-8');
          const exportMatch = indexContent.match(/export.*from ['"](.+?)['"]/);
          if (exportMatch) {
            const actualPath = path.resolve(filePath, exportMatch[1]);
            if (fs.existsSync(actualPath)) {
              const component = this.scanComponentFile(actualPath, file.name, category);
              if (component) components.push(component);
            }
          }
        } else if (fs.existsSync(componentFile)) {
          const component = this.scanComponentFile(componentFile, file.name, category);
          if (component) components.push(component);
        }
      } else if (file.name.endsWith('.jsx') || file.name.endsWith('.js')) {
        const component = this.scanComponentFile(filePath, file.name, category);
        if (component) components.push(component);
      }
    });

    return components;
  }

  /**
   * Scan a single component file
   */
  scanComponentFile(filePath, filename, category = 'pages') {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const componentName = this.extractComponentName(content, filename);
      
      if (!componentName) return null;

      const component = {
        name: componentName,
        filename: filename,
        category: category,
        path: filePath,
        props: this.extractProps(content),
        structure: this.extractStructure(content),
        styles: this.extractStyles(content),
        tokens: this.extractDesignTokens(content),
        children: this.extractChildComponents(content),
        layout: this.extractLayout(content),
      };

      return component;
    } catch (error) {
      console.error(`Error scanning component ${filename}:`, error.message);
      return null;
    }
  }

  /**
   * Extract component name
   */
  extractComponentName(content, filename) {
    // Try to find exported function/const component
    const functionMatch = content.match(/export\s+(?:function|const)\s+(\w+)/);
    if (functionMatch) return functionMatch[1];

    // Try default export
    const defaultMatch = content.match(/export\s+default\s+(\w+)/);
    if (defaultMatch) return defaultMatch[1];

    // Fallback to filename
    return filename.replace(/\.(jsx|js)$/, '');
  }

  /**
   * Extract component props
   */
  extractProps(content) {
    const props = [];
    
    // Find function parameters
    const paramMatch = content.match(/function\s+\w+\s*\(({[^}]*}|[^)]+)\)/);
    if (paramMatch) {
      const params = paramMatch[1];
      // Simple extraction - look for prop names
      const propMatches = params.match(/(\w+)\s*:?\s*\w*/g);
      if (propMatches) {
        propMatches.forEach(match => {
          const propName = match.split(/[:\s]/)[0];
          if (propName && propName !== '{') {
            props.push({ name: propName });
          }
        });
      }
    }

    // Find destructured props
    const destructuredMatch = content.match(/\{\s*([^}]+)\s*\}/);
    if (destructuredMatch) {
      const destructured = destructuredMatch[1].split(',').map(s => s.trim());
      destructured.forEach(prop => {
        if (prop && !prop.includes('=')) {
          props.push({ name: prop.split(':')[0].trim() });
        }
      });
    }

    return props;
  }

  /**
   * Extract JSX structure
   */
  extractStructure(content) {
    const structure = {
      type: 'div',
      children: [],
    };

    // Find main return JSX
    const returnMatch = content.match(/return\s*\(([\s\S]*?)\)\s*;?/);
    if (!returnMatch) return structure;

    const jsx = returnMatch[1].trim();
    
    // Extract top-level elements
    const elements = this.parseJSXElements(jsx);
    structure.children = elements;

    return structure;
  }

  /**
   * Parse JSX elements recursively
   */
  parseJSXElements(jsx) {
    const elements = [];
    const tagRegex = /<(\w+)([^>]*)>([\s\S]*?)<\/\1>/g;
    let match;

    while ((match = tagRegex.exec(jsx)) !== null) {
      const tagName = match[1];
      const attributes = match[2];
      const innerContent = match[3];

      const element = {
        type: tagName,
        attributes: this.parseAttributes(attributes),
        children: this.parseJSXElements(innerContent),
        text: this.extractText(innerContent),
      };

      elements.push(element);
    }

    return elements;
  }

  /**
   * Parse element attributes
   */
  parseAttributes(attrString) {
    const attrs = {};
    
    // Extract className
    const classNameMatch = attrString.match(/className=["']([^"']+)["']/);
    if (classNameMatch) {
      attrs.className = classNameMatch[1];
    }

    // Extract other common attributes
    const attrRegex = /(\w+)=["']([^"']+)["']/g;
    let match;
    while ((match = attrRegex.exec(attrString)) !== null) {
      attrs[match[1]] = match[2];
    }

    return attrs;
  }

  /**
   * Extract text content
   */
  extractText(content) {
    // Remove JSX tags and get text
    const text = content.replace(/<[^>]+>/g, '').trim();
    return text.length > 0 ? text : null;
  }

  /**
   * Extract styling information (Tailwind classes)
   */
  extractStyles(content) {
    const styles = {
      classes: [],
      colors: [],
      spacing: [],
      typography: [],
    };

    // Find all className values
    const classNameMatches = content.matchAll(/className=["']([^"']+)["']/g);
    for (const match of classNameMatches) {
      const classes = match[1].split(/\s+/);
      styles.classes.push(...classes);

      // Extract design tokens
      classes.forEach(cls => {
        if (cls.includes('teal-')) {
          styles.colors.push(cls);
        }
        if (cls.match(/\b(p|m|gap|space)-(\d+|xs|sm|md|lg|xl|2xl|3xl)/)) {
          styles.spacing.push(cls);
        }
        if (cls.match(/\b(text|font)-(xs|sm|base|lg|xl|2xl|3xl|4xl)/)) {
          styles.typography.push(cls);
        }
      });
    }

    return styles;
  }

  /**
   * Extract design tokens used
   */
  extractDesignTokens(content) {
    const tokens = {
      colors: new Set(),
      spacing: new Set(),
      typography: new Set(),
    };

    const styles = this.extractStyles(content);
    
    styles.colors.forEach(color => tokens.colors.add(color));
    styles.spacing.forEach(spacing => tokens.spacing.add(spacing));
    styles.typography.forEach(typography => tokens.typography.add(typography));

    return {
      colors: Array.from(tokens.colors),
      spacing: Array.from(tokens.spacing),
      typography: Array.from(tokens.typography),
    };
  }

  /**
   * Extract child components used
   */
  extractChildComponents(content) {
    const children = [];
    
    // Find component imports
    const importMatches = content.matchAll(/import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g);
    for (const match of importMatches) {
      const imported = match[1].split(',').map(s => s.trim());
      imported.forEach(name => {
        children.push({
          name: name.replace(/\s+as\s+\w+/, '').trim(),
          from: match[2],
        });
      });
    }

    return children;
  }

  /**
   * Extract layout information
   */
  extractLayout(content) {
    const layout = {
      type: 'flex',
      direction: 'column',
      items: [],
    };

    // Detect flex layout
    if (content.includes('flex-col')) {
      layout.direction = 'column';
    } else if (content.includes('flex-row')) {
      layout.direction = 'row';
    }

    // Detect grid layout
    if (content.includes('grid')) {
      layout.type = 'grid';
    }

    return layout;
  }

  /**
   * Generate component summary for Figma
   */
  generateFigmaData() {
    return this.components.map(component => ({
      name: component.name,
      category: component.category,
      type: component.category === 'ui' ? 'component' : 'page',
      props: component.props,
      structure: component.structure,
      styles: component.styles,
      tokens: component.tokens,
      children: component.children.map(c => c.name),
      layout: component.layout,
    }));
  }
}

module.exports = ComponentScanner;

