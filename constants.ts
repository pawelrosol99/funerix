import { Theme } from './types';

export const PREDEFINED_FONTS = [
  { name: 'Space Grotesk', value: "'Space Grotesk', sans-serif" },
  { name: 'Inter', value: "'Inter', sans-serif" },
  { name: 'Montserrat', value: "'Montserrat', sans-serif" },
  { name: 'Syne', value: "'Syne', sans-serif" },
  { name: 'Outfit', value: "'Outfit', sans-serif" },
  { name: 'Roboto', value: "'Roboto', sans-serif" },
  { name: 'Open Sans', value: "'Open Sans', sans-serif" },
  { name: 'Nunito Sans', value: "'Nunito Sans', sans-serif" },
  { name: 'Merriweather', value: "'Merriweather', serif" },
  { name: 'JetBrains Mono', value: "'JetBrains Mono', monospace" },
];

export const URNEO_THEME_CSS: Theme = {
  id: 'urneo-2035',
  name: 'Urneo 2035',
  cssVars: {
    light: {
      '--background': '#F5F4ED', // Morning Snow
      '--foreground': '#493C31', // Demitasse
      '--card': '#FFFFFF',
      '--card-foreground': '#493C31',
      '--popover': '#FFFFFF',
      '--popover-foreground': '#493C31',
      '--primary': '#32FFDC', // Aurichalcite
      '--primary-foreground': '#232B32',
      '--secondary': '#E5E0D5', // Hourglass
      '--secondary-foreground': '#493C31',
      '--muted': '#EBE8E0',
      '--muted-foreground': '#84705B',
      '--accent': '#32FFDC',
      '--accent-foreground': '#232B32',
      '--destructive': '#FF6B6B',
      '--destructive-foreground': '#FFFFFF',
      '--border': '#E5E0D5',
      '--input': '#FFFFFF',
      '--ring': '#32FFDC',
      '--chart-1': '#32FFDC',
      '--chart-2': '#FDD792',
      '--chart-3': '#AFB885',
      '--chart-4': '#A581D4',
      '--chart-5': '#84705B',
      '--sidebar': '#F5F4ED',
      '--sidebar-foreground': '#493C31',
      '--sidebar-primary': '#32FFDC',
      '--sidebar-primary-foreground': '#232B32',
      '--sidebar-accent': '#FFFFFF',
      '--sidebar-accent-foreground': '#32FFDC',
      '--sidebar-border': '#E5E0D5',
      '--sidebar-ring': '#32FFDC',
      '--font-sans': "'Space Grotesk', sans-serif",
      '--font-body': "'Inter', sans-serif",
      '--radius': '1.75rem',
      '--shadow': '0 10px 40px -10px rgba(73, 60, 49, 0.08)',
      '--shadow-sm': '0 4px 12px -4px rgba(73, 60, 49, 0.05)',
    },
    dark: {
      '--background': '#232B32',
      '--foreground': '#F5F4ED',
      '--card': '#2D363F',
      '--card-foreground': '#F5F4ED',
      '--popover': '#2D363F',
      '--popover-foreground': '#F5F4ED',
      '--primary': '#32FFDC',
      '--primary-foreground': '#232B32',
      '--secondary': '#3B5B4E',
      '--secondary-foreground': '#FFFFFF',
      '--muted': '#2D363F',
      '--muted-foreground': '#A0A0A0',
      '--accent': '#32FFDC',
      '--accent-foreground': '#232B32',
      '--destructive': '#FF6B6B',
      '--destructive-foreground': '#FFFFFF',
      '--border': '#3B5B4E',
      '--input': '#2D363F',
      '--ring': '#32FFDC',
      '--chart-1': '#32FFDC',
      '--chart-2': '#FDD792',
      '--chart-3': '#AFB885',
      '--chart-4': '#A581D4',
      '--chart-5': '#84705B',
      '--sidebar': '#232B32',
      '--sidebar-foreground': '#F5F4ED',
      '--sidebar-primary': '#32FFDC',
      '--sidebar-primary-foreground': '#232B32',
      '--sidebar-accent': '#2D363F',
      '--sidebar-accent-foreground': '#32FFDC',
      '--sidebar-border': '#3B5B4E',
      '--sidebar-ring': '#32FFDC',
      '--font-sans': "'Space Grotesk', sans-serif",
      '--font-body': "'Inter', sans-serif",
      '--radius': '1.75rem',
      '--shadow': '0 10px 40px -10px rgba(0, 0, 0, 0.5)',
      '--shadow-sm': '0 4px 12px -4px rgba(0, 0, 0, 0.3)',
    }
  }
};

