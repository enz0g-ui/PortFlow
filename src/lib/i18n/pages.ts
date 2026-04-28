/**
 * Page-level translations. Kept separate from messages.ts to avoid bloating
 * the main UI translation file. Pipe-delimited strings for arrays of features.
 */

import type { Locale } from "./messages";

type PageMessages = Record<string, string>;

const fr: PageMessages = {
  // Common
  "nav.back": "← retour",

  // /pricing
  "pricing.title": "Tarifs",
  "pricing.subtitle":
    "AIS multi-port · ETA prédite · fusion SAR · screening sanctions · 51 ports stratégiques",
  "pricing.note":
    "Les paiements sont opérationnels uniquement quand STRIPE_SECRET_KEY et STRIPE_PRICE_* sont définis. Sinon le bouton renvoie une erreur 503.",
  "pricing.note.label": "Note technique :",
  "pricing.checkout.error": "Stripe Checkout indisponible",
  "pricing.tier.free.name": "Free",
  "pricing.tier.free.price": "0 €",
  "pricing.tier.free.period": "",
  "pricing.tier.free.features":
    "3 ports stratégiques|Dashboard live, 7 j d'historique|Pas d'API publique",
  "pricing.tier.free.cta": "Démarrer",
  "pricing.tier.starter.name": "Starter",
  "pricing.tier.starter.price": "99 €",
  "pricing.tier.starter.period": "/ mois",
  "pricing.tier.starter.features":
    "15 ports|API publique 5 k req/j|Alertes webhook|Export CSV|30 j d'historique|25 navires en watchlist",
  "pricing.tier.starter.cta": "Choisir Starter",
  "pricing.tier.pro.name": "Pro",
  "pricing.tier.pro.price": "499 €",
  "pricing.tier.pro.period": "/ mois",
  "pricing.tier.pro.features":
    "Les 51 ports|API 600 req/min|ETA precision détaillée + attribution des retards|Fusion AIS + SAR Sentinel-1|Détection dark fleet|Screening sanctions OFAC + UK OFSI|Émissions CO2 par voyage|90 j d'historique|250 navires en watchlist",
  "pricing.tier.pro.cta": "Choisir Pro",
  "pricing.tier.enterprise.name": "Enterprise",
  "pricing.tier.enterprise.price": "Sur devis",
  "pricing.tier.enterprise.period": "",
  "pricing.tier.enterprise.features":
    "Tout Pro +|Connecteurs Spire / MarineTraffic / Orbcomm|SLA 99,9 % contractuel|365 j+ d'historique + backfill|White-label & dédié|Support dédié",
  "pricing.tier.enterprise.cta": "Nous contacter",
};

const en: PageMessages = {
  "nav.back": "← back",

  "pricing.title": "Pricing",
  "pricing.subtitle":
    "Multi-port AIS · predicted ETA · SAR fusion · sanctions screening · 51 strategic ports",
  "pricing.note":
    "Payments only work once STRIPE_SECRET_KEY and STRIPE_PRICE_* are set. Otherwise the button returns a 503 error.",
  "pricing.note.label": "Tech note:",
  "pricing.checkout.error": "Stripe Checkout unavailable",
  "pricing.tier.free.name": "Free",
  "pricing.tier.free.price": "€0",
  "pricing.tier.free.period": "",
  "pricing.tier.free.features":
    "3 strategic ports|Live dashboard, 7-day history|No public API",
  "pricing.tier.free.cta": "Get started",
  "pricing.tier.starter.name": "Starter",
  "pricing.tier.starter.price": "€99",
  "pricing.tier.starter.period": "/ month",
  "pricing.tier.starter.features":
    "15 ports|Public API, 5k req/day|Webhook alerts|CSV export|30-day history|25 vessels in watchlist",
  "pricing.tier.starter.cta": "Choose Starter",
  "pricing.tier.pro.name": "Pro",
  "pricing.tier.pro.price": "€499",
  "pricing.tier.pro.period": "/ month",
  "pricing.tier.pro.features":
    "All 51 ports|API 600 req/min|Detailed ETA precision + delay attribution|AIS + SAR Sentinel-1 fusion|Dark fleet detection|OFAC + UK OFSI sanctions screening|CO2 emissions per voyage|90-day history|250 vessels in watchlist",
  "pricing.tier.pro.cta": "Choose Pro",
  "pricing.tier.enterprise.name": "Enterprise",
  "pricing.tier.enterprise.price": "On request",
  "pricing.tier.enterprise.period": "",
  "pricing.tier.enterprise.features":
    "Everything in Pro, plus|Spire / MarineTraffic / Orbcomm connectors|99.9% contractual SLA|365+ days history + backfill|White-label & dedicated|Dedicated support",
  "pricing.tier.enterprise.cta": "Contact sales",
};

