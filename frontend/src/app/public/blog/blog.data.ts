/**
 * Blog content for the public website.
 *
 * Posts are static data so they can be fully prerendered for SEO.
 * To add a post: append here, then add its URL to `prerender-routes.txt`
 * and `public/sitemap.xml`.
 */

export interface BlogTable {
  headers: string[];
  rows: string[][];
}

export interface BlogSection {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
  table?: BlogTable;
  note?: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  /** Title used for the <title> tag (may include keywords). */
  seoTitle: string;
  description: string;
  date: string;          // ISO date
  dateDisplay: string;   // e.g. "7 October 2026"
  readMinutes: number;
  category: string;
  image: string;
  intro: string;
  keyTakeaways: string[];
  sections: BlogSection[];
}

export const BLOG_POSTS: BlogPost[] = [
  // ---------------------------------------------------------------- POST 1
  {
    slug: 'schoolsense-vs-traditional-school-erp-software',
    title: 'SchoolSense vs Traditional School ERP Software: An Honest, Practical Comparison',
    seoTitle: 'SchoolSense vs Traditional School ERP Software — Honest Comparison (2026)',
    description:
      'How does SchoolSense compare with traditional school ERP software in India? An honest look at setup time, pricing transparency, the parent app, simplicity and support — the five things that actually matter to schools.',
    date: '2026-10-06',
    dateDisplay: '6 October 2026',
    readMinutes: 7,
    category: 'Comparison',
    image: '/assets/images/academics_timetable.jpg',
    intro:
      'If you are evaluating school management software in India, you have probably spoken to two or three vendors already — and noticed that comparing them is surprisingly hard. Prices are hidden behind "request a quote", demos show only the good parts, and every vendor says they are the easiest to use. This post does the opposite: a plain, factual comparison of how SchoolSense is built versus the traditional school ERP model, so you can judge for yourself.',
    keyTakeaways: [
      'Traditional ERPs are sold like enterprise software: quotes, consultants, months of setup.',
      'SchoolSense is sold like a product: published price, free setup, live within a week.',
      'The parent app is included free — not an add-on module.',
      'Every feature of SchoolSense is documented on this website, including the price.',
    ],
    sections: [
      {
        heading: 'The five things that actually matter',
        paragraphs: [
          'After helping schools move off registers, spreadsheets and older software, we have found that five factors decide whether a school management system succeeds or becomes shelfware. Everything else is detail.',
        ],
        table: {
          headers: ['What matters', 'Traditional school ERP', 'SchoolSense'],
          rows: [
            [
              'Time to go live',
              'Weeks to months. On-site visits, data migration projects, training schedules.',
              'Days. We set up your classes, sections, subjects and fees, and train your staff — free.',
            ],
            [
              'Pricing',
              '"Request a quote". Price depends on negotiation, modules and student count.',
              'Published openly: ₹59 per student/month, with a launch offer of ₹10. One plan, all features.',
            ],
            [
              'Parent experience',
              'A portal parents rarely open, or an app sold as a paid add-on.',
              'Live Parent Connect with push notifications on every activity — always included, free for parents.',
            ],
            [
              'Everyday usability',
              'Feature-heavy screens designed for trained operators.',
              'Designed for non-IT staff: big buttons, simple words, one obvious way to do each task.',
            ],
            [
              'Contracts',
              'Annual contracts, renewal pressure, exit fees.',
              'Monthly billing. No lock-in, no yearly blockage. Leave any time with your data.',
            ],
          ],
        },
      },
      {
        heading: 'Why "more features" is not the same as "better system"',
        paragraphs: [
          'Traditional ERP vendors compete on feature counts — 100+ modules, dozens of report formats, configuration options for every possibility. In practice, most schools use less than a fifth of that, while paying for all of it and struggling through the rest.',
          'SchoolSense takes the opposite approach: connected tools that cover what a school actually runs on every day — timetable, attendance, homework, exams, notices, complaints, fees, alumni and certificates — plus the two mobile apps. We would rather do those core things better than ship a hundred half-used modules.',
          'The test is simple: open any screen and ask, "could our newest clerk use this without calling us?" If the answer is no, we redesign the screen.',
        ],
      },
      {
        heading: 'What traditional ERPs are genuinely good at',
        paragraphs: [
          'In fairness — because this is an honest comparison — established ERP vendors have real strengths. If your school is a large group of institutions wanting on-premise hosting, deep customisation of every process, or modules like payroll, transport GPS tracking and hostel management in one package, a traditional ERP may fit better.',
          'We built SchoolSense for the far larger group of schools that want the core system to simply work: teachers marking attendance in seconds, parents seeing updates live, and the office generating a Transfer Certificate in one click — without a consultant in the middle.',
        ],
      },
      {
        heading: 'How to run a fair comparison yourself',
        paragraphs: [
          'Whichever shortlist you build, ask every vendor these questions — including us:',
        ],
        bullets: [
          'Can I see the full price on your website, right now?',
          'How long until attendance and homework are actually running in my school?',
          'Is the parent app included, or is it an extra module with extra charges?',
          'What happens at the end of the year — am I forced to renew to keep my data?',
          'Show me the screen a teacher uses every morning at 8 AM, on a phone, with one hand.',
          'Can I test it with my own class data before paying anything?',
        ],
        note:
          'Book a free demo and we will answer all six openly — and you can hold every other vendor to the same standard.',
      },
    ],
  },

  // ---------------------------------------------------------------- POST 2
  {
    slug: 'school-erp-pricing-india-hidden-costs',
    title: 'School ERP Pricing in India: The Hidden Costs Schools Don\'t See',
    seoTitle: 'School ERP Software Pricing in India (2026) — Hidden Costs Explained',
    description:
      'School ERP pricing in India is usually quote-based. Here is what a typical contract really includes: setup fees, module add-ons, parent app charges, implementation and renewal pressure — and what SchoolSense charges instead.',
    date: '2026-10-03',
    dateDisplay: '3 October 2026',
    readMinutes: 6,
    category: 'Pricing',
    image: '/assets/images/exams_gradebook.jpg',
    intro:
      'Ask five school ERP vendors in India for their price and you will usually get five "request a quote" replies. The quote is rarely the whole story. This post explains the pricing structures used across the market, the costs that appear after you sign, and how SchoolSense prices differently — published, monthly and complete.',
    keyTakeaways: [
      'Most Indian school ERP vendors do not publish pricing — you negotiate blind.',
      'Two schools with the same student count can pay very different amounts for identical software.',
      'Setup fees, parent app charges and training costs often appear after the quote.',
      'SchoolSense publishes one price for everything: ₹59/student/month, launch offer ₹10.',
    ],
    sections: [
      {
        heading: 'How school software is usually priced in India',
        paragraphs: [
          'Across the market you will encounter four pricing models, often mixed together:',
        ],
        bullets: [
          'Per-student, per-year or per-month pricing — the most common model, quoted in slabs by school size.',
          'Per-module pricing — the base price covers some modules; exams, fees, transport or the parent app are extras.',
          'One-time licence plus annual maintenance — typical of older, on-premise software.',
          'Setup and implementation fees — charged separately, sometimes as much as the first year of subscription.',
          'Publicly discussed market rates for cloud school software in India generally fall in the range of roughly ₹15 to ₹50 per student per month — but because most vendors quote privately, two similar schools can sign contracts at very different rates.',
        ],
      },
      {
        heading: 'The costs that appear after the quote',
        bullets: [
          'The parent app as a paid extra: many schools discover the parent app is a separate product with its own per-user or per-school fee — even though parent engagement is the whole point of a school system.',
          'Implementation projects: data entry, class/subject setup and training billed as professional services, with hourly rates.',
          'SMS/notification credits: message packs bought separately, priced per message.',
          'Annual renewal jumps: a low first-year price renewing automatically at a much higher year-two rate.',
          'Exit costs: getting your own data out in a usable format is not always free — or even possible.',
        ],
      },
      {
        heading: 'What SchoolSense charges — and why',
        table: {
          headers: ['Item', 'Other vendors (typical)', 'SchoolSense'],
          rows: [
            ['Base price', 'Quoted privately in slabs', '₹59 per student/month, published on our pricing page'],
            ['Launch offer', 'Discounts only if you negotiate', '₹10 per student/month for new schools — shown to everyone'],
            ['Parent app', 'Often a paid add-on', 'Included free, unlimited parents'],
            ['Teacher app', 'Often absent or paid', 'Included free'],
            ['Setup, data entry, training', 'Billed as professional services', 'Free — we do it with you'],
            ['Contract', 'Usually annual', 'Monthly. No lock-in, no yearly blockage'],
            ['Per-module charges', 'Common', 'None — every feature in the base plan'],
          ],
        },
        paragraphs: [
          'We publish our price because we know it is fair, and because a school owner should not need a negotiation to learn what software costs. Our model is deliberately simple: you pay per enrolled student, per month, for everything. Teachers, administrators and parents log in free, without per-user charges.',
          'If your school needs a feature we do not have yet, we build it on request — scoped honestly before any work starts, and your base per-student price does not change because of it.',
        ],
      },
      {
        heading: 'A 60-second way to compare any quote',
        paragraphs: [
          'When you receive a quote from any vendor, multiply out the real 3-year cost: base fee × students × months, plus setup, plus the parent app, plus message packs. Then ask what the price becomes in year two. Most schools find that the three-year total is two to three times the number that was first spoken in the sales meeting.',
          'Our whole price list fits on a single line, and the demo is free. Bring any quote you have received — we will compare it with you, line by line.',
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- POST 3
  {
    slug: 'how-to-choose-school-management-software-india',
    title: 'How to Choose School Management Software in India: A 10-Point Checklist',
    seoTitle: 'How to Choose School Management Software in India — 10-Point Checklist (2026)',
    description:
      'A practical 10-point checklist for choosing school management software in India: pricing transparency, setup time, parent app, simplicity for non-IT staff, data ownership, certificates, support and more.',
    date: '2026-09-28',
    dateDisplay: '28 September 2026',
    readMinutes: 8,
    category: 'Buyer\'s Guide',
    image: '/assets/images/slider_leadership.jpg',
    intro:
      'Choosing school management software is one of those decisions a school makes once and lives with for years — so it is worth an hour of structured thinking. This checklist is exactly what we would tell a friend who runs a school, whether they choose SchoolSense or not. For each point we also note how we stand against it, so you can verify us as you go.',
    keyTakeaways: [
      'Judge software by how it behaves on day 30, not by how the demo looks on day 1.',
      'The parent experience is the strongest predictor of whether your school loves the system.',
      'Make the vendor show you the real price and the exit path before you sign.',
    ],
    sections: [
      {
        heading: 'The checklist',
        paragraphs: [
          'Score every vendor you talk to, including us:',
        ],
      },
      {
        heading: '1. Is the price published and complete?',
        paragraphs: [
          'A vendor confident in its product shows its price. Ask what the full monthly cost is for your exact student count, including the parent app, setup, training and message notifications. If any of those are "extra", write down the real number.',
        ],
        note: 'SchoolSense: ₹59/student/month (₹10 launch offer), everything included, published on our pricing page.',
      },
      {
        heading: '2. How fast can attendance and homework actually go live?',
        paragraphs: [
          'Ask for a date — not a process. Implementation that drags for months loses the excitement and the habit. Then ask what your staff must do themselves.',
        ],
        note: 'SchoolSense: most schools are live within a week. We enter classes, sections, subjects and fees, and train your staff for free.',
      },
      {
        heading: '3. What does the parent experience look like?',
        paragraphs: [
          'The strongest school systems make parents feel connected: live attendance, homework the same evening, marks the moment results are published, fees and receipts always available, and complaints that visibly get resolved. If the parent view is an afterthought, the system will feel like extra work — not a win.',
        ],
        note: 'SchoolSense: Parent Connect is our headline feature — push notifications for every activity, with dedicated free apps for parents and teachers.',
      },
      {
        heading: '4. Can a non-IT person use it without a manual?',
        paragraphs: [
          'Watch the demo from the point of view of your oldest staff member. Count the clicks to mark attendance for one class. If the presenter needs jargon ("ledger reconciliation", "API sync"), imagine explaining that to your office team.',
        ],
        note: 'SchoolSense: our first design rule is that if your staff can use WhatsApp, they can use SchoolSense.',
      },
      {
        heading: '5. Where does your data live — and how is it protected?',
        paragraphs: [
          'Ask specifically: is our data isolated from other schools? Who can read it? What happens to it if we leave? "It\'s in the cloud" is not an answer.',
        ],
        note: 'SchoolSense: encrypted in transit and at rest, strictly isolated per school, passwords hashed, sensitive actions audit-logged, and your data exported for you if you leave.',
      },
      {
        heading: '6. What is the exit path?',
        paragraphs: [
          'Before signing anything, ask for the renewal terms in writing and whether your data can be exported in a usable format. A fair vendor answers instantly.',
        ],
        note: 'SchoolSense: monthly billing, no annual blockage, no lock-in. Your records are yours.',
      },
      {
        heading: '7. Are the certificates and formal documents automatic?',
        paragraphs: [
          'Transfer Certificates, Character Certificates and Bonafide letters are the documents parents and offices ask for most — and where manual work burns the most hours. Ask the vendor to generate one, live, in the demo.',
        ],
        note: 'SchoolSense: TC, Character Certificate and every standard school document generate in one click, with proper formats.',
      },
      {
        heading: '8. What happens when your school needs something custom?',
        paragraphs: [
          'No two schools run identically. Ask how custom needs are handled and — crucially — how they are priced.',
        ],
        note: 'SchoolSense: we build custom features on request, scoped in writing before any work starts.',
      },
      {
        heading: '9. How does support work after the sale?',
        paragraphs: [
          'Ask who answers when a teacher is stuck at 8 AM on a Monday, through which channel, and in what language. Support quality is where cheap software stops being cheap.',
        ],
        note: 'SchoolSense: one team runs the product and the support — you talk to people who can actually fix things.',
      },
      {
        heading: '10. Does the vendor use their own product?',
        paragraphs: [
          'The final test: can the vendor show a live school using the system right now, not just a demo environment? Live schools reveal everything.',
        ],
        note: 'SchoolSense: book a free demo and we will walk through a live school with you — then set up your own data.',
      },
    ],
  },

  // ---------------------------------------------------------------- POST 4
  {
    slug: 'why-parent-connect-matters-schools',
    title: 'Why Parent Connect Is the Feature Parents Actually Care About',
    seoTitle: 'Why Parent Connect Matters: Live School Updates Parents Love (2026)',
    description:
      'Attendance, marks, fees, fines, complaints and emergency alerts — why live parent updates are the most valuable feature of a school management system, and how they reduce calls to the school office and grow admissions by word of mouth.',
    date: '2026-09-21',
    dateDisplay: '21 September 2026',
    readMinutes: 6,
    category: 'Parent Engagement',
    image: '/assets/images/academics_timetable.jpg',
    intro:
      'Ask parents what they want from their child\'s school and you will not hear about ERP modules — you will hear: "I want to know what is happening, as it happens." That single sentence is why Parent Connect is the heart of SchoolSense, and why we believe it is the feature that decides whether a school management system becomes loved or merely tolerated.',
    keyTakeaways: [
      'Parents do not want more information — they want the right information without asking.',
      'Live updates replace dozens of daily phone calls to the school office.',
      'Engaged parents talk about the school; word of mouth is the cheapest admission channel.',
    ],
    sections: [
      {
        heading: 'The daily reality without live updates',
        paragraphs: [
          'A parent drops their child at school and then... wonders. Was she marked present? Was yesterday\'s absence noticed? Did the fee receipt get recorded? When is the maths test? Most schools answer these questions through the class WhatsApp group, a phone call from the parent, or not at all. Each question costs the school office time, and each unanswered question costs trust.',
          'Multiply that by every parent, every day. The office becomes a call centre, teachers become message relays, and parents still feel half-informed.',
        ],
      },
      {
        heading: 'What "live" actually means',
        paragraphs: [
          'In SchoolSense, the moment a teacher marks attendance, the parent\'s phone shows it. The moment marks are published, the parent sees them. Fee receipts, fines, complaints and even emergency alerts travel the same path — seconds, not day-end summaries.',
        ],
        bullets: [
          'Attendance: marked present or absent at roll call — visible instantly, with the month view for records.',
          'Marks & results: report cards reach parents the moment the school publishes them.',
          'Fees & fines: invoices, receipts and any fine — always on the parent\'s phone, with no "where is the receipt?" calls.',
          'Complaints: parents raise an issue and watch every reply until it is resolved — accountability without confrontation.',
          'Emergency alerts: urgent messages reach every parent in seconds, not through the school bag.',
          'Events, holidays and notices: delivered instantly; nothing is lost in translation.',
        ],
      },
      {
        heading: 'What parents do with it — and what schools get back',
        paragraphs: [
          'When parents can see everything, three things change at the school. First, the office phone stops ringing for routine questions — attendance, receipts and dates are all in the parent\'s hand. Second, homework completion and test preparation improve, because parents see due dates the same evening rather than the next morning. Third, and most valuable, parents feel like partners in the school rather than customers waiting for information.',
          'That feeling is spoken about — in the neighbourhood, at family functions, in the parent group that is not run by the school. Word of mouth is the least expensive and most trusted admission channel any school has, and live parent engagement is what fuels it.',
        ],
      },
      {
        heading: 'Our commitment: the parent app is free, always',
        paragraphs: [
          'Some vendors sell the parent app as a premium add-on. We think that misses the point: if Parent Connect is the reason schools win trust, it cannot be an upsell. Both the Parent App and the Teacher App are included in every SchoolSense plan, on Android and iPhone, with unlimited parents and no per-user fees.',
          'See it in the demo — bring a parent\'s phone and watch what they would see.',
        ],
      },
    ],
  },

  // ---------------------------------------------------------------- POST 5
  {
    slug: 'simplest-school-management-software',
    title: 'The Simplest School Software: Why Non-IT Staff Are Our First Priority',
    seoTitle: 'Simplest School Management Software — Built for Non-IT Staff (2026)',
    description:
      'Why the simplest school management software wins: designing for non-IT staff, the pitfalls of feature-heavy ERPs, and the everyday tests we apply to every SchoolSense screen so any teacher or clerk can use it from day one.',
    date: '2026-09-14',
    dateDisplay: '14 September 2026',
    readMinutes: 5,
    category: 'Product Philosophy',
    image: '/assets/images/slider_classroom.jpg',
    intro:
      'Every school software brochure claims to be "easy to use". The real question is easier to judge: when a new clerk joins your school, how long before they run admissions, fees and attendance without help? If the honest answer is "we\'d need training sessions first", the software was designed for IT teams — not for your school. Simplicity is our first design rule, and this post explains what that means in practice.',
    keyTakeaways: [
      'Most school software is judged in demos by the buyer, but lived every day by non-IT staff.',
      'Feature-heavy screens are not a sign of power; they are a transfer of work to your team.',
      'Simple does not mean limited — it means the power is under the hood.',
    ],
    sections: [
      {
        heading: 'Why "powerful" software fails inside schools',
        paragraphs: [
          'Traditional school ERP screens were designed for operators who live in the software all day: dense tables, codes, statuses, configuration menus. When that software arrives in a real school — where the person marking attendance is a class teacher with 45 students and 40 seconds — the gap becomes obvious. Workarounds start: notes on paper, a WhatsApp message to the clerk, the software used only at month-end.',
          'The software was not wrong. It was designed for the wrong person.',
        ],
      },
      {
        heading: 'Our design tests',
        paragraphs: [
          'Every SchoolSense screen goes through the same five questions before release:',
        ],
        bullets: [
          'The one-hand test: can a teacher do this while walking with a register in the other hand?',
          'The no-manual test: is the next step obvious without explanation?',
          'The 40-second test: can one class\'s attendance be marked in under a minute?',
          'The plain-words test: does every button say what it does in everyday language — no jargon?',
          'The WhatsApp test: if your staff can use WhatsApp, can they use this screen?',
        ],
      },
      {
        heading: 'Simple outside, serious inside',
        paragraphs: [
          'Simplicity is a design choice about the surface, not a reduction in capability. Underneath, SchoolSense still does serious work: rules-based student promotion at year end, timestamped audits of sensitive actions, automatic certificate generation with proper formats, and cloud sync so the principal sees the same numbers as the clerk — instantly.',
          'Making that power invisible is the hard engineering. Making it visible to your staff is the failure we design against.',
        ],
      },
      {
        heading: 'What this means for your school week',
        paragraphs: [
          'The practical effect is that SchoolSense asks almost nothing of your staff: a short training session with our team, and then habits. Teachers mark attendance in seconds; the office posts notices in a couple of taps; the principal checks today\'s strength at a glance. No manuals, no consultants, no "please raise a ticket to change a section name".',
          'That is what "the simplest school software" should mean — and it is the standard we hold ourselves to on every screen we ship.',
        ],
      },
    ],
  },
];

export function findPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