export const URNEO_2045_THEME: Theme = {
  id: 'urneo-2045',
  name: 'Urneo 2045',
  cssVars: {
    light: {
      '--background': '#EFF4F2', // Soft Mint/Grey background like the image
      '--foreground': '#111827', // Dark text
      '--card': '#FFFFFF',
      '--card-foreground': '#111827',
      '--popover': '#FFFFFF',
      '--popover-foreground': '#111827',
      '--primary': '#8B5CF6', // Vibrant Purple/Violet (Click to install button)
      '--primary-foreground': '#FFFFFF',
      '--secondary': '#F3F4F6', // Light gray for tags/buttons
      '--secondary-foreground': '#1F2937',
      '--muted': '#F9FAFB',
      '--muted-foreground': '#6B7280', // Grey text
      '--accent': '#10B981', // Green accent (Progress bars/Tags)
      '--accent-foreground': '#FFFFFF',
      '--destructive': '#EF4444',
      '--destructive-foreground': '#FFFFFF',
      '--border': '#E5E7EB',
      '--input': '#FFFFFF',
      '--ring': '#8B5CF6',
      '--chart-1': '#8B5CF6', // Purple
      '--chart-2': '#F59E0B', // Orange/Yellow
      '--chart-3': '#10B981', // Green
      '--chart-4': '#EC4899', // Pink
      '--chart-5': '#6366F1', // Indigo
      '--sidebar': '#FFFFFF', // White sidebar like the cards
      '--sidebar-foreground': '#111827',
      '--sidebar-primary': '#8B5CF6',
      '--sidebar-primary-foreground': '#FFFFFF',
      '--sidebar-accent': '#F3F4F6',
      '--sidebar-accent-foreground': '#8B5CF6',
      '--sidebar-border': 'transparent', // Cleaner look
      '--sidebar-ring': '#8B5CF6',
      '--radius': '1.5rem', // Very rounded corners
      '--font-sans': "'Outfit', sans-serif", // Clean, geometric sans
      '--font-body': "'Inter', sans-serif",
      '--shadow': '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)', // Soft diffuse shadow
      '--shadow-sm': '0 2px 4px -1px rgba(0, 0, 0, 0.02)',
    },
    dark: {
      '--background': '#111827', // Deep blue/grey
      '--foreground': '#F9FAFB',
      '--card': '#1F2937',
      '--card-foreground': '#F9FAFB',
      '--popover': '#1F2937',
      '--popover-foreground': '#F9FAFB',
      '--primary': '#A78BFA', // Lighter purple for dark mode
      '--primary-foreground': '#FFFFFF',
      '--secondary': '#374151',
      '--secondary-foreground': '#F9FAFB',
      '--muted': '#374151',
      '--muted-foreground': '#9CA3AF',
      '--accent': '#34D399',
      '--accent-foreground': '#064E3B',
      '--destructive': '#EF4444',
      '--destructive-foreground': '#FFFFFF',
      '--border': '#374151',
      '--input': '#1F2937',
      '--ring': '#A78BFA',
      '--chart-1': '#A78BFA',
      '--chart-2': '#FBBF24',
      '--chart-3': '#34D399',
      '--chart-4': '#F472B6',
      '--chart-5': '#818CF8',
      '--sidebar': '#111827',
      '--sidebar-foreground': '#F9FAFB',
      '--sidebar-primary': '#A78BFA',
      '--sidebar-primary-foreground': '#FFFFFF',
      '--sidebar-accent': '#1F2937',
      '--sidebar-accent-foreground': '#A78BFA',
      '--sidebar-border': '#374151',
      '--sidebar-ring': '#A78BFA',
      '--radius': '1.5rem',
      '--font-sans': "'Outfit', sans-serif",
      '--font-body': "'Inter', sans-serif",
      '--shadow': '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
      '--shadow-sm': '0 2px 4px -1px rgba(0, 0, 0, 0.3)',
    }
  }
};

