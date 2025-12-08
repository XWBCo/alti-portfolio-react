/**
 * IPS Document Generator
 * Generates Investment Policy Statement Word documents using docx library
 * Based on AlTi's official IPS template format
 */

import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  PageBreak,
  ShadingType,
  convertInchesToTwip,
  ImageRun,
  Header,
  Footer,
  BorderStyle,
} from 'docx';
import * as fs from 'fs';
import * as path from 'path';
import type { IPSFields } from './types';

// Document content can be Paragraph or Table
type DocumentContent = Paragraph | Table;

// AlTi brand colors (hex without #)
const COLORS = {
  teal: '0F94A6',      // Section headers, TOC
  turquoise: '00E7D7', // Accent lines
  gray: '5A5A5A',      // Body text
  lightGray: '777777', // Subtitle text
  dark: '010203',
};

// Try to load logo from various possible paths
function getLogoBuffer(): Buffer | null {
  const possiblePaths = [
    path.join(process.cwd(), 'public', 'alti-logo-ips.png'),
    path.join(process.cwd(), 'public', 'alti-logo.jpg'),
    './public/alti-logo-ips.png',
    './public/alti-logo.jpg',
  ];

  for (const logoPath of possiblePaths) {
    try {
      if (fs.existsSync(logoPath)) {
        return fs.readFileSync(logoPath);
      }
    } catch {
      // Continue to next path
    }
  }
  return null;
}

/**
 * Generate IPS Word document
 */
export function generateIPSDocument(fields: IPSFields): Document {
  const logoBuffer = getLogoBuffer();

  // Create header with logo
  const headerChildren: Paragraph[] = [];
  if (logoBuffer) {
    headerChildren.push(
      new Paragraph({
        children: [
          new ImageRun({
            data: logoBuffer,
            transformation: { width: 150, height: 34 },
            type: 'png',
          }),
        ],
        alignment: AlignmentType.LEFT,
      })
    );
  }

  // Cover page content (first section - no header)
  const coverPageContent = createCoverPage(fields, logoBuffer);

  // Main content (second section - with header)
  const mainContent: DocumentContent[][] = [
    createTableOfContents(),
    createIntroduction(fields),
    createSectionI(fields),
    createSectionII(fields),
    createSectionIII(fields),
    createSectionIV(fields),
    createSectionV(fields),
    createSectionVI(fields),
    createSectionVII(fields),
    createSectionVIII(fields),
  ];

  return new Document({
    sections: [
      // Cover page section (no header/footer, title page)
      {
        properties: {
          titlePage: true,
        },
        children: coverPageContent,
      },
      // Main content section (with header containing logo)
      {
        headers: {
          default: new Header({
            children: headerChildren,
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: 'CONFIDENTIAL',
                    size: 18,
                    color: COLORS.lightGray,
                  }),
                ],
                alignment: AlignmentType.CENTER,
              }),
            ],
          }),
        },
        children: mainContent.flat(),
      },
    ],
  });
}

/**
 * Cover Page - matches AlTi template with logo and vertical accent line
 */
function createCoverPage(fields: IPSFields, logoBuffer: Buffer | null): DocumentContent[] {
  const paragraphs: DocumentContent[] = [];

  // Logo at top
  if (logoBuffer) {
    paragraphs.push(
      new Paragraph({
        children: [
          new ImageRun({
            data: logoBuffer,
            transformation: { width: 180, height: 41 },
            type: 'png',
          }),
        ],
        alignment: AlignmentType.LEFT,
        spacing: { after: 600 },
      })
    );
  }

  // Spacing
  paragraphs.push(
    new Paragraph({ text: '' }),
    new Paragraph({ text: '' }),
    new Paragraph({ text: '' })
  );

  // Title with left border (simulates vertical accent line)
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Investment Policy Statement',
          size: 48,
          color: COLORS.lightGray,
        }),
      ],
      border: {
        left: {
          color: COLORS.turquoise,
          size: 24,
          style: BorderStyle.SINGLE,
          space: 15,
        },
      },
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: fields.familyOrgName,
          size: 24,
          color: COLORS.lightGray,
        }),
      ],
      border: {
        left: {
          color: COLORS.turquoise,
          size: 24,
          style: BorderStyle.SINGLE,
          space: 15,
        },
      },
      spacing: { after: 80 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          size: 22,
          color: COLORS.lightGray,
        }),
      ],
      border: {
        left: {
          color: COLORS.turquoise,
          size: 24,
          style: BorderStyle.SINGLE,
          space: 15,
        },
      },
    })
  );

  // Page break to TOC
  paragraphs.push(new Paragraph({ children: [new PageBreak()] }));

  return paragraphs;
}

