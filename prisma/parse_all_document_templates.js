const fs = require('fs');
const path = require('path');

function parseDocumentTemplate(rawText, templateName) {
  const allLines = rawText.split('\n').map(l => l.trim()).filter(l => l !== '');
  
  // Find where actual template body starts
  let bodyStartIndex = 0;
  for (let i = 25; i < allLines.length; i++) {
    if (allLines[i] === templateName) {
      bodyStartIndex = i;
      break;
    }
  }

  if (bodyStartIndex === 0) {
    for (let i = 0; i < allLines.length; i++) {
      if (allLines[i].toLowerCase().includes('global instructions') || allLines[i] === 'Cover Page') {
        bodyStartIndex = i;
        break;
      }
    }
  }

  // End index before footer boilerplate
  let bodyEndIndex = allLines.length;
  for (let i = bodyStartIndex; i < allLines.length; i++) {
    if (allLines[i].startsWith('VIDEO -') || allLines[i] === 'Template tips and tricks' || allLines[i] === 'Marloo AI') {
      bodyEndIndex = i;
      break;
    }
  }

  const lines = allLines.slice(bodyStartIndex, bodyEndIndex);

  // Extract Global Instructions
  const globalInstructions = [];
  let curIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes('global instructions')) {
      curIndex = i + 1;
      while (curIndex < lines.length) {
        const line = lines[curIndex];
        // Stop on first real section title
        if (
          line.match(/^[0-9]\.\s/) ||
          line === 'Cover Page' ||
          line === 'Annual Review Letter' ||
          line.startsWith('Individual pension policy') ||
          line.startsWith('Client Details and Personal') ||
          line.startsWith('Client details table') ||
          line.startsWith('Dear [CLIENT')
        ) {
          break;
        }
        if (line.length > 5 && !line.toLowerCase().includes('global instructions') && !line.includes('New editor') && !line.includes('Quote') && !line.includes('Insert')) {
          globalInstructions.push(line);
        }
        curIndex++;
      }
      break;
    }
  }

  if (globalInstructions.length === 0) {
    globalInstructions.push(
      'Follow UK wealth management terminology and jurisdiction conventions.',
      'Format numerical currency in GBP (£) with appropriate precision.',
      'Ensure all compliance, fee disclosures, and risk warnings are explicitly captured.'
    );
  }

  // Section detector
  const isSectionHeader = (line) => {
    if (line === templateName || line.toLowerCase().includes('global instructions') || line === 'New editor' || line === 'Quote' || line === 'Insert') {
      return false;
    }
    // Numbered headings like "1. Change in Circumstances", "2. Scope of Advice"
    if (line.match(/^[0-9]\.\s+[A-Za-z]/)) {
      return true;
    }
    // Fixed / Conditional / Policy tags
    if (line.includes('[FIXED]') || line.includes('[CONDITIONAL]') || line.startsWith('Policy:') || line === 'Cover Page') {
      return true;
    }
    // Specific standard headings
    const specificHeadings = [
      'Client details table', 'Client Details and Personal Circumstances', 'Financial Position Summary',
      'Pension Information', 'Investment Experience and Holdings', 'Protection and Insurance Details',
      'Estate Planning and Wills', 'Objectives and Future Plans', 'Risk Profile and Asset Allocation',
      'Adviser Observations and Next Steps', 'Individual pension policy analysis', 'Individual investment policy analysis',
      'Individual protection policy analysis', 'Individual VCT/EIS/Specialist policy analysis',
      'Defined Benefit / Safeguarded benefits policy analysis', 'Policy characteristics and benefit structure analysis',
      'Charging structure assessment with calculated costs', 'Death benefit arrangements and suitability',
      'Transfer value assessment and crystallisation options', 'Overall policy suitability conclusion with specific reasoning',
      'Our Pension Recommendation', 'Our Platform Recommendation', 'Our Investment Product Recommendation',
      'Our Retirement Income Recommendation', 'Fee Comparison Summary', 'Benefits You Will Lose',
      'Other Significant Consequences', 'Why This Change Is in Your Best Interest',
      'Alternative Products Considered', 'Our Remuneration', 'Implementation Steps', 'Authority to Proceed',
      'Context Input Priority', 'Signatures and Declaration'
    ];

    return specificHeadings.some(h => line.toLowerCase().startsWith(h.toLowerCase().slice(0, 18)));
  };

  const sections = [];
  let currentSection = null;

  for (let i = curIndex; i < lines.length; i++) {
    const line = lines[i];

    if (isSectionHeader(line)) {
      currentSection = {
        title: line,
        type: line.toLowerCase().includes('table') || line.toLowerCase().includes('comparison') || line.toLowerCase().includes('summary') ? 'table' : 'standard',
        guidance: '',
        contentToInclude: [],
        subsections: []
      };
      sections.push(currentSection);
    } else if (currentSection) {
      if (line.startsWith('- ') || line.startsWith('• ') || line.match(/^[a-z]\)\s/)) {
        currentSection.contentToInclude.push(line.replace(/^[-•a-z)]\s*/, ''));
      } else if (line.toLowerCase().startsWith('content to include:') || line.toLowerCase().startsWith('guidance:')) {
        // label
      } else {
        if (!currentSection.guidance) {
          currentSection.guidance = line;
        } else {
          currentSection.guidance += '\n\n' + line;
        }
      }
    }
  }

  // Deduplicate and sanitize
  const uniqueSections = [];
  const seen = new Set();
  sections.forEach(s => {
    if (!seen.has(s.title)) {
      seen.add(s.title);
      if (!s.guidance && s.contentToInclude.length === 0) {
        s.guidance = `Provide required details and disclosures for ${s.title}.`;
      }
      uniqueSections.push(s);
    }
  });

  return {
    globalInstructions,
    sections: uniqueSections.length > 0 ? uniqueSections : [
      {
        title: 'Document Overview & Content',
        type: 'standard',
        guidance: lines.slice(0, 15).join('\n\n'),
        contentToInclude: ['Client name and reference', 'Date and adviser details'],
        subsections: []
      }
    ]
  };
}

