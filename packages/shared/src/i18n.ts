import type { SupportedLanguage } from './types.js';

export const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    // Branding
    'app.name': 'DayZero',
    'app.tagline': 'Privacy-first recovery companion inspired by Thanal (തണൽ)',
    'app.subtitle': 'Zero licence cost, verifiable public care, private daily practice',

    // Navigation
    'nav.home': 'Companion',
    'nav.care': 'Find Care',
    'nav.helplines': 'Helplines',
    'nav.community': 'Community',
    'nav.settings': 'Settings',

    // Emergency Banner
    'emergency.title': 'Immediate Emergency or Crisis',
    'emergency.description': 'If you or someone around you is in immediate danger, having seizures, hallucinating, or unresponsive, call 112 now. Free, 24x7.',
    'emergency.call112': 'Call 112 (Emergency)',
    'emergency.telemanas': 'Call 14416 (Tele-MANAS Crisis)',
    'emergency.tollfree': 'Toll-free: 1800-891-4416',
    'emergency.disclaimer': 'DayZero is a self-care companion, not an emergency service. Do not attempt unmonitored home detox for severe dependence.',

    // Check-in & Companion
    'checkin.title': 'Daily Wellbeing Check-in',
    'checkin.subtitle': 'Private to your device and account. Never shared publicly.',
    'checkin.mood': 'How are you feeling today?',
    'checkin.mood.1': 'Very Low / Distressed',
    'checkin.mood.2': 'Struggling',
    'checkin.mood.3': 'Steady / Coping',
    'checkin.mood.4': 'Good / Hopeful',
    'checkin.mood.5': 'Strong / Peaceful',
    'checkin.note': 'Private reflection note (optional)',
    'checkin.note.placeholder': 'Write whatever you need to get out of your head...',
    'checkin.submit': 'Record Check-in',
    'checkin.done': 'Check-in recorded for today',
    'checkin.alreadyDone': 'You have already checked in today. Recording again will update your entry.',

    // Consistency Widget
    'consistency.title': '7-Day Reflection Consistency',
    'consistency.subtitle': 'Percentage of eligible calendar days with at least one check-in in the selected 7-day window.',
    'consistency.pct': '{pct}% Consistent',
    'consistency.eligible': '{completed} of {eligible} eligible days completed',
    'consistency.streak': '{streak} day current practice',
    'consistency.msg.starting': 'Welcome. Every journey begins with a single moment of presence.',
    'consistency.msg.some': 'Every check-in is an intentional pause for your wellbeing. Keep going.',
    'consistency.msg.moderate': 'Steady reflection. Consistency is a practice of care, not a performance.',
    'consistency.msg.high': 'Wonderful dedication to your personal recovery reflection.',
    'consistency.msg.full': 'Full consistency this week. Honor the time you invested in yourself.',
    'consistency.disclaimer': 'Consistency measures reflection practice, not clinical recovery outcome. Missed days are completely normal.',

    // Care Directory
    'care.title': 'Verified Kerala Care Directory',
    'care.subtitle': 'De-addiction centres, Punarjani homoeopathy units and district services from verified government sources.',
    'care.search': 'Search by facility name or town...',
    'care.district': 'Filter by District',
    'care.allDistricts': 'All Districts (Kerala)',
    'care.type': 'Facility Type',
    'care.allTypes': 'All Facility Types',
    'care.status.verified': 'Verified Source',
    'care.status.stale': 'Dated / Unconfirmed Current Ops',
    'care.status.unverified': 'Unverified Source',
    'care.cost': 'Cost Information',
    'care.eligibility': 'Eligibility & Referrals',
    'care.hours': 'Operating Hours',
    'care.source': 'Source & Verification Date',
    'care.directions': 'Get Directions (Map)',
    'care.call': 'Call Facility',
    'care.empty': 'No care facilities match your filters.',

    // Community
    'community.title': 'Private Recovery Circles',
    'community.subtitle': 'Invitation-based, moderated peer support groups using pseudonyms.',
    'community.join': 'Redeem Invitation',
    'community.joinCode': 'Invitation Code',
    'community.joinPseudonym': 'Choose a Pseudonym',
    'community.pseudonymNotice': 'Your pseudonym protects your identity inside the circle. Do not use your legal name.',
    'community.anonymityNotice': 'Notice: Pseudonyms provide privacy, but cannot guarantee that other members will keep shared information confidential.',
    'community.rulesTitle': 'Community Safety Ground Rules',
    'community.rulesNotice': 'Respect, confidentiality, and compassionate listening. Harassment, medical prescribing, or substance offers result in an immediate ban.',
    'community.postPlaceholder': 'Share a reflection with your group...',
    'community.postSubmit': 'Post',
    'community.report': 'Report Post',
    'community.block': 'Block Member',
    'community.moderate': 'Moderator Tools',

    // Settings & Privacy
    'settings.title': 'Settings & Privacy',
    'settings.language': 'Language / ഭാഷ',
    'settings.timezone': 'Timezone',
    'settings.privacyPolicy': 'Privacy Policy & Data Minimum',
    'settings.dataRetention': 'Data Retention & Security Policy',
    'settings.deleteAccount': 'Delete My Account and All Data',
    'settings.deleteWarning': 'This permanently deletes your account and cascades the destruction of all check-ins, goals, memberships, and posts. This action is irreversible.',
    'settings.deleteConfirmPrompt': 'Type "DELETE" and enter your password to confirm:',
    'settings.deleteSuccess': 'Your account and all associated data have been permanently erased.',
  },

  ml: {
    // Branding
    'app.name': 'ഡേ സീറോ',
    'app.tagline': 'തണൽ (Thanal) മാതൃകയിലുള്ള സ്വകാര്യ ലഹരിമുക്തി പിന്തുണ പ്ലാറ്റ്‌ഫോം',
    'app.subtitle': 'പൂർണ്ണമായും സൗജന്യം, പരിശോധിച്ചുറപ്പിച്ച സർക്കാർ സേവനങ്ങൾ, സ്വകാര്യ ദൈനംദിന മുന്നേറ്റം',

    // Navigation
    'nav.home': 'സഹായി',
    'nav.care': 'സേവനങ്ങൾ',
    'nav.helplines': 'ഹെൽപ്പ്‌ലൈനുകൾ',
    'nav.community': 'കൂട്ടായ്മ',
    'nav.settings': 'ക്രമീകരണങ്ങൾ',

    // Emergency Banner
    'emergency.title': 'അടിയന്തര സഹായം / ക്രൈസിസ്',
    'emergency.description': 'താങ്കൾക്കോ പ്രിയപ്പെട്ടവർക്കോ അപസ്മാരം, ബോധക്ഷയം, അമിതമായ വിഭ്രാന്തി എന്നിവ ഉണ്ടായാൽ ഉടൻ 112 വിളിക്കുക. 24 മണിക്കൂറും സൗജന്യം.',
    'emergency.call112': '112 വിളിക്കുക (അടിയന്തര സഹായം)',
    'emergency.telemanas': '14416 വിളിക്കുക (ടെലി-മാനസ്)',
    'emergency.tollfree': 'ടോൾ-ഫ്രീ: 1800-891-4416',
    'emergency.disclaimer': 'ഡേ സീറോ ഒരു സ്വയംസഹായ പ്ലാറ്റ്‌ഫോമാണ്, അടിയന്തര ആശുപത്രി സേവനങ്ങൾക്ക് പകരമല്ല.',

    // Check-in & Companion
    'checkin.title': 'ദൈനംദിന ചെക്ക്-ഇൻ',
    'checkin.subtitle': 'താങ്കളുടെ വിവരങ്ങൾ തികച്ചും സ്വകാര്യമാണ്. ആർക്കും കാണാൻ കഴിയില്ല.',
    'checkin.mood': 'ഇന്ന് താങ്കളുടെ മാനസികാവസ്ഥ എങ്ങനെയാണ്?',
    'checkin.mood.1': 'വളരെ പ്രയാസകരമാണ്',
    'checkin.mood.2': 'ബുദ്ധിമുട്ടുകൾ ഉണ്ട്',
    'checkin.mood.3': 'സാധാരണ നിലയിൽ',
    'checkin.mood.4': 'നല്ല നിലയിൽ / പ്രത്യാശയോടെ',
    'checkin.mood.5': 'വളരെ ശാന്തവും ശക്തവുമാണ്',
    'checkin.note': 'സ്വകാര്യ കുറിപ്പ് (നിർബന്ധമില്ല)',
    'checkin.note.placeholder': 'താങ്കളുടെ ചിന്തകൾ ഇവിടെ രേഖപ്പെടുത്താം...',
    'checkin.submit': 'രേഖപ്പെടുത്തുക',
    'checkin.done': 'ഇന്നത്തെ ചെക്ക്-ഇൻ പൂർത്തിയായി',
    'checkin.alreadyDone': 'ഇന്നത്തെ ചെക്ക്-ഇൻ നേരത്തെ രേഖപ്പെടുത്തിയിട്ടുണ്ട്.',

    // Consistency Widget
    'consistency.title': '7 ദിവസത്തെ പങ്കാളിത്തം',
    'consistency.subtitle': 'കഴിഞ്ഞ 7 ദിവസങ്ങളിൽ ചെക്ക്-ഇൻ പൂർത്തിയാക്കിയ ദിവസങ്ങളുടെ ശതമാനം.',
    'consistency.pct': '{pct}% പങ്കാളിത്തം',
    'consistency.eligible': '{eligible} ദിവസങ്ങളിൽ {completed} ദിവസം പൂർത്തിയായി',
    'consistency.streak': '{streak} ദിവസത്തെ തുടർച്ച',
    'consistency.msg.starting': 'സ്വാഗതം. ചെറിയൊരു ചുവടുവെപ്പിലൂടെ വലിയ മാറ്റങ്ങൾ സാധ്യമാണ്.',
    'consistency.msg.some': 'ഓരോ ചെക്ക്-ഇന്നും താങ്കളുടെ സ്വയംപരിചരണത്തിന്റെ അടയാളമാണ്.',
    'consistency.msg.moderate': 'നല്ല മുന്നേറ്റം. ഇത് സ്വയം മെച്ചപ്പെടാനുള്ള ശീലമാണ്.',
    'consistency.msg.high': 'വളരെ നല്ല പങ്കാളിത്തം. താങ്കളുടെ പരിശ്രമത്തെ അഭിനന്ദിക്കുന്നു.',
    'consistency.msg.full': 'ഈ ആഴ്ച പൂർണ്ണമായ പങ്കാളിത്തം. അഭിനന്ദനങ്ങൾ!',
    'consistency.disclaimer': 'ഈ ശതമാനം താങ്കളുടെ പരിശീലനത്തെ സൂചിപ്പിക്കുന്നു. ചില ദിവസങ്ങൾ നഷ്ടപ്പെട്ടാലും സ്വയം കുറ്റപ്പെടുത്തേണ്ടതില്ല.',

    // Care Directory
    'care.title': 'കേരള സർക്കാർ ലഹരിമുക്തി കേന്ദ്രങ്ങൾ',
    'care.subtitle': 'ഡി-അഡിക്ഷൻ സെന്ററുകൾ, പുനർജനി ഹോമിയോപ്പതി യൂണിറ്റുകൾ എന്നിവയുടെ പട്ടിക.',
    'care.search': 'കേന്ദ്രത്തിന്റെ പേരോ സ്ഥലമോ തിരയുക...',
    'care.district': 'ജില്ല തിരഞ്ഞെടുക്കുക',
    'care.allDistricts': 'എല്ലാ ജില്ലകളും',
    'care.type': 'സേവന വിഭാഗം',
    'care.allTypes': 'എല്ലാ വിഭാഗങ്ങളും',
    'care.status.verified': 'സ്ഥിരീകരിച്ച ഉറവിടം',
    'care.status.stale': 'പഴയ വിവരങ്ങൾ / സ്ഥിരീകരിക്കാത്തവ',
    'care.status.unverified': 'സ്ഥിരീകരിക്കാത്ത ഉറവിടം',
    'care.cost': 'ചികിത്സാ ചെലവ് വിവരങ്ങൾ',
    'care.eligibility': 'യോഗ്യതയും റഫറലും',
    'care.hours': 'പ്രവർത്തന സമയം',
    'care.source': 'ഉറവിടവും തീയതിയും',
    'care.directions': 'വഴി കണ്ടെത്തുക (മാപ്പ്)',
    'care.call': 'വിളിക്കുക',
    'care.empty': 'സേവനങ്ങൾ ഒന്നും കണ്ടെത്താനായില്ല.',

    // Community
    'community.title': 'സ്വകാര്യ പിന്തുണ കൂട്ടായ്മ',
    'community.subtitle': 'ക്ഷണിക്കപ്പെട്ടവർക്ക് മാത്രമുള്ള നിയന്ത്രിത ഗ്രൂപ്പുകൾ (Pseudonyms).',
    'community.join': 'ക്ഷണക്കത്ത് ഉപയോഗിക്കുക',
    'community.joinCode': 'ഇൻവിറ്റേഷൻ കോഡ്',
    'community.joinPseudonym': 'ഒരു രഹസ്യപ്പേര് തിരഞ്ഞെടുക്കുക',
    'community.pseudonymNotice': 'യഥാർത്ഥ പേര് നൽകേണ്ടതില്ല. രഹസ്യപ്പേര് ഉപയോഗിക്കുക.',
    'community.anonymityNotice': 'മുന്നറിയിപ്പ്: രഹസ്യപ്പേരുകൾ നൽകിയാലും ഗ്രൂപ്പിലെ മറ്റ് അംഗങ്ങൾ രഹസ്യസ്വഭാവം ലംഘിക്കാനുള്ള സാധ്യതയുണ്ട്.',
    'community.rulesTitle': 'കൂട്ടായ്മാ നിയമങ്ങൾ',
    'community.rulesNotice': 'പരസ്പര ബഹുമാനം, സ്വകാര്യത സൂക്ഷിക്കൽ. അനുചിതമായ പെരുമാറ്റങ്ങൾക്ക് ഉടൻ വിലക്ക് ഏർപ്പെടുത്തും.',
    'community.postPlaceholder': 'കൂട്ടായ്മയിലേക്ക് സന്ദേശം പങ്കുവെക്കുക...',
    'community.postSubmit': 'പങ്കുവെക്കുക',
    'community.report': 'റിപ്പോർട്ട് ചെയ്യുക',
    'community.block': 'ബ്ലോക്ക് ചെയ്യുക',
    'community.moderate': 'മോഡറേറ്റർ ടൂളുകൾ',

    // Settings & Privacy
    'settings.title': 'ക്രമീകരണങ്ങളും സ്വകാര്യതയും',
    'settings.language': 'ഭാഷ / Language',
    'settings.timezone': 'ടൈംസോൺ',
    'settings.privacyPolicy': 'സ്വകാര്യതാ നയം',
    'settings.dataRetention': 'വിവര ശേഖരണ നയം',
    'settings.deleteAccount': 'അക്കൗണ്ടും എല്ലാ വിവരങ്ങളും ഇല്ലാതാക്കുക',
    'settings.deleteWarning': 'ഈ നടപടിയിലൂടെ താങ്കളുടെ അക്കൗണ്ടും എല്ലാ ചെക്ക്-ഇൻ വിവരങ്ങളും പൂർണ്ണമായും മായ്ച്ചു കളയപ്പെടും.',
    'settings.deleteConfirmPrompt': '"DELETE" എന്ന് ടൈപ്പ് ചെയ്ത് പാസ്‌വേഡ് നൽകുക:',
    'settings.deleteSuccess': 'താങ്കളുടെ അക്കൗണ്ടും വിവരങ്ങളും പൂർണ്ണമായി നീക്കം ചെയ്തു.',
  },

  'ml-Latn': {
    // Branding
    'app.name': 'DayZero',
    'app.tagline': 'Thanal maathrukayilulla private recovery support platform',
    'app.subtitle': 'Poornnamayum saujanyam, sarkkaar sevanangal, swakaarya munnettam',

    // Navigation
    'nav.home': 'Sahaayi',
    'nav.care': 'Sevanangal',
    'nav.helplines': 'Helplines',
    'nav.community': 'Koottayma',
    'nav.settings': 'Settings',

    // Emergency Banner
    'emergency.title': 'Aadiyantara Sahayam / Crisis',
    'emergency.description': 'Aapalsadhyathayulla saahacharyangalil police, fire, ambulance aavashyangalkkayi 112 vilikkuka. 24 manikkoorum saujanyam.',
    'emergency.call112': '112 Vilikkuka (Emergency)',
    'emergency.telemanas': '14416 Vilikkuka (Tele-MANAS)',
    'emergency.tollfree': 'Toll-free: 1800-891-4416',
    'emergency.disclaimer': 'DayZero oru swayam-sahaya platform aanu. Aadiyantara aashupathri sevanangalkku pakaramalla.',

    // Check-in & Companion
    'checkin.title': 'Dainamdina Check-in',
    'checkin.subtitle': 'Thangalude vivarangal theerthum swakaaryamaanu.',
    'checkin.mood': 'Innu thangalude manasikavastha enganeyaanu?',
    'checkin.mood.1': 'Valare vishamathilaanu',
    'checkin.mood.2': 'Budhimuttukal undu',
    'checkin.mood.3': 'Sadharana nilayil',
    'checkin.mood.4': 'Nalla nilayil / Prathyashayode',
    'checkin.mood.5': 'Shanthavum shakthavumaanu',
    'checkin.note': 'Swakaarya kurippu (nirbandhamilla)',
    'checkin.note.placeholder': 'Thangalude chinthakal ivide ezhuthuka...',
    'checkin.submit': 'Rekhapeduthuka',
    'checkin.done': 'Innathe check-in poorthiyaayi',
    'checkin.alreadyDone': 'Innathe check-in nerathe rekhapeduthiyittundu.',

    // Consistency Widget
    'consistency.title': '7 Divasathe Pankalitham',
    'consistency.subtitle': 'Kazhinja 7 divasangalil check-in poorthiyaakkiya divasangalaude shathamaanam.',
    'consistency.pct': '{pct}% Pankalitham',
    'consistency.eligible': '{eligible} divasangalil {completed} divasam poorthiyaayi',
    'consistency.streak': '{streak} divasathe thudarcha',
    'consistency.msg.starting': 'Swagatham. Cheriya chuvaduvayppiloode valiya maattangal saadhyamaanu.',
    'consistency.msg.some': 'Oaro check-in um thangalude swayam-paricharanathinte adayalamaanu.',
    'consistency.msg.moderate': 'Nalla munnettam. Ithu swayam mechappedaanulla sheelamaanu.',
    'consistency.msg.high': 'Valare nalla pankalitham. Thangalude parishramathe abhinandikkunnu.',
    'consistency.msg.full': 'Ee aazhcha poornnamaaya pankalitham. Abhinandhanangal!',
    'consistency.disclaimer': 'Ee shathamaanam thangalude sheerlathe maathramaanu kaanikkunnathu. Ksheenam thonniyaal swayam kuttappeduthendathilla.',

    // Care Directory
    'care.title': 'Kerala Sarkkaar Laharimukthi Kendrangal',
    'care.subtitle': 'De-addiction centres, Punarjani homoeopathy units list.',
    'care.search': 'Kendrathinte pero sthalanamo thirayuka...',
    'care.district': 'Jilla thiranjedukkuka',
    'care.allDistricts': 'Ella Jillakalum',
    'care.type': 'Sevana Vibhaagam',
    'care.allTypes': 'Ella Vibhaagavum',
    'care.status.verified': 'Sthireekarischa Uravidam',
    'care.status.stale': 'Pazhaya vivarangal / Sthireekarikkaathath',
    'care.status.unverified': 'Sthireekarikkaatha Uravidam',
    'care.cost': 'Chikitsa Chelavu Vivarangal',
    'care.eligibility': 'Yogyathayum Referral um',
    'care.hours': 'Pravarthana Samayam',
    'care.source': 'Uravidavum Theeyathiyum',
    'care.directions': 'Vazhi Kandethuka (Map)',
    'care.call': 'Vilikkuka',
    'care.empty': 'Sevanangal onnum kandethaanayilla.',

    // Community
    'community.title': 'Swakaarya Koottayma',
    'community.subtitle': 'Kshanikkappettavarkku maathramulla moderated groups (Pseudonyms).',
    'community.join': 'Invitation Code Upayogikkuka',
    'community.joinCode': 'Invitation Code',
    'community.joinPseudonym': 'Oru Rahasya-per thiranjedukkuka',
    'community.pseudonymNotice': 'Yathartha per nalkendathilla. Pseudonym upayogikkuka.',
    'community.anonymityNotice': 'Munnariyippu: Pseudonym nalkiyaalum koottaymayile mattullavar rahasyathwam paalikkaathirikkanulla saadhyatha undu.',
    'community.rulesTitle': 'Koottayma Niyamangal',
    'community.rulesNotice': 'Paraspara bahumaanam, swakaaryatha sookshikkal.',
    'community.postPlaceholder': 'Koottaymayilekku sandhesham pankuvaykkuka...',
    'community.postSubmit': 'Pankuvaykkuka',
    'community.report': 'Report Cheyyuka',
    'community.block': 'Block Cheyyuka',
    'community.moderate': 'Moderator Tools',

    // Settings & Privacy
    'settings.title': 'Settings & Privacy',
    'settings.language': 'Language / Bhasha',
    'settings.timezone': 'Timezone',
    'settings.privacyPolicy': 'Swakaaryathaa Nayam',
    'settings.dataRetention': 'Vivara Shekharana Nayam',
    'settings.deleteAccount': 'Account um Ella Vivarangalum Illathaakkuka',
    'settings.deleteWarning': 'Ee nadapadiyiloode thangalude account um check-in vivarangalum poornnamayum maaykkappadum.',
    'settings.deleteConfirmPrompt': '"DELETE" ennu type cheythu password nalkuka:',
    'settings.deleteSuccess': 'Thangalude account um vivarangalum poornnamaayi neekkam cheythu.',
  },
};

/**
 * Translate a key into the given language with optional interpolations.
 */
export function t(
  key: string,
  lang: SupportedLanguage = 'en',
  params?: Record<string, string | number>
): string {
  const dictionary = TRANSLATIONS[lang] || TRANSLATIONS.en;
  let text = dictionary[key] || TRANSLATIONS.en[key] || key;

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replaceAll(`{${k}}`, String(v));
    }
  }

  return text;
}
