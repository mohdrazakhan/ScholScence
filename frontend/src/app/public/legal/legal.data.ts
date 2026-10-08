/**
 * Legal documents for the public website.
 *
 * Written for SchoolSense (India-first school management SaaS) so they
 * protect the platform, schools, parents, teachers and students.
 *
 * IMPORTANT: `LEGAL_ENTITY`, `LEGAL_ADDRESS`, `LEGAL_EMAIL`, `GRIEVANCE_OFFICER`
 * and `JURISDICTION_CITY` below are placeholders that MUST be filled in with the
 * real registered details before these pages go live. See the review note at the
 * bottom of this file.
 */

export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  /** Renders as a numbered/highlighted clause box. */
  highlight?: string;
}

export interface LegalDoc {
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  lastUpdated: string;
  intro: string;
  sections: LegalSection[];
}

// ---------------------------------------------------------------------------
// Entity details — REPLACE before publishing.
// ---------------------------------------------------------------------------
export const LEGAL_ENTITY = 'SchoolSense';           // exact registered name
export const LEGAL_ADDRESS = '[Registered office address, India]';
export const LEGAL_EMAIL = 'legal@schoolsense.in';
export const SUPPORT_EMAIL = 'support@schoolsense.in';
export const PRIVACY_EMAIL = 'privacy@schoolsense.in';
export const GRIEVANCE_OFFICER = '[Name of Grievance Officer]';
export const GRIEVANCE_PHONE = '[Grievance officer phone]';
export const JURISDICTION_CITY = '[City]';

/** Shared clause used across documents — jurisdiction and governing law. */
const GOVERNING_LAW: LegalSection = {
  heading: 'Governing law and jurisdiction',
  paragraphs: [
    `These terms are governed by the laws of India. Subject to the dispute resolution clause above, the courts at ${JURISDICTION_CITY} shall have exclusive jurisdiction over any matter arising out of or relating to the Services.`,
  ],
};

const DISPUTE_RESOLUTION: LegalSection = {
  heading: 'Dispute resolution',
  paragraphs: [
    `We ask that you first write to ${LEGAL_EMAIL} so we can try to resolve any concern directly. If a dispute is not resolved within 30 days, it shall be referred to arbitration by a sole arbitrator appointed by mutual consent, and the arbitration shall be conducted in English at ${JURISDICTION_CITY} in accordance with the Arbitration and Conciliation Act, 1996. Nothing in this clause prevents either party from seeking urgent interim relief from a competent court.`,
  ],
};

// ---------------------------------------------------------------------------
// 1. TERMS AND CONDITIONS
// ---------------------------------------------------------------------------
export const TERMS: LegalDoc = {
  slug: 'terms',
  title: 'Terms and Conditions',
  seoTitle: 'Terms and Conditions — SchoolSense School Management Platform',
  description:
    'The terms governing use of the SchoolSense school management platform by schools, teachers, parents and students, including subscription, acceptable use, intellectual property, data protection, client references and liability.',
  lastUpdated: '8 October 2026',
  intro: `These Terms and Conditions ("Terms") govern the use of the SchoolSense platform, website and mobile applications (together, the "Services") operated by ${LEGAL_ENTITY}. By accessing or using the Services, or by creating an account, you agree to be bound by these Terms. If you are accepting on behalf of a school, you confirm that you are authorised to bind that school.`,
  sections: [
    {
      heading: '1. Definitions',
      bullets: [
        '"School" means the educational institution that subscribes to the Services.',
        '"Institution Data" means data uploaded to or generated within the Services by a School, including records of students, guardians, staff, attendance, marks, fees and documents.',
        '"Personal Data" means information relating to an identifiable natural person, as defined under the Digital Personal Data Protection Act, 2023.',
        '"User" means any individual who accesses the Services, including school administrators, teachers, other staff, guardians and students.',
      ],
    },
    {
      heading: '2. Eligibility and accounts',
      paragraphs: [
        'The Services are intended for educational institutions and their authorised users. Accounts are created and managed by the School. Each User is responsible for keeping their login credentials confidential and for all activity carried out through their account. A School must promptly deactivate accounts of users who leave the institution.',
      ],
    },
    {
      heading: '3. Subscription, fees and billing',
      bullets: [
        'Subscription is charged per enrolled student per month at the rate stated on our pricing page at the time of sign-up, together with any applicable taxes.',
        'The School is responsible for maintaining sufficient prepaid balance or approved credit in its account for the Services to continue.',
        'Fees are billed monthly on the basis of active enrolled students. A student leaving mid-cycle is adjusted in the following billing cycle.',
        'Amounts already paid are non-refundable except where required by applicable law, or where we are unable to provide the Services for reasons attributable to us.',
        'We may revise subscription rates by giving the School at least 30 days\u2019 prior written notice. Continued use after the effective date constitutes acceptance of the revised rate.',
      ],
    },
    {
      heading: '4. School responsibilities',
      bullets: [
        'The School is the data fiduciary in respect of Institution Data and Personal Data it uploads. It is responsible for obtaining all necessary consents, notices and permissions from parents, guardians, students and staff before uploading their data to the Services.',
        'The School confirms it has lawful authority to share student and guardian information with us for the purpose of operating the Services.',
        'The School is responsible for the accuracy and completeness of the data it uploads.',
        'The School shall not use the Services to send unlawful, misleading or unsolicited commercial communications to parents or guardians.',
      ],
    },
    {
      heading: '5. Acceptable use',
      paragraphs: ['You agree not to:'],
      bullets: [
        'use the Services for any unlawful purpose or in breach of any applicable law or regulation;',
        'attempt to access data belonging to another School, or to circumvent any access control, authentication or security measure;',
        'upload malicious code, or interfere with the operation, security or integrity of the Services;',
        'reverse engineer, decompile, copy, resell, sublicense or create derivative works from the Services except as expressly permitted;',
        'use automated means to extract data from the Services beyond normal use; or',
        'impersonate any person or misrepresent your affiliation with any institution.',
      ],
      highlight:
        'We may suspend or terminate access immediately, without refund, if we reasonably believe the Services are being used in breach of this clause or in a manner that threatens the security or integrity of the platform or the data of any other School.',
    },
    {
      heading: '6. Data ownership and access',
      paragraphs: [
        'Institution Data belongs to the School. We do not claim ownership over Institution Data or Personal Data. We process it only to provide and support the Services, to comply with law, and as otherwise permitted by these Terms.',
        'We may access Institution Data on a limited, need-to-know basis for support, security, backup, billing and maintenance purposes, in accordance with our Privacy Policy. Our internal access is restricted through role-based controls and recorded in an audit log.',
        'Upon termination, the School may request an export of its Institution Data. We will provide the export in a commonly used machine-readable format. After a period of 90 days following termination, we may permanently delete the Institution Data, except for data we must retain to comply with law.',
      ],
    },
    {
      heading: '7. Intellectual property',
      paragraphs: [
        `The Services, including all software, source code, design, text, graphics, logos and documentation (excluding Institution Data), are owned by ${LEGAL_ENTITY} or its licensors and are protected by applicable intellectual property laws. No rights are granted to you except the limited, non-exclusive, non-transferable right to use the Services during your subscription, in accordance with these Terms.`,
      ],
    },
    {
      heading: '8. Client references and branding',
      paragraphs: [
        'By subscribing to the Services, the School grants us a licence to identify it as a customer. This means we may display the School\u2019s name, logo and general institutional details (such as city and board) in a clients, partners or customers section of our website and in other marketing material such as presentations, proposals and brochures.',
      ],
      bullets: [
        'This licence is non-exclusive, royalty-free and worldwide, and includes the right to reproduce and display the School\u2019s name and logo for the limited purpose of identifying the School as a customer.',
        'This licence is independent of the subscription term and survives termination or expiry of the subscription.',
        'Because customer references are historical facts (namely, that the School used the Services) and are necessary to maintain an accurate record of our customers, this licence continues until we choose to withdraw or remove the reference.',
        'We will not use the School\u2019s name or logo in a manner that suggests endorsement of, or partnership in, any product other than the Services.',
        'We will cease using the School\u2019s name and logo promptly upon a written request from an authorised representative of the School, and in any event within 30 days, after which the licence in this clause ends.',
        'We will never publish student names, photographs or student records in marketing material without specific written consent.',
      ],
      highlight:
        'If you do not want your institution shown as a customer, write to us at ' +
        LEGAL_EMAIL +
        ' and we will exclude you. Schools that wish to be listed but later change their mind may also request removal at any time, in which case we will remove the reference within 30 days.',
    },
    {
      heading: '9. Third-party services',
      paragraphs: [
        'The Services depend on third-party infrastructure and service providers, including cloud hosting and database services. You acknowledge that such providers may process data on our behalf under contract, as described in our Privacy Policy. We are not responsible for the acts or omissions of independent third parties outside our reasonable control, but we remain responsible to the School for the performance of our obligations under these Terms.',
      ],
    },
    {
      heading: '10. Availability, support and changes',
      bullets: [
        'We aim to keep the Services available continuously, but we do not guarantee uninterrupted or error-free operation. Access may be suspended for scheduled maintenance, upgrades, or events beyond our reasonable control.',
        'We will provide reasonable support through the channels we publish from time to time.',
        'We may modify, add or remove features of the Services. Where a change materially reduces core functionality, we will provide reasonable prior notice to the School.',
      ],
    },
    {
      heading: '11. Warranties and disclaimers',
      paragraphs: [
        'We warrant that we will provide the Services with reasonable skill and care and substantially in accordance with our published documentation. Except for that warranty, and to the maximum extent permitted by law, the Services are provided on an "as is" and "as available" basis without warranties of any kind, whether express or implied, including any implied warranty of merchantability, fitness for a particular purpose or non-infringement.',
        'We do not warrant that the Services will meet every specific requirement of the School, or that output generated by the Services (including generated certificates or reports) will satisfy the requirements of any examination board, government authority or third party. The School is responsible for reviewing the accuracy of any document generated through the Services before it is issued.',
      ],
    },
    {
      heading: '12. Limitation of liability',
      paragraphs: [
        'To the maximum extent permitted by applicable law, neither party shall be liable for any indirect, incidental, special, consequential or punitive damages, or for any loss of profit, revenue, goodwill, anticipated savings or data, arising out of or in connection with these Terms, whether based in contract, tort, negligence or otherwise, even if advised of the possibility of such damages.',
        `Our total aggregate liability arising out of or in connection with these Terms shall not exceed the subscription fees actually paid by the School to us in the 12 months immediately preceding the event giving rise to the claim.`,
        'Nothing in these Terms excludes or limits liability that cannot be excluded or limited under applicable law, including for fraud, wilful misconduct, or any liability arising under the Digital Personal Data Protection Act, 2023.',
      ],
    },
    {
      heading: '13. Indemnity',
      paragraphs: [
        'The School shall indemnify and hold harmless ' +
          LEGAL_ENTITY +
          ', its directors, employees and agents against any claim, loss, liability, cost or expense (including reasonable legal fees) arising from: (a) Institution Data uploaded by the School; (b) the School\u2019s failure to obtain necessary consents from parents, guardians, students or staff; (c) the School\u2019s breach of these Terms or applicable law; or (d) any claim by a parent, guardian, student or staff member relating to the School\u2019s use of the Services.',
      ],
    },
    {
      heading: '14. Suspension and termination',
      bullets: [
        'Either party may terminate the subscription with 30 days\u2019 written notice.',
        'We may suspend the Services immediately if fees remain unpaid beyond the agreed period, if required by law, or if continued provision would create a security or legal risk.',
        'On termination, access to the Services ends, and the data export provisions in clause 6 apply.',
        'Clauses relating to intellectual property, client references, warranties and disclaimers, limitation of liability, indemnity, and governing law survive termination.',
      ],
    },
    DISPUTE_RESOLUTION,
    {
      heading: '15. Notices',
      paragraphs: [
        `Notices to us must be sent to ${LEGAL_EMAIL} and, in the case of legal notices, to our registered office at ${LEGAL_ADDRESS}. Notices to you may be sent to the email address registered on your account.`,
      ],
    },
    {
      heading: '16. Changes to these Terms',
      paragraphs: [
        'We may update these Terms from time to time. Where a change is material, we will provide reasonable notice through the Services or by email. Continued use of the Services after the effective date constitutes acceptance of the revised Terms.',
      ],
    },
    GOVERNING_LAW,
  ],
};