export const URNEO_2055_THEME: Theme = {
  id: 'urneo-2055',
  name: 'Urneo 2055 (Fintask)',
  cssVars: {
    light: {
      '--background': '#E9EFEC', // The specific soft sage/mint-grey background from the reference
      '--foreground': '#111827', // Almost black text for sharp contrast
      '--card': '#FFFFFF', // Pure white cards
      '--card-foreground': '#111827',
      '--popover': '#FFFFFF',
      '--popover-foreground': '#111827',
      '--primary': '#8B5CF6', // Vibrant Purple/Violet (Click to install button)
      '--primary-foreground': '#FFFFFF',
      '--secondary': '#F3F4F6', // Light gray surfaces for tags
      '--secondary-foreground': '#1F2937',
      '--muted': '#F9FAFB',
      '--muted-foreground': '#9CA3AF', // Lighter grey for timestamps/secondary text
      '--accent': '#10B981', // Green accents (Progress bars, online status)
      '--accent-foreground': '#FFFFFF',
      '--destructive': '#EF4444',
      '--destructive-foreground': '#FFFFFF',
      '--border': '#E5E7EB', // Very subtle borders
      '--input': '#F9FAFB',
      '--ring': '#8B5CF6',
      '--chart-1': '#8B5CF6', // Purple
      '--chart-2': '#F59E0B', // Orange/Yellow
      '--chart-3': '#10B981', // Green
      '--chart-4': '#EC4899', // Pink
      '--chart-5': '#6366F1', // Indigo
      '--sidebar': '#E9EFEC', // Match background for floating card effect
      '--sidebar-foreground': '#111827',
      '--sidebar-primary': '#8B5CF6',
      '--sidebar-primary-foreground': '#FFFFFF',
      '--sidebar-accent': '#FFFFFF',
      '--sidebar-accent-foreground': '#8B5CF6',
      '--sidebar-border': 'transparent',
      '--sidebar-ring': '#8B5CF6',
      '--radius': '1.5rem', // High radius for that bubble/card look
      '--font-sans': "'Inter', sans-serif", // Clean standard font
      '--font-body': "'Inter', sans-serif",
      '--shadow': '0 4px 20px -2px rgba(0, 0, 0, 0.05)', // Very soft, diffuse shadow
      '--shadow-sm': '0 2px 4px -2px rgba(0, 0, 0, 0.05)',
    },
    dark: {
      '--background': '#1C1C1E', // Deep dark gray
      '--foreground': '#F3F4F6',
      '--card': '#2C2C2E', // Slightly lighter cards
      '--card-foreground': '#F3F4F6',
      '--popover': '#2C2C2E',
      '--popover-foreground': '#F3F4F6',
      '--primary': '#A78BFA', // Lighter purple
      '--primary-foreground': '#FFFFFF',
      '--secondary': '#3A3A3C',
      '--secondary-foreground': '#E5E7EB',
      '--muted': '#3A3A3C',
      '--muted-foreground': '#9CA3AF',
      '--accent': '#34D399',
      '--accent-foreground': '#064E3B',
      '--destructive': '#EF4444',
      '--destructive-foreground': '#FFFFFF',
      '--border': '#3A3A3C',
      '--input': '#1C1C1E',
      '--ring': '#A78BFA',
      '--chart-1': '#A78BFA',
      '--chart-2': '#FBBF24',
      '--chart-3': '#34D399',
      '--chart-4': '#F472B6',
      '--chart-5': '#818CF8',
      '--sidebar': '#1C1C1E',
      '--sidebar-foreground': '#F3F4F6',
      '--sidebar-primary': '#A78BFA',
      '--sidebar-primary-foreground': '#FFFFFF',
      '--sidebar-accent': '#2C2C2E',
      '--sidebar-accent-foreground': '#A78BFA',
      '--sidebar-border': 'transparent',
      '--sidebar-ring': '#A78BFA',
      '--radius': '1.5rem',
      '--font-sans': "'Inter', sans-serif",
      '--font-body': "'Inter', sans-serif",
      '--shadow': '0 10px 40px -10px rgba(0, 0, 0, 0.5)',
      '--shadow-sm': '0 4px 12px -4px rgba(0, 0, 0, 0.3)',
    }
  }
};

