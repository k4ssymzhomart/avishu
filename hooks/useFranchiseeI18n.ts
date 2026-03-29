import { useMemo } from 'react';

import { franchiseeFlowStages } from '@/lib/utils/franchisee';
import { useFranchiseePreferencesStore, type FranchiseeLanguage } from '@/store/franchiseePreferences';
import type { Order, OrderStatus } from '@/types/order';

type FranchiseeCopy = {
  chat: {
    composerLabel: string;
    composerPlaceholder: string;
    emptyDescription: string;
    emptyTitle: string;
    eyebrow: string;
    noOrderSubtitle: string;
    process: string;
    subtitleFallback: string;
    titleFallback: string;
    titleOrder: string;
  };
  clients: {
    activeRelationships: string;
    activeView: string;
    all: string;
    detailHint: string;
    emptyDescription: string;
    emptyTitle: string;
    eyebrow: string;
    lastMovement: string;
    latestOrder: string;
    nameSort: string;
    overviewHint: string;
    overviewTitle: string;
    phonePending: string;
    recent: string;
    recentClients: string;
    recentSort: string;
    searchPlaceholder: string;
    sortBy: string;
    subtitle: string;
    title: string;
    unread: string;
    unreadSort: string;
    unreadSupport: string;
  };
  common: {
    noResults: string;
    now: string;
    openChat: string;
    openOrder: string;
    pending: string;
    search: string;
    synced: string;
    unreadSuffix: string;
  };
  home: {
    eyebrow: string;
    heroBody: string;
    heroEyebrow: string;
    heroTitle: string;
    incomingDescription: string;
    incomingEmptyDescription: string;
    incomingEmptyTitle: string;
    incomingTitle: string;
    inProduction: string;
    liveFlow: string;
    liveOrders: string;
    planHint: string;
    planProgress: string;
    readyNow: string;
    subtitle: string;
    syncNote: string;
    syncPaused: string;
    todayRevenue: string;
    todayRevenueHint: string;
    unreadChat: string;
    delivered: string;
    newOrders: string;
  };
  nav: {
    clients: string;
    home: string;
    orders: string;
    profile: string;
  };
  orderActions: Record<'accepted' | 'delivered' | 'in_production' | 'out_for_delivery', string>;
  orderCard: {
    acceptedMeta: string;
    boutiquePickup: string;
    chat: string;
    cityCourier: string;
    created: string;
    deliveredMeta: string;
    delivery: string;
    deliveryStartedMeta: string;
    destination: string;
    destinationFallback: string;
    expressCourier: string;
    inProductionMeta: string;
    inStock: string;
    newIntake: string;
    orderType: string;
    placedMeta: string;
    preorder: string;
    preferredReady: string;
    pickupCounter: string;
    readyMeta: string;
    synced: string;
    targetDate: string;
  };
  orders: {
    actionColumn: string;
    all: string;
    compactHint: string;
    eyebrow: string;
    filterHint: string;
    liveIntake: string;
    liveIntakeHint: string;
    noOrdersDescription: string;
    noOrdersTitle: string;
    pipelineHint: string;
    pipelineValue: string;
    productColumn: string;
    readyHandoff: string;
    readyHandoffHint: string;
    routeColumn: string;
    scheduleColumn: string;
    statusColumn: string;
    subtitle: string;
    support: string;
    supportColumn: string;
    supportHint: string;
    syncNote: string;
    syncError: string;
    title: string;
  };
  profile: {
    address: string;
    branch: string;
    branchIdentity: string;
    contact: string;
    eyebrow: string;
    heroBody: string;
    language: string;
    liveOrders: string;
    notifications: string;
    notificationsValue: string;
    openOrders: string;
    preferredLanguage: string;
    profile: string;
    profileNodePrimary: string;
    profileNodeSecondary: string;
    readyHandoff: string;
    readyWaiting: string;
    security: string;
    securityValue: string;
    settings: string;
    settingsTitle: string;
    signOut: string;
    staff: string;
    staffValue: string;
    storeType: string;
    storeTypeValue: string;
    subtitle: string;
    switchWorkspace: string;
    unreadChat: string;
    workspace: string;
    workspaceValue: string;
  };
  status: Record<OrderStatus, string> & { all: string };
};

