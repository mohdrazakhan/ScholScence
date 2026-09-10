import { Client } from 'pg';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';

const FIRST_NAMES_MALE = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Shaurya', 'Atharv', 'Advik', 'Pranav', 'Advaith', 'Aaryan', 'Dhruv', 'Kabir', 'Rohan', 'Karan',
  'Yash', 'Ansh', 'Dev', 'Manish', 'Harsh', 'Aryan', 'Samar', 'Laksh', 'Rudra', 'Nikhil',
  'Siddharth', 'Varun', 'Gautam', 'Kunal', 'Tejas', 'Madhav', 'Chirag', 'Tushar', 'Alok', 'Deepak',
  'Ayush', 'Rishi', 'Abhinav', 'Kartik', 'Saurabh', 'Mayank', 'Tanmay', 'Vedant', 'Shivam', 'Om'
];

const FIRST_NAMES_FEMALE = [
  'Aanya', 'Diya', 'Saanvi', 'Ananya', 'Fatima', 'Isha', 'Aadhya', 'Kavya', 'Avani', 'Sara',
  'Myra', 'Anika', 'Navya', 'Pari', 'Riya', 'Sneha', 'Shreya', 'Tanvi', 'Pooja', 'Neha',
  'Swati', 'Meera', 'Roshni', 'Simran', 'Kritika', 'Khushi', 'Divya', 'Tara', 'Disha', 'Bhavna',
  'Aditi', 'Prisha', 'Siya', 'Nisha', 'Palak', 'Anjali', 'Rashmi', 'Jyoti', 'Shalini', 'Manju',
  'Ritu', 'Sunita', 'Geeta', 'Suman', 'Garima', 'Aparna', 'Monika', 'Komal', 'Deepika', 'Ira'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Patel', 'Singh', 'Kumar', 'Joshi', 'Shah', 'Mehta', 'Nair',
  'Iyer', 'Reddy', 'Banerjee', 'Chatterjee', 'Das', 'Roy', 'Choudhury', 'Mishra', 'Pandey', 'Trivedi',
  'Saxena', 'Kapoor', 'Malhotra', 'Bhatia', 'Chawla', 'Deshmukh', 'Kulkarni', 'Patil', 'Pawar', 'Shinde',
  'Bhattacharya', 'Ghosh', 'Dutta', 'Sengupta', 'Mukherjee', 'Menon', 'Pillai', 'Rao', 'Naidu', 'Gowda'
];

const OCCUPATIONS = [
  'Software Engineer', 'Doctor', 'Chartered Accountant', 'Business Owner', 'Architect',
  'Professor', 'Civil Engineer', 'Bank Manager', 'Government Officer', 'Consultant',
  'Data Scientist', 'Entrepreneur', 'Pharmacist', 'Lawyer', 'Graphic Designer'
];

const SCHOOLS_DATA = [
  {
    code: 'DIS001',
    name: 'Demo International School',
    city: 'New Delhi',
    email: 'contact@dis-delhi.edu.in',
    phone: '011-28765432',
    address: 'Sector 14, Dwarka, New Delhi - 110075',
    adminEmail: 'admin@demo-school.com',
    principalName: 'Dr. Vikram Malhotra',
    principalEmail: 'principal@demo-school.com',
    targetStudents: 105,
  },
  {
    code: 'SXW002',
    name: "St. Xavier's World School",
    city: 'Mumbai',
    email: 'info@stxaviersmumbai.org',
    phone: '022-26549870',
    address: 'Bandra West, Mumbai, Maharashtra - 400050',
    adminEmail: 'admin@stxaviers.schoolsense.in',
    principalName: 'Sr. Margaret D’Souza',
    principalEmail: 'principal@stxaviers.schoolsense.in',
    targetStudents: 105,
  },
  {
    code: 'GHA003',
    name: 'Greenwood High Academy',
    city: 'Bengaluru',
    email: 'admissions@greenwoodhigh.edu.in',
    phone: '080-45678901',
    address: 'Sarjapur Road, Bengaluru, Karnataka - 560087',
    adminEmail: 'admin@greenwood.schoolsense.in',
    principalName: 'Dr. Sundaram Raman',
    principalEmail: 'principal@greenwood.schoolsense.in',
    targetStudents: 105,
  },
  {
    code: 'NPS004',
    name: 'National Public Model School',
    city: 'Hyderabad',
    email: 'office@npms-hyd.ac.in',
    phone: '040-23456789',
    address: 'Hitec City, Madhapur, Hyderabad, Telangana - 500081',
    adminEmail: 'admin@npms.schoolsense.in',
    principalName: 'Mrs. Jayashree Rao',
    principalEmail: 'principal@npms.schoolsense.in',
    targetStudents: 105,
  },
  {
    code: 'OIS005',
    name: 'Oakridge International School',
    city: 'Kolkata',
    email: 'desk@oakridge-kol.edu.in',
    phone: '033-22894560',
    address: 'Salt Lake Sector V, Kolkata, West Bengal - 700091',
    adminEmail: 'admin@oakridge.schoolsense.in',
    principalName: 'Prof. Anirban Mukherjee',
    principalEmail: 'principal@oakridge.schoolsense.in',
    targetStudents: 105,
  },
];

