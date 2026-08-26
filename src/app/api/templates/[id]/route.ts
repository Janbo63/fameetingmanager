import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    let globalInstructions = [];
    let sections = [];
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

    return NextResponse.json({
      success: true,
      data: {
        ...template,
        globalInstructions,
        sections,
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
    const { name, category, scope, icon, globalInstructions, sections } = body;

    const updated = await prisma.template.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(scope && { scope }),
        ...(icon && { icon }),
        ...(globalInstructions !== undefined && {
          globalInstructions: JSON.stringify(globalInstructions),
        }),
        ...(sections !== undefined && {
          sections: JSON.stringify(sections),
        }),
      },
    });

    return NextResponse.json({ success: true, data: updated });
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