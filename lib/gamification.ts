export interface GamificationLevel {
    name: 'Bronce' | 'Plata' | 'Oro' | 'Diamante';
    min: number;
    max: number;
    icon: string;
    color: string;
    bg: string;
    borderColor: string;
    badgeText: string;
}

export const GAMIFICATION_LEVELS: GamificationLevel[] = [
    { name: 'Bronce', min: 0, max: 1499, icon: 'military_tech', color: 'text-amber-600', bg: 'bg-amber-600/10', borderColor: 'border-amber-600/20', badgeText: 'Vendedor Bronce' },
    { name: 'Plata', min: 1500, max: 4999, icon: 'military_tech', color: 'text-slate-400', bg: 'bg-slate-400/10', borderColor: 'border-slate-400/20', badgeText: 'Vendedor Plata' },
    { name: 'Oro', min: 5000, max: 14999, icon: 'workspace_premium', color: 'text-yellow-400', bg: 'bg-yellow-400/10', borderColor: 'border-yellow-400/20', badgeText: 'Vendedor Oro' },
    { name: 'Diamante', min: 15000, max: Infinity, icon: 'diamond', color: 'text-cyan-400', bg: 'bg-cyan-400/10', borderColor: 'border-cyan-400/20', badgeText: 'Vendedor Diamante' }
];

export const getGamificationLevel = (xp: number): GamificationLevel => {
    return GAMIFICATION_LEVELS.find(l => xp >= l.min && xp <= l.max) || GAMIFICATION_LEVELS[0];
};

export const getNextGamificationLevel = (xp: number): { nextLevel: GamificationLevel | null; xpNeeded: number; progress: number } => {
    const current = getGamificationLevel(xp);
    const currentIndex = GAMIFICATION_LEVELS.findIndex(l => l.name === current.name);
    
    if (currentIndex >= GAMIFICATION_LEVELS.length - 1) {
        return { nextLevel: null, xpNeeded: 0, progress: 100 };
    }
    
    const nextLevel = GAMIFICATION_LEVELS[currentIndex + 1];
    const xpNeeded = nextLevel.min - xp;
    const range = current.max - current.min + 1;
    const progress = Math.min(100, Math.max(0, ((xp - current.min) / range) * 100));
    
    return { nextLevel, xpNeeded, progress };
};

export interface Quest {
    id: string;
    title: string;
    description: string;
    xp: number;
    icon: string;
    actionTab?: string;
    actionText?: string;
}

export const QUESTS: Quest[] = [
    {
        id: 'dni',
        title: 'Verificar Identidad (DNI)',
        description: 'Obligatorio para nivel Plata. Verifica tu cuenta al 100%.',
        xp: 500,
        icon: 'badge',
        actionTab: 'safety',
        actionText: 'Ir a Seguridad'
    },
    {
        id: 'cbu',
        title: 'Vincular Cuenta de Cobro',
        description: 'Obligatorio para nivel Oro. Agrega CBU, CVU o Mercado Pago.',
        xp: 50,
        icon: 'account_balance',
        actionTab: 'billing',
        actionText: 'Ir a Facturación'
    },
    {
        id: 'sale',
        title: 'Completar una Venta Exitosa',
        description: 'Por cada venta entregada sin reclamos ni disputas.',
        xp: 25,
        icon: 'sell'
    },
    {
        id: 'review',
        title: 'Recibir recomendación (5★)',
        description: 'Por cada recomendación positiva de tus compradores.',
        xp: 5,
        icon: 'thumb_up'
    }
];
