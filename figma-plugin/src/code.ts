/**
 * LiaiZen Design Sync Plugin
 *
 * Syncs design tokens and components from Figma to the LiaiZen codebase
 */

// Type definitions for design tokens
interface TealColors {
  lightest?: string;
  light?: string;
  medium?: string;
  dark?: string;
  darkest?: string;
}

interface SemanticColors {
  success?: string;
  warning?: string;
  error?: string;
  info?: string;
}

interface UIColors {
  [key: string]: string;
}

interface Spacing {
  [key: string]: string;
}

interface Typography {
  fontFamily?: string;
  fontSize?: { [key: string]: string };
  fontWeight?: { [key: string]: string };
}

interface BorderRadius {
  [key: string]: string;
}

interface Shadows {
  [key: string]: string;
}

interface DesignTokens {
  colors: {
    teal: TealColors;
    semantic: SemanticColors;
    ui: UIColors;
  };
  spacing: Spacing;
  typography: Typography;
  borderRadius: BorderRadius;
  shadows: Shadows;
}

interface ComponentStyles {
  backgroundColor?: string;
  borderRadius?: string;
  fontSize?: string;
  fontFamily?: string;
  fontWeight?: string;
  color?: string;
}

interface ComponentData {
  id: string;
  name: string;
  type: string;
  width: number;
  height: number;
  x: number;
  y: number;
  properties: {
    description?: string;
    variantProperties?: { [key: string]: string };
  };
  styles: ComponentStyles;
}

// Plugin state
let apiUrl = 'http://localhost:3001';

// LiaiZen Design Tokens (embedded from tokens.json)
const LIAIZEN_TOKENS = {
  colors: {
    primary: { white: "#FFFFFF" },
    teal: {
      lightest: "#E6F7F5",
      light: "#C5E8E4",
      medium: "#4DA8B0",
      dark: "#275559",
      darkest: "#1f4447"
    },
    ui: {
      background: "#FFFFFF",
      surface: "#F9FAFB",
      border: "#E5E7EB",
      text: {
        primary: "#111827",
        secondary: "#4b5563",
        tertiary: "#9ca3af"
      },
      gray: {
        50: "#f9fafb", 100: "#f3f4f6", 200: "#e5e7eb", 300: "#d1d5db",
        400: "#9ca3af", 500: "#6b7280", 600: "#4b5563", 700: "#374151",
        800: "#1f2937", 900: "#111827"
      }
    },
    semantic: {
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444",
      info: "#3b82f6"
    }
  },
  typography: {
    fontFamily: "Inter",
    fontSize: {
      xs: 12, sm: 14, base: 16, lg: 18,
      xl: 20, "2xl": 24, "3xl": 30, "4xl": 36
    },
    fontWeight: {
      normal: "400", medium: "500", semibold: "600", bold: "700"
    }
  },
  shadows: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
  },
  borderRadius: {
    sm: 6, md: 8, lg: 12, xl: 16, "2xl": 24, full: 9999
  },
  spacing: {
    xs: 4, sm: 8, md: 16, lg: 24, xl: 32, "2xl": 48, "3xl": 64
  }
};

// Listen for messages from UI
figma.ui.onmessage = async (msg) => {
  try {
    switch (msg.type) {
      case 'extract-tokens':
        await extractDesignTokens();
        break;

      case 'sync-tokens':
        await syncTokensToBackend();
        break;

      case 'export-component':
        await exportSelectedComponent();
        break;

      case 'get-file-info':
        await sendFileInfo();
        break;

      case 'set-api-url':
        apiUrl = msg.url;
        figma.ui.postMessage({ type: 'api-url-set', url: apiUrl });
        break;

      case 'create-design-system':
        await createLiaiZenDesignSystem();
        break;

      case 'sync-from-code':
        await syncComponentsFromCode(msg.pageType || 'wireframes');
        break;

      case 'create-structure':
        await createStructureFromData(msg.structure);
        break;

      case 'fetch-components':
        await fetchComponentsFromBackend();
        break;

      default:
        figma.ui.postMessage({
          type: 'error',
          message: `Unknown message type: ${msg.type}`
        });
    }
  } catch (error) {
    figma.ui.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Create LiaiZen Design System in Figma
 * Creates all color styles, text styles, and effect styles
 */
async function createLiaiZenDesignSystem() {
  let createdCount = { colors: 0, textStyles: 0, effects: 0 };

  try {
    // 1. CREATE COLOR STYLES
    // Teal colors
    Object.entries(LIAIZEN_TOKENS.colors.teal).forEach(([name, hex]) => {
      createColorStyle(`Teal/${capitalize(name)}`, hex as string);
      createdCount.colors++;
    });

    // UI colors
    createColorStyle('UI/Background', LIAIZEN_TOKENS.colors.ui.background);
    createColorStyle('UI/Surface', LIAIZEN_TOKENS.colors.ui.surface);
    createColorStyle('UI/Border', LIAIZEN_TOKENS.colors.ui.border);
    createdCount.colors += 3;

    // UI Text colors
    Object.entries(LIAIZEN_TOKENS.colors.ui.text).forEach(([name, hex]) => {
      createColorStyle(`UI/Text/${capitalize(name)}`, hex as string);
      createdCount.colors++;
    });

    // Gray scale
    Object.entries(LIAIZEN_TOKENS.colors.ui.gray).forEach(([shade, hex]) => {
      createColorStyle(`UI/Gray/${shade}`, hex as string);
      createdCount.colors++;
    });

    // Semantic colors
    Object.entries(LIAIZEN_TOKENS.colors.semantic).forEach(([name, hex]) => {
      createColorStyle(`Semantic/${capitalize(name)}`, hex as string);
      createdCount.colors++;
    });

    // Primary white
    createColorStyle('Primary/White', LIAIZEN_TOKENS.colors.primary.white);
    createdCount.colors++;

    // 2. CREATE TEXT STYLES
    const weights = ['normal', 'medium', 'semibold', 'bold'];
    const sizes = Object.entries(LIAIZEN_TOKENS.typography.fontSize);

    for (const [sizeName, sizeValue] of sizes) {
      for (const weight of weights) {
        const styleName = `LiaiZen/${sizeName.toUpperCase()}/${capitalize(weight)}`;
        await createTextStyle(
          styleName,
          LIAIZEN_TOKENS.typography.fontFamily,
          sizeValue as number,
          LIAIZEN_TOKENS.typography.fontWeight[weight as keyof typeof LIAIZEN_TOKENS.typography.fontWeight]
        );
        createdCount.textStyles++;
      }
    }

    // 3. CREATE EFFECT STYLES (Shadows)
    for (const [name, value] of Object.entries(LIAIZEN_TOKENS.shadows)) {
      createEffectStyle(`Shadow/${name.toUpperCase()}`, value as string);
      createdCount.effects++;
    }

    // 4. CREATE VISUAL STYLE GUIDE IN CANVAS
    await createVisualStyleGuide();

    figma.ui.postMessage({
      type: 'design-system-created',
      message: `✅ Created ${createdCount.colors} color styles, ${createdCount.textStyles} text styles, and ${createdCount.effects} effect styles + visual style guide!`,
      stats: createdCount
    });

    figma.notify('✅ LiaiZen Design System created successfully!');

  } catch (error) {
    figma.ui.postMessage({
      type: 'error',
      message: `Failed to create design system: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}

/**
 * Create visual style guide in canvas
 */
async function createVisualStyleGuide() {
  // Remove any existing style guide pages first
  const existingPages = figma.currentPage.findAll(node =>
    node.type === 'FRAME' && node.name === '🎨 LiaiZen Design System'
  );
  existingPages.forEach(page => page.remove());

  // Create main frame for style guide
  const styleGuidePage = figma.createFrame();
  styleGuidePage.name = '🎨 LiaiZen Design System';
  styleGuidePage.resize(1440, 5000);
  styleGuidePage.fills = [{ type: 'SOLID', color: hexToRgb('#F9FAFB') }];
  styleGuidePage.layoutMode = 'VERTICAL';
  styleGuidePage.primaryAxisSizingMode = 'AUTO';
  styleGuidePage.counterAxisSizingMode = 'FIXED';
  styleGuidePage.paddingTop = 80;
  styleGuidePage.paddingBottom = 80;
  styleGuidePage.paddingLeft = 80;
  styleGuidePage.paddingRight = 80;
  styleGuidePage.itemSpacing = 64;

  // Load default fonts - try multiple style names for compatibility
  const fontsToLoad = [
    { family: 'Inter', style: 'Regular' },
    { family: 'Inter', style: 'Medium' },
    { family: 'Inter', style: 'Bold' },
  ];
  
  // Try both "Semi Bold" and "SemiBold" for compatibility
  try {
    await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
  } catch (e) {
    try {
      await figma.loadFontAsync({ family: 'Inter', style: 'SemiBold' });
    } catch (e2) {
      // If neither works, we'll use Medium as fallback
      console.warn('Could not load Semi Bold font variant');
    }
  }
  
  for (const font of fontsToLoad) {
    try {
      await figma.loadFontAsync(font);
    } catch (e) {
      console.warn(`Could not load font ${font.family} ${font.style}:`, e);
    }
  }

  // TITLE
  const title = figma.createText();
  title.characters = 'LiaiZen Design System';
  title.fontSize = 48;
  title.fontName = { family: 'Inter', style: 'Bold' };
  title.fills = [{ type: 'SOLID', color: hexToRgb('#275559') }];
  styleGuidePage.appendChild(title);

  // COLORS SECTION
  const colorsSection = await createColorSection();
  styleGuidePage.appendChild(colorsSection);

  // TYPOGRAPHY SECTION
  const typographySection = await createTypographySection();
  styleGuidePage.appendChild(typographySection);

  // SHADOWS SECTION
  const shadowsSection = await createShadowsSection();
  styleGuidePage.appendChild(shadowsSection);

  // SPACING SECTION
  const spacingSection = createSpacingSection();
  styleGuidePage.appendChild(spacingSection);

  // Position in center of viewport
  figma.currentPage.appendChild(styleGuidePage);
  figma.viewport.scrollAndZoomIntoView([styleGuidePage]);
}

/**
 * Create color swatches section
 */
async function createColorSection(): Promise<FrameNode> {
  const section = figma.createFrame();
  section.name = 'Colors';
  section.resize(1280, 600);
  section.layoutMode = 'VERTICAL';
  section.primaryAxisSizingMode = 'AUTO';
  section.itemSpacing = 32;
  section.fills = [];

  // Section title
  const sectionTitle = figma.createText();
  sectionTitle.characters = 'Colors';
  sectionTitle.fontSize = 32;
  sectionTitle.fontName = { family: 'Inter', style: 'Bold' };
  sectionTitle.fills = [{ type: 'SOLID', color: hexToRgb('#111827') }];
  section.appendChild(sectionTitle);

  // Teal colors
  const tealFrame = createColorGroup('Teal Palette', LIAIZEN_TOKENS.colors.teal);
  section.appendChild(tealFrame);

  // Semantic colors
  const semanticFrame = createColorGroup('Semantic Colors', LIAIZEN_TOKENS.colors.semantic);
  section.appendChild(semanticFrame);

  // UI colors
  const uiColors = {
    background: LIAIZEN_TOKENS.colors.ui.background,
    surface: LIAIZEN_TOKENS.colors.ui.surface,
    border: LIAIZEN_TOKENS.colors.ui.border
  };
  const uiFrame = createColorGroup('UI Colors', uiColors);
  section.appendChild(uiFrame);

  return section;
}

/**
 * Create a color group with swatches
 */
function createColorGroup(title: string, colors: { [key: string]: string }): FrameNode {
  const group = figma.createFrame();
  group.name = title;
  group.resize(1280, 150);
  group.layoutMode = 'VERTICAL';
  group.primaryAxisSizingMode = 'AUTO';
  group.itemSpacing = 16;
  group.fills = [];

  // Group title
  const groupTitle = figma.createText();
  groupTitle.characters = title;
  groupTitle.fontSize = 20;
  // Use Medium instead of SemiBold for better compatibility
  groupTitle.fontName = { family: 'Inter', style: 'Medium' };
  groupTitle.fills = [{ type: 'SOLID', color: hexToRgb('#374151') }];
  group.appendChild(groupTitle);

  // Swatches row
  const swatchesRow = figma.createFrame();
  swatchesRow.name = 'Swatches';
  swatchesRow.resize(1280, 100);
  swatchesRow.layoutMode = 'HORIZONTAL';
  swatchesRow.primaryAxisSizingMode = 'AUTO';
  swatchesRow.itemSpacing = 16;
  swatchesRow.fills = [];

  Object.entries(colors).forEach(([name, hex]) => {
    const swatch = createColorSwatch(name, hex as string);
    swatchesRow.appendChild(swatch);
  });

  group.appendChild(swatchesRow);
  return group;
}

/**
 * Create a single color swatch
 */
function createColorSwatch(name: string, hex: string): FrameNode {
  const swatch = figma.createFrame();
  swatch.name = name;
  swatch.resize(120, 100);
  swatch.layoutMode = 'VERTICAL';
  swatch.primaryAxisSizingMode = 'AUTO';
  swatch.itemSpacing = 8;
  swatch.fills = [];

  // Color box
  const colorBox = figma.createRectangle();
  colorBox.resize(120, 60);
  colorBox.fills = [{ type: 'SOLID', color: hexToRgb(hex) }];
  colorBox.cornerRadius = 8;
  swatch.appendChild(colorBox);

  // Label
  const label = figma.createText();
  label.characters = `${name}\n${hex}`;
  label.fontSize = 11;
  label.fontName = { family: 'Inter', style: 'Medium' };
  label.fills = [{ type: 'SOLID', color: hexToRgb('#6b7280') }];
  swatch.appendChild(label);

  return swatch;
}

/**
 * Create typography section
 */
async function createTypographySection(): Promise<FrameNode> {
  const section = figma.createFrame();
  section.name = 'Typography';
  section.resize(1280, 800);
  section.layoutMode = 'VERTICAL';
  section.primaryAxisSizingMode = 'AUTO';
  section.itemSpacing = 24;
  section.fills = [];

  // Section title
  const sectionTitle = figma.createText();
  sectionTitle.characters = 'Typography';
  sectionTitle.fontSize = 32;
  sectionTitle.fontName = { family: 'Inter', style: 'Bold' };
  sectionTitle.fills = [{ type: 'SOLID', color: hexToRgb('#111827') }];
  section.appendChild(sectionTitle);

  // Font sizes
  const sizes = Object.entries(LIAIZEN_TOKENS.typography.fontSize);
  for (const [sizeName, sizeValue] of sizes) {
    const specimen = figma.createText();
    specimen.characters = `${sizeName.toUpperCase()} - ${sizeValue}px - The quick brown fox jumps over the lazy dog`;
    specimen.fontSize = sizeValue as number;
    specimen.fontName = { family: 'Inter', style: 'Regular' };
    specimen.fills = [{ type: 'SOLID', color: hexToRgb('#111827') }];
    section.appendChild(specimen);
  }

  return section;
}

/**
 * Create shadows section
 */
async function createShadowsSection(): Promise<FrameNode> {
  const section = figma.createFrame();
  section.name = 'Shadows';
  section.resize(1280, 400);
  section.layoutMode = 'VERTICAL';
  section.primaryAxisSizingMode = 'AUTO';
  section.itemSpacing = 32;
  section.fills = [];

  // Section title
  const sectionTitle = figma.createText();
  sectionTitle.characters = 'Shadows';
  sectionTitle.fontSize = 32;
  sectionTitle.fontName = { family: 'Inter', style: 'Bold' };
  sectionTitle.fills = [{ type: 'SOLID', color: hexToRgb('#111827') }];
  section.appendChild(sectionTitle);

  // Shadow examples row
  const shadowsRow = figma.createFrame();
  shadowsRow.name = 'Shadow Examples';
  shadowsRow.resize(1280, 200);
  shadowsRow.layoutMode = 'HORIZONTAL';
  shadowsRow.primaryAxisSizingMode = 'AUTO';
  shadowsRow.itemSpacing = 24;
  shadowsRow.fills = [];

  Object.entries(LIAIZEN_TOKENS.shadows).forEach(([name, value]) => {
    const shadowBox = createShadowExample(name.toUpperCase(), value as string);
    shadowsRow.appendChild(shadowBox);
  });

  section.appendChild(shadowsRow);
  return section;
}

/**
 * Create a shadow example box
 */
function createShadowExample(name: string, shadowValue: string): FrameNode {
  const container = figma.createFrame();
  container.name = name;
  container.resize(150, 180);
  container.layoutMode = 'VERTICAL';
  container.primaryAxisSizingMode = 'AUTO';
  container.itemSpacing = 12;
  container.fills = [];

  // Shadow box
  const box = figma.createRectangle();
  box.resize(150, 150);
  box.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  box.cornerRadius = 12;
  box.effects = parseShadow(shadowValue);
  container.appendChild(box);

  // Label
  const label = figma.createText();
  label.characters = name;
  label.fontSize = 12;
  label.fontName = { family: 'Inter', style: 'Medium' };
  label.fills = [{ type: 'SOLID', color: hexToRgb('#6b7280') }];
  container.appendChild(label);

  return container;
}

/**
 * Create spacing section
 */
function createSpacingSection(): FrameNode {
  const section = figma.createFrame();
  section.name = 'Spacing';
  section.resize(1280, 600);
  section.layoutMode = 'VERTICAL';
  section.primaryAxisSizingMode = 'AUTO';
  section.itemSpacing = 24;
  section.fills = [];

  // Section title
  const sectionTitle = figma.createText();
  sectionTitle.characters = 'Spacing Scale';
  sectionTitle.fontSize = 32;
  sectionTitle.fontName = { family: 'Inter', style: 'Bold' };
  sectionTitle.fills = [{ type: 'SOLID', color: hexToRgb('#111827') }];
  section.appendChild(sectionTitle);

  // Spacing examples
  Object.entries(LIAIZEN_TOKENS.spacing).forEach(([name, value]) => {
    const spacingItem = createSpacingItem(name.toUpperCase(), value as number);
    section.appendChild(spacingItem);
  });

  return section;
}

/**
 * Create a spacing item
 */
function createSpacingItem(name: string, pixels: number): FrameNode {
  const item = figma.createFrame();
  item.name = name;
  item.resize(1280, 60);
  item.layoutMode = 'HORIZONTAL';
  item.primaryAxisSizingMode = 'AUTO';
  item.itemSpacing = 24;
  item.fills = [];
  item.counterAxisAlignItems = 'CENTER';

  // Label
  const label = figma.createText();
  label.characters = `${name} - ${pixels}px`;
  label.fontSize = 14;
  label.fontName = { family: 'Inter', style: 'Medium' };
  label.fills = [{ type: 'SOLID', color: hexToRgb('#374151') }];
  label.resize(150, 20);
  item.appendChild(label);

  // Visual spacing bar
  const spacingBar = figma.createRectangle();
  spacingBar.resize(pixels, 40);
  spacingBar.fills = [{ type: 'SOLID', color: hexToRgb('#4DA8B0') }];
  spacingBar.cornerRadius = 4;
  item.appendChild(spacingBar);

  return item;
}

/**
 * Helper: Create a color style
 */
function createColorStyle(name: string, hex: string) {
  // Check if style already exists
  const existing = figma.getLocalPaintStyles().find(s => s.name === name);
  if (existing) {
    existing.paints = [{
      type: 'SOLID',
      color: hexToRgb(hex)
    }];
    return;
  }

  const style = figma.createPaintStyle();
  style.name = name;
  style.paints = [{
    type: 'SOLID',
    color: hexToRgb(hex)
  }];
}

/**
 * Helper: Create a text style
 */
async function createTextStyle(name: string, fontFamily: string, fontSize: number, fontWeight: string) {
  // Check if style already exists
  const existing = figma.getLocalTextStyles().find(s => s.name === name);

  // Load the font before setting it with safe loading
  const styleName = mapWeightToStyle(fontWeight);
  const loaded = await loadFontSafe(fontFamily, styleName);
  
  if (!loaded) {
    // Fallback to Inter Regular if font loading fails
    await loadFontSafe('Inter', 'Regular');
    fontFamily = 'Inter';
    fontWeight = '400';
  }

  if (existing) {
    existing.fontName = { family: fontFamily, style: mapWeightToStyle(fontWeight) };
    existing.fontSize = fontSize;
    return;
  }

  const style = figma.createTextStyle();
  style.name = name;
  style.fontName = { family: fontFamily, style: mapWeightToStyle(fontWeight) };
  style.fontSize = fontSize;
}

/**
 * Helper: Create an effect style (shadow)
 */
function createEffectStyle(name: string, shadowValue: string) {
  // Check if style already exists
  const existing = figma.getLocalEffectStyles().find(s => s.name === name);

  // Parse CSS box-shadow to Figma effect format
  const effects = parseShadow(shadowValue);

  if (existing) {
    existing.effects = effects;
    return;
  }

  const style = figma.createEffectStyle();
  style.name = name;
  style.effects = effects;
}

/**
 * Helper: Convert hex color to RGB
 */
function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : { r: 0, g: 0, b: 0 };
}

/**
 * Helper: Parse CSS box-shadow to Figma effects
 */
function parseShadow(shadowString: string): Effect[] {
  const shadows = shadowString.split(',').map(s => s.trim());
  return shadows.map(shadow => {
    const parts = shadow.match(/(-?\d+(?:\.\d+)?(?:px)?)/g) || [];
    const rgba = shadow.match(/rgba?\(([^)]+)\)/);

    const x = parseFloat(parts[0] || '0') || 0;
    const y = parseFloat(parts[1] || '0') || 0;
    const blur = parseFloat(parts[2] || '0') || 0;
    const spread = parseFloat(parts[3] || '0') || 0;

    let color = { r: 0, g: 0, b: 0 };
    let opacity = 0.1;

    if (rgba) {
      const values = rgba[1].split(',').map(v => parseFloat(v.trim()));
      color = {
        r: values[0] / 255,
        g: values[1] / 255,
        b: values[2] / 255
      };
      opacity = values[3] || 1;
    }

    return {
      type: 'DROP_SHADOW',
      color: { r: color.r, g: color.g, b: color.b, a: opacity },
      offset: { x: x, y: y },
      radius: blur,
      spread: spread,
      visible: true,
      blendMode: 'NORMAL'
    } as Effect;
  });
}

/**
 * Helper: Map font weight number to Figma style name
 */
function mapWeightToStyle(weight: string): string {
  const weightMap: { [key: string]: string } = {
    '400': 'Regular',
    '500': 'Medium',
    '600': 'Semi Bold', // Use "Semi Bold" with space for Figma compatibility
    '700': 'Bold'
  };
  return weightMap[weight] || 'Regular';
}

/**
 * Helper: Load font with fallback
 */
async function loadFontSafe(family: string, style: string): Promise<boolean> {
  try {
    await figma.loadFontAsync({ family, style });
    return true;
  } catch (e) {
    // Try alternative style names
    const alternatives: { [key: string]: string[] } = {
      'Semi Bold': ['SemiBold', '600', 'Medium'],
      'SemiBold': ['Semi Bold', '600', 'Medium'],
    };
    
    if (alternatives[style]) {
      for (const alt of alternatives[style]) {
        try {
          await figma.loadFontAsync({ family, style: alt });
          return true;
        } catch (e2) {
          continue;
        }
      }
    }
    
    // Fallback to Regular
    try {
      await figma.loadFontAsync({ family, style: 'Regular' });
      return true;
    } catch (e3) {
      return false;
    }
  }
}

/**
 * Helper: Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Extract design tokens from the current file
 */
async function extractDesignTokens() {
  const tokens: DesignTokens = {
    colors: {
      teal: {},
      semantic: {},
      ui: {}
    },
    spacing: {},
    typography: {},
    borderRadius: {},
    shadows: {}
  };

  // Extract colors from local styles
  const colorStyles = figma.getLocalPaintStyles();
  colorStyles.forEach(style => {
    const paint = style.paints[0];
    if (paint && paint.type === 'SOLID') {
      const color = rgbToHex(paint.color);
      const name = style.name.toLowerCase();
      
      // Extract teal colors
      if (name.includes('teal')) {
        if (name.includes('lightest')) tokens.colors.teal.lightest = color;
        else if (name.includes('light')) tokens.colors.teal.light = color;
        else if (name.includes('medium')) tokens.colors.teal.medium = color;
        else if (name.includes('darkest')) tokens.colors.teal.darkest = color;
        else if (name.includes('dark')) tokens.colors.teal.dark = color;
      }
      
      // Extract semantic colors
      if (name.includes('success')) tokens.colors.semantic.success = color;
      else if (name.includes('warning')) tokens.colors.semantic.warning = color;
      else if (name.includes('error') || name.includes('danger')) tokens.colors.semantic.error = color;
      else if (name.includes('info')) tokens.colors.semantic.info = color;
    }
  });

  // Extract spacing from components (common spacing values)
  const spacingValues = [4, 8, 16, 24, 32, 48, 64];
  spacingValues.forEach(value => {
    tokens.spacing[value === 4 ? 'xs' : value === 8 ? 'sm' : value === 16 ? 'md' : value === 24 ? 'lg' : value === 32 ? 'xl' : value === 48 ? '2xl' : '3xl'] = `${value}px`;
  });

  // Extract typography from text styles
  const textStyles = figma.getLocalTextStyles();
  if (textStyles.length > 0) {
    const sampleStyle = textStyles[0];
    // Handle fontName - text styles always have a font name
    tokens.typography.fontFamily = sampleStyle.fontName.family || 'Inter';

    // Extract font sizes
    const fontSizeMap: { [key: string]: string } = {};
    textStyles.forEach(style => {
      // Text styles always have a fontSize value
      const size = Math.round(style.fontSize as number);
      if (size === 12) fontSizeMap.xs = '12px';
      else if (size === 14) fontSizeMap.sm = '14px';
      else if (size === 16) fontSizeMap.base = '16px';
      else if (size === 18) fontSizeMap.lg = '18px';
      else if (size === 20) fontSizeMap.xl = '20px';
      else if (size === 24) fontSizeMap['2xl'] = '24px';
    });
    tokens.typography.fontSize = fontSizeMap;
  }

  // Extract border radius from common values
  tokens.borderRadius = {
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    full: '9999px'
  };

  figma.ui.postMessage({ 
    type: 'tokens-extracted', 
    tokens 
  });
}

/**
 * Sync tokens to backend API
 */
async function syncTokensToBackend() {
  // First extract tokens
  await extractDesignTokens();
  
  // Note: The actual sync would happen in the UI after extraction
  figma.ui.postMessage({ 
    type: 'sync-started' 
  });
}

/**
 * Export selected component as code
 */
async function exportSelectedComponent() {
  const selection = figma.currentPage.selection;
  
  if (selection.length === 0) {
    figma.ui.postMessage({ 
      type: 'error', 
      message: 'Please select a component or frame to export' 
    });
    return;
  }

  const node = selection[0];

  // Extract component properties
  const componentData: ComponentData = {
    id: node.id,
    name: node.name,
    type: node.type,
    width: Math.round(node.width),
    height: Math.round(node.height),
    x: Math.round(node.x),
    y: Math.round(node.y),
    properties: {},
    styles: {}
  };

  // Extract fill styles if available
  if ('fills' in node && node.fills && Array.isArray(node.fills)) {
    const fills = node.fills.filter(fill => fill.type === 'SOLID');
    if (fills.length > 0) {
      componentData.styles.backgroundColor = rgbToHex((fills[0] as SolidPaint).color);
    }
  }

  // Extract corner radius if available
  if ('cornerRadius' in node && typeof node.cornerRadius === 'number') {
    componentData.styles.borderRadius = `${Math.round(node.cornerRadius)}px`;
  }

  // Extract typography if it's a text node
  if (node.type === 'TEXT') {
    const textNode = node as TextNode;

    // Handle fontSize (can be mixed)
    if (typeof textNode.fontSize === 'number') {
      componentData.styles.fontSize = `${Math.round(textNode.fontSize)}px`;
    }

    // Handle fontName (can be mixed) - check if it has the family property
    const fontName = textNode.fontName;
    if (typeof fontName === 'object' && fontName !== null && 'family' in fontName) {
      componentData.styles.fontFamily = fontName.family;
      componentData.styles.fontWeight = fontName.style;
    }

    // Handle text color
    componentData.styles.color = textNode.fills && Array.isArray(textNode.fills) && textNode.fills[0].type === 'SOLID'
      ? rgbToHex((textNode.fills[0] as SolidPaint).color)
      : '#000';
  }

  // If it's a component, extract component properties
  if (node.type === 'COMPONENT') {
    const component = node as ComponentNode;
    componentData.properties = {
      description: component.description || '',
      variantProperties: component.variantProperties || {}
    };
  }

  figma.ui.postMessage({ 
    type: 'component-exported', 
    component: componentData 
  });
}

/**
 * Send current file information
 */
async function sendFileInfo() {
  const fileInfo = {
    fileKey: figma.fileKey || 'unknown',
    fileName: figma.root.name,
    pageCount: figma.root.children.length,
    styles: {
      colors: figma.getLocalPaintStyles().length,
      text: figma.getLocalTextStyles().length,
      effects: figma.getLocalEffectStyles().length
    }
  };

  figma.ui.postMessage({ 
    type: 'file-info', 
    info: fileInfo 
  });
}

/**
 * Convert RGB color to hex
 */
function rgbToHex(color: RGB): string {
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Fetch components from backend and sync to Figma
 */
async function syncComponentsFromCode(pageType: string = 'wireframes') {
  try {
    figma.ui.postMessage({ type: 'sync-started' });

    // Fetch components from backend
    const response = await fetch(`${apiUrl}/api/figma/sync-components`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pageType: pageType || 'wireframes',
        fileKey: figma.fileKey || null,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.success && data.data) {
      // Create structure in Figma with pageType from request
      await createStructureFromData(data.data.structure, pageType);
      
      const typeName = pageType === 'design' ? 'design pages' : 'wireframes';
      figma.ui.postMessage({
        type: 'sync-complete',
        message: `✅ Created ${data.data.components.length} ${typeName} from codebase!`,
        components: data.data.components.map((c: any) => c.name),
      });
      
      figma.notify(`✅ Created ${data.data.components.length} ${typeName}!`);
    }
  } catch (error) {
    figma.ui.postMessage({
      type: 'error',
      message: `Sync failed: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

/**
 * Fetch component list from backend
 */
async function fetchComponentsFromBackend() {
  try {
    const response = await fetch(`${apiUrl}/api/figma/scan-components`);
    
    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.success) {
      figma.ui.postMessage({
        type: 'components-fetched',
        components: data.components,
        count: data.count,
      });
    }
  } catch (error) {
    figma.ui.postMessage({
      type: 'error',
      message: `Failed to fetch components: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

/**
 * Create Figma structure from component data
 */
async function createStructureFromData(structure: any, pageType: string = 'wireframes') {
  if (!structure || !structure.children) {
    throw new Error('Invalid structure data');
  }

  // Determine page name based on type
  const pageName = pageType === 'design' ? '🎨 Design Pages from Code' : '📐 Wireframes from Code';
  
  // Create a new page for wireframes/designs if it doesn't exist
  let targetPage = figma.currentPage.children.find(
    (node) => node.type === 'FRAME' && (node.name.includes('Wireframes') || node.name.includes('Design Pages'))
  ) as FrameNode;

  if (!targetPage) {
    targetPage = figma.createFrame();
    targetPage.name = pageName;
    targetPage.resize(1440, 5000);
    targetPage.layoutMode = 'VERTICAL';
    targetPage.primaryAxisSizingMode = 'AUTO';
    targetPage.itemSpacing = 64;
    
    // Different background for design pages vs wireframes
    if (pageType === 'design') {
      // Gradient background matching app design
      targetPage.fills = [{
        type: 'GRADIENT_LINEAR',
        gradientStops: [
          { position: 0, color: { r: 0.9, g: 0.97, b: 0.96, a: 1 } }, // teal-lightest
          { position: 1, color: { r: 1, g: 1, b: 1, a: 1 } } // white
        ],
        gradientTransform: [[1, 0, 0], [0, 1, 0]]
      }];
    } else {
      // Simple gray background for wireframes
      targetPage.fills = [{ type: 'SOLID', color: { r: 0.98, g: 0.98, b: 0.98 } }];
    }
    
    figma.currentPage.appendChild(targetPage);
  } else {
    // Update name if switching between wireframes and design
    targetPage.name = pageName;
  }

  let currentY = 80; // Start position

  // Create frames for each component
  for (const child of structure.children) {
    const frame = await createFrameFromStructure(child, { x: 80, y: currentY }, pageType);
    targetPage.appendChild(frame);
    currentY += frame.height + 64;
  }

  // Resize page to fit all content
  targetPage.resize(1440, currentY + 80);
  
  // Scroll to view
  figma.viewport.scrollAndZoomIntoView([targetPage]);
}

/**
 * Recursively create Figma elements from structure data
 */
async function createFrameFromStructure(structure: any, position: { x: number; y: number }, pageType: string = 'wireframes'): Promise<FrameNode> {
  const frame = figma.createFrame();
  frame.name = structure.name || 'Component';
  frame.x = position.x;
  frame.y = position.y;
  frame.resize(structure.width || 1280, structure.height || 800);
  
  // Apply background (support gradients)
  if (structure.fills && Array.isArray(structure.fills)) {
    frame.fills = structure.fills.map((fill: any) => {
      if (fill.type === 'GRADIENT_LINEAR' && fill.gradientStops) {
        return {
          type: 'GRADIENT_LINEAR',
          gradientStops: fill.gradientStops.map((stop: any) => ({
            position: stop.position || 0,
            color: stop.color || { r: 1, g: 1, b: 1 },
          })),
          gradientTransform: fill.gradientTransform || [[1, 0, 0], [0, 1, 0]],
        };
      } else if (fill.type === 'SOLID' && fill.color) {
        return { type: 'SOLID', color: fill.color };
      }
      return fill;
    });
  } else if (structure.background) {
    frame.fills = [{ type: 'SOLID', color: structure.background }];
  } else {
    frame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  }
  
  // Apply border radius
  if (structure.cornerRadius) {
    frame.cornerRadius = structure.cornerRadius;
  }
  
  // Apply strokes (borders)
  if (structure.strokes && Array.isArray(structure.strokes) && structure.strokes.length > 0) {
    frame.strokes = structure.strokes.map((stroke: any) => {
      if (stroke.type === 'SOLID' && stroke.color) {
        return { type: 'SOLID', color: stroke.color };
      }
      return stroke;
    });
    frame.strokeWeight = structure.strokeWeight || 1;
    frame.strokeAlign = 'INSIDE';
  }
  
  // Apply effects (shadows)
  if (structure.effects && Array.isArray(structure.effects)) {
    frame.effects = structure.effects.map((effect: any) => {
      if (effect.type === 'DROP_SHADOW') {
        return {
          type: 'DROP_SHADOW',
          color: effect.color || { r: 0, g: 0, b: 0, a: 0.1 },
          offset: effect.offset || { x: 0, y: 2 },
          radius: effect.radius || 8,
          spread: effect.spread || 0,
          visible: effect.visible !== false,
          blendMode: effect.blendMode || 'NORMAL',
        };
      }
      return effect;
    });
  }

  // Set layout
  if (structure.layoutMode) {
    frame.layoutMode = structure.layoutMode;
    frame.primaryAxisSizingMode = 'AUTO';
    frame.counterAxisSizingMode = 'FIXED';
    frame.itemSpacing = 16;
    frame.paddingLeft = 32;
    frame.paddingRight = 32;
    frame.paddingTop = 32;
    frame.paddingBottom = 32;
  }

  // Load fonts if needed with safe loading
  await loadFontSafe('Inter', 'Regular');
  await loadFontSafe('Inter', 'Medium');
  await loadFontSafe('Inter', 'Semi Bold');
  await loadFontSafe('Inter', 'Bold');

  // Add title
  const title = figma.createText();
  title.characters = structure.name || 'Component';
  title.fontSize = 24;
  title.fontName = { family: 'Inter', style: 'Bold' };
  title.fills = [{ type: 'SOLID', color: { r: 0.15, g: 0.27, b: 0.35 } }]; // Teal dark
  frame.appendChild(title);

  // Create child elements
  if (structure.children && Array.isArray(structure.children)) {
    let childY = 60; // Below title
    
    for (const child of structure.children) {
      const element = await createElementFromStructure(child, { x: 32, y: childY });
      frame.appendChild(element);
      childY += element.height + 16;
    }
  }

  return frame;
}

/**
 * Create a Figma element from structure data
 */
async function createElementFromStructure(element: any, position: { x: number; y: number }): Promise<SceneNode> {
  let figmaElement: SceneNode;

  if (element.type === 'TEXT') {
    const text = figma.createText();
    text.characters = element.characters || element.text || element.name || 'Text';
    text.fontSize = element.fontSize || 16;
    text.fontName = { family: element.fontFamily || 'Inter', style: 'Regular' };
    text.x = position.x;
    text.y = position.y;
    
    if (element.styles && element.styles.textColor) {
      const color = hexToRgb(element.styles.textColor);
      text.fills = [{ type: 'SOLID', color }];
    } else {
      text.fills = [{ type: 'SOLID', color: { r: 0.07, g: 0.09, b: 0.15 } }];
    }
    
    figmaElement = text;
  } else {
    // Create frame for elements that might have children, or rectangle for simple elements
    const hasChildren = element.children && Array.isArray(element.children) && element.children.length > 0;
    
    let container: FrameNode | RectangleNode;
    
    if (hasChildren) {
      // Use frame for elements with children
      container = figma.createFrame();
      container.layoutMode = 'VERTICAL';
      container.primaryAxisSizingMode = 'AUTO';
      container.counterAxisSizingMode = 'FIXED';
      container.itemSpacing = 8;
      container.paddingLeft = 8;
      container.paddingRight = 8;
      container.paddingTop = 8;
      container.paddingBottom = 8;
    } else {
      // Use rectangle for simple elements
      container = figma.createRectangle();
    }
    
    container.x = position.x;
    container.y = position.y;
    container.resize(element.width || 200, element.height || 60);
    
    // Apply fills (support gradients and solid colors)
    if (element.fills && element.fills.length > 0) {
      // Process fills to handle gradients
      container.fills = element.fills.map((fill: any) => {
        if (fill.type === 'GRADIENT_LINEAR' && fill.gradientStops) {
          return {
            type: 'GRADIENT_LINEAR',
            gradientStops: fill.gradientStops.map((stop: any) => ({
              position: stop.position || 0,
              color: stop.color || { r: 1, g: 1, b: 1 },
            })),
            gradientTransform: fill.gradientTransform || [[1, 0, 0], [0, 1, 0]],
          };
        } else if (fill.type === 'SOLID' && fill.color) {
          return { type: 'SOLID', color: fill.color };
        }
        return fill;
      });
    } else if (element.styles && element.styles.backgroundColor) {
      const color = hexToRgb(element.styles.backgroundColor);
      container.fills = [{ type: 'SOLID', color }];
    } else {
      container.fills = [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }];
    }
    
    // Apply border radius
    if (element.cornerRadius && 'cornerRadius' in container) {
      container.cornerRadius = element.cornerRadius;
    } else if (element.styles && element.styles.borderRadius && 'cornerRadius' in container) {
      container.cornerRadius = element.styles.borderRadius;
    } else if ('cornerRadius' in container) {
      container.cornerRadius = 8;
    }
    
    // Apply strokes (borders)
    if (element.strokes && Array.isArray(element.strokes) && element.strokes.length > 0) {
      container.strokes = element.strokes.map((stroke: any) => {
        if (stroke.type === 'SOLID' && stroke.color) {
          return { type: 'SOLID', color: stroke.color };
        }
        return stroke;
      });
      container.strokeWeight = element.strokeWeight || 1;
      container.strokeAlign = 'INSIDE';
    }
    
    // Apply effects (shadows)
    if (element.effects && Array.isArray(element.effects)) {
      container.effects = element.effects.map((effect: any) => {
        if (effect.type === 'DROP_SHADOW') {
          return {
            type: 'DROP_SHADOW',
            color: effect.color || { r: 0, g: 0, b: 0, a: 0.1 },
            offset: effect.offset || { x: 0, y: 2 },
            radius: effect.radius || 8,
            spread: effect.spread || 0,
            visible: effect.visible !== false,
            blendMode: effect.blendMode || 'NORMAL',
          };
        }
        return effect;
      });
    }
    
    container.name = element.name || element.type || 'Element';
    
    // Note: For rectangles, we can't add text labels as children in Figma
    // The name property above will show in the layer panel
    // For better labels, we'd need to create a frame with both rectangle and text
    
    // Recursively add children (only if container is a frame)
    if (hasChildren && container.type === 'FRAME') {
      const frame = container as FrameNode;
      for (const child of element.children) {
        const childElement = await createElementFromStructure(child, { x: 0, y: 0 });
        frame.appendChild(childElement);
      }
    }
    
    figmaElement = container;
  }

  return figmaElement;
}

// Show UI on plugin start
figma.showUI(__html__, { 
  width: 400, 
  height: 600,
  themeColors: true
});

// Send initial file info
sendFileInfo();