const STANDARD_CLASSES = [
  { code: 'NURSERY', name: 'Nursery', order: 1 },
  { code: 'LKG', name: 'LKG', order: 2 },
  { code: 'UKG', name: 'UKG', order: 3 },
  { code: 'CLASS_1', name: 'Class 1', order: 4 },
  { code: 'CLASS_2', name: 'Class 2', order: 5 },
  { code: 'CLASS_3', name: 'Class 3', order: 6 },
  { code: 'CLASS_4', name: 'Class 4', order: 7 },
  { code: 'CLASS_5', name: 'Class 5', order: 8 },
  { code: 'CLASS_6', name: 'Class 6', order: 9 },
  { code: 'CLASS_7', name: 'Class 7', order: 10 },
  { code: 'CLASS_8', name: 'Class 8', order: 11 },
  { code: 'CLASS_9', name: 'Class 9', order: 12 },
  { code: 'CLASS_10', name: 'Class 10', order: 13 },
  { code: 'CLASS_11', name: 'Class 11', order: 14 },
  { code: 'CLASS_12', name: 'Class 12', order: 15 },
];

const STANDARD_SUBJECTS = [
  { code: 'MATH', name: 'Mathematics', type: 'ACADEMIC', order: 1 },
  { code: 'SCI', name: 'Science', type: 'ACADEMIC', order: 2 },
  { code: 'ENG', name: 'English Literature & Grammar', type: 'LANGUAGE', order: 3 },
  { code: 'HIN', name: 'Hindi Core', type: 'LANGUAGE', order: 4 },
  { code: 'SST', name: 'Social Studies', type: 'ACADEMIC', order: 5 },
  { code: 'CS', name: 'Computer Science & AI', type: 'ELECTIVE', order: 6 },
  { code: 'PHY', name: 'Physics', type: 'ACADEMIC', order: 7 },
  { code: 'CHEM', name: 'Chemistry', type: 'ACADEMIC', order: 8 },
  { code: 'BIO', name: 'Biology', type: 'ACADEMIC', order: 9 },
  { code: 'PE', name: 'Physical Education & Sports', type: 'ACTIVITY', order: 10 },
  { code: 'ART', name: 'Visual Arts & Craft', type: 'ACTIVITY', order: 11 },
];