const franchiseeCopy: Record<FranchiseeLanguage, FranchiseeCopy> = {
  en: {
    chat: {
      composerLabel: 'Reply',
      composerPlaceholder: 'Write a boutique update',
      emptyDescription: 'This thread is ready for the first boutique message. Delivery and pickup updates appear here live.',
      emptyTitle: 'No messages yet',
      eyebrow: 'AVISHU / CLIENT CHAT',
      noOrderSubtitle: 'Order-scoped support thread',
      process: 'Process',
      subtitleFallback: 'Client thread',
      titleFallback: 'Client thread',
      titleOrder: 'Order',
    },
    clients: {
      activeRelationships: 'Active relationships',
      activeView: 'Active',
      all: 'All',
      detailHint: 'Open a client from the overview to inspect the live relationship.',
      emptyDescription: 'As soon as customers place orders, the boutique will see them here with live support context.',
      emptyTitle: 'No client relationships yet',
      eyebrow: 'AVISHU / CLIENTS',
      lastMovement: 'Last movement',
      latestOrder: 'Latest order',
      nameSort: 'Name',
      overviewHint: 'Search, sort, and move through clients without losing the premium overview.',
      overviewTitle: 'Client overview',
      phonePending: 'Phone syncing',
      recent: 'Recent',
      recentClients: 'Recent clients',
      recentSort: 'Recent',
      searchPlaceholder: 'Search by client, product, or phone',
      sortBy: 'Sort',
      subtitle: 'Live client relationships.',
      title: 'Client relationships',
      unread: 'Unread',
      unreadSort: 'Unread',
      unreadSupport: 'Unread support',
    },
    common: {
      noResults: 'No matches',
      now: 'Now',
      openChat: 'Open chat',
      openOrder: 'Open order',
      pending: 'Pending',
      search: 'Search',
      synced: 'Synced',
      unreadSuffix: 'unread',
    },
    home: {
      delivered: 'Delivered',
      eyebrow: 'AVISHU / HOME',
      heroBody: 'Accept. Hand off. Release. Deliver.',
      heroEyebrow: 'Live boutique node',
      heroTitle: 'Business in your pocket',
      incomingDescription: 'Priority intake',
      incomingEmptyDescription: 'The next client checkout appears here instantly.',
      incomingEmptyTitle: 'No incoming orders',
      incomingTitle: 'Incoming now',
      inProduction: 'In production',
      liveFlow: 'Live flow',
      liveOrders: 'Live orders',
      planHint: 'Plan target',
      planProgress: 'Plan progress',
      readyNow: 'Ready now',
      subtitle: 'Realtime boutique operations.',
      syncNote: 'Sync note',
      syncPaused: 'Live sync paused. Try again.',
      todayRevenue: "Today's revenue",
      todayRevenueHint: 'Ready, delivery, completed',
      unreadChat: 'Unread chat',
      newOrders: 'New orders',
    },
    nav: {
      clients: 'CLIENTS',
      home: 'HOME',
      orders: 'ORDERS',
      profile: 'PROFILE',
    },
    orderActions: {
      accepted: 'Accept order',
      delivered: 'Mark delivered',
      in_production: 'Send to production',
      out_for_delivery: 'Send to delivery',
    },
    orderCard: {
      acceptedMeta: 'Accepted',
      boutiquePickup: 'Boutique pickup',
      chat: 'Order chat',
      cityCourier: 'City courier',
      created: 'Created',
      deliveredMeta: 'Delivered',
      delivery: 'Delivery',
      deliveryStartedMeta: 'Delivery started',
      destination: 'Destination',
      destinationFallback: 'Delivery details will be confirmed in chat',
      expressCourier: 'Express courier',
      inProductionMeta: 'In production',
      inStock: 'In stock',
      newIntake: 'New intake',
      orderType: 'Order type',
      placedMeta: 'Placed',
      preorder: 'Preorder',
      preferredReady: 'Preferred ready',
      pickupCounter: 'Pickup at the boutique counter',
      readyMeta: 'Ready',
      synced: 'Synced',
      targetDate: 'Target date',
    },
    orders: {
      actionColumn: 'Action',
      all: 'All',
      compactHint: 'Compact control surface for intake, production, delivery, and completion.',
      eyebrow: 'AVISHU / LIVE ORDERS',
      filterHint: 'Filter the live flow instantly by status.',
      liveIntake: 'Live intake',
      liveIntakeHint: 'Fresh orders waiting.',
      noOrdersDescription: 'Switch the status filter or wait for the next live intake.',
      noOrdersTitle: 'No orders in this view',
      pipelineHint: 'Customer checkout appears here immediately.',
      pipelineValue: 'Pipeline value',
      productColumn: 'Order',
      readyHandoff: 'Ready handoff',
      readyHandoffHint: 'Completed pieces waiting.',
      routeColumn: 'Delivery',
      scheduleColumn: 'Timing',
      statusColumn: 'Status',
      subtitle: 'Realtime order workflow.',
      support: 'Support',
      supportColumn: 'Chat',
      supportHint: 'Unread client messages.',
      syncError: 'Status update did not reach the shared flow. Check connectivity and retry.',
      syncNote: 'Sync note',
      title: 'Boutique workflow',
    },
    profile: {
      address: 'Address',
      branch: 'Branch',
      branchIdentity: 'Branch identity',
      contact: 'Contact',
      eyebrow: 'AVISHU / PROFILE',
      heroBody: 'Branch profile, language, and session controls.',
      language: 'Language',
      liveOrders: 'Live orders',
      notifications: 'Notifications',
      notificationsValue: 'Realtime intake and handoff alerts active',
      openOrders: 'Open live orders',
      preferredLanguage: 'Preferred language',
      profile: 'Franchisee role',
      profileNodePrimary: 'Astana flagship node',
      profileNodeSecondary: 'Primary boutique node',
      readyHandoff: 'Ready handoff',
      readyWaiting: 'waiting',
      security: 'Security',
      securityValue: 'Shared AVISHU role session',
      settings: 'Settings',
      settingsTitle: 'Workspace settings',
      signOut: 'Sign out',
      staff: 'Staff',
      staffValue: 'Store manager and boutique desk placeholders',
      storeType: 'Store type',
      storeTypeValue: 'Premium fashion franchise',
      subtitle: 'Branch identity and session controls.',
      switchWorkspace: 'Switch workspace',
      unreadChat: 'Unread chat',
      workspace: 'Workspace',
      workspaceValue: 'Role switch kept for walkthroughs',
    },
    status: {
      accepted: 'Accepted',
      all: 'All',
      cancelled: 'Cancelled',
      delivered: 'Delivered',
      in_production: 'In production',
      out_for_delivery: 'Out for delivery',
      placed: 'Placed',
      ready: 'Ready',
    },
  },
  ru: {
    chat: {
      composerLabel: 'Ответ',
      composerPlaceholder: 'Напишите обновление для клиента',
      emptyDescription: 'Этот диалог готов к первому сообщению бутика. Обновления по доставке и выдаче появляются здесь вживую.',
      emptyTitle: 'Сообщений пока нет',
      eyebrow: 'AVISHU / ЧАТ С КЛИЕНТОМ',
      noOrderSubtitle: 'Чат по заказу',
      process: 'Процесс',
      subtitleFallback: 'Клиентский чат',
      titleFallback: 'Клиентский чат',
      titleOrder: 'Заказ',
    },
    clients: {
      activeRelationships: 'Активные связи',
      activeView: 'Активные',
      all: 'Все',
      detailHint: 'Откройте клиента из обзора, чтобы увидеть живую карточку отношений.',
      emptyDescription: 'Как только клиенты начинают оформлять заказы, бутик видит их здесь вместе с поддержкой и контекстом заказа.',
      emptyTitle: 'Клиентских связей пока нет',
      eyebrow: 'AVISHU / КЛИЕНТЫ',
      lastMovement: 'Последнее движение',
      latestOrder: 'Последний заказ',
      nameSort: 'Имя',
      overviewHint: 'Поиск, сортировка и быстрый переход по клиентам без потери премиального ритма.',
      overviewTitle: 'Обзор клиентов',
      phonePending: 'Телефон синхронизируется',
      recent: 'Недавние',
      recentClients: 'Недавние клиенты',
      recentSort: 'Недавние',
      searchPlaceholder: 'Поиск по клиенту, товару или телефону',
      sortBy: 'Сортировка',
      subtitle: 'Живые отношения с клиентами.',
      title: 'Клиентские отношения',
      unread: 'Непрочитанные',
      unreadSort: 'Непрочит.',
      unreadSupport: 'Непрочитанная поддержка',
    },
    common: {
      noResults: 'Совпадений нет',
      now: 'Сейчас',
      openChat: 'Открыть чат',
      openOrder: 'Открыть заказ',
      pending: 'Ожидается',
      search: 'Поиск',
      synced: 'Синхронно',
      unreadSuffix: 'непрочит.',
    },
    home: {
      delivered: 'Доставлено',
      eyebrow: 'AVISHU / ГЛАВНАЯ',
      heroBody: 'Принять. Передать. Выпустить. Доставить.',
      heroEyebrow: 'Живой узел бутика',
      heroTitle: 'Бизнес у вас в кармане',
      incomingDescription: 'Приоритетный входящий поток',
      incomingEmptyDescription: 'Следующий клиентский чек-аут появится здесь сразу.',
      incomingEmptyTitle: 'Новых заказов нет',
      incomingTitle: 'Входящие сейчас',
      inProduction: 'В производстве',
      liveFlow: 'Живой поток',
      liveOrders: 'Живые заказы',
      planHint: 'Цель плана',
      planProgress: 'Прогресс плана',
      readyNow: 'Готово сейчас',
      subtitle: 'Операции бутика в реальном времени.',
      syncNote: 'Заметка синхронизации',
      syncPaused: 'Живая синхронизация приостановлена. Повторите ещё раз.',
      todayRevenue: 'Выручка сегодня',
      todayRevenueHint: 'Готово, доставка, завершено',
      unreadChat: 'Непрочитанный чат',
      newOrders: 'Новые заказы',
    },
    nav: {
      clients: 'КЛИЕНТЫ',
      home: 'ГЛАВНАЯ',
      orders: 'ЗАКАЗЫ',
      profile: 'ПРОФИЛЬ',
    },
    orderActions: {
      accepted: 'Принять заказ',
      delivered: 'Отметить доставленным',
      in_production: 'Передать в производство',
      out_for_delivery: 'Передать в доставку',
    },
    orderCard: {
      acceptedMeta: 'Принят',
      boutiquePickup: 'Самовывоз из бутика',
      chat: 'Чат заказа',
      cityCourier: 'Городской курьер',
      created: 'Создан',
      deliveredMeta: 'Доставлен',
      delivery: 'Доставка',
      deliveryStartedMeta: 'Доставка началась',
      destination: 'Адрес',
      destinationFallback: 'Детали доставки будут подтверждены в чате',
      expressCourier: 'Экспресс-курьер',
      inProductionMeta: 'В производстве',
      inStock: 'В наличии',
      newIntake: 'Новый заказ',
      orderType: 'Тип заказа',
      placedMeta: 'Размещён',
      preorder: 'Предзаказ',
      preferredReady: 'Желаемая готовность',
      pickupCounter: 'Самовывоз на стойке бутика',
      readyMeta: 'Готов',
      synced: 'Синхронно',
      targetDate: 'Целевая дата',
    },
    orders: {
      actionColumn: 'Действие',
      all: 'Все',
      compactHint: 'Компактный контур для приёма, производства, доставки и завершения заказа.',
      eyebrow: 'AVISHU / ЖИВЫЕ ЗАКАЗЫ',
      filterHint: 'Моментально фильтруйте поток по статусу.',
      liveIntake: 'Новый поток',
      liveIntakeHint: 'Свежие заказы ждут.',
      noOrdersDescription: 'Смените фильтр статуса или дождитесь следующего входящего заказа.',
      noOrdersTitle: 'В этом режиме заказов нет',
      pipelineHint: 'Новый клиентский чек-аут появляется здесь сразу.',
      pipelineValue: 'Стоимость потока',
      productColumn: 'Заказ',
      readyHandoff: 'Готово к передаче',
      readyHandoffHint: 'Готовые изделия ожидают.',
      routeColumn: 'Доставка',
      scheduleColumn: 'Срок',
      statusColumn: 'Статус',
      subtitle: 'Поток заказов в реальном времени.',
      support: 'Поддержка',
      supportColumn: 'Чат',
      supportHint: 'Непрочитанные сообщения клиентов.',
      syncError: 'Обновление статуса не дошло до общего потока. Проверьте соединение и повторите.',
      syncNote: 'Заметка синхронизации',
      title: 'Поток бутика',
    },
    profile: {
      address: 'Адрес',
      branch: 'Филиал',
      branchIdentity: 'Идентичность филиала',
      contact: 'Контакт',
      eyebrow: 'AVISHU / ПРОФИЛЬ',
      heroBody: 'Профиль филиала, язык и управление сессией.',
      language: 'Язык',
      liveOrders: 'Живые заказы',
      notifications: 'Уведомления',
      notificationsValue: 'Оповещения о приёме и передаче активны',
      openOrders: 'Открыть заказы',
      preferredLanguage: 'Предпочитаемый язык',
      profile: 'Роль франчайзи',
      profileNodePrimary: 'Флагманский узел Астаны',
      profileNodeSecondary: 'Основной узел бутика',
      readyHandoff: 'Готово к передаче',
      readyWaiting: 'в ожидании',
      security: 'Безопасность',
      securityValue: 'Общая ролевая сессия AVISHU',
      settings: 'Настройки',
      settingsTitle: 'Настройки рабочего пространства',
      signOut: 'Выйти',
      staff: 'Команда',
      staffValue: 'Менеджер магазина и стойка бутика',
      storeType: 'Тип магазина',
      storeTypeValue: 'Премиальная fashion-франшиза',
      subtitle: 'Идентичность филиала и управление сессией.',
      switchWorkspace: 'Сменить пространство',
      unreadChat: 'Непрочитанный чат',
      workspace: 'Пространство',
      workspaceValue: 'Переключение ролей оставлено для демо',
    },
    status: {
      accepted: 'Принят',
      all: 'Все',
      cancelled: 'Отменён',
      delivered: 'Доставлен',
      in_production: 'В производстве',
      out_for_delivery: 'В доставке',
      placed: 'Размещён',
      ready: 'Готов',
    },
  },
};