/**
 * Table of Contents - Professional format with dot leaders
 */
function createTableOfContents(): DocumentContent[] {
  // Create TOC as a table for proper alignment
  const tocTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      createTOCRow('I.', 'Relationship Summary', '3'),
      createTOCRow('II.', 'Tax Considerations', '3'),
      createTOCRow('III.', 'Investment Considerations', '4'),
      createTOCRow('IV.', 'Portfolio Investment Objective', '6'),
      createTOCRow('V.', 'Risk Allocation Framework', '7'),
      createTOCRow('VI.', 'Authorization of Portfolio Access', '8'),
      createTOCRow('VII.', 'Other Comments', '8'),
      createTOCRow('VIII.', 'Investment Policy Review', '8'),
    ],
  });

  return [
    new Paragraph({ text: '' }),
    new Paragraph({ text: '' }),
    new Paragraph({ text: '' }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Table of Contents',
          size: 40,
          color: COLORS.teal,
        }),
      ],
      spacing: { after: 300 },
    }),
    tocTable,
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function createTOCRow(number: string, title: string, page: string): TableRow {
  return new TableRow({
    children: [
      // Number column (fixed width)
      new TableCell({
        width: { size: 8, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE },
          bottom: { style: BorderStyle.NONE },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE },
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: number, bold: true, size: 22, color: COLORS.teal }),
            ],
          }),
        ],
      }),
      // Title column (flexible width with dot leader effect)
      new TableCell({
        width: { size: 82, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE },
          bottom: { style: BorderStyle.NONE },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE },
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: title, bold: true, size: 22, color: COLORS.teal }),
              new TextRun({ text: ' ', size: 22 }),
              new TextRun({ text: '.'.repeat(Math.max(5, 70 - title.length)), size: 22, color: COLORS.lightGray }),
            ],
          }),
        ],
      }),
      // Page number column (fixed width, right aligned)
      new TableCell({
        width: { size: 10, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE },
          bottom: { style: BorderStyle.NONE },
          left: { style: BorderStyle.NONE },
          right: { style: BorderStyle.NONE },
        },
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: page, bold: true, size: 22, color: COLORS.teal }),
            ],
            alignment: AlignmentType.RIGHT,
          }),
        ],
      }),
    ],
  });
}

/**
 * Introduction paragraph
 */
function createIntroduction(fields: IPSFields): DocumentContent[] {
  return [
    new Paragraph({
      children: [
        new TextRun({
          text: 'The purpose of this Investment Policy Statement ("IPS") is to establish a clear understanding of the investment objectives and long-term plan for the investment portfolio outlined below. This IPS is intended to allow for enough flexibility to capture investment opportunities yet provide parameters that ensure prudence and care in the execution of the investment program. This document will be reviewed periodically and may be amended at any time to reflect changes in goals and objectives.',
          size: 22,
          color: COLORS.gray,
        }),
      ],
      spacing: { after: 200 },
    }),
  ];
}

/**
 * Section I: Relationship Summary
 */
