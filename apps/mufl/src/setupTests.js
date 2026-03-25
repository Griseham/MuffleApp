// Minimal DOM matcher to avoid external dependency on @testing-library/jest-dom
expect.extend({
  toBeInTheDocument(received) {
    const pass = received !== null && received !== undefined;
    return {
      pass,
      message: () =>
        pass
          ? 'Expected element not to be in the document'
          : 'Expected element to be in the document'
    };
  }
});
