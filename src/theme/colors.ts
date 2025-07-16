// Belfast Rides App - Professional Color Palette
export const colors = {
  // Primary Brand Colors
  primary: {
    50: '#E3F2FD',
    100: '#BBDEFB', 
    200: '#90CAF9',
    300: '#64B5F6',
    400: '#42A5F5',
    500: '#2196F3', // Main brand blue
    600: '#1E88E5',
    700: '#1976D2',
    800: '#1565C0',
    900: '#0D47A1',
  },

  // Success (for completed rides, online status)
  success: {
    50: '#E8F5E8',
    100: '#C8E6C9',
    200: '#A5D6A7',
    300: '#81C784',
    400: '#66BB6A',
    500: '#4CAF50',
    600: '#43A047',
    700: '#388E3C',
    800: '#2E7D32',
    900: '#1B5E20',
  },

  // Warning (for pending rides, reconnecting)
  warning: {
    50: '#FFF8E1',
    100: '#FFECB3',
    200: '#FFE082',
    300: '#FFD54F',
    400: '#FFCA28',
    500: '#FFC107',
    600: '#FFB300',
    700: '#FFA000',
    800: '#FF8F00',
    900: '#FF6F00',
  },

  // Error (for offline, cancelled rides)
  error: {
    50: '#FFEBEE',
    100: '#FFCDD2',
    200: '#EF9A9A',
    300: '#E57373',
    400: '#EF5350',
    500: '#F44336',
    600: '#E53935',
    700: '#D32F2F',
    800: '#C62828',
    900: '#B71C1C',
  },

  // Neutral Grays
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },

  // Pure colors
  white: '#FFFFFF',
  black: '#000000',

  // Functional colors
  background: '#F8FAFC',
  surface: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.5)',
  border: '#E2E8F0',
  divider: '#F1F5F9',

  // Text colors
  text: {
    primary: '#1A202C',
    secondary: '#4A5568',
    tertiary: '#718096',
    inverse: '#FFFFFF',
    disabled: '#A0AEC0',
  },

  // Status colors (semantic)
  status: {
    requested: '#FFC107', // Amber
    accepted: '#2196F3',  // Blue
    inProgress: '#4CAF50', // Green
    completed: '#4CAF50',  // Green
    cancelled: '#F44336',  // Red
    offline: '#9E9E9E',    // Gray
  }
};

export default colors;
