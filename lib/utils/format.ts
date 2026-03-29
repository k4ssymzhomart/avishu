import type { ProductAvailability } from '@/types/product';
import type { DeliveryMethod, OrderStatus, OrderType } from '@/types/order';
import type { UserRole } from '@/types/user';

type SupportedLanguage = 'en' | 'ru';

const localeByLanguage: Record<SupportedLanguage, string> = {
  en: 'en-US',
  ru: 'ru-RU',
};

const orderStatusLabels: Record<SupportedLanguage, Record<OrderStatus, string>> = {
  en: {
    accepted: 'Accepted',
    cancelled: 'Cancelled',
    delivered: 'Delivered',
    in_production: 'In production',
    out_for_delivery: 'Out for delivery',
    placed: 'Placed',
    ready: 'Ready',
  },
  ru: {
    accepted: 'Принят',
    cancelled: 'Отменен',
    delivered: 'Доставлен',
    in_production: 'В производстве',
    out_for_delivery: 'В доставке',
    placed: 'Размещен',
    ready: 'Готов',
  },
};

const customerStageLabels: Record<SupportedLanguage, Record<OrderStatus, string>> = {
  en: {
    accepted: 'Accepted',
    cancelled: 'Cancelled',
    delivered: 'Delivered',
    in_production: 'In production',
    out_for_delivery: 'Delivery',
    placed: 'Placed',
    ready: 'Ready',
  },
  ru: {
    accepted: 'Принят',
    cancelled: 'Отменен',
    delivered: 'Доставлен',
    in_production: 'Производство',
    out_for_delivery: 'Доставка',
    placed: 'Размещен',
    ready: 'Готов',
  },
};

const orderTypeLabels: Record<SupportedLanguage, Record<OrderType, string>> = {
  en: {
    preorder: 'Preorder',
    purchase: 'Purchase',
  },
  ru: {
    preorder: 'Предзаказ',
    purchase: 'Покупка',
  },
};

const availabilityLabels: Record<SupportedLanguage, Record<ProductAvailability, string>> = {
  en: {
    in_stock: 'In stock',
    preorder: 'Preorder',
  },
  ru: {
    in_stock: 'В наличии',
    preorder: 'Предзаказ',
  },
};

const deliveryMethodLabels: Record<SupportedLanguage, Record<DeliveryMethod, string>> = {
  en: {
    boutique_pickup: 'Boutique pickup',
    city_courier: 'City courier',
    express_courier: 'Express courier',
  },
  ru: {
    boutique_pickup: 'Самовывоз из бутика',
    city_courier: 'Городской курьер',
    express_courier: 'Экспресс-курьер',
  },
};

const relativeTimeLabels: Record<
  SupportedLanguage,
  { agoDay: string; agoHour: string; agoMinute: string; justNow: string; noDate: string }
> = {
  en: {
    agoDay: 'd ago',
    agoHour: 'h ago',
    agoMinute: 'm ago',
    justNow: 'Just now',
    noDate: 'No date selected',
  },
  ru: {
    agoDay: 'д назад',
    agoHour: 'ч назад',
    agoMinute: 'мин назад',
    justNow: 'Сейчас',
    noDate: 'Дата не выбрана',
  },
};

function resolveLanguage(language?: SupportedLanguage) {
  return language === 'ru' ? 'ru' : 'en';
}

function getLocale(language?: SupportedLanguage) {
  return localeByLanguage[resolveLanguage(language)];
}

function parseDateValue(value: string) {
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  return new Date(value);
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('ru-KZ', {
    currency: 'KZT',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(amount);
}

export function formatOrderStatus(status: OrderStatus, language: SupportedLanguage = 'en') {
  return orderStatusLabels[resolveLanguage(language)][status];
}

export function formatCustomerStage(status: OrderStatus, language: SupportedLanguage = 'en') {
  return customerStageLabels[resolveLanguage(language)][status];
}

export function formatOrderType(type: OrderType, language: SupportedLanguage = 'en') {
  return orderTypeLabels[resolveLanguage(language)][type];
}

export function formatAvailability(availability: ProductAvailability, language: SupportedLanguage = 'en') {
  return availabilityLabels[resolveLanguage(language)][availability];
}

export function formatDeliveryMethod(method: DeliveryMethod, language: SupportedLanguage = 'en') {
  return deliveryMethodLabels[resolveLanguage(language)][method];
}

export function formatRole(role: UserRole) {
  return role.toUpperCase();
}

export function formatDateLabel(
  value?: string | null,
  options?: { language?: SupportedLanguage; withYear?: boolean },
) {
  const language = resolveLanguage(options?.language);

  if (!value) {
    return relativeTimeLabels[language].noDate;
  }

  const date = parseDateValue(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(getLocale(language), {
    day: '2-digit',
    month: 'long',
    ...(options?.withYear ? { year: 'numeric' } : null),
  }).format(date);
}

export function formatRelativeTime(value: string, language: SupportedLanguage = 'en') {
  const resolvedLanguage = resolveLanguage(language);
  const date = parseDateValue(value);

  if (Number.isNaN(date.getTime())) {
    return relativeTimeLabels[resolvedLanguage].justNow;
  }

  const minutes = Math.round((Date.now() - date.getTime()) / 60000);

  if (minutes <= 1) {
    return relativeTimeLabels[resolvedLanguage].justNow;
  }

  if (minutes < 60) {
    return resolvedLanguage === 'ru'
      ? `${minutes} ${relativeTimeLabels[resolvedLanguage].agoMinute}`
      : `${minutes}${relativeTimeLabels[resolvedLanguage].agoMinute}`;
  }

  const hours = Math.round(minutes / 60);

  if (hours < 24) {
    return resolvedLanguage === 'ru'
      ? `${hours} ${relativeTimeLabels[resolvedLanguage].agoHour}`
      : `${hours}${relativeTimeLabels[resolvedLanguage].agoHour}`;
  }

  const days = Math.round(hours / 24);

  if (days < 7) {
    return resolvedLanguage === 'ru'
      ? `${days} ${relativeTimeLabels[resolvedLanguage].agoDay}`
      : `${days}${relativeTimeLabels[resolvedLanguage].agoDay}`;
  }

  return formatDateLabel(value, { language: resolvedLanguage, withYear: true });
}

export function formatChatTimestamp(value: string, language: SupportedLanguage = 'en') {
  const resolvedLanguage = resolveLanguage(language);
  const date = parseDateValue(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const now = new Date();
  const isSameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isSameDay) {
    return new Intl.DateTimeFormat(getLocale(resolvedLanguage), {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  return new Intl.DateTimeFormat(getLocale(resolvedLanguage), {
    day: '2-digit',
    month: 'short',
  }).format(date);
}
