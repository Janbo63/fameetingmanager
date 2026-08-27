const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding FA Meeting Templates with Tier Variants...');

  let bundlePath = path.join(__dirname, 'templates_bundle.json');
  if (!fs.existsSync(bundlePath)) {
    bundlePath = path.join(__dirname, '../../all_marloo_templates_bundle.json');
  }

  let rawBundle = fs.readFileSync(bundlePath, 'utf8').replace(/^\uFEFF/, '');
  rawBundle = rawBundle.replace(/Marloo/g, 'Superbia').replace(/marloo/g, 'superbia');
  const bundle = JSON.parse(rawBundle);

  // Find Review (Descriptive) if exists
  const reviewDescriptive = bundle.find(b => b.name === 'Review (Descriptive)');
  const adviceDescriptive = bundle.find(b => b.name === 'Advice Presentation (Descriptive)');

  await prisma.template.deleteMany();

  for (const item of bundle) {
    // Skip standalone (Descriptive) templates as they are merged into Complex tiers
    if (item.name === 'Review (Descriptive)') {
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

    // If Review, attach Review (Descriptive) as the Complex tier
    if (item.name === 'Review' && reviewDescriptive) {
      variantsObj.complex = {
        current: {
          globalInstructions: reviewDescriptive.data.globalInstructions || globalInstructions,
          sections: reviewDescriptive.data.sections || [],
          updatedAt: new Date().toISOString(),
        },
      };
      console.log('  -> Merged "Review (Descriptive)" into "Review [Complex Tier]"');
    }

    await prisma.template.create({
      data: {
        id: item.id,
        name: item.name,
        category: item.category || 'Wealth',
        scope: 'Company',
        icon: item.icon || '📋',
        globalInstructions: JSON.stringify(globalInstructions),
        sections: JSON.stringify(sections),
        variants: JSON.stringify(variantsObj),
      },
    });

    const activeTiers = Object.keys(variantsObj).join(', ');
    console.log('Seeded: ' + item.name + ' [' + activeTiers + ']');
  }

  console.log('Seeding complete! Review has both Standard and Complex tiers.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });