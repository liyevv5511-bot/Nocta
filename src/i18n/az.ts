import type { Dictionary } from './en';

/**
 * Azerbaijani.
 *
 * Typed as `Dictionary`, so a key that English has and this file does not is a
 * compile error rather than a raw `plan.heading` rendered to a user.
 *
 * Written rather than machine-translated, which shows in the places a literal
 * translation would read badly: the plural forms are Azerbaijani's (one form,
 * with the number carrying the count), the marketing copy is rewritten to land
 * in Azerbaijani instead of being calqued from English, and terms with no
 * settled local equivalent — "Open Graph", "haversine" — are left alone rather
 * than invented.
 */
export const az: Dictionary = {
  common: {
    brand: 'Nocta',
    skipToContent: 'Məzmuna keç',
    close: 'Bağla',
    tryAgain: 'Yenidən cəhd et',
    reload: 'Yenilə',
    backHome: 'Ana səhifəyə qayıt',
    free: 'Pulsuz',
    perDay: '{{amount}} / gün',
    nights_one: '{{count}} gecə',
    nights_other: '{{count}} gecə',
    days_one: '{{count}} gün',
    days_other: '{{count}} gün',
    stops_one: '{{count}} dayanacaq',
    stops_other: '{{count}} dayanacaq',
  },

  language: {
    label: 'Dil',
    en: 'English',
    az: 'Azərbaycan',
    ru: 'Русский',
  },

  theme: {
    label: 'Rəng teması',
    light: 'İşıqlı tema',
    dark: 'Qaranlıq tema',
    system: 'Sistem teması',
    short: 'Tema',
  },

  nav: {
    main: 'Əsas',
    mobile: 'Mobil',
    home: 'Nocta — ana səhifə',
    plan: 'Səfər planla',
    route: 'Marşrut',
    saved: 'Yadda saxlanan',
    styleguide: 'Dizayn sistemi',
    startPlanning: 'Planlamağa başla',
    openMenu: 'Menyunu aç',
    closeMenu: 'Menyunu bağla',
  },

  footer: {
    blurb:
      'Növbədə durmaqdansa piyada getməyi üstün tutduğunuzu və günün əsas hadisəsinin şam yeməyi olduğunu fərz edən marşrut planlayıcısı.',
    disclaimer:
      'Portfolio layihəsidir. Planlayıcı əl ilə hazırlanmış məkan kataloqu üzərində işləyən lokal xidmətdir — heç bir model çağırılmır və heç bir məlumat brauzerinizdən çıxmır.',
    product: 'Məhsul',
    destinations: 'İstiqamətlər',
    savedTrips: 'Yadda saxlanan səfərlər',
    designSystem: 'Dizayn sistemi',
    routeBuilder: 'Marşrut qurucusu',
    copyright: '© {{year}} Nocta. Nümayiş üçün qurulub, rezervasiya xidməti deyil.',
    catalogue: 'Kataloq: {{cities}} şəhər · 100+ məkan · bütün koordinatlar həqiqidir',
  },

  hero: {
    badge: '{{count}} şəhər · 100+ məkan · barmaqla göstərən cütlüyün stok fotosu yoxdur',
    headline: 'Yerli sakinin yazdığı kimi oxunan marşrutlar.',
    emphasis: ['yerli', 'yazdığı'],
    body: 'Şəhər, əhval və büdcə seçin. Nocta saat-saat plan qaytarır — həqiqi məkanlar, həqiqi açılış qaydaları və aralarındakı həqiqi piyada məsafələri ilə. Sonra hamısını istədiyiniz şəklə sürükləyə bilərsiniz.',
    planTrip: 'Səfər planla',
    howItWorks: 'Necə işləyir',
    noAccount: 'Hesab yoxdur. Rezervasiya tələsi yoxdur. Planlar brauzerinizdə qalır.',
  },

  howItWorks: {
    eyebrow: 'Necə işləyir',
    heading: 'Üç addım, biri isə könüllüdür.',
    body: 'Əksər planlayıcılar sizə təkliflər divarı verib ona marşrut deyir. Bu isə cədvələ söz verir, mühakiməsini göstərir, sonra da onu sökməyə icazə verir.',
    steps: [
      {
        title: 'Marşrutu yox, səfəri təsvir edin',
        body: 'Şəhər, neçə gün, hansı əhvaldasınız və gündə nə qədər xərcləməyə hazırsınız. Beş sahə. Hava limanı seçimləri haqqında anketlər yoxdur.',
      },
      {
        title: 'Necə quruluşuna baxın',
        body: 'Planlayıcı işini iş gedərkən qaytarır — hansı məkanları oxuduğunu, əhvalınızı necə çəkiləndirdiyini, piyada marşrutu harada optimallaşdırdığını. Günlər bir-bir gəlir, mətn divarı ilə bitən fırlanan dairə kimi yox.',
      },
      {
        title: 'Onunla mübahisə edin',
        body: 'Fəaliyyətləri başqa sıraya sürükləyin — gün onların ətrafında yenidən vaxtlanır, piyada ayaqları da daxil. Bəyənmədiyinizi həqiqi alternativlə dəyişin. Yadda saxlayın, paylaşın, çap edin.',
      },
    ],
  },

  gallery: {
    eyebrow: 'Kataloq',
    heading: 'Səkkiz şəhər, layiqincə araşdırılıb.',
    body: 'Səkkiz min qırıntı elan deyil. Buradakı hər məkanın həqiqi ünvanı, həqiqi koordinatları və siyahıda olmaq üçün səbəbi var — planlayıcının piyada vaxtı vəd edib arxasında dura bilməsinin səbəbi budur.',
  },

  demo: {
    eyebrow: 'Canlı, elə bu səhifədə',
    heading: 'Lissabonda bir gün, indicə yaradıldı.',
    body: 'Ekran görüntüsü deyil. Bura qədər sürüşdürməyiniz planlayıcıya həqiqi sorğu göndərdi və aşağıdakılar tam tətbiqin istifadə etdiyi eyni axınla gəldi.',
    waiting: 'Gözlənilir…',
    failedHeading: 'Planlayıcı cavab vermədi',
    unreachable: 'Planlayıcı hazırda əlçatmazdır.',
    tryProperly: 'Əməlli-başlı sınayın',
    tryProperlyBody:
      'Tam planlayıcı sürəti və büdcəni tənzimləməyə, yeddi günə qədər plan qurmağa, fəaliyyətləri slotlar arasında sürükləməyə və bəyənmədiyinizi dəyişməyə imkan verir.',
    openPlanner: 'Planlayıcını aç',
  },

  features: {
    eyebrow: 'Əslində nə edir',
    heading: 'Əksər planlayıcıların ötürdüyü hissələr.',
    exampleDay: 'Nümunə gün fraqmenti',
    onFoot: '{{duration}} piyada',
    items: [
      {
        title: 'Piyada vaxtları, hesablanmış',
        body: 'İki fəaliyyət arasındakı hər ayaq həqiqi piyada sürətində həqiqi haversine məsafəsidir. Günü yenidən sıralayın — hamısı yenidən hesablanır, o cümlədən səssizcə metro gedişinə çevrilənlər.',
      },
      {
        title: 'Axınla, fırlanma ilə yox',
        body: 'Günlər SSE üzərindən bir-bir gəlir və hər biri ekrana çatmazdan əvvəl sxemə görə yoxlanılır.',
      },
      {
        title: 'İstənilən şeyi sürükləyin',
        body: 'dnd-kit ilə klaviaturadan idarə olunan sıralama. Gün nəyi köçürsəniz onun ətrafında yenidən vaxtlanır.',
      },
      {
        title: 'Dəyişin',
        body: 'Hər blok eyni şəhərdən büdcənizə uyğun həqiqi alternativlər təklif edir.',
      },
      {
        title: 'Sizin, lokal olaraq',
        body: 'Səfərlər brauzerinizdə versiyalanmış sxem və həqiqi miqrasiya yolu ilə saxlanılır. Hesab yoxdur, serverdə nüsxə yoxdur.',
      },
    ],
  },

  pricing: {
    eyebrow: 'Qiymətlər',
    heading: 'Pulsuz variant bütün işi görür.',
    body: 'Bu portfolio layihəsidir, ona görə burada heç kimdən heç nə tutulmur. Paketlər həqiqi bir plan strukturunun necə görünəcəyini göstərir — və Pulsuz variant şikəst sınaq deyil.',
    annual: 'İllik ödəniş',
    annualNote: 'İki ay pulsuz',
    perMonth: '/ ay',
    mostUseful: 'Ən faydalı',
    tiers: {
      free: {
        name: 'Pulsuz',
        blurb: 'Bu nümayişdəki hər şey, həmişəlik.',
        cta: 'Planlamağa başla',
        features: [
          'Bütün {{cities}} şəhər üzrə limitsiz plan',
          'Canlı mühakimə ilə axınlı yaradılma',
          'Avtomatik yenidən vaxtlanma ilə sürüklə-sırala',
          'Brauzerinizdə 30-a qədər səfər',
        ],
      },
      pro: {
        name: 'Pro',
        blurb: 'İldə bir yox, dörd səfər edənlər üçün.',
        cta: 'Pro seç',
        features: [
          'Pulsuz paketdəki hər şey',
          'Keçid planlaması ilə çoxşəhərli marşrutlar',
          'PDF və təqvimə oflayn ixrac',
          'Canlı iş saatları və bağlanma xəbərdarlıqları',
          'Cihazlarınız arasında sinxronlaşan planlar',
        ],
      },
      team: {
        name: 'Komanda',
        blurb: 'Şam yeməyi üstündə mübahisə edən qruplar üçün ortaq planlama.',
        cta: 'Komanda seç',
        features: [
          'Pro paketdəki hər şey',
          'Hər nəfərin səsverməsi ilə ortaq səfərlər',
          'İstənilən fəaliyyətdə şərh mövzuları',
          'Qrup üzrə xərc bölgüsü görünüşü',
          'Prioritet yaradılma növbəsi',
        ],
      },
    },
  },

  notes: {
    eyebrow: 'Dizayn qeydləri',
    heading: 'Müdafiə etməyə dəyən üç qərar.',
    body: 'Burada uydurma müştəri yoxdur. Bunlar məhsulun həqiqətən irəli sürdüyü arqumentlərdir — rəy bölməsinin onsuz da əvəzləməyə çalışdığı şey elə budur.',
    items: [
      {
        quote:
          'Əsas məsələ piyada vaxtlarıdır. Bütün digər planlayıcılar sizə şəhərə səpələnmiş beş yer verir və saat üçdə onlardan ikisinin arasında qırx dəqiqə olduğunu kəşf etməyə buraxır.',
        attribution: 'Həll edilmək üçün qurulduğu problem',
      },
      {
        quote:
          'İşlədiyini görmək — «Lissabonda 14 məkan oxunur», «piyada marşrutlar optimallaşdırılır» — gözləməni sizə yalan danışan yükləmə zolağı yox, irəliləyiş kimi hiss etdirir.',
        attribution: 'Yaradılmanın niyə axınla getdiyi',
      },
      {
        quote:
          'Yenidən düzə bilmədiyiniz plan sadəcə təklifdir. Fəaliyyəti sürükləyib bütün günün onun ətrafında yenidən vaxtlandığını görmək — sənəd olmaqdan çıxdığı andır.',
        attribution: 'Sürüklə-burax niyə yenidən vaxtlayır',
      },
    ],
  },

  faq: {
    eyebrow: 'Tez-tez verilən suallar',
    heading: 'Aşkar suallar.',
    items: {
      realAi: {
        question: 'Bu, həqiqətən dil modelinə müraciət edir?',
        answer:
          'Xeyr — amma memarlıq elə qurulub ki, bir fayl dəyişməklə edə bilər. Planlayıcı əl ilə araşdırılmış məkan kataloqunu əhvalınız, büdcəniz və sürətinizə görə qiymətləndirən, sonra nəticəni Server-Sent Events üzərindən axınla qaytaran lokal xidmətdir.',
        answerTwo:
          'Hər iki tərəf eyni Zod sxemini paylaşır. Həqiqi modelə keçmək o sxemi ona strukturlaşdırılmış çıxış müqaviləsi kimi vermək və günlərini eyni axın kadrları kimi ötürmək deməkdir. Müştəri, doğrulama və bütün interfeys olduğu kimi qalır.',
      },
      cities: {
        question: 'Niyə cəmi {{count}} şəhər?',
        answer:
          'Çünki buradakı hər məkan həqiqi ünvanı, həqiqi koordinatları, həqiqi müddəti və siyahıda olmaq üçün həqiqi səbəbi ilə əl ilə yazılıb. Bunun səkkiz şəhəri, qırıntı elanların səkkiz yüz şəhərindən dəyərlidir — və dayanacaqlar arasındakı piyada vaxtlarının dürüst ola bilməsinin yeganə yolu budur.',
      },
      data: {
        question: 'Səfərlərim hara gedir?',
        answer:
          'Brauzerinizin lokal yaddaşına, versiyalanmış sxem və həqiqi miqrasiya yolu ilə. Hesab yoxdur, serverdə nüsxə yoxdur, marşrutlarınız üzərində analitika yoxdur. Sayt məlumatlarını təmizləmək onları həmişəlik silir — bu, gizlədilmək əvəzinə burada bildirilən güzəştdir.',
      },
      accuracy: {
        question: 'Qiymətlər və iş saatları nə qədər dəqiqdir?',
        answer:
          'Qiymətlər yazıldığı vaxta aid tipik nəfərbaşı rəqəmlərdir və dəyişəcək. Planı həqiqətən dəyişən məhdudiyyətlər — bazar günləri, bazar ertəsi bağlanmalar, məcburi əvvəlcədən rezervasiya — aid olduqları məkanlara bağlanıb və kartda görünür. Burada rezervasiya sistemi yoxdur, ona görə güvənməzdən əvvəl həmişə yoxlayın.',
      },
      motion: {
        question: 'Animasiyanı söndürə bilərəmmi?',
        answer:
          'Sisteminiz belə deyirsə, onsuz da sönülüdür. prefers-reduced-motion hamar sürüşmə qatını tamamilə söndürür, kürəni dayandırır, sürüşməyə bağlı bütün cədvəlləri ötürür və komponent keçidlərini sıfıra endirir — qlobal tətbiq olunur, ona görə yoxlamağı unudan komponent belə düzgün davranır.',
      },
      offline: {
        question: 'Planlayıcı əlçatmaz olarsa nə olur?',
        answer:
          'Yaradılma sonsuz fırlanma yerinə təkrar düyməsi olan aydın xəta vəziyyətinə düşür — oflayn olmaq üçün ayrıca mesaj da daxil. Yadda saxlanan səfərlər lokal yaddaşdan oxunur və şəbəkə olmadan tam gəzilə və redaktə edilə bilər.',
      },
      language: {
        question: 'Hansı hissələr tərcümə olunub?',
        answer:
          'Bütün interfeys — ingilis, Azərbaycan və rus dillərində. Məkan kataloqunun özü ingilis dilində qalır: bu, konkret yerlər haqqında redaksiya mətnidir və yüzlərlə əl ilə yazılmış təsviri maşın tərcüməsindən keçirmək layihənin qalan hissəsinin qaçındığı doldurma mətni yaradardı.',
      },
    },
  },

  cta: {
    heading: 'Bir şəhər seçin. Təxminən səkkiz saniyə çəkir.',
    body: 'Hesab yoxdur, e-poçt yoxdur, tələ yoxdur. Plan görünür, sonra siz onunla mübahisə edib öz halına salırsınız.',
    plan: 'Səfər planla',
    styleguide: 'Dizayn sisteminə bax',
  },

  plan: {
    eyebrow: 'Planlayıcı',
    heading: 'Səfəri qur.',
    body: 'Beş sahə. Planlayıcı işləyərkən mühakiməsini axınla göstərir, sonra sizə sökə biləcəyiniz bir şey verir.',
    destinationLabel: 'Hara gedirsiniz?',
    destinationPlaceholder: 'Lissabon, Tokio, Reykyavik…',
    noCatalogue:
      '«{{query}}» üçün məkan kataloqu yoxdur. Yuxarıdakı {{count}} şəhərdən birini seçin.',
    daysLabel: 'Neçə gün?',
    moodsLabel: 'Necə bir səfər?',
    moodsHint: '(dördədək seçin)',
    budgetLabel: 'Günlük büdcə, nəfərbaşı',
    paceLabel: 'Sürət',
    submit: '{{city}} üçün {{count}} gün qur',
    submitDisabled: 'İstiqamət seçin',
    generating: 'Yaradılır',
    connecting: 'Planlayıcıya qoşulur…',
    progress: 'Yaradılma gedişi',
    cancel: 'Ləğv et',
    emptyHeading: 'Hələ heç nə planlanmayıb',
    emptyBody:
      'Soldan istiqamət seçin — planlayıcı cədvəl quracaq: saat-saat, hər dayanacaq arasındakı piyada vaxtı hesablanmış halda.',
    emptyNote: '{{count}} şəhər mövcuddur. Heç vaxt heç nə tutulmur.',
    errorHeading: 'Bu alınmadı',
    errorFallback: 'Planlayıcı gözlənilmədən xəta verdi.',
    save: 'Səfəri saxla',
    saved: 'Saxlanıldı',
    storageUnavailable: 'Yaddaş əlçatmazdır',
    savedToast: 'Səfər saxlanıldı',
    savedToastBody: 'Onu «Yadda saxlanan» bölməsində tapın və ya keçidi paylaşın.',
    totals: {
      activities: 'Fəaliyyət',
      free: 'Pulsuz',
      cost: 'Ümumi xərc',
      onFoot: 'Piyada',
    },
  },

  pace: {
    relaxed: 'Rahat',
    relaxedDetail: 'gündə 4 dayanacaq',
    balanced: 'Balanslı',
    balancedDetail: 'gündə 5 dayanacaq',
    intense: 'Sıx',
    intenseDetail: 'gündə 6 dayanacaq',
  },

  moods: {
    relax: 'Rahatlıq',
    relaxDetail: 'Az dayanacaq, uzun oturuşlar, doqquzdan əvvəl heç nə.',
    adventure: 'Macəra',
    adventureDetail: 'Yürüşlər, gündəlik səfərlər və əməlli ayaqqabı tələb edən şeylər.',
    food: 'Yemək',
    foodDetail: 'Bazarlar, piştaxtalar və günü ətrafında planlamağa dəyən şam yeməkləri.',
    culture: 'Mədəniyyət',
    cultureDetail: 'Muzeylər, memarlıq və haqqında mübahisə edilən binalar.',
    nightlife: 'Gecə həyatı',
    nightlifeDetail: 'Barlar, canlı musiqi və gecə yarısından sonra bitən gecələr.',
    nature: 'Təbiət',
    natureDetail: 'Parklar, sahil və dayanmaq üçün yaşıl bir yer.',
  },

  kinds: {
    landmark: 'Görməli yer',
    museum: 'Muzey',
    food: 'Yemək',
    cafe: 'Qəhvə',
    nightlife: 'Gecə həyatı',
    nature: 'Açıq hava',
    shopping: 'Alış-veriş',
    transit: 'Yolüstü',
    stay: 'Qalma',
    experience: 'Təcrübə',
  },

  itinerary: {
    day: '{{count}}-ci gün',
    cost: 'Xərc',
    onFoot: 'Piyada',
    ends: 'Bitir',
    reorder: '{{title}} sırasını dəyiş',
    options: '{{title}} üçün seçimlər',
    swap: 'Bunu dəyiş',
    remove: 'Sil',
    removed: 'Silindi',
    removedBody: 'Günün qalanı onun ətrafında yenidən vaxtlandı.',
    lastActivity: 'Bu, sonuncu fəaliyyətdir',
    lastActivityBody: 'Gün boş qala bilməz — əvəzinə onu dəyişin.',
    swapped: 'Dəyişdirildi',
    swappedBody: 'İndi o slotda {{title}} var.',
    alternatives: 'Alternativlər',
    alternativesHeading: 'Başqa bir şey, {{kind}} tipli',
    alternativesBody: 'Birini seçmək günün qalanını onun müddəti və yerinə görə yenidən vaxtlayır.',
    alternativesEmpty:
      'Bu şəhərdə büdcənizə uyğun başqa alternativ qalmayıb. Büdcəni artırmağa çalışın.',
    alternativesFailed: 'Alternativlər yüklənə bilmədi.',
    closeAlternatives: 'Alternativləri bağla',
    dragStart: '{{title}} götürüldü.',
    dragOver: 'İndi {{title}} mövqeyinin üzərindədir.',
    dragEnd: 'Buraxıldı. Gün yeni sıraya görə yenidən vaxtlandı.',
    dragCancel: 'Sıralama ləğv edildi.',
    dragOutside: 'Siyahıdan kənarda buraxıldı. Heç nə dəyişmədi.',
  },

  route: {
    eyebrow: 'Marşrut qurucusu',
    heading: 'Bir səfər, bir neçə şəhər.',
    body: 'Altısınadək düzün. Nocta hər keçidi böyük dairə boyunca ölçür, hər şəhərin əslində neçə günə dəydiyini hesablayır və hamısını yekunlaşdırır — sonra hər dayanacağı planlayıcıya ötürür.',
    yourRoute: 'Marşrutunuz',
    counter: '{{max}}-dən {{count}}',
    empty: 'Aşağıdan şəhər əlavə edin, xəritə çəkməyə başlayacaq.',
    wholeTrip: 'Bütün səfər',
    length: 'Müddət',
    lengthNote: '{{nights}} gecə, {{legs}} yolda',
    ground: 'Qət edilən məsafə',
    groundNote: '{{duration}} yolda',
    singleCity: 'tək şəhər',
    cost: 'Təxmini xərc',
    costNote: 'yaşayış və gündəlik, nəfərbaşı',
    perDay: 'Gündə',
    perDayNote: 'dayanacaqlar üzrə orta',
    method:
      'Gecələr sabit rəqəmdən yox, hər şəhərin kataloqda nə qədər olmasından gəlir. Yol günləri də sayılır — enib dərhal gəzməyə başlamırsınız.',
    addCity: 'Şəhər əlavə et',
    reset: 'Sıfırla',
    full: 'Altı dayanacaq həddidir. Bundan sonra səfər olmaqdan çıxıb tura çevrilir.',
    moveEarlier: '{{city}} şəhərini əvvələ köçür',
    moveLater: '{{city}} şəhərini sonraya köçür',
    removeStop: '{{city}} şəhərini marşrutdan sil',
    planStop: '{{city}} üçün {{count}} gün planla →',
    fly: 'Uçuş',
    rail: 'Qatar',
  },

  destination: {
    allDestinations: '← Bütün istiqamətlər',
    breadcrumb: 'Naviqasiya yolu',
    averageDay: 'Orta gün',
    averageDayNote: 'nəfərbaşı, hər şey daxil',
    typicalHigh: 'Tipik maksimum',
    bestSeasons: 'Ən yaxşı mövsümlər',
    inCatalogue: 'Kataloqda',
    inCatalogueNote: 'məkan · {{count}} gündəlik səfər',
    highlights: 'Günü ətrafında qurmağa dəyən üç şey',
    others: 'Digər istiqamətlər',
    planCity: '{{city}} planla',
    aboutCity: '{{city}} haqqında',
  },

  map: {
    destinations: 'İstiqamətlər',
    destinationCount: '{{count}} istiqamət',
    closeCity: '{{city}} bağla',
    perDayLabel: 'Gündə',
    now: 'İndi',
    best: 'Ən yaxşı',
    bestSeasons: 'Ən yaxşı mövsümlər: {{seasons}}.',
  },

  seasons: {
    spring: 'Yaz',
    summer: 'Yay',
    autumn: 'Payız',
    winter: 'Qış',
  },

  saved: {
    eyebrow: 'Yadda saxlanan',
    heading: 'Səfərləriniz.',
    body: 'Bu brauzerdə versiyalanmış sxem altında saxlanılır — heç vaxt yüklənmir, heç vaxt sinxronlaşdırılmır. Sayt məlumatlarını təmizləmək onları həmişəlik silir.',
    unavailableHeading: 'Lokal yaddaş əlçatmazdır',
    unavailableBody:
      'Brauzeriniz məlumat saxlamaqdan imtina edir — çox vaxt bu, gizli rejim və ya sayt yaddaşını bloklayan siyasətdir. Səfər planlaya bilərsiniz, sadəcə ziyarətlər arasında qalmayacaq.',
    emptyHeading: 'Hələ heç nə saxlanılmayıb',
    emptyBody:
      'Plan qurun və saxla düyməsini basın. Yekunları ilə birlikdə burada görünəcək, redaktəyə hazır.',
    activities: 'Fəaliyyət',
    cost: 'Xərc',
    savedAt: 'Saxlanıldı',
    open: 'Aç',
    delete: 'Sil',
    removed: 'Səfər silindi',
    couldNotRead: 'Yadda saxlanan səfərlər oxuna bilmədi',
    couldNotReadBody:
      'Saxlanmış məlumat gözlənilməz formatda idi. Silinmək əvəzinə kənara qoyulub.',
    couldNotSave: 'Saxlanıla bilmədi',
    couldNotSaveBody:
      'Brauzeriniz lokal yaddaşa yazmaqdan imtina etdi — dolu ola bilər və ya gizli rejimdədir.',
    defaultName: '{{city}} şəhərində {{count}} gün',
  },

  trip: {
    allSaved: '← Bütün yadda saxlananlar',
    savedOn: '{{date}} tarixində saxlanılıb',
    days: 'Gün',
    activities: 'Fəaliyyət',
    cost: 'Ümumi xərc',
    onFoot: 'Piyada',
    print: 'Çap et və ya PDF kimi saxla',
    copyLink: 'Keçidi kopyala',
    notFoundHeading: 'Bu səfər bu brauzerdə deyil',
    notFoundBody:
      'Səfərlər lokal saxlanılır və heç vaxt yüklənmir, ona görə keçid yalnız onu yaradan cihazda açılır. Yenidən qurun — planlayıcı deterministikdir, eyni girişlər eyni planı verir.',
    openPlanner: 'Planlayıcını aç',
    notFoundEyebrow: 'Tapılmadı',
  },

  notFound: {
    eyebrow: '404',
    heading: 'Xəritədən kənara çıxmısınız.',
    body: 'Bu, şəhərdə adətən düzgün instinktdir, ünvan sətrində isə yanlış.',
  },

  errors: {
    eyebrow: 'Xəta',
    routeMissing: 'Belə səhifə yoxdur',
    routeMissingBody: 'Keçid köhnəlmiş ola bilər və ya göstərdiyi səfər silinib.',
    routeBroken: 'Bizim tərəfdə nəsə xarab oldu',
    routeBrokenBody: 'Bu səhifə yüklənmədi. Yadda saxlanan səfərlərinizə toxunulmayıb.',
    sectionBroken: 'Bu bölmə cavab verməyi dayandırdı',
    sectionBrokenBody: 'Tətbiqin qalanı işləkdir. Yenidən cəhd edin və ya planlayıcıya qayıdın.',
    status: 'Xəta {{status}}',
    generationFailed: 'Yaradılma alınmadı',
    couldNotBuild: 'Planınız qurula bilmədi',
    offline: 'Görünür oflaynsınız. Yadda saxlanan səfərləriniz hələ də əlçatandır.',
    network: 'Planlayıcıya çata bilmədik. Bağlantınızı yoxlayıb yenidən cəhd edin.',
    timeout: 'Planlayıcı cavab verməyə həddən çox vaxt sərf etdi. Bir azdan yenidən cəhd edin.',
    aborted: 'Yaradılma ləğv edildi.',
    validation: 'Planlayıcı oxuya bilmədiyimiz nəsə qaytardı. Bu, bizim təqsirimizdir.',
    notFound: 'O səfəri tapa bilmədik. Silinmiş ola bilər.',
    rateLimited: 'Eyni anda həddən çox plan. Bir dəqiqə gözləyib yenidən cəhd edin.',
    server: 'Planlayıcı xəta verdi. Qeydə aldıq — zəhmət olmasa yenidən cəhd edin.',
  },

  loading: {
    page: 'Səhifə yüklənir',
    ellipsis: 'Yüklənir…',
  },
};