// ---------------------------------------------------------------------------
// 2. PRIVACY POLICY
// ---------------------------------------------------------------------------
export const PRIVACY: LegalDoc = {
  slug: 'privacy',
  title: 'Privacy Policy',
  seoTitle: 'Privacy Policy — SchoolSense School Management Platform',
  description:
    'How SchoolSense collects, uses, stores and protects personal data belonging to schools, teachers, parents and students, and the rights available to data principals under the Digital Personal Data Protection Act, 2023.',
  lastUpdated: '8 October 2026',
  intro: `${LEGAL_ENTITY} provides school management software to educational institutions in India. This Privacy Policy explains what personal data we handle, why we handle it, how we protect it, and the choices available to you. It is written to be read by school administrators, teachers and parents — not only by lawyers.`,
  sections: [
    {
      heading: '1. Our role: who decides what',
      paragraphs: [
        'The School that subscribes to SchoolSense is the data fiduciary. The School decides what student, guardian and staff information is entered into the platform. We act as a data processor on the School\u2019s instructions.',
        'This means that if you are a parent, guardian or student and you want to access, correct or delete information held about you, your first point of contact is your School. We will assist the School in responding to such requests, and we will also respond directly where the law requires us to.',
      ],
      highlight:
        'If you are a parent or student, please contact your school first for any request about your data. If you are unable to reach them, write to us at ' +
        PRIVACY_EMAIL +
        ' and we will help.',
    },
    {
      heading: '2. Personal data we handle',
      paragraphs: ['Depending on how your School uses the platform, we may handle the following categories of data:'],
      bullets: [
        'Identity and contact data: name, date of birth, gender, blood group, nationality, photograph, email address and mobile number.',
        'Student records: admission number, class, section, roll number, attendance, homework, examination marks, results and generated documents such as transfer or character certificates.',
        'Guardian information: name, relationship to the student, occupation, contact details and permission to collect the child.',
        'Staff information: name, role, contact details and teaching assignments.',
        'Fee and billing data: fee structures, invoices, payment status and receipts.',
        'Support, complaint and communication data: grievances raised, replies exchanged and notices published.',
        'Technical data: login timestamps, IP address and user agent information recorded in audit logs for security purposes.',
        'Website enquiry data: name, phone number and other details you submit through our website enquiry form.',
      ],
      highlight:
        'We do not collect biometric data, and we do not use student data for advertising, profiling or any commercial purpose other than providing the Services to the School.',
    },
    {
      heading: '3. How we use personal data',
      bullets: [
        'To provide the Services — displaying attendance, homework, marks, fees and notices to the people entitled to see them.',
        'To communicate with schools about their account, billing, support requests and service changes.',
        'To keep the platform secure — detecting unauthorised access, preventing misuse and maintaining audit logs.',
        'To meet legal and accounting obligations, including tax and statutory record-keeping.',
        'To improve the Services, using aggregated or de-identified information that does not identify any individual.',
      ],
      paragraphs: [
        'We do not sell personal data. We do not share personal data with advertisers. We do not use any personal data to train external artificial intelligence models.',
      ],
    },
    {
      heading: '4. Legal basis for processing',
      paragraphs: [
        'Under the Digital Personal Data Protection Act, 2023, we process personal data on the basis of the consent obtained by the School from parents, guardians, students and staff, and for certain legitimate uses permitted by that Act, such as complying with legal obligations, responding to medical emergencies, and ensuring the safety and security of the platform.',
      ],
    },
    {
      heading: '5. Who can see your data',
      paragraphs: [
        'Access is restricted by role. Within a School, a principal or administrator sees school-wide information; a class teacher sees the students in their class; a parent sees only their own child; and a student sees only their own information. Access is enforced by the platform itself, not merely by policy.',
        'Our own staff may access data only on a limited, need-to-know basis for support, security, backup and billing, and such access is recorded in an audit log.',
      ],
    },
    {
      heading: '6. Service providers we use',
      paragraphs: [
        'We use a small number of carefully selected service providers to operate the platform. These providers process data only on our instructions and under contractual confidentiality and data protection obligations.',
      ],
      bullets: [
        'Cloud database, storage and infrastructure hosting, with data stored in the Mumbai (ap-south-1) region of our cloud provider.',
        'Email and communication services for transactional messages such as account notifications.',
        'Payment and billing processing for subscription payments made by the School.',
      ],
      highlight:
        'Where any processing involves a transfer of personal data outside India, we will do so only in accordance with applicable law and with appropriate safeguards.',
    },
    {
      heading: '7. How we protect data',
      bullets: [
        'Encryption of data while in transit and while stored.',
        'Role-based access control, so each user sees only what their role permits.',
        'Passwords stored only as one-way cryptographic hashes — no one, including our team, can read them.',
        'Logging of sensitive actions in an audit trail.',
        'Regular backups and monitored infrastructure.',
        'Access limited to authorised personnel on a need-to-know basis.',
      ],
      paragraphs: [
        'No system can be guaranteed completely secure. If we become aware of a personal data breach that is likely to affect you, we will notify the affected School and the Data Protection Board of India as required by law, and we will work with the School to inform affected individuals where necessary.',
      ],
    },
    {
      heading: '8. How long we keep data',
      paragraphs: [
        'We retain Institution Data for as long as the School\u2019s subscription is active. After termination, we make the data available for export for 90 days, after which it is deleted from live systems, subject to retention required by law and to routine backup cycles.',
        'Website enquiry data is retained for as long as needed to respond to your enquiry and for a reasonable period afterwards for record-keeping.',
      ],
    },
    {
      heading: '9. Your rights',
      paragraphs: ['Subject to applicable law, you have the right to:'],
      bullets: [
        'access a summary of the personal data we hold about you and how it is being processed;',
        'request correction of inaccurate or incomplete data;',
        'request erasure of data where it is no longer necessary for the purpose for which it was collected;',
        'withdraw consent, where processing is based on consent;',
        'nominate another individual to exercise your rights in the event of death or incapacity; and',
        'raise a grievance with our Grievance Officer.',
      ],
      highlight:
        'Parents and students should direct requests to their School in the first instance, since the School controls the data. We will assist the School in fulfilling the request.',
    },
    {
      heading: '10. Children\u2019s data',
      paragraphs: [
        'The platform necessarily processes information about children because it is a school management system. We handle such data strictly for educational and administrative purposes, on the instructions of the School. We do not use children\u2019s data for behavioural monitoring, targeted advertising, or any purpose that is detrimental to the well-being of a child. A parent or guardian may contact the School at any time to review information held about their child.',
      ],
    },
    {
      heading: '11. Cookies and local storage',
      paragraphs: [
        'Our website uses minimal cookies and browser local storage strictly to keep you signed in and to remember your preferences. We do not use third-party advertising or tracking cookies. You may clear this data at any time through your browser settings, although you will need to sign in again.',
      ],
    },
    {
      heading: '12. Grievance Officer',
      paragraphs: [
        `In accordance with the Digital Personal Data Protection Act, 2023 and applicable rules, our Grievance Officer is:`,
      ],
      bullets: [
        `Name: ${GRIEVANCE_OFFICER}`,
        `Email: ${PRIVACY_EMAIL}`,
        `Telephone: ${GRIEVANCE_PHONE}`,
        `Address: ${LEGAL_ADDRESS}`,
        'Business hours: Monday to Friday, 10:00 to 18:00 IST, excluding public holidays.',
      ],
      highlight:
        'We aim to acknowledge every grievance within 48 hours and to resolve it within 30 days of receipt.',
    },
    {
      heading: '13. Changes to this policy',
      paragraphs: [
        'We may update this Privacy Policy from time to time. Where changes are material, we will notify schools through the platform or by email. The "last updated" date at the top of this page shows when it was last revised.',
      ],
    },
    {
      heading: '14. Contact us',
      paragraphs: [
        `For privacy questions, write to ${PRIVACY_EMAIL}. For general support, write to ${SUPPORT_EMAIL}. Our registered office is ${LEGAL_ADDRESS}.`,
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// 3. DATA PROCESSING AGREEMENT (for schools)
// ---------------------------------------------------------------------------
export const DPA: LegalDoc = {
  slug: 'data-processing',
  title: 'Data Processing Agreement',
  seoTitle: 'Data Processing Agreement — SchoolSense (for Schools)',
  description:
    'The data processing terms that apply between SchoolSense as data processor and each subscribing school as data fiduciary, covering instructions, confidentiality, security, sub-processors, breach notification and audit.',
  lastUpdated: '8 October 2026',
  intro: `This Data Processing Agreement ("DPA") forms part of the agreement between ${LEGAL_ENTITY} ("Processor") and the subscribing School ("Fiduciary"). It applies where we process personal data on the School's behalf in the course of providing the Services. Where there is a conflict between this DPA and the Terms and Conditions in relation to the processing of personal data, this DPA prevails.`,
  sections: [
    {
      heading: '1. Roles and scope',
      paragraphs: [
        'The School is the data fiduciary and determines the purpose and means of processing personal data entered into the platform. We process that personal data only as a data processor, and only in accordance with the School\u2019s documented instructions, including those set out in this DPA and in the Terms and Conditions.',
        'This DPA covers the categories of data listed in our Privacy Policy, and the processing activities reasonably necessary to deliver the Services, including storage, retrieval, display, transmission, backup, and generation of reports and certificates.',
      ],
    },
    {
      heading: '2. Our obligations',
      bullets: [
        'Process personal data only on the School\u2019s instructions and only for the purposes of providing the Services.',
        'Ensure that personnel authorised to process personal data are bound by appropriate confidentiality obligations.',
        'Implement and maintain the technical and organisational security measures described in our Privacy Policy.',
        'Assist the School, so far as reasonably possible, in responding to requests from data principals exercising their rights under the Digital Personal Data Protection Act, 2023.',
        'Assist the School in ensuring compliance with its obligations relating to security, breach notification and data protection impact assessments.',
        'Delete or return personal data at the end of the provision of Services, in accordance with the retention provisions in the Terms and Conditions.',
      ],
    },
    {
      heading: '3. School obligations',
      bullets: [
        'Provide accurate and lawful instructions for the processing of personal data.',
        'Obtain and maintain all consents and provide all notices required to permit the processing contemplated by the agreement.',
        'Ensure that the personal data it uploads is accurate, relevant and limited to what is necessary.',
        'Not instruct us to process personal data in a manner that would breach applicable law.',
      ],
    },
    {
      heading: '4. Sub-processors',
      paragraphs: [
        'The School provides general authorisation for us to engage sub-processors to support the delivery of the Services, including cloud hosting and infrastructure providers, email providers and payment processors. A current list is available on request.',
        'We will: (a) enter into a written agreement with each sub-processor imposing data protection obligations no less protective than those in this DPA; (b) remain liable to the School for the performance of our sub-processors\u2019 data protection obligations; and (c) notify the School of any intended change to sub-processors so that the School may object on reasonable data protection grounds.',
      ],
      highlight:
        'Infrastructure data is stored in the Mumbai (ap-south-1) region. Any transfer of personal data outside India will be carried out in accordance with applicable law.',
    },
    {
      heading: '5. Security measures',
      paragraphs: ['We maintain, at a minimum:'],
      bullets: [
        'encryption of personal data in transit and at rest;',
        'role-based access controls enforced at the application and database level;',
        'storage of passwords only as one-way cryptographic hashes;',
        'audit logging of sensitive actions;',
        'regular backups and tested recovery procedures;',
        'restriction of internal access on a need-to-know basis; and',
        'a process for identifying and remediating security vulnerabilities.',
      ],
    },
    {
      heading: '6. Personal data breach',
      paragraphs: [
        'We will notify the School without undue delay, and in any event within 72 hours of becoming aware of a personal data breach affecting the School\u2019s data, providing sufficient information for the School to meet its own notification obligations. We will take reasonable steps to mitigate the breach and to prevent recurrence, and will cooperate with the School and any regulator in relation to the incident.',
      ],
    },
    {
      heading: '7. Audits',
      paragraphs: [
        'We will make available to the School such information as is reasonably necessary to demonstrate compliance with this DPA. Where a School requires further assurance, we will cooperate with a reasonable audit, subject to: at least 30 days\u2019 written notice; the audit being conducted during business hours and not more than once in any 12-month period (unless required by a regulator or following a material breach); the audit being carried out by an independent auditor bound by confidentiality; and the auditor not accessing data belonging to any other School.',
      ],
    },
    {
      heading: '8. Liability and governing law',
      paragraphs: [
        'Liability under this DPA is subject to the limitations set out in the Terms and Conditions. This DPA is governed by the laws of India, and disputes are subject to the dispute resolution and jurisdiction provisions of the Terms and Conditions.',
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// 4. ACCEPTABLE USE POLICY
// ---------------------------------------------------------------------------
export const ACCEPTABLE_USE: LegalDoc = {
  slug: 'acceptable-use',
  title: 'Acceptable Use Policy',
  seoTitle: 'Acceptable Use Policy — SchoolSense School Management Platform',
  description:
    'The rules that apply to schools and their users when using the SchoolSense platform, with a clear explanation of what happens if an account is misused, so that every school and family on the platform stays protected.',
  lastUpdated: '8 October 2026',
  intro: `This Acceptable Use Policy explains what is and is not permitted when using SchoolSense. It exists to protect every school, teacher, parent and student on the platform. It applies to all users, including school administrators, teachers, other staff, guardians and students.`,
  sections: [
    {
      heading: '1. Our core commitment',
      paragraphs: [
        'SchoolSense is a multi-tenant platform: many schools use the same software infrastructure, with each school\u2019s data kept separate. Protecting that separation is fundamental. Any attempt to access, view, modify or interfere with another school\u2019s data is treated as a serious breach, and we act on it immediately.',
      ],
      highlight:
        'The platform enforces school separation technically through role-based access control and secure sessions, in addition to this policy. We do not rely on users to behave correctly; the system is designed to make cross-school access impossible through the normal interface.',
    },
    {
      heading: '2. Account and credential rules',
      bullets: [
        'Do not share your login credentials with anyone.',
        'Do not create accounts for people who are not authorised members of your institution.',
        'Report any suspected unauthorised access to your account immediately.',
        'Schools must deactivate accounts of staff or guardians who are no longer associated with the institution.',
      ],
    },
    {
      heading: '3. Prohibited activity',
      paragraphs: ['You must not:'],
      bullets: [
        'attempt to access data belonging to another school, or attempt to identify the existence of another school\u2019s data;',
        'probe, scan, or test the vulnerability of the platform without our prior written authorisation;',
        'attempt to bypass, disable or circumvent authentication, authorisation or security controls;',
        'upload viruses, malware, or any code designed to disrupt or damage the platform;',
        'scrape, crawl, or bulk-extract data other than through the export functions we provide;',
        'upload content that is unlawful, defamatory, obscene, or that infringes another person\u2019s rights;',
        'upload personal data that you do not have lawful authority to upload;',
        'send unsolicited commercial communications through the platform;',
        'use the platform in any way that harms a child, or that is detrimental to the well-being of any student;',
        'misrepresent your identity or your affiliation with any institution; or',
        'resell, sublicense, or provide access to the platform to any third party without our written consent.',
      ],
    },
    {
      heading: '4. Content standards',
      paragraphs: [
        'Anything uploaded to the platform — notices, complaint messages, homework descriptions, remarks — must be respectful and lawful, and appropriate for an educational setting. This is particularly important because much of the content on the platform is read by children.',
      ],
    },
    {
      heading: '5. What happens if this policy is breached',
      paragraphs: [
        'The action we take depends on the seriousness of the breach, and we aim to be proportionate. For example, a shared password would normally lead to a warning and a requirement to reset credentials. An attempt to access another school\u2019s data is treated far more seriously because it threatens the trust of every school on the platform.',
      ],
      bullets: [
        'For minor or first-time breaches: a written warning and a requirement to rectify the conduct.',
        'For repeated breaches: temporary suspension of the individual account or of specific features.',
        'For serious breaches, including any attempt to access another school\u2019s data, uploading malicious code, or interfering with platform security: immediate suspension of the School\u2019s access, termination of the subscription, and where appropriate, notification to law enforcement and to the affected school.',
      ],
      highlight:
        'Where a breach by an individual user is attributable to a School\u2019s failure to manage its accounts properly, we may suspend the School\u2019s access until the issue is resolved.',
    },
    {
      heading: '6. Reporting a problem',
      paragraphs: [
        `If you believe the platform has been misused, or you have discovered a security issue, please contact us at ${SUPPORT_EMAIL}. We welcome responsible security reports and will investigate every report we receive. We ask that you do not publicly disclose a security issue before we have had a reasonable opportunity to address it.`,
      ],
    },
    {
      heading: '7. Changes',
      paragraphs: [
        'We may update this policy from time to time to address new risks. Material changes will be communicated to schools through the platform or by email.',
      ],
    },
  ],
};

export const ALL_LEGAL_DOCS = [TERMS, PRIVACY, DPA, ACCEPTABLE_USE];

export function findLegalDoc(slug: string): LegalDoc | undefined {
  return ALL_LEGAL_DOCS.find((d) => d.slug === slug);
}
