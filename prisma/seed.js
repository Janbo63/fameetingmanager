const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding FA Meeting & Document Templates with Multi-Tier Variants...');

  // 1. Meeting Templates Bundle
  let meetingBundlePath = path.join(__dirname, 'templates_bundle.json');
  if (!fs.existsSync(meetingBundlePath)) {
    meetingBundlePath = path.join(__dirname, '../../all_marloo_templates_bundle.json');
  }

  let rawMeetingBundle = fs.readFileSync(meetingBundlePath, 'utf8').replace(/^\uFEFF/, '');
  rawMeetingBundle = rawMeetingBundle.replace(/Marloo/g, 'Superbia').replace(/marloo/g, 'superbia');
  const meetingBundle = JSON.parse(rawMeetingBundle);

  // 2. Document Templates Bundle
  const docBundlePath = path.join(__dirname, 'all_document_templates_bundle.json');
  let docBundle = [];
  if (fs.existsSync(docBundlePath)) {
    docBundle = JSON.parse(fs.readFileSync(docBundlePath, 'utf8'));
  }

  const reviewDescriptive = meetingBundle.find(b => b.name === 'Review (Descriptive)');
  const adviceDescriptive = meetingBundle.find(b => b.name === 'Advice Presentation (Descriptive)');

  await prisma.template.deleteMany();

  // Seed Meeting Templates
  for (const item of meetingBundle) {
    if (item.name === 'Review (Descriptive)' || item.name === 'Advice Presentation (Descriptive)') {
      continue;
    }

    const data = item.data;
    const globalInstructions = data.globalInstructions || [];
    const sections = data.sections || [];

    const variantsObj = {
      standard: {
        current: {
          globalInstructions: globalInstructions,
          sections: sections,
          updatedAt: new Date().toISOString(),
        },
      },
    };

    if (item.name === 'Review' && reviewDescriptive) {
      variantsObj.complex = {
        current: {
          globalInstructions: reviewDescriptive.data.globalInstructions || globalInstructions,
          sections: reviewDescriptive.data.sections || [],
          updatedAt: new Date().toISOString(),
        },
      };
    }

    if (item.name === 'Advice Presentation' && adviceDescriptive) {
      variantsObj.complex = {
        current: {
          globalInstructions: adviceDescriptive.data.globalInstructions || globalInstructions,
          sections: adviceDescriptive.data.sections || [],
          updatedAt: new Date().toISOString(),
        },
      };
    }

    await prisma.template.create({
      data: {
        id: item.id || crypto.randomUUID(),
        name: item.name,
        type: 'Meeting',
        category: item.category || 'Wealth',
        scope: 'Company',
        icon: item.icon || '🎙️',
        globalInstructions: JSON.stringify(globalInstructions),
        sections: JSON.stringify(sections),
        variants: JSON.stringify(variantsObj),
      },
    });

    console.log('Seeded [Meeting]: ' + item.name);
  }

  // Seed Document Templates
  for (const item of docBundle) {
    const data = item.data;
    const globalInstructions = data.globalInstructions || [];
    const sections = data.sections || [];

    const variantsObj = {
      standard: {
        current: {
          globalInstructions: globalInstructions,
          sections: sections,
          updatedAt: new Date().toISOString(),
        },
      },
    };

    await prisma.template.create({
      data: {
        id: crypto.randomUUID(),
        name: item.name,
        type: 'Document',
        category: item.category || 'Wealth',
        scope: 'Company',
        icon: item.icon || '📄',
        globalInstructions: JSON.stringify(globalInstructions),
        sections: JSON.stringify(sections),
        variants: JSON.stringify(variantsObj),
      },
    });

    console.log('Seeded [Document]: ' + item.name);
  }

  console.log('🎉 Seeding complete! Seeded 10 Meeting Templates and 6 Document Templates.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });