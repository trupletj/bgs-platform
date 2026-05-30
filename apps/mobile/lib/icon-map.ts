import {
  Clock,
  CalendarOff,
  Wallet,
  Gift,
  CalendarDays,
  FileText,
  FileSignature,
  GraduationCap,
  Receipt,
  ListChecks,
  HelpCircle,
  Settings,
  Phone,
} from "lucide-react-native";

type IconComponent = React.ComponentType<{ size: number; color: string }>;

const iconMap: Record<string, IconComponent> = {
  clock: Clock,
  "calendar-off": CalendarOff,
  wallet: Wallet,
  gift: Gift,
  "calendar-days": CalendarDays,
  "file-text": FileText,
  "file-signature": FileSignature,
  "graduation-cap": GraduationCap,
  receipt: Receipt,
  "list-checks": ListChecks,
  "help-circle": HelpCircle,
  settings: Settings,
  phone: Phone,
};

export function getServiceIcon(name: string): IconComponent {
  return iconMap[name] || FileText;
}
