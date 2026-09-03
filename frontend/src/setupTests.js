import '@testing-library/jest-dom';
import React from 'react';

// Mock react-quill-new component for React Testing Library JSDOM compatibility
jest.mock('react-quill-new', () => {
  return function DummyReactQuill({ value, onChange, placeholder }) {
    return (
      <textarea
        data-testid="react-quill-editor"
        value={value || ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  };
});

// Polyfill matchMedia for JSDOM
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