function createSectionI(fields: IPSFields): DocumentContent[] {
  const paragraphs: DocumentContent[] = [
    createSectionHeader('I.', 'Relationship Summary'),
    new Paragraph({ text: '' }),
    createLabeledField('Client Name:', `${fields.familyOrgName} (hereinafter referred to as "Client" or "client")`, true),
    createLabeledField('Source of Funds:', '[To be completed by advisor]', false),
    createLabeledField('Entity Names and Approximate Values:', `${fields.familyOrgName}, ${fields.portfolioValue}`, true),
    new Paragraph({ text: '' }),
  ];

  // Add entity description if it's a foundation
  if (fields.entityStructure.toLowerCase().includes('foundation') ||
      fields.entityStructure.toLowerCase().includes('charitable')) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `The ${fields.familyOrgName} is a ${fields.taxSitus} non-profit organization. `,
            size: 22,
            color: COLORS.gray,
          }),
          new TextRun({
            text: '[Additional foundation description to be completed by advisor]',
            size: 22,
            color: COLORS.gray,
            highlight: 'yellow',
          }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  return paragraphs;
}

/**
 * Section II: Tax Considerations
 */
function createSectionII(fields: IPSFields): DocumentContent[] {
  const isTaxExempt = fields.taxStatus === 'Tax-Exempt';

  const paragraphs: DocumentContent[] = [
    createSectionHeader('II.', 'Tax Considerations'),
    new Paragraph({ text: '' }),
    createLabeledField('Tax Exempt Portfolio:', isTaxExempt ? 'Yes' : 'No', true),
    createLabeledField('Tax Situs:', fields.taxSitus, true),
    new Paragraph({ text: '' }),
  ];

  if (isTaxExempt) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'AlTi will avoid making any investment that would jeopardize the Client\'s tax-exempt status or result in penalty taxes under the Internal Revenue Code. AlTi recognizes that certain investment activities may generate unrelated business taxable income (UBTI) for a nonprofit entity. AlTi will take this into account and be one component of many factors when conducting due diligence and assessing the suitability of an investment.',
            size: 22,
            color: COLORS.gray,
          }),
        ],
        spacing: { after: 200 },
      })
    );
  } else if (fields.taxLossHarvesting) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'AlTi will actively manage the portfolio with tax efficiency in mind, including tax loss harvesting opportunities where appropriate.',
            size: 22,
            color: COLORS.gray,
          }),
        ],
        spacing: { after: 200 },
      })
    );
  }

  return paragraphs;
}

/**
 * Section III: Investment Considerations
 */
