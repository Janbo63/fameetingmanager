import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export interface TierVariantData {
  current: {
    globalInstructions: string[];
    sections: Record<string, unknown>[];
    updatedAt: string;
  };
  previous?: {
    globalInstructions: string[];
    sections: Record<string, unknown>[];
    savedAt: string;
  };
}

export interface VariantsMap {
  simple?: TierVariantData;
  standard?: TierVariantData;
  complex?: TierVariantData;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const template = await prisma.template.findUnique({
      where: { id: params.id },
    });

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    let globalInstructions: string[] = [];
    let sections: Record<string, unknown>[] = [];
    try {
      globalInstructions = JSON.parse(template.globalInstructions);
    } catch {
      globalInstructions = [];
    }
    try {
      sections = JSON.parse(template.sections);
    } catch {
      sections = [];
    }

    let variants: VariantsMap = {};
    try {
      if (template.variants) {
        variants = JSON.parse(template.variants);
      }
    } catch {
      variants = {};
    }

    // Fallback: Ensure standard tier exists if variants is empty
    if (!variants.standard) {
      variants.standard = {
        current: {
          globalInstructions,
          sections,
          updatedAt: template.updatedAt.toISOString(),
        },
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        ...template,
        globalInstructions,
        sections,
        variants,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { 
      name, 
      category, 
      scope, 
      icon, 
      tier = 'standard', 
      globalInstructions, 
      sections,
      action = 'save' // 'save' | 'revert' | 'create_variant'
    } = body;

    const existing = await prisma.template.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    let variants: VariantsMap = {};
    try {
      if (existing.variants) {
        variants = JSON.parse(existing.variants);
      }
    } catch {
      variants = {};
    }

    // Ensure baseline standard exists
    if (!variants.standard) {
      let baseInstructions = [];
      let baseSections = [];
      try { baseInstructions = JSON.parse(existing.globalInstructions); } catch {}
      try { baseSections = JSON.parse(existing.sections); } catch {}

      variants.standard = {
        current: {
          globalInstructions: baseInstructions,
          sections: baseSections,
          updatedAt: existing.updatedAt.toISOString(),
        },
      };
    }

    const targetTier = (tier as 'simple' | 'standard' | 'complex') || 'standard';

    if (action === 'revert') {
      // Restore previous version into current
      const tierObj = variants[targetTier];
      if (tierObj && tierObj.previous) {
        tierObj.current = {
          globalInstructions: tierObj.previous.globalInstructions,
          sections: tierObj.previous.sections,
          updatedAt: new Date().toISOString(),
        };
        // Clear previous or keep it as undone snapshot
        delete tierObj.previous;
      }
    } else if (action === 'create_variant') {
      // Create new variant tier
      variants[targetTier] = {
        current: {
          globalInstructions: globalInstructions || [],
          sections: sections || [],
          updatedAt: new Date().toISOString(),
        },
      };
    } else {
      // Standard Save: Archive existing current to previous, then update current
      const existingTier = variants[targetTier];
      const previousSnapshot = existingTier?.current ? {
        globalInstructions: existingTier.current.globalInstructions,
        sections: existingTier.current.sections,
        savedAt: existingTier.current.updatedAt || new Date().toISOString(),
      } : undefined;

      variants[targetTier] = {
        current: {
          globalInstructions: globalInstructions !== undefined ? globalInstructions : (existingTier?.current.globalInstructions || []),
          sections: sections !== undefined ? sections : (existingTier?.current.sections || []),
          updatedAt: new Date().toISOString(),
        },
        ...(previousSnapshot && { previous: previousSnapshot }),
      };
    }

    // Also sync top-level fields for backwards compatibility if updating standard tier
    const standardCurrent = variants.standard?.current;

    const updated = await prisma.template.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(scope && { scope }),
        ...(icon && { icon }),
        variants: JSON.stringify(variants),
        ...(standardCurrent && {
          globalInstructions: JSON.stringify(standardCurrent.globalInstructions),
          sections: JSON.stringify(standardCurrent.sections),
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...updated,
        variants,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.template.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true, message: 'Template deleted' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}