export const OBSIDIAN_ROSE_THEME: Theme = {
  id: 'obsidian-rose',
  name: 'Obsidian Rose',
  cssVars: {
    light: {
      '--background': '#FFF0F5', // Lavender Blush
      '--foreground': '#2D0A1E', // Dark Purple
      '--card': '#FFFFFF',
      '--card-foreground': '#2D0A1E',
      '--popover': '#FFFFFF',
      '--popover-foreground': '#2D0A1E',
      '--primary': '#D946EF', // Fuchsia
      '--primary-foreground': '#FFFFFF',
      '--secondary': '#FCE7F3',
      '--secondary-foreground': '#831843',
      '--muted': '#FAE8FF',
      '--muted-foreground': '#A21CAF',
      '--accent': '#D946EF',
      '--accent-foreground': '#FFFFFF',
      '--destructive': '#EF4444',
      '--destructive-foreground': '#FFFFFF',
      '--border': '#FBCFE8',
      '--input': '#FFFFFF',
      '--ring': '#D946EF',
      '--chart-1': '#D946EF',
      '--chart-2': '#EC4899',
      '--chart-3': '#8B5CF6',
      '--chart-4': '#6366F1',
      '--chart-5': '#F43F5E',
      '--sidebar': '#FFF0F5',
      '--sidebar-foreground': '#2D0A1E',
      '--sidebar-primary': '#D946EF',
      '--sidebar-primary-foreground': '#FFFFFF',
      '--sidebar-accent': '#FFFFFF',
      '--sidebar-accent-foreground': '#D946EF',
      '--sidebar-border': '#FBCFE8',
      '--sidebar-ring': '#D946EF',
      '--radius': '1rem',
      '--font-sans': "'Outfit', sans-serif",
      '--font-body': "'Inter', sans-serif",
      '--shadow': '0 10px 30px -10px rgba(217, 70, 239, 0.15)',
      '--shadow-sm': '0 4px 6px -1px rgba(217, 70, 239, 0.1)',
    },
    dark: {
      '--background': '#0F050A', // Deep Obsidian
      '--foreground': '#FCE7F3',
      '--card': '#1A0B14',
      '--card-foreground': '#FCE7F3',
      '--popover': '#1A0B14',
      '--popover-foreground': '#FCE7F3',
      '--primary': '#D946EF', // Neon Pink
      '--primary-foreground': '#FFFFFF',
      '--secondary': '#381028',
      '--secondary-foreground': '#FCE7F3',
      '--muted': '#2D0A1E',
      '--muted-foreground': '#9CA3AF',
      '--accent': '#EC4899',
      '--accent-foreground': '#FFFFFF',
      '--destructive': '#7F1D1D',
      '--destructive-foreground': '#FCE7F3',
      '--border': '#381028',
      '--input': '#2D0A1E',
      '--ring': '#D946EF',
      '--chart-1': '#D946EF',
      '--chart-2': '#EC4899',
      '--chart-3': '#A855F7',
      '--chart-4': '#6366F1',
      '--chart-5': '#FB7185',
      '--sidebar': '#0F050A',
      '--sidebar-foreground': '#FCE7F3',
      '--sidebar-primary': '#D946EF',
      '--sidebar-primary-foreground': '#FFFFFF',
      '--sidebar-accent': '#1A0B14',
      '--sidebar-accent-foreground': '#D946EF',
      '--sidebar-border': '#381028',
      '--sidebar-ring': '#D946EF',
      '--radius': '1rem',
      '--font-sans': "'Outfit', sans-serif",
      '--font-body': "'Inter', sans-serif",
      '--shadow': '0 10px 30px -10px rgba(0, 0, 0, 0.7)',
      '--shadow-sm': '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
    }
  }
};

export const ARCTIC_AURORA_THEME: Theme = {
  id: 'arctic-aurora',
  name: 'Arctic Aurora',
  cssVars: {
    light: {
      '--background': '#F0F9FF', // Alice Blue / Very Light Blue
      '--foreground': '#0F172A', // Slate 900
      '--card': '#FFFFFF',
      '--card-foreground': '#0F172A',
      '--popover': '#FFFFFF',
      '--popover-foreground': '#0F172A',
      '--primary': '#0EA5E9', // Sky 500
      '--primary-foreground': '#FFFFFF',
      '--secondary': '#E0F2FE', // Sky 100
      '--secondary-foreground': '#0369A1',
      '--muted': '#F1F5F9',
      '--muted-foreground': '#64748B',
      '--accent': '#38BDF8', // Sky 400
      '--accent-foreground': '#FFFFFF',
      '--destructive': '#EF4444',
      '--destructive-foreground': '#FFFFFF',
      '--border': '#BAE6FD', // Sky 200
      '--input': '#FFFFFF',
      '--ring': '#0EA5E9',
      '--chart-1': '#0EA5E9',
      '--chart-2': '#2DD4BF', // Teal
      '--chart-3': '#38BDF8',
      '--chart-4': '#818CF8', // Indigo
      '--chart-5': '#64748B',
      '--sidebar': '#F0F9FF',
      '--sidebar-foreground': '#0F172A',
      '--sidebar-primary': '#0EA5E9',
      '--sidebar-primary-foreground': '#FFFFFF',
      '--sidebar-accent': '#FFFFFF',
      '--sidebar-accent-foreground': '#0EA5E9',
      '--sidebar-border': '#BAE6FD',
      '--sidebar-ring': '#0EA5E9',
      '--radius': '0.5rem',
      '--font-sans': "'Inter', sans-serif",
      '--font-body': "'Inter', sans-serif",
      '--shadow': '0 4px 6px -1px rgba(14, 165, 233, 0.1), 0 2px 4px -1px rgba(14, 165, 233, 0.06)',
      '--shadow-sm': '0 1px 2px 0 rgba(14, 165, 233, 0.05)',
    },
    dark: {
      '--background': '#0B1120', // Deep Blue Black
      '--foreground': '#F0F9FF',
      '--card': '#151F32', // Dark Blue Grey
      '--card-foreground': '#F0F9FF',
      '--popover': '#151F32',
      '--popover-foreground': '#F0F9FF',
      '--primary': '#38BDF8', // Sky 400
      '--primary-foreground': '#0F172A',
      '--secondary': '#1E293B',
      '--secondary-foreground': '#E0F2FE',
      '--muted': '#1E293B',
      '--muted-foreground': '#94A3B8',
      '--accent': '#0284C7',
      '--accent-foreground': '#FFFFFF',
      '--destructive': '#7F1D1D',
      '--destructive-foreground': '#F0F9FF',
      '--border': '#1E293B',
      '--input': '#151F32',
      '--ring': '#38BDF8',
      '--chart-1': '#38BDF8',
      '--chart-2': '#2DD4BF',
      '--chart-3': '#0EA5E9',
      '--chart-4': '#6366F1',
      '--chart-5': '#94A3B8',
      '--sidebar': '#0B1120',
      '--sidebar-foreground': '#F0F9FF',
      '--sidebar-primary': '#38BDF8',
      '--sidebar-primary-foreground': '#0F172A',
      '--sidebar-accent': '#151F32',
      '--sidebar-accent-foreground': '#38BDF8',
      '--sidebar-border': '#1E293B',
      '--sidebar-ring': '#38BDF8',
      '--radius': '0.5rem',
      '--font-sans': "'Inter', sans-serif",
      '--font-body': "'Inter', sans-serif",
      '--shadow': '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
      '--shadow-sm': '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
    }
  }
};