function createSectionIII(fields: IPSFields): DocumentContent[] {
  const paragraphs: DocumentContent[] = [
    createSectionHeader('III.', 'Investment Considerations'),
    new Paragraph({ text: '' }),
    createLabeledField('Portfolio Assets:', fields.portfolioValue, true),
    createLabeledField('Est. Portfolio Time Horizon:', fields.timeHorizon, true),
    createLabeledField('Accredited Investor:', fields.accreditedInvestor ? 'Yes' : 'No', true),
    createLabeledField('Qualified Purchaser:', fields.qualifiedPurchaser ? 'Yes' : 'No', true),
    new Paragraph({ text: '' }),
  ];

  // Client Investment Experience
  paragraphs.push(
    createSubheader('Client Investment Experience:'),
    new Paragraph({
      children: [
        new TextRun({
          text: 'The client has experience investing in the financial markets and has a broad understanding across asset classes. The client understands that certain investments may have limited liquidity and is comfortable investing in these vehicles. The client also understands that different asset classes often produce meaningfully different returns and that benchmarks are only one method of evaluating the performance of a manager.',
          size: 22,
          color: COLORS.gray,
        }),
      ],
      spacing: { after: 200 },
    })
  );

  // Client Risk Tolerance
  paragraphs.push(
    createSubheader('Client Risk Tolerance:'),
    new Paragraph({
      children: [
        new TextRun({
          text: `Risk in this Portfolio is quantified from various perspectives: (1) strategic shortfall risk, which is the failure of the Portfolio to achieve its goals over an extended period of time, and (2) the potential to experience economic losses in the Portfolio, exceeding the client's average expected drawdown. The client's risk tolerance is ${fields.riskTolerance.toLowerCase()}.`,
          size: 22,
          color: COLORS.gray,
        }),
      ],
      spacing: { after: 200 },
    })
  );

  // Impact Considerations (if ESG interested)
  if (fields.esgInterest !== 'not_interested') {
    paragraphs.push(
      createSubheader('Impact Considerations'),
      new Paragraph({
        children: [
          new TextRun({
            text: `The ${fields.familyOrgName}'s investment objectives are to address its long-term growth, liquidity, stability, and operational requirements. The Client aspires to have assets of its portfolio demonstrate alignment with its values where possible. These objectives will be pursued through Values Alignment, ESG integration and investments sourced from AlTi's Thematic, Emerging Manager and Catalytic investment platform, as appropriate.`,
            size: 22,
            color: COLORS.gray,
          }),
        ],
        spacing: { after: 200 },
      })
    );

    // Public Markets section
    if (fields.exclusions.length > 0 || fields.screens.length > 0) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Public Markets Investing: ', bold: true, size: 22, color: COLORS.gray }),
            new TextRun({
              text: 'The client has expressed a desire to align its assets with its mission, to an extent practicable. This may involve allocating to public equity managers that apply negative screens, positive tilts or active assessment of Environmental, Social and/or Governance (ESG) factors. The following sectors or business practices will be avoided:',
              size: 22,
              color: COLORS.gray,
            }),
          ],
          spacing: { after: 100 },
        })
      );

      // Add exclusions as bullet points
      const allExclusions = [...fields.exclusions, ...fields.screens];
      for (const exclusion of allExclusions) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: `• ${exclusion}`, size: 22, color: COLORS.gray, highlight: 'green' }),
            ],
            indent: { left: convertInchesToTwip(0.5) },
          })
        );
      }
      paragraphs.push(new Paragraph({ text: '' }));
    }

    // Private Impact Investing
    if (fields.climatePriorities.length > 0 || fields.inclusivePriorities.length > 0) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Private Impact Investing: ', bold: true, size: 22, color: COLORS.gray }),
            new TextRun({
              text: 'The client wishes to support investments within AlTi\'s focus areas. AlTi will recommend impact investments for the portfolio from within the following thematic areas:',
              size: 22,
              color: COLORS.gray,
            }),
          ],
          spacing: { after: 100 },
        })
      );

      if (fields.inclusivePriorities.length > 0) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Inclusive Innovation:', bold: true, italics: true, size: 22, color: COLORS.gray }),
            ],
            indent: { left: convertInchesToTwip(0.25) },
          })
        );
        for (const priority of fields.inclusivePriorities) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({ text: `• ${priority}`, size: 22, color: COLORS.gray, highlight: 'green' }),
              ],
              indent: { left: convertInchesToTwip(0.5) },
            })
          );
        }
      }

      if (fields.climatePriorities.length > 0) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Climate Sustainability:', bold: true, italics: true, size: 22, color: COLORS.gray }),
            ],
            indent: { left: convertInchesToTwip(0.25) },
          })
        );
        for (const priority of fields.climatePriorities) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({ text: `• ${priority}`, size: 22, color: COLORS.gray, highlight: 'green' }),
              ],
              indent: { left: convertInchesToTwip(0.5) },
            })
          );
        }
      }
      paragraphs.push(new Paragraph({ text: '' }));
    }
  }

  // Additional fields
  paragraphs.push(
    createLabeledField('Distribution/Contribution Expectations:', '[To be completed by advisor]', false),
    createLabeledField('Assets Reported On/Monitored Only:', 'None', true),
    createLabeledField('Liquidity Restrictions:', fields.liquidityRestrictions || 'No Restrictions', true),
    createLabeledField('Investment Restrictions/Constraints:',
      fields.esgInterest !== 'not_interested'
        ? 'See Impact Considerations section above'
        : 'No Restrictions',
      true),
    createLabeledField('Investment Discretion:',
      'AlTi shall have discretion to trade/rebalance the portfolio as needed, within the constraints laid out in this document.',
      true),
  );

  return paragraphs;
}

