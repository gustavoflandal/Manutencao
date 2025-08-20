// Ícones do Lucide (Vue 3) - Corrigido com ícones existentes
import { 
  Wrench, Hammer, Drill, Settings, Cog, Briefcase,
  Monitor, Laptop, Smartphone, Tablet, Server, Printer, Camera,
  Truck, Car, Bus, Bike, Train, Plane,
  Factory, Cpu, HardDrive,
  Zap, Battery, BatteryCharging, Plug, Power, Cable,
  Droplets, Waves, Thermometer, Wind, Gauge,
  Shield, ShieldCheck, AlertTriangle, Lock, Key, Eye,
  Trash2, Recycle,
  Folder, FolderOpen, File, FileText, Archive, Package,
  Users, User, UserCheck, Building, Home, MapPin,
  Clock, Calendar, Timer, Watch, AlarmClock,
  Heart, Stethoscope, Pill, Plus, Bandage,
  Lightbulb, Fan, Refrigerator, Microwave,
  ShoppingCart, Barcode, Hash, CreditCard,
  Wifi, Bluetooth, Radio, Router, Smartphone as Phone,
  Star, Award, Trophy,
  Search, Filter, SlidersHorizontal, List, Grid3X3, Table,
  Upload, Download, Share, Copy, Scissors, Clipboard,
  Volume2, VolumeX, Play, Pause, Square, ChevronRight,
  Navigation, Compass
} from 'lucide-vue-next'

// Criar aliases para ícones que não existem
const Syringe = Plus
const QrCode = Hash  
const Receipt = FileText
const Medal = Star
const Crown = Star
const SkipForward = ChevronRight
const Location = MapPin
const Map = MapPin
const Route = MapPin
const Flag = MapPin
const Cross = Plus