function formatDateValue(language: FranchiseeLanguage, value?: string | null, withYear?: boolean) {
  if (!value) {
    return language === 'ru' ? 'Дата не выбрана' : 'No date selected';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(language === 'ru' ? 'ru-RU' : 'en-US', {
    day: '2-digit',
    month: 'long',
    ...(withYear ? { year: 'numeric' as const } : null),
  }).format(date);
}

function formatRelativeValue(language: FranchiseeLanguage, value?: string | null) {
  if (!value) {
    return language === 'ru' ? 'Сейчас' : 'Just now';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return language === 'ru' ? 'Сейчас' : 'Just now';
  }

  const minutes = Math.round((Date.now() - date.getTime()) / 60000);

  if (minutes <= 1) {
    return language === 'ru' ? 'Сейчас' : 'Just now';
  }

  if (minutes < 60) {
    return language === 'ru' ? `${minutes} мин назад` : `${minutes}m ago`;
  }

  const hours = Math.round(minutes / 60);

  if (hours < 24) {
    return language === 'ru' ? `${hours} ч назад` : `${hours}h ago`;
  }

  const days = Math.round(hours / 24);

  if (days < 7) {
    return language === 'ru' ? `${days} д назад` : `${days}d ago`;
  }

  return formatDateValue(language, value, true);
}

export function useFranchiseeI18n() {
  const language = useFranchiseePreferencesStore((state) => state.language);
  const setLanguage = useFranchiseePreferencesStore((state) => state.setLanguage);

  const copy = useMemo(() => franchiseeCopy[language], [language]);

  return {
    copy,
    formatDateLabel: (value?: string | null, withYear = false) => formatDateValue(language, value, withYear),
    formatRelativeLabel: (value?: string | null) => formatRelativeValue(language, value),
    getActionLabel: (status: OrderStatus) => {
      if (status === 'placed') {
        return copy.orderActions.accepted;
      }

      if (status === 'accepted') {
        return copy.orderActions.in_production;
      }

      if (status === 'ready') {
        return copy.orderActions.out_for_delivery;
      }

      if (status === 'out_for_delivery') {
        return copy.orderActions.delivered;
      }

      return null;
    },
    getDeliveryLabel: (order: Order) => {
      if (order.delivery.method === 'boutique_pickup') {
        return copy.orderCard.boutiquePickup;
      }

      if (order.delivery.method === 'express_courier') {
        return copy.orderCard.expressCourier;
      }

      return copy.orderCard.cityCourier;
    },
    getDestinationSnippet: (order: Order) => {
      if (order.delivery.address?.trim().length) {
        return order.delivery.address.trim();
      }

      if (order.delivery.method === 'boutique_pickup') {
        return copy.orderCard.pickupCounter;
      }

      return copy.orderCard.destinationFallback;
    },
    getOrderTypeLabel: (order: Order) => (order.type === 'preorder' ? copy.orderCard.preorder : copy.orderCard.inStock),
    getProcessSteps: (order: Order) =>
      franchiseeFlowStages.map((stage) => {
        const timestamp =
          stage.status === 'placed'
            ? order.timeline.placedAt
            : stage.status === 'accepted'
              ? order.timeline.acceptedAt
              : stage.status === 'in_production'
                ? order.timeline.inProductionAt
                : stage.status === 'ready'
                  ? order.timeline.readyAt
                  : stage.status === 'out_for_delivery'
                    ? order.timeline.outForDeliveryAt
                    : order.timeline.deliveredAt;

        return {
          isComplete: Boolean(timestamp),
          isCurrent: order.status === stage.status,
          label: copy.status[stage.status],
          status: stage.status,
          timestamp,
        };
      }),
    getStageMeta: (order: Order) => {
      if (order.status === 'placed') {
        return `${copy.orderCard.placedMeta} ${formatRelativeValue(language, order.timeline.placedAt)}`;
      }

      if (order.status === 'accepted') {
        return `${copy.orderCard.acceptedMeta} ${formatRelativeValue(language, order.timeline.acceptedAt ?? order.updatedAt)}`;
      }

      if (order.status === 'in_production') {
        return `${copy.orderCard.inProductionMeta} ${formatRelativeValue(language, order.timeline.inProductionAt ?? order.updatedAt)}`;
      }

      if (order.status === 'ready') {
        return `${copy.orderCard.readyMeta} ${formatRelativeValue(language, order.timeline.readyAt ?? order.updatedAt)}`;
      }

      if (order.status === 'out_for_delivery') {
        return `${copy.orderCard.deliveryStartedMeta} ${formatRelativeValue(language, order.timeline.outForDeliveryAt ?? order.updatedAt)}`;
      }

      return `${copy.orderCard.deliveredMeta} ${formatRelativeValue(language, order.timeline.deliveredAt ?? order.updatedAt)}`;
    },
    getStatusLabel: (status: OrderStatus) => copy.status[status],
    getTimingLabel: (order: Order) => {
      if (order.preferredReadyDate) {
        return {
          label: order.type === 'preorder' ? copy.orderCard.preferredReady : copy.orderCard.targetDate,
          value: formatDateValue(language, order.preferredReadyDate, true),
        };
      }

      return {
        label: copy.orderCard.created,
        value: formatRelativeValue(language, order.createdAt),
      };
    },
    language,
    setLanguage,
  };
}