/**
 * Section IV: Portfolio Investment Objective
 */
function createSectionIV(fields: IPSFields): DocumentContent[] {
  const objectiveText = fields.useArchetypeAllocation
    ? `The Client's objective focuses on total return and seeks to provide growth of capital equal to inflation (Core CPI) +4-5% over a full market cycle. The ${fields.investmentObjective} allocates to investments which, collectively, emphasize growth of capital with a secondary focus on current income. The Portfolio is structured with a long-term time horizon in mind yet will take advantage of market and investment opportunities when identified.`
    : `The Client's objective focuses on total return and seeks to provide growth of capital over a full market cycle. The ${fields.investmentObjective} Investment Objective allocates to investments which, collectively, balance growth of capital with capital preservation. The Portfolio is structured with the client's time horizon in mind yet will take advantage of market and investment opportunities when identified.`;

  return [
    createSectionHeader('IV.', 'Portfolio Investment Objective'),
    new Paragraph({ text: '' }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Investment Objective Commentary: ', bold: true, size: 22, color: COLORS.gray }),
        new TextRun({
          text: 'All final investment objective determinations consider time horizon, risk tolerance, hurdle rate and distribution needs. In addition, the following unique circumstances will be incorporated and considered when making allocations: legacy assets, single stocks, liquidity needs/intolerance for liquidity or commingled funds, and tax considerations.',
          size: 22,
          color: COLORS.gray,
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Investment Objective & Return Expectation: ', bold: true, size: 22, color: COLORS.gray }),
        new TextRun({
          text: objectiveText,
          size: 22,
          color: COLORS.gray,
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'The Client\'s portfolio may include allocations to investments with limited liquidity such as AlTi Access Vehicles and other types of private investment funds.',
          size: 22,
          color: COLORS.gray,
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'AlTi does not guarantee the future performance of the Portfolio or of the investment objective, promise any specific level of performance or promise that its investment decisions, strategies or overall management of the Portfolio will be successful. The Client acknowledges and agrees that AlTi has made no such guarantees or representations to the Client.',
          size: 22,
          color: COLORS.gray,
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Rebalancing: ', bold: true, size: 22, color: COLORS.gray }),
        new TextRun({
          text: 'In the belief that maintaining the integrity of the Portfolio\'s asset allocation is a key factor in ensuring that the Portfolio goals are achieved, periodic rebalancing of the Portfolio will be necessary over time. Absent compelling circumstances, asset classes that have exceeded their maximum or minimum thresholds should be brought back within tolerance in a timely manner.',
          size: 22,
          color: COLORS.gray,
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

/**
 * Section V: Risk Allocation Framework
 */
function createSectionV(fields: IPSFields): DocumentContent[] {
  const { allocation } = fields;

  return [
    createSectionHeader('V.', 'Risk Allocation Framework'),
    new Paragraph({ text: '' }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'AlTi will look to construct an optimal mix of stability, growth and diversification assets within this Portfolio to meet the Client\'s goals. The percentage assigned to each of the three goals-based allocations will be predicated on the client\'s objectives for risk and return. Each risk-based allocation is characterized below, but how those attributes are achieved can change over time as markets evolve.',
          size: 22,
          color: COLORS.gray,
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Stability: ', bold: true, size: 22, color: COLORS.gray }),
        new TextRun({
          text: `Target: ${allocation.stability.target}% (Range: ${allocation.stability.lowerBand}%-${allocation.stability.upperBand}%). Assets within this risk allocation are intended to offer liquidity and stability to the broader Portfolio. Typically weighted with cash, cash equivalents and investment grade fixed income instruments, these assets aid in dampening overall portfolio volatility and present little risk for sustained or significant loss.`,
          size: 22,
          color: COLORS.gray,
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Diversified: ', bold: true, size: 22, color: COLORS.gray }),
        new TextRun({
          text: `Target: ${allocation.diversified.target}% (Range: ${allocation.diversified.lowerBand}%-${allocation.diversified.upperBand}%). Assets within this risk allocation are intended to drive strong risk-adjusted results over time and offer exposure to assets that are complementary and uncorrelated to the other primary return drivers present in the Stability and Growth allocations. Typical investments within this allocation include hedge funds or similar active alternative strategies, higher yielding credit, and other opportunities uncorrelated with broader markets.`,
          size: 22,
          color: COLORS.gray,
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Growth: ', bold: true, size: 22, color: COLORS.gray }),
        new TextRun({
          text: `Target: ${allocation.growth.target}% (Range: ${allocation.growth.lowerBand}%-${allocation.growth.upperBand}%). Assets within this risk allocation are intended to drive capital appreciation and growth of wealth over time. Investments assume a higher degree of risk in order to generate returns above a blended benchmark over a full market cycle. Typical investments include publicly traded global equities, real assets, private equity, and infrastructure investments.`,
          size: 22,
          color: COLORS.gray,
        }),
      ],
      spacing: { after: 200 },
    }),
    // Allocation table
    new Paragraph({ text: '' }),
    createAllocationTable(allocation),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function createAllocationTable(allocation: IPSFields['allocation']): Table {
  const rows = [
    new TableRow({
      children: [
        createTableHeaderCell('Risk Allocation'),
        createTableHeaderCell('Target'),
        createTableHeaderCell('Lower Band'),
        createTableHeaderCell('Upper Band'),
      ],
    }),
    createAllocationRow('Stability', allocation.stability),
    createAllocationRow('Diversified', allocation.diversified),
    createAllocationRow('Growth', allocation.growth),
  ];

  if (allocation.privateMarkets) {
    rows.push(createAllocationRow('Private Markets', allocation.privateMarkets));
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows,
  });
}

/**
 * Section VI: Authorization of Portfolio Access
 */
function createSectionVI(fields: IPSFields): DocumentContent[] {
  return [
    createSectionHeader('VI.', 'Authorization of Portfolio Access'),
    new Paragraph({ text: '' }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'The following individuals & firms are authorized to access information regarding this portfolio:',
          size: 22,
          color: COLORS.gray,
        }),
      ],
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `• ${fields.clientName}`, size: 22, color: COLORS.gray, highlight: 'green' }),
      ],
      indent: { left: convertInchesToTwip(0.25) },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `• ${fields.advisorName}, AlTi Advisor`, size: 22, color: COLORS.gray, highlight: 'green' }),
      ],
      indent: { left: convertInchesToTwip(0.25) },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: '• [Additional authorized individuals to be added]', size: 22, color: COLORS.gray, highlight: 'yellow' }),
      ],
      indent: { left: convertInchesToTwip(0.25) },
    }),
    new Paragraph({ text: '' }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'The client has requested and authorized that AlTi provide portfolio and tax information to their tax preparer. Other third parties will require pre-approval.',
          size: 22,
          color: COLORS.gray,
        }),
      ],
      spacing: { after: 200 },
    }),
  ];
}