// Ícones padrão do sistema de manutenção (corrigido)
export const systemIcons = [
  // === FERRAMENTAS E EQUIPAMENTOS ===
  { name: 'wrench', component: Wrench, category: 'ferramentas', description: 'Chave inglesa' },
  { name: 'hammer', component: Hammer, category: 'ferramentas', description: 'Martelo' },
  { name: 'drill', component: Drill, category: 'ferramentas', description: 'Furadeira' },
  { name: 'tool-case', component: Briefcase, category: 'ferramentas', description: 'Caixa de ferramentas' },
  { name: 'settings', component: Settings, category: 'ferramentas', description: 'Configurações' },
  { name: 'cog', component: Cog, category: 'ferramentas', description: 'Engrenagem' },

  // === COMPUTADORES E ELETRÔNICOS ===
  { name: 'monitor', component: Monitor, category: 'eletronicos', description: 'Monitor' },
  { name: 'laptop', component: Laptop, category: 'eletronicos', description: 'Notebook' },
  { name: 'smartphone', component: Smartphone, category: 'eletronicos', description: 'Smartphone' },
  { name: 'tablet', component: Tablet, category: 'eletronicos', description: 'Tablet' },
  { name: 'server', component: Server, category: 'eletronicos', description: 'Servidor' },
  { name: 'printer', component: Printer, category: 'eletronicos', description: 'Impressora' },
  { name: 'camera', component: Camera, category: 'eletronicos', description: 'Câmera' },

  // === VEÍCULOS E TRANSPORTE ===
  { name: 'truck', component: Truck, category: 'veiculos', description: 'Caminhão' },
  { name: 'car', component: Car, category: 'veiculos', description: 'Automóvel' },
  { name: 'bus', component: Bus, category: 'veiculos', description: 'Ônibus' },
  { name: 'bike', component: Bike, category: 'veiculos', description: 'Bicicleta' },
  { name: 'train', component: Train, category: 'veiculos', description: 'Trem' },
  { name: 'plane', component: Plane, category: 'veiculos', description: 'Avião' },

  // === MÁQUINAS INDUSTRIAIS ===
  { name: 'factory', component: Factory, category: 'industrial', description: 'Fábrica' },
  { name: 'gear', component: Cog, category: 'industrial', description: 'Engrenagem' },
  { name: 'cpu', component: Cpu, category: 'industrial', description: 'Processador' },
  { name: 'hard-drive', component: HardDrive, category: 'industrial', description: 'Disco rígido' },
  { name: 'memory-stick', component: HardDrive, category: 'industrial', description: 'Memória' },

  // === ELÉTRICA E ENERGIA ===
  { name: 'zap', component: Zap, category: 'eletrica', description: 'Energia elétrica' },
  { name: 'battery', component: Battery, category: 'eletrica', description: 'Bateria' },
  { name: 'battery-charging', component: BatteryCharging, category: 'eletrica', description: 'Bateria carregando' },
  { name: 'plug', component: Plug, category: 'eletrica', description: 'Tomada' },
  { name: 'power', component: Power, category: 'eletrica', description: 'Energia' },
  { name: 'cable', component: Cable, category: 'eletrica', description: 'Cabo' },

  // === HIDRÁULICA E CLIMATIZAÇÃO ===
    { name: 'droplets', component: Droplets, category: 'hidraulica', description: 'Água' },
  { name: 'shower-head', component: Droplets, category: 'hidraulica', description: 'Chuveiro' },
  { name: 'waves', component: Waves, category: 'hidraulica', description: 'Ondas' },
  { name: 'thermometer', component: Thermometer, category: 'hidraulica', description: 'Termômetro' },
  { name: 'wind', component: Wind, category: 'hidraulica', description: 'Ventilação' },
  { name: 'gauge', component: Gauge, category: 'hidraulica', description: 'Medidor' },

  // === SEGURANÇA ===
  { name: 'shield', component: Shield, category: 'seguranca', description: 'Proteção' },
  { name: 'shield-check', component: ShieldCheck, category: 'seguranca', description: 'Segurança verificada' },
  { name: 'alert-triangle', component: AlertTriangle, category: 'seguranca', description: 'Alerta' },
  { name: 'lock', component: Lock, category: 'seguranca', description: 'Cadeado' },
  { name: 'key', component: Key, category: 'seguranca', description: 'Chave' },
  { name: 'eye', component: Eye, category: 'seguranca', description: 'Vigilância' },

  // === LIMPEZA E MANUTENÇÃO ===
  { name: 'brush-cleaning', component: Trash2, category: 'limpeza', description: 'Limpeza com escova' },
  { name: 'trash', component: Trash2, category: 'limpeza', description: 'Lixeira' },
  { name: 'recycle', component: Recycle, category: 'limpeza', description: 'Reciclagem' },
  { name: 'washing-machine', component: Settings, category: 'limpeza', description: 'Máquina de lavar' },

  // === EQUIPAMENTOS MÉDICOS ===
  { name: 'heart', component: Heart, category: 'medico', description: 'Cardíaco' },
  { name: 'stethoscope', component: Stethoscope, category: 'medico', description: 'Estetoscópio' },
  { name: 'pill', component: Pill, category: 'medico', description: 'Medicamento' },
  { name: 'cross', component: Plus, category: 'medico', description: 'Cruz médica' },
  { name: 'bandage', component: Bandage, category: 'medico', description: 'Curativo' },
  { name: 'syringe', component: Syringe, category: 'medico', description: 'Seringa' },

  // === EQUIPAMENTOS DOMÉSTICOS ===
  { name: 'lightbulb', component: Lightbulb, category: 'domestico', description: 'Lâmpada' },
  { name: 'fan', component: Fan, category: 'domestico', description: 'Ventilador' },
  { name: 'air-vent', component: Fan, category: 'domestico', description: 'Ar condicionado' },
  { name: 'heater', component: Thermometer, category: 'domestico', description: 'Aquecedor' },
  { name: 'refrigerator', component: Refrigerator, category: 'domestico', description: 'Geladeira' },
  { name: 'microwave', component: Microwave, category: 'domestico', description: 'Microondas' },

  // === CONECTIVIDADE ===
  { name: 'wifi', component: Wifi, category: 'conectividade', description: 'Wi-Fi' },
  { name: 'bluetooth', component: Bluetooth, category: 'conectividade', description: 'Bluetooth' },
  { name: 'radio', component: Radio, category: 'conectividade', description: 'Rádio' },
  { name: 'antenna', component: Radio, category: 'conectividade', description: 'Antena' },
  { name: 'router', component: Router, category: 'conectividade', description: 'Roteador' },

  // === GERAL ===
  { name: 'folder', component: Folder, category: 'geral', description: 'Pasta' },
  { name: 'folder-open', component: FolderOpen, category: 'geral', description: 'Pasta aberta' },
  { name: 'file', component: File, category: 'geral', description: 'Arquivo' },
  { name: 'file-text', component: FileText, category: 'geral', description: 'Documento' },
  { name: 'package', component: Package, category: 'geral', description: 'Pacote' },
  { name: 'archive', component: Archive, category: 'geral', description: 'Arquivo compactado' },

  // === PESSOAS E ORGANIZAÇÃO ===
  { name: 'users', component: Users, category: 'organizacao', description: 'Usuários' },
  { name: 'user', component: User, category: 'organizacao', description: 'Usuário' },
  { name: 'user-check', component: UserCheck, category: 'organizacao', description: 'Usuário verificado' },
  { name: 'building', component: Building, category: 'organizacao', description: 'Prédio' },
  { name: 'home', component: Home, category: 'organizacao', description: 'Casa/Local' },
  { name: 'map-pin', component: MapPin, category: 'organizacao', description: 'Localização' },

  // === TEMPO E AGENDAMENTO ===
  { name: 'clock', component: Clock, category: 'tempo', description: 'Relógio' },
  { name: 'calendar', component: Calendar, category: 'tempo', description: 'Calendário' },
  { name: 'timer', component: Timer, category: 'tempo', description: 'Timer' },
  { name: 'watch', component: Watch, category: 'tempo', description: 'Relógio de pulso' },
  { name: 'stopwatch', component: Timer, category: 'tempo', description: 'Cronômetro' },
  { name: 'alarm-clock', component: AlarmClock, category: 'tempo', description: 'Despertador' },

  // === CONTROLES E INTERFACE ===
  { name: 'search', component: Search, category: 'interface', description: 'Buscar' },
  { name: 'filter', component: Filter, category: 'interface', description: 'Filtro' },
  { name: 'sliders', component: SlidersHorizontal, category: 'interface', description: 'Configurações' },
  { name: 'list', component: List, category: 'interface', description: 'Lista' },
  { name: 'grid', component: Grid3X3, category: 'interface', description: 'Grade' },
  { name: 'table', component: Table, category: 'interface', description: 'Tabela' }
];

