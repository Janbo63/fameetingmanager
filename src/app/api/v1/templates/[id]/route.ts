import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/v1/templates/:id
 * Developer endpoint to fetch full prompt details, sections, and directives of a template.
 * The :id parameter can be either the primary UUID (id) OR the human-readable internal ID (internalId, e.g. DOC-001).
 *
 * Query parameters:
 *  - tier: 'simple' | 'standard' | 'complex' (defaults to 'standard')
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const identifier = params.id;
    const { searchParams } = new URL(req.url);
    const requestedTier = (searchParams.get('tier') || 'standard').toLowerCase();

    // Query by either internalId OR id
    const template = await prisma.template.findFirst({
      where: {
        OR: [
          { internalId: identifier },
          { id: identifier },
        ],
      },
    });

    if (!template) {
      return NextResponse.json(
        { success: false, error: `Template with identifier '${identifier}' not found.` },
        { status: 404 }
      );
    }

    let globalInstructions: string[] = [];
    let sections: Record<string, unknown>[] = [];
    let variants: Record<string, { current?: { globalInstructions?: string[]; sections?: Record<string, unknown>[] } }> = {};

    try {
      globalInstructions = JSON.parse(template.globalInstructions);
    } catch {}
    try {
      sections = JSON.parse(template.sections);
    } catch {}
    try {
      if (template.variants) variants = JSON.parse(template.variants);
    } catch {}

    const availableTiers = Object.keys(variants).length > 0 ? Object.keys(variants) : ['standard'];

    // Select the requested tier if available, otherwise fallback to standard
    let activeTierData = variants[requestedTier]?.current;
    if (!activeTierData && variants['standard']?.current) {
      activeTierData = variants['standard'].current;
    }

    const tierInstructions = activeTierData?.globalInstructions || globalInstructions;
    const tierSections = activeTierData?.sections || sections;

    return NextResponse.json({
      success: true,
      template: {
        id: template.id,
        internalId: template.internalId,
        name: template.name,
        type: template.type,
        category: template.category,
        scope: template.scope,
        icon: template.icon,
        activeTier: variants[requestedTier] ? requestedTier : 'standard',
        availableTiers,
        globalInstructions: tierInstructions,
        sections: tierSections,
        sectionCount: tierSections.length,
        variants,
        updatedAt: template.updatedAt.toISOString(),
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}