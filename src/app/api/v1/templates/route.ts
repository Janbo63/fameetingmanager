import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * GET /api/v1/templates
 * Developer endpoint to list all available templates with internal IDs and metadata.
 * Query parameters:
 *  - type: 'Document' | 'Meeting'
 *  - category: 'Wealth' | 'Mortgages' | 'Protection' | 'Other'
 *  - search: string keyword
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || '';
    const category = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';

    const where: Prisma.TemplateWhereInput = {};
    if (type) {
      where.type = type;
    }
    if (category && category !== 'All') {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { internalId: { contains: search } },
        { category: { contains: search } },
      ];
    }

    const templates = await prisma.template.findMany({
      where,
      orderBy: [
        { order: 'asc' },
        { updatedAt: 'desc' },
      ],
    });

    const formatted = templates.map((t) => {
      let variants: Record<string, unknown> = {};
      let sectionsCount = 0;
      try {
        if (t.variants) variants = JSON.parse(t.variants);
      } catch {}
      try {
        const sections = JSON.parse(t.sections);
        sectionsCount = Array.isArray(sections) ? sections.length : 0;
      } catch {}

      const tiers = Object.keys(variants).length > 0 ? Object.keys(variants) : ['standard'];

      return {
        id: t.id,
        internalId: t.internalId,
        name: t.name,
        type: t.type,
        category: t.category,
        scope: t.scope,
        icon: t.icon,
        tiers: tiers,
        sectionCount: sectionsCount,
        updatedAt: t.updatedAt.toISOString(),
        endpoint: `/api/v1/templates/${t.internalId || t.id}`,
      };
    });

    return NextResponse.json({
      success: true,
      count: formatted.length,
      templates: formatted,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/v1/templates
 * Developer endpoint to import or create new template(s) programmatically.
 * Accepts either a single template object or an array of template objects.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items = Array.isArray(body) ? body : [body];

    const results = [];

    for (const item of items) {
      if (!item.name) {
        continue;
      }

      const type = item.type || 'Document';
      const category = item.category || 'Wealth';
      const scope = item.scope || 'Company';
      const icon = item.icon || (type === 'Document' ? '📄' : '🎙️');
      const globalInstructions = item.data?.globalInstructions || item.globalInstructions || [];
      const sections = item.data?.sections || item.sections || [];

      // Auto-generate internalId if not supplied
      let internalId = item.internalId;
      if (!internalId) {
        const prefix = type === 'Document' ? 'DOC' : 'MTG';
        const count = await prisma.template.count({ where: { type } });
        internalId = `${prefix}-${String(count + 1).padStart(3, '0')}`;
      }

      const variantsObj = item.variants || {
        standard: {
          current: {
            globalInstructions,
            sections,
            updatedAt: new Date().toISOString(),
          },
        },
      };

      const record = await prisma.template.create({
        data: {
          name: item.name,
          internalId,
          type,
          category,
          scope,
          icon,
          globalInstructions: JSON.stringify(globalInstructions),
          sections: JSON.stringify(sections),
          variants: JSON.stringify(variantsObj),
        },
      });

      results.push({
        id: record.id,
        internalId: record.internalId,
        name: record.name,
        type: record.type,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${results.length} template(s).`,
      imported: results,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}