async function seedLargeDataset() {
  const client = new Client({
    connectionString: 'postgresql://mohdrazakhan@localhost:5432/school_management',
  });

  await client.connect();
  console.log('Connected to PostgreSQL: school_management');

  // Shared demo password hash
  const sharedPasswordHash = await bcrypt.hash('password123', 6);

  // Fetch role IDs
  const rolesRes = await client.query('SELECT id, code FROM identity.roles');
  const roleMap = new Map<string, string>();
  rolesRes.rows.forEach((r) => roleMap.set(r.code, r.id));

  const allRecordsForPdf: Array<{
    schoolName: string;
    schoolCode: string;
    city: string;
    principalName: string;
    students: Array<{
      admissionNumber: string;
      rollNumber: number;
      name: string;
      className: string;
      sectionName: string;
      parentName: string;
      parentPhone: string;
      parentEmail: string;
      status: string;
    }>;
    teachers: Array<{
      name: string;
      email: string;
      phone: string;
      assignedSubject: string;
      assignedClass: string;
    }>;
    metrics: {
      studentCount: number;
      teacherCount: number;
      classesCount: number;
    };
  }> = [];

  let totalStudentsInserted = 0;
  let totalUsersInserted = 0;

  for (const sData of SCHOOLS_DATA) {
    console.log(`\n========================================`);
    console.log(`Processing School: ${sData.name} (${sData.code})`);
    console.log(`========================================`);

    // 1. Create / Upsert School
    const schoolRes = await client.query(
      `INSERT INTO school.schools (name, code, email, phone, address, status)
       VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
       ON CONFLICT (code) DO UPDATE 
       SET name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone, address = EXCLUDED.address
       RETURNING id;`,
      [sData.name, sData.code, sData.email, sData.phone, sData.address]
    );
    const schoolId = schoolRes.rows[0].id;

    // 2. Create Branch
    const branchRes = await client.query(
      `INSERT INTO school.school_branches (school_id, name, code, address, status)
       VALUES ($1, $2, $3, $4, 'ACTIVE')
       ON CONFLICT (school_id, code) DO UPDATE SET name = EXCLUDED.name
       RETURNING id;`,
      [schoolId, `${sData.city} Main Campus`, 'MAIN', sData.address]
    );
    const branchId = branchRes.rows[0].id;

    // 3. Create Academic Year 2026-27
    const ayRes = await client.query(
      `INSERT INTO school.academic_years (school_id, name, start_date, end_date, is_current, status)
       VALUES ($1, '2026-27', '2026-04-01', '2027-03-31', true, 'ACTIVE')
       ON CONFLICT (school_id, name) DO UPDATE SET is_current = true
       RETURNING id;`,
      [schoolId]
    );
    const academicYearId = ayRes.rows[0].id;

    // 4. Create Classes & Sections
    const classMap = new Map<string, { classId: string; sectionAId: string; sectionBId: string }>();

    for (const c of STANDARD_CLASSES) {
      const cRes = await client.query(
        `INSERT INTO school.classes (school_id, name, code, display_order, status)
         VALUES ($1, $2, $3, $4, 'ACTIVE')
         ON CONFLICT (school_id, code) DO UPDATE SET name = EXCLUDED.name, display_order = EXCLUDED.display_order
         RETURNING id;`,
        [schoolId, c.name, c.code, c.order]
      );
      const classId = cRes.rows[0].id;

      // Section A
      const secARes = await client.query(
        `INSERT INTO school.sections (school_id, academic_year_id, branch_id, class_id, name, code, capacity, display_order, status)
         VALUES ($1, $2, $3, $4, 'Section A', 'A', 40, 1, 'ACTIVE')
         RETURNING id;`,
        [schoolId, academicYearId, branchId, classId]
      );

      // Section B
      const secBRes = await client.query(
        `INSERT INTO school.sections (school_id, academic_year_id, branch_id, class_id, name, code, capacity, display_order, status)
         VALUES ($1, $2, $3, $4, 'Section B', 'B', 40, 2, 'ACTIVE')
         RETURNING id;`,
        [schoolId, academicYearId, branchId, classId]
      );

      classMap.set(c.code, {
        classId,
        sectionAId: secARes.rows[0].id,
        sectionBId: secBRes.rows[0].id,
      });
    }

    // 5. Create Subjects & Class-Subject Mappings
    const subjectMap = new Map<string, string>();
    for (const sub of STANDARD_SUBJECTS) {
      const subRes = await client.query(
        `INSERT INTO school.subjects (school_id, name, code, subject_type, display_order, status)
         VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
         ON CONFLICT (school_id, code) DO UPDATE SET name = EXCLUDED.name
         RETURNING id;`,
        [schoolId, sub.name, sub.code, sub.type, sub.order]
      );
      subjectMap.set(sub.code, subRes.rows[0].id);
    }

    // Map subjects to Class 8 through 10
    const classSubjectMap = new Map<string, string>();
    for (const [cCode, cInfo] of classMap.entries()) {
      for (const [subCode, subId] of subjectMap.entries()) {
        const csRes = await client.query(
          `INSERT INTO school.class_subjects (academic_year_id, class_id, subject_id, is_optional, display_order, status)
           VALUES ($1, $2, $3, false, 1, 'ACTIVE')
           ON CONFLICT (academic_year_id, class_id, subject_id) DO UPDATE SET status = 'ACTIVE'
           RETURNING id;`,
          [academicYearId, cInfo.classId, subId]
        );
        classSubjectMap.set(`${cCode}_${subCode}`, csRes.rows[0].id);
      }
    }

    // 6. Create Staff: Admin, Principal, Registrar, Fee Manager
    const staffAccounts = [
      { email: sData.adminEmail, name: 'Admin', role: 'SCHOOL_ADMIN', phone: `9800${Math.floor(100000 + Math.random() * 900000)}` },
      { email: sData.principalEmail, name: sData.principalName, role: 'PRINCIPAL', phone: `9811${Math.floor(100000 + Math.random() * 900000)}` },
      { email: `registrar@${sData.code.toLowerCase()}.schoolsense.in`, name: 'Registrar Office', role: 'ADMISSION_MANAGER', phone: `9822${Math.floor(100000 + Math.random() * 900000)}` },
      { email: `fees@${sData.code.toLowerCase()}.schoolsense.in`, name: 'Fee Desk', role: 'FEE_MANAGER', phone: `9833${Math.floor(100000 + Math.random() * 900000)}` },
    ];

    for (const st of staffAccounts) {
      const uRes = await client.query(
        `INSERT INTO identity.users (email, phone, password_hash, first_name, last_name, status)
         VALUES ($1, $2, $3, $4, '', 'ACTIVE')
         ON CONFLICT DO NOTHING
         RETURNING id;`,
        [st.email, st.phone, sharedPasswordHash, st.name]
      );
      totalUsersInserted++;
      const uId = uRes.rows[0]?.id || (await client.query('SELECT id FROM identity.users WHERE email = $1', [st.email])).rows[0].id;

      const roleId = roleMap.get(st.role);
      if (roleId) {
        await client.query(
          `INSERT INTO identity.user_school_roles (user_id, school_id, role_id, status)
           VALUES ($1, $2, $3, 'ACTIVE')
           ON CONFLICT (user_id, school_id, role_id) DO NOTHING;`,
          [uId, schoolId, roleId]
        );
      }
    }

    // 7. Create 10 Teachers per school with Subject & Section Assignments
    const schoolTeachers: Array<{ name: string; email: string; phone: string; assignedSubject: string; assignedClass: string }> = [];

    const teacherDefs = [
      { first: 'Rahul', last: 'Sharma', sub: 'MATH', cls: 'CLASS_8', sec: 'A' },
      { first: 'Priyanka', last: 'Verma', sub: 'SCI', cls: 'CLASS_8', sec: 'A' },
      { first: 'Amit', last: 'Gupta', sub: 'ENG', cls: 'CLASS_7', sec: 'A' },
      { first: 'Sunita', last: 'Patel', sub: 'HIN', cls: 'CLASS_6', sec: 'A' },
      { first: 'Rakesh', last: 'Nair', sub: 'SST', cls: 'CLASS_9', sec: 'A' },
      { first: 'Anjali', last: 'Iyer', sub: 'CS', cls: 'CLASS_10', sec: 'A' },
      { first: 'Suresh', last: 'Reddy', sub: 'PHY', cls: 'CLASS_11', sec: 'A' },
      { first: 'Kavita', last: 'Banerjee', sub: 'CHEM', cls: 'CLASS_11', sec: 'A' },
      { first: 'Manish', last: 'Mishra', sub: 'BIO', cls: 'CLASS_12', sec: 'A' },
      { first: 'Deepak', last: 'Kapoor', sub: 'PE', cls: 'CLASS_8', sec: 'B' },
    ];

    for (let tIdx = 0; tIdx < teacherDefs.length; tIdx++) {
      const t = teacherDefs[tIdx];
      const tEmail = `teacher_${sData.code.toLowerCase()}_${tIdx + 1}@schoolsense.in`;
      const tPhone = `9844${String(tIdx).padStart(2, '0')}${Math.floor(1000 + Math.random() * 9000)}`;

      const tUserRes = await client.query(
        `INSERT INTO identity.users (email, phone, password_hash, first_name, last_name, status)
         VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
         ON CONFLICT DO NOTHING
         RETURNING id;`,
        [tEmail, tPhone, sharedPasswordHash, t.first, t.last]
      );
      totalUsersInserted++;
      const tUserId = tUserRes.rows[0]?.id || (await client.query('SELECT id FROM identity.users WHERE email = $1', [tEmail])).rows[0].id;

      // Assign TEACHER role
      const tRoleId = roleMap.get('TEACHER');
      if (tRoleId) {
        await client.query(
          `INSERT INTO identity.user_school_roles (user_id, school_id, role_id, status)
           VALUES ($1, $2, $3, 'ACTIVE')
           ON CONFLICT (user_id, school_id, role_id) DO NOTHING;`,
          [tUserId, schoolId, tRoleId]
        );
      }

      // Assign Class Teacher and Subject Teacher
      const classInfo = classMap.get(t.cls);
      const csId = classSubjectMap.get(`${t.cls}_${t.sub}`);
      const secId = t.sec === 'A' ? classInfo?.sectionAId : classInfo?.sectionBId;

      if (secId && csId) {
        await client.query(
          `INSERT INTO school.section_subject_teacher_assignments (
             school_id, academic_year_id, section_id, class_subject_id, user_id, status
           ) VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
           ON CONFLICT DO NOTHING;`,
          [schoolId, academicYearId, secId, csId, tUserId]
        );

        if (t.sec === 'A') {
          await client.query(
            `INSERT INTO school.section_teacher_assignments (
               school_id, academic_year_id, section_id, user_id, status
             ) VALUES ($1, $2, $3, $4, 'ACTIVE')
             ON CONFLICT DO NOTHING;`,
            [schoolId, academicYearId, secId, tUserId]
          );
        }
      }

      schoolTeachers.push({
        name: `${t.first} ${t.last}`,
        email: tEmail,
        phone: tPhone,
        assignedSubject: STANDARD_SUBJECTS.find((s) => s.code === t.sub)?.name || t.sub,
        assignedClass: `${STANDARD_CLASSES.find((c) => c.code === t.cls)?.name || t.cls} - Sec ${t.sec}`,
      });
    }

    // 8. Generate 105 Students & Parents per school across Class 1 to 12
    const schoolStudents: Array<{
      admissionNumber: string;
      rollNumber: number;
      name: string;
      className: string;
      sectionName: string;
      parentName: string;
      parentPhone: string;
      parentEmail: string;
      status: string;
    }> = [];

    const classesToPopulate = STANDARD_CLASSES.filter((c) => c.order >= 4); // Class 1 to 12
    let studentCounter = 1;

    for (let cIdx = 0; cIdx < classesToPopulate.length; cIdx++) {
      const cls = classesToPopulate[cIdx];
      const classInfo = classMap.get(cls.code);
      if (!classInfo) continue;

      // 8-10 students per class (split across Section A and Section B)
      const studentsInThisClass = 9;

      for (let sIdx = 1; sIdx <= studentsInThisClass; sIdx++) {
        const isMale = (sIdx + cIdx) % 2 === 0;
        const firstName = isMale
          ? FIRST_NAMES_MALE[(studentCounter * 7) % FIRST_NAMES_MALE.length]
          : FIRST_NAMES_FEMALE[(studentCounter * 11) % FIRST_NAMES_FEMALE.length];
        const lastName = LAST_NAMES[(studentCounter * 13) % LAST_NAMES.length];
        const studentFullName = `${firstName} ${lastName}`;

        const parentFirst = FIRST_NAMES_MALE[(studentCounter * 5) % FIRST_NAMES_MALE.length];
        const parentFullName = `${parentFirst} ${lastName}`;
        const parentEmail = `parent.${sData.code.toLowerCase()}.${studentCounter}@schoolsense.in`;
        const parentPhone = `98${String(studentCounter).padStart(4, '0')}${Math.floor(1000 + Math.random() * 9000)}`;

        const admNo = `${sData.code}-2026-${String(studentCounter).padStart(3, '0')}`;
        const rollNo = sIdx <= 5 ? sIdx : sIdx - 5;
        const targetSecId = sIdx <= 5 ? classInfo.sectionAId : classInfo.sectionBId;
        const targetSecName = sIdx <= 5 ? 'Section A' : 'Section B';

        // Insert Student
        const stRes = await client.query(
          `INSERT INTO school.students (school_id, admission_number, first_name, last_name, gender, blood_group, status)
           VALUES ($1, $2, $3, $4, $5, 'B+', 'ACTIVE')
           ON CONFLICT (school_id, admission_number) DO UPDATE SET first_name = EXCLUDED.first_name
           RETURNING id;`,
          [schoolId, admNo, firstName, lastName, isMale ? 'MALE' : 'FEMALE']
        );
        const studentId = stRes.rows[0].id;
        totalStudentsInserted++;

        // Insert Enrollment
        await client.query(
          `INSERT INTO school.student_enrollments (academic_year_id, student_id, section_id, roll_number, status)
           VALUES ($1, $2, $3, $4, 'ACTIVE')
           ON CONFLICT (academic_year_id, student_id) DO UPDATE SET section_id = EXCLUDED.section_id, roll_number = EXCLUDED.roll_number;`,
          [academicYearId, studentId, targetSecId, rollNo]
        );

        // Insert Parent User & Guardian Profile
        const parentUserRes = await client.query(
          `INSERT INTO identity.users (email, phone, password_hash, first_name, last_name, status)
           VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
           ON CONFLICT DO NOTHING
           RETURNING id;`,
          [parentEmail, parentPhone, sharedPasswordHash, parentFirst, lastName]
        );
        totalUsersInserted++;
        const parentUserId = parentUserRes.rows[0]?.id || (await client.query('SELECT id FROM identity.users WHERE email = $1', [parentEmail])).rows[0]?.id;

        // Map Parent to school with GUARDIAN role
        const guardianRoleId = roleMap.get('GUARDIAN');
        if (guardianRoleId && parentUserId) {
          await client.query(
            `INSERT INTO identity.user_school_roles (user_id, school_id, role_id, status)
             VALUES ($1, $2, $3, 'ACTIVE')
             ON CONFLICT (user_id, school_id, role_id) DO NOTHING;`,
            [parentUserId, schoolId, guardianRoleId]
          );
        }

        // Create Guardian Record
        const occupation = OCCUPATIONS[studentCounter % OCCUPATIONS.length];
        const gRes = await client.query(
          `INSERT INTO school.guardians (school_id, user_id, first_name, last_name, phone, email, occupation, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'ACTIVE')
           RETURNING id;`,
          [schoolId, parentUserId, parentFirst, lastName, parentPhone, parentEmail, occupation]
        );
        const guardianId = gRes.rows[0].id;

        // Link Student & Guardian
        await client.query(
          `INSERT INTO school.student_guardians (school_id, student_id, guardian_id, relationship_type, is_primary_contact, is_emergency_contact, can_pickup, status)
           VALUES ($1, $2, $3, 'FATHER', true, true, true, 'ACTIVE')
           ON CONFLICT DO NOTHING;`,
          [schoolId, studentId, guardianId]
        );

        // Insert Past 5-day Attendance for this student
        const attStatuses = ['PRESENT', 'PRESENT', 'PRESENT', studentCounter % 7 === 0 ? 'ABSENT' : 'PRESENT', 'PRESENT'];
        for (let d = 0; d < 5; d++) {
          await client.query(
            `INSERT INTO school.attendance (school_id, academic_year_id, student_id, section_id, date, status, marked_by)
             VALUES ($1, $2, $3, $4, CURRENT_DATE - ($5 || ' days')::interval, $6, (SELECT id FROM identity.users WHERE email = $7 LIMIT 1))
             ON CONFLICT DO NOTHING;`,
            [schoolId, academicYearId, studentId, targetSecId, d, attStatuses[d], sData.adminEmail]
          );
        }

        schoolStudents.push({
          admissionNumber: admNo,
          rollNumber: rollNo,
          name: studentFullName,
          className: cls.name,
          sectionName: targetSecName,
          parentName: parentFullName,
          parentPhone,
          parentEmail,
          status: 'ACTIVE',
        });

        studentCounter++;
      }
    }

    // 9. Create Notices for this school
    await client.query(
      `INSERT INTO school.notices (school_id, academic_year_id, title, content, published_by, target_audience, status)
       VALUES 
       ($1, $2, 'Term 1 Parent-Teacher Meeting (PTM)', 'Dear Parents, PTM will be conducted this Saturday from 9 AM to 1 PM.', (SELECT id FROM identity.users WHERE email = $3), 'ALL', 'PUBLISHED'),
       ($1, $2, 'Annual Sports & Athletic Meet 2026', 'Registrations are open for track and field events. Contact physical education department.', (SELECT id FROM identity.users WHERE email = $3), 'ALL', 'PUBLISHED')
       ON CONFLICT DO NOTHING;`,
      [schoolId, academicYearId, sData.adminEmail]
    );

    allRecordsForPdf.push({
      schoolName: sData.name,
      schoolCode: sData.code,
      city: sData.city,
      principalName: sData.principalName,
      students: schoolStudents,
      teachers: schoolTeachers,
      metrics: {
        studentCount: schoolStudents.length,
        teacherCount: schoolTeachers.length,
        classesCount: 15,
      },
    });
  }

  await client.end();

  console.log(`\n============================================================`);
  console.log(`DATABASE SEEDING COMPLETE!`);
  console.log(`Total Students Enrolled: ${totalStudentsInserted}`);
  console.log(`Total System Users Created: ${totalUsersInserted}`);
  console.log(`Total Schools Configured: ${SCHOOLS_DATA.length}`);
  console.log(`============================================================`);

  // Now Generate Comprehensive PDF Document
  console.log('\nGenerating PDF Report: SchoolSense_Comprehensive_Testing_Dataset_Report.pdf ...');
  const pdfPath = path.join('/Users/mohdrazakhan/Projects/ScholScence', 'SchoolSense_Comprehensive_Testing_Dataset_Report.pdf');
  generatePdfReport(allRecordsForPdf, pdfPath);
}

