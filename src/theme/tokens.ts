// Values taken from the Figma specs for Sign Up and Login.
export const colors = {
  background: '#FAF8FF',
  surface: '#FFFFFF',
  primary: '#2563EB', // buttons, links
  brand: '#004AC6', // logo, strength meter, met rules
  text: '#191B23',
  textMuted: '#505F76', // subtitles, strength label
  textSubtle: '#434655', // footer text
  placeholder: '#6B7280',
  icon: '#737686',
  iconMuted: '#C3C6D7',
  border: '#C3C6D7',
  fieldFilled: '#F1F5F9',
  divider: '#F1F5F9',
  error: '#D93025',
  meterOff: '#E1E2ED',
  white: '#FFFFFF',
};

export const radius = {
  field: 12,
  card: 16,
  pill: 9999,
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  field: {
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
};