export const GOLDEN_HOUR_THEME: Theme = {
  id: 'golden-hour',
  name: 'Golden Hour',
  cssVars: {
    light: {
      '--background': '#F9F5F0', // Warm Alabaster
      '--foreground': '#2C2420', // Warm Charcoal
      '--card': '#FFFFFF',
      '--card-foreground': '#2C2420',
      '--popover': '#FFFFFF',
      '--popover-foreground': '#2C2420',
      '--primary': '#D97706', // Amber 600
      '--primary-foreground': '#FFFFFF',
      '--secondary': '#FDE68A', // Amber 200
      '--secondary-foreground': '#451A03',
      '--muted': '#F3E8DD',
      '--muted-foreground': '#78716C',
      '--accent': '#F59E0B', // Amber 500
      '--accent-foreground': '#FFFFFF',
      '--destructive': '#EF4444',
      '--destructive-foreground': '#FFFFFF',
      '--border': '#E7D5C9',
      '--input': '#FFFFFF',
      '--ring': '#D97706',
      '--chart-1': '#D97706',
      '--chart-2': '#B45309',
      '--chart-3': '#F59E0B',
      '--chart-4': '#A8A29E',
      '--chart-5': '#78716C',
      '--sidebar': '#F9F5F0',
      '--sidebar-foreground': '#2C2420',
      '--sidebar-primary': '#D97706',
      '--sidebar-primary-foreground': '#FFFFFF',
      '--sidebar-accent': '#FFFFFF',
      '--sidebar-accent-foreground': '#D97706',
      '--sidebar-border': '#E7D5C9',
      '--sidebar-ring': '#D97706',
      '--radius': '0.75rem',
      '--font-sans': "'Montserrat', sans-serif",
      '--font-body': "'Nunito Sans', sans-serif",
      '--shadow': '0 4px 20px -2px rgba(217, 119, 6, 0.1)',
      '--shadow-sm': '0 2px 8px -2px rgba(217, 119, 6, 0.05)',
    },
    dark: {
      '--background': '#1C1917', // Stone 900
      '--foreground': '#F9F5F0',
      '--card': '#292524', // Stone 800
      '--card-foreground': '#F9F5F0',
      '--popover': '#292524',
      '--popover-foreground': '#F9F5F0',
      '--primary': '#F59E0B', // Amber 500
      '--primary-foreground': '#1C1917',
      '--secondary': '#44403C', // Stone 700
      '--secondary-foreground': '#FDE68A',
      '--muted': '#292524',
      '--muted-foreground': '#A8A29E',
      '--accent': '#D97706',
      '--accent-foreground': '#FFFFFF',
      '--destructive': '#7F1D1D',
      '--destructive-foreground': '#F9F5F0',
      '--border': '#44403C',
      '--input': '#292524',
      '--ring': '#F59E0B',
      '--chart-1': '#F59E0B',
      '--chart-2': '#D97706',
      '--chart-3': '#FCD34D',
      '--chart-4': '#78716C',
      '--chart-5': '#57534E',
      '--sidebar': '#1C1917',
      '--sidebar-foreground': '#F9F5F0',
      '--sidebar-primary': '#F59E0B',
      '--sidebar-primary-foreground': '#1C1917',
      '--sidebar-accent': '#292524',
      '--sidebar-accent-foreground': '#F59E0B',
      '--sidebar-border': '#44403C',
      '--sidebar-ring': '#F59E0B',
      '--radius': '0.75rem',
      '--font-sans': "'Montserrat', sans-serif",
      '--font-body': "'Nunito Sans', sans-serif",
      '--shadow': '0 10px 30px -10px rgba(0, 0, 0, 0.7)',
      '--shadow-sm': '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
    }
  }
};

