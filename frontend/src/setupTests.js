import '@testing-library/jest-dom';
const { TextEncoder, TextDecoder } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock react-quill-new for jsdom compatibility
jest.mock('react-quill-new', () => {
  const React = require('react');
  return React.forwardRef(({ value, onChange, placeholder, className }, ref) => {
    React.useImperativeHandle(ref, () => ({
      getEditor: () => ({
        root: { innerHTML: value || '' },
        clipboard: {
          dangerouslyPasteHTML: (html) => {
            if (onChange) onChange(html);
          },
        },
        hasFocus: () => false,
      }),
    }));

    return React.createElement('textarea', {
      'data-testid': 'rich-text-editor',
      className,
      value: value || '',
      placeholder,
      onChange: (e) => onChange && onChange(e.target.value),
    });
  });
});

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: jest.fn(),
  writable: true,
});

// Setup clean localStorage mock
const localStorageMock = (function () {
  let store = {};
  return {
    getItem(key) {
      return store[key] || null;
    },
    setItem(key, value) {
      store[key] = String(value);
    },
    removeItem(key) {
      delete store[key];
    },
    clear() {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

beforeEach(() => {
  window.localStorage.clear();
  jest.clearAllMocks();
});
