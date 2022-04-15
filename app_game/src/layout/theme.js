import { grommet } from "grommet";
import { deepMerge } from "grommet/utils";

export const theme = deepMerge(grommet, {
  global: {
    breakpoints: {
      small: {
        value: 870,
      },
      medium: {
        value: 1100,
      },
      large: {
        value: 1270,
      },
    },
    colors: {
      c1: { dark: '#15191a', light: '#fff5f7' },
      c2: { dark: '#d96275', light: '#4b97a6' },
      c3: { dark: '#e6b8c1', light: '#456b73' },
      c4: { dark: '', light: '' },
      text: { dark: '#fff5f7', light: '#15191a' },
      control: 'c3'

    },
    focus: {
      outline: {
        size: '2px',
        color: 'c3',
      },
      shadow: {
        size: '0',
      },
    },
  },
  anchor: {
    color: 'c3',
    hover: {
      textDecoration: 'none',
    },
  },
  button: {
    border: {
      color: 'c2',
      radius: '8px',
    },
    default: {
      color: 'c1',
      background: {
        color: 'c2'
      },
    },
    hover: {
      background: {
        color: 'c3'
      }
    },
    size: {
      small: {
        border: {
          radius: '8px'
        }
      }
    }
  },
  radioButton: {
    border: {
      color: 'text',
      width: '1px',
    },
  },
  notification: {
    container: {
      background: {
        color: 'c3'
      },
      border: {
        size: '1px',
        style: 'dashed',
        color: 'c2'
      },
    },
  },
});