export const NEO_MINT_THEME: Theme = {
  id: 'neo-mint',
  name: 'Neo Mint',
  cssVars: {
    light: {
      '--background': '#F8FAFC', // Slate 50
      '--foreground': '#334155', // Slate 700
      '--card': '#FFFFFF',
      '--card-foreground': '#334155',
      '--popover': '#FFFFFF',
      '--popover-foreground': '#334155',
      '--primary': '#10B981', // Emerald 500
      '--primary-foreground': '#FFFFFF',
      '--secondary': '#E2E8F0', // Slate 200
      '--secondary-foreground': '#0F172A',
      '--muted': '#F1F5F9',
      '--muted-foreground': '#94A3B8',
      '--accent': '#34D399', // Emerald 400
      '--accent-foreground': '#FFFFFF',
      '--destructive': '#EF4444',
      '--destructive-foreground': '#FFFFFF',
      '--border': '#CBD5E1', // Slate 300
      '--input': '#FFFFFF',
      '--ring': '#10B981',
      '--chart-1': '#10B981',
      '--chart-2': '#64748B',
      '--chart-3': '#34D399',
      '--chart-4': '#94A3B8',
      '--chart-5': '#0F172A',
      '--sidebar': '#F8FAFC',
      '--sidebar-foreground': '#334155',
      '--sidebar-primary': '#10B981',
      '--sidebar-primary-foreground': '#FFFFFF',
      '--sidebar-accent': '#FFFFFF',
      '--sidebar-accent-foreground': '#10B981',
      '--sidebar-border': '#CBD5E1',
      '--sidebar-ring': '#10B981',
      '--radius': '0.25rem', // Square / Technical
      '--font-sans': "'JetBrains Mono', monospace", // Technical Feel
      '--font-body': "'Inter', sans-serif",
      '--shadow': '0 4px 0 0 rgba(203, 213, 225, 0.5)', // Hard shadow
      '--shadow-sm': '0 2px 0 0 rgba(203, 213, 225, 0.5)',
    },
    dark: {
      '--background': '#0F172A', // Slate 900
      '--foreground': '#E2E8F0',
      '--card': '#1E293B', // Slate 800
      '--card-foreground': '#E2E8F0',
      '--popover': '#1E293B',
      '--popover-foreground': '#E2E8F0',
      '--primary': '#34D399', // Emerald 400
      '--primary-foreground': '#022C22',
      '--secondary': '#334155',
      '--secondary-foreground': '#FFFFFF',
      '--muted': '#1E293B',
      '--muted-foreground': '#94A3B8',
      '--accent': '#10B981',
      '--accent-foreground': '#FFFFFF',
      '--destructive': '#991B1B',
      '--destructive-foreground': '#E2E8F0',
      '--border': '#334155',
      '--input': '#1E293B',
      '--ring': '#34D399',
      '--chart-1': '#34D399',
      '--chart-2': '#94A3B8',
      '--chart-3': '#10B981',
      '--chart-4': '#CBD5E1',
      '--chart-5': '#022C22',
      '--sidebar': '#0F172A',
      '--sidebar-foreground': '#E2E8F0',
      '--sidebar-primary': '#34D399',
      '--sidebar-primary-foreground': '#022C22',
      '--sidebar-accent': '#1E293B',
      '--sidebar-accent-foreground': '#34D399',
      '--sidebar-border': '#334155',
      '--sidebar-ring': '#34D399',
      '--radius': '0.25rem',
      '--font-sans': "'JetBrains Mono', monospace",
      '--font-body': "'Inter', sans-serif",
      '--shadow': '0 4px 0 0 rgba(0, 0, 0, 0.5)',
      '--shadow-sm': '0 2px 0 0 rgba(0, 0, 0, 0.5)',
    }
  }
};