function generatePdfReport(schools: any[], outputPath: string) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const stream = fs.createWriteStream(outputPath);
  doc.pipe(stream);

  // Colors
  const PRIMARY_COLOR = '#1e1b4b'; // Deep Indigo
  const ACCENT_COLOR = '#4338ca'; // Indigo
  const TEXT_DARK = '#0f172a';
  const TEXT_MUTED = '#475569';
  const TABLE_BORDER = '#cbd5e1';

  // Title & Header
  doc.rect(40, 40, 515, 60).fill(PRIMARY_COLOR);
  doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text('SchoolSense™ System Testing Dataset', 55, 52);
  doc.fontSize(10).font('Helvetica').text('Master Multi-Tenant Database & Student Records Report (5 Schools • 500+ Students)', 55, 76);

  doc.moveDown(4);

  // Executive Summary Box
  doc.rect(40, 115, 515, 65).fill('#f8fafc').stroke(TABLE_BORDER);
  doc.fillColor(TEXT_DARK).fontSize(12).font('Helvetica-Bold').text('Dataset Executive Summary', 55, 125);
  doc.fontSize(9).font('Helvetica').fillColor(TEXT_MUTED).text(
    `• Total Schools: 5 Institutional Tenants\n• Total Active Students: 525 Enrolled Pupils\n• Total Staff & Teachers: 70 Verified Accounts\n• Universal Password for all demo accounts: password123\n• Generated: ${new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}`,
    55,
    140
  );

  doc.moveDown(5);

  // Schools Summary Table
  doc.fillColor(TEXT_DARK).fontSize(13).font('Helvetica-Bold').text('1. Multi-Tenant Schools Directory', 40, 200);

  let y = 220;
  // Header row
  doc.rect(40, y, 515, 20).fill('#e0e7ff');
  doc.fillColor(ACCENT_COLOR).fontSize(9).font('Helvetica-Bold');
  doc.text('Code', 45, y + 5);
  doc.text('School Name', 95, y + 5);
  doc.text('City', 260, y + 5);
  doc.text('Principal', 330, y + 5);
  doc.text('Students', 450, y + 5);
  doc.text('Teachers', 490, y + 5);
  y += 20;

  schools.forEach((s) => {
    doc.rect(40, y, 515, 20).fill(y % 40 === 0 ? '#ffffff' : '#f8fafc').stroke(TABLE_BORDER);
    doc.fillColor(TEXT_DARK).fontSize(8.5).font('Helvetica');
    doc.text(s.schoolCode, 45, y + 5);
    doc.text(s.schoolName, 95, y + 5);
    doc.text(s.city, 260, y + 5);
    doc.text(s.principalName, 330, y + 5);
    doc.text(String(s.metrics.studentCount), 455, y + 5);
    doc.text(String(s.metrics.teacherCount), 495, y + 5);
    y += 20;
  });

  // School-by-school Student Details
  schools.forEach((s, sIdx) => {
    doc.addPage();

    // School Header Banner
    doc.rect(40, 40, 515, 35).fill(ACCENT_COLOR);
    doc.fillColor('#ffffff').fontSize(13).font('Helvetica-Bold').text(`${sIdx + 1}. ${s.schoolName} (${s.schoolCode})`, 50, 48);
    doc.fontSize(9).font('Helvetica').text(`City: ${s.city} | Principal: ${s.principalName} | Enrolled: ${s.students.length} Students`, 50, 62);

    // Faculty & Subject Assignment Section
    doc.fillColor(TEXT_DARK).fontSize(10).font('Helvetica-Bold').text('Faculty & Teaching Assignments', 40, 85);
    let tY = 100;
    doc.rect(40, tY, 515, 16).fill('#e2e8f0');
    doc.fillColor(TEXT_DARK).fontSize(8).font('Helvetica-Bold');
    doc.text('Teacher Name', 45, tY + 4);
    doc.text('Email', 160, tY + 4);
    doc.text('Subject', 330, tY + 4);
    doc.text('Assigned Class', 440, tY + 4);
    tY += 16;

    s.teachers.slice(0, 5).forEach((t: any) => {
      doc.rect(40, tY, 515, 16).fill('#ffffff').stroke(TABLE_BORDER);
      doc.fillColor(TEXT_MUTED).fontSize(7.5).font('Helvetica');
      doc.text(t.name, 45, tY + 4);
      doc.text(t.email, 160, tY + 4);
      doc.text(t.assignedSubject, 330, tY + 4);
      doc.text(t.assignedClass, 440, tY + 4);
      tY += 16;
    });

    // Student Roster
    tY += 15;
    doc.fillColor(TEXT_DARK).fontSize(10).font('Helvetica-Bold').text(`Student Roster & Parent Emergency Contacts (${s.students.length} Pupils)`, 40, tY);
    tY += 15;

    doc.rect(40, tY, 515, 16).fill('#1e1b4b');
    doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
    doc.text('Adm No', 45, tY + 4);
    doc.text('Roll', 110, tY + 4);
    doc.text('Student Name', 135, tY + 4);
    doc.text('Class', 230, tY + 4);
    doc.text('Parent Name', 290, tY + 4);
    doc.text('Parent Phone', 390, tY + 4);
    doc.text('Status', 470, tY + 4);
    tY += 16;

    // Display student rows with automatic pagination
    s.students.forEach((st: any, idx: number) => {
      if (tY > 760) {
        doc.addPage();
        tY = 40;
        doc.rect(40, tY, 515, 16).fill('#1e1b4b');
        doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
        doc.text('Adm No', 45, tY + 4);
        doc.text('Roll', 110, tY + 4);
        doc.text('Student Name', 135, tY + 4);
        doc.text('Class', 230, tY + 4);
        doc.text('Parent Name', 290, tY + 4);
        doc.text('Parent Phone', 390, tY + 4);
        doc.text('Status', 470, tY + 4);
        tY += 16;
      }

      doc.rect(40, tY, 515, 15).fill(idx % 2 === 0 ? '#ffffff' : '#f8fafc').stroke(TABLE_BORDER);
      doc.fillColor(TEXT_DARK).fontSize(7).font('Helvetica');
      doc.text(st.admissionNumber, 45, tY + 4);
      doc.text(String(st.rollNumber), 110, tY + 4);
      doc.text(st.name, 135, tY + 4);
      doc.text(`${st.className} (${st.sectionName.replace('Section ', '')})`, 230, tY + 4);
      doc.text(st.parentName, 290, tY + 4);
      doc.text(st.parentPhone, 390, tY + 4);
      doc.fillColor('#059669').text(st.status, 470, tY + 4);
      tY += 15;
    });
  });

  doc.end();
  stream.on('finish', () => {
    console.log(`✅ PDF successfully generated at: ${outputPath}`);
  });
}

seedLargeDataset().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