const nl: PageMessages = {
  "nav.back": "← terug",

  "pricing.title": "Tarieven",
  "pricing.subtitle":
    "Multi-haven AIS · voorspelde ETA · SAR-fusie · sanctie-screening · 51 strategische havens",
  "pricing.note":
    "Betalingen werken alleen wanneer STRIPE_SECRET_KEY en STRIPE_PRICE_* zijn ingesteld. Anders geeft de knop een 503-fout.",
  "pricing.note.label": "Technische noot:",
  "pricing.checkout.error": "Stripe Checkout niet beschikbaar",
  "pricing.tier.free.name": "Free",
  "pricing.tier.free.price": "€0",
  "pricing.tier.free.period": "",
  "pricing.tier.free.features":
    "3 strategische havens|Live dashboard, 7 dagen historie|Geen openbare API",
  "pricing.tier.free.cta": "Beginnen",
  "pricing.tier.starter.name": "Starter",
  "pricing.tier.starter.price": "€99",
  "pricing.tier.starter.period": "/ maand",
  "pricing.tier.starter.features":
    "15 havens|Openbare API, 5k req/dag|Webhook-meldingen|CSV-export|30 dagen historie|25 schepen in watchlist",
  "pricing.tier.starter.cta": "Kies Starter",
  "pricing.tier.pro.name": "Pro",
  "pricing.tier.pro.price": "€499",
  "pricing.tier.pro.period": "/ maand",
  "pricing.tier.pro.features":
    "Alle 51 havens|API 600 req/min|Gedetailleerde ETA-precisie + vertragingsattributie|AIS + SAR Sentinel-1 fusie|Detectie donkere vloot|Sancties OFAC + UK OFSI screening|CO2-emissies per reis|90 dagen historie|250 schepen in watchlist",
  "pricing.tier.pro.cta": "Kies Pro",
  "pricing.tier.enterprise.name": "Enterprise",
  "pricing.tier.enterprise.price": "Op aanvraag",
  "pricing.tier.enterprise.period": "",
  "pricing.tier.enterprise.features":
    "Alles in Pro, plus|Spire / MarineTraffic / Orbcomm-connectoren|99,9% contractuele SLA|365+ dagen historie + backfill|White-label & toegewijd|Toegewijde ondersteuning",
  "pricing.tier.enterprise.cta": "Neem contact op",
};

