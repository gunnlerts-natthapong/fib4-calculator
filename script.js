const form = document.getElementById('fib4Form');
const resultLine = document.getElementById('resultLine');
const riskCard = document.getElementById('riskCard');
const riskTitle = document.getElementById('riskTitle');
const riskAdvice = document.getElementById('riskAdvice');
const riskMarker = document.getElementById('riskMarker');
const disclaimerModal = document.getElementById('disclaimerModal');
const acceptDisclaimer = document.getElementById('acceptDisclaimer');

const fields = {
  age: {
    input: document.getElementById('age'),
    row: document.querySelector('[data-field="age"]'),
    message: document.getElementById('ageMessage')
  },
  ast: {
    input: document.getElementById('ast'),
    row: document.querySelector('[data-field="ast"]'),
    message: document.getElementById('astMessage')
  },
  alt: {
    input: document.getElementById('alt'),
    row: document.querySelector('[data-field="alt"]'),
    message: document.getElementById('altMessage')
  },
  platelet: {
    input: document.getElementById('platelet'),
    row: document.querySelector('[data-field="platelet"]'),
    message: document.getElementById('plateletMessage')
  }
};

const touchedFields = new Set();

acceptDisclaimer.addEventListener('click', () => {
  disclaimerModal.classList.add('hidden');
  fields.age.input.focus();
});

Object.entries(fields).forEach(([fieldName, { input }]) => {
  input.addEventListener('input', () => {
    touchedFields.add(fieldName);
    calculateFib4();
  });
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
});

function calculateFib4() {
  const age = validateAge();
  const ast = validatePositiveField('ast', 'AST');
  const alt = validatePositiveField('alt', 'ALT');
  const platelet = validatePlatelet();

  if (!age.valid || !ast.valid || !alt.valid || !platelet.valid) {
    showEmptyResult();
    return;
  }

  // Standard FIB-4 formula: (Age x AST) / (Platelet count x square root of ALT).
  const fib4 = (age.value * ast.value) / (platelet.value * Math.sqrt(alt.value));
  const fib4Rounded = fib4.toFixed(2);

  resultLine.innerHTML = `FIB-4 : <strong>${fib4Rounded}</strong>`;
  showRiskInterpretation(age.value, fib4);
}

function validateAge() {
  const value = getNumericValue(fields.age.input);
  const warnings = [];
  const shouldShowMessage = shouldShowFieldMessage('age');

  if (!Number.isFinite(value) || value < 18 || value > 100) {
    setFieldState('age', shouldShowMessage ? 'error' : 'normal', shouldShowMessage ? 'กรุณากรอกอายุระหว่าง 18-100 ปี' : '');
    return { valid: false, value };
  }

  if (value < 35 || value > 65) {
    warnings.push('ช่วงอายุนี้ความแม่นยำของ FIB-4 อาจลดลง ควรแปลผลร่วมกับบริบททางคลินิก');
  }

  setFieldState('age', warnings.length && shouldShowMessage ? 'warning' : 'normal', shouldShowMessage ? warnings.join(' ') : '');
  return { valid: true, value };
}

function validatePositiveField(fieldName, label) {
  const value = getNumericValue(fields[fieldName].input);
  const shouldShowMessage = shouldShowFieldMessage(fieldName);

  if (!Number.isFinite(value) || value <= 0) {
    setFieldState(fieldName, shouldShowMessage ? 'error' : 'normal', shouldShowMessage ? `กรุณากรอกค่า ${label} เป็นตัวเลขบวกมากกว่า 0` : '');
    return { valid: false, value };
  }

  if (value > 2000 && shouldShowMessage) {
    setFieldState(fieldName, 'warning', `${label} สูงผิดปกติมาก อาจพบได้ใน acute hepatitis และควรแปลผลด้วยความระมัดระวัง`);
    return { valid: true, value };
  }

  setFieldState(fieldName, 'normal', '');
  return { valid: true, value };
}

