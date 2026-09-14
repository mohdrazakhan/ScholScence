const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://ayuwznogkbphpqukaoeo.supabase.co';
const supabaseKey = 'sb_publishable_5-moe9UnjB1y9R9AdBPVQg_SFrOU_Gs';

const FIRST_NAMES_MALE = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Shaurya', 'Atharv', 'Advik', 'Pranav', 'Advaith', 'Aaryan', 'Dhruv', 'Kabir', 'Rohan', 'Karan',
  'Yash', 'Ansh', 'Dev', 'Manish', 'Harsh', 'Aryan', 'Samar', 'Laksh', 'Rudra', 'Nikhil',
  'Siddharth', 'Varun', 'Gautam', 'Kunal', 'Tejas', 'Madhav', 'Chirag', 'Tushar', 'Alok', 'Deepak'
];

const FIRST_NAMES_FEMALE = [
  'Aanya', 'Diya', 'Saanvi', 'Ananya', 'Fatima', 'Isha', 'Aadhya', 'Kavya', 'Avani', 'Sara',
  'Myra', 'Anika', 'Navya', 'Pari', 'Riya', 'Sneha', 'Shreya', 'Tanvi', 'Pooja', 'Neha',
  'Swati', 'Meera', 'Roshni', 'Simran', 'Kritika', 'Khushi', 'Divya', 'Tara', 'Disha', 'Bhavna',
  'Aditi', 'Prisha', 'Siya', 'Nisha', 'Palak', 'Anjali', 'Rashmi', 'Jyoti', 'Shalini', 'Manju'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Patel', 'Singh', 'Kumar', 'Joshi', 'Shah', 'Mehta', 'Nair',
  'Iyer', 'Reddy', 'Banerjee', 'Chatterjee', 'Das', 'Roy', 'Choudhury', 'Mishra', 'Pandey', 'Trivedi',
  'Saxena', 'Kapoor', 'Malhotra', 'Bhatia', 'Chawla', 'Deshmukh', 'Kulkarni', 'Patil', 'Pawar', 'Shinde'
];

const BLOOD_GROUPS = ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-'];

const FATHER_PREFIXES = ['Rajesh', 'Sanjay', 'Vikram', 'Ramesh', 'Sunil', 'Amit', 'Anil', 'Deepak', 'Manish', 'Manoj'];
const MOTHER_PREFIXES = ['Sunita', 'Pooja', 'Rekha', 'Anita', 'Kavita', 'Seema', 'Meena', 'Geeta', 'Neelam', 'Suman'];

function getDOBForClass(className, studentIndex) {
  let baseYear = 2018;
  const cLower = (className || '').toLowerCase();
  if (cLower.includes('pre-nur') || cLower.includes('prenur')) baseYear = 2023;
  else if (cLower.includes('nursery') || cLower.includes('nur')) baseYear = 2022;
  else if (cLower.includes('lkg')) baseYear = 2021;
  else if (cLower.includes('ukg')) baseYear = 2020;
  else if (cLower.includes('10')) baseYear = 2010;
  else if (cLower.includes('11')) baseYear = 2009;
  else if (cLower.includes('12')) baseYear = 2008;
  else if (cLower.includes('1')) baseYear = 2019;
  else if (cLower.includes('2')) baseYear = 2018;
  else if (cLower.includes('3')) baseYear = 2017;
  else if (cLower.includes('4')) baseYear = 2016;
  else if (cLower.includes('5')) baseYear = 2015;
  else if (cLower.includes('6')) baseYear = 2014;
  else if (cLower.includes('7')) baseYear = 2013;
  else if (cLower.includes('8')) baseYear = 2012;
  else if (cLower.includes('9')) baseYear = 2011;

  const month = String((studentIndex % 12) + 1).padStart(2, '0');
  const day = String(((studentIndex * 3) % 28) + 1).padStart(2, '0');
  return `${baseYear}-${month}-${day}`;
}

