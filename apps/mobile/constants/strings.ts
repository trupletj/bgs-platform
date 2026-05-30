export const S = {
  // Tab labels
  tabs: {
    home: "Нүүр",
    services: "Сервисүүд",
    scan: "QR",
    notifications: "Мэдэгдэл",
    profile: "Профайл",
  },

  // Home screen
  home: {
    greeting: "Сайн байна уу",
    attendance: "Ирцийн мэдээлэл",
    weekDays: ["Ба", "Бя", "Ня", "Да", "Мя", "Лх", "Пү"],
    weekDaysFull: ["Баасан", "Бямба", "Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв"],
    checkIn: "Ирсэн",
    checkOut: "Явсан",
    weeklyHours: "Долоо хоногийн цаг",
    birthday: "Төрсөн өдрийн мэнд",
    birthdayMessage: "Төрсөн өдрийн мэнд хүргэе!",
    services: "Сервисүүд",
    today: "Өнөөдөр",
    files: "Файлууд",
    notifications: "Мэдэгдэл",
  },

  // Services screen
  services: {
    title: "Сервисүүд",
    services: "Сервисүүд",
    companyFiles: "Компанийн файлууд",
    search: "Хайх...",
    searchServices: "Сервис хайх...",
  },

  // Notifications screen
  notifications: {
    title: "Мэдэгдэл",
    notifications: "Мэдэгдэл",
    news: "Мэдээ",
    today: "Өнөөдөр",
    yesterday: "Өчигдөр",
    earlier: "Өмнөх",
    markAllRead: "Бүгдийг уншсан",
    searchNews: "Мэдээ хайх...",
    likes: "таалагдсан",
    readMore: "Дэлгэрэнгүй",
  },

  // Service categories
  serviceCategories: {
    hr: "Хүний нөөц",
    finance: "Санхүү",
    work: "Ажлын удирдлага",
    other: "Бусад",
  },

  // Profile screen
  profile: {
    title: "Профайл",
    myQR: "Миний QR",
    scanQR: "Скан",
    employeeId: "Ажилтны код",
    files: "Файлууд",
    settings: "Аппын тохиргоо",
    logout: "Гарах",
  },

  // QR Scanner
  scan: {
    title: "QR уншуулах",
    instruction: "QR кодыг хүрээн дотор байрлуулна уу",
  },

  // Auth screens
  auth: {
    loginTitle: "Нэвтрэх",
    registerNumber: "Регистрийн дугаар",
    registerPlaceholder: "ЙС73060102",
    phoneNumber: "Утасны дугаар",
    phonePlaceholder: "99297184",
    sendOtp: "Код илгээх",
    otpTitle: "Баталгаажуулах код",
    otpDescription: "утсанд илгээсэн 6 оронтой кодыг оруулна уу",
    verify: "Баталгаажуулах",
    resendOtp: "Код дахин илгээх",
    resendIn: "Дахин илгээх",
    seconds: "сек",
    errorUserNotFound: "Бүртгэлтэй хэрэглэгч олдсонгүй эсвэл регистр буруу байна.",
    errorOtpFailed: "Код буруу байна. Дахин оролдоно уу.",
    errorGeneric: "Алдаа гарлаа. Дахин оролдоно уу.",
    back: "Буцах",
  },

  // Attendance detail screen
  attendanceDetail: {
    title: "Ирц",
    scheduledIn: "Ирэх цаг",
    scheduledOut: "Явах цаг",
    punchIn: "Ирсэн цаг",
    punchOut: "Явсан цаг",
    workedHours: "Ажилласан цаг",
    late: "Хоцорсон",
    earlyLeave: "Эрт тарсан",
    noData: "Мэдээлэл байхгүй",
    noPunch: "—",
  },

  // Leave request screen
  leave: {
    title: "Чөлөө",
    leaveType: "Чөлөөний төрөл",
    selectType: "Төрөл сонгох",
    duration: "Хугацаа",
    durationUnit: "хоног",
    description: "Тайлбар",
    descriptionPlaceholder: "Чөлөөний шалтгаанаа бичнэ үү...",
    attachFile: "Файл хавсаргах",
    submit: "Илгээх",
    submitting: "Илгээж байна...",
    success: "Чөлөөний хүсэлт амжилттай илгээгдлээ",
    requests: "Хүсэлтүүд",
    newRequest: "Шинэ хүсэлт",
    pending: "Хүлээгдэж буй",
    approved: "Зөвшөөрөгдсөн",
    rejected: "Татгалзсан",
    noRequests: "Хүсэлт байхгүй",
    days: "хоног",
  },

  // Phone directory screen
  phoneDirectory: {
    title: "Утасны дугаар",
    search: "Нэр, утас хайх...",
    noResults: "Илэрц олдсонгүй",
  },

  // Biometric
  biometric: {
    toggle: "Биометрик нэвтрэлт",
    toggleDescription: "Face ID / хурууны хээгээр нэвтрэх",
    unlockTitle: "BGS",
    unlockSubtitle: "Нэвтрэхийн тулд баталгаажуулна уу",
    retryButton: "Дахин оролдох",
    fallbackButton: "OTP-р нэвтрэх",
    promptMessage: "Баталгаажуулна уу",
    promptCancel: "Болих",
  },

  // Service items
  serviceItems: {
    attendance: "Ирц",
    leave: "Чөлөө",
    salary: "Цалин",
    bonus: "Урамшуулал",
    schedule: "Хуваарь",
    documents: "Баримтууд",
  },
} as const;
