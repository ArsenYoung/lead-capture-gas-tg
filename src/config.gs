/**
 * CONFIG: Stores bot tokens and project settings
 */

// Insert your Telegram bot token
const TELEGRAM_TOKEN = "YOURS_TELEGRAM_TOKEN";

// Chat ID where notifications will be delivered
const TELEGRAM_CHAT_ID = "YOURS_TELEGRAM_CHAT_ID";

// Your Google Sheet name
const SHEET_NAME = "Leads";

// Generates the Telegram Bot API URL
function getTelegramUrl() {
  return `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
}


function randomizeTimestampsHeatmap() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  const lastRow = sheet.getLastRow();

  const start = new Date("2024-12-01").getTime();
  const end   = new Date("2025-02-28").getTime();

  // Вероятности для тайм-слотов
  const timeSlots = [
    { start: 8,  end: 12, weight: 0.40 },
    { start: 12, end: 15, weight: 0.20 },
    { start: 15, end: 19, weight: 0.25 },
    { start: 19, end: 22, weight: 0.10 },
    { start: 22, end: 24, weight: 0.04 },
    { start: 0,  end: 8,  weight: 0.01 }
  ];

  // Вероятности для дней недели
  // 0=Sun ... 6=Sat
  const dayWeights = {
    0: 0.07,  // Sun
    1: 0.25,  // Mon
    2: 0.18,  // Tue
    3: 0.18,  // Wed
    4: 0.20,  // Thu
    5: 0.08,  // Fri
    6: 0.04   // Sat
  };

  function weightedRandom(weightsObj) {
    const rnd = Math.random();
    let sum = 0;

    for (const key in weightsObj) {
      sum += weightsObj[key];
      if (rnd <= sum) return Number(key);
    }
    return Number(Object.keys(weightsObj).pop());
  }

  function pickTimeSlot() {
    const rnd = Math.random();
    let acc = 0;

    for (let slot of timeSlots) {
      acc += slot.weight;
      if (rnd <= acc) {
        const hour = slot.start + Math.random() * (slot.end - slot.start);
        const minute = Math.floor(Math.random() * 60);
        return { hour: Math.floor(hour), minute };
      }
    }
    return { hour: 12, minute: 0 };
  }

  for (let row = 2; row <= lastRow; row++) {
    // Выбираем случайный день с учётом веса
    let date;
    while (true) {
      const randomDate = new Date(start + Math.random() * (end - start));
      const dayOfWeek = randomDate.getDay();

      if (Math.random() < dayWeights[dayOfWeek]) {
        date = randomDate;
        break;
      }
    }

    // Выбираем тайм-слот
    const t = pickTimeSlot();

    date.setHours(t.hour);
    date.setMinutes(t.minute);
    date.setSeconds(Math.floor(Math.random() * 60));

    // Записываем
    sheet.getRange(row, 1).setValue(date);
  }

  Logger.log("Heatmap timestamps applied.");
}

function addRandomLeadErrors() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  const lastRow = sheet.getLastRow();

  // Probabilities
  const emailErrorChance = 0.05;   // 5%
  const phoneErrorChance = 0.05;   // 5%
  const emptyFieldChance = 0.07;   // 7%
  const weirdMessageChance = 0.03; // 3%

  const weirdMessages = [
    "?",
    "Proszę o kontakt ASAP.",
    "Potrzebuję wyceny.",
    "Pilne!",
    ""
  ];

  for (let r = 2; r <= lastRow; r++) {

    // EMAIL
    if (Math.random() < emailErrorChance) {
      const emailCell = sheet.getRange(r, 3); // Email = column C
      let email = emailCell.getValue();

      const corrupted = [
        email.replace("@", "(at)"),
        email.replace("@", "@@"),
        email.replace(".", ";"),
        email.replace(/[a-z]/i, ""),  // drop some character
        ""
      ];

      emailCell.setValue(corrupted[Math.floor(Math.random() * corrupted.length)]);
    }

    // PHONE
    if (Math.random() < phoneErrorChance) {
      const phoneCell = sheet.getRange(r, 4);
      let phone = phoneCell.getValue();

      const brokenPhones = [
        phone.replace("+48 ", ""),
        phone.replace(/ /g, "-"),
        phone + " 22",
        phone.slice(0, 8),
        ""
      ];

      phoneCell.setValue(brokenPhones[Math.floor(Math.random() * brokenPhones.length)]);
    }

    // EMPTY FIELDS
    if (Math.random() < emptyFieldChance) {
      const cols = [3,4,6,7,10]; // email, phone, service, budget, message
      const col = cols[Math.floor(Math.random() * cols.length)];
      sheet.getRange(r, col).setValue("");
    }

    // WEIRD MESSAGE
    if (Math.random() < weirdMessageChance) {
      sheet.getRange(r, 10).setValue(
        weirdMessages[Math.floor(Math.random() * weirdMessages.length)]
      );
    }
  }

  Logger.log("Random lead errors added.");
}