const de: PageMessages = {
  "nav.back": "← zurück",

  "pricing.title": "Preise",
  "pricing.subtitle":
    "Multi-Hafen-AIS · vorhergesagte ETA · SAR-Fusion · Sanktions-Screening · 51 strategische Häfen",
  "pricing.note":
    "Zahlungen funktionieren nur, wenn STRIPE_SECRET_KEY und STRIPE_PRICE_* gesetzt sind. Andernfalls gibt der Button einen 503-Fehler zurück.",
  "pricing.note.label": "Technischer Hinweis:",
  "pricing.checkout.error": "Stripe Checkout nicht verfügbar",
  "pricing.tier.free.name": "Free",
  "pricing.tier.free.price": "0 €",
  "pricing.tier.free.period": "",
  "pricing.tier.free.features":
    "3 strategische Häfen|Live-Dashboard, 7 Tage Historie|Keine öffentliche API",
  "pricing.tier.free.cta": "Loslegen",
  "pricing.tier.starter.name": "Starter",
  "pricing.tier.starter.price": "99 €",
  "pricing.tier.starter.period": "/ Monat",
  "pricing.tier.starter.features":
    "15 Häfen|Öffentliche API, 5k Req/Tag|Webhook-Benachrichtigungen|CSV-Export|30 Tage Historie|25 Schiffe in der Watchlist",
  "pricing.tier.starter.cta": "Starter wählen",
  "pricing.tier.pro.name": "Pro",
  "pricing.tier.pro.price": "499 €",
  "pricing.tier.pro.period": "/ Monat",
  "pricing.tier.pro.features":
    "Alle 51 Häfen|API 600 Req/Min|Detaillierte ETA-Genauigkeit + Verzögerungs-Attribution|AIS + SAR Sentinel-1 Fusion|Dark-Fleet-Erkennung|OFAC + UK OFSI Sanktions-Screening|CO2-Emissionen pro Reise|90 Tage Historie|250 Schiffe in der Watchlist",
  "pricing.tier.pro.cta": "Pro wählen",
  "pricing.tier.enterprise.name": "Enterprise",
  "pricing.tier.enterprise.price": "Auf Anfrage",
  "pricing.tier.enterprise.period": "",
  "pricing.tier.enterprise.features":
    "Alles aus Pro, plus|Spire / MarineTraffic / Orbcomm-Konnektoren|99,9% vertraglicher SLA|365+ Tage Historie + Backfill|White-Label & dediziert|Dedizierter Support",
  "pricing.tier.enterprise.cta": "Kontaktieren Sie uns",
};

const es: PageMessages = {
  "nav.back": "← volver",

  "pricing.title": "Tarifas",
  "pricing.subtitle":
    "AIS multipuerto · ETA predicha · fusión SAR · screening de sanciones · 51 puertos estratégicos",
  "pricing.note":
    "Los pagos solo funcionan cuando STRIPE_SECRET_KEY y STRIPE_PRICE_* están definidos. De lo contrario, el botón devuelve un error 503.",
  "pricing.note.label": "Nota técnica:",
  "pricing.checkout.error": "Stripe Checkout no disponible",
  "pricing.tier.free.name": "Free",
  "pricing.tier.free.price": "0 €",
  "pricing.tier.free.period": "",
  "pricing.tier.free.features":
    "3 puertos estratégicos|Panel en vivo, 7 días de historial|Sin API pública",
  "pricing.tier.free.cta": "Empezar",
  "pricing.tier.starter.name": "Starter",
  "pricing.tier.starter.price": "99 €",
  "pricing.tier.starter.period": "/ mes",
  "pricing.tier.starter.features":
    "15 puertos|API pública 5k req/día|Alertas webhook|Exportación CSV|30 días de historial|25 buques en watchlist",
  "pricing.tier.starter.cta": "Elegir Starter",
  "pricing.tier.pro.name": "Pro",
  "pricing.tier.pro.price": "499 €",
  "pricing.tier.pro.period": "/ mes",
  "pricing.tier.pro.features":
    "Los 51 puertos|API 600 req/min|Precisión ETA detallada + atribución de retrasos|Fusión AIS + SAR Sentinel-1|Detección de flota oscura|Screening OFAC + UK OFSI|Emisiones CO2 por travesía|90 días de historial|250 buques en watchlist",
  "pricing.tier.pro.cta": "Elegir Pro",
  "pricing.tier.enterprise.name": "Enterprise",
  "pricing.tier.enterprise.price": "Bajo presupuesto",
  "pricing.tier.enterprise.period": "",
  "pricing.tier.enterprise.features":
    "Todo Pro +|Conectores Spire / MarineTraffic / Orbcomm|SLA contractual 99,9%|365+ días de historial + backfill|White-label & dedicado|Soporte dedicado",
  "pricing.tier.enterprise.cta": "Contáctanos",
};