// Categorias dos ícones (expandidas)
export const iconCategories = [
  { id: 'ferramentas', name: 'Ferramentas', color: '#e74c3c', description: 'Ferramentas manuais e equipamentos' },
  { id: 'eletronicos', name: 'Eletrônicos', color: '#3498db', description: 'Equipamentos eletrônicos e TI' },
  { id: 'veiculos', name: 'Veículos', color: '#f39c12', description: 'Veículos e transporte' },
  { id: 'industrial', name: 'Industrial', color: '#8e44ad', description: 'Máquinas e equipamentos industriais' },
  { id: 'eletrica', name: 'Elétrica', color: '#e67e22', description: 'Sistemas elétricos e energia' },
  { id: 'hidraulica', name: 'Hidráulica', color: '#16a085', description: 'Sistemas hidráulicos e climatização' },
  { id: 'seguranca', name: 'Segurança', color: '#27ae60', description: 'Equipamentos de segurança' },
  { id: 'limpeza', name: 'Limpeza', color: '#2c3e50', description: 'Equipamentos de limpeza' },
  { id: 'medico', name: 'Médico', color: '#c0392b', description: 'Equipamentos médicos e hospitalares' },
  { id: 'domestico', name: 'Doméstico', color: '#d35400', description: 'Eletrodomésticos e equipamentos residenciais' },
  { id: 'conectividade', name: 'Conectividade', color: '#9b59b6', description: 'Equipamentos de rede e comunicação' },
  { id: 'organizacao', name: 'Organização', color: '#34495e', description: 'Pessoas, locais e estrutura organizacional' },
  { id: 'tempo', name: 'Tempo', color: '#95a5a6', description: 'Equipamentos de medição de tempo e agendamento' },
  { id: 'interface', name: 'Interface', color: '#7f8c8d', description: 'Controles e elementos de interface' },
  { id: 'geral', name: 'Geral', color: '#7f8c8d', description: 'Ícones gerais e diversos' }
];

// Função para obter ícones por categoria
export const getIconsByCategory = (categoryId) => {
  return systemIcons.filter(icon => icon.category === categoryId);
};

// Função para buscar ícones
export const searchIcons = (searchTerm) => {
  return systemIcons.filter(icon => 
    icon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    icon.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
};

// Função para obter ícone por nome
export const getIconByName = (iconName) => {
  return systemIcons.find(icon => icon.name === iconName);
};

// Estatísticas dos ícones
export const getIconStats = () => {
  return {
    total: systemIcons.length,
    byCategory: iconCategories.map(category => ({
      category: category.name,
      count: getIconsByCategory(category.id).length
    }))
  };
};