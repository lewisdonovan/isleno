import { cookies } from 'next/headers';

export type Locale = 'en' | 'es';

export async function getLocaleFromCookies(): Promise<Locale> {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('locale');
  
  if (localeCookie?.value && (localeCookie.value === 'en' || localeCookie.value === 'es')) {
    return localeCookie.value as Locale;
  }
  
  return 'en'; // Default to English
}

export function getLocaleFromHeaders(headers: Headers): Locale {
  const acceptLanguage = headers.get('accept-language');
  
  if (acceptLanguage) {
    const languages = acceptLanguage.split(',').map(lang => lang.split(';')[0].trim());
    for (const lang of languages) {
      if (lang.startsWith('es')) {
        return 'es';
      }
    }
  }
  
  return 'en';
}

// Simple translation function for server components
export function t(locale: Locale, namespace: string, key: string): string {
  const messages = {
    en: {
      kpis: {
        dashboard: "KPI Dashboard",
        description: "Monitor and analyze your key performance indicators by department",
        liveKPIs: "Live KPIs",
        liveKPIsDesc: "View real-time KPI data with date range filtering",
        viewLiveKPIs: "View Live KPIs",
        historicalData: "Historical Data",
        historicalDataDesc: "Analyze KPI trends over time with historical data",
        kpiManagement: "KPI Management",
        kpiManagementDesc: "Configure and manage your KPI definitions",
        comingSoon: "Coming Soon",
        departments: "Departments",
        departmentsDesc: "Browse KPIs organized by department",
        viewKPIs: "View KPIs",
        noDepartmentsFound: "No departments found.",
        quickStats: "Quick Stats",
        quickStatsDesc: "Overview of your current KPI performance",
        departmentsCount: "Departments",
        categories: "Categories",
        activeKPIs: "Active KPIs",
        lastUpdated: "Last Updated",
        errorLoadingDepartments: "Error loading departments: {message}"
      },
      gantt: {
        projectTimeline: "Project Timeline",
        timelineDescription: "Visualize project phases and cash flows over time",
        errorLoading: "Error loading timeline data",
        phaseCapacity: "Phase Capacity",
        activeBudget: "Active Budget",
        inActiveProjects: "In active projects",
        netCashFlow: "Net Cash Flow",
        thisMonth: "This month",
        rental: "Rental",
        name: "Name",
        zone: "Zone",
        type: "Type",
        budget: "Budget",
        spent: "Spent",
        progress: "Progress",
        duration: "Duration",
        purchase: "Purchase",
        construction: "Construction",
        sale: "Sale"
      },
      calendar: {
        title: "Cash Flow Calendar",
        description: "Track financial position and operational capacity over time",
        financialCalendar: "Financial Calendar",
        calendarDescription: "Track income and expenses across projects",
        today: "Today",
        month: "Month",
        week: "Week",
        day: "Day",
        next: "Next",
        previous: "Previous",
        noEventsInRange: "No events in this range",
        showMore: "+{total} more",
        date: "Date",
        time: "Time",
        event: "Event",
        agenda: "Agenda",
        errorLoading: "Error loading calendar data",
        pastCosts: "Past Costs",
        upcomingCosts: "Upcoming Costs",
        pastIncome: "Past Income",
        upcomingIncome: "Upcoming Income",
        freeLiquidity: "Free Liquidity",
        estimatedForToday: "Estimated for today",
        phaseSlots: "Phase Slots",
        purchase: "Purchase",
        construction: "Construction",
        sale: "Sale",
        costCoverage: "Cost Coverage",
        fixedCostsCovered: "Fixed costs covered by rental income"
      }
    },
    es: {
      kpis: {
        dashboard: "Dashboard de KPIs",
        description: "Monitorea y analiza tus indicadores clave de rendimiento por departamento",
        liveKPIs: "KPIs en Vivo",
        liveKPIsDesc: "Visualiza datos de KPI en tiempo real con filtrado por rango de fechas",
        viewLiveKPIs: "Ver KPIs en Vivo",
        historicalData: "Datos Históricos",
        historicalDataDesc: "Analiza tendencias de KPI a lo largo del tiempo con datos históricos",
        kpiManagement: "Gestión de KPIs",
        kpiManagementDesc: "Configura y gestiona tus definiciones de KPI",
        comingSoon: "Próximamente",
        departments: "Departamentos",
        departmentsDesc: "Navega por KPIs organizados por departamento",
        viewKPIs: "Ver KPIs",
        noDepartmentsFound: "No se encontraron departamentos.",
        quickStats: "Estadísticas Rápidas",
        quickStatsDesc: "Resumen de tu rendimiento actual de KPI",
        departmentsCount: "Departamentos",
        categories: "Categorías",
        activeKPIs: "KPIs Activos",
        lastUpdated: "Última Actualización",
        errorLoadingDepartments: "Error al cargar departamentos: {message}"
      },
      gantt: {
        projectTimeline: "Cronograma de Proyectos",
        timelineDescription: "Visualiza fases de proyectos y flujos de efectivo a lo largo del tiempo",
        errorLoading: "Error al cargar los datos del cronograma",
        phaseCapacity: "Capacidad de Fases",
        activeBudget: "Presupuesto Activo",
        inActiveProjects: "En proyectos activos",
        netCashFlow: "Flujo de Caja Neto",
        thisMonth: "Este mes",
        rental: "Alquiler",
        name: "Nombre",
        zone: "Zona",
        type: "Tipo",
        budget: "Presupuesto",
        spent: "Gastado",
        progress: "Progreso",
        duration: "Duración",
        purchase: "Compra",
        construction: "Construcción",
        sale: "Venta"
      },
      calendar: {
        title: "Calendario de Caja",
        description: "Visualiza la posición financiera y capacidad operacional a lo largo del tiempo",
        financialCalendar: "Calendario Financiero",
        calendarDescription: "Seguimiento de ingresos y gastos por proyecto",
        today: "Hoy",
        month: "Mes",
        week: "Semana",
        day: "Día",
        next: "Siguiente",
        previous: "Anterior",
        noEventsInRange: "No hay eventos en este rango",
        showMore: "+{total} más",
        date: "Fecha",
        time: "Hora",
        event: "Evento",
        agenda: "Agenda",
        errorLoading: "Error al cargar los datos del calendario",
        pastCosts: "Gastos",
        upcomingCosts: "Próximos Gastos",
        pastIncome: "Ingresos",
        upcomingIncome: "Próximos Ingresos",
        freeLiquidity: "Liquidez Libre",
        estimatedForToday: "Estimado para hoy",
        phaseSlots: "Slots de Fase",
        purchase: "Compra",
        construction: "Construcción",
        sale: "Venta",
        costCoverage: "Cobertura de Costos",
        fixedCostsCovered: "Costos fijos cubiertos por ingresos de alquiler"
      }
    }
  };

  const namespaceData = messages[locale][namespace as keyof typeof messages[typeof locale]];
  if (!namespaceData) {
    return key;
  }

  const translation = namespaceData[key as keyof typeof namespaceData];
  return translation || key;
} 