const ar: PageMessages = {
  "nav.back": "← رجوع",

  "pricing.title": "الأسعار",
  "pricing.subtitle":
    "AIS متعدد الموانئ · ETA متوقع · دمج SAR · فحص العقوبات · 51 ميناءً استراتيجياً",
  "pricing.note":
    "تعمل المدفوعات فقط عند تعيين STRIPE_SECRET_KEY و STRIPE_PRICE_*. وإلا يُرجع الزر خطأ 503.",
  "pricing.note.label": "ملاحظة تقنية:",
  "pricing.checkout.error": "Stripe Checkout غير متاح",
  "pricing.tier.free.name": "Free",
  "pricing.tier.free.price": "0 €",
  "pricing.tier.free.period": "",
  "pricing.tier.free.features":
    "3 موانئ استراتيجية|لوحة تحكم مباشرة، تاريخ 7 أيام|لا توجد API عامة",
  "pricing.tier.free.cta": "ابدأ",
  "pricing.tier.starter.name": "Starter",
  "pricing.tier.starter.price": "99 €",
  "pricing.tier.starter.period": "/ شهر",
  "pricing.tier.starter.features":
    "15 ميناء|API عامة 5 آلاف طلب/يوم|تنبيهات webhook|تصدير CSV|تاريخ 30 يوماً|25 سفينة في قائمة المراقبة",
  "pricing.tier.starter.cta": "اختر Starter",
  "pricing.tier.pro.name": "Pro",
  "pricing.tier.pro.price": "499 €",
  "pricing.tier.pro.period": "/ شهر",
  "pricing.tier.pro.features":
    "جميع الموانئ الـ 51|API 600 طلب/دقيقة|دقة ETA تفصيلية + توزيع التأخيرات|دمج AIS + SAR Sentinel-1|كشف الأسطول المظلم|فحص عقوبات OFAC + UK OFSI|انبعاثات CO2 لكل رحلة|تاريخ 90 يوماً|250 سفينة في قائمة المراقبة",
  "pricing.tier.pro.cta": "اختر Pro",
  "pricing.tier.enterprise.name": "Enterprise",
  "pricing.tier.enterprise.price": "حسب الطلب",
  "pricing.tier.enterprise.period": "",
  "pricing.tier.enterprise.features":
    "كل ما في Pro +|موصلات Spire / MarineTraffic / Orbcomm|SLA تعاقدي 99.9%|تاريخ 365+ يوم + استرجاع|White-label ومخصص|دعم مخصص",
  "pricing.tier.enterprise.cta": "اتصل بنا",
};

const zh: PageMessages = {
  "nav.back": "← 返回",

  "pricing.title": "价格",
  "pricing.subtitle":
    "多港口 AIS · ETA 预测 · SAR 融合 · 制裁筛查 · 51 个战略港口",
  "pricing.note":
    "只有在设置了 STRIPE_SECRET_KEY 和 STRIPE_PRICE_* 时,付款才会运行。否则按钮返回 503 错误。",
  "pricing.note.label": "技术说明:",
  "pricing.checkout.error": "Stripe Checkout 不可用",
  "pricing.tier.free.name": "Free",
  "pricing.tier.free.price": "€0",
  "pricing.tier.free.period": "",
  "pricing.tier.free.features":
    "3 个战略港口|实时仪表板,7 天历史|无公共 API",
  "pricing.tier.free.cta": "开始",
  "pricing.tier.starter.name": "Starter",
  "pricing.tier.starter.price": "€99",
  "pricing.tier.starter.period": "/ 月",
  "pricing.tier.starter.features":
    "15 个港口|公共 API 5k 次/天|Webhook 警报|CSV 导出|30 天历史|25 艘船监视列表",
  "pricing.tier.starter.cta": "选择 Starter",
  "pricing.tier.pro.name": "Pro",
  "pricing.tier.pro.price": "€499",
  "pricing.tier.pro.period": "/ 月",
  "pricing.tier.pro.features":
    "全部 51 个港口|API 600 次/分|详细 ETA 精度 + 延误归因|AIS + SAR Sentinel-1 融合|暗船队检测|OFAC + UK OFSI 制裁筛查|每次航行 CO2 排放|90 天历史|250 艘船监视列表",
  "pricing.tier.pro.cta": "选择 Pro",
  "pricing.tier.enterprise.name": "Enterprise",
  "pricing.tier.enterprise.price": "按需报价",
  "pricing.tier.enterprise.period": "",
  "pricing.tier.enterprise.features":
    "Pro 全部内容 +|Spire / MarineTraffic / Orbcomm 连接器|99.9% 合同 SLA|365+ 天历史 + 回填|White-label 与专属|专属支持",
  "pricing.tier.enterprise.cta": "联系我们",
};