export const CYBER_SLATE_THEME: Theme = {
  id: 'cyber-slate',
  name: 'Cyber Slate',
  cssVars: {
    light: {
      '--background': '#E2E8F0',
      '--foreground': '#1E293B',
      '--card': '#F1F5F9',
      '--card-foreground': '#1E293B',
      '--popover': '#F1F5F9',
      '--popover-foreground': '#1E293B',
      '--primary': '#3B82F6', // Blue 500
      '--primary-foreground': '#FFFFFF',
      '--secondary': '#CBD5E1',
      '--secondary-foreground': '#0F172A',
      '--muted': '#E2E8F0',
      '--muted-foreground': '#64748B',
      '--accent': '#60A5FA', // Blue 400
      '--accent-foreground': '#FFFFFF',
      '--destructive': '#EF4444',
      '--destructive-foreground': '#FFFFFF',
      '--border': '#94A3B8',
      '--input': '#FFFFFF',
      '--ring': '#3B82F6',
      '--chart-1': '#3B82F6',
      '--chart-2': '#6366F1',
      '--chart-3': '#0EA5E9',
      '--chart-4': '#8B5CF6',
      '--chart-5': '#1E293B',
      '--sidebar': '#E2E8F0',
      '--sidebar-foreground': '#1E293B',
      '--sidebar-primary': '#3B82F6',
      '--sidebar-primary-foreground': '#FFFFFF',
      '--sidebar-accent': '#F1F5F9',
      '--sidebar-accent-foreground': '#3B82F6',
      '--sidebar-border': '#94A3B8',
      '--sidebar-ring': '#3B82F6',
      '--radius': '0.3rem',
      '--font-sans': "'Syne', sans-serif",
      '--font-body': "'Outfit', sans-serif",
      '--shadow': '0 0 15px rgba(59, 130, 246, 0.2)',
      '--shadow-sm': '0 0 5px rgba(59, 130, 246, 0.1)',
    },
    dark: {
      '--background': '#020617', // Slate 950
      '--foreground': '#E2E8F0',
      '--card': '#0F172A', // Slate 900
      '--card-foreground': '#E2E8F0',
      '--popover': '#0F172A',
      '--popover-foreground': '#E2E8F0',
      '--primary': '#3B82F6', // Blue 500
      '--primary-foreground': '#FFFFFF',
      '--secondary': '#1E293B',
      '--secondary-foreground': '#FFFFFF',
      '--muted': '#1E293B',
      '--muted-foreground': '#64748B',
      '--accent': '#2563EB', // Blue 600
      '--accent-foreground': '#FFFFFF',
      '--destructive': '#EF4444',
      '--destructive-foreground': '#FFFFFF',
      '--border': '#1E293B',
      '--input': '#020617',
      '--ring': '#3B82F6',
      '--chart-1': '#3B82F6',
      '--chart-2': '#6366F1',
      '--chart-3': '#0EA5E9',
      '--chart-4': '#8B5CF6',
      '--chart-5': '#1E293B',
      '--sidebar': '#020617',
      '--sidebar-foreground': '#E2E8F0',
      '--sidebar-primary': '#3B82F6',
      '--sidebar-primary-foreground': '#FFFFFF',
      '--sidebar-accent': '#0F172A',
      '--sidebar-accent-foreground': '#3B82F6',
      '--sidebar-border': '#1E293B',
      '--sidebar-ring': '#3B82F6',
      '--radius': '0.3rem',
      '--font-sans': "'Syne', sans-serif",
      '--font-body': "'Outfit', sans-serif",
      '--shadow': '0 0 20px rgba(59, 130, 246, 0.3)',
      '--shadow-sm': '0 0 10px rgba(59, 130, 246, 0.1)',
    }
  }
};

export const DEFAULT_THEME_CSS = URNEO_THEME_CSS;