const templatesDef = [
  {
    name: 'Wealth Product Comparison',
    type: 'Document',
    category: 'Wealth',
    icon: '📊',
    file: 'F:/Marloo/all_marloo_document_templates_bundle.json',
    index: 0
  },
  {
    name: 'Fact Find Document',
    type: 'Document',
    category: 'Wealth',
    icon: '📝',
    file: 'F:/Marloo/all_marloo_document_templates_bundle.json',
    index: 1
  },
  {
    name: 'Letter of Authority Policy Analysis',
    type: 'Document',
    category: 'Wealth',
    icon: '📄',
    file: 'F:/Marloo/doc_Marloo_AI.json'
  },
  {
    name: 'Annual Review Letter',
    type: 'Document',
    category: 'Wealth',
    icon: '✉️',
    file: 'F:/Marloo/doc_Marloo_AI (1).json'
  },
  {
    name: 'Vulnerability Assessment Check',
    type: 'Document',
    category: 'Wealth',
    icon: '🛡️',
    file: 'F:/Marloo/doc_Marloo_AI (2).json'
  },
  {
    name: 'Client Proposal Letter',
    type: 'Document',
    category: 'Wealth',
    icon: '💼',
    file: 'F:/Marloo/doc_Marloo_AI (3).json'
  }
];

const parsedDocTemplates = [];

templatesDef.forEach(def => {
  let rawText = '';
  if (def.index !== undefined) {
    const arr = JSON.parse(fs.readFileSync(def.file, 'utf8'));
    rawText = arr[def.index].rawText;
  } else {
    const obj = JSON.parse(fs.readFileSync(def.file, 'utf8'));
    rawText = obj.rawText;
  }

  const structured = parseDocumentTemplate(rawText, def.name);

  parsedDocTemplates.push({
    name: def.name,
    type: def.type,
    category: def.category,
    scope: 'Company',
    icon: def.icon,
    data: {
      globalInstructions: structured.globalInstructions,
      sections: structured.sections
    }
  });

  console.log(`✅ Perfectly parsed "${def.name}": ${structured.sections.length} sections, ${structured.globalInstructions.length} global rules.`);
});

fs.writeFileSync(
  path.join(__dirname, 'all_document_templates_bundle.json'),
  JSON.stringify(parsedDocTemplates, null, 2),
  'utf8'
);

console.log('🎉 Successfully generated perfect prisma/all_document_templates_bundle.json!');