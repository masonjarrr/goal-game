import { TIER_PALETTES, TierPalette } from '../../utils/spriteUtils';

const CANVAS_SIZE = 64;

interface DrawContext {
  ctx: CanvasRenderingContext2D;
  palette: TierPalette;
  tier: number;
}

/**
 * Draw a single pixel (or block of pixels for sub-pixel precision)
 */
function drawPixel(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, size = 1): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);
}

/**
 * Draw a rectangle of pixels
 */
function drawRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

/**
 * Draw the character's head
 */
function drawHead({ ctx, palette }: DrawContext): void {
  const headX = 28;
  const headY = 8;
  const headW = 8;
  const headH = 8;

  // Hair (back layer)
  drawRect(ctx, headX - 1, headY - 1, headW + 2, 4, palette.hair);

  // Face
  drawRect(ctx, headX, headY, headW, headH, palette.skin);

  // Hair top
  drawRect(ctx, headX, headY - 1, headW, 2, palette.hair);

  // Eyes
  drawPixel(ctx, headX + 2, headY + 3, '#2c3e50');
  drawPixel(ctx, headX + 5, headY + 3, '#2c3e50');
}

/**
 * Draw the character's body/torso
 */
function drawBody({ ctx, palette, tier }: DrawContext): void {
  const bodyX = 26;
  const bodyY = 16;
  const bodyW = 12;
  const bodyH = 16;

  // Main body
  drawRect(ctx, bodyX, bodyY, bodyW, bodyH, palette.primary);

  // Body detail (vertical line)
  drawRect(ctx, bodyX + 5, bodyY + 2, 2, bodyH - 4, palette.secondary);

  // Shoulders
  if (tier >= 2) {
    // Shoulder pads for chainmail+
    drawRect(ctx, bodyX - 2, bodyY, 3, 4, palette.accent);
    drawRect(ctx, bodyX + bodyW - 1, bodyY, 3, 4, palette.accent);
  }

  // Belt (tier 1+)
  if (tier >= 1) {
    drawRect(ctx, bodyX, bodyY + bodyH - 4, bodyW, 2, palette.secondary);
    // Belt buckle
    drawPixel(ctx, bodyX + 5, bodyY + bodyH - 4, palette.accent, 2);
  }

  // Chest plate detail (tier 3+)
  if (tier >= 3) {
    drawRect(ctx, bodyX + 2, bodyY + 2, 8, 6, palette.accent);
    drawRect(ctx, bodyX + 4, bodyY + 3, 4, 4, palette.secondary);
  }
}

/**
 * Draw the character's arms
 */
function drawArms({ ctx, palette, tier }: DrawContext): void {
  const armY = 18;
  const armH = 12;

  // Left arm
  drawRect(ctx, 22, armY, 4, armH, palette.primary);
  // Left hand
  drawRect(ctx, 22, armY + armH, 4, 3, palette.skin);

  // Right arm
  drawRect(ctx, 38, armY, 4, armH, palette.primary);
  // Right hand
  drawRect(ctx, 38, armY + armH, 4, 3, palette.skin);

  // Arm armor (tier 2+)
  if (tier >= 2) {
    drawRect(ctx, 22, armY, 4, 3, palette.accent);
    drawRect(ctx, 38, armY, 4, 3, palette.accent);
  }

  // Gauntlets (tier 4+)
  if (tier >= 4) {
    drawRect(ctx, 21, armY + armH - 2, 5, 5, palette.accent);
    drawRect(ctx, 38, armY + armH - 2, 5, 5, palette.accent);
  }
}

/**
 * Draw the character's legs
 */
function drawLegs({ ctx, palette, tier }: DrawContext): void {
  const legY = 32;
  const legH = 14;

  // Left leg
  drawRect(ctx, 27, legY, 5, legH, tier >= 3 ? palette.secondary : palette.primary);
  // Left boot
  drawRect(ctx, 26, legY + legH, 6, 4, palette.secondary);

  // Right leg
  drawRect(ctx, 32, legY, 5, legH, tier >= 3 ? palette.secondary : palette.primary);
  // Right boot
  drawRect(ctx, 32, legY + legH, 6, 4, palette.secondary);

  // Boot detail (tier 2+)
  if (tier >= 2) {
    drawRect(ctx, 26, legY + legH, 6, 2, palette.accent);
    drawRect(ctx, 32, legY + legH, 6, 2, palette.accent);
  }
}

/**
 * Draw a cape (tier 3+)
 */
function drawCape({ ctx, palette, tier }: DrawContext): void {
  if (tier < 3) return;

  const capeColors = {
    3: '#8b0000', // Red cape for Adept
    4: '#4a0082', // Purple cape for Expert
    5: '#1a1a2e', // Dark blue for Master
    6: '#4a0082', // Royal purple for Legend
    7: '#8b0000', // Dragon red for Dragonborn
  };

  const capeColor = capeColors[tier as keyof typeof capeColors] || palette.secondary;

  // Cape back (behind character)
  ctx.fillStyle = capeColor;
  ctx.beginPath();
  ctx.moveTo(24, 16);
  ctx.lineTo(40, 16);
  ctx.lineTo(42, 48);
  ctx.lineTo(22, 48);
  ctx.closePath();
  ctx.fill();

  // Cape edge highlight
  ctx.fillStyle = palette.accent;
  ctx.fillRect(22, 16, 2, 32);
  ctx.fillRect(40, 16, 2, 32);
}