async function supabaseFetch(path, options = {}) {
  const url = `${supabaseUrl}/rest/v1/${path}`;
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': options.prefer || 'return=representation',
    ...options.headers,
  };
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Supabase error [${res.status}]: ${errText}`);
  }
  return res.json();
}

async function seedStudents() {
  console.log('====================================================');
  console.log('🏫 Seeding 6-7 Students per Class Section (Supabase Cloud)');
  console.log('====================================================\n');

  // 1. Fetch schools
  const schools = await supabaseFetch('schools?select=id,name,code');
  const targetSchool = schools.find(s => s.name.includes('Delhi') || s.code === 'DHA12') || schools[1] || schools[0];
  
  if (!targetSchool) {
    console.error('No school found in database!');
    return;
  }

  console.log(`Target School: ${targetSchool.name} (${targetSchool.code}) - ID: ${targetSchool.id}\n`);

  // 2. Fetch classes & sections
  const classes = await supabaseFetch(`classes?school_id=eq.${targetSchool.id}&select=id,name,code,display_order&order=display_order`);
  const sections = await supabaseFetch(`sections?school_id=eq.${targetSchool.id}&select=id,name,code,class_id`);
  const activeSessions = await supabaseFetch(`academic_years?school_id=eq.${targetSchool.id}&is_current=eq.true`);
  const activeSessionId = activeSessions[0]?.id || null;

  console.log(`Found ${classes.length} classes, ${sections.length} sections in ${targetSchool.name}.`);

  // Existing students to avoid duplicate admission numbers
  const existingStudents = await supabaseFetch(`students?school_id=eq.${targetSchool.id}&select=id,admission_number,first_name,last_name`);
  console.log(`Found ${existingStudents.length} existing students.\n`);

  const studentSectionMap = {};
  let totalInserted = 0;
  let globalStudentCounter = 101;

  for (let cIdx = 0; cIdx < classes.length; cIdx++) {
    const cls = classes[cIdx];
    const classSections = sections.filter(s => s.class_id === cls.id);

    console.log(`📚 Class ${cls.name} (${cls.code}) - ${classSections.length} sections`);

    for (let sIdx = 0; sIdx < classSections.length; sIdx++) {
      const sec = classSections[sIdx];
      const studentsToCreateCount = (sIdx % 2 === 0) ? 7 : 6; // 6-7 students per section

      console.log(`   └─ Section ${sec.name} (${sec.code}): Creating ${studentsToCreateCount} students...`);

      for (let i = 1; i <= studentsToCreateCount; i++) {
        const isMale = (i % 2 === 1);
        const firstName = isMale
          ? FIRST_NAMES_MALE[(cIdx * 7 + sIdx * 5 + i) % FIRST_NAMES_MALE.length]
          : FIRST_NAMES_FEMALE[(cIdx * 7 + sIdx * 5 + i) % FIRST_NAMES_FEMALE.length];
        const lastName = LAST_NAMES[(cIdx * 5 + sIdx * 3 + i) % LAST_NAMES.length];
        const rollNumber = String(i);
        const admCode = `ADM-2026-${String(globalStudentCounter).padStart(4, '0')}`;
        globalStudentCounter++;

        const isFather = (i % 3 !== 0);
        const guardianFirst = isFather
          ? FATHER_PREFIXES[(cIdx + i) % FATHER_PREFIXES.length]
          : MOTHER_PREFIXES[(cIdx + i) % MOTHER_PREFIXES.length];
        const guardianName = `${guardianFirst} ${lastName}`;
        const guardianPhone = `+91 98765 ${String(10000 + (cIdx * 100) + (sIdx * 10) + i).slice(-5)}`;
        const guardianEmail = `parent.${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
        const dob = getDOBForClass(cls.name, i);
        const bloodGroup = BLOOD_GROUPS[(cIdx + sIdx + i) % BLOOD_GROUPS.length];

        // Check if admission number already exists
        const existing = existingStudents.find(s => s.admission_number === admCode);
        if (existing) {
          studentSectionMap[existing.id] = {
            classId: cls.id,
            className: cls.name,
            sectionId: sec.id,
            sectionName: sec.name,
            rollNumber: rollNumber,
            guardianEmail: guardianEmail,
            guardianPhone: guardianPhone,
            guardianName: guardianName,
          };
          continue;
        }

        try {
          const insertedStudent = await supabaseFetch('students', {
            method: 'POST',
            body: {
              school_id: targetSchool.id,
              admission_number: admCode,
              first_name: firstName,
              last_name: lastName,
              gender: isMale ? 'MALE' : 'FEMALE',
              date_of_birth: dob,
              blood_group: bloodGroup,
              emergency_contact_name: guardianName,
              emergency_contact_phone: guardianPhone,
              status: 'ACTIVE',
            }
          });

          if (insertedStudent && insertedStudent[0]) {
            const st = insertedStudent[0];
            studentSectionMap[st.id] = {
              classId: cls.id,
              className: cls.name,
              sectionId: sec.id,
              sectionName: sec.name,
              rollNumber: rollNumber,
              guardianEmail: guardianEmail,
              guardianPhone: guardianPhone,
              guardianName: guardianName,
            };
            totalInserted++;
          }
        } catch (err) {
          console.warn(`      ⚠️ Failed to insert ${firstName} ${lastName}:`, err.message);
        }
      }
    }
  }

  console.log(`\n====================================================`);
  console.log(`🎉 Successfully created ${totalInserted} test students!`);
  console.log(`====================================================\n`);

  // Write mapping artifact / backup file so it is permanently accessible
  const mappingPath = path.join(__dirname, 'seeded_student_sections.json');
  fs.writeFileSync(mappingPath, JSON.stringify(studentSectionMap, null, 2));
  console.log(`Saved student-section map to: ${mappingPath}`);
}

seedStudents().catch(console.error);