/**
 * Section VII: Other Comments
 */
function createSectionVII(fields: IPSFields): DocumentContent[] {
  const hasComments = fields.additionalNotes && fields.additionalNotes.trim().length > 0;

  if (!hasComments) {
    // If no comments, just show section with placeholder
    return [
      createSectionHeader('VII.', 'Other Comments'),
      new Paragraph({ text: '' }),
      new Paragraph({
        children: [
          new TextRun({
            text: '[No additional comments at this time]',
            size: 22,
            color: COLORS.gray,
            italics: true,
          }),
        ],
        spacing: { after: 200 },
      }),
    ];
  }

  return [
    createSectionHeader('VII.', 'Other Comments'),
    new Paragraph({ text: '' }),
    new Paragraph({
      children: [
        new TextRun({
          text: fields.additionalNotes,
          size: 22,
          color: COLORS.gray,
          highlight: 'green',
        }),
      ],
      spacing: { after: 200 },
    }),
  ];
}

/**
 * Section VIII: Investment Policy Review
 */
function createSectionVIII(fields: IPSFields): DocumentContent[] {
  return [
    createSectionHeader('VIII.', 'Investment Policy Review'),
    new Paragraph({ text: '' }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'To assure continued relevance of the guidelines, objectives, financial status and capital market expectations as established in this statement of investment policy, the parties below intend to review the policy statement periodically. Significant changes to overall strategy should be considered only in reaction to corresponding changes in such inputs, not simply in reaction to market fluctuations.',
          size: 22,
          color: COLORS.gray,
        }),
      ],
      spacing: { after: 400 },
    }),
    // Client signature block
    new Paragraph({
      children: [
        new TextRun({ text: fields.familyOrgName, bold: true, size: 22, color: COLORS.gray }),
      ],
    }),
    new Paragraph({ text: '' }),
    new Paragraph({
      children: [
        new TextRun({ text: 'By: _______________________________________     Date: _______________', size: 22, color: COLORS.gray }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Name: ', size: 22, color: COLORS.gray }),
        new TextRun({ text: fields.clientName, size: 22, color: COLORS.gray, highlight: 'green' }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Title: ', size: 22, color: COLORS.gray }),
        new TextRun({ text: fields.clientTitle, size: 22, color: COLORS.gray, highlight: 'green' }),
      ],
    }),
    new Paragraph({ text: '' }),
    new Paragraph({ text: '' }),
    // AlTi signature block
    new Paragraph({
      children: [
        new TextRun({ text: 'AlTi Tiedemann Global', bold: true, size: 22, color: COLORS.gray }),
      ],
    }),
    new Paragraph({ text: '' }),
    new Paragraph({
      children: [
        new TextRun({ text: 'By: _______________________________________     Date: _______________', size: 22, color: COLORS.gray }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Name: ', size: 22, color: COLORS.gray }),
        new TextRun({ text: fields.advisorName, size: 22, color: COLORS.gray, highlight: 'green' }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Title: Managing Director', size: 22, color: COLORS.gray }),
      ],
    }),
  ];
}

// Helper functions
function createSectionHeader(number: string, title: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: `${number}`,
        bold: true,
        size: 22,
        color: COLORS.teal,
      }),
      new TextRun({
        text: `     ${title}`,
        bold: true,
        size: 22,
        color: COLORS.teal,
      }),
    ],
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
  });
}