/**
 * Draw a helmet (tier 2+)
 */
function drawHelmet({ ctx, palette, tier }: DrawContext): void {
  if (tier < 2) return;

  const headX = 28;
  const headY = 8;

  if (tier === 2) {
    // Simple leather cap
    drawRect(ctx, headX - 1, headY - 2, 10, 3, palette.secondary);
  } else if (tier >= 3 && tier < 7) {
    // Metal helmet
    drawRect(ctx, headX - 2, headY - 3, 12, 5, palette.accent);
    // Visor slit
    drawRect(ctx, headX, headY + 2, 8, 2, '#1a1a2e');

    // Plume for tier 4+
    if (tier >= 4) {
      drawRect(ctx, headX + 3, headY - 6, 2, 4, '#e74c3c');
    }
  }
}

/**
 * Draw a crown (tier 7 only)
 */
function drawCrown({ ctx, palette }: DrawContext): void {
  const crownColor = 'crown' in palette ? palette.crown : '#ffd700';
  const headX = 28;
  const headY = 8;

  // Crown base
  drawRect(ctx, headX - 2, headY - 4, 12, 3, crownColor);

  // Crown points
  drawPixel(ctx, headX - 1, headY - 6, crownColor, 2);
  drawPixel(ctx, headX + 3, headY - 7, crownColor, 2);
  drawPixel(ctx, headX + 7, headY - 6, crownColor, 2);

  // Jewels
  drawPixel(ctx, headX, headY - 5, '#e74c3c');
  drawPixel(ctx, headX + 4, headY - 6, '#3498db');
  drawPixel(ctx, headX + 8, headY - 5, '#2ecc71');
}

/**
 * Draw wings (tier 7 only)
 */
function drawWings({ ctx }: DrawContext): void {
  const wingColor = '#8b0000';
  const wingHighlight = '#ff4500';

  // Left wing
  ctx.fillStyle = wingColor;
  ctx.beginPath();
  ctx.moveTo(22, 20);
  ctx.lineTo(8, 10);
  ctx.lineTo(6, 16);
  ctx.lineTo(10, 24);
  ctx.lineTo(14, 32);
  ctx.lineTo(20, 36);
  ctx.lineTo(22, 28);
  ctx.closePath();
  ctx.fill();

  // Left wing membrane
  ctx.fillStyle = wingHighlight;
  ctx.beginPath();
  ctx.moveTo(20, 22);
  ctx.lineTo(12, 14);
  ctx.lineTo(12, 20);
  ctx.lineTo(16, 28);
  ctx.closePath();
  ctx.fill();

  // Right wing
  ctx.fillStyle = wingColor;
  ctx.beginPath();
  ctx.moveTo(42, 20);
  ctx.lineTo(56, 10);
  ctx.lineTo(58, 16);
  ctx.lineTo(54, 24);
  ctx.lineTo(50, 32);
  ctx.lineTo(44, 36);
  ctx.lineTo(42, 28);
  ctx.closePath();
  ctx.fill();

  // Right wing membrane
  ctx.fillStyle = wingHighlight;
  ctx.beginPath();
  ctx.moveTo(44, 22);
  ctx.lineTo(52, 14);
  ctx.lineTo(52, 20);
  ctx.lineTo(48, 28);
  ctx.closePath();
  ctx.fill();
}

/**
 * Draw glow effect for high tier characters
 */
function drawGlow(ctx: CanvasRenderingContext2D, tier: number): void {
  if (tier < 5) return;

  const palette = TIER_PALETTES[tier as keyof typeof TIER_PALETTES];
  const glowColor = 'glow' in palette ? palette.glow : '#ffd700';

  // Create radial gradient for glow
  const gradient = ctx.createRadialGradient(32, 32, 10, 32, 32, 40);
  gradient.addColorStop(0, `${glowColor}40`);
  gradient.addColorStop(0.5, `${glowColor}20`);
  gradient.addColorStop(1, `${glowColor}00`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
}

/**
 * Main render function - draws the complete character
 */
export function renderCharacter(ctx: CanvasRenderingContext2D, tier: number): void {
  // Clamp tier to valid range
  const validTier = Math.max(0, Math.min(7, tier));
  const palette = TIER_PALETTES[validTier as keyof typeof TIER_PALETTES];

  // Clear canvas
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  // Enable crisp pixel rendering
  ctx.imageSmoothingEnabled = false;

  const drawCtx: DrawContext = { ctx, palette, tier: validTier };

  // Draw in order (back to front)
  drawGlow(ctx, validTier);

  if (validTier >= 7) {
    drawWings(drawCtx);
  }

  if (validTier >= 3) {
    drawCape(drawCtx);
  }

  drawLegs(drawCtx);
  drawBody(drawCtx);
  drawArms(drawCtx);
  drawHead(drawCtx);

  if (validTier >= 7) {
    drawCrown(drawCtx);
  } else if (validTier >= 2) {
    drawHelmet(drawCtx);
  }
}

export { CANVAS_SIZE };
