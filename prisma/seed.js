const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Superbia / FA Meeting Templates...');

  let bundlePath = path.join(__dirname, 'templates_bundle.json');
  if (!fs.existsSync(bundlePath)) {
    bundlePath = path.join(__dirname, '../../all_marloo_templates_bundle.json');
  }

  let rawBundle = fs.readFileSync(bundlePath, 'utf8').replace(/^\uFEFF/, '');
  rawBundle = rawBundle.replace(/Marloo/g, 'Superbia').replace(/marloo/g, 'superbia');
  const bundle = JSON.parse(rawBundle);

  await prisma.template.deleteMany();

  for (const item of bundle) {
    const data = item.data;
    const globalInstructions = JSON.stringify(data.globalInstructions || []);
    const sections = JSON.stringify(data.sections || []);

    await prisma.template.create({
      data: {
        id: item.id,
        name: item.name,
        category: item.category || 'Wealth',
        scope: 'Company',
        icon: item.icon || '📋',
        globalInstructions: globalInstructions,
        sections: sections,
      },
    });
    console.log('Seeded: ' + item.name + ' (' + item.category + ')');
  }

  console.log('Seeding complete! All 11 templates ready.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });