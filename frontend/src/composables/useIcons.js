import { ref, computed } from 'vue'
import { systemIcons, iconCategories, getIconsByCategory, searchIcons, getIconByName } from '@/assets/icons'
import { 
  Plus, Minus, Edit, Trash2, Save, X, Check, ChevronLeft, ChevronRight,
  Search, Filter, Settings, User, Users, Home, Calendar, Clock,
  AlertTriangle, CheckCircle, XCircle, Info, Eye, EyeOff,
  ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Upload, Download,
  Copy, Clipboard, Share, ExternalLink, RefreshCw, RotateCcw,
  Play, Pause, Square, Volume2, VolumeX, Maximize, Minimize,
  Bell, Mail, Phone, MessageSquare, Send, Star, Heart,
  Key, Lock, Unlock, Shield, ShieldCheck, UserCheck,
  FileText, File, Folder, FolderOpen, Archive, Package,
  Grid3X3, List, Table, BarChart, PieChart, TrendingUp,
  MapPin, Navigation, Compass, Globe, Wifi, Bluetooth
} from 'lucide-vue-next'

/**
 * Composable para gerenciamento unificado de ícones
 * Centraliza o acesso aos ícones Lucide e substitui gradualmente FontAwesome
 */
export function useIcons() {
  // Ícones da interface do sistema (ações comuns)
  const interfaceIcons = {
    // === AÇÕES BÁSICAS ===
    add: Plus,
    plus: Plus,
    create: Plus,
    remove: Minus,
    minus: Minus,
    edit: Edit,
    delete: Trash2,
    trash: Trash2,
    save: Save,
    cancel: X,
    close: X,
    confirm: Check,
    check: Check,
    
    // === NAVEGAÇÃO ===
    back: ChevronLeft,
    forward: ChevronRight,
    previous: ChevronLeft,
    next: ChevronRight,
    up: ArrowUp,
    down: ArrowDown,
    left: ArrowLeft,
    right: ArrowRight,
    
    // === PESQUISA E FILTROS ===
    search: Search,
    filter: Filter,
    settings: Settings,
    config: Settings,
    
    // === USUÁRIOS ===
    user: User,
    users: Users,
    profile: User,
    account: User,
    'user-plus': Users,
    'user-check': UserCheck,
    
    // === AUTENTICAÇÃO ===
    login: Key,
    logout: Lock,
    password: Key,
    security: Shield,
    verified: ShieldCheck,
    unlock: Unlock,
    
    // === LOCALIZAÇÃO ===
    home: Home,
    location: MapPin,
    map: MapPin,
    navigate: Navigation,
    compass: Compass,
    
    // === TEMPO ===
    calendar: Calendar,
    clock: Clock,
    time: Clock,
    schedule: Calendar,
    
    // === STATUS E ALERTAS ===
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
    alert: AlertTriangle,
    
    // === VISUALIZAÇÃO ===
    view: Eye,
    hide: EyeOff,
    show: Eye,
    visible: Eye,
    invisible: EyeOff,
    
    // === AÇÕES DE ARQUIVO ===
    upload: Upload,
    download: Download,
    copy: Copy,
    paste: Clipboard,
    share: Share,
    link: ExternalLink,
    
    // === CONTROLES ===
    refresh: RefreshCw,
    reload: RotateCcw,
    reset: RotateCcw,
    play: Play,
    pause: Pause,
    stop: Square,
    
    // === ÁUDIO/VÍDEO ===
    volume: Volume2,
    mute: VolumeX,
    fullscreen: Maximize,
    minimize: Minimize,
    
    // === COMUNICAÇÃO ===
    notification: Bell,
    mail: Mail,
    email: Mail,
    phone: Phone,
    message: MessageSquare,
    send: Send,
    
    // === FAVORITOS ===
    star: Star,
    favorite: Star,
    like: Heart,
    love: Heart,
    
    // === ARQUIVOS ===
    file: File,
    document: FileText,
    folder: Folder,
    'folder-open': FolderOpen,
    archive: Archive,
    package: Package,
    
    // === LAYOUTS ===
    grid: Grid3X3,
    list: List,
    table: Table,
    
    // === GRÁFICOS ===
    chart: BarChart,
    pie: PieChart,
    trend: TrendingUp,
    analytics: BarChart,
    
    // === CONECTIVIDADE ===
    wifi: Wifi,
    bluetooth: Bluetooth,
    network: Globe,
    internet: Globe
  }

  // Mapeamento FontAwesome -> Lucide para migração gradual
  const fontAwesomeToLucide = {
    // Ações básicas
    'fas fa-plus': Plus,
    'fas fa-user-plus': Users,
    'fas fa-edit': Edit,
    'fas fa-key': Key,
    'fas fa-ban': XCircle,
    'fas fa-times': X,
    'fas fa-save': Save,
    'fas fa-trash': Trash2,
    'fas fa-arrow-left': ArrowLeft,
    'fas fa-check-circle': CheckCircle,
    'fas fa-exclamation-circle': AlertTriangle,
    'fas fa-sign-out-alt': Lock,
    'fas fa-folder': Folder,
    'fas fa-eye': Eye
  }

  /**
   * Obtém um ícone da galeria do sistema por nome
   */
  const getIconFromGallery = (iconName) => {
    if (!iconName) return null
    return systemIcons.find(icon => icon.name === iconName)
  }

  /**
   * Obtém um ícone da interface por nome
   */
  const getInterfaceIcon = (iconName) => {
    if (!iconName) return null
    return interfaceIcons[iconName] || null
  }

  /**
   * Converte ícone FontAwesome para Lucide equivalente
   */
  const convertFontAwesome = (fontAwesomeClass) => {
    if (!fontAwesomeClass) return null
    return fontAwesomeToLucide[fontAwesomeClass] || null
  }

  /**
   * Obtém qualquer ícone (galeria, interface ou conversão FA)
   * Ordem de prioridade: galeria > interface > FontAwesome
   */
  const getIcon = (iconName) => {
    if (!iconName) return null
    
    // 1. Tentar galeria do sistema
    const galleryIcon = getIconFromGallery(iconName)
    if (galleryIcon) return galleryIcon.component
    
    // 2. Tentar ícones de interface
    const interfaceIcon = getInterfaceIcon(iconName)
    if (interfaceIcon) return interfaceIcon
    
    // 3. Tentar conversão FontAwesome
    const convertedIcon = convertFontAwesome(iconName)
    if (convertedIcon) return convertedIcon
    
    return null
  }

  /**
   * Verifica se um ícone é da galeria Lucide
   */
  const isLucideIcon = (iconName) => {
    return !!getIconFromGallery(iconName) || !!getInterfaceIcon(iconName)
  }

  /**
   * Verifica se um ícone é FontAwesome
   */
  const isFontAwesome = (iconName) => {
    return iconName && (iconName.startsWith('fas ') || iconName.startsWith('far ') || iconName.startsWith('fab '))
  }

  /**
   * Obtém sugestão de migração FontAwesome -> Lucide
   */
  const getMigrationSuggestion = (fontAwesomeClass) => {
    const lucideIcon = convertFontAwesome(fontAwesomeClass)
    if (lucideIcon) {
      // Encontrar o nome no mapeamento de interface
      const iconName = Object.keys(interfaceIcons).find(key => interfaceIcons[key] === lucideIcon)
      return {
        lucideComponent: lucideIcon,
        lucideName: iconName,
        suggestion: `Substitua "${fontAwesomeClass}" por useIcons().getIcon('${iconName}')`
      }
    }
    return null
  }

  /**
   * Lista todos os ícones FontAwesome encontrados no projeto
   */
  const auditFontAwesome = ref([])

  /**
   * Estatísticas de uso de ícones
   */
  const getIconStats = () => {
    return {
      galleryIcons: systemIcons.length,
      interfaceIcons: Object.keys(interfaceIcons).length,
      fontAwesomeMapping: Object.keys(fontAwesomeToLucide).length,
      categories: iconCategories.length
    }
  }

  return {
    // Dados
    systemIcons,
    iconCategories,
    interfaceIcons,
    fontAwesomeToLucide,
    auditFontAwesome,

    // Métodos principais
    getIcon,
    getIconFromGallery,
    getInterfaceIcon,
    convertFontAwesome,

    // Utilitários
    isLucideIcon,
    isFontAwesome,
    getMigrationSuggestion,
    getIconStats,

    // Re-exportar métodos da galeria
    getIconsByCategory,
    searchIcons,
    getIconByName
  }
}