function validatePlatelet() {
  const value = getNumericValue(fields.platelet.input);
  const shouldShowMessage = shouldShowFieldMessage('platelet');

  if (!Number.isFinite(value) || value <= 0) {
    setFieldState('platelet', shouldShowMessage ? 'error' : 'normal', shouldShowMessage ? 'กรุณากรอกค่า Platelet เป็นตัวเลขบวกมากกว่า 0' : '');
    return { valid: false, value };
  }

  if ((value < 50 || value > 500) && shouldShowMessage) {
    setFieldState(
      'platelet',
      'warning',
      'ค่า Platelet ผิดปกติมาก อาจมีสาเหตุอื่นที่ส่งผลต่อความแม่นยำของผลลัพธ์ (เช่น ITP, โรคทางเลือด, การติดเชื้อเฉียบพลัน)'
    );
    return { valid: true, value };
  }

  setFieldState('platelet', 'normal', '');
  return { valid: true, value };
}

function shouldShowFieldMessage(fieldName) {
  return touchedFields.has(fieldName) || fields[fieldName].input.value.trim() !== '';
}

function setFieldState(fieldName, state, message) {
  const field = fields[fieldName];

  field.row.classList.toggle('has-error', state === 'error');
  field.row.classList.toggle('has-warning', state === 'warning');
  field.input.setAttribute('aria-invalid', state === 'error' ? 'true' : 'false');
  field.message.textContent = message;
}

function showEmptyResult() {
  resultLine.innerHTML = 'FIB-4 : <span>please fill out required fields.</span>';
  riskCard.className = 'risk-card hidden';
  riskTitle.textContent = '';
  riskAdvice.textContent = '';
  riskMarker.textContent = '';
}

function showRiskInterpretation(age, fib4) {
  // NAFLD age-adjusted cut-off values:
  // age < 65: low < 1.30, indeterminate 1.30-2.67, high > 2.67
  // age >= 65: low < 2.0, indeterminate 2.0-2.67, high > 2.67
  let zone;

  if (fib4 > 2.67) {
    zone = 'high';
  } else if (age >= 65) {
    zone = fib4 < 2.0 ? 'low' : 'indeterminate';
  } else {
    zone = fib4 < 1.3 ? 'low' : 'indeterminate';
  }

  const content = {
    low: {
      title: 'ความเสี่ยงต่ำ (Low risk)',
      marker: '🟢',
      advice:
        '- Low probability of advanced fibrosis\n' +
        '- ไม่จำเป็นต้องส่ง Fibroscan ในขณะนี้\n' +
        '- สามารถติดตามการรักษาต่อที่คลินิกปฐมภูมิได้\n' +
        '- คำแนะนำ\n' +
        '1. ปรับพฤติกรรม (Lifestyle modification)\n' +
        '2. แนะนำตรวจ FIB-4 ซ้ำใน 1-3 ปี'
    },
    indeterminate: {
      title: 'ความเสี่ยงปานกลาง (Indeterminate risk)',
      marker: '🟡',
      advice:
        '- Intermediate probability of advance fibrosis\n' +
        '- พิจารณาทำ Fibroscan เพื่อประเมินพังผืดตับเพิ่มเติม'
    },
    high: {
      title: 'ความเสี่ยงสูง (High risk)',
      marker: '🔴',
      advice:
        '- มีโอกาสพังผืดตับสูง (High probability of advanced fibrosis)\n' +
        '- พิจารณาสืบค้นภาวะที่เกี่ยวข้องกับโรคตับเรื้อรัง เช่น\n' +
        'ไวรัสตับอักเสบเรื้อรัง (Chronic Hepatitis B/C)\n' +
        'การดื่มแอลกอฮอล์ (Alcoholic liver disease)\n' +
        '- แนะนำ refer พบ OPD med เพื่อพิจารณากการดูแลรักษาเพิ่มเติม'
    }
  };

  riskCard.className = `risk-card ${zone}`;
  riskTitle.textContent = content[zone].title;
  riskAdvice.textContent = content[zone].advice;
  riskMarker.textContent = content[zone].marker;
  riskMarker.setAttribute('aria-label', content[zone].title);
}

function getNumericValue(input) {
  return Number.parseFloat(input.value);
}
