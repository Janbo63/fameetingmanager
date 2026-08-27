import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const scope = searchParams.get('scope') || '';

    const type = searchParams.get('type') || '';

    const where: Prisma.TemplateWhereInput = {};
    if (type) {
      where.type = type;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { category: { contains: search } },
      ];
    }
    if (category && category !== 'All') {
      where.category = category;
    }
    if (scope) {
      where.scope = scope;
    }

    const templates = await prisma.template.findMany({
      where,
      orderBy: [
        { order: 'asc' },
        { updatedAt: 'desc' },
      ],
    });

    const parsed = templates.map((t) => {
      let globalInstructions: string[] = [];
      let sections: Record<string, unknown>[] = [];
      let variants: Record<string, unknown> = {};
      try {
        globalInstructions = JSON.parse(t.globalInstructions);
      } catch {
        globalInstructions = [];
      }
      try {
        sections = JSON.parse(t.sections);
      } catch {
        sections = [];
      }
      try {
        if (t.variants) variants = JSON.parse(t.variants);
      } catch {
        variants = {};
      }

      const tiers = Object.keys(variants).length > 0 ? Object.keys(variants) : ['standard'];

      return {
        ...t,
        globalInstructions,
        sections,
        tiers,
        variants,
        sectionCount: sections.length,
      };
    });

    return NextResponse.json({ success: true, data: parsed });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, category = 'Wealth', scope = 'Company', icon = '📋', globalInstructions = [], sections = [] } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    const newTemplate = await prisma.template.create({
      data: {
        name,
        category,
        scope,
        icon,
        globalInstructions: JSON.stringify(globalInstructions),
        sections: JSON.stringify(sections),
      },
    });

    return NextResponse.json({ success: true, data: newTemplate });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}