const ja: PageMessages = {
  "nav.back": "← 戻る",

  "pricing.title": "料金",
  "pricing.subtitle":
    "マルチポート AIS · 予測 ETA · SAR 融合 · 制裁スクリーニング · 51 戦略港",
  "pricing.note":
    "STRIPE_SECRET_KEY と STRIPE_PRICE_* が設定されている場合のみ支払いが機能します。それ以外の場合、ボタンは 503 エラーを返します。",
  "pricing.note.label": "技術メモ:",
  "pricing.checkout.error": "Stripe Checkout 利用不可",
  "pricing.tier.free.name": "Free",
  "pricing.tier.free.price": "€0",
  "pricing.tier.free.period": "",
  "pricing.tier.free.features":
    "3 つの戦略港|ライブダッシュボード、7 日履歴|公開 API なし",
  "pricing.tier.free.cta": "始める",
  "pricing.tier.starter.name": "Starter",
  "pricing.tier.starter.price": "€99",
  "pricing.tier.starter.period": "/ 月",
  "pricing.tier.starter.features":
    "15 港|公開 API 5k リクエスト/日|Webhook アラート|CSV エクスポート|30 日履歴|ウォッチリストに 25 隻",
  "pricing.tier.starter.cta": "Starter を選択",
  "pricing.tier.pro.name": "Pro",
  "pricing.tier.pro.price": "€499",
  "pricing.tier.pro.period": "/ 月",
  "pricing.tier.pro.features":
    "全 51 港|API 600 リクエスト/分|詳細 ETA 精度 + 遅延要因分析|AIS + SAR Sentinel-1 融合|ダークフリート検出|OFAC + UK OFSI 制裁スクリーニング|航海ごとの CO2 排出量|90 日履歴|ウォッチリストに 250 隻",
  "pricing.tier.pro.cta": "Pro を選択",
  "pricing.tier.enterprise.name": "Enterprise",
  "pricing.tier.enterprise.price": "お問い合わせ",
  "pricing.tier.enterprise.period": "",
  "pricing.tier.enterprise.features":
    "Pro のすべて +|Spire / MarineTraffic / Orbcomm コネクタ|99.9% 契約 SLA|365+ 日履歴 + バックフィル|ホワイトラベル & 専用|専用サポート",
  "pricing.tier.enterprise.cta": "お問い合わせ",
};

export const PAGE_MESSAGES: Record<Locale, PageMessages> = {
  fr,
  en,
  nl,
  de,
  es,
  ar,
  zh,
  ja,
};

export function tp(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>,
): string {
  const dict = PAGE_MESSAGES[locale] ?? PAGE_MESSAGES.en;
  let value = dict[key] ?? PAGE_MESSAGES.en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      value = value.replace(`{${k}}`, String(v));
    }
  }
  return value;
}

export function tpList(locale: Locale, key: string): string[] {
  return tp(locale, key).split("|");
}