function createSubheader(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold: true,
        size: 22,
        color: COLORS.gray,
      }),
    ],
    spacing: { before: 200, after: 100 },
  });
}

function createLabeledField(label: string, value: string, autoPopulated: boolean): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: `${label}  `, bold: true, size: 22, color: COLORS.gray }),
      new TextRun({
        text: value,
        size: 22,
        color: COLORS.gray,
        highlight: autoPopulated ? 'green' : 'yellow',
      }),
    ],
    spacing: { after: 100 },
  });
}

function createTableHeaderCell(text: string): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, size: 20, color: COLORS.teal })],
        alignment: AlignmentType.CENTER,
      }),
    ],
    shading: { type: ShadingType.SOLID, color: 'F0F0F0' },
  });
}

function createAllocationRow(
  label: string,
  data: { target: number; lowerBand: number; upperBand: number }
): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: label, size: 20, color: COLORS.gray })] })],
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: `${data.target}%`, size: 20, color: COLORS.gray })],
            alignment: AlignmentType.CENTER,
          }),
        ],
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: `${data.lowerBand}%`, size: 20, color: COLORS.gray })],
            alignment: AlignmentType.CENTER,
          }),
        ],
      }),
      new TableCell({
        children: [
          new Paragraph({
            children: [new TextRun({ text: `${data.upperBand}%`, size: 20, color: COLORS.gray })],
            alignment: AlignmentType.CENTER,
          }),
        ],
      }),
    